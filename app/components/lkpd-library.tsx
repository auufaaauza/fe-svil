"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, loadPages } from "../lib/api";
import { useSession } from "./session-provider";
import { FriendlyIcon } from "./friendly-icon";
import { ThemeSelect } from "./theme-select";
import { QuestionVisual } from "./question-visual";

type ModuleField = { key: string; label: string; hint: string; phase: number };
export type LearningModule = { id: number; topic: number; title: string; description: string; instructions: string; fields: ModuleField[]; sourceDocument: string; sourceText?: string; sourceHash: string; status: string; version: number; uploadedBy: { id: number; name: string }; updatedBy: { id: number; name: string }; createdAt: string; updatedAt: string };
export function LkpdLibrary() {
  const { user } = useSession();
  const router = useRouter();
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [detail, setDetail] = useState<LearningModule | null>(null);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let alive=true;
    loadPages<LearningModule>("/learning-modules").then(data => { if(alive) {setModules(data);setError("");} }).catch(e => {if(alive)setError(e.message);}).finally(() => {if(alive)setLoading(false);});
    return () => {alive=false;};
  }, [revision]);
  const open = (id: number) => router.push((user?.role==="admin"?"/admin/konten":"/guru/materi")+"/lkpd/"+id);
  const visible=modules.filter(m => (status==="all" || m.status===status) && (m.title+" "+m.description).toLowerCase().includes(search.toLowerCase()));
  return <div className="lkpd-library"><div className="content-filters"><label className="search-field"><FriendlyIcon name="search" size={23}/><input aria-label="Cari LKPD" placeholder="Cari LKPD utama…" value={search} onChange={e => setSearch(e.target.value)}/></label><ThemeSelect label="Status LKPD" value={status} onChange={setStatus} options={[{value:"all",label:"Semua status"},{value:"published",label:"Terbit"},{value:"draft",label:"Draf"}]}/></div>
    {error && <div className="form-error" role="alert">{error}<button className="text-button" onClick={() => setRevision(v => v+1)}>Muat ulang</button></div>}{loading && <p role="status">Memuat LKPD dari database…</p>}
    {!loading && !modules.length && <div className="soft-note">Belum ada LKPD utama di database. Admin dapat mengimpor dokumen pendukung melalui perintah svil:import-lkpd.</div>}
    <div className="module-grid">{visible.map(m => <article className="module-card" key={m.id}><div className="section-heading"><span className="content-type-badge lkpd">LKPD {m.topic+1}</span><span className={"status-badge "+m.status}>{m.status==="published" ? "Terbit" : "Draf"}</span></div><QuestionVisual topic={m.topic}/><h3>{m.title}</h3><p>{m.description}</p><div className="content-attribution"><span>Diimpor oleh <strong>{m.uploadedBy.name}</strong></span><span>Versi {m.version} · {m.fields.length} bagian pertanyaan</span></div><button className="button secondary full-width" onClick={() => open(m.id)}>Lihat LKPD & sumber <FriendlyIcon name="arrow" size={20}/></button></article>)}</div>
    {detail && <ModuleDetail key={detail.id+"-"+detail.version} module={detail} admin={user?.role==="admin"} onClose={() => setDetail(null)} onSaved={m => {setDetail(m);setRevision(v => v+1);}}/>}
  </div>;
}
export function ModuleDetail({module,admin,onClose,onSaved}:{module:LearningModule;admin:boolean;onClose:()=>void;onSaved:(m:LearningModule)=>void}) {
  const [edit,setEdit]=useState(false);
  const [title,setTitle]=useState(module.title),[description,setDescription]=useState(module.description),[instructions,setInstructions]=useState(module.instructions);
  const [fields,setFields]=useState(module.fields),[status,setStatus]=useState(module.status);
  const [busy,setBusy]=useState(false),[error,setError]=useState("");
  const save=async(event:FormEvent) => {
    event.preventDefault();setBusy(true);setError("");
    try {const result=await apiRequest<{data:LearningModule}>("/learning-modules/"+module.id,{method:"PUT",body:JSON.stringify({version:module.version,title,description,instructions,fields,status})});onSaved(result.data);}
    catch(e){setError(e instanceof Error ? e.message : "LKPD belum tersimpan.");}finally{setBusy(false);}
  };
  return <section className="panel module-detail"><div className="section-heading"><div><p className="eyebrow">LKPD {module.topic+1} · VERSI {module.version}</p><h2>{module.title}</h2></div><button className="button secondary" disabled={busy} onClick={onClose}>Tutup</button></div>
    <p className="helper">Sumber: {module.sourceDocument}</p><p className="helper">Diimpor {module.uploadedBy.name} · Diperbarui {module.updatedBy.name} pada {new Date(module.updatedAt).toLocaleString("id-ID")}</p>
    {admin && <button className="text-button" disabled={busy} onClick={() => setEdit(v => !v)}>{edit ? "Kembali membaca" : "Sunting LKPD digital"}<FriendlyIcon name="edit" size={22}/></button>}
    {edit ? <form className="material-form" onSubmit={save}><fieldset disabled={busy} className="module-edit-fields"><label className="field-label">Judul<input required maxLength={180} value={title} onChange={e => setTitle(e.target.value)}/></label><label className="field-label">Ringkasan<textarea required maxLength={2000} value={description} onChange={e => setDescription(e.target.value)}/></label><label className="field-label">Petunjuk<textarea required maxLength={8000} rows={4} value={instructions} onChange={e => setInstructions(e.target.value)}/></label><ThemeSelect label="Status publikasi LKPD" value={status} onChange={setStatus} disabled={busy} options={[{value:"published",label:"Terbit"},{value:"draft",label:"Draf"}]}/>
    {fields.map((f,i) => <div className="lkpd-field-editor" key={f.key}><label className="field-label">Pertanyaan {i+1}<textarea required rows={2} maxLength={500} value={f.label} onChange={e => setFields(fields.map((field,index)=>index===i ? {...field,label:e.target.value}:field))}/></label><label className="field-label">Petunjuk jawaban<textarea required maxLength={1500} value={f.hint} onChange={e => setFields(fields.map((field,index)=>index===i ? {...field,hint:e.target.value}:field))}/></label></div>)}
    <button className="button primary">{busy ? "Menyimpan…" : "Simpan versi baru"}</button></fieldset><p className="helper">Perubahan berlaku untuk pekerjaan kelompok baru. Pekerjaan yang sudah dimulai mempertahankan pertanyaan versi sebelumnya.</p>{error && <p className="form-error" role="alert">{error}</p>}</form> : <><p className="material-body">{module.instructions}</p><ol className="module-questions">{module.fields.map(f => <li key={f.key}><strong>{f.label}</strong><p>{f.hint}</p></li>)}</ol></>}
    <details className="source-document"><summary>Baca teks lengkap dokumen asli</summary><pre>{module.sourceText}</pre></details>
  </section>;
}
