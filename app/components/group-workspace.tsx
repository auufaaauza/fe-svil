"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { apiRequest, loadPages } from "../lib/api";
import { lessons } from "../lib/learning";
import { useSession, type Account } from "./session-provider";
import { FriendlyIcon } from "./friendly-icon";
import { ThemeSelect } from "./theme-select";
import { QuestionVisual } from "./question-visual";

import { YouTubePlayer } from "./learning-media";
type Group = { id: number; classroom_id: number; name: string; users: { id: number; name: string }[] };
type Work = { id: number; version: number; topic: number; answers: Record<string,string>; status: string; feedback: string | null; product_value: number | null; presentation_value: number | null; product_scores: Record<string,number> | null; presentation_scores: Record<string,number> | null };
type WorkBundle = { module: { videoId?:string|null; videoCaption?:string|null; title: string; instructions: string; version: number }; data: Work | null; fields: { key: string; label: string; hint: string; phase: number; source?: string }[]; guidance?: Record<string,Record<string,{label:string;levels:Record<string,string>}>>; rubrics: { product: Record<string,string>; presentation: Record<string,string> } };
type Journal = { id: number; occurred_on: string; activity: string; evidence: string; obstacle: string | null; plan_version: number };
type Plan = { id: number; version: number; title: string; start_date: string; location: string; indicator: string; steps: string; responsibilities: string; evidence_method: string; verified_at: string | null; teacher_feedback: string | null; journals: Journal[] };
const statusLabels: Record<string,string> = { draft: "Masih disusun", submitted: "Sudah dikirim ke guru", needs_revision: "Yuk, perbaiki bersama", reviewed: "Sudah ditinjau guru" };
const messageOf = (cause: unknown) => cause instanceof Error ? cause.message : "Belum berhasil. Coba lagi, ya.";

export function WorkForm({ group, topic, staff }: { group: Group; topic: number; staff: boolean }) {
  const [fieldPage, setFieldPage] = useState(0);
  const [bundle, setBundle] = useState<WorkBundle | null>(null);
  const [answers, setAnswers] = useState<Record<string,string>>({});
  const [feedback, setFeedback] = useState("");
  const [rubric, setRubric] = useState(false);
  const [scores, setScores] = useState<Record<string,string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    apiRequest<WorkBundle>(`/groups/${group.id}/work/${topic}`).then(result => {
      if (!active) return;
      setBundle(result); setAnswers(result.data?.answers ?? {}); setFeedback(result.data?.feedback ?? "");
      setRubric(Boolean(result.data?.product_scores));
      setScores(Object.fromEntries([...Object.entries(result.data?.product_scores ?? {}).map(([k,v]) => [`product.${k}`,String(v)]), ...Object.entries(result.data?.presentation_scores ?? {}).map(([k,v]) => [`presentation.${k}`,String(v)])]));
    }).catch(cause => { if (active) setError(messageOf(cause)); });
    return () => { active = false; };
  }, [group.id,topic,reload]);
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const status = ((event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)?.value ?? "draft";
    if (status === "submitted") { const missing = bundle!.fields.findIndex(f => !answers[f.key]?.trim()); if (missing >= 0) { setFieldPage(Math.floor(missing/4)); setError("Masih ada bagian yang perlu dilengkapi. Yuk, isi dahulu sebelum mengirim."); setBusy(false); return; } }
    try {
      const result = await apiRequest<{ data: Work }>(`/groups/${group.id}/work/${topic}`, { method: "PUT", body: JSON.stringify({ version: bundle?.data?.version ?? 0, status, answers }), successMessage: status === "submitted" ? "LKPD kelompokmu berhasil dikirim ke guru." : "Draf LKPD kelompokmu berhasil disimpan.", notifyError: true });
      setBundle(previous => previous ? { ...previous, data: result.data } : previous);
      setMessage(status === "submitted" ? "LKPD kelompokmu sudah dikirim. Terima kasih sudah bekerja sama!" : "Draf kelompokmu tersimpan.");
    } catch (cause) { setError(messageOf(cause)); } finally { setBusy(false); }
  };
  const review = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!bundle?.data) return; setBusy(true); setError(""); setMessage("");
    const status = ((event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)?.value ?? "reviewed";
    const body: Record<string,unknown> = { version: bundle.data.version, status, feedback, product_scores: null, presentation_scores: null };
    if (rubric && topic === 3) for (const name of ["product","presentation"] as const) body[name+"_scores"] = Object.fromEntries(Object.keys(bundle.rubrics[name]).map(key => [key,Number(scores[name+"."+key])]));
    try {
      const result = await apiRequest<{ data: Work }>(`/group-work/${bundle.data.id}/review`, { method: "PUT", body: JSON.stringify(body), successMessage: "Tinjauan LKPD berhasil disimpan.", notifyError: true });
      setBundle({ ...bundle, data: result.data }); setMessage("Tinjauan dan rubrik tersimpan. Riwayat jawaban tetap dipertahankan.");
    } catch (cause) { setError(messageOf(cause)); } finally { setBusy(false); }
  };
  if (!bundle) return <section className="panel"><p role="status">{error || "Menyiapkan LKPD kelompokmu…"}</p></section>;
  return <section className="panel work-panel"><div className="section-heading"><div><p className="eyebrow">LKPD {topic+1} · {group.name.toUpperCase()}</p><h2>{bundle.module.title}</h2></div><span className="soft-badge">{statusLabels[bundle.data?.status ?? "draft"]}</span></div>
    <YouTubePlayer videoId={bundle.module.videoId} title={bundle.module.title} caption={bundle.module.videoCaption}/><p className="helper">{bundle.module.instructions}</p><p className="helper">Diskusikan bersama kelompok. Simpan draf sebelum berpindah. Refleksi perasaan tetap ditulis masing-masing di halaman Ceritaku.</p>
    {error && <div className="form-error" role="alert">{error}<button type="button" className="text-button" onClick={() => { setError(""); setReload(value => value+1); }}>Ambil versi terbaru</button></div>}{message && <p className="notice" role="status">{message}</p>}
    <div className="work-pagination"><button type="button" className="button secondary" disabled={busy || fieldPage===0} onClick={() => setFieldPage(p=>p-1)}>Sebelumnya</button><span>Lembar {fieldPage+1} dari {Math.ceil(bundle.fields.length/4)}</span><button type="button" className="button secondary" disabled={busy || (fieldPage+1)*4>=bundle.fields.length} onClick={() => setFieldPage(p=>p+1)}>Berikutnya</button></div>
    <form onSubmit={save}><fieldset disabled={busy} className="work-fields">{bundle.fields.slice(fieldPage*4,fieldPage*4+4).map(field => <section className="work-question" key={field.key}><label className="field-label work-question-title" htmlFor={`work-${field.key}`}>{field.label}</label><p className="helper">{field.hint}</p>{staff && field.source && <small className="source-reference">{field.source}</small>}{!bundle.module.videoId&&<QuestionVisual topic={topic} phase={field.phase}/>}<textarea id={`work-${field.key}`} rows={4} maxLength={8000} readOnly={staff} value={answers[field.key] ?? ""} onChange={e => setAnswers(previous => ({ ...previous,[field.key]: e.target.value }))} placeholder={staff ? "Belum ada jawaban kelompok" : "Tulis hasil diskusi kelompokmu di sini…"}/></section>)}
    {!staff && <div className="form-actions"><button className="button secondary" value="draft">Simpan draf</button><button className="button primary" value="submitted">Kirim ke guru <FriendlyIcon name="arrow" size={23}/></button></div>}</fieldset></form>
    {bundle.data?.feedback && <div className="teacher-feedback"><FriendlyIcon name="heart" size={32}/><div><strong>Pesan dari guru</strong><p>{bundle.data.feedback}</p></div></div>}
    {(bundle.data?.product_value != null || bundle.data?.presentation_value != null) && <div className="work-outcomes"><div>Nilai produk<strong>{bundle.data.product_value ?? "Belum dinilai"}</strong></div><div>Nilai presentasi<strong>{bundle.data.presentation_value ?? "Belum dinilai"}</strong></div></div>}
    {staff && bundle.data && bundle.data.status !== "draft" && <form className="review-box" onSubmit={review}><h3>Tinjauan guru</h3><label className="field-label" htmlFor="work-feedback">Apresiasi dan langkah perbaikan</label><textarea id="work-feedback" required maxLength={3000} rows={3} value={feedback} onChange={e => setFeedback(e.target.value)}/>{topic === 3 && <><label className="checkbox-label"><input type="checkbox" checked={rubric} onChange={e => setRubric(e.target.checked)}/> Sertakan rubrik produk dan presentasi</label>{rubric && <div className="rubric-grid">{(["product","presentation"] as const).map(name => <fieldset key={name}><legend>{name === "product" ? "Produk · maksimum 16" : "Presentasi · maksimum 8"}</legend>{Object.entries(bundle.rubrics[name]).map(([key,label]) => <label className="score-field" key={key}><span>{label}</span><input type="number" min={1} max={4} step={1} required value={scores[name+"."+key] ?? ""} aria-label={`${name}: ${label}`} onChange={e => setScores(previous => ({ ...previous,[name+"."+key]:e.target.value }))}/><small className="rubric-descriptor">{bundle.guidance?.[name]?.[key]?.levels[scores[name+"."+key]] ?? "Pilih skor 1–4 untuk melihat pedoman RPPM."}</small></label>)}</fieldset>)}</div>}</>}<div className="form-actions"><button className="button secondary" value="needs_revision" disabled={busy}>Minta perbaikan</button><button className="button primary" value="reviewed" disabled={busy}>Simpan tinjauan</button></div></form>}
  </section>;
}

function ActionForm({ group, staff }: { group: Group; staff: boolean }) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState<Record<string,string>>({});
  const [journal, setJournal] = useState({ occurred_on: "", activity: "", evidence: "", obstacle: "" });
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const journalId = useRef<string | null>(null);
  const setPlanData = (data: Plan | null) => {
    setPlan(data); setFeedback(data?.teacher_feedback ?? "");
    setFields(Object.fromEntries(["title","start_date","location","indicator","steps","responsibilities","evidence_method"].map(key => [key,String(data?.[key as keyof Plan] ?? "").slice(0,key === "start_date" ? 10 : undefined)])));
  };
  useEffect(() => {
    let active = true;
    apiRequest<{ data: Plan | null }>(`/groups/${group.id}/action`).then(response => { if (active) setPlanData(response.data); }).catch(cause => { if (active) setError(messageOf(cause)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [group.id]);
  const savePlan = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try { const response = await apiRequest<{ data: Plan }>(`/groups/${group.id}/action`,{ method:"PUT",body:JSON.stringify({ ...fields,version:plan?.version ?? 0 }) }); setPlanData(response.data); setMessage("Rencana aksi kelompokmu tersimpan. Lakukan dengan aman bersama pendamping."); }
    catch (cause) { setError(messageOf(cause)); } finally { setBusy(false); }
  };
  const addJournal = async (event: FormEvent) => {
    event.preventDefault(); if (!plan) return; setBusy(true); setError(""); setMessage(""); journalId.current ??= crypto.randomUUID();
    try {
      await apiRequest(`/actions/${plan.id}/journals`,{ method:"POST",body:JSON.stringify({ ...journal,request_id:journalId.current }) });
      journalId.current = null; setJournal({ occurred_on:"",activity:"",evidence:"",obstacle:"" });
      const response = await apiRequest<{ data: Plan }>(`/groups/${group.id}/action`); setPlanData(response.data); setMessage("Jurnal pelaksanaan tersimpan. Terima kasih sudah mencatat dengan jujur.");
    } catch (cause) { setError(messageOf(cause)); } finally { setBusy(false); }
  };
  const verify = async (event: FormEvent) => {
    event.preventDefault(); if (!plan) return; setBusy(true); setError("");
    try { const response = await apiRequest<{ data: Plan }>(`/actions/${plan.id}/verify`,{ method:"PUT",body:JSON.stringify({ feedback,version:plan.version }) }); setPlanData(response.data); setMessage("Bukti pelaksanaan telah diverifikasi."); }
    catch (cause) { setError(messageOf(cause)); } finally { setBusy(false); }
  };
  if (loading) return <section className="panel" role="status">Menyiapkan ruang aksi…</section>;
  const labels: Record<string,string> = { title:"Nama aksi kelompok",start_date:"Mulai kapan?",location:"Di mana?",indicator:"Apa tanda bahwa aksi berhasil?",steps:"Apa langkah aman yang akan dilakukan?",responsibilities:"Bagaimana pembagian tugasnya?",evidence_method:"Bagaimana kalian mencatat buktinya?" };
  return <section className="panel action-panel"><div className="section-heading"><div><p className="eyebrow">AKSI CINTA INDONESIA</p><h2>Dari rencana menjadi kebaikan.</h2></div><span className="soft-badge">{plan?.verified_at ? "Diverifikasi guru" : plan?.journals.length ? "Sudah ada jurnal" : "Rencana aksi"}</span></div><QuestionVisual topic={3} phase={4}/>{error && <p className="form-error" role="alert">{error}</p>}{message && <p className="notice" role="status">{message}</p>}
    {staff && !plan ? <div className="soft-note">Kelompok ini belum menyimpan rencana aksi.</div> : <form onSubmit={savePlan}><fieldset disabled={busy} className="work-fields">{Object.entries(labels).map(([key,label]) => <div key={key}><label className="field-label" htmlFor={`action-${key}`}>{label}</label>{["title","location","start_date"].includes(key) ? <input id={`action-${key}`} type={key === "start_date" ? "date" : "text"} required readOnly={staff} maxLength={key === "title" ? 150 : 200} value={fields[key] ?? ""} onChange={e => setFields(previous => ({ ...previous,[key]:e.target.value }))}/> : <textarea id={`action-${key}`} required readOnly={staff} maxLength={3000} rows={3} value={fields[key] ?? ""} onChange={e => setFields(previous => ({ ...previous,[key]:e.target.value }))}/>}</div>)}{!staff && <div className="form-actions"><button className="button primary">Simpan rencana aksi <FriendlyIcon name="sprout" size={25}/></button></div>}</fieldset></form>}
    {plan && <section className="action-journal"><h3>Jurnal pelaksanaan</h3><p className="helper">Catat kegiatan yang benar-benar dilakukan. Jurnal atau checklist dapat menjadi bukti tanpa foto.</p>{!plan.journals.length && <p className="soft-note">Belum ada jurnal. Rencana belum dihitung sebagai aksi yang terlaksana.</p>}{plan.journals.map(entry => <article className="journal-entry" key={entry.id}><span>{entry.occurred_on.slice(0,10)} · versi rencana {entry.plan_version}</span><h4>{entry.activity}</h4><p><strong>Bukti:</strong> {entry.evidence}</p>{entry.obstacle && <p><strong>Kendala:</strong> {entry.obstacle}</p>}</article>)}
    {!staff && <form className="review-box" onSubmit={addJournal}><fieldset className="work-fields" disabled={busy}><h3>Tambah catatan aksi</h3>{Object.entries({ occurred_on:"Tanggal kegiatan",activity:"Apa yang sudah kalian lakukan?",evidence:"Bukti atau hasil yang dapat diperiksa",obstacle:"Apa kendalanya? (boleh kosong)" }).map(([key,label]) => <div key={key}><label className="field-label" htmlFor={`journal-${key}`}>{label}</label>{key === "occurred_on" ? <input id={`journal-${key}`} type="date" required value={journal.occurred_on} onChange={e => { journalId.current=null; setJournal(previous => ({ ...previous,occurred_on:e.target.value })); }}/> : <textarea id={`journal-${key}`} rows={3} maxLength={3000} required={key !== "obstacle"} value={journal[key as keyof typeof journal]} onChange={e => { journalId.current=null; setJournal(previous => ({ ...previous,[key]:e.target.value })); }}/>}</div>)}<div className="form-actions"><button className="button primary">Simpan jurnal</button></div></fieldset></form>}
    {staff && plan.journals.length > 0 && <form className="review-box" onSubmit={verify}><label className="field-label" htmlFor="verify-action">Catatan pemeriksaan guru</label><textarea id="verify-action" required maxLength={3000} rows={3} value={feedback} onChange={e => setFeedback(e.target.value)}/><div className="form-actions"><button className="button primary" disabled={busy}>Verifikasi pelaksanaan <FriendlyIcon name="check" size={24}/></button></div></form>}
    {plan.teacher_feedback && <div className="teacher-feedback"><FriendlyIcon name="heart" size={32}/><div><strong>Apresiasi dari guru</strong><p>{plan.teacher_feedback}</p></div></div>}</section>}
  </section>;
}

export function GroupWorkspace({ actionsOnly = false }: { actionsOnly?: boolean }) {
  const { user, activeClass, classrooms } = useSession();
  const staff = user?.role !== "student";
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<Account[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [topic, setTopic] = useState(0);
  const [tab, setTab] = useState(actionsOnly ? "action" : "work");
  const [name, setName] = useState("");
  const [studentIds, setStudentIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    if (!activeClass) return;
    Promise.all([loadPages<Group>("/groups"),staff ? loadPages<Account>(`/classrooms/${activeClass}/members`) : Promise.resolve([])]).then(([all,people]) => {
      if (!active) return;
      setGroups(all.filter(g => g.classroom_id === activeClass && (staff || g.users.some(member => member.id === user?.id)))); setMembers(people.filter(person => person.role === "student"));
    }).catch(cause => { if (active) setError(messageOf(cause)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  },[activeClass,staff,user?.id,reload]);
  const group = groups.find(g => String(g.id) === selectedId) ?? groups[0];
  const classroom = classrooms.find(c => c.id === activeClass);
  const available = members.filter(member => !groups.some(g => g.users.some(person => person.id === member.id)));
  const createGroup = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    try { await apiRequest("/groups",{ method:"POST",body:JSON.stringify({ classroom_id:activeClass,name,student_ids:studentIds }) }); setName(""); setStudentIds([]); setReload(value => value+1); }
    catch (cause) { setError(messageOf(cause)); } finally { setBusy(false); }
  };
  if (!activeClass) return <section className="panel"><FriendlyIcon name="people" size={60}/><h2>Ruang kelompokmu sedang disiapkan.</h2><p>Minta guru atau admin menghubungkan akunmu dengan kelas.</p></section>;
  return <div className="group-workspace">{error && <p className="form-error" role="alert">{error}</p>}
    {staff && <section className="panel"><div className="section-heading"><h2>Kelompok dan kelas</h2><FriendlyIcon name="people" size={43}/></div>{classroom?.joinCode && <div className="class-invitation"><strong>Kode daftar siswa · {classroom.name}</strong><code>{classroom.joinCode}</code><p>Bagikan hanya kepada siswa kelas ini.</p></div>}<form onSubmit={createGroup} className="group-create-form"><label className="field-label" htmlFor="group-name">Nama kelompok baru</label><input id="group-name" value={name} onChange={e => setName(e.target.value)} required maxLength={80}/><fieldset className="group-members"><legend>Pilih anggota · maksimum 10 siswa</legend>{available.map(member => <label className="checkbox-label" key={member.id}><input type="checkbox" checked={studentIds.includes(member.id)} onChange={e => setStudentIds(previous => e.target.checked ? [...previous,member.id] : previous.filter(id => id !== member.id))}/>{member.name}</label>)}{!available.length && <p className="helper">Belum ada siswa tanpa kelompok. Siswa baru dapat mendaftar memakai kode kelas.</p>}</fieldset><button className="button secondary" disabled={busy || !studentIds.length || studentIds.length > 10}>Buat kelompok <FriendlyIcon name="plus" size={24}/></button></form></section>}
    {loading ? <p role="status">Memuat kelompok…</p> : !group ? <section className="panel"><FriendlyIcon name="people" size={60}/><h2>Belajar bersama, saling membantu.</h2><p>{staff ? "Buat kelompok pertama setelah siswa terdaftar di kelas." : "Gurumu akan menyiapkan kelompok. Kamu tetap bisa membaca materi dan menulis refleksi pribadi."}</p></section> : <><section className="panel group-overview"><div><span className="soft-badge">KELOMPOK BELAJAR</span><h2>{group.name}</h2><p>{group.users.map(member => member.name).join(" · ")}</p></div>{staff && <ThemeSelect label="Pilih kelompok" value={group.id} options={groups.map(g => ({ value:String(g.id),label:g.name }))} onChange={setSelectedId}/>}</section>
      {!actionsOnly && <div className="workspace-toolbar"><div className="segmented-control"><button className={tab === "work" ? "selected" : ""} onClick={() => setTab("work")}>LKPD kelompok</button><button className={tab === "action" ? "selected" : ""} onClick={() => setTab("action")}>Aksi nyata</button></div>{tab === "work" && <ThemeSelect label="Pertemuan LKPD" value={topic} onChange={value => setTopic(Number(value))} options={lessons.map((l,i) => ({ value:String(i),label:`LKPD ${i+1} · ${l.title}` }))}/>}</div>}
      {actionsOnly || tab === "action" ? <ActionForm key={`action-${group.id}`} group={group} staff={staff}/> : <WorkForm key={`work-${group.id}-${topic}`} group={group} topic={topic} staff={staff}/>}</>}
  </div>;
}
