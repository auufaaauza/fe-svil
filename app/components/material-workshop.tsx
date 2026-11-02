"use client";

import Image from "next/image";
import { useRef, useState, type FormEvent } from "react";
import { lessons } from "../lib/learning";
import { saveMaterial, useMaterials, type TeacherMaterial } from "../lib/material-store";
import { FriendlyIcon } from "./friendly-icon";
import { LearningScene } from "./learning-scene";
import { useSession } from "./session-provider";
import { apiRequest } from "../lib/api";
import { ThemeSelect } from "./theme-select";
import { QuestionVisual } from "./question-visual";
import { DocumentViewer } from "./document-viewer";
import { LessonSelect } from "./lms-shared";
import { StudentFeedback } from "./teacher-assessment";

export function MaterialForm({ initial, initialKind = "material", onSaved }: { initial?: TeacherMaterial; initialKind?: "material" | "quiz"; onSaved: (message: string) => void }) {
  const { classrooms, activeClass } = useSession();
  const [classroomId, setClassroomId] = useState(initial?.classroomId ?? activeClass ?? 0);
  const [version, setVersion] = useState(initial?.version ?? 1);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [kind, setKind] = useState<"material" | "quiz">(initial?.kind ?? initialKind);
  const [subject, setSubject] = useState(initial?.subject ?? "IPAS");
  const [attachment, setAttachment] = useState<File | undefined>();
  const [savedAttachment, setSavedAttachment] = useState(initial?.attachment);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const attachmentInput = useRef<HTMLInputElement>(null);
  const [topic, setTopic] = useState<number | null>(initial ? initial.topic : 0);
  const [topicLabel, setTopicLabel] = useState(initial?.topicLabel ?? "");
  const [courseLessonId, setCourseLessonId] = useState(initial?.courseLessonId ?? 0);
  const [image, setImage] = useState(initial?.image ?? "");
  const [imageAlt, setImageAlt] = useState(initial?.imageAlt ?? "");
  const [questionType, setQuestionType] = useState(initial?.question?.type ?? "choice");
  const [visualTopic, setVisualTopic] = useState(initial?.question?.visualTopic?.toString() ?? "inherit");
  const [prompt, setPrompt] = useState(initial?.question?.prompt ?? "");
  const [options, setOptions] = useState(initial?.question?.options.length ? initial.question.options : ["", "", "", ""]);
  const [correct, setCorrect] = useState(initial?.question?.correctIndex?.toString() ?? "");
  const [modelAnswer, setModelAnswer] = useState(initial?.question?.modelAnswer ?? "");
  const [explanation, setExplanation] = useState(initial?.question?.explanation ?? "");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [materialId, setMaterialId] = useState(initial?.id ?? "");
  const fileInput = useRef<HTMLInputElement>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError("");
    if (!title.trim() || !content.trim()) { setError("Isi judul dan teks materi terlebih dahulu."); return; }
    if (kind === "quiz" && !prompt.trim()) { setError("Kuis perlu memiliki pertanyaan."); return; }
    if (image && !imageAlt.trim()) { setError("Tambahkan deskripsi gambar agar materi dapat dipahami semua siswa."); return; }
    if (prompt.trim() && questionType === "choice" && options.some(o => !o.trim())) { setError("Lengkapi keempat pilihan jawaban, atau pilih soal isian."); return; }
    const status = ((event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)?.value === "published" ? "published" : "draft";
    if (!classroomId) { setError("Pilih kelas tujuan terlebih dahulu."); return; }
    setSaving(true);
    try {
      const result = await saveMaterial({ id: materialId, classroomId, version, kind, subject, title: title.trim(), content: content.trim(), topic, topicLabel, courseLessonId: courseLessonId || null, image, imageAlt: imageAlt.trim(), status, updatedAt: new Date().toISOString(), question: kind === "quiz" && prompt.trim() ? { type: questionType, prompt: prompt.trim(), options: questionType === "choice" ? options.map(o => o.trim()) : [], correctIndex: questionType === "choice" && correct !== "" ? Number(correct) : null, modelAnswer: questionType === "text" ? modelAnswer.trim() : "", explanation: explanation.trim(), visualTopic: visualTopic === "inherit" ? null : Number(visualTopic) } : null }, attachment, removeAttachment);
      if (result.ok && result.material) { setMaterialId(result.material.id); setVersion(result.material.version); setSavedAttachment(result.material.attachment); setAttachment(undefined); setRemoveAttachment(false); if (attachmentInput.current) attachmentInput.current.value = ""; onSaved(result.message); } else setError(result.message);
    } catch { setError("Gambar atau materi belum dapat dikirim. Isianmu tetap ada; coba lagi."); }
    finally { setSaving(false); }
  };

  const loadImage = (file?: File) => {
    setError("");
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 1_000_000) {
      setError("Pilih gambar PNG, JPG, atau WebP berukuran maksimal 1 MB.");
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => { setImage(String(reader.result)); setUploading(false); };
    reader.onerror = () => { setError("Gambar tidak dapat dibaca. Coba berkas lain."); setUploading(false); };
    reader.readAsDataURL(file);
  };

  return <form className="material-form" onSubmit={submit}>
    <div className="section-heading"><div><p className="eyebrow">RUANG KREASI SEKOLAH</p><h2>{initial ? "Sunting materi" : "Buat materi baru"}</h2></div><span className="soft-badge">Tersimpan di server</span></div>
    <p className="helper">Pisahkan bacaan dan dokumen sebagai materi, lalu gunakan jenis Kuis untuk pertanyaan latihan.</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    <label className="field-label" htmlFor="material-class">Kelas tujuan <span>Wajib</span></label><ThemeSelect id="material-class" label="Kelas tujuan" required disabled={Boolean(materialId) || saving} value={classroomId} onChange={value => { setClassroomId(Number(value)); setCourseLessonId(0); }} placeholder="Pilih kelas" options={classrooms.map(c => ({ value: String(c.id), label: c.name, description: c.schoolName }))}/>
    <label className="field-label" htmlFor="material-kind">Jenis konten</label><ThemeSelect id="material-kind" label="Jenis konten" value={kind} onChange={value => setKind(value as "material" | "quiz")} disabled={saving} options={[{value:"material",label:"Materi",description:"Bacaan, gambar dan dokumen"},{value:"quiz",label:"Kuis",description:"Pertanyaan dan penilaian latihan"}]}/><label className="field-label" htmlFor="material-subject">Mata pelajaran</label><input id="material-subject" required maxLength={80} value={subject} onChange={e => setSubject(e.target.value)}/><label className="field-label" htmlFor="material-title">Judul materi <span>Wajib</span></label>
    <input id="material-title" required maxLength={100} value={title} onChange={e => setTitle(e.target.value)} placeholder="Tulis judul materi"/>
    <label className="field-label" htmlFor="material-topic">Pertemuan terkait</label>
    <ThemeSelect id="material-topic" label="Pertemuan terkait" value={topic === null ? "other" : topic} onChange={value => setTopic(value === "other" ? null : Number(value))} options={[...lessons.map((l,i) => ({ value: String(i), label: `${i+1}. ${l.title}` })), {value:"other",label:"Lainnya / materi sekolah",description:"Isi nama pertemuan sendiri atau biarkan umum"}]}/>
    {topic === null && <><label className="field-label" htmlFor="custom-topic">Nama pertemuan lainnya <span>Opsional</span></label><input id="custom-topic" maxLength={180} value={topicLabel} onChange={e => setTopicLabel(e.target.value)} placeholder="Tulis nama pertemuan atau topik belajar"/></>}<details className="source-document"><summary>Hubungkan ke mapel dan pertemuan sekolah</summary><LessonSelect key={classroomId} value={courseLessonId} onChange={setCourseLessonId} classroomId={classroomId} initialCourseId={initial?.courseId ?? undefined} required={false} disabled={saving}/></details>
    <label className="field-label" htmlFor="material-content">Teks dan petunjuk belajar <span>Wajib</span></label>
    <textarea id="material-content" required maxLength={8000} value={content} onChange={e => setContent(e.target.value)} placeholder="Gunakan kalimat pendek, satu petunjuk untuk setiap langkah." rows={5}/>
    <div className="image-upload"><label className="field-label" htmlFor="material-image"><FriendlyIcon name="upload"/> Gambar pendukung <span>Opsional</span></label><p className="helper">PNG, JPG, atau WebP · maksimal 1 MB. Pilih gambar tanpa data pribadi siswa.</p><input ref={fileInput} id="material-image" type="file" accept="image/png,image/jpeg,image/webp" disabled={uploading || saving} onChange={e => loadImage(e.target.files?.[0])}/>{uploading && <p role="status">Membaca gambar…</p>}{image && <><Image className="uploaded-image" src={image} alt={imageAlt || "Pratinjau gambar yang dipilih guru"} width={600} height={360} unoptimized/><label className="field-label" htmlFor="image-description">Deskripsi gambar <span>Wajib jika ada gambar</span></label><input id="image-description" required maxLength={250} value={imageAlt} onChange={e => setImageAlt(e.target.value)} placeholder="Jelaskan orang, tempat, dan kegiatan pada gambar"/><button type="button" className="text-button" onClick={() => { setImage(""); setImageAlt(""); if (fileInput.current) fileInput.current.value = ""; }}>Batalkan gambar pilihan</button></>}</div>
    <section className="document-upload"><label className="field-label" htmlFor="material-document"><FriendlyIcon name="upload"/> Dokumen pembelajaran PDF / PowerPoint</label><p className="helper">PDF atau PPTX maksimal 10 MB. PDF mempertahankan tampilan asli; pratinjau PPTX mendukung teks, gambar dan bentuk dasar.</p><input ref={attachmentInput} id="material-document" type="file" accept="application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,.pdf,.pptx" disabled={saving} onChange={e => { const file=e.target.files?.[0]; if(file && (file.size>10*1024*1024 || !/\.(pdf|pptx)$/i.test(file.name))) { setError("Pilih PDF atau PPTX maksimal 10 MB."); e.target.value=""; return; } setAttachment(file); setRemoveAttachment(false); }}/>{attachment ? <p>{attachment.name}</p> : savedAttachment && !removeAttachment && <p>Dokumen tersimpan: {savedAttachment.name}</p>}{(attachment || (savedAttachment && !removeAttachment)) && <button type="button" className="text-button" onClick={() => { setAttachment(undefined); setRemoveAttachment(true); if(attachmentInput.current) attachmentInput.current.value=""; }}>Hapus lampiran dari konten</button>}</section>
    {kind === "quiz" && <fieldset className="question-builder"><legend><FriendlyIcon name="edit"/> Tambahkan soal <span>Opsional</span></legend><label className="field-label" htmlFor="question-prompt">Pertanyaan</label><textarea id="question-prompt" maxLength={1500} rows={3} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Kosongkan jika materi ini tidak memerlukan soal."/><label className="field-label" htmlFor="question-type">Bentuk soal</label><ThemeSelect id="question-type" label="Bentuk soal" value={questionType} onChange={value => setQuestionType(value as "choice" | "text")} options={[{value: "choice", label: "Pilihan ganda", description: "Empat pilihan jawaban"}, {value: "text", label: "Isian atau cerita singkat", description: "Ditinjau oleh guru"}]}/>
      <label className="field-label" htmlFor="question-visual">Animasi pendamping pertanyaan</label><ThemeSelect id="question-visual" label="Animasi pendamping" value={visualTopic} onChange={setVisualTopic} options={[{ value: "inherit", label: "Ikuti topik materi" }, ...lessons.map((l,i) => ({ value: String(i), label: l.title }))]}/><p className="helper">Pilih visual yang sesuai makna pertanyaan. Animasi memberi konteks tanpa menampilkan kunci jawaban.</p>{prompt.trim() && <QuestionVisual topic={visualTopic === "inherit" ? topic ?? 3 : Number(visualTopic)}/>}
      {questionType === "choice" ? <><div className="option-editor">{options.map((o,i) => <label key={i}><span>{"ABCD"[i]}</span><input aria-label={`Pilihan ${"ABCD"[i]}`} maxLength={300} value={o} onChange={e => setOptions(options.map((value,index) => index === i ? e.target.value : value))} placeholder={`Jawaban ${"ABCD"[i]}`}/></label>)}</div><label className="field-label" htmlFor="correct-answer">Kunci jawaban <span>Opsional</span></label><ThemeSelect id="correct-answer" label="Kunci jawaban" value={correct} onChange={setCorrect} options={[{ value: "", label: "Tanpa kunci", description: "Jawaban ditinjau guru" }, ...options.map((_,i) => ({ value: String(i), label: "Pilihan " + "ABCD"[i] }))]}/></> : <><label className="field-label" htmlFor="model-answer">Pedoman jawaban untuk guru <span>Opsional</span></label><textarea id="model-answer" rows={3} maxLength={2000} value={modelAnswer} onChange={e => setModelAnswer(e.target.value)} placeholder="Isian terbuka tetap ditinjau guru; tidak dicocokkan otomatis."/></>}
      <label className="field-label" htmlFor="explanation">Penjelasan setelah mencoba <span>Opsional</span></label><textarea id="explanation" rows={2} maxLength={1500} value={explanation} onChange={e => setExplanation(e.target.value)} placeholder="Penjelasan singkat yang membantu siswa memahami jawabannya."/>
    </fieldset>}
    <div className="form-actions"><button className="button secondary" type="submit" value="draft" disabled={uploading || saving}>{saving ? "Menyimpan…" : "Simpan draf"}</button><button className="button primary" type="submit" value="published" disabled={uploading || saving}>{saving ? "Menyimpan…" : "Terbitkan materi"} <FriendlyIcon name="arrow" size={20}/></button></div>
  </form>;
}

export function MaterialWorkshop({ initialMaterialId = null, initialKind = "material" }: { initialMaterialId?: string | null; initialKind?: "material" | "quiz" }) {
  const { refresh } = useSession();
  const materials = useMaterials();
  const [editing, setEditing] = useState<string | null>(initialMaterialId);
  const [generation, setGeneration] = useState(0);
  const [message, setMessage] = useState("");
  return <div className="workshop-layout"><section className="panel"><div className="prototype-note">Pilih kelas tujuan. Materi terbit hanya dapat dilihat oleh siswa yang terdaftar di kelas tersebut.</div>{message && <p className="notice" role="status">{message}</p>}<MaterialForm key={`${editing}-${generation}`} initial={materials.find(m => m.id === editing)} initialKind={initialKind} onSaved={message => { setMessage(message); refresh().catch(error => setMessage(`${message} Pustaka belum termuat: ${error.message}`)); }}/></section><aside className="panel library-panel"><div className="section-heading"><h2>Pustaka saya</h2><span className="count-pill">{materials.length}</span></div><button className="button secondary full-width" onClick={() => { setEditing(null); setGeneration(g => g+1); setMessage(""); }}><FriendlyIcon name="plus"/> Materi baru</button>{!materials.length && <div className="library-empty"><FriendlyIcon name="book" size={60}/><p>Materi buatan Anda akan tersimpan di sini.</p></div>}<div className="material-library">{materials.filter(m => m.canEdit !== false).map(m => <button className={`library-item ${editing === m.id ? "selected" : ""}`} key={m.id} onClick={() => { setEditing(m.id); setMessage(""); }}><span className={`status-badge ${m.status}`}>{m.status === "published" ? "Terbit" : "Draf"}</span><strong>{m.title}</strong><small>{m.topic === null ? m.topicLabel || "Materi sekolah" : "Pertemuan "+(m.topic+1)} · {m.question ? "Dengan soal" : "Bahan bacaan"}</small><span className="library-edit">Sunting <FriendlyIcon name="edit" size={18}/></span></button>)}</div></aside></div>;
}

export function StudentMaterial({ material, onBack, showBack=true }: { material: TeacherMaterial; onBack: () => void; showBack?:boolean }) {
  const { user } = useSession();
  const [choice, setChoice] = useState<number | null>(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<{ correct: boolean | null; message: string; explanation: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [feedbackGeneration, setFeedbackGeneration] = useState(0);
  const requestId = useRef<string | null>(null);
  const question = material.question;
  const hasKey = question?.hasKey ?? false;
  const reset = () => { setResult(null); setError(""); requestId.current = null; };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    requestId.current ??= crypto.randomUUID();
    try {
      const response = await apiRequest<{ data: NonNullable<typeof result> }>("/materials/"+material.id+"/attempts", {
        method: "POST",
        body: JSON.stringify({ request_id: requestId.current, material_version: material.version, choice, answer }),
      });
      setResult(response.data);
      setFeedbackGeneration(g => g+1);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Jawaban belum tersimpan. Coba lagi."); }
    finally { setBusy(false); }
  };
  return <><section className="panel student-material">
    {showBack&&<button className="back-link" onClick={onBack}><FriendlyIcon name="back" size={20}/> Kembali ke belajar</button>}
    <span className="soft-badge">Materi dari guru</span><h2>{material.title}</h2>
    {material.image ? <Image className="material-cover" src={material.image} alt={material.imageAlt} width={900} height={500} unoptimized/> : !material.attachment && <LearningScene topic={material.topic ?? 3} step={0}/>}
    <p className="material-body">{material.content}</p><p className="helper">Dari {material.uploadedBy?.name ?? "gurumu"} · {material.subject ?? "IPAS"}</p>{material.attachment && <DocumentViewer attachment={material.attachment} materialId={material.id}/>}
    {question && user?.role === "student" && <form className="student-quiz" onSubmit={submit}><h3>Yuk, coba jawab!</h3>
      <fieldset disabled={busy}><legend>{question.prompt}</legend><QuestionVisual topic={question.visualTopic ?? material.topic ?? 3}/>
        {question.type === "choice" ? <div className="quiz-options">{question.options.map((o,i) => <label className={choice === i ? "selected" : ""} key={i}>
          <input type="radio" name="student-answer" value={i} checked={choice === i} onChange={() => { setChoice(i); reset(); }}/><span>{"ABCD"[i]}</span>{o}
        </label>)}</div> : <><label className="field-label" htmlFor="student-answer">Ceritakan jawabanmu</label>
          <textarea id="student-answer" rows={4} value={answer} onChange={e => { setAnswer(e.target.value); reset(); }} placeholder="Tidak harus sama dengan teman. Tulis dengan bahasamu sendiri."/>
        </>}
      </fieldset>
      <button className="button primary" disabled={busy || (question.type === "choice" ? choice === null : !answer.trim())}>
        {busy ? "Mengirim…" : hasKey ? "Cek jawabanku" : "Simpan jawabanku"}<FriendlyIcon name="check" size={22}/>
      </button>
      {error && <p className="form-error" role="alert">{error}</p>}
      {result && <div className={"quiz-feedback "+(result.correct === false ? "try-again" : "")} role="status">
        <FriendlyIcon name={result.correct === false ? "heart" : "check"} size={32}/>
        <div><strong>{result.message}</strong><p>Jawaban latihanmu tersimpan di server.</p>{result.explanation && <p>{result.explanation}</p>}</div>
      </div>}
    </form>}
  </section>{user?.role === "student" && <StudentFeedback materialId={material.id} generation={feedbackGeneration}/>}</>;
}
