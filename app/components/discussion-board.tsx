"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, loadPages } from "../lib/api";
import { useSession } from "./session-provider";
import { ThemeSelect } from "./theme-select";
import { FriendlyIcon } from "./friendly-icon";

export type Thread={id:number;classroom_id:number;title:string;content:string;status:string;version:number;author:{id:number;name:string};repliesCount:number;canEdit:boolean};
type Reply={id:number;content:string;is_hidden:boolean;created_at:string;author:{id:number;name:string;role:string}};
export function DiscussionBoard() {
 const router=useRouter();
 const {user,activeClass,classrooms}=useSession();const staff=user!.role!=="student";
 const [threads,setThreads]=useState<Thread[]>([]),[selected,setSelected]=useState<number|null>(null);
 const [editing,setEditing]=useState<Thread|null|undefined>(undefined);
 const [status,setStatus]=useState("all"),[search,setSearch]=useState(""),[error,setError]=useState(""),[loading,setLoading]=useState(true),[revision,setRevision]=useState(0);
 useEffect(()=>{let alive=true;setLoading(true);loadPages<Thread>("/discussions"+(activeClass ? "?classroom_id="+activeClass:"")).then(data=>{if(alive){setThreads(data);setError("");}}).catch(e=>{if(alive)setError(e.message);}).finally(()=>{if(alive)setLoading(false);});return()=>{alive=false;};},[activeClass,revision]);
 const visible=threads.filter(t=>(status==="all" || t.status===status) && (t.title+" "+t.content).toLowerCase().includes(search.toLowerCase()));
 const thread=threads.find(t=>t.id===selected);
 return <div className="discussion-board"><div className="section-heading"><div><h2>Diskusi kelas</h2><p>Sampaikan ide dengan santun. Dengarkan teman dan jangan membagikan data pribadi.</p></div>{staff && <button className="button primary" onClick={()=>setEditing(null)} disabled={!classrooms.length}><FriendlyIcon name="plus" size={22}/>Buka diskusi</button>}</div>
  <div className="content-filters"><label className="search-field"><FriendlyIcon name="search" size={23}/><input aria-label="Cari diskusi" placeholder="Cari percakapan…" value={search} onChange={e=>setSearch(e.target.value)}/></label><ThemeSelect label="Status diskusi" value={status} onChange={setStatus} options={[{value:"all",label:"Semua status"},{value:"open",label:"Sedang berlangsung"},{value:"closed",label:"Sudah ditutup"},...(staff ? [{value:"draft",label:"Draf"}]:[])]}/></div>
  {error && <div className="form-error" role="alert">{error}<button className="text-button" onClick={()=>setRevision(v=>v+1)}>Muat lagi</button></div>}{loading && <p role="status">Memuat diskusi…</p>}
  {editing!==undefined && <DiscussionForm key={editing?.id ?? "new"} initial={editing} onClose={()=>setEditing(undefined)} onSaved={()=>{setEditing(undefined);setRevision(v=>v+1);}}/>}
  <div className="discussion-layout"><section className="panel">{!loading && !visible.length && <div className="soft-note">Belum ada diskusi yang sesuai. Guru dapat membuka percakapan untuk kelas ini.</div>}<div className="material-library">{visible.map(t=><button key={t.id} className={"library-item "+(selected===t.id ? "selected":"")} onClick={()=>staff?router.push((user?.role==="admin"?"/admin/konten":"/guru/materi")+"/diskusi/"+t.id):setSelected(t.id)}><span className="soft-badge">{t.status==="open" ? "Ayo berdiskusi":t.status==="draft" ? "Draf":"Selesai"}</span><strong>{t.title}</strong><small>Dibuka {t.author.name} · {t.repliesCount} tanggapan</small></button>)}</div></section>
   {thread ? <ThreadConversation key={thread.id+"-"+thread.version} thread={thread} staff={staff} onEdit={()=>setEditing(thread)}/> : <section className="panel library-empty"><FriendlyIcon name="people" size={65}/><p>Pilih percakapan yang ingin kamu baca.</p></section>}
  </div>
 </div>;
}
export function DiscussionForm({initial,onClose,onSaved}:{initial:Thread|null;onClose:()=>void;onSaved:()=>void}) {
 const {classrooms,activeClass}=useSession();
 const [classroomId,setClassroomId]=useState(String(initial?.classroom_id ?? activeClass ?? ""));
 const [title,setTitle]=useState(initial?.title ?? ""),[content,setContent]=useState(initial?.content ?? ""),[status,setStatus]=useState(initial?.status ?? "open");
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 const submit=async(e:FormEvent)=>{e.preventDefault();setBusy(true);setError("");try{await apiRequest("/discussions"+(initial ? "/"+initial.id:""),{method:initial ? "PUT":"POST",body:JSON.stringify({classroom_id:Number(classroomId),title,content,status,version:initial?.version})});onSaved();}catch(cause){setError(cause instanceof Error?cause.message:"Diskusi belum tersimpan.");}finally{setBusy(false);}};
 return <section className="panel discussion-compose"><div className="section-heading"><h3>{initial ? "Atur diskusi":"Percakapan baru"}</h3><button type="button" disabled={busy} className="text-button" onClick={onClose}>Tutup</button></div><form className="material-form" onSubmit={submit}><fieldset disabled={busy} className="module-edit-fields"><label className="field-label">Kelas</label><ThemeSelect label="Kelas diskusi" value={classroomId} required disabled={Boolean(initial)||busy} onChange={setClassroomId} options={classrooms.map(c=>({value:String(c.id),label:c.name,description:c.schoolName}))}/><label className="field-label">Judul<input required maxLength={180} value={title} onChange={e=>setTitle(e.target.value)}/></label><label className="field-label">Pertanyaan pemantik<textarea required rows={4} maxLength={8000} value={content} onChange={e=>setContent(e.target.value)}/></label><ThemeSelect label="Status diskusi" value={status} disabled={busy} onChange={setStatus} options={[{value:"open",label:"Buka untuk tanggapan"},{value:"closed",label:"Tutup tanggapan"},{value:"draft",label:"Simpan draf"}]}/><button className="button primary">{busy ? "Menyimpan…":"Simpan diskusi"}</button></fieldset>{error && <p className="form-error" role="alert">{error}</p>}</form></section>;
}
export function ThreadConversation({thread,staff,onEdit}:{thread:Thread;staff:boolean;onEdit:()=>void}) {
 const [replies,setReplies]=useState<Reply[]>([]),[content,setContent]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[loading,setLoading]=useState(true);
 const requestId=useRef<string|null>(null);
 useEffect(()=>{let alive=true;loadPages<Reply>("/discussions/"+thread.id+"/replies").then(data=>{if(alive)setReplies(data);}).catch(e=>{if(alive)setError(e.message);}).finally(()=>{if(alive)setLoading(false);});return()=>{alive=false;};},[thread.id]);
 const reload=async()=>setReplies(await loadPages<Reply>("/discussions/"+thread.id+"/replies"));
 const submit=async(e:FormEvent)=>{e.preventDefault();setBusy(true);setError("");requestId.current??=crypto.randomUUID();try{await apiRequest("/discussions/"+thread.id+"/replies",{method:"POST",body:JSON.stringify({request_id:requestId.current,content})});setContent("");requestId.current=null;await reload();}catch(cause){setError(cause instanceof Error?cause.message:"Tanggapan belum terkirim.");}finally{setBusy(false);}};
 const moderate=async(reply:Reply)=>{setBusy(true);setError("");try{await apiRequest("/discussion-replies/"+reply.id+"/moderate",{method:"PATCH",body:JSON.stringify({is_hidden:!reply.is_hidden})});await reload();}catch(cause){setError(cause instanceof Error?cause.message:"Belum berhasil.");}finally{setBusy(false);}};
 return <section className="panel thread-conversation"><div className="section-heading"><div><span className="soft-badge">Dari {thread.author.name}</span><h3>{thread.title}</h3></div>{staff && thread.canEdit && <button className="text-button" disabled={busy} onClick={onEdit}>Atur <FriendlyIcon name="edit" size={20}/></button>}</div><p className="material-body">{thread.content}</p><hr/>{loading && <p role="status">Membaca tanggapan…</p>}
 {replies.map(r=><article className={"discussion-reply "+(r.is_hidden ? "reply-hidden":"")} key={r.id}><strong>{r.author.name}</strong><small>{r.author.role==="student" ? "Siswa":"Pendamping"} · {new Date(r.created_at).toLocaleString("id-ID")}</small><p>{r.content}</p>{staff && <button className="text-button" disabled={busy} onClick={()=>moderate(r)}>{r.is_hidden ? "Tampilkan kembali":"Sembunyikan dari siswa"}</button>}</article>)}
 {!loading && !replies.length && <p className="helper">Belum ada tanggapan. Satu ide kecilmu bisa membantu teman.</p>}
 {thread.status==="open" ? <form className="material-form" onSubmit={submit}><label className="field-label" htmlFor={"reply-"+thread.id}>Ceritakan idemu</label><textarea id={"reply-"+thread.id} required rows={3} maxLength={3000} disabled={busy} value={content} onChange={e=>{setContent(e.target.value);requestId.current=null;}}/><button className="button primary" disabled={busy}>{busy ? "Mengirim…":"Kirim tanggapan"}<FriendlyIcon name="heart" size={22}/></button></form> : <p className="soft-note">Percakapan ini {thread.status==="draft" ? "masih berupa draf":"sudah ditutup"}. Tanggapan baru belum dibuka.</p>}
 {error && <p className="form-error" role="alert">{error}<button className="text-button" disabled={busy} onClick={()=>reload().then(()=>setError("")).catch(e=>setError(e.message))}>Muat tanggapan lagi</button></p>}</section>;
}
