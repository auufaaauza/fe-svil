"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiRequest, loadPages } from "../lib/api";
import { useSession } from "./session-provider";
import { ThemeSelect } from "./theme-select";
import { FriendlyIcon } from "./friendly-icon";
import { NotesReview } from "./server-panels";
import { lessons } from "../lib/learning";
import { QuestionVisual } from "./question-visual";

import { SubmissionReview } from "./assignment-workspace";
import { AssessmentReview } from "./assessment-workspace";
import { useMembers } from "./lms-shared";
export type Attempt = {
  id: number; student_id: number; material_id: string; answer: { text?: string; choice?: number };
  correct: boolean | null; teacher_feedback: string | null; reviewed_at: string | null; review_version: number; created_at: string;
  question_snapshot?: { type: string; prompt: string; options?: string[]; correctIndex?: number | null; modelAnswer?: string };
  material: { id: string; title: string; topic: number; classroom_id: number };
};
export type Observation = {
  id: number; classroom_id: number; student_id: number; topic: number; occasion: number; version: number;
  observed_on: string; evidence: string; feedback: string; scores: Record<string, number>;
};
type Member = { id: number; name: string; role: string };
const observationAspects = [
  { key: "participation", label: "Partisipasi, berpikir kritis dan menghormati pendapat" }, { key: "empathy", label: "Empati dan kepedulian pada lingkungan/pekerja" },
  { key: "honesty", label: "Kejujuran dalam data dan refleksi" }, { key: "responsibility", label: "Tanggung jawab pada rencana/tindakan aksi" },
];
const localDate = () => new Date().toLocaleDateString("en-CA");

function useRows<T>(path: string | null) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const reload = useCallback(async () => {
    if(!path)return;
    const result = await loadPages<T>(path);
    setRows(result); setError("");
  }, [path]);
  useEffect(() => {
    let alive = true;
    if(!path){setRows([]);setLoading(false);return;}
    setLoading(true); setError("");
    loadPages<T>(path,undefined,{maxAgeMs:30000}).then(result => { if (alive) setRows(result); })
      .catch(e => { if (alive) setError(e.message); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [path]);
  return { rows, reload, loading, error };
}
function LoadState({ loading, error, retry }: { loading: boolean; error: string; retry: () => void }) {
  return <>{loading && <p role="status">Memuat catatan belajar…</p>}{error && <p className="form-error" role="alert">{error} <button className="text-button" onClick={retry}>Muat lagi</button></p>}</>;
}

export function TeacherAssessment() {
  const [tab, setTab] = useState("submissions");
  return <div className="assessment-workspace">
    <div className="segmented-tabs" aria-label="Jenis tinjauan">
      {[["submissions","Tugas & proyek"],["assessments","Kuis banyak soal"],["notes", "Catatan siswa"], ["attempts", "Latihan singkat"], ["observations", "Observasi"]].map(([key, label]) =>
        <button type="button" key={key} aria-pressed={tab === key} className={tab === key ? "selected" : ""} onClick={() => setTab(key)}>{label}</button>)}
    </div>
    {tab === "submissions" ? <SubmissionReview/> : tab === "assessments" ? <AssessmentReview/> : tab === "notes" ? <NotesReview/> : tab === "attempts" ? <AttemptsReview/> : <ObservationWorkspace/>}
  </div>;
}

function AttemptsReview() {
  const members=useMembers();
  const { activeClass } = useSession();
  const { rows, loading, error, reload } = useRows<Attempt>("/attempts");
  const [selected, setSelected] = useState<number | null>(null);
  const [retryError, setRetryError] = useState("");
  const attempts = rows.filter(a => a.material?.classroom_id === activeClass);
  const attempt = attempts.find(a => a.id === selected);
  const retry = () => reload().catch(e => setRetryError(e.message));
  return <div className="workshop-layout assessment-review-layout"><section className="panel">
    <div className="section-heading"><h2>Jawaban latihan siswa</h2><FriendlyIcon name="book" size={40}/></div>
    <p>Jawaban terbuka dan pilihan tanpa kunci dapat diberi tinjauan. Cerita pribadi boleh mendapat umpan balik tanpa label benar atau salah.</p>
    <LoadState loading={loading} error={error || retryError} retry={retry}/>
    {!loading && !error && !attempts.length && <div className="soft-note">Belum ada jawaban latihan pada kelas ini.</div>}
    <div className="material-library">{attempts.map(a => <button type="button" className={"library-item "+(selected === a.id ? "selected" : "")} key={a.id} onClick={() => setSelected(a.id)}>
      <strong>{members.rows.find(m=>m.id===a.student_id)?.name??"P-"+a.student_id} · {a.material.title}</strong><small>{a.reviewed_at ? "Sudah ditinjau guru" : a.correct !== null ? "Dinilai otomatis" : "Menunggu tinjauan"}</small>
    </button>)}</div>
  </section><aside className="panel">{attempt ? <AttemptReviewForm key={attempt.id+"-"+attempt.review_version} attempt={attempt} onSaved={reload}/> : <div className="library-empty"><FriendlyIcon name="edit" size={55}/><p>Pilih jawaban yang ingin ditinjau.</p></div>}</aside></div>;
}
function AttemptReviewForm({ attempt, onSaved }: { attempt: Attempt; onSaved: () => Promise<void> }) {
  const q = attempt.question_snapshot;
  const keyed = q?.type === "choice" && q.correctIndex !== undefined && q.correctIndex !== null;
  const [judgement, setJudgement] = useState(attempt.correct === null ? "feedback" : attempt.correct ? "true" : "false");
  const [feedback, setFeedback] = useState(attempt.teacher_feedback ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const answer = attempt.answer.text ?? q?.options?.[attempt.answer.choice ?? -1] ?? "Pilihan "+String((attempt.answer.choice ?? 0)+1);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      await apiRequest("/attempts/"+attempt.id+"/review", { method: "PUT", body: JSON.stringify({ version: attempt.review_version, correct: judgement === "feedback" ? null : judgement === "true", feedback }) });
      await onSaved();
    } catch (e) { setMessage(e instanceof Error ? e.message : "Tinjauan belum tersimpan."); } finally { setBusy(false); }
  };
  return <form className="material-form" onSubmit={submit}><span className="soft-badge">P-{attempt.student_id}</span><h3>{attempt.material.title}</h3>
    <QuestionVisual topic={attempt.material.topic}/><strong>{q?.prompt}</strong><blockquote className="answer-quote">{answer}</blockquote>
    {q?.modelAnswer && <div className="soft-note"><strong>Pedoman guru</strong><p>{q.modelAnswer}</p></div>}
    {keyed ? <div className="soft-note">Jawaban berkunci dinilai otomatis: {attempt.correct ? "tepat" : "belum tepat"}.</div> : <>
      <label className="field-label" htmlFor="review-judgement">Hasil tinjauan</label><ThemeSelect id="review-judgement" label="Hasil tinjauan" value={judgement} disabled={busy} onChange={setJudgement} options={[{ value: "feedback", label: "Umpan balik saja", description: "Untuk cerita dan refleksi terbuka" }, { value: "true", label: "Sudah tepat" }, { value: "false", label: "Masih perlu bimbingan" }]}/>
      <label className="field-label" htmlFor="attempt-feedback">Apresiasi dan saran</label><textarea id="attempt-feedback" required rows={4} maxLength={3000} disabled={busy} value={feedback} onChange={e => setFeedback(e.target.value)}/>
      <button className="button primary" disabled={busy}>{busy ? "Menyimpan…" : "Simpan tinjauan"}<FriendlyIcon name="check"/></button>
    </>}
    {attempt.reviewed_at && <p className="helper">Tinjauan tersimpan. Siswa dapat membacanya pada halaman Ceritaku.</p>}
    {message && <p className="form-error" role="alert">{message}<button type="button" className="text-button" disabled={busy} onClick={() => onSaved().catch(e => setMessage(e.message))}>Muat versi terbaru</button></p>}
  </form>;
}

function ObservationWorkspace() {
  const { activeClass } = useSession();
  const { rows, loading, error, reload } = useRows<Observation>("/observations");
  const [members, setMembers] = useState<Member[]>([]);
  const [memberError, setMemberError] = useState("");
  const [studentId, setStudentId] = useState("");
  const [topic, setTopic] = useState("0");
  const [occasion, setOccasion] = useState("1");
  useEffect(() => {
    let alive = true;
    if (!activeClass) return;
    loadPages<Member>("/classrooms/"+activeClass+"/members").then(result => { if (alive) setMembers(result.filter(m => m.role === "student")); })
      .catch(e => { if (alive) setMemberError(e.message); });
    return () => { alive = false; };
  }, [activeClass]);
  const existing = rows.find(r => r.classroom_id === activeClass && r.student_id === Number(studentId) && r.topic === Number(topic) && r.occasion === Number(occasion));
  if (!activeClass) return <section className="panel"><p className="soft-note">Siapkan kelas terlebih dahulu melalui admin.</p></section>;
  return <section className="panel"><div className="section-heading"><h2>Observasi proses belajar</h2><FriendlyIcon name="people" size={40}/></div>
    <p>Catat perilaku yang benar-benar diamati pada dua kesempatan berbeda. Empat aspek diberi skor 1–4, disertai bukti dan saran. Nilai observasi terpisah dari produk dan presentasi.</p>
    <LoadState loading={loading} error={error || memberError} retry={() => reload().catch(e => setMemberError(e.message))}/>
    <div className="observation-selection">
      <div><label className="field-label" htmlFor="observation-student">Siswa</label><ThemeSelect id="observation-student" label="Siswa yang diamati" value={studentId} onChange={setStudentId} placeholder="Pilih siswa" options={members.map(m => ({ value: String(m.id), label: m.name, description: "P-"+m.id }))}/></div>
      <div><label className="field-label" htmlFor="observation-topic">Pertemuan</label><ThemeSelect id="observation-topic" label="Pertemuan observasi" value={topic} onChange={setTopic} options={lessons.map((l,i) => ({ value: String(i), label: (i+1)+". "+l.short }))}/></div>
      <div><label className="field-label" htmlFor="observation-occasion">Kesempatan</label><ThemeSelect id="observation-occasion" label="Kesempatan observasi" value={occasion} onChange={setOccasion} options={[{ value: "1", label: "Pengamatan pertama" }, { value: "2", label: "Pengamatan kedua" }]}/></div>
    </div>
    {studentId && <ObservationForm key={studentId+"-"+topic+"-"+occasion+"-"+(existing?.version ?? 0)} existing={existing} classroomId={activeClass} studentId={Number(studentId)} topic={Number(topic)} occasion={Number(occasion)} onSaved={reload}/>}
    {!members.length && !memberError && <div className="soft-note">Belum ada siswa terdaftar di kelas ini.</div>}
  </section>;
}
function ObservationForm({ existing, classroomId, studentId, topic, occasion, onSaved }: { existing?: Observation; classroomId: number; studentId: number; topic: number; occasion: number; onSaved: () => Promise<void> }) {
  const [date, setDate] = useState(existing?.observed_on.slice(0,10) ?? localDate());
  const [scores, setScores] = useState<Record<string, number>>(existing?.scores ?? {});
  const [evidence, setEvidence] = useState(existing?.evidence ?? "");
  const [feedback, setFeedback] = useState(existing?.feedback ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      await apiRequest("/observations", { method: "POST", body: JSON.stringify({ classroom_id: classroomId, student_id: studentId, topic, occasion, version: existing?.version ?? 0, observed_on: date, scores, evidence, feedback }) });
      await onSaved();
    } catch (e) { setMessage(e instanceof Error ? e.message : "Observasi belum tersimpan."); } finally { setBusy(false); }
  };
  return <form className="material-form observation-form" onSubmit={submit}><fieldset disabled={busy}>
    <legend>{existing ? "Perbaiki catatan pengamatan" : "Catatan pengamatan baru"}</legend>
    <label className="field-label" htmlFor="observation-date">Tanggal pengamatan</label><input id="observation-date" type="date" required max={localDate()} value={date} onChange={e => setDate(e.target.value)}/>
    <div className="rubric-fields">{observationAspects.map(a => <label key={a.key} className="field-label">{a.label}<input type="number" min={1} max={4} required value={scores[a.key] ?? ""} onChange={e => setScores({ ...scores, [a.key]: Number(e.target.value) })}/></label>)}</div>
    <p className="helper">1: belum tampak dan perlu pendampingan · 2: kadang muncul dan perlu pengingat · 3: tampak baik dengan sedikit arahan · 4: konsisten dan mandiri, dengan contoh konkret.</p>
    <label className="field-label" htmlFor="observation-evidence">Perilaku atau kejadian yang menjadi bukti</label><textarea id="observation-evidence" required maxLength={3000} rows={3} value={evidence} onChange={e => setEvidence(e.target.value)}/>
    <label className="field-label" htmlFor="observation-feedback">Apresiasi dan dukungan untuk siswa</label><textarea id="observation-feedback" required maxLength={3000} rows={3} value={feedback} onChange={e => setFeedback(e.target.value)}/>
    <button className="button primary">{busy ? "Menyimpan…" : "Simpan observasi"}<FriendlyIcon name="check"/></button>
    </fieldset>{existing && <p className="helper">Versi {existing.version} tersimpan. Perbaikan akan dicatat sebagai versi baru.</p>}
    {message && <p className="form-error" role="alert">{message}<button type="button" className="text-button" disabled={busy} onClick={() => onSaved().catch(e => setMessage(e.message))}>Muat versi terbaru</button></p>}
  </form>;
}

type ReflectionFeedback = { id:number; classroom_id:number; topic:number; feedback:string|null };

export function StudentFeedback({ materialId, generation = 0, reflections = [], reflectionsLoading = false, reflectionsError = "", reloadReflections, activity }: { materialId?: string; generation?: number; reflections?: ReflectionFeedback[]; reflectionsLoading?: boolean; reflectionsError?: string; reloadReflections?: () => Promise<unknown>; activity?: {attempts:Attempt[];observations:Observation[];loading:boolean;error:string;reload:()=>Promise<unknown>} }) {
  const { activeClass, notes } = useSession();
  const savedAttempts = useRows<Attempt>(activity?null:"/attempts"+(materialId ? "?material_id="+encodeURIComponent(materialId) : ""));
  const savedObservations = useRows<Observation>(activity?null:"/observations");
  const attempts=activity?{rows:activity.attempts,loading:activity.loading,error:activity.error,reload:activity.reload}:savedAttempts;
  const observations=activity?{rows:activity.observations,loading:activity.loading,error:activity.error,reload:activity.reload}:savedObservations;
  const [retryError, setRetryError] = useState("");
  const retry = async () => { setRetryError(""); try { if(activity)await activity.reload();else await Promise.all([attempts.reload(), observations.reload(), reloadReflections?.()]); } catch (cause) { setRetryError(cause instanceof Error ? cause.message : "Pesan belum dapat dimuat."); } };
  useEffect(() => { if (generation) attempts.reload().catch(e => setRetryError(e.message)); }, [generation, attempts.reload]);
  const myAttempts = attempts.rows.filter(a => a.material?.classroom_id === activeClass);
  const myObservations = observations.rows.filter(o => o.classroom_id === activeClass);
  const reviewedNotes = notes.filter(n => n.classroom_id === activeClass && n.feedback);
  const reviewedReflections = reflections.filter(row => row.classroom_id === activeClass && row.feedback);
  const loading = attempts.loading || observations.loading || reflectionsLoading;
  const feedbackError = attempts.error || observations.error || reflectionsError || retryError;
  return <section className="panel student-feedback" id={materialId ? undefined : "teacher-messages"}><div className="section-heading"><div><p className="eyebrow">BELAJAR DAN TUMBUH</p><h2>Pesan dari gurumu</h2></div><FriendlyIcon name="heart" size={45}/></div>
    <LoadState loading={loading} error={feedbackError} retry={retry}/>
    <div className="feedback-list">
    {!materialId && reviewedReflections.map(row => <article className="feedback-card reflection-feedback-card" key={"reflection-"+row.id}><div className="section-heading"><span className="soft-badge">Refleksi pribadi · Pertemuan {row.topic+1}</span><FriendlyIcon name="heart" size={30}/></div><strong>Apresiasi dan dukungan dari gurumu</strong><p className="reflection-feedback-text">{row.feedback}</p></article>)}
    {!materialId && reviewedNotes.map(n => <article className="feedback-card" key={"note-"+n.id}><span className="soft-badge">Ceritaku · Pertemuan {n.topic+1}</span><p>{n.content}</p><strong>Pesan guru</strong><p>{n.feedback}</p></article>)}
    {myAttempts.map(a => <article className="feedback-card" key={a.id}><span className="soft-badge">{a.material.title}</span><p>Jawabanku: {a.answer.text ?? "Pilihan "+"ABCD"[a.answer.choice ?? 0]}</p><strong>{a.reviewed_at ? "Pesan guru" : a.correct === null ? "Menunggu pesan guru" : a.correct ? "Jawabanmu sudah tepat" : "Yuk, pelajari lagi bersama guru"}</strong>{a.teacher_feedback && <p>{a.teacher_feedback}</p>}</article>)}
    {!materialId && myObservations.map(o => <article className="feedback-card" key={"observation-"+o.id}><span className="soft-badge">Kegiatan bersama · Pertemuan {o.topic+1}</span><p>{o.feedback}</p><small>Diamati pada {o.observed_on.slice(0,10)}</small></article>)}
    {!loading && !feedbackError && !myAttempts.length && (materialId || (!myObservations.length && !reviewedNotes.length && !reviewedReflections.length)) && <div className="soft-note">Setelah kamu belajar dan bercerita, pesan dari gurumu akan muncul di sini.</div>}
    </div>
  </section>;
}
