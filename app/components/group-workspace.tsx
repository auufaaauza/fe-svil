"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { apiRequest, loadPages } from "../lib/api";
import { ReflectionWorkspace } from "./reflection-workspace";
import { WordwallGames } from "./wordwall-games";
import { WorkForm } from "./lkpd-work-form";
export { WorkForm } from "./lkpd-work-form";
import { useUnsavedChanges, confirmLeave } from "../lib/unsaved-changes";
import type { LearningModule } from "./lkpd-library";
import { useSession, type Account } from "./session-provider";
import { FriendlyIcon } from "./friendly-icon";
import { ThemeSelect } from "./theme-select";
import { QuestionVisual } from "./question-visual";

type Group = { id: number; classroom_id: number; name: string; users: { id: number; name: string }[] };
type Journal = { id: number; occurred_on: string; activity: string; evidence: string; obstacle: string | null; plan_version: number };
type Plan = { id: number; version: number; title: string; start_date: string; location: string; indicator: string; steps: string; responsibilities: string; evidence_method: string; verified_at: string | null; teacher_feedback: string | null; journals: Journal[] };
const messageOf = (cause: unknown) => cause instanceof Error ? cause.message : "Belum berhasil. Coba lagi, ya.";


export function ActionForm({ group, staff }: { group: Group; staff: boolean }) {
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
    apiRequest<{ data: Plan | null }>(`/groups/${group.id}/action`).then(async response => { if(!active)return;setPlanData(response.data);if(!response.data&&!staff){try{const work=await apiRequest<{data:{answers:Record<string,string>}|null}>(`/groups/${group.id}/work/3`);if(!active)return;const a=work.data?.answers??{};setFields(current=>({...current,title:a.rencana_1??"",start_date:/^\d{4}-\d{2}-\d{2}$/.test(a.rencana_2??"")?a.rencana_2:"",location:a.rencana_3??"",responsibilities:a.rencana_4??"",steps:a.rencana_6??"",indicator:a.rencana_7??"",evidence_method:a.rencana_8??""}));}catch{ /* Existing action plans remain available when no LKPD 4 draft exists. */ }}}).catch(cause => { if (active) setError(messageOf(cause)); }).finally(() => { if (active) setLoading(false); });
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
  const planDirty=!staff&&Object.entries(fields).some(([key,value])=>value!==String(plan?.[key as keyof Plan]??"").slice(0,key==="start_date"?10:undefined));
  useUnsavedChanges(planDirty||Boolean(journal.activity||journal.evidence||journal.obstacle));
  if (loading) return <section className="panel" role="status">Menyiapkan ruang aksi…</section>;
  const labels: Record<string,string> = { title:"Nama aksi kelompok",start_date:"Mulai kapan?",location:"Di mana?",indicator:"Apa tanda bahwa aksi berhasil?",steps:"Apa langkah aman yang akan dilakukan?",responsibilities:"Bagaimana pembagian tugasnya?",evidence_method:"Bagaimana kalian mencatat buktinya?" };
  return <section className="panel action-panel"><div className="section-heading"><div><p className="eyebrow">AKSI CINTA INDONESIA</p><h2>Dari rencana menjadi kebaikan.</h2></div><span className="soft-badge">{plan?.verified_at ? "Diverifikasi guru" : plan?.journals.length ? "Sudah ada jurnal" : "Rencana aksi"}</span></div><QuestionVisual topic={3} phase={4}/>{error && <p className="form-error" role="alert">{error}</p>}{message && <p className="notice" role="status">{message}</p>}
    {staff && !plan ? <div className="soft-note">Kelompok ini belum menyimpan rencana aksi.</div> : <form onSubmit={savePlan}><fieldset disabled={busy} className="work-fields">{Object.entries(labels).map(([key,label]) => <div key={key}><label className="field-label" htmlFor={`action-${key}`}>{label}</label>{["title","location","start_date"].includes(key) ? <input id={`action-${key}`} type={key === "start_date" ? "date" : "text"} required readOnly={staff} maxLength={key === "title" ? 150 : 200} value={fields[key] ?? ""} onChange={e => setFields(previous => ({ ...previous,[key]:e.target.value }))}/> : <textarea id={`action-${key}`} required readOnly={staff} maxLength={3000} rows={3} value={fields[key] ?? ""} onChange={e => setFields(previous => ({ ...previous,[key]:e.target.value }))}/>}</div>)}{!staff && <div className="form-actions"><button className="button primary">Simpan rencana aksi <FriendlyIcon name="sprout" size={25}/></button></div>}</fieldset></form>}
    {plan && <section className="action-journal"><h3>Jurnal pelaksanaan</h3><p className="helper">Catat kegiatan yang benar-benar dilakukan. Jurnal atau checklist dapat menjadi bukti tanpa foto.</p>{!plan.journals.length && <p className="soft-note">Belum ada jurnal. Rencana belum dihitung sebagai aksi yang terlaksana.</p>}{plan.journals.map(entry => <article className="journal-entry" key={entry.id}><span>{entry.occurred_on.slice(0,10)} · versi rencana {entry.plan_version}</span><h4>{entry.activity}</h4><p><strong>Bukti:</strong> {entry.evidence}</p>{entry.obstacle && <p><strong>Kendala:</strong> {entry.obstacle}</p>}</article>)}
    {!staff && <form className="review-box" onSubmit={addJournal}><fieldset className="work-fields" disabled={busy}><h3>Tambah catatan aksi</h3>{Object.entries({ occurred_on:"Tanggal kegiatan",activity:"Apa yang sudah kalian lakukan?",evidence:"Bukti atau hasil yang dapat diperiksa",obstacle:"Apa kendalanya? (boleh kosong)" }).map(([key,label]) => <div key={key}><label className="field-label" htmlFor={`journal-${key}`}>{label}</label>{key === "occurred_on" ? <input id={`journal-${key}`} type="date" required value={journal.occurred_on} onChange={e => { journalId.current=null; setJournal(previous => ({ ...previous,occurred_on:e.target.value })); }}/> : <textarea id={`journal-${key}`} rows={3} maxLength={3000} required={key !== "obstacle"} value={journal[key as keyof typeof journal]} onChange={e => { journalId.current=null; setJournal(previous => ({ ...previous,[key]:e.target.value })); }}/>}</div>)}<div className="form-actions"><button className="button primary">Simpan jurnal</button></div></fieldset></form>}
    {staff && plan.journals.length > 0 && <form className="review-box" onSubmit={verify}><label className="field-label" htmlFor="verify-action">Catatan pemeriksaan guru</label><textarea id="verify-action" required maxLength={3000} rows={3} value={feedback} onChange={e => setFeedback(e.target.value)}/><div className="form-actions"><button className="button primary" disabled={busy}>Verifikasi pelaksanaan <FriendlyIcon name="check" size={24}/></button></div></form>}
    {plan.teacher_feedback && <div className="teacher-feedback"><FriendlyIcon name="feedback" size={32}/><div><strong>Apresiasi dari guru</strong><p>{plan.teacher_feedback}</p></div></div>}</section>}
  </section>;
}

export function GroupWorkspace({ actionsOnly = false, membershipRevision = 0 }: { actionsOnly?: boolean; membershipRevision?: number }) {
  const { user, activeClass, classrooms } = useSession();
  const staff = user?.role !== "student";
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<Account[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const query=useSearchParams();
  const meeting=Number(query.get("pertemuan"));
  const [topic, setTopic] = useState(Number.isInteger(meeting)&&meeting>=1?meeting-1:0);
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [modulesError, setModulesError] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(()=>{if(!activeClass)return;let alive=true;loadPages<LearningModule>("/learning-modules?classroom_id="+activeClass).then(rows=>{if(!alive)return;setModules(rows);const active=classrooms.find(c=>c.id===activeClass)?.activeLkpdId;const chosen=rows.find(m=>m.topic===meeting-1)??rows.find(m=>m.id===active)??rows[0];if(chosen)setTopic(chosen.topic);setModulesError("");}).catch(e=>{if(alive)setModulesError(messageOf(e));});return()=>{alive=false;};},[activeClass,staff,meeting,classrooms,reload]);
  useEffect(()=>{if(Number.isInteger(meeting)&&meeting>=1)setTopic(meeting-1);},[meeting]);
  const [tab, setTab] = useState(actionsOnly ? "action" : "work");
  const [name, setName] = useState("");
  const [studentIds, setStudentIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(()=>{
    if(!membershipRevision||!staff||!activeClass)return;
    let alive=true;
    loadPages<Account>(`/classrooms/${activeClass}/members`,undefined,{maxAgeMs:30000}).then(rows=>{if(alive)setMembers(rows.filter(row=>row.role==="student"));}).catch(cause=>{if(alive)setError(messageOf(cause));});
    return()=>{alive=false;};
  },[membershipRevision,staff,activeClass]);
  useEffect(() => {
    let active = true;
    if (!activeClass) return;
    setLoading(true);setError("");setGroups([]);
    Promise.all([loadPages<Group>("/groups",undefined,{maxAgeMs:30000}),staff ? loadPages<Account>(`/classrooms/${activeClass}/members`,undefined,{maxAgeMs:30000}) : Promise.resolve([])]).then(([all,people]) => {
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
      {modulesError&&<p className="form-error" role="alert">{modulesError}<button className="text-button" onClick={()=>setReload(v=>v+1)}>Coba lagi</button></p>}
      {!actionsOnly&&modules.length>0&&<div className="workspace-toolbar"><ThemeSelect label="LKPD kelasmu" value={topic} onChange={async value=>{if(await confirmLeave()){setTopic(Number(value));setTab("work");}}} options={modules.map(m=>({value:String(m.topic),label:m.title+(m.status==="draft"?" · Draf":"")}))}/>{staff&&<div className="segmented-control"><button className={tab==="work"?"selected":""} onClick={async()=>{if(await confirmLeave())setTab("work");}}>Jawaban LKPD</button><button className={tab==="action"?"selected":""} onClick={async()=>{if(await confirmLeave())setTab("action");}}>Rencana dan jurnal aksi</button></div>}</div>}
      {actionsOnly||tab==="action"?<ActionForm key={`action-${group.id}`} group={group} staff={staff}/>:modules.length?<><WorkForm key={`work-${group.id}-${topic}`} group={group} topic={topic} staff={staff}/>{!staff&&[1,2,3].includes(topic)&&<WordwallGames topic={topic}/>}{!staff&&topic===0&&<details className="panel"><summary>Refleksi Hati saya</summary><p>Bagian ini dijawab oleh masing-masing siswa dan disimpan terpisah dari jawaban kelompok.</p><ReflectionWorkspace topicOnly={0}/></details>}{topic===3&&<details className="panel"><summary>Rencana dan jurnal pelaksanaan aksi</summary><ActionForm group={group} staff={staff}/></details>}</>:!modulesError&&<section className="panel"><h2>Belum ada LKPD untuk kelas ini</h2><p>Gurumu akan menyiapkan LKPD. Kamu tetap dapat membuka Materi dan Tugas.</p></section>}</>}

  </div>;
}
