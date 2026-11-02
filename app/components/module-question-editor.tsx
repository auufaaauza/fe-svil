"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { apiRequest, ApiError } from "../lib/api";
import { useSession } from "./session-provider";
import { AsyncState, Field, errorMessage } from "./lms-shared";
import { FriendlyIcon } from "./friendly-icon";
import { ThemeSelect } from "./theme-select";
import { QuestionMediaVisual, type QuestionMediaField } from "./learning-media";

type Document = {id:number;topic:number;title:string;description:string;instructions:string;fields:QuestionMediaField[];contentVersion:number;contentOverride:boolean};

export function ModuleQuestionEditor({moduleId}:{moduleId:number}) {
 const {activeClass}=useSession();
 return <ClassQuestionEditor key={String(activeClass)+"-"+moduleId} moduleId={moduleId}/>;
}

function ClassQuestionEditor({moduleId}:{moduleId:number}) {
 const {user,activeClass,classrooms}=useSession();
 const [applyToDrafts,setApplyToDrafts]=useState(false),[editing,setEditing]=useState(false),[data,setData]=useState<Document|null>(null),[title,setTitle]=useState(""),[description,setDescription]=useState(""),[instructions,setInstructions]=useState("");
 const [fields,setFields]=useState<QuestionMediaField[]>([]),[files,setFiles]=useState<Record<string,File>>({}),[page,setPage]=useState(0),[loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(""),[reload,setReload]=useState(0);
 const adopt=useCallback((document:Document)=>{setData(document);setTitle(document.title);setDescription(document.description);setInstructions(document.instructions);setFields(document.fields);setFiles({});setApplyToDrafts(false);},[]);
 useEffect(()=>{if(!editing||!activeClass)return;const controller=new AbortController();apiRequest<{data:Document}>("/learning-modules/"+moduleId+"?classroom_id="+activeClass,{signal:controller.signal}).then(r=>adopt(r.data)).catch(e=>{if(!controller.signal.aborted)setError(errorMessage(e));}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();},[moduleId,activeClass,editing,reload,adopt]);
 const update=(index:number,patch:Partial<QuestionMediaField>)=>setFields(current=>current.map((field,i)=>i===index?{...field,...patch}:field));
 const save=async(event:FormEvent)=>{
   event.preventDefault();if(!data||!activeClass)return;setBusy(true);setError("");
   const body=new FormData();body.set("_method","PUT");body.set("classroom_id",String(activeClass));body.set("version",String(data.contentVersion));body.set("title",title);body.set("description",description);body.set("instructions",instructions);
   body.set("apply_to_drafts",applyToDrafts?"1":"0");
   body.set("fields",JSON.stringify(fields.map(field=>({key:field.key,label:field.label,hint:field.hint,phase:field.phase,source:field.source??null,video_url:field.video_url??field.video?.url??null,image_id:field.image_id??null,image_alt:field.image_alt??field.label,media_caption:field.media_caption??null}))));
   for(const field of fields){if(files[field.key])body.set("photos["+field.key+"]",files[field.key]);}
   try{const response=await apiRequest<{data:Document}>("/learning-modules/"+moduleId+"/content",{method:"POST",body,successMessage:"Pertanyaan dan media LKPD untuk kelas ini berhasil disimpan.",notifyError:true});adopt(response.data);}
   catch(cause){setError(errorMessage(cause));if(cause instanceof ApiError&&cause.errors){const match=Object.keys(cause.errors).find(key=>/^fields\.\d+\./.test(key))?.match(/^fields\.(\d+)\./);if(match)setPage(Math.floor(Number(match[1])/4));}}
   finally{setBusy(false);}
 };
 if(user?.role==="student")return null;
 const className=classrooms.find(c=>c.id===activeClass)?.name??"kelas terpilih";
 const total=Math.max(1,Math.ceil(fields.length/4));
 return <section className="panel module-question-editor"><div className="section-heading"><div><p className="eyebrow">PERTANYAAN DAN MEDIA · {className.toUpperCase()}</p><h2>Sunting LKPD untuk kelasmu</h2><p>Ubah isi pertanyaan, unggah foto, atau tambahkan video untuk membantu murid memahami kegiatan.</p></div><button className="button secondary" disabled={!activeClass||busy} onClick={()=>{setLoading(!editing);setError("");setData(null);setPage(0);setEditing(value=>!value);}}><FriendlyIcon name={editing?"close":"edit"} size={24}/>{editing?"Tutup editor":"Ubah pertanyaan & media"}</button></div>
 {!activeClass&&<p className="soft-note">Pilih kelas terlebih dahulu untuk menyunting LKPD.</p>}
 {editing&&<><AsyncState loading={loading} error={error} retry={()=>{setLoading(true);setData(null);setError("");setReload(value=>value+1);}}/>{data&&<form className="lms-form" onSubmit={save}><fieldset disabled={busy}>
   <div className="soft-note">Perubahan tersimpan khusus untuk {className}. LKPD yang sudah mulai dikerjakan tetap memakai versi pertanyaannya, kecuali kamu memilih memperbarui draf di bawah. Simpan perubahan sebelum menutup editor.</div>
   <Field label="Judul LKPD"><input required maxLength={180} value={title} onChange={e=>setTitle(e.target.value)}/></Field><Field label="Ringkasan"><textarea required maxLength={2000} rows={2} value={description} onChange={e=>setDescription(e.target.value)}/></Field><Field label="Petunjuk belajar"><textarea required maxLength={8000} rows={3} value={instructions} onChange={e=>setInstructions(e.target.value)}/></Field>
   <div className="work-pagination"><button type="button" className="button secondary" disabled={!page} onClick={()=>setPage(value=>value-1)}>Sebelumnya</button><span>Bagian {page+1}/{total} · {fields.length} pertanyaan</span><button type="button" className="button secondary" disabled={page+1>=total} onClick={()=>setPage(value=>value+1)}>Berikutnya</button></div>
   {fields.slice(page*4,page*4+4).map((field,localIndex)=>{const index=page*4+localIndex;return <article className="module-question-card" key={field.key}><div className="section-heading"><h3>Pertanyaan {index+1}</h3><button type="button" className="text-button" disabled={fields.length<=1} onClick={()=>{setFields(current=>current.filter((_,i)=>i!==index));setPage(value=>Math.min(value,Math.max(0,Math.ceil((fields.length-1)/4)-1)));}}>Hapus pertanyaan</button></div>
     <Field label="Isi pertanyaan"><textarea required rows={2} maxLength={500} value={field.label} onChange={e=>update(index,{label:e.target.value})}/></Field><Field label="Petunjuk menjawab"><textarea required rows={2} maxLength={1500} value={field.hint} onChange={e=>update(index,{hint:e.target.value})}/></Field>
     <ThemeSelect label="Tahap belajar" value={field.phase} onChange={value=>update(index,{phase:Number(value)})} options={["Mengamati","Mencari fakta","Berdiskusi","Refleksi","Aksi nyata"].map((label,value)=>({label,value:String(value)}))}/>
     <Field label="Link video · YouTube, TikTok, atau situs lainnya" hint="Gunakan link lengkap TikTok /@akun/video/ID untuk pemutar di halaman. Tautan situs lain tetap bisa dibuka di tab baru."><input type="url" maxLength={2048} value={field.video_url??field.video?.url??""} onChange={e=>update(index,{video_url:e.target.value,video:null})} placeholder="https://…"/></Field>
     <Field label="Foto pendamping · PNG, JPG, WebP maksimal 1 MB"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>1048576||!["image/png","image/jpeg","image/webp"].includes(file.type)){setError("Pilih foto PNG, JPG, atau WebP maksimal 1 MB.");e.target.value="";return;}setFiles(current=>({...current,[field.key]:file}));setError("");}}/></Field>
     {(files[field.key]||field.image_url)&&<div className="question-photo-editor"><PhotoPreview file={files[field.key]} url={field.image_url} alt={field.image_alt||field.label}/><button className="text-button" type="button" onClick={()=>{setFiles(current=>{const next={...current};delete next[field.key];return next;});update(index,{image_id:null,image_url:null});}}>Hapus foto</button></div>}
     <Field label="Deskripsi foto"><input maxLength={500} value={field.image_alt??""} onChange={e=>update(index,{image_alt:e.target.value})}/></Field><Field label="Yang perlu diamati dari media"><input maxLength={1000} value={field.media_caption??""} onChange={e=>update(index,{media_caption:e.target.value})}/></Field><p className="helper">Video ditampilkan lebih dulu jika foto dan video sama-sama diisi. Tanpa media, murid melihat ilustrasi animasi.</p>
     <details className="source-document"><summary>Pratinjau media pertanyaan</summary><QuestionMediaVisual key={field.key+"-"+(field.video_url??"")} field={field} topic={data.topic}/></details>
   </article>})}
   <label className="checkbox-label module-apply-drafts"><input type="checkbox" checked={applyToDrafts} onChange={e=>setApplyToDrafts(e.target.checked)}/><span>Terapkan juga ke draf kelompok yang belum mengirim lembar apa pun. Jawaban yang sudah ditulis tetap tersimpan; kiriman yang sudah masuk tetap memakai versi sebelumnya.</span></label>
   <div className="inline-actions"><button type="button" className="button secondary" disabled={fields.length>=150} onClick={()=>{setFields(current=>[...current,{key:"q_"+crypto.randomUUID().replaceAll("-",""),label:"",hint:"Ceritakan hasil pengamatanmu.",phase:0}]);setPage(Math.floor(fields.length/4));}}><FriendlyIcon name="plus" size={23}/>Tambah pertanyaan</button><button className="button primary">{busy?"Menyimpan LKPD…":"Simpan pertanyaan & media"}<FriendlyIcon name="check" size={24}/></button></div>
 </fieldset></form>}</>}
 </section>;
}

function PhotoPreview({file,url,alt}:{file?:File;url?:string|null;alt:string}) {
 const image=useRef<HTMLImageElement>(null);
 useEffect(()=>{const objectUrl=file?URL.createObjectURL(file):null;if(image.current)image.current.src=objectUrl??url??"";return()=>{if(objectUrl)URL.revokeObjectURL(objectUrl);};},[file,url]);
 // Private authenticated photos and local file previews bypass the public image optimizer.
 // eslint-disable-next-line @next/next/no-img-element
 return file||url?<img ref={image} src={url??undefined} alt={alt}/>:null;
}
