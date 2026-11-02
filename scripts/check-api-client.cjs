const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, "../app/lib/api.ts"), "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;
function client(fetch) {
  const module = { exports: {} };
  const events = [];
  const toasts = [];
  vm.runInNewContext(code, { exports: module.exports, fetch, Headers, Response, Blob, Event, CustomEvent, DOMException, setTimeout: callback => setTimeout(callback, 0), clearTimeout, document: { cookie: "XSRF-TOKEN=abc%3Ddef" }, window: { dispatchEvent: event => {events.push(event.type);if(event.type==="svil-toast")toasts.push(event.detail);} } });
  return { api: module.exports, events, toasts };
}
test("writes include session cookies and decoded CSRF without adding JSON headers to files", async () => {
  let captured;
  const { api } = client(async (_url, options) => { captured = options; return Response.json({ data: { id: 1 } }); });
  await api.apiRequest("/materials", { method: "POST", body: new FormData() });
  assert.equal(captured.credentials, "include");
  assert.equal(captured.headers.get("X-XSRF-TOKEN"), "abc=def");
  assert.equal(captured.headers.has("Content-Type"), false);
});
test("expired sessions clear the account and do not silently retry writes", async () => {
  let count = 0;
  const { api, events } = client(async () => { count++; return Response.json({ message: "Unauthenticated" }, { status: 401 }); });
  await assert.rejects(api.apiRequest("/notes", { method: "PUT", body: "{}" }), error => error.status === 401);
  assert.equal(count, 1);
  assert.deepEqual(events, ["svil-session-expired"]);
});
test("validation errors preserve the field message and conflicts are not retried", async () => {
  const { api } = client(async () => Response.json({ errors: { title: ["Judul wajib diisi"] } }, { status: 422 }));
  await assert.rejects(api.apiRequest("/materials", { method: "POST", body: "{}" }), error => error.status === 422 && error.message === "Judul wajib diisi");
  let count = 0;
  const conflict = client(async () => { count++; return Response.json({ message: "Materi berubah" }, { status: 409 }); });
  await assert.rejects(conflict.api.apiRequest("/materials/1", { method: "PUT", body: "{}" }), error => error.status === 409);
  assert.equal(count, 1);
});
test("pagination is loaded using the configured API path, without trusting remote next URLs", async () => {
  const paths = [];
  const { api } = client(async url => {
    paths.push(url);
    return Response.json(paths.length === 1 ? { data: [1], links: { next: "https://untrusted.invalid" } } : { data: [2], links: { next: null } });
  });
  const result = await api.loadPages("/materials");
  assert.equal(JSON.stringify(result), "[1,2]");
  assert.deepEqual(paths, ["/api/v1/materials?page=1", "/api/v1/materials?page=2"]);
});

test("raw Laravel paginator responses also load every page", async () => {
  let page = 0;
  const { api } = client(async () => Response.json(++page === 1 ? { data: ["first"], next_page_url: "http://api.invalid?page=2" } : { data: ["second"], next_page_url: null }));
  assert.equal(JSON.stringify(await api.loadPages("/notes")), '["first","second"]');
  assert.equal(page, 2);
});

test("a read recovers from temporary gateway errors without changing its endpoint or cookies", async () => {
  const calls = [];
  const { api } = client(async (url, options) => {
    calls.push({ url, credentials: options.credentials });
    return calls.length < 3 ? Response.json({}, { status: calls.length === 1 ? 502 : 503 }) : Response.json({ data: { version: 2 } });
  });
  assert.equal((await api.apiRequest("/student-reviews/2?classroom_id=1")).data.version, 2);
  assert.equal(calls.length, 3);
  assert.ok(calls.every(call => call.url === "/api/v1/student-reviews/2?classroom_id=1" && call.credentials === "include"));
});

test("read retries stop on persistent gateway errors and never resend writes", async () => {
  let reads = 0;
  const read = client(async () => { reads++; return Response.json({}, { status: 502 }); });
  await assert.rejects(read.api.apiRequest("/notes"), error => error.status === 502 && error.message.includes("Server pembelajaran"));
  assert.equal(reads, 3);
  let writes = 0;
  const write = client(async () => { writes++; return Response.json({}, { status: 502 }); });
  await assert.rejects(write.api.apiRequest("/reflections/1/review", { method: "PUT", body: "{}" }), error => error.status === 502);
  assert.equal(writes, 1);
});

test("a cancelled read remains cancelled and does not start another attempt", async () => {
  const controller = new AbortController();
  let calls = 0;
  const { api } = client(async () => { calls++; controller.abort(); return Response.json({}, { status: 502 }); });
  await assert.rejects(api.apiRequest("/notes", { signal: controller.signal }), error => error.name === "AbortError");
  assert.equal(calls, 1);
});

test("a lost connection can retry a read but never repeats a potentially committed save", async () => {
  let reads = 0;
  const read = client(async () => { if (++reads === 1) throw new TypeError("Connection reset"); return Response.json({ data: [1] }); });
  assert.equal(JSON.stringify((await read.api.apiRequest("/notes")).data), "[1]");
  assert.equal(reads, 2);
  let writes = 0;
  const write = client(async () => { writes++; throw new TypeError("Connection reset"); });
  await assert.rejects(write.api.apiRequest("/notes", { method: "PUT", body: "{}" }), error => error.status === 0);
  assert.equal(writes, 1);
});

test("an unauthenticated read expires the session immediately without retrying", async () => {
  let calls = 0;
  const { api, events } = client(async () => { calls++; return Response.json({ message: "Unauthenticated" }, { status: 401 }); });
  await assert.rejects(api.apiRequest("/me"), error => error.status === 401);
  assert.equal(calls, 1);
  assert.deepEqual(events, ["svil-session-expired"]);
});

test("CSRF initialization also recovers from a temporary gateway error", async () => {
  let calls = 0;
  const { api } = client(async (url, options) => {
    calls++;
    assert.equal(url, "/sanctum/csrf-cookie");
    assert.equal(options.credentials, "include");
    assert.equal(options.cache, "no-store");
    return calls === 1 ? new Response(null, { status: 502 }) : new Response(null, { status: 204 });
  });
  await api.initializeCsrf();
  assert.equal(calls, 2);
});

test("a success notification is emitted only after a confirmed response and its options stay out of fetch", async () => {
  let options;
  const { api, toasts } = client(async (_url, init) => { options = init; return Response.json({ data: { version: 3 } }); });
  const result = await api.apiRequest("/reflections/1/review", { method: "PUT", body: "{}", successMessage: "Pesan guru tersimpan.", notifyError: true });
  assert.equal(result.data.version, 3);
  assert.equal(toasts.length, 1);
  assert.equal(toasts[0].message, "Pesan guru tersimpan.");
  assert.equal(toasts[0].tone, "success");
  assert.equal("successMessage" in options, false);
  assert.equal("notifyError" in options, false);
  const rejected = client(async () => Response.json({ message: "Cerita sudah diperbarui." }, { status: 409 }));
  await assert.rejects(rejected.api.apiRequest("/reflections/1/review", { method: "PUT", body: "{}", successMessage: "Tersimpan", notifyError: true }));
  assert.equal(rejected.toasts.length, 1);
  assert.equal(rejected.toasts[0].tone, "error");
  assert.equal(rejected.toasts[0].message, "Cerita sudah diperbarui.");
});
