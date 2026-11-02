"use client";
import { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from "../lib/password-policy";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { BrandLogo } from "./brand-logo";
import { LearningScene } from "./learning-scene";
import { FriendlyIcon } from "./friendly-icon";
import { useSession, type RegistrationFields } from "./session-provider";

export function RegisterScreen() {
  const { register } = useSession();
  const [fields, setFields] = useState<RegistrationFields>({ name: "", username: "", email: "", password: "", password_confirmation: "", class_code: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const update = (key: keyof RegistrationFields, value: string) => setFields(previous => ({ ...previous, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    if (fields.password !== fields.password_confirmation) { setError("Kedua kata sandi belum sama. Periksa lagi, ya."); return; }
    setBusy(true);
    try { await register(fields); } catch (cause) { setError(cause instanceof Error ? cause.message : "Pendaftaran belum berhasil."); } finally { setBusy(false); }
  };
  return <main className="login-page register-page"><section className="login-story"><BrandLogo/><h1>Teman baru,<br/>petualangan baru.</h1><p>Siapkan kode kelas dari gurumu. Kita akan belajar, saling membantu, dan tumbuh bersama.</p><LearningScene topic={3} step={0}/></section><section className="panel login-panel"><span className="soft-badge">PENDAFTARAN SISWA</span><h2>Yuk, kenalan dulu!</h2><p>Akun guru dan admin disiapkan oleh admin sekolah.</p><form onSubmit={submit} aria-busy={busy}><fieldset className="register-fields" disabled={busy}>{error && <div className="form-error" role="alert">{error}</div>}
    <label className="field-label" htmlFor="register-name">Nama lengkap</label><input id="register-name" autoComplete="name" required maxLength={120} value={fields.name} onChange={e => update("name",e.target.value)}/>
    <label className="field-label" htmlFor="register-username">Username</label><input id="register-username" autoComplete="username" autoCapitalize="none" spellCheck={false} required minLength={3} maxLength={40} pattern="[a-z0-9][a-z0-9._\-]*" value={fields.username} onChange={e => update("username",e.target.value.toLowerCase())}/><p className="helper">Huruf kecil dan angka; boleh memakai titik, garis bawah, atau tanda hubung.</p>
    <label className="field-label" htmlFor="register-email">Email akun</label><input id="register-email" type="email" autoComplete="email" required value={fields.email} onChange={e => update("email",e.target.value)}/>
    <label className="field-label" htmlFor="register-code">Kode kelas dari guru</label><input id="register-code" className="class-code-input" autoComplete="off" spellCheck={false} required minLength={12} maxLength={12} value={fields.class_code} onChange={e => update("class_code",e.target.value.toUpperCase())}/>
    <label className="field-label" htmlFor="register-password">Kata sandi · 6–12 karakter</label><input id="register-password" type="password" autoComplete="new-password" required minLength={PASSWORD_MIN_LENGTH} maxLength={PASSWORD_MAX_LENGTH} value={fields.password} onChange={e => update("password",e.target.value)}/>
    <label className="field-label" htmlFor="register-confirm">Ulangi kata sandi</label><input id="register-confirm" type="password" autoComplete="new-password" required minLength={PASSWORD_MIN_LENGTH} maxLength={PASSWORD_MAX_LENGTH} value={fields.password_confirmation} onChange={e => update("password_confirmation",e.target.value)}/>
    <button className="button primary full-width">{busy ? "Menyiapkan akun…" : "Daftar dan mulai belajar"}{busy ? <span className="button-spinner" aria-hidden="true"/> : <FriendlyIcon name="arrow" size={23}/>}</button></fieldset></form><p className="auth-alternative">Sudah punya akun? <Link href="/login">Masuk di sini</Link></p></section></main>;
}
