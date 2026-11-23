"use client";
import { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from "../lib/password-policy";
import { useState, useEffect, type FormEvent } from "react";
import { apiRequest, loadPages } from "../lib/api";
import { useSession, type LearningNote } from "./session-provider";
import { FriendlyIcon } from "./friendly-icon";
import { phaseNames } from "../lib/learning";
import { ThemeSelect } from "./theme-select";
import { useMembers } from "./lms-shared";

export function NotesReview() {
  const members=useMembers();
  const { notes, updateNote, activeClass } = useSession();
  const visibleNotes = notes.filter(n => n.classroom_id === activeClass);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const note = visibleNotes.find(n => n.id === selected);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (!note) return; setBusy(true); setMessage("");
    try { const result=await apiRequest<{data:LearningNote}>("/notes/"+note.id+"/review", { method: "PUT", body: JSON.stringify({ feedback }), successMessage:"Pesan guru berhasil disimpan.",notifyError:true }); updateNote(result.data); setMessage("Umpan balik tersimpan dan dapat dibaca siswa."); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : "Belum berhasil menyimpan."); } finally { setBusy(false); }
  };
  return <section className="panel"><div className="section-heading"><h2>Tinjau catatan belajar</h2><FriendlyIcon name="note" size={40}/></div><p>Baca cerita siswa di kelas terpilih. Beri apresiasi dan saran yang membantu; perasaan siswa tidak dinilai benar atau salah.</p>{!visibleNotes.length && <div className="soft-note">Belum ada catatan dari siswa pada kelas ini.</div>}<div className="material-library">{visibleNotes.map(n => <button disabled={busy} className={"library-item "+(selected === n.id ? "selected" : "")} key={n.id} onClick={() => { setSelected(n.id); setFeedback(n.feedback ?? ""); setMessage(""); }}><strong>{members.rows.find(m=>m.id===n.student_id)?.name??"P-"+n.student_id} · Pertemuan {n.topic+1} · {phaseNames[n.phase]}</strong><small>{n.reviewed_at ? "Sudah ditinjau" : "Menunggu tinjauan"}</small></button>)}</div>{note && <form onSubmit={submit} className="review-box"><h3>Catatan siswa</h3><p className="material-body">{note.content}</p><label htmlFor="note-feedback" className="field-label">Apresiasi dan saran</label><textarea id="note-feedback" required disabled={busy} maxLength={3000} rows={4} value={feedback} onChange={e => setFeedback(e.target.value)}/><button className="button primary" disabled={busy}>{busy ? "Menyimpan…" : "Simpan umpan balik"}</button></form>}{message && <p className="notice" role="status">{message}</p>}</section>;
}

type Summary = { classrooms: number; students: number; materials: number; notes: number; reviewedNotes: number; practiceAttempts: number; pendingPracticeReviews: number; groups: number; submittedWorks: number; reviewedWorks: number; actionPlans: number; actionJournals: number; verifiedActions: number; observations: number; learningModules: number; quizzes: number; discussions: number; openDiscussions: number; researchInstrumentsReady: boolean };
export function LiveReport() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => { let active = true; setError(""); apiRequest<{ data: Summary }>("/reports/summary").then(r => { if (active) setSummary(r.data); }).catch(e => { if (active) setError(e.message); }); return () => { active = false; }; }, [reload]);
  const download = async (kind: "notes" | "learning") => {
    setBusy(true); setError("");
    try { const blob = await apiRequest<Blob>("/reports/"+kind+".csv"); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = kind === "notes" ? "svil-catatan-belajar.csv" : "svil-kegiatan-belajar.csv"; a.click(); URL.revokeObjectURL(url); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unduhan belum berhasil."); } finally { setBusy(false); }
  };
  return <section className="panel report-panel"><div className="section-heading"><div><p className="eyebrow">DATA AKTUAL · SELURUH KELAS DALAM AKSES ANDA</p><h2>Ringkasan kegiatan belajar</h2></div><button className="button secondary" onClick={() => setReload(n => n+1)}>Perbarui</button></div>{error && <p className="form-error" role="alert">{error}</p>}{!summary && !error && <p role="status">Memuat ringkasan…</p>}{summary && <div className="report-grid">{[["Kelas", summary.classrooms], ["Siswa terdaftar", summary.students], ["Kelompok", summary.groups], ["Konten unggahan", summary.materials], ["Kuis latihan", summary.quizzes], ["LKPD utama", summary.learningModules], ["Diskusi kelas", summary.discussions], ["Diskusi terbuka", summary.openDiscussions], ["Catatan belajar", summary.notes], ["Catatan ditinjau", summary.reviewedNotes], ["Jawaban latihan", summary.practiceAttempts], ["Latihan perlu tinjauan", summary.pendingPracticeReviews], ["LKPD terkirim", summary.submittedWorks], ["LKPD selesai ditinjau", summary.reviewedWorks], ["Rencana aksi", summary.actionPlans], ["Jurnal pelaksanaan", summary.actionJournals], ["Aksi diverifikasi", summary.verifiedActions], ["Catatan observasi", summary.observations]].map(([label,value]) => <div className="report-tile" key={label}><strong className="report-number">{value}</strong><h3>{label}</h3></div>)}</div>}
    <div className="report-downloads"><button className="button primary" onClick={() => download("learning")} disabled={busy}>{busy ? "Menyiapkan…" : "Unduh kegiatan dan penilaian"}<FriendlyIcon name="arrow" size={20}/></button><button className="button secondary" onClick={() => download("notes")} disabled={busy}>Unduh catatan individu</button></div>
    <p className="helper">CSV kegiatan berisi materi, kuis, diskusi dan tanggapan, LKPD dan riwayatnya, rubrik terpisah, rencana dan jurnal aksi, jawaban latihan, tinjauan guru, serta observasi dan revisinya. Identitas memakai kode P dan K. Tinjau teks bebas sebelum menyerahkan laporan kepada peneliti.</p>
    <div className="soft-note">Ini laporan operasional pembelajaran. Pretest–posttest dan angket menunggu instrumen yang disahkan peneliti. Jumlah aktivitas tidak dipakai sebagai hasil uji efektivitas.</div></section>;
}

type School = { id: number; name: string; code: string };
export function AdminSetup() {
  const { classrooms, refresh } = useSession();
  const [schools, setSchools] = useState<School[]>([]);
  const [kind, setKind] = useState("user");
  const [schoolId, setSchoolId] = useState("");
  const [classId, setClassId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { let active = true; loadPages<School>("/schools").then(data => { if (active) setSchools(data); }).catch(e => { if (active) setMessage(e.message); }); return () => { active = false; }; }, []);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const notification = {successMessage:"Data berhasil disimpan di server.",notifyError:true};
      if (kind === "school") await apiRequest("/schools", { method: "POST", body: JSON.stringify({ name, code }),...notification });
      else if (kind === "class") await apiRequest("/classrooms", { method: "POST", body: JSON.stringify({ name, school_id: Number(schoolId), academic_year: code }),...notification });
      else await apiRequest("/users", { method: "POST", body: JSON.stringify({ name, username, email, password, role, school_id: schoolId ? Number(schoolId) : null, classroom_ids: classId ? [Number(classId)] : [] }),...notification });
      setPassword(""); setMessage("Data berhasil disimpan di server.");
      try {setSchools(await loadPages<School>("/schools")); await refresh();} catch {setMessage("Data sudah tersimpan. Daftar terbaru belum termuat; coba muat ulang halaman.");}
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Belum berhasil menyimpan."); } finally { setBusy(false); }
  };
  return <div className="workshop-layout"><section className="panel"><h2>Siapkan ruang belajar</h2><p>Mulai dari madrasah, lanjutkan dengan kelas, lalu buat akun siswa dan guru.</p><form className="material-form" onSubmit={submit}><label className="field-label" htmlFor="setup-kind">Yang ingin ditambahkan</label><ThemeSelect id="setup-kind" label="Yang ingin ditambahkan" value={kind} onChange={value => { setKind(value); setName(""); setCode(""); setMessage(""); }} options={[{ value: "user", label: "Akun siswa, guru, atau admin" }, { value: "class", label: "Kelas" }, { value: "school", label: "Madrasah" }]}/><label className="field-label" htmlFor="setup-name">Nama</label><input id="setup-name" value={name} required maxLength={80} onChange={e => setName(e.target.value)}/>{kind === "user" && <><label className="field-label" htmlFor="setup-role">Peran</label><ThemeSelect id="setup-role" label="Peran akun" value={role} onChange={value => { setRole(value); setClassId(""); }} options={[{value: "student", label: "Siswa"}, {value: "teacher", label: "Guru"}, {value: "admin", label: "Admin"}]}/><label className="field-label" htmlFor="setup-username">Username</label><input id="setup-username" autoCapitalize="none" autoComplete="off" required minLength={3} maxLength={40} value={username} onChange={e => setUsername(e.target.value.toLowerCase())}/><label className="field-label" htmlFor="setup-email">Email{role==="student"?" (opsional)":""}</label><input id="setup-email" type="email" value={email} required={role!=="student"} onChange={e => setEmail(e.target.value)}/><label className="field-label" htmlFor="setup-password">Kata sandi awal · 6–12 karakter</label><input id="setup-password" type="password" autoComplete="new-password" minLength={PASSWORD_MIN_LENGTH} maxLength={PASSWORD_MAX_LENGTH} value={password} required onChange={e => setPassword(e.target.value)}/></>}{kind !== "school" && <><label className="field-label" htmlFor="setup-school">Madrasah</label><ThemeSelect id="setup-school" label="Madrasah" value={schoolId} required={kind === "class" || role !== "admin"} onChange={value => { setSchoolId(value); setClassId(""); }} placeholder="Pilih madrasah" options={schools.map(item => ({value: String(item.id), label: item.name}))}/></>}{kind === "user" && role !== "admin" && <><label className="field-label" htmlFor="setup-class">Penugasan / keanggotaan kelas</label><ThemeSelect id="setup-class" label="Penugasan kelas" required={role === "student"} value={classId} onChange={setClassId} placeholder="Pilih kelas" options={[...(role === "student" ? [] : [{value: "", label: "Belum ditetapkan"}]), ...classrooms.filter(c => c.schoolId === Number(schoolId)).map(c => ({value: String(c.id), label: c.name, description: c.academicYear}))]}/></>}{kind !== "user" && <><label className="field-label" htmlFor="setup-code">{kind === "school" ? "Kode madrasah unik" : "Tahun ajaran"}</label><input id="setup-code" value={code} required onChange={e => setCode(e.target.value)}/></>}<div className="form-actions"><button className="button primary" disabled={busy}>{busy ? "Menyimpan…" : "Simpan data"}<FriendlyIcon name="check"/></button></div>{message && <p className="notice" role="status">{message}</p>}</form></section><aside className="panel school-directory" aria-labelledby="registered-schools-heading">
      <h2 id="registered-schools-heading">Madrasah terdaftar</h2>
      {!schools.length ? <div className="soft-note">Belum ada madrasah. Tambahkan melalui formulir di samping.</div> : (
        <ul className="card-stack" aria-label="Daftar madrasah">
          {schools.map(s => (
            <li className="report-tile" key={s.id}>
              <FriendlyIcon name="school" size={35}/>
              <h3>{s.name}</h3>
              <small>{s.code}</small>
            </li>
          ))}
        </ul>
      )}
      {classrooms.length > 0 && (
        <section className="class-invitations">
          <h3>Kode pendaftaran kelas</h3>
          <ul className="card-stack" aria-label="Kode pendaftaran setiap kelas">
            {classrooms.map(c => (
              <li className="class-invitation" key={c.id}>
                <strong>{c.name}</strong>
                <small>{c.schoolName}</small>
                <code>{c.joinCode}</code>
                <p>Bagikan kode ini kepada siswa kelas tersebut.</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside></div>;
}
