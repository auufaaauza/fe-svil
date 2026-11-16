export type QuestionVideoMedia = { provider: "youtube" | "tiktok" | "file" | "link"; id?: string; url: string };

/** Used for local previews. The API validates and normalizes again when saving. */
export function parseQuestionVideo(input?: string | null): QuestionVideoMedia | null {
  if (!input?.trim()) return null;
  try {
    const url = new URL(input.trim());
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || url.username || url.password || url.port || !host.includes(".") || /^\d+(?:\.\d+){3}$/.test(host) || host.startsWith("[")) return null;
    if (["youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com", "youtu.be", "www.youtu.be"].includes(host)) {
      const id = ["youtu.be", "www.youtu.be"].includes(host) ? url.pathname.replace(/^\/|\/$/g, "") : url.pathname === "/watch" ? url.searchParams.get("v") : url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)\/?$/)?.[1];
      return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? { provider: "youtube", id, url: "https://www.youtube.com/watch?v=" + id } : null;
    }
    const tiktok = ["tiktok.com", "www.tiktok.com", "m.tiktok.com"].includes(host) && url.pathname.match(/\/(?:@[^/]+\/video|player\/v1)\/(\d{12,25})(?:\/|$)/);
    if (tiktok) return { provider: "tiktok", id: tiktok[1], url: "https://www.tiktok.com" + url.pathname };
    const shortTikTok = ["vt.tiktok.com", "vm.tiktok.com"].includes(host) ? /^\/[A-Za-z0-9_-]+\/?$/.test(url.pathname) : ["tiktok.com", "www.tiktok.com", "m.tiktok.com"].includes(host) && /^\/t\/[A-Za-z0-9_-]+\/?$/.test(url.pathname);
    if (shortTikTok) return { provider: "tiktok", url: url.href };
    return { provider: /\.(mp4|webm)$/i.test(url.pathname) ? "file" : "link", url: url.href };
  } catch {
    return null;
  }
}
