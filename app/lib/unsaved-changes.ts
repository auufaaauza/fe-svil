"use client";

import { useEffect } from "react";

export function confirmLeave(): Promise<boolean> {
  const detail = { allowed: true };
  window.dispatchEvent(new CustomEvent("svil-before-leave", { detail }));
  return Promise.resolve(detail.allowed);
}

export function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const leave = (event: Event) => {
      const detail = (event as CustomEvent<{ allowed: boolean }>).detail;
      if (detail.allowed && !window.confirm("Ada perubahan yang belum tersimpan. Tinggalkan halaman dan abaikan perubahan?")) detail.allowed = false;
    };
    window.addEventListener("beforeunload", unload);
    window.addEventListener("svil-before-leave", leave);
    return () => { window.removeEventListener("beforeunload", unload); window.removeEventListener("svil-before-leave", leave); };
  }, [dirty]);
}
