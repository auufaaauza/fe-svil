"use client";
import { useEffect, useState, type FormEvent } from "react";
import { apiRequest } from "../lib/api";
import { useUnsavedChanges } from "../lib/unsaved-changes";
import { useSession } from "./session-provider";
import { ThemeSelect } from "./theme-select";
import { FriendlyIcon } from "./friendly-icon";
import { QuestionVisual } from "./question-visual";
import { AsyncState, Field, errorMessage, localDate, useApiRows, useWorkspaceLists } from "./lms-shared";
import { StudentFeedback, type Attempt, type Observation } from "./teacher-assessment";

const reflectionSections={schemas:"/reflections/schema",reflections:"/reflections",attempts:"/attempts",observations:"/observations"};
type Schema={topic:number;fields:Record<string,string>;reference:string};
type Reflection={id:number;classroom_id:number;student_id:number;topic:number;answers:Record<string,string>;schema_snapshot:Record<string,string>;version:number;feedback:string|null};
export function ReflectionWorkspace({topicOnly}:{topicOnly?:number}) {
 const {activeClass,user}=useSession();
 const bundle=useWorkspaceLists<{schemas:Schema;reflections:Reflection;attempts:Attempt;observations:Observation}>(user?.canUseSvil===false?null:"/reflection-workspace",reflectionSections);
 const schemas={...bundle,rows:bundle.rows?.schemas??[]},list={...bundle,rows:bundle.rows?.reflections??[]};
 const saveReflection=async(row?:Reflection)=>{if(!row)return (await bundle.reload())?.reflections??[];const rows=[...(bundle.rows?.reflections??[]).filter(previous=>previous.id!==row.id),row];bundle.setRows(previous=>previous?{...previous,reflections:rows}:previous);return rows;};
 const [topic,setTopic]=useState(String(topicOnly??0));const row=list.rows.find(r=>r.classroom_id===activeClass&&r.student_id===user?.id&&r.topic===Number(topic));const schema=schemas.rows.find(s=>s.topic===Number(topic));
 if(user?.canUseSvil===false)return null;
 return <><section className="panel reflection-space"><div className="section-heading"><div><p className="eyebrow">CERITA PRIBADIKU</p><h2>Apa yang kamu pelajari dan rasakan?</h2><p>Ceritamu boleh berbeda dari teman. Gurumu akan membaca dan mendukungmu.</p></div><FriendlyIcon name="heart" size={50}/></div>
 <AsyncState loading={schemas.loading||list.loading} error={schemas.error||list.error} retry={()=>bundle.reload()}/>
 <ThemeSelect disabled={topicOnly!==undefined} label="Pilih pertemuan ceritamu" value={topic} onChange={setTopic} options={schemas.rows.map(s=>({value:String(s.topic),label:"Pertemuan "+(s.topic+1)}))}/>
 {schema&&!list.loading&&<ReflectionForm key={topic+"-"+(row?.version??0)} classroomId={activeClass} schema={schema} existing={row} onSaved={saveReflection}/>}</section>
 <StudentFeedback reflections={list.rows} reflectionsLoading={list.loading} reflectionsError={list.error} activity={{attempts:bundle.rows?.attempts??[],observations:bundle.rows?.observations??[],loading:bundle.loading,error:bundle.error,reload:bundle.reload}}/></>;
}
function ReflectionForm({classroomId,schema,existing,onSaved}:{classroomId:number|null;schema:Schema;existing?:Reflection;onSaved:(row?:Reflection)=>Promise<Reflection[]>}) {
 const fields=existing?.schema_snapshot??schema.fields;
 const [answers,setAnswers]=useState<Record<string,string>>(existing?.answers??{}),[busy,setBusy]=useState(false),[error,setError]=useState(""),[saved,setSaved]=useState(false);
 const dirty=Object.keys(fields).some(key=>(answers[key]??"")!==(existing?.answers[key]??""));useUnsavedChanges(dirty&&!saved);
 const submit=async(e:FormEvent)=>{e.preventDefault();setBusy(true);setError("");try{const result=await apiRequest<{data:Reflection}>("/reflections",{method:"PUT",body:JSON.stringify({classroom_id:classroomId,topic:schema.topic,version:existing?.version??0,answers}),successMessage:"Ceritamu berhasil disimpan. Terima kasih sudah berbagi!",notifyError:true});setSaved(true);await onSaved(result.data);}catch(e){setError(errorMessage(e));}finally{setBusy(false);}};
 return <form className="lms-form" onSubmit={submit}><QuestionVisual topic={schema.topic} phase={3}/><fieldset disabled={busy}>
 {Object.entries(fields).map(([key,label])=><Field label={label} key={key}><textarea required rows={3} maxLength={4000} value={answers[key]??""} placeholder="Tulis dengan bahasamu sendiri, ya…" onChange={e=>{setAnswers(p=>({...p,[key]:e.target.value}));setSaved(false);}}/></Field>)}
 <button className="button primary" disabled={!classroomId}>{busy?"Menyimpan ceritamu…":"Simpan ceritaku"}<FriendlyIcon name="heart" size={24}/></button></fieldset>
 {saved&&<p className="notice" role="status">Ceritamu sudah tersimpan.</p>}{error&&<div className="form-error" role="alert">{error}<button className="text-button" type="button" onClick={()=>onSaved()}>Ambil cerita terbaru</button></div>}
 <small className="helper">{schema.reference} · Disimpan untuk akunmu dan kelasmu.</small>{existing?.feedback&&<a className="text-button reflection-message-link" href="#teacher-messages"><FriendlyIcon name="heart" size={25}/>Lihat pesan dari gurumu di bawah</a>}</form>;
}
type Followup={id:number;title:string;group:{id:number;name:string;classroom_id:number};start_date:string;followup_on:string;verified_at:string|null;records:{id:number;kind:string;occurred_on:string;content:string;source_reference:string}[]};
export function FollowupWorkspace() {
 const {user,activeClass}=useSession();const list=useApiRows<Followup>("/followups");const staff=user?.role!=="student";
 return <section className="panel"><div className="section-heading"><div><p className="eyebrow">KEBAIKAN YANG BERLANJUT</p><h2>Tindak lanjut aksi</h2><p>Cek kembali satu minggu setelah aksi dimulai. Catat dukungan keluarga jika memang ada.</p></div><FriendlyIcon name="sprout" size={45}/></div>
 <AsyncState loading={list.loading} error={list.error} retry={()=>list.reload()}/>{!list.loading&&!list.rows.length&&<p className="soft-note">Belum ada rencana aksi. Susun rencana bersama kelompok dahulu.</p>}
 <div className="record-list">{list.rows.filter(p=>p.group.classroom_id===activeClass).map(p=><article key={p.id}><div className="section-heading"><h3>{p.title}</h3><span className="soft-badge">{p.group.name}</span></div><p>Mulai {p.start_date} · Tindak lanjut {p.followup_on}</p>{p.followup_on<=localDate()&&!p.records.some(r=>r.kind==="follow_up")&&<p className="soft-note">Sudah waktunya meninjau kelanjutan aksi ini bersama guru.</p>}{p.records.map(r=><blockquote className="answer-quote" key={r.id}><strong>{r.kind==="guardian_support"?"Dukungan keluarga":"Catatan tindak lanjut"} · {r.occurred_on}</strong><p>{r.content}</p><small>Sumber: {r.source_reference}</small></blockquote>)}{staff&&<FollowupForm plan={p} onSaved={()=>list.reload()}/>}</article>)}</div></section>;
}
function FollowupForm({plan,onSaved}:{plan:Followup;onSaved:()=>Promise<Followup[]>}) {
 const [open,setOpen]=useState(false),[kind,setKind]=useState("follow_up"),[date,setDate]=useState(localDate()),[content,setContent]=useState(""),[source,setSource]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const submit=async(e:FormEvent)=>{e.preventDefault();setBusy(true);try{await apiRequest("/actions/"+plan.id+"/followups",{method:"POST",body:JSON.stringify({kind,occurred_on:date,content,source_reference:source})});setOpen(false);setContent("");await onSaved();}catch(e){setError(errorMessage(e));}finally{setBusy(false);}};
 return open?<form className="lms-form" onSubmit={submit}><fieldset disabled={busy}><ThemeSelect label="Jenis catatan" value={kind} onChange={setKind} options={[{value:"follow_up",label:"Tindak lanjut satu minggu"},{value:"guardian_support",label:"Dukungan orang tua / wali"}]}/><Field label="Tanggal kejadian"><input type="date" required max={localDate()} value={date} onChange={e=>setDate(e.target.value)}/></Field><Field label="Bukti dan perkembangan yang diamati"><textarea required rows={3} maxLength={5000} value={content} onChange={e=>setContent(e.target.value)}/></Field><Field label="Rujukan sumber / catatan asli"><input required maxLength={3000} value={source} onChange={e=>setSource(e.target.value)}/></Field><div className="form-actions"><button className="button secondary" type="button" onClick={()=>setOpen(false)}>Batal</button><button className="button primary">{busy?"Menyimpan…":"Simpan catatan tindak lanjut"}</button></div></fieldset>{error&&<p className="form-error" role="alert">{error}</p>}</form>:<button type="button" className="text-button" onClick={()=>setOpen(true)}>Tambah bukti tindak lanjut</button>;
}
