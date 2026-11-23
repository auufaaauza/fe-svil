"use client";

import { useRef, useState, type FormEvent } from "react";
import { ApiError, apiRequest } from "../lib/api";
import { downloadCsv } from "../lib/csv";
import { useSession } from "./session-provider";
import { ThemeSelect } from "./theme-select";
import { FriendlyIcon } from "./friendly-icon";
import { Field, errorMessage } from "./lms-shared";

type StudentInput = { name: string; email: string | null };
type AccountRow = StudentInput & { id?: number; username: string; initial_password?: string };
type Preview = { rows: AccountRow[]; count: number; initial_password: string; preview_token: string };
type Prepared = { classroom_id: number; request_id: string; students: StudentInput[]; preview: Preview };

export function StudentAccountGenerator({ onCreated }: { onCreated?: (classroomId: number) => void }) {
  const { user, activeClass, classrooms } = useSession();
  const [classId, setClassId] = useState(String(activeClass ?? ""));
  const [namesText, setNamesText] = useState("");
  const [emails, setEmails] = useState<Record<number, string>>({});
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [created, setCreated] = useState<AccountRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [opened, setOpened] = useState(false);
  const requestId = useRef<string | null>(null);
  const pending = useRef(false);
  const activeClasses = classrooms.filter(row => !row.archived);
  const names = namesText.split(/\r?\n/).map(name => name.trim().replace(/\s+/g, " ")).filter(Boolean);

  if (!user || user.role === "student") return null;

  const prepare = async (event: FormEvent) => {
    event.preventDefault();
    if (pending.current) return;
    if (!classId || !names.length || names.length > 500) { setError("Pilih kelas dan isi 1–500 nama siswa, satu nama per baris."); return; }
    pending.current = true; setBusy(true); setError("");
    requestId.current ??= crypto.randomUUID();
    const students = names.map((name, index) => ({ name, email: emails[index]?.trim() || null }));
    try {
      const result = await apiRequest<{ data: Preview }>("/roster/generate", { method: "POST", body: JSON.stringify({ classroom_id: Number(classId), request_id: requestId.current, students }), notifyError: true });
      setPrepared({ classroom_id: Number(classId), request_id: requestId.current, students, preview: result.data });
    } catch (cause) { setError(errorMessage(cause)); }
    finally { pending.current = false; setBusy(false); }
  };

  const create = async () => {
    if (!prepared || pending.current) return;
    pending.current = true; setBusy(true); setError("");
    try {
      const { preview, ...body } = prepared;
      const result = await apiRequest<{ data: { created: AccountRow[] } }>("/roster/generate", { method: "POST", body: JSON.stringify({ ...body, commit: true, preview_token: preview.preview_token }), successMessage: "Akun siswa berhasil dibuat dan terhubung ke kelas tujuan.", notifyError: true });
      setCreated(result.data.created);
      onCreated?.(prepared.classroom_id);
    } catch (cause) {
      setError(errorMessage(cause));
      if (cause instanceof ApiError && cause.status === 409) { setPrepared(null); requestId.current = null; }
    } finally { pending.current = false; setBusy(false); }
  };

  const reset = () => { setPrepared(null); setCreated([]); setNamesText(""); setEmails({}); setError(""); requestId.current = null; };
  const rows = created.length ? created : prepared?.preview.rows ?? [];
  const className = classrooms.find(row => row.id === Number(classId))?.name ?? "kelas tujuan";
  return <section className="panel student-account-generator">
    <div className="section-heading"><div><p className="eyebrow">PENDAFTARAN SISWA LEBIH MUDAH</p><h2>Generator akun satu kelas</h2><p>Pilih kelas dan tempel daftar nama. Username dibuat dari nama depan, dengan angka pembeda jika sudah digunakan.</p></div><button type="button" className="button secondary" disabled={busy} onClick={() => setOpened(value => !value)} aria-expanded={opened}><FriendlyIcon name="student" size={26}/>{opened ? "Tutup generator" : "Buat akun massal"}</button></div>
    {opened && <div className="account-generator-body">
      {!created.length && <form className="lms-form" onSubmit={prepare}><fieldset disabled={busy || Boolean(prepared)}>
        <ThemeSelect label="Kelas tujuan" required value={classId} onChange={value => { setClassId(value); requestId.current = null; }} placeholder="Pilih kelas" options={activeClasses.map(row => ({ value: String(row.id), label: row.name, description: row.schoolName + " · " + row.academicYear }))}/>
        {!activeClasses.length && <p className="soft-note">{user.role === "admin" ? "Buat kelas aktif terlebih dahulu melalui pengelolaan madrasah." : "Admin perlu menugaskan akun guru ke kelas aktif terlebih dahulu."}</p>}
        <Field label="Daftar nama lengkap · satu siswa per baris" hint="Bisa ditempel langsung dari satu kolom daftar nama. Lengkapi nama terlebih dahulu, lalu isi email bila diperlukan."><textarea required rows={8} maxLength={65000} value={namesText} onChange={event => { setNamesText(event.target.value); setEmails({}); requestId.current = null; }} placeholder="Tulis atau tempel nama lengkap siswa di sini…"/></Field>
        <div className="generator-summary"><span>{names.length} / 500 siswa</span><span>Password awal: <code>siswa123</code></span></div>
        {names.length > 0 && names.length <= 500 && <details className="generator-emails"><summary>Tambahkan email siswa (opsional)</summary><div className="generator-email-list">{names.map((name, index) => <Field key={index} label={name}><input type="email" maxLength={255} value={emails[index] ?? ""} onChange={event => setEmails(current => ({ ...current, [index]: event.target.value }))} placeholder="Boleh dikosongkan"/></Field>)}</div></details>}
        {!prepared && <button className="button primary" disabled={!names.length || names.length > 500 || !activeClasses.some(row => row.id === Number(classId))}>{busy ? "Menyiapkan daftar…" : "Pratinjau akun"}<FriendlyIcon name="search" size={23}/></button>}
      </fieldset></form>}
      {rows.length > 0 && <div className="generator-results"><div className="soft-note"><strong>{created.length ? `${created.length} akun siswa berhasil dibuat di ${className}.` : `${rows.length} akun untuk ${className} siap diperiksa.`}</strong><p>{created.length ? "Siswa dapat langsung masuk memakai username dan password awal siswa123. Unduh daftar akses untuk dibagikan kepada masing-masing siswa." : "Akun belum dibuat. Periksa nama, username, dan kelas tujuan sebelum melanjutkan."}</p></div><div className="table-scroll generator-table"><table className="lms-table"><thead><tr><th>Nama siswa</th><th>Username</th><th>Email</th>{created.length > 0 && <th>Password awal</th>}</tr></thead><tbody>{rows.map(row => <tr key={row.username}><td>{row.name}</td><td><code>{row.username}</code></td><td>{row.email || "—"}</td>{created.length > 0 && <td><code>{row.initial_password}</code></td>}</tr>)}</tbody></table></div>
        <div className="form-actions">{created.length ? <><button type="button" className="button primary" onClick={() => downloadCsv("svil-akses-siswa-" + classId + ".csv", ["name", "username", "email", "initial_password"], created.map(row => [row.name, row.username, row.email, row.initial_password]))}><FriendlyIcon name="download" size={23}/>Unduh daftar akses</button><button type="button" className="button secondary" onClick={reset}>Buat daftar baru</button></> : <><button type="button" className="button secondary" disabled={busy} onClick={() => { setPrepared(null); requestId.current = null; }}>Ubah daftar</button><button type="button" className="button primary" disabled={busy} onClick={create}>{busy ? "Membuat akun…" : "Buat " + rows.length + " akun siswa"}<FriendlyIcon name="check" size={23}/></button></>}</div>
      </div>}
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>}
  </section>;
}
