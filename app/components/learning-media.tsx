"use client";
import { useEffect, useState, type FormEvent } from "react";
import { apiRequest } from "../lib/api";
import { useSession } from "./session-provider";
import { FriendlyIcon } from "./friendly-icon";
import { Field, AsyncState, errorMessage } from "./lms-shared";
import { QuestionVisual } from "./question-visual";
import { parseQuestionVideo, type QuestionVideoMedia } from "../lib/question-media";

export function YouTubePlayer({videoId,title,caption}:{videoId?:string|null;title:string;caption?:string|null}) {
 const [opened,setOpened]=useState(false);if(!videoId||!/^[A-Za-z0-9_-]{11}$/.test(videoId))return null;
 return <section className="learning-video" aria-label={title}><div className="section-heading"><div><p className="eyebrow">TONTON DAN AMATI</p><h3>{title}</h3></div><FriendlyIcon name="play" size={38}/></div>{caption&&<p className="video-caption">{caption}</p>}
 {opened?<iframe key={videoId} className="youtube-frame" src={"https://www.youtube-nocookie.com/embed/"+videoId+"?playsinline=1&rel=0&cc_load_policy=1&cc_lang_pref=id&hl=id"} title={title} loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>:<button type="button" className="video-cover" onClick={()=>setOpened(true)}><FriendlyIcon name="play" size={74}/><strong>Buka video pembelajaran</strong><span>Siapkan koneksi internet, lalu tonton dengan tenang.</span></button>}
 <div className="video-footer"><small>Jika belum paham, jeda atau putar ulang bagian yang kamu perlukan.</small><a className="text-button" href={"https://www.youtube.com/watch?v="+videoId} target="_blank" rel="noopener noreferrer">Buka di YouTube</a></div></section>;
}
export function AudioPlayer({url,title}:{url?:string|null;title:string}) {
 const [error,setError]=useState(false);if(!url||!url.startsWith("https://"))return null;
 return <section className="learning-audio"><FriendlyIcon name="heart" size={36}/><div><strong>Dengarkan: {title}</strong><audio controls preload="none" src={url} onError={()=>setError(true)}>Perangkat ini belum mendukung audio.</audio>{error&&<p className="helper">Audio belum bisa diputar. Minta guru memeriksa tautannya.</p>}</div></section>;
}
export function LessonVideo({topic,phase}:{topic:number;phase:number}) {
 const {activeClass}=useSession();const [media,setMedia]=useState<{title:string;videoId:string|null;videoCaption:string|null}|null>(null),[error,setError]=useState("");
 useEffect(()=>{let alive=true;if(!activeClass)return;apiRequest<{data:NonNullable<typeof media>}>("/learning-modules/videos/"+topic+"?classroom_id="+activeClass,{maxAgeMs:30000}).then(r=>{if(alive){setMedia(r.data);setError("");}}).catch(e=>{if(alive)setError(errorMessage(e));});return()=>{alive=false;};},[activeClass,topic]);
 return <>{media?.videoId?<YouTubePlayer key={media.videoId} videoId={media.videoId} title={media.title} caption={media.videoCaption}/>:<QuestionVisual topic={topic} phase={phase}/>} {error&&<p className="helper">Video belum termuat. Petunjuk belajar tetap bisa dibaca.</p>}</>;
}
type ModuleMedia={id:number;title:string;videoId:string|null;videoCaption:string|null;videoVersion:number;videoOverride:boolean};
export type QuestionMediaField = {key:string;label:string;hint:string;phase:number;source?:string|null;video_url?:string|null;video?:QuestionVideoMedia|null;image_id?:string|null;image_url?:string|null;image_alt?:string|null;media_caption?:string|null};

export function QuestionMediaVisual({field,topic}:{field:QuestionMediaField;topic:number}) {
 const video=field.video_url!==undefined?parseQuestionVideo(field.video_url):field.video;
 if(video?.provider==="youtube"&&video.id&&/^[A-Za-z0-9_-]{11}$/.test(video.id))return <YouTubePlayer key={video.id} videoId={video.id} title={field.label} caption={field.media_caption}/>;
 if(video?.url?.startsWith("https://"))return <QuestionVideo key={video.url} video={video} title={field.label} caption={field.media_caption}/>;
 if(field.image_url?.startsWith("/api/v1/learning-modules/"))return <QuestionPhoto key={field.image_url} field={field} topic={topic}/>;
 return <QuestionVisual topic={topic} phase={field.phase}/>;
}

function QuestionPhoto({field,topic}:{field:QuestionMediaField;topic:number}) {
 const [broken,setBroken]=useState(false);
 // Private photo URLs require the browser session cookie.
 // eslint-disable-next-line @next/next/no-img-element
 return broken?<><QuestionVisual topic={topic} phase={field.phase}/><p className="helper">Foto belum termuat. Minta bantuan gurumu jika diperlukan, ya.</p></>:<figure className="question-photo"><img src={field.image_url!} alt={field.image_alt||field.label} loading="lazy" decoding="async" onError={()=>setBroken(true)}/>{field.media_caption&&<figcaption>{field.media_caption}</figcaption>}</figure>;
}

function QuestionVideo({video,title,caption}:{video:NonNullable<QuestionMediaField["video"]>;title:string;caption?:string|null}) {
 const [opened,setOpened]=useState(false);
 const tiktok=video.provider==="tiktok"&&video.id&&/^\d{12,25}$/.test(video.id);
 const embedded=tiktok||video.provider==="file";
 return <section className={"learning-video question-video "+(tiktok?"question-video-tiktok":"")} aria-label={"Video untuk "+title}>
   <div className="section-heading"><div><p className="eyebrow">AMATI BERSAMA</p><h3>Video dari gurumu</h3>{caption&&<p>{caption}</p>}</div><FriendlyIcon name="play" size={34}/></div>
   {embedded?(opened?(tiktok?<iframe className="question-video-frame" src={"https://www.tiktok.com/player/v1/"+video.id+"?autoplay=0&loop=0&rel=0&controls=1"} title={title} loading="lazy" allow="fullscreen; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>:<video className="question-video-frame" src={video.url} controls preload="none" aria-label={title}/>):<button className="video-cover" type="button" onClick={()=>setOpened(true)}><FriendlyIcon name="play" size={64}/><strong>Buka video pertanyaan ini</strong><span>Amati videonya, lalu ceritakan pendapatmu.</span></button>):<a className="video-cover" href={video.url} target="_blank" rel="noopener noreferrer"><FriendlyIcon name="play" size={64}/><strong>Buka video dari gurumu</strong><span>Video dibuka di tab baru.</span></a>}
   <div className="video-footer"><small>Kamu boleh menjeda atau mengulang videonya.</small><a className="text-button" href={video.url} target="_blank" rel="noopener noreferrer">Buka video di tab baru</a></div>
 </section>;
}

export function ModuleVideoEditor({moduleId}:{moduleId:number}) {
 const {activeClass,user}=useSession();const [data,setData]=useState<ModuleMedia|null>(null),[url,setUrl]=useState(""),[caption,setCaption]=useState(""),[loading,setLoading]=useState(true),[error,setError]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[revision,setRevision]=useState(0);
 useEffect(()=>{let alive=true;if(!activeClass){setLoading(false);return;}setLoading(true);apiRequest<{data:ModuleMedia}>("/learning-modules/"+moduleId+"?classroom_id="+activeClass).then(r=>{if(alive){setData(r.data);setUrl(r.data.videoId?"https://youtu.be/"+r.data.videoId:"");setCaption(r.data.videoCaption??"");setError("");}}).catch(e=>{if(alive)setError(errorMessage(e));}).finally(()=>{if(alive)setLoading(false);});return()=>{alive=false;};},[moduleId,activeClass,revision]);
 const submit=async(e:FormEvent)=>{e.preventDefault();setBusy(true);setError("");try{await apiRequest("/learning-modules/"+moduleId+"/video",{method:"PUT",body:JSON.stringify({classroom_id:activeClass,version:data?.videoVersion??0,youtube_url:url||null,video_caption:caption||null})});setMessage("Video LKPD untuk kelas ini sudah diperbarui.");setRevision(v=>v+1);}catch(e){setError(errorMessage(e));}finally{setBusy(false);}};
 if(!activeClass||user?.role==="student")return null;
 return <section className="panel"><div className="section-heading"><div><p className="eyebrow">VIDEO UNTUK KELAS TERPILIH</p><h3>Media pendamping LKPD</h3><p>Tempel link YouTube milik pembelajaranmu. Video tersimpan sebagai tautan dan dapat berbeda pada setiap kelas.</p></div><FriendlyIcon name="play" size={40}/></div><AsyncState loading={loading} error={error} retry={()=>setRevision(v=>v+1)}/>{data&&<><YouTubePlayer key={data.videoId} videoId={data.videoId} title={data.title} caption={data.videoCaption}/><form className="lms-form" onSubmit={submit}><fieldset disabled={busy}><Field label="Link YouTube" hint="Boleh link youtube.com/watch, youtu.be, Shorts, atau ID video. Kosongkan untuk menghapus video kelas ini."><input type="text" maxLength={2048} value={url} placeholder="https://www.youtube.com/watch?v=…" onChange={e=>setUrl(e.target.value)}/></Field><Field label="Yang perlu diamati siswa"><textarea rows={3} maxLength={3000} value={caption} onChange={e=>setCaption(e.target.value)}/></Field><p className="helper">Pilih video yang sesuai usia siswa dan mengizinkan pemutaran embed. Teks petunjuk LKPD tetap tersedia saat video belum diisi.</p><button className="button primary">{busy?"Menyimpan…":"Simpan video kelas ini"}</button></fieldset>{message&&<p className="notice" role="status">{message}</p>}</form></>}</section>;
}
type ProgressRow={id:number;status:string;version:number;content_version:number;completed_at:string|null};
type Criteria={rule:string;minimum_score:number|null;materials_total:number;materials_done:number;tasks_total:number;tasks_done:number;assessments_total:number;assessments_done:number;eligible:boolean};
export function CompletionCard({kind,id,contentVersion}:{kind:"material"|"lesson";id:string|number;contentVersion:number}) {
 const {user,activeClass,classrooms}=useSession();const [row,setRow]=useState<ProgressRow|null>(null),[criteria,setCriteria]=useState<Criteria|null>(null),[current,setCurrent]=useState(false),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(""),[revision,setRevision]=useState(0);
 const path=(kind==="material"?"/materials/":"/course-lessons/")+id+"/progress";
 useEffect(()=>{let alive=true;if(user?.role!=="student")return;setLoading(true);apiRequest<{data:ProgressRow|null;criteria?:Criteria;is_current:boolean}>(path).then(r=>{if(alive){setRow(r.data);setCurrent(r.is_current);setCriteria(r.criteria??null);setError("");}}).catch(e=>{if(alive)setError(errorMessage(e));}).finally(()=>{if(alive)setLoading(false);});return()=>{alive=false;};},[path,user?.role,revision]);
 const update=async(status:string)=>{setBusy(true);setError("");try{await apiRequest(path,{method:"PUT",body:JSON.stringify({status,version:row?.version??0,content_version:contentVersion})});setRevision(v=>v+1);}catch(e){setError(errorMessage(e));}finally{setBusy(false);}};
 if(user?.role!=="student")return null;const done=row?.status==="completed"&&current;const archived=classrooms.find(c=>c.id===activeClass)?.archived;
 return <section className="completion-card"><FriendlyIcon name={done?"check":"sprout"} size={44}/><div><h3>{done?"Sudah kamu selesaikan!":kind==="material"?"Belajar pelan-pelan juga boleh.":"Bagaimana perjalanan belajarmu?"}</h3>{criteria&&<p>Materi {criteria.materials_done}/{criteria.materials_total} · Tugas {criteria.tasks_done}/{criteria.tasks_total} · Kuis {criteria.assessments_done}/{criteria.assessments_total}{criteria.minimum_score!==null?" · Nilai minimum "+criteria.minimum_score:""}</p>}<p>{row&&!current?"Ada pembaruan. Baca kembali sebelum menandai selesai.":done?"Kamu bisa membaca dan mengulangnya kapan saja.":"Tandai mulai saat belajar, lalu selesai setelah mengikuti petunjuk guru."}</p><div className="inline-actions">{!done&&<><button type="button" className="button secondary" disabled={loading||busy||archived} onClick={()=>update("started")}>{row&&current?"Sedang kupelajari":"Mulai kupelajari"}</button><button type="button" className="button primary" disabled={loading||busy||archived||criteria!==null&&!criteria.eligible} onClick={()=>update("completed")}>{busy?"Menyimpan…":"Tandai selesai"}<FriendlyIcon name="check" size={22}/></button></>}</div>{error&&<p className="form-error" role="alert">{error}<button className="text-button" onClick={()=>setRevision(v=>v+1)}>Muat progres terbaru</button></p>}</div></section>;
}
