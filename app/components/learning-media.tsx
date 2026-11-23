"use client";
import { useEffect, useRef, useState } from "react";
import { apiRequest } from "../lib/api";
import { useSession } from "./session-provider";
import { FriendlyIcon } from "./friendly-icon";
import { errorMessage } from "./lms-shared";
import { parseQuestionVideo, type QuestionVideoMedia } from "../lib/question-media";

export function YouTubePlayer({videoId,title,caption}:{videoId?:string|null;title:string;caption?:string|null}) {
 const [opened,setOpened]=useState(false);if(!videoId||!/^[A-Za-z0-9_-]{11}$/.test(videoId))return null;
 return <section className="learning-video" aria-label={title}><div className="section-heading"><div><p className="eyebrow">TONTON DAN AMATI</p><h3>{title}</h3></div><FriendlyIcon name="play" size={38}/></div>{caption&&<p className="video-caption">{caption}</p>}
 {opened?<iframe key={videoId} className="youtube-frame" src={"https://www.youtube-nocookie.com/embed/"+videoId+"?playsinline=1&rel=0&cc_load_policy=1&cc_lang_pref=id&hl=id"} title={title} loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>:<button type="button" className="video-cover" onClick={()=>setOpened(true)}><FriendlyIcon name="play" size={74}/><strong>Buka video pembelajaran</strong><span>Siapkan koneksi internet, lalu tonton dengan tenang.</span></button>}
 <div className="video-footer"><small>Jika belum paham, jeda atau putar ulang bagian yang kamu perlukan.</small><a className="text-button" href={"https://www.youtube.com/watch?v="+videoId} target="_blank" rel="noopener noreferrer">Buka di YouTube</a></div></section>;
}
export function AudioPlayer({url,title}:{url?:string|null;title:string}) {
 const [error,setError]=useState(false);if(!url||!url.startsWith("https://"))return null;
 return <section className="learning-audio"><FriendlyIcon name="audio" size={36}/><div><strong>Dengarkan: {title}</strong><audio controls preload="none" src={url} onError={()=>setError(true)}>Perangkat ini belum mendukung audio.</audio>{error&&<p className="helper">Audio belum bisa diputar. Minta guru memeriksa tautannya.</p>}</div></section>;
}
export type QuestionMediaField = {key:string;label:string;hint:string;phase:number;source?:string|null;video_url?:string|null;video?:QuestionVideoMedia|null;image_id?:string|null;image_url?:string|null;image_alt?:string|null;media_caption?:string|null};

export function QuestionMediaVisual({field}:{field:QuestionMediaField;topic:number}) {
 const video=field.video_url!==undefined?parseQuestionVideo(field.video_url):field.video;
 return <>{field.image_url?.startsWith("/api/v1/learning-modules/")&&<QuestionPhoto key={field.image_url} field={field}/>}{video?.provider==="youtube"&&video.id&&/^[A-Za-z0-9_-]{11}$/.test(video.id)?<YouTubePlayer key={video.id} videoId={video.id} title={field.label} caption={field.media_caption}/>:video?.url?.startsWith("https://")?<QuestionVideo key={video.url} video={video} title={field.label} caption={field.media_caption}/>:null}</>;
}

function QuestionPhoto({field}:{field:QuestionMediaField}) {
 const [broken,setBroken]=useState(false);
 // Private photo URLs require the browser session cookie.
 // eslint-disable-next-line @next/next/no-img-element
 return broken?<p className="helper">Gambar belum termuat. Kamu tetap dapat menjawab atau meminta bantuan guru.</p>:<figure className="question-photo"><img src={field.image_url!} alt={field.image_alt||field.label} loading="lazy" decoding="async" onError={()=>setBroken(true)}/>{field.media_caption&&<figcaption>{field.media_caption}</figcaption>}</figure>;
}

function QuestionVideo({video,title,caption}:{video:NonNullable<QuestionMediaField["video"]>;title:string;caption?:string|null}) {
 const [opened,setOpened]=useState(false);
 const [resolved,setResolved]=useState(video),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const frame=useRef<HTMLIFrameElement>(null);
 const tiktok=resolved.provider==="tiktok";
 const embedded=tiktok||resolved.provider==="file";
 useEffect(()=>{if(!opened||!tiktok)return;const receive=(event:MessageEvent)=>{if(event.origin!=="https://www.tiktok.com"||event.source!==frame.current?.contentWindow||event.data?.["x-tiktok-player"]!==true)return;if(["onPlayerError","onError"].includes(event.data.type))setError("Video belum bisa diputar. Coba muat ulang pemutar atau minta guru memeriksa videonya.");};window.addEventListener("message",receive);return()=>window.removeEventListener("message",receive);},[opened,tiktok]);
 const play=async()=>{if(busy)return;setBusy(true);setError("");try{if(tiktok&&!resolved.id){const result=await apiRequest<{data:QuestionVideoMedia}>("/learning-videos/resolve?url="+encodeURIComponent(video.url));const canonical=parseQuestionVideo(result.data.url);if(canonical?.provider!=="tiktok"||!canonical.id)throw new Error("Tautan video belum dikenali. Minta guru memeriksanya.");setResolved(canonical);}setOpened(true);}catch(cause){setError(errorMessage(cause));}finally{setBusy(false);}};
 return <section className={"learning-video question-video "+(tiktok?"question-video-tiktok":"")} aria-label={"Video untuk "+title}>
   <div className="section-heading"><div><p className="eyebrow">AMATI BERSAMA</p><h3>Video dari gurumu</h3>{caption&&<p>{caption}</p>}</div><FriendlyIcon name="play" size={34}/></div>
   {embedded?(opened&&!error?(tiktok?<iframe ref={frame} className="question-video-frame" src={"https://www.tiktok.com/player/v1/"+resolved.id+"?embed_from=oembed&autoplay=0&loop=0&rel=0&controls=1&music_info=1&description=1"} title={title} loading="lazy" allow="fullscreen; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" onError={()=>setError("Pemutar belum termuat. Periksa koneksi lalu coba lagi.")}/>:<video className="question-video-frame" src={resolved.url} controls playsInline preload="metadata" aria-label={title} onError={()=>setError("Video belum termuat. Minta guru memeriksa tautan atau format videonya.")}/>):<button className="video-cover" type="button" disabled={busy} aria-busy={busy} onClick={play}><FriendlyIcon name="play" size={64}/><strong>{busy?"Menyiapkan video…":"Putar video di sini"}</strong><span>Video tampil di halaman ini. Setelah menonton, lanjutkan jawabanmu.</span></button>):<div className="video-unavailable"><p>Penyedia video ini belum mendukung pemutar di halaman. Minta guru menggunakan link YouTube, TikTok, atau video MP4/WebM.</p></div>}
   {error&&<div className="video-error" role="alert"><p>{error}</p><button type="button" className="text-button" onClick={()=>{setOpened(false);setError("");}}>Coba lagi</button></div>}
   <div className="video-footer"><small>{embedded?"Jeda atau putar ulang sesuai kebutuhanmu.":"Gunakan tautan sumber untuk menonton."}</small><details className="video-alternative" open={Boolean(error)||undefined}><summary>Video tidak bisa diputar?</summary><a className="text-button" href={resolved.url} target="_blank" rel="noopener noreferrer">Buka sumber video di tab baru</a></details></div>
 </section>;
}

type ProgressRow={id:number;status:string;version:number;content_version:number;completed_at:string|null};
type Criteria={rule:string;minimum_score:number|null;materials_total:number;materials_done:number;tasks_total:number;tasks_done:number;assessments_total:number;assessments_done:number;eligible:boolean};
export function CompletionCard({kind,id,contentVersion}:{kind:"material"|"lesson";id:string|number;contentVersion:number}) {
 return <CompletionStatus key={kind+":"+id+":"+contentVersion} kind={kind} id={id} contentVersion={contentVersion}/>;
}
function CompletionStatus({kind,id,contentVersion}:{kind:"material"|"lesson";id:string|number;contentVersion:number}) {
 const {user,activeClass,classrooms}=useSession();const [row,setRow]=useState<ProgressRow|null>(null),[criteria,setCriteria]=useState<Criteria|null>(null),[current,setCurrent]=useState(false),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(""),[revision,setRevision]=useState(0);
 const path=(kind==="material"?"/materials/":"/course-lessons/")+id+"/progress";
 useEffect(()=>{let alive=true;if(user?.role!=="student")return;apiRequest<{data:ProgressRow|null;criteria?:Criteria;is_current:boolean}>(path).then(r=>{if(alive){setRow(r.data);setCurrent(r.is_current);setCriteria(r.criteria??null);setError("");}}).catch(e=>{if(alive)setError(errorMessage(e));}).finally(()=>{if(alive)setLoading(false);});return()=>{alive=false;};},[path,user?.role,revision]);
 const update=async(status:string)=>{setBusy(true);setError("");try{await apiRequest(path,{method:"PUT",body:JSON.stringify({status,version:row?.version??0,content_version:contentVersion})});setLoading(true);setRevision(v=>v+1);}catch(e){setError(errorMessage(e));}finally{setBusy(false);}};
 if(user?.role!=="student")return null;const done=row?.status==="completed"&&current;const archived=classrooms.find(c=>c.id===activeClass)?.archived;
 return <section className="completion-card"><FriendlyIcon name={done?"check":"progress"} size={44}/><div><h3>{done?"Sudah kamu selesaikan!":kind==="material"?"Belajar pelan-pelan juga boleh.":"Bagaimana perjalanan belajarmu?"}</h3>{criteria&&<p>Materi {criteria.materials_done}/{criteria.materials_total} · Tugas {criteria.tasks_done}/{criteria.tasks_total} · Kuis {criteria.assessments_done}/{criteria.assessments_total}{criteria.minimum_score!==null?" · Nilai minimum "+criteria.minimum_score:""}</p>}<p>{row&&!current?"Ada pembaruan. Baca kembali sebelum menandai selesai.":done?"Kamu bisa membaca dan mengulangnya kapan saja.":"Tandai mulai saat belajar, lalu selesai setelah mengikuti petunjuk guru."}</p><div className="inline-actions">{!done&&<><button type="button" className="button secondary" disabled={loading||busy||archived} onClick={()=>update("started")}>{row&&current?"Sedang kupelajari":"Mulai kupelajari"}</button><button type="button" className="button primary" disabled={loading||busy||archived||criteria!==null&&!criteria.eligible} onClick={()=>update("completed")}>{busy?"Menyimpan…":"Tandai selesai"}<FriendlyIcon name="check" size={22}/></button></>}</div>{error&&<p className="form-error" role="alert">{error}<button className="text-button" onClick={()=>{setLoading(true);setRevision(v=>v+1);}}>Muat progres terbaru</button></p>}</div></section>;
}
