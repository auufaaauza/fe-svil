"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "./session-provider";
import { useMaterials } from "../lib/material-store";
import { MaterialWorkshop } from "./material-workshop";
import { LkpdLibrary } from "./lkpd-library";
import { DiscussionBoard } from "./discussion-board";
import { ThemeSelect } from "./theme-select";
import { FriendlyIcon, type IconName } from "./friendly-icon";
import { CourseWorkspace } from "./course-workspace";
import { AssignmentWorkspace, GalleryWorkspace } from "./assignment-workspace";
import { AssessmentWorkspace } from "./assessment-workspace";

export function ContentWorkspace() {
 const query=useSearchParams();
 const {user,classrooms,activeClass}=useSession();const materials=useMaterials();const router=useRouter();
 const base=user?.role==="admin"?"/admin/konten":"/guru/materi";
 const [tab,setTab]=useState(query.get("kegiatan")??"lkpd"),[search,setSearch]=useState(""),[status,setStatus]=useState("all"),[subject,setSubject]=useState("all");
 const [classroom,setClassroom]=useState(user?.role==="admin"?"all":String(activeClass??"all"));
 const requestedTab=query.get("kegiatan");
 useEffect(()=>{if(requestedTab)setTab(requestedTab);},[requestedTab]);
 const [upload,setUpload]=useState(false),[quizCreate,setQuizCreate]=useState(0);
 if(upload)return <div className="content-editor"><button className="back-link" onClick={()=>setUpload(false)}><FriendlyIcon name="back" size={22}/>Kembali ke konten</button><MaterialWorkshop/></div>;
 const subjects=Array.from(new Set(materials.map(m=>m.subject||"IPAS")));
 const filtered=materials.filter(m=>(m.kind??"material")===tab&&(classroom==="all"||m.classroomId===Number(classroom))&&(status==="all"||m.status===status)&&(subject==="all"||(m.subject||"IPAS")===subject)&&(m.title+" "+(m.uploadedBy?.name??"")).toLowerCase().includes(search.toLowerCase()));
 const tabs=[["course","Mapel & bab","course"],["material","Materi","book"],["assessment","Kuis","quiz"],["task","Tugas","task"],["discussion","Diskusi","discussion"],["lkpd","LKPD utama","lkpd"],["gallery","Galeri","gallery"],...(materials.some(m=>m.kind==="quiz")?[["quiz","Latihan singkat","practice"]]:[])];
 return <div className="content-workspace"><section className="content-page-intro"><div><p className="eyebrow">PERPUSTAKAAN DAN KEGIATAN SEKOLAH</p><h2>Konten untuk setiap kegiatan.</h2><p>Susun mapel dan pertemuan, bagikan bahan, lalu dampingi tugas dan pemahaman siswa.</p></div><div className="content-create-actions"><button className="button primary" disabled={!classrooms.length} onClick={()=>setUpload(true)}><FriendlyIcon name="upload" size={24}/>Unggah materi</button><button className="button secondary" disabled={!classrooms.length} onClick={()=>{setTab("assessment");setQuizCreate(v=>v+1);}}><FriendlyIcon name="plus" size={22}/>Buat kuis</button></div></section>
 {!classrooms.length&&<div className="soft-note">{user?.role==="admin"?<>Siapkan madrasah dan kelas dahulu. <Link className="text-button" href="/admin/madrasah">Kelola kelas</Link></>:"Admin perlu menetapkan kelas untuk akun guru."} LKPD utama tetap dapat dibaca.</div>}
 <div className="content-tabs" aria-label="Jenis konten">{tabs.map(([key,label,icon])=><button key={key} className={tab===key?"selected":""} aria-pressed={tab===key} onClick={()=>setTab(key)}><FriendlyIcon name={icon as IconName} size={27}/><span>{label}</span>{key==="material"&&<small>{materials.filter(m=>m.kind!=="quiz").length}</small>}</button>)}</div>
 {tab==="course"?<CourseWorkspace/>:tab==="assessment"?<AssessmentWorkspace key={"quiz-"+quizCreate} createOnMount={quizCreate>0}/>:tab==="task"?<AssignmentWorkspace/>:tab==="gallery"?<GalleryWorkspace/>:tab==="lkpd"?<LkpdLibrary/>:tab==="discussion"?<DiscussionBoard/>:<section className="panel"><div className="section-heading"><h3>{tab==="quiz"?"Latihan singkat yang sudah dibagikan":"Materi pembelajaran"}</h3><span className="count-pill">{filtered.length}</span></div>
 <div className="content-filters"><label className="search-field"><FriendlyIcon name="search" size={23}/><input aria-label="Cari judul atau pengunggah" placeholder="Cari judul atau pengunggah…" value={search} onChange={e=>setSearch(e.target.value)}/></label><ThemeSelect label="Filter kelas" value={classroom} onChange={setClassroom} options={[{value:"all",label:"Semua kelas"},...classrooms.map(c=>({value:String(c.id),label:c.name,description:c.schoolName}))]}/><ThemeSelect label="Filter status konten" value={status} onChange={setStatus} options={[{value:"all",label:"Semua status"},{value:"published",label:"Terbit"},{value:"draft",label:"Draf"}]}/><ThemeSelect label="Mata pelajaran" value={subject} onChange={setSubject} options={[{value:"all",label:"Semua pelajaran"},...subjects.map(s=>({value:s,label:s}))]}/></div>
 {!filtered.length&&<div className="content-empty"><FriendlyIcon name={tab==="quiz"?"practice":"book"} size={65}/><h3>Belum ada konten yang sesuai</h3><p>Unggah bahan pembelajaran atau sesuaikan filter.</p></div>}
 <div className="content-card-grid">{filtered.map(m=><article className="content-card" key={m.id}><div className="section-heading"><span className={"content-type-badge "+m.kind}>{m.kind==="quiz"?"Latihan":"Materi"} · {m.subject??"IPAS"}</span><span className={"status-badge "+m.status}>{m.status==="published"?"Terbit":"Draf"}</span></div><FriendlyIcon name={m.kind==="quiz"?"practice":"book"} size={49}/><h3>{m.title}</h3><p className="content-excerpt">{m.content}</p><div className="content-attribution"><span>Diunggah <strong>{m.uploadedBy?.name??"Belum tercatat"}</strong></span><span>{classrooms.find(c=>c.id===m.classroomId)?.name??"Kelas"} · Versi {m.version}</span><span>{m.topic===null?m.topicLabel||"Materi umum":"Pertemuan "+(m.topic+1)}</span><span>Diperbarui {new Date(m.updatedAt).toLocaleDateString("id-ID")}{m.updatedBy?" oleh "+m.updatedBy.name:""}</span>{m.attachment&&<span>{m.attachment.mime?.includes("presentationml")?"PowerPoint":"PDF"} · {m.attachment.name}</span>}</div><div className="form-actions"><Link className="button secondary" href={base+"/"+(m.kind==="quiz"?"latihan":"materi")+"/"+m.id}>Lihat detail</Link>{m.canEdit!==false&&<Link className="button primary" href={base+"/"+(m.kind==="quiz"?"latihan":"materi")+"/"+m.id+"?edit=1"}>Sunting <FriendlyIcon name="edit" size={20}/></Link>}</div></article>)}</div></section>}
 </div>;
}
