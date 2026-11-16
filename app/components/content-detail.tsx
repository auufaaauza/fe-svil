"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "../lib/api";
import { useSession } from "./session-provider";
import { FriendlyIcon } from "./friendly-icon";
import { MaterialForm, StudentMaterial } from "./material-workshop";
import { AssessmentForm, type Assessment } from "./assessment-workspace";
import { AssignmentForm, AssignmentSubmit, type Assignment, type Submission } from "./assignment-workspace";
import { DiscussionForm, ThreadConversation, type Thread } from "./discussion-board";
import { QuestionVisual } from "./question-visual";
import { AsyncState, errorMessage, statusLabel, useApiRows } from "./lms-shared";
import type { TeacherMaterial } from "../lib/material-store";
import { LkpdSectionEditor as ModuleQuestionEditor } from "./lkpd-section-editor";
import { AssignmentReopening } from "./classroom-management";
function useItem<T>(path:string) {
 const [data,setData]=useState<T|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(""),[revision,setRevision]=useState(0);
 useEffect(()=>{let alive=true;setLoading(true);apiRequest<{data:T}>(path).then(r=>{if(alive){setData(r.data);setError("");}}).catch(e=>{if(alive)setError(errorMessage(e));}).finally(()=>{if(alive)setLoading(false);});return()=>{alive=false;};},[path,revision]);
 return {data,setData,loading,error,reload:()=>setRevision(v=>v+1)};
}
export function ContentDetail({kind,id,edit=false}:{kind:string;id:string;edit?:boolean}) {
 const {user}=useSession();const base=user?.role==="admin"?"/admin/konten":"/guru/materi";
 return <div className="lms-workspace"><Link className="back-link" href={base}><FriendlyIcon name="back" size={22}/>Kembali ke konten pembelajaran</Link>
 {kind==="materi"||kind==="latihan"?<StaffMaterialDetail id={id} initialEdit={edit}/>:kind==="kuis"?<QuizDetail id={id} initialEdit={edit}/>:kind==="diskusi"?<DiscussionDetail id={id} initialEdit={edit}/>:kind==="lkpd"?<LkpdDetail id={id}/>:kind==="tugas"?<TaskDetail id={id} initialEdit={edit}/>:<section className="panel"><h2>Konten tidak ditemukan</h2><p>Pilih konten dari daftar pembelajaran.</p></section>}
 </div>;
}
export function MaterialReader({id,onBack}:{id:string;onBack:()=>void}) {
 const item=useItem<TeacherMaterial>("/materials/"+encodeURIComponent(id));
 return <><AsyncState loading={item.loading} error={item.error} retry={item.reload}/>{item.data&&<StudentMaterial key={item.data.id+"-"+item.data.version} material={item.data} onBack={onBack}/>}</>;
}
function StaffMaterialDetail({id,initialEdit}:{id:string;initialEdit:boolean}) {
 const {refresh}=useSession();const item=useItem<TeacherMaterial>("/materials/"+encodeURIComponent(id));const [editing,setEditing]=useState(initialEdit),[notice,setNotice]=useState("");
 return <><AsyncState loading={item.loading} error={item.error} retry={item.reload}/>{notice&&<p className="notice" role="status">{notice}</p>}{item.data&&<><section className="panel"><div className="section-heading"><div><p className="eyebrow">{item.data.kind==="quiz"?"LATIHAN SINGKAT":"DETAIL MATERI"}</p><h2>{item.data.title}</h2><p>{statusLabel(item.data.status)} · Versi {item.data.version} · Diunggah {item.data.uploadedBy?.name}</p><small>{item.data.topic===null?item.data.topicLabel||"Materi sekolah umum":"Pertemuan "+(item.data.topic+1)}</small></div>{item.data.canEdit!==false&&<button className="button primary" onClick={()=>setEditing(v=>!v)}>{editing?"Baca materi":"Sunting materi"}<FriendlyIcon name="edit"/></button>}</div></section>
 {editing&&item.data.canEdit!==false?<section className="panel"><MaterialForm key={item.data.id+"-"+item.data.version} initial={item.data} onSaved={async message=>{setNotice(message);setEditing(false);item.reload();await refresh();}}/></section>:<StudentMaterial material={item.data} onBack={()=>setEditing(false)} showBack={false}/>}
 </>}</>;
}
function QuizDetail({id,initialEdit}:{id:string;initialEdit:boolean}) {
 const item=useItem<Assessment>("/assessments/"+encodeURIComponent(id));const [editing,setEditing]=useState(initialEdit);
 return <><AsyncState loading={item.loading} error={item.error} retry={item.reload}/>{item.data&&(editing?<AssessmentForm initial={item.data} onClose={()=>setEditing(false)} onSaved={()=>{setEditing(false);item.reload();}}/>:<section className="panel"><div className="section-heading"><div><p className="eyebrow">DETAIL KUIS / ASESMEN</p><h2>{item.data.title}</h2><p>{statusLabel(item.data.status)} · {item.data.questions.length} soal · {item.data.max_score} poin</p></div><button className="button primary" onClick={()=>setEditing(true)}>Sunting kuis<FriendlyIcon name="edit"/></button></div><p className="material-body">{item.data.instructions}</p><div className="soft-note">{item.data.duration_minutes?"Durasi "+item.data.duration_minutes+" menit. ":"Tanpa durasi khusus. "}Maksimum {item.data.max_attempts} percobaan.{item.data.opens_at?" Dibuka "+new Date(item.data.opens_at).toLocaleString("id-ID")+".":""}{item.data.closes_at?" Ditutup "+new Date(item.data.closes_at).toLocaleString("id-ID")+".":""}</div>
 {item.data.questions.map((q,i)=><article className="feedback-card" key={q.id}><span className="soft-badge">Soal {i+1} · {q.points} poin · {q.type==="text"?"Uraian":"Pilihan ganda"}</span><h3>{q.prompt}</h3><QuestionVisual topic={q.visualTopic??3}/>{q.options.map((option,j)=><p key={j}>{"ABCD"[j]}. {option}</p>)}{q.type==="choice"&&q.correctIndex!==null&&q.correctIndex!==undefined&&<p className="helper">Kunci guru: {"ABCD"[q.correctIndex]}</p>}{q.modelAnswer&&<p className="soft-note">Pedoman guru: {q.modelAnswer}</p>}</article>)}</section>)}</>;
}
function DiscussionDetail({id,initialEdit}:{id:string;initialEdit:boolean}) {
 const item=useItem<Thread>("/discussions/"+encodeURIComponent(id));const [editing,setEditing]=useState(initialEdit);
 return <><AsyncState loading={item.loading} error={item.error} retry={item.reload}/>{item.data&&(editing&&item.data.canEdit?<DiscussionForm initial={item.data} onClose={()=>setEditing(false)} onSaved={()=>{setEditing(false);item.reload();}}/>:<ThreadConversation thread={item.data} staff onEdit={()=>setEditing(true)}/>)}</>;
}
function LkpdDetail({id}:{id:string}) {
 return <ModuleQuestionEditor moduleId={Number(id)}/>;
}

function TaskDetail({id,initialEdit}:{id:string;initialEdit:boolean}) {
 const item=useItem<Assignment>("/assignments/"+encodeURIComponent(id));const submissions=useApiRows<Submission>("/submissions?assignment_id="+encodeURIComponent(id));const [editing,setEditing]=useState(initialEdit),[offline,setOffline]=useState(false);
 return <><AsyncState loading={item.loading} error={item.error} retry={item.reload}/>{item.data&&(editing?<AssignmentForm initial={item.data} onClose={()=>setEditing(false)} onSaved={()=>{setEditing(false);item.reload();}}/>:<section className="panel"><div className="section-heading"><div><p className="eyebrow">DETAIL TUGAS</p><h2>{item.data.title}</h2><p>{statusLabel(item.data.status)} · {item.data.submission_mode==="group"?"Kelompok":"Individu"} · maksimum {item.data.max_score} poin</p></div><button className="button primary" onClick={()=>setEditing(true)}>Sunting tugas</button></div><AssignmentReopening assignment={item.data}/><p className="material-body">{item.data.instructions}</p>{item.data.due_at&&<p>Batas pengumpulan: {new Date(item.data.due_at).toLocaleString("id-ID")}</p>}{item.data.rubric?.map(r=><article className="record-list" key={r.key}><strong>{r.label} · {r.max_points} poin</strong><p>{r.description}</p></article>)}<button className="button secondary" onClick={()=>setOffline(v=>!v)}>Catat pengumpulan luring</button></section>)}
 {offline&&item.data&&<AssignmentSubmit assignment={item.data} existingRows={submissions.rows} onClose={()=>setOffline(false)} onSaved={()=>submissions.reload()}/>}</>;
}

