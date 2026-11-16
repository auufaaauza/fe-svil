"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { apiRequest, ApiError } from "../lib/api";
import { confirmLeave, useUnsavedChanges } from "../lib/unsaved-changes";
import { useSession } from "./session-provider";
import { AsyncState, Field, errorMessage } from "./lms-shared";
import { ThemeSelect } from "./theme-select";
import { QuestionMediaVisual, type QuestionMediaField } from "./learning-media";
import { FriendlyIcon } from "./friendly-icon";

type Document={id:number;topic:number;title:string;description:string;instructions:string;status:string;version:number;contentVersion:number;classroomId:number|null;canPublish:boolean;fields:QuestionMediaField[];sourceDocument:string;sourceText?:string};
const serialize=(title:string,description:string,instructions:string,status:string,fields:QuestionMediaField[])=>JSON.stringify({title,description,instructions,status,fields});

export function LkpdSectionEditor({moduleId}:{moduleId:number}) {
  const {user,activeClass,classrooms}=useSession();
  const [scope,setScope]=useState(user?.role==="admin"?"global":String(activeClass??""));
  const [data,setData]=useState<Document|null>(null),[title,setTitle]=useState(""),[description,setDescription]=useState(""),[instructions,setInstructions]=useState(""),[status,setStatus]=useState("draft");
  const [fields,setFields]=useState<QuestionMediaField[]>([]),[files,setFiles]=useState<Record<string,File>>({}),[selected,setSelected]=useState(0),[baseline,setBaseline]=useState("");
  const [loading,setLoading]=useState(Boolean(scope)),[busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState(""),[revision,setRevision]=useState(0);
  const [applyToDrafts,setApplyToDrafts]=useState(false);
  const dirty=Boolean(data)&&(serialize(title,description,instructions,status,fields)!==baseline||Object.keys(files).length>0);
  useUnsavedChanges(dirty);
  const adopt=useCallback((document:Document)=>{setData(document);setTitle(document.title);setDescription(document.description);setInstructions(document.instructions);setStatus(document.status);setFields(document.fields);setFiles({});setApplyToDrafts(false);setBaseline(serialize(document.title,document.description,document.instructions,document.status,document.fields));},[]);
  useEffect(()=>{if(!scope)return;const controller=new AbortController();apiRequest<{data:Document}>("/learning-modules/"+moduleId+(scope==="global"?"":"?classroom_id="+scope),{signal:controller.signal}).then(r=>{if(controller.signal.aborted)return;if(scope==="global"&&r.data.classroomId){setScope(String(r.data.classroomId));setLoading(true);return;}adopt(r.data);}).catch(e=>{if(!controller.signal.aborted)setError(errorMessage(e));}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();},[moduleId,scope,revision,adopt]);
  const update=(index:number,patch:Partial<QuestionMediaField>)=>setFields(current=>current.map((field,i)=>i===index?{...field,...patch}:field));
  const move=(from:number,to:number)=>{setFields(current=>{const next=[...current];const [item]=next.splice(from,1);next.splice(to,0,item);return next;});setSelected(to);};
  const add=()=>{setFields(current=>[...current,{key:"q_"+crypto.randomUUID().replaceAll("-",""),label:"",hint:"",phase:0}]);setSelected(fields.length);};
  const save=async(event:FormEvent)=>{
    event.preventDefault();if(!data)return;
    const missing=fields.findIndex(field=>!field.label.trim());
    if(missing>=0){setSelected(missing);setError("Isi pertanyaan setiap section sebelum menyimpan.");return;}
    setBusy(true);setError("");setMessage("");
    const body=new FormData();body.set("_method","PUT");if(scope!=="global")body.set("classroom_id",scope);
    body.set("version",String(scope==="global"?data.version:data.contentVersion));body.set("title",title);body.set("description",description);body.set("instructions",instructions);
    if(scope==="global"||data.classroomId===Number(scope))body.set("status",status);
    body.set("apply_to_drafts",applyToDrafts?"1":"0");
    body.set("fields",JSON.stringify(fields.map(field=>({key:field.key,label:field.label,hint:field.hint??"",phase:field.phase,source:field.source??null,video_url:field.video_url??field.video?.url??null,image_id:field.image_id??null,image_alt:field.image_alt??field.label,media_caption:field.media_caption??null}))));
    for(const field of fields){if(files[field.key])body.set("photos["+field.key+"]",files[field.key]);}
    try{const response=await apiRequest<{data:Document}>("/learning-modules/"+moduleId+"/content",{method:"POST",body});adopt(response.data);setMessage("LKPD dan media per section berhasil disimpan.");}
    catch(cause){setError(errorMessage(cause));if(cause instanceof ApiError&&cause.errors){const match=Object.keys(cause.errors).find(key=>/^fields\.\d+\./.test(key))?.match(/^fields\.(\d+)\./);if(match)setSelected(Number(match[1]));}}
    finally{setBusy(false);}
  };
  if(user?.role==="student")return null;
  const field=fields[selected];
  return <section className="panel module-question-editor"><div className="section-heading"><div><p className="eyebrow">EDITOR LKPD</p><h2>Pertanyaan dan media per section</h2><p>Satu section berisi satu pertanyaan. Gambar dan video boleh kosong atau diisi bersamaan.</p></div><FriendlyIcon name="edit" size={38}/></div>
    {user?.role==="admin"&&<ThemeSelect label="Lingkup penyuntingan" value={scope} disabled={busy} onChange={async value=>{if(await confirmLeave()){setScope(value);setData(null);setLoading(true);setError("");setSelected(0);}}} options={[{value:"global",label:"Template sumber"},...classrooms.map(c=>({value:String(c.id),label:"Kelas · "+c.name}))]}/>}
    {!scope&&<p className="soft-note">Pilih kelas terlebih dahulu.</p>}
    <AsyncState loading={loading} error={error} retry={()=>{if(!dirty||window.confirm("Muat data server dan abaikan perubahan yang belum tersimpan?")){setData(null);setLoading(true);setError("");setRevision(v=>v+1);}}}/>
    {message&&<p className="notice" role="status">{message}</p>}
    {data&&!loading&&<form className="lms-form" onSubmit={save}><fieldset disabled={busy}>
      <p className="soft-note">{scope==="global"?"Perubahan template berlaku pada pekerjaan baru; pekerjaan lama mempertahankan pertanyaan dan media saat mulai dikerjakan.":"Perubahan khusus kelas ini. Kiriman yang sudah masuk mempertahankan versi pertanyaannya."}</p>
      <Field label="Judul LKPD"><input required maxLength={180} value={title} onChange={e=>setTitle(e.target.value)}/></Field>
      <Field label="Ringkasan"><textarea required maxLength={2000} rows={2} value={description} onChange={e=>setDescription(e.target.value)}/></Field>
      <Field label="Petunjuk umum"><textarea required maxLength={8000} rows={3} value={instructions} onChange={e=>setInstructions(e.target.value)}/></Field>
      {(scope==="global"||data.classroomId===Number(scope))&&<ThemeSelect label="Status publikasi" value={status} onChange={setStatus} options={[{value:"draft",label:"Draf"},{value:"published",label:"Terbit"}]}/>}
      <div className="lkpd-editor-toolbar"><ThemeSelect label="Section yang disunting" value={String(selected)} onChange={value=>setSelected(Number(value))} options={fields.map((f,i)=>({value:String(i),label:(i+1)+". "+(f.label||"Pertanyaan baru").slice(0,75)}))}/><button type="button" className="button secondary" disabled={fields.length>=150} onClick={add}><FriendlyIcon name="plus" size={22}/>Tambah section</button></div>
      {field&&<article className="module-question-card"><div className="section-heading"><h3>Section {selected+1}</h3><div className="inline-actions"><button type="button" className="text-button" disabled={selected===0} onClick={()=>move(selected,selected-1)}>Naik</button><button type="button" className="text-button" disabled={selected===fields.length-1} onClick={()=>move(selected,selected+1)}>Turun</button><button type="button" className="text-button" disabled={fields.length<=1} onClick={()=>{if(!window.confirm("Hapus section ini dari versi yang sedang disunting? Riwayat kiriman lama tetap disimpan."))return;setFields(current=>current.filter((_,i)=>i!==selected));setSelected(Math.max(0,selected-1));}}>Hapus section</button></div></div>
        <Field label="Pertanyaan"><textarea required rows={3} maxLength={500} value={field.label} onChange={e=>update(selected,{label:e.target.value})}/></Field>
        <Field label="Petunjuk jawaban · opsional"><textarea rows={2} maxLength={1500} value={field.hint??""} onChange={e=>update(selected,{hint:e.target.value})}/></Field>
        <ThemeSelect label="Tahap belajar" value={field.phase} onChange={value=>update(selected,{phase:Number(value)})} options={["Mengamati","Mencari fakta","Berdiskusi","Refleksi","Aksi nyata"].map((label,value)=>({value:String(value),label}))}/>
        <Field label="Gambar pertanyaan · opsional" hint="PNG, JPG atau WebP maksimal 1 MB."><input key={field.key} type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>1048576||!["image/png","image/jpeg","image/webp"].includes(file.type)){setError("Pilih gambar PNG, JPG atau WebP maksimal 1 MB.");e.target.value="";return;}setFiles(current=>({...current,[field.key]:file}));}}/></Field>
        {(files[field.key]||field.image_url)&&<><LocalPhoto file={files[field.key]} url={field.image_url} alt={field.image_alt||field.label}/><button className="text-button" type="button" onClick={()=>{setFiles(current=>{const next={...current};delete next[field.key];return next;});update(selected,{image_id:null,image_url:null});}}>Hapus gambar</button></>}
        <Field label="Deskripsi gambar"><input maxLength={500} value={field.image_alt??""} onChange={e=>update(selected,{image_alt:e.target.value})}/></Field>
        <Field label="Link video · opsional" hint="YouTube, TikTok, MP4/WebM, atau tautan HTTPS lainnya. Tautan yang tidak mendukung player dibuka melalui tombol sumber."><input type="url" maxLength={2048} value={field.video_url??field.video?.url??""} onChange={e=>update(selected,{video_url:e.target.value,video:null})} placeholder="https://…"/></Field>
        <Field label="Petunjuk mengamati media · opsional"><input maxLength={1000} value={field.media_caption??""} onChange={e=>update(selected,{media_caption:e.target.value})}/></Field>
        <details className="source-document"><summary>Pratinjau pertanyaan untuk siswa</summary><h3>{field.label||"Pertanyaan belum diisi"}</h3>{files[field.key]&&<LocalPhoto file={files[field.key]} alt={field.image_alt||field.label}/>}<QuestionMediaVisual field={files[field.key]?{...field,image_url:null}:field} topic={data.topic}/><p>{field.hint}</p><textarea readOnly placeholder="Jawaban siswa" aria-label="Pratinjau isian jawaban"/></details>
      </article>}
      {scope!=="global"&&<label className="checkbox-label"><input type="checkbox" checked={applyToDrafts} onChange={e=>setApplyToDrafts(e.target.checked)}/><span>Terapkan ke draf kelompok yang belum pernah mengirim bagian apa pun. Jawaban yang sudah ditulis tetap disimpan.</span></label>}
      <button className="button primary">{busy?"Menyimpan…":"Simpan LKPD dan section"}<FriendlyIcon name="check" size={22}/></button>
    </fieldset></form>}
    {data&&<details className="source-document"><summary>Sumber LKPD dan teks asli</summary><p>{data.sourceDocument}</p><pre>{data.sourceText||"LKPD ini disusun melalui editor."}</pre></details>}
  </section>;
}

function LocalPhoto({file,url,alt}:{file?:File;url?:string|null;alt:string}) {
  const preview=useRef<HTMLImageElement>(null);
  useEffect(()=>{const value=file?URL.createObjectURL(file):null;if(preview.current)preview.current.src=value??url??"";return()=>{if(value)URL.revokeObjectURL(value);};},[file,url]);
  // Authenticated images and local previews must bypass the public image optimizer.
  // eslint-disable-next-line @next/next/no-img-element
  return file||url?<img ref={preview} className="lkpd-photo-preview" src={url??undefined} alt={alt}/>:null;
}
