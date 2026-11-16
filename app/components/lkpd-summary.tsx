"use client";
import Link from "next/link";
import { useSession } from "./session-provider";
import { useApiRows, AsyncState, statusLabel } from "./lms-shared";

type LkpdProgress={id:number;topic:number;title:string;works:{id:number;group:string;status:string;score:number|null;pages_submitted:number;pages_total:number;feedback?:string|null;reviewedBy?:string|null;reviewed_at:string|null}[]};

export function LkpdSummary({showGrades=false}:{showGrades?:boolean}) {
  const {activeClass,user}=useSession();
  const staff=user?.role!=="student";
  const list=useApiRows<LkpdProgress>(activeClass?"/lkpd-progress?classroom_id="+activeClass:null);
  const submitted=list.rows.filter(m=>m.works.some(w=>w.pages_submitted===w.pages_total&&w.pages_total>0)).length;
  const reviewed=list.rows.filter(m=>m.works.some(w=>w.status==="reviewed")).length;
  return <section className="panel"><h2>{showGrades?"Nilai dan masukan LKPD":staff?"Progres LKPD kelas":"Progres LKPD saya"}</h2><AsyncState loading={list.loading} error={list.error} retry={()=>list.reload()}/>
    {!showGrades&&<div className="lkpd-summary-metrics"><div><strong>{list.rows.length}</strong><span>LKPD tersedia</span></div><div><strong>{submitted}</strong><span>Sudah dikirim lengkap</span></div><div><strong>{reviewed}</strong><span>Sudah ditinjau guru</span></div></div>}
    {!list.loading&&!list.rows.length&&<p className="soft-note">Belum ada LKPD yang diterbitkan untuk kelasmu.</p>}
    <div className="record-list">{list.rows.map(module=><article key={module.id}><h3>{module.title}</h3>{!module.works.length?<p>Belum mulai · Belum dinilai</p>:module.works.map(work=><div key={work.id}><span className="soft-badge">{statusLabel(work.status)}</span><p>{work.pages_submitted} dari {work.pages_total} bagian terkirim · {work.group}</p>{showGrades&&<><p>Nilai kelompok: <strong>{work.score==null?"Belum dinilai":work.score+" / 100"}</strong></p>{work.feedback&&<p>Masukan guru: {work.feedback}</p>}{work.reviewedBy&&<small>Dinilai oleh {work.reviewedBy}{work.reviewed_at?" · "+new Date(work.reviewed_at).toLocaleDateString("id-ID"):""}</small>}</>}</div>)}<Link className="text-button" href={user?.role==="admin"?"/admin/konten/lkpd/"+module.id:(staff?"/guru/tinjauan":"/siswa")+"?pertemuan="+(module.topic+1)}>Buka LKPD</Link></article>)}</div>
  </section>;
}
