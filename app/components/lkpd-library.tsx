"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, loadPages } from "../lib/api";
import { useUnsavedChanges } from "../lib/unsaved-changes";
import { useSession } from "./session-provider";
import { FriendlyIcon } from "./friendly-icon";
import { ThemeSelect } from "./theme-select";
import { QuestionVisual } from "./question-visual";
import { Field } from "./lms-shared";
type ModuleField = { key: string; label: string; hint: string; phase: number };
export type LearningModule = { id:number;classroomId:number|null;pageSize:number;canPublish:boolean;videoId?:string|null;videoCaption?:string|null;videoVersion?:number;topic:number;title:string;description:string;instructions:string;fields:ModuleField[];sourceDocument:string;sourceText?:string;sourceHash:string;status:string;version:number;uploadedBy:{id:number;name:string};updatedBy:{id:number;name:string};createdAt:string;updatedAt:string };

export function LkpdLibrary() {
 const {user,activeClass,classrooms,refresh}=useSession();const router=useRouter();
 const [modules,setModules]=useState<LearningModule[]>([]),[search,setSearch]=useState(""),[status,setStatus]=useState("all");
 const [loading,setLoading]=useState(true),[error,setError]=useState(""),[revision,setRevision]=useState(0),[creating,setCreating]=useState(false),[busy,setBusy]=useState(false);
 useEffect(()=>{let alive=true;setLoading(true);loadPages<LearningModule>("/learning-modules"+(activeClass?"?classroom_id="+activeClass:"")).then(rows=>{if(alive){setModules(rows);setError("");}}).catch(e=>{if(alive)setError(e.message);}).finally(()=>{if(alive)setLoading(false);});return()=>{alive=false;};},[activeClass,revision]);
 const open=(id:number)=>router.push((user?.role==="admin"?"/admin/konten":"/guru/materi")+"/lkpd/"+id);
 const activate=async(module:LearningModule)=>{if(!activeClass)return;setBusy(true);try{await apiRequest("/learning-modules/"+module.id+"/activate",{method:"PUT",body:JSON.stringify({classroom_id:activeClass})});await refresh();setRevision(v=>v+1);}catch(e){setError(e instanceof Error?e.message:"Belum berhasil.");}finally{setBusy(false);}};
 const visible=modules.filter(m=>(status==="all"||m.status===status)&&(m.title+" "+m.description).toLowerCase().includes(search.toLowerCase()));
 const classroom=classrooms.find(c=>c.id===activeClass);
 return <div className="lkpd-library"><div className="section-heading"><div><h2>LKPD pembelajaran</h2><p>Tambah LKPD dan susun pertanyaan, gambar serta video per section.</p></div><button className="button primary" disabled={user?.role==="teacher"&&!activeClass} onClick={()=>setCreating(v=>!v)}><FriendlyIcon name="plus" size={23}/>{creating?"Tutup formulir":"Tambah LKPD"}</button></div>
 {creating&&<CreateLkpd onSaved={open} onClose={()=>setCreating(false)}/>}
 <div className="content-filters"><label className="search-field"><FriendlyIcon name="search" size={23}/><input aria-label="Cari LKPD" placeholder="Cari LKPD…" value={search} onChange={e=>setSearch(e.target.value)}/></label><ThemeSelect label="Status LKPD" value={status} onChange={setStatus} options={[{value:"all",label:"Semua status"},{value:"published",label:"Terbit"},{value:"draft",label:"Draf"}]}/></div>
 {loading&&<p role="status">Memuat LKPD…</p>}{error&&<div className="form-error" role="alert">{error}<button className="text-button" onClick={()=>setRevision(v=>v+1)}>Coba lagi</button></div>}
 {!loading&&!visible.length&&<p className="soft-note">Belum ada LKPD yang sesuai. Gunakan Tambah LKPD untuk menyusun kegiatan.</p>}
 <div className="module-grid">{visible.map(m=>{
   const active=classroom?.activeLkpdId===m.id;
   return <article className="module-card" key={m.id}>
     <div className="section-heading"><span className="content-type-badge lkpd">{m.classroomId?"LKPD kelas":"Template LKPD"}</span><span className={"status-badge "+m.status}>{m.status==="published"?"Terbit":"Draf"}</span></div>
     <QuestionVisual topic={m.topic%4}/><h3>{m.title}</h3><p>{m.description}</p>
     <div className="module-card-footer">
       <small>Versi {m.version} · {m.fields.length} section · {m.updatedBy.name}</small>
       <div className="module-card-actions">
         <button className="button primary" onClick={()=>open(m.id)}><FriendlyIcon name="edit" size={22}/>Buka editor LKPD</button>
         {activeClass&&<button className={"button secondary"+(active?" is-active":"")} disabled={busy||active||m.status!=="published"||classroom?.archived} onClick={()=>activate(m)}><FriendlyIcon name={active?"check":"compass"} size={22}/>{active?"LKPD aktif kelas ini":"Jadikan LKPD aktif"}</button>}
       </div>
     </div>
   </article>;
 })}</div></div>;
}

function CreateLkpd({onSaved,onClose}:{onSaved:(id:number)=>void;onClose:()=>void}) {
 const {user,activeClass,classrooms}=useSession();const [classroom,setClassroom]=useState(user?.role==="admin"?"global":String(activeClass??""));
 const [title,setTitle]=useState(""),[description,setDescription]=useState(""),[instructions,setInstructions]=useState(""),[question,setQuestion]=useState(""),[video,setVideo]=useState("");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[saved,setSaved]=useState(false);const request=useRef<string|null>(null);
 const dirty=!saved&&Boolean(title||description||instructions||question||video);useUnsavedChanges(dirty);
 const submit=async(e:FormEvent)=>{e.preventDefault();setBusy(true);setError("");request.current??=crypto.randomUUID();try{const result=await apiRequest<{data:LearningModule}>("/learning-modules",{method:"POST",body:JSON.stringify({request_id:request.current,classroom_id:classroom==="global"?null:Number(classroom),title,description,instructions,fields:[{key:"q_initial",label:question,hint:"",phase:0,video_url:video||null}]})});setSaved(true);onSaved(result.data.id);}catch(e){setError(e instanceof Error?e.message:"LKPD belum tersimpan.");}finally{setBusy(false);}};
 return <section className="panel"><h3>Tambah LKPD baru</h3><p>LKPD disimpan sebagai draf. Setelah dibuat, tambahkan section, gambar dan video melalui editor.</p><form className="lms-form" onSubmit={submit}><fieldset disabled={busy}>{user?.role==="admin"&&<ThemeSelect label="Tujuan LKPD" value={classroom} onChange={setClassroom} options={[{value:"global",label:"Template bersama"},...classrooms.filter(c=>!c.archived).map(c=>({value:String(c.id),label:c.name}))]}/>}<Field label="Judul LKPD"><input required maxLength={180} value={title} onChange={e=>setTitle(e.target.value)}/></Field><Field label="Ringkasan"><textarea required rows={2} maxLength={2000} value={description} onChange={e=>setDescription(e.target.value)}/></Field><Field label="Petunjuk umum"><textarea required rows={3} maxLength={8000} value={instructions} onChange={e=>setInstructions(e.target.value)}/></Field><Field label="Pertanyaan section pertama"><textarea required rows={3} maxLength={500} value={question} onChange={e=>setQuestion(e.target.value)}/></Field><Field label="Link video section pertama · opsional"><input type="url" maxLength={2048} value={video} onChange={e=>setVideo(e.target.value)}/></Field>{error&&<p className="form-error" role="alert">{error}</p>}<div className="inline-actions"><button className="button primary">{busy?"Membuat LKPD…":"Buat dan lanjut ke editor"}</button><button className="button secondary" type="button" onClick={()=>{if(!dirty||window.confirm("Tutup formulir dan abaikan isian?"))onClose();}}>Batal</button></div></fieldset></form></section>;
}
