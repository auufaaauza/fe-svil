"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { apiRequest } from "../lib/api";
import { useSession } from "./session-provider";
import { FriendlyIcon } from "./friendly-icon";
import { ThemeSelect } from "./theme-select";
import { useApiRows, AsyncState, errorMessage, statusLabel, Field } from "./lms-shared";
import { phaseNames } from "../lib/learning";
import { WorkForm } from "./group-workspace";
import { TeacherAssessment } from "./teacher-assessment";

type StudentSummary={id:number;name:string;username:string;group:{id:number;name:string}|null;lkpd:{topic:number;notes_filled:number;notes_reviewed:number;group_status:string;reflection_filled:boolean;reflection_reviewed:boolean}[]};
type Note={id:number;topic:number;phase:number;content:string;content_hash:string;feedback:string|null;reviewed_at:string|null};
type Detail={student:{id:number;name:string;username:string};classroom_id:number;group:{id:number;classroom_id:number;name:string;users:{id:number;name:string}[]}|null;notes:Note[];reflections:{id:number;topic:number;answers:Record<string,string>;schema_snapshot:Record<string,string>;feedback:string|null;version:number}[];works:{id:number;learning_group_id:number;topic:number;status:string;groupName?:string;feedback?:string|null;answers?:Record<string,string>;schema_snapshot?:{key:string;label:string}[];product_value?:number|null;presentation_value?:number|null}[];modules:{id:number;topic:number;title:string}[]};
const groupLabel=(status:string)=>status==="not_started"?"Belum mulai":statusLabel(status);
export function StudentReviewInbox() {
 const {activeClass,user}=useSession();
 const list=useApiRows<StudentSummary>(activeClass?"/student-reviews?classroom_id="+activeClass:null);
 const [search,setSearch]=useState(""),[filter,setFilter]=useState("all"),[advanced,setAdvanced]=useState(false);
 const visible=list.rows.filter(s=>(s.name+" "+s.username).toLowerCase().includes(search.toLowerCase())&&(filter==="all"||filter==="filled"&&s.lkpd.some(l=>l.notes_filled>0||l.group_status!=="not_started"||l.reflection_filled)||filter==="pending"&&s.lkpd.some(l=>l.notes_filled>l.notes_reviewed||l.group_status==="submitted"||l.reflection_filled&&!l.reflection_reviewed)));
 return <div className="lms-workspace"><div className="section-heading"><div><h2>Tinjauan belajar per murid</h2><p>Pilih nama murid untuk membaca catatan pribadi, melihat LKPD kelompoknya, dan memberi umpan balik.</p></div><button className="button secondary" onClick={()=>setAdvanced(v=>!v)}>{advanced?"Kembali ke daftar murid":"Tinjauan tugas / kuis lainnya"}</button></div>
 {advanced?<TeacherAssessment/>:<>
 {!activeClass&&<div className="soft-note">Akun guru belum ditugaskan ke kelas. Admin dapat menetapkannya melalui pengelolaan kelas.</div>}
 <AsyncState loading={list.loading} error={list.error} retry={()=>list.reload()}/>
 <div className="content-filters"><label className="search-field"><FriendlyIcon name="search" size={24}/><input aria-label="Cari nama murid" placeholder="Cari nama murid…" value={search} onChange={e=>setSearch(e.target.value)}/></label><ThemeSelect label="Filter pengisian murid" value={filter} onChange={setFilter} options={[{value:"all",label:"Semua murid"},{value:"filled",label:"Sudah mengisi kegiatan"},{value:"pending",label:"Perlu ditinjau"}]}/></div>
 {!list.loading&&!visible.length&&<div className="panel soft-note">Belum ada murid yang sesuai. Periksa anggota kelas atau ubah filter.</div>}
 <div className="student-review-grid">{visible.map(s=><article className="panel student-review-card" key={s.id}><div className="section-heading"><div className="student-review-name"><span className="student-initial">{s.name.slice(0,1).toUpperCase()}</span><div><h3>{s.name}</h3><small>{s.group?.name??"Belum memiliki kelompok"}</small></div></div><FriendlyIcon name="heart" size={34}/></div>
 <div className="student-lkpd-summary">{s.lkpd.map(l=><div key={l.topic}><strong>LKPD {l.topic+1}</strong><span>Catatan pribadi: {l.notes_filled}/5 langkah · ditinjau {l.notes_reviewed}</span><span>Jawaban kelompok: {groupLabel(l.group_status)}</span><span>Refleksi pribadi: {l.reflection_filled?(l.reflection_reviewed?"Sudah ditinjau":"Sudah diisi"):"Belum diisi"}</span></div>)}</div>
 <Link className="button primary full-width" href={(user?.role==="admin"?"/admin/laporan/siswa/":"/guru/tinjauan/")+s.id+"?kelas="+activeClass}>Lihat detail murid <FriendlyIcon name="arrow" size={22}/></Link></article>)}</div>
 </>}
 </div>;
}
export function StudentReviewDetail({studentId,classroomId}:{studentId:number;classroomId:number|null}) {
 const {activeClass,user,refresh}=useSession();const classId=classroomId??activeClass;
 const [data,setData]=useState<Detail|null>(null),[topic,setTopic]=useState("0"),[loading,setLoading]=useState(true),[error,setError]=useState(""),[revision,setRevision]=useState(0);
 useEffect(()=>{let alive=true;if(!classId){setLoading(false);return;}apiRequest<{data:Detail}>("/student-reviews/"+studentId+"?classroom_id="+classId).then(r=>{if(alive){setData(r.data);setError("");}}).catch(e=>{if(alive)setError(e.message);}).finally(()=>{if(alive)setLoading(false);});return()=>{alive=false;};},[studentId,classId,revision]);
 const reload=async()=>{setRevision(v=>v+1);await refresh();};
 const back=user?.role==="admin"?"/admin/laporan":"/guru/tinjauan";
 return <div className="lms-workspace"><Link className="back-link" href={back}><FriendlyIcon name="back" size={22}/>Kembali ke daftar tinjauan</Link><AsyncState loading={loading} error={error} retry={()=>setRevision(v=>v+1)}/>
 {data&&<><section className="panel student-detail-heading"><div className="student-review-name"><span className="student-initial">{data.student.name.slice(0,1).toUpperCase()}</span><div><p className="eyebrow">RINCIAN BELAJAR MURID</p><h2>{data.student.name}</h2><p>{data.group?"Anggota "+data.group.name:"Kelompok belum ditetapkan"}</p></div></div><div className="soft-note">Catatan dan refleksi adalah milik murid ini. Jawaban LKPD kelompok ditinjau satu kali untuk kelompok yang sama.</div></section>
 <ThemeSelect label="LKPD / pertemuan yang ditinjau" value={topic} onChange={setTopic} options={data.modules.map(m=>({value:String(m.topic),label:"LKPD "+(m.topic+1)+" · "+m.title}))}/>
 <section className="panel"><div className="section-heading"><div><p className="eyebrow">DIISI MANDIRI OLEH {data.student.name.toUpperCase()}</p><h2>Catatan pribadi · LKPD {Number(topic)+1}</h2></div><FriendlyIcon name="edit" size={40}/></div>
 {!data.notes.some(n=>n.topic===Number(topic))&&<div className="soft-note">Murid belum menyimpan catatan pada pertemuan ini.</div>}
 {data.notes.filter(n=>n.topic===Number(topic)).map(n=><NoteReviewCard key={n.id+"-"+n.content_hash+"-"+n.reviewed_at} note={n} name={data.student.name} onSaved={reload}/>)}
 </section>
 <section className="panel"><p className="eyebrow">RUANG REFLEKSI PRIBADI</p><h2>Cerita {data.student.name}</h2>{!data.reflections.some(r=>r.topic===Number(topic))&&<p className="soft-note">Belum ada refleksi terstruktur pada pertemuan ini.</p>}{data.reflections.filter(r=>r.topic===Number(topic)).map(r=><ReflectionReview key={r.id+"-"+r.version} reflection={r} onSaved={reload}/>)}</section>
 <section className="panel"><h2>Riwayat LKPD kelompok sebelumnya</h2>{data.works.filter(w=>w.learning_group_id!==data.group?.id&&w.topic===Number(topic)).map(w=><details className="source-document" key={w.id}><summary>{w.groupName??"Kelompok sebelumnya"} · LKPD {w.topic+1} · {statusLabel(w.status)}</summary>{w.schema_snapshot?.map(f=><article key={f.key} className="feedback-card"><strong>{f.label}</strong><p>{w.answers?.[f.key]??"Belum diisi"}</p></article>)}{w.feedback&&<p className="teacher-feedback">{w.feedback}</p>}<p>Nilai produk kelompok: {w.product_value??"Belum dinilai"} · Presentasi: {w.presentation_value??"Belum dinilai"}</p></details>)}</section>
 {data.group?<WorkForm key={data.group.id+"-"+topic} group={data.group} topic={Number(topic)} staff/>:<section className="panel"><h3>LKPD kelompok belum tersedia</h3><p>Tempatkan murid ke kelompok melalui Kelasku agar jawaban bersama dapat dicatat.</p></section>}
 </>}
 </div>;
}
function NoteReviewCard({note,name,onSaved}:{note:Note;name:string;onSaved:()=>Promise<void>}) {
 const [feedback,setFeedback]=useState(note.feedback??""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const submit=async(e:FormEvent)=>{e.preventDefault();setBusy(true);try{await apiRequest("/notes/"+note.id+"/review",{method:"PUT",body:JSON.stringify({feedback,content_hash:note.content_hash})});await onSaved();}catch(e){setError(errorMessage(e));}finally{setBusy(false);}};
 return <article className="named-note-card"><div className="section-heading"><h3>Langkah {note.phase+1} · {phaseNames[note.phase]}</h3><span className="soft-badge">{note.reviewed_at?"Sudah ditinjau":"Perlu ditinjau"}</span></div><blockquote className="answer-quote">{note.content}</blockquote><form className="lms-form" onSubmit={submit}><fieldset disabled={busy}><Field label={"Apresiasi dan saran untuk "+name}><textarea required maxLength={3000} rows={3} value={feedback} onChange={e=>setFeedback(e.target.value)}/></Field><button className="button primary">{busy?"Menyimpan…":"Simpan tinjauan catatan"}</button></fieldset>{error&&<div className="form-error" role="alert">{error}<button type="button" className="text-button" onClick={()=>onSaved()}>Muat catatan terbaru</button></div>}</form></article>;
}
function ReflectionReview({reflection:r,onSaved}:{reflection:Detail["reflections"][number];onSaved:()=>Promise<void>}) {
 const [feedback,setFeedback]=useState(r.feedback??""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const submit=async(e:FormEvent)=>{e.preventDefault();setBusy(true);try{await apiRequest("/reflections/"+r.id+"/review",{method:"PUT",body:JSON.stringify({feedback,version:r.version})});await onSaved();}catch(e){setError(errorMessage(e));}finally{setBusy(false);}};
 return <article className="named-note-card">{Object.entries(r.schema_snapshot).map(([key,label])=><div key={key}><strong>{label}</strong><p className="material-body">{r.answers[key]}</p></div>)}<form className="lms-form" onSubmit={submit}><fieldset disabled={busy}><Field label="Apresiasi dan dukungan"><textarea required rows={3} maxLength={3000} value={feedback} onChange={e=>setFeedback(e.target.value)}/></Field><button className="button primary">{busy?"Menyimpan…":"Simpan pesan guru"}</button></fieldset>{error&&<p className="form-error" role="alert">{error}</p>}</form></article>;
}

