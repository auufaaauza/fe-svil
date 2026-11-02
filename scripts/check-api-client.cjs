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
  vm.runInNewContext(code, { exports: module.exports, fetch, Headers, Response, Blob, Event, document: { cookie: "XSRF-TOKEN=abc%3Ddef" }, window: { dispatchEvent: event => events.push(event.type) } });
  return { api: module.exports, events };
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
