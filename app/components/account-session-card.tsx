"use client";

import { useRef, useState } from "react";
import { FriendlyIcon } from "./friendly-icon";
import { useSession } from "./session-provider";

export function AccountSessionCard({ beforeLeave, disabled = false }: { beforeLeave?: () => Promise<boolean>; disabled?: boolean }) {
  const { user, logout } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  if (!user) return null;
  const role = user.role === "student" ? "Siswa" : user.role === "teacher" ? "Guru" : "Admin";

  const leave = async () => {
    if (pending.current || disabled) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      if (beforeLeave && !await beforeLeave()) {
        setError("Catatan belum tersimpan. Coba simpan lagi sebelum keluar, ya.");
        return;
      }
      await logout();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Belum bisa keluar. Coba lagi, ya.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  return <section className="account-session-card" aria-label="Sesi akun">
    <div className="session-identity">
      <span className="session-avatar"><FriendlyIcon name="account" size={30}/></span>
      <div className="session-identity-copy"><strong>{user.name}</strong><small>{role} · @{user.username}</small></div>
    </div>
    <button type="button" className="session-logout" disabled={busy || disabled} aria-busy={busy} onClick={leave}>
      {busy ? <span className="session-logout-spinner" aria-hidden="true"/> : <FriendlyIcon name="exit" size={28}/>}
      <span>{busy ? "Sedang keluar…" : "Keluar akun"}</span>
    </button>
    {error && <p className="session-logout-error" role="alert">{error}</p>}
  </section>;
}
