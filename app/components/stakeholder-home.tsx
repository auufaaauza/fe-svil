"use client";
import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
import { useSession } from "./session-provider";
import { FriendlyIcon, type IconName } from "./friendly-icon";
import { BrandMark } from "./brand-logo";

type Summary = {
  courses:number;assignments:number;assessments:number;pendingSubmissions:number;pendingAssessmentReviews:number;pendingReflections:number;completedMaterials:number;completedLessons:number;classrooms: number; students: number; materials: number; notes: number; reviewedNotes: number; pendingPracticeReviews: number;
  groups: number; submittedWorks: number; reviewedWorks: number; actionPlans: number; verifiedActions: number; actionJournals: number;
  observations: number; learningModules: number; quizzes: number; draftMaterials: number; publishedMaterials: number; openDiscussions: number;
  administration: { schools: number; teachers: number; students: number; activeUsers: number; inactiveUsers: number } | null;
};
function Metric({ icon, label, value, color }: { icon: IconName; label: string; value: number | undefined; color: string }) {
  return <article className={"home-metric "+color}><FriendlyIcon name={icon} size={37}/><div><strong>{value ?? "—"}</strong><span>{label}</span></div></article>;
}
export function StaffHome({ onNavigate }: { onNavigate: (label: string) => void }) {
  const { user, activeClass, classrooms, materials } = useSession();
  const admin = user!.role === "admin";
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const currentClass = classrooms.find(c => c.id === activeClass);
  useEffect(() => {
    let alive = true;
    apiRequest<{ data: Summary }>("/reports/summary"+(!admin && activeClass ? "?classroom_id="+activeClass : ""))
      .then(r => { if (alive) { setSummary(r.data); setError(""); } }).catch(e => { if (alive) setError(e.message); });
    return () => { alive = false; };
  }, [admin, activeClass, reload]);
  const recent = materials.filter(m => admin || m.classroomId === activeClass).slice(0,4);
  return <div className={"staff-home "+(admin ? "admin-home" : "teacher-home")}>
    <section className="staff-welcome"><div><p className="eyebrow">{admin ? "PUSAT PENGELOLAAN SEKOLAH" : "PENDAMPINGAN KELAS"}</p>
      <h2>{admin ? "Ruang kendali pembelajaran." : "Selamat mendampingi, "+user!.name.split(" ")[0]+"."}</h2>
      <p>{admin ? "Pantau kesiapan madrasah, kelola akses, dan pastikan kegiatan sekolah tercatat." : currentClass ? currentClass.name+" · "+currentClass.schoolName+". Berikut aktivitas dan tugas yang perlu ditindaklanjuti." : "Akun Anda belum ditugaskan ke kelas. Admin dapat menetapkan kelas untuk mulai mendampingi siswa."}</p>
      <span className="home-scope">{admin ? "Seluruh madrasah" : currentClass?.academicYear ?? "Menunggu penugasan"} · Data aktual</span>
    </div><div className="welcome-symbol">{admin ? <BrandMark/> : <FriendlyIcon name="teacher" size={88}/>}</div></section>
    {error && <div className="form-error" role="alert">{error}<button className="text-button" onClick={() => setReload(n => n+1)}>Muat ulang</button></div>}
    {!summary && !error && <p role="status">Memuat informasi {admin ? "sekolah" : "kelas"}…</p>}
    {admin ? <>
      <div className="home-metrics"><Metric icon="school" label="Madrasah" value={summary?.administration?.schools} color="mint"/><Metric icon="teacher" label="Guru terdaftar" value={summary?.administration?.teachers} color="blue"/><Metric icon="classroom" label="Kelas" value={summary?.classrooms} color="peach"/><Metric icon="student" label="Siswa" value={summary?.administration?.students} color="lilac"/></div>
      <div className="home-information-grid"><section className="panel"><div className="section-heading"><h3>Kesiapan sistem sekolah</h3><FriendlyIcon name="check" size={35}/></div><div className="readiness-list">
        {[["Madrasah terdaftar", summary?.administration?.schools ?? 0, "Madrasah"], ["Kelas siap digunakan", summary?.classrooms ?? 0, "Madrasah"], ["LKPD utama di database", summary?.learningModules ?? 0, "Konten belajar"], ["Materi dan kuis terbit", summary?.publishedMaterials ?? 0, "Konten belajar"]].map(([label,value,target]) => <button className="readiness-row" key={String(label)} onClick={() => onNavigate(String(target))}><span className={Number(value) > 0 ? "readiness-dot ready" : "readiness-dot"}/><span>{label}</span><strong>{summary ? value : "—"}</strong><FriendlyIcon name="arrow" size={19}/></button>)}
      </div><div className="account-summary"><span>Akun aktif <strong>{summary?.administration?.activeUsers ?? "—"}</strong></span><span>Akun nonaktif <strong>{summary?.administration?.inactiveUsers ?? "—"}</strong></span></div></section>
      <section className="panel home-actions"><p className="eyebrow">AKSES CEPAT ADMIN</p><h3>Kelola kebutuhan sekolah</h3><button onClick={() => onNavigate("Madrasah")}><FriendlyIcon name="school" size={36}/><span><strong>Madrasah, kelas & akun</strong><small>Siapkan ruang dan akses pengguna</small></span><FriendlyIcon name="arrow" size={20}/></button><button onClick={() => onNavigate("Konten belajar")}><FriendlyIcon name="content" size={36}/><span><strong>Konten pembelajaran</strong><small>Unggah materi, atur kuis, diskusi & LKPD</small></span><FriendlyIcon name="arrow" size={20}/></button><button onClick={() => onNavigate("Laporan")}><FriendlyIcon name="chart" size={36}/><span><strong>Laporan sekolah & peneliti</strong><small>Periksa kelengkapan dan unduh kegiatan</small></span><FriendlyIcon name="arrow" size={20}/></button></section></div>
    </> : <>
      <div className="home-metrics"><Metric icon="student" label="Siswa di kelas" value={summary?.students} color="blue"/><Metric icon="people" label="Kelompok belajar" value={summary?.groups} color="mint"/><Metric icon="content" label="Konten terbit" value={summary?.publishedMaterials} color="peach"/><Metric icon="sprout" label="Aksi diverifikasi" value={summary?.verifiedActions} color="lilac"/></div>
      <div className="home-information-grid"><section className="panel"><div className="section-heading"><div><p className="eyebrow">TINDAK LANJUT</p><h3>Yang perlu perhatian</h3></div><FriendlyIcon name="warning" size={36}/></div><div className="teacher-queue">
        {[
          ["Tugas / proyek perlu dinilai",summary?.pendingSubmissions,"Tinjauan","task"],["Uraian kuis perlu dinilai",summary?.pendingAssessmentReviews,"Tinjauan","quiz"],["Refleksi pribadi perlu dibalas",summary?.pendingReflections,"Tinjauan","heart"],["Catatan belum ditinjau", summary ? Math.max(0,summary.notes-summary.reviewedNotes) : undefined, "Tinjauan", "note"],
          ["Jawaban latihan menunggu", summary?.pendingPracticeReviews, "Tinjauan", "practice"],
          ["LKPD perlu tindak lanjut", summary ? Math.max(0,summary.submittedWorks-summary.reviewedWorks) : undefined, "Kelasku", "lkpd"],
          ["Rencana aksi belum diverifikasi", summary ? Math.max(0,summary.actionPlans-summary.verifiedActions) : undefined, "Kelasku", "sprout"],
        ].map(([label,value,target,icon]) => <button key={String(label)} onClick={() => onNavigate(String(target))}><FriendlyIcon name={icon as IconName} size={28}/><span>{label}</span><strong>{value ?? "—"}</strong><FriendlyIcon name="arrow" size={19}/></button>)}
      </div></section><section className="panel home-actions"><p className="eyebrow">KEGIATAN KELAS</p><h3>Siapkan pembelajaran berikutnya</h3><button onClick={() => onNavigate("Konten kelas")}><FriendlyIcon name="content" size={35}/><span><strong>Materi, kuis & diskusi</strong><small>{summary?.draftMaterials ?? "—"} konten masih draf</small></span><FriendlyIcon name="arrow" size={20}/></button><button onClick={() => onNavigate("Kelasku")}><FriendlyIcon name="people" size={35}/><span><strong>Kelompok, LKPD & aksi</strong><small>{summary?.actionJournals ?? "—"} jurnal pelaksanaan tercatat</small></span><FriendlyIcon name="arrow" size={20}/></button><button onClick={() => onNavigate("Laporan")}><FriendlyIcon name="chart" size={35}/><span><strong>Laporan kelas</strong><small>{summary?.observations ?? "—"} catatan observasi</small></span><FriendlyIcon name="arrow" size={20}/></button></section></div>
    </>}
    <div className="home-metrics"><Metric icon="course" label="Mapel" value={summary?.courses} color="blue"/><Metric icon="task" label="Tugas / proyek" value={summary?.assignments} color="mint"/><Metric icon="quiz" label="Kuis banyak soal" value={summary?.assessments} color="peach"/><Metric icon="progress" label="Penanda pertemuan selesai" value={summary?.completedLessons} color="lilac"/></div><section className="panel"><div className="section-heading"><div><p className="eyebrow">{admin ? "PEMANTAUAN KONTEN" : "BAHAN BELAJAR ANDA"}</p><h3>Unggahan terbaru</h3></div><button className="text-button" onClick={() => onNavigate(admin ? "Konten belajar" : "Konten kelas")}>Kelola konten <FriendlyIcon name="arrow" size={20}/></button></div>
      {!recent.length ? <div className="soft-note">Belum ada materi atau kuis yang diunggah. LKPD utama dari dokumen pendukung tersedia melalui Konten pembelajaran.</div> : <div className="recent-uploads">{recent.map(m => <article key={m.id}><span className={"content-type-badge "+m.kind}>{m.kind === "quiz" ? "Kuis" : "Materi"}</span><div><strong>{m.title}</strong><small>{m.uploadedBy?.name ?? "Pengunggah belum tercatat"} · {classrooms.find(c => c.id === m.classroomId)?.name ?? "Kelas"} · {new Date(m.updatedAt).toLocaleDateString("id-ID")}</small></div><span className={"status-badge "+m.status}>{m.status === "published" ? "Terbit" : "Draf"}</span></article>)}</div>}
    </section>
  </div>;
}
