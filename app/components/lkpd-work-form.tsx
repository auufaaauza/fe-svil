"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { apiRequest } from "../lib/api";
import { useUnsavedChanges } from "../lib/unsaved-changes";
import { useSession } from "./session-provider";
import { QuestionMediaVisual, YouTubePlayer, type QuestionMediaField } from "./learning-media";
import { FriendlyIcon } from "./friendly-icon";

type Group = { id: number; name: string; classroom_id: number; users: { id: number; name: string }[] };
type PageReview = { review_status: string; feedback: string | null };
type Work = { id:number;version:number;answers:Record<string,string>;status:string;score:number|null;feedback:string|null;product_value:number|null;presentation_value:number|null;pages_submitted:number;pages_total:number;page_size:number;page_submissions:Record<string,PageReview> };
type Bundle = { data:Work|null;fields:QuestionMediaField[];module:{title:string;instructions:string;version:number;pageSize:number;videoId?:string|null;videoCaption?:string|null} };
const labels:Record<string,string>={draft:"Draf",partially_submitted:"Sebagian terkirim",submitted:"Menunggu guru",needs_revision:"Perlu perbaikan",reviewed:"Sudah dinilai"};
const messageOf=(error:unknown)=>error instanceof Error?error.message:"Belum berhasil. Coba lagi, ya.";

export function WorkForm({group,topic,staff}:{group:Group;topic:number;staff:boolean}) {
  const {user}=useSession();
  const query=useSearchParams();
  const [bundle,setBundle]=useState<Bundle|null>(null),[answers,setAnswers]=useState<Record<string,string>>({});
  const [page,setPage]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
  const [feedbackDraft,setFeedbackDraft]=useState<{page:number;text:string}|null>(null),[score,setScore]=useState(""),[revision,setRevision]=useState(0);
  const pending=useRef(false),panel=useRef<HTMLElement>(null);
  const size=bundle?.data?.page_size??bundle?.module.pageSize??4;
  const total=Math.ceil((bundle?.fields.length??0)/size);
  const fields=bundle?.fields.slice(page*size,page*size+size)??[];
  const pageReview=bundle?.data?.page_submissions?.[String(page)];
  const feedback=feedbackDraft?.page===page?feedbackDraft.text:pageReview?.feedback??bundle?.data?.feedback??"";
  const locked=!staff&&size===1&&Boolean(pageReview)&&pageReview?.review_status!=="needs_revision";
  const dirty=!staff&&fields.some(field=>(answers[field.key]??"")!==(bundle?.data?.answers[field.key]??""));
  useUnsavedChanges(dirty);
  useEffect(()=>{
    let alive=true;
    apiRequest<Bundle>(`/groups/${group.id}/work/${topic}`).then(result=>{
      if(!alive)return;
      setBundle(result);setAnswers(result.data?.answers??{});setError("");
      const pageSize=result.data?.page_size??result.module.pageSize??4;
      const count=Math.ceil(result.fields.length/pageSize);
      const requested=Number(query.get("lembar"));
      const next=Array.from({length:count},(_,i)=>i).find(i=>!result.data?.page_submissions?.[String(i)]||result.data.page_submissions[String(i)].review_status==="needs_revision")??0;
      setPage(Number.isInteger(requested)&&requested>=1&&requested<=count?requested-1:next);
      setScore(result.data?.score===null||result.data?.score===undefined?"":String(result.data.score));
    }).catch(cause=>{if(alive)setError(messageOf(cause));});
    return()=>{alive=false;};
  },[group.id,topic,revision,query]);
  const scroll=()=>requestAnimationFrame(()=>panel.current?.scrollIntoView({block:"start",behavior:"instant"}));
  const save=async(status:"draft"|"submitted"):Promise<boolean>=>{
    if(!bundle||pending.current||locked)return false;
    if(status==="submitted") {
      const missing=fields.find(field=>!answers[field.key]?.trim());
      if(missing){setError("Lengkapi jawaban sebelum mengirim, ya.");document.getElementById("work-"+missing.key)?.focus();return false;}
      if(!window.confirm("Kirim jawaban bagian ini ke guru? Setelah dikirim, perubahan memerlukan izin perbaikan dari guru."))return false;
    }
    pending.current=true;setBusy(true);setError("");setNotice("");
    try {
      const result=await apiRequest<{data:Work}>(`/groups/${group.id}/work/${topic}`,{method:"PUT",body:JSON.stringify({version:bundle.data?.version??0,status,page,answers:Object.fromEntries(fields.map(field=>[field.key,answers[field.key]??""]))})});
      setBundle({...bundle,data:result.data});setAnswers(result.data.answers);
      setNotice(status==="submitted"?"Jawaban sudah dikirim ke guru.":"Draf tersimpan. Kamu bisa melanjutkan kapan saja.");
      if(status==="submitted"&&page+1<total){setPage(page+1);scroll();}
      return true;
    }catch(cause){setError(messageOf(cause));return false;}
    finally{pending.current=false;setBusy(false);}
  };
  const move=async(next:number)=>{
    if(dirty&&!await save("draft"))return;
    setPage(next);setNotice("");setError("");scroll();
  };
  const submit=async(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();await save(((event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement)?.value==="submitted"?"submitted":"draft");};
  const review=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();if(!bundle?.data||pending.current)return;
    const action=((event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement)?.value;
    pending.current=true;setBusy(true);setError("");
    try{
      const result=await apiRequest<{data:Work}>(`/group-work/${bundle.data.id}/review`,{method:"PUT",body:JSON.stringify({version:bundle.data.version,feedback,status:action==="needs_revision"?"needs_revision":"reviewed",...(action==="all"?{score:score===""?null:Number(score)}:{page})})});
      setBundle({...bundle,data:result.data});setNotice("Masukan guru berhasil disimpan.");
    }catch(cause){setError(messageOf(cause));}finally{pending.current=false;setBusy(false);}
  };
  if(!bundle)return <section className="panel" role="status">{error?<><p className="form-error">{error}</p><button className="button secondary" onClick={()=>setRevision(v=>v+1)}>Coba lagi</button></>:"Menyiapkan LKPD…"}</section>;
  return <section className="panel work-panel simple-lkpd" ref={panel}>
    <div className="section-heading"><div><p className="eyebrow">LKPD · {group.name}</p><h2>{bundle.module.title}</h2></div><span className="soft-badge">{labels[bundle.data?.status??"draft"]}</span></div>
    <details className="lkpd-instructions"><summary>Tujuan petunjuk dan bacaan kegiatan</summary><LearningInstructions text={bundle.module.instructions}/></details>
    <YouTubePlayer videoId={bundle.module.videoId} title={bundle.module.title} caption={bundle.module.videoCaption}/>
    <div className="lkpd-progress"><span>{size===1?"Pertanyaan":"Lembar"} {page+1} dari {total}</span><span>{bundle.data?.pages_submitted??0} terkirim</span><progress value={bundle.data?.pages_submitted??0} max={Math.max(1,total)}/></div>
    {error&&<div className="form-error" role="alert">{error}<button className="text-button" onClick={()=>{if(!dirty||window.confirm("Muat data server? Jawaban yang belum tersimpan pada halaman ini akan diganti."))setRevision(v=>v+1);}}>Muat versi terbaru</button></div>}
    {notice&&<p className="notice" role="status">{notice}</p>}
    <form onSubmit={submit}><fieldset disabled={busy} className="work-fields">
      {fields.map((field,index)=><section className="work-question" key={field.key}><label className="field-label work-question-title" htmlFor={"work-"+field.key}>{page*size+index+1}. {field.label}</label><QuestionMediaVisual field={field} topic={topic}/>{field.hint&&<p className="helper material-body">{field.hint}</p>}<textarea id={"work-"+field.key} rows={5} maxLength={8000} readOnly={staff||locked} value={answers[field.key]??""} onChange={e=>setAnswers(current=>({...current,[field.key]:e.target.value}))} placeholder={staff?"Belum ada jawaban.":"Tulis hasil diskusi di sini…"}/></section>)}
      {!staff&&!locked&&<div className="form-actions"><button className="button secondary" value="draft">{busy?"Menyimpan…":"Simpan draf"}</button><button className="button primary" value="submitted">Kirim jawaban <FriendlyIcon name="arrow" size={22}/></button></div>}
      {locked&&<p className="soft-note">Jawaban sudah terkirim. Kamu dapat membaca masukan; guru akan membuka perbaikan jika diperlukan.</p>}
    </fieldset></form>
    {pageReview?.feedback&&<div className="teacher-feedback"><strong>Masukan guru</strong><p>{pageReview.feedback}</p></div>}
    {bundle.data?.score!==null&&bundle.data?.score!==undefined&&<p className="lkpd-grade">Nilai LKPD kelompok: <strong>{bundle.data.score} / 100</strong></p>}
    {(bundle.data?.product_value!=null||bundle.data?.presentation_value!=null)&&<p>Nilai produk: {bundle.data.product_value??"Belum dinilai"} · Presentasi: {bundle.data.presentation_value??"Belum dinilai"}</p>}
    <div className="work-pagination"><button type="button" className="button secondary" disabled={busy||page===0} onClick={()=>move(page-1)}>Sebelumnya</button><span>{page+1} / {total}</span><button type="button" className="button secondary" disabled={busy||page+1>=total} onClick={()=>move(page+1)}>Berikutnya</button></div>
    {staff&&user?.role==="teacher"&&bundle.data&&pageReview&&<form className="review-box" onSubmit={review}><h3>Masukan dan penilaian guru</h3><label className="field-label" htmlFor="lkpd-feedback">Apresiasi dan langkah perbaikan</label><textarea id="lkpd-feedback" required rows={3} maxLength={3000} value={feedback} onChange={e=>setFeedbackDraft({page,text:e.target.value})}/><div className="form-actions"><button className="button secondary" value="needs_revision" disabled={busy}>Minta perbaikan</button><button className="button secondary" value="reviewed" disabled={busy}>Tinjau bagian ini</button></div>{bundle.data.pages_submitted===total&&<><label className="field-label" htmlFor="lkpd-score">Nilai LKPD 0–100 (opsional, sesuai rubrik guru)</label><input id="lkpd-score" type="number" min={0} max={100} step="0.01" value={score} onChange={e=>setScore(e.target.value)}/><button className="button primary" value="all" disabled={busy}>Terbitkan seluruh hasil</button></>}</form>}
  </section>;
}

function LearningInstructions({text}:{text:string}) {
 return <div className="material-body">{text.split(/(https:\/\/[^\s]+)/g).map((part,index)=>part.startsWith("https://")?<a className="text-button" key={index} href={part} target="_blank" rel="noopener noreferrer">{part.includes("wordwall.net")?"Buka kuis":part.includes("canva.link")?"Buka peta":"Buka media sumber"}</a>:<span key={index}>{part}</span>)}</div>;
}
