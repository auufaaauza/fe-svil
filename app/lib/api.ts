export class ApiError extends Error {
  constructor(public status: number, message: string, public errors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
  }
}

export function csrfToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const cookie = document.cookie.split("; ").find(value => value.startsWith("XSRF-TOKEN="));
  return cookie ? decodeURIComponent(cookie.slice("XSRF-TOKEN=".length)) : undefined;
}

export async function initializeCsrf(): Promise<void> {
  const response = await fetch("/sanctum/csrf-cookie", { credentials: "include", headers: { Accept: "application/json" } });
  if (!response.ok) throw new ApiError(response.status, "Sesi aman belum dapat disiapkan. Coba lagi.");
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  headers.set("X-Requested-With", "XMLHttpRequest");
  if (typeof options.body === "string") headers.set("Content-Type", "application/json");
  if (options.method && options.method !== "GET") {
    if (!csrfToken()) await initializeCsrf();
    const token = csrfToken();
    if (token) headers.set("X-XSRF-TOKEN", token);
  }
  let response: Response;
  try { response = await fetch(`/api/v1${path}`, { ...options, headers, credentials: "include", cache: "no-store" }); }
  catch { throw new ApiError(0, "Server belum dapat dihubungi. Periksa koneksi dan coba lagi."); }
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    if (response.status === 401 && typeof window !== "undefined") window.dispatchEvent(new Event("svil-session-expired"));
    const firstError = payload.errors ? Object.values(payload.errors).flat()[0] : null;
    throw new ApiError(response.status, response.status === 419 ? "Sesi berakhir. Keluar dan masuk kembali sebelum menyimpan." : String(firstError || payload.message || "Permintaan belum berhasil."), payload.errors);
  }
  if (response.headers.get("Content-Type")?.includes("text/csv")) return await response.blob() as T;
  return response.status === 204 ? undefined as T : response.json();
}

export type PageResponse<T> = { data: T[]; links?: { next?: string | null }; next_page_url?: string | null; meta?: { current_page: number; last_page: number } };

export async function loadPages<T>(path: string, signal?: AbortSignal): Promise<T[]> {
  const all: T[] = [];
  let page = 1;
  while (true) {
    const result = await apiRequest<PageResponse<T>>(`${path}${path.includes("?") ? "&" : "?"}page=${page}`, { signal });
    all.push(...result.data);
    if (!result.links?.next && !result.next_page_url) return all;
    page++;
  }
}
