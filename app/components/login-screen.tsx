"use client";
import { useState, type FormEvent } from "react";
import { FriendlyIcon } from "./friendly-icon";
import { LearningScene } from "./learning-scene";
import { useSession } from "./session-provider";
import { BrandLogo } from "./brand-logo";
import Link from "next/link";

export function LoginScreen() {
  const { login, error: sessionError } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    try { await login(email, password); } catch (cause) { setError(cause instanceof Error ? cause.message : "Belum berhasil masuk."); } finally { setBusy(false); }
  };
  return <main className="login-page"><section className="login-story"><BrandLogo/><h1>Belajar dengan hati.<br/>Bertumbuh bersama.</h1><p>Petualangan kecil untuk mengenal Indonesia, menyayangi sesama, dan menjaga alam.</p><LearningScene topic={3} step={1}/></section><section className="panel login-panel"><FriendlyIcon name="home" size={55}/><h2>Yuk, masuk dulu!</h2><p>Gunakan akun dari sekolahmu. Minta bantuan guru kalau kamu membutuhkannya.</p><form onSubmit={submit} aria-busy={busy}>{(error || sessionError) && <div className="form-error" role="alert">{error || sessionError}</div>}<label className="field-label" htmlFor="login-email">Username atau email</label><input id="login-email" disabled={busy} type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} required value={email} onChange={e => setEmail(e.target.value)} placeholder="Masukkan username atau email"/><label className="field-label" htmlFor="login-password">Kata sandi</label><input id="login-password" disabled={busy} type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)}/><button className="button primary full-width" disabled={busy}>{busy ? "Sedang masuk…" : "Masuk dan mulai belajar"}{busy ? <span className="button-spinner" aria-hidden="true"/> : <FriendlyIcon name="arrow" size={23}/>}</button></form><p className="auth-alternative">Belum punya akun? <Link href="/register">Daftar sebagai siswa</Link></p></section></main>;
}
