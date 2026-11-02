"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ToastDetail } from "../lib/api";
import { FriendlyIcon } from "./friendly-icon";

type Toast = ToastDetail & { id: number };

export function ToastViewport() {
  const [items, setItems] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const dismiss = useCallback((id: number) => setItems(current => current.filter(item => item.id !== id)), []);

  useEffect(() => {
    const receive = (event: Event) => {
      const detail = (event as CustomEvent<ToastDetail>).detail;
      if (!detail || typeof detail.message !== "string" || !detail.message.trim() || !["success", "error", "info"].includes(detail.tone)) return;
      const item = { id: nextId.current++, message: detail.message.trim(), tone: detail.tone };
      setItems(current => current.some(old => old.message === item.message && old.tone === item.tone) ? current : [item, ...current.slice(0, 2)]);
    };
    window.addEventListener("svil-toast", receive);
    return () => window.removeEventListener("svil-toast", receive);
  }, []);

  if (!items.length) return null;

  return <section className="toast-viewport" aria-label="Pemberitahuan aplikasi">
    {items.map(item => <ToastCard key={item.id} item={item} dismiss={dismiss}/>)}
  </section>;
}

function ToastCard({ item, dismiss }: { item: Toast; dismiss: (id: number) => void }) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => dismiss(item.id), item.tone === "error" ? 8000 : 5500);
    return () => clearTimeout(timer);
  }, [item.id, item.tone, paused, dismiss]);

  return <div className={`toast-card toast-${item.tone}`} role={item.tone === "error" ? "alert" : "status"} aria-atomic="true"
    onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
    <span className="toast-icon"><FriendlyIcon name={item.tone === "success" ? "check" : item.tone === "error" ? "heart" : "sprout"} size={34}/></span>
    <div className="toast-copy"><strong>{item.tone === "success" ? "Berhasil!" : item.tone === "error" ? "Belum berhasil" : "Kabar untukmu"}</strong><p>{item.message}</p></div>
    <button className="toast-close" type="button" onClick={() => dismiss(item.id)} aria-label="Tutup pemberitahuan"><FriendlyIcon name="close" size={20}/></button>
  </div>;
}
