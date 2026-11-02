export class ApiError extends Error {
  constructor(public status: number, message: string, public errors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
  }
}

export type ToastDetail = { message: string; tone: "success" | "error" | "info" };
type ApiRequestOptions = RequestInit & { successMessage?: string; notifyError?: boolean; maxAgeMs?: number };
const readCache = new Map<string, { expires: number; promise: Promise<unknown> }>();

export function clearReadCache(): void { readCache.clear(); }

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { maxAgeMs = 0, ...requestOptions } = options;
  const write = (options.method ?? "GET").toUpperCase() !== "GET";
  if (write) clearReadCache();
  else if (!maxAgeMs) readCache.delete(path);
  if (typeof window !== "undefined" && !write && maxAgeMs > 0 && !options.signal && !options.headers) {
    let entry = readCache.get(path);
    if (!entry || entry.expires <= Date.now()) {
      entry = { expires: Infinity, promise: performRequest<T>(path, requestOptions) };
      if (readCache.size >= 100) readCache.delete(readCache.keys().next().value!);
      readCache.set(path, entry);
      const current = entry;
      current.promise.then(() => { current.expires = Date.now() + maxAgeMs; }, () => { if (readCache.get(path) === current) readCache.delete(path); });
    }
    return structuredClone(await entry.promise) as T;
  }
  try { return await performRequest<T>(path, requestOptions); }
  finally { if (write) clearReadCache(); }
}

export function showToast(message: string, tone: ToastDetail["tone"] = "success"): void {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent<ToastDetail>("svil-toast", { detail: { message, tone } }));
}

function isAborted(error: unknown): boolean {
  return typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";
}

function waitBeforeRetry(attempt: number, signal?: AbortSignal | null): Promise<void> {
  signal?.throwIfAborted();
  return new Promise((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(signal?.reason ?? new DOMException("Request aborted", "AbortError")); };
    const timer = setTimeout(() => { signal?.removeEventListener("abort", abort); resolve(); }, 350 * (attempt + 1) + Math.random() * 150);
    signal?.addEventListener("abort", abort, { once: true });
  });
}

async function fetchWithReadRetry(url: string, options: RequestInit): Promise<Response> {
  const canRetry = (options.method ?? "GET").toUpperCase() === "GET";
  for (let attempt = 0; ; attempt++) {
    options.signal?.throwIfAborted();
    let response: Response;
    try { response = await fetch(url, options); }
    catch (cause) {
      if (!canRetry || attempt >= 2 || options.signal?.aborted || isAborted(cause)) throw cause;
      await waitBeforeRetry(attempt, options.signal);
      continue;
    }
    if (!canRetry || attempt >= 2 || ![502, 503, 504].includes(response.status)) return response;
    await response.body?.cancel().catch(() => undefined);
    await waitBeforeRetry(attempt, options.signal);
  }
}

export function csrfToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const cookie = document.cookie.split("; ").find(value => value.startsWith("XSRF-TOKEN="));
  return cookie ? decodeURIComponent(cookie.slice("XSRF-TOKEN=".length)) : undefined;
}

export async function initializeCsrf(signal?: AbortSignal | null): Promise<void> {
  let response: Response;
  try { response = await fetchWithReadRetry("/sanctum/csrf-cookie", { credentials: "include", cache: "no-store", signal, headers: { Accept: "application/json" } }); }
  catch (cause) {
    if (signal?.aborted || isAborted(cause)) throw cause;
    throw new ApiError(0, "Sesi aman belum dapat disiapkan. Periksa koneksi dan coba lagi.");
  }
  if (!response.ok) throw new ApiError(response.status, "Sesi aman belum dapat disiapkan. Coba lagi.");
}

async function performRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { successMessage, notifyError, ...requestOptions } = options;
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  headers.set("X-Requested-With", "XMLHttpRequest");
  if (typeof options.body === "string") headers.set("Content-Type", "application/json");
  if (options.method && options.method !== "GET") {
    if (!csrfToken()) await initializeCsrf(options.signal);
    const token = csrfToken();
    if (token) headers.set("X-XSRF-TOKEN", token);
  }
  let response: Response;
  try { response = await fetchWithReadRetry(`/api/v1${path}`, { ...requestOptions, headers, credentials: "include", cache: "no-store" }); }
  catch (cause) {
    if (options.signal?.aborted || isAborted(cause)) throw cause;
    const message = "Server belum dapat dihubungi. Periksa koneksi dan coba lagi.";
    if (notifyError) showToast(message, "error");
    throw new ApiError(0, message);
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    if (response.status === 401) { clearReadCache(); if (typeof window !== "undefined") window.dispatchEvent(new Event("svil-session-expired")); }
    const firstError = payload.errors ? Object.values(payload.errors).flat()[0] : null;
    const message = response.status === 419 ? "Sesi berakhir. Keluar dan masuk kembali sebelum menyimpan." : String(firstError || payload.message || ([502, 503, 504].includes(response.status) ? "Server pembelajaran sedang sulit dihubungi. Coba muat lagi sebentar." : "Permintaan belum berhasil."));
    if (notifyError) showToast(message, "error");
    throw new ApiError(response.status, message, payload.errors);
  }
  if (response.headers.get("Content-Type")?.includes("text/csv")) return await response.blob() as T;
  const result = response.status === 204 ? undefined as T : await response.json() as T;
  if (successMessage) showToast(successMessage);
  return result;
}

export type PageResponse<T> = { data: T[]; links?: { next?: string | null }; next_page_url?: string | null; meta?: { current_page: number; last_page: number } };

export async function loadPages<T>(path: string, signal?: AbortSignal, options: { maxAgeMs?: number; initialPage?: PageResponse<T> } = {}): Promise<T[]> {
  const all: T[] = [];
  let page = 1;
  while (true) {
    const result = page === 1 && options.initialPage ? options.initialPage : await apiRequest<PageResponse<T>>(`${path}${path.includes("?") ? "&" : "?"}page=${page}`, { signal, maxAgeMs: options.maxAgeMs });
    all.push(...result.data);
    if (!result.links?.next && !result.next_page_url) return all;
    page++;
  }
}

export async function loadWorkspaceLists<T extends Record<string, unknown>>(path: string, sections: Record<keyof T, string>, maxAgeMs = 30000): Promise<{ [Key in keyof T]: T[Key][] }> {
  const response = await apiRequest<{ data: { [Key in keyof T]: PageResponse<T[Key]> } }>(path, { maxAgeMs });
  const result = await Promise.all((Object.keys(sections) as (keyof T)[]).map(async key => [key, await loadPages<T[typeof key]>(sections[key], undefined, { initialPage: response.data[key], maxAgeMs })] as const));
  return Object.fromEntries(result) as { [Key in keyof T]: T[Key][] };
}
