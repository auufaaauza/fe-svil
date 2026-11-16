"use client";

import { useState, type FormEvent } from "react";
import { apiRequest } from "../lib/api";
import { confirmLeave, useUnsavedChanges } from "../lib/unsaved-changes";
import { useSession } from "./session-provider";
import { AsyncState, Field, errorMessage, useApiRows, useMembers } from "./lms-shared";
import { ThemeSelect } from "./theme-select";

export type WordwallGrade={id:number;classroom_id:number;student_id:number;game_id:string;game_title:string;topic:number;score:number;feedback:string|null;version:number;updated_at:string;teacher:{id:number;name:string};student:{id:number;name:string;username:string}};

export function WordwallGradePanel({gameId,grades,onSaved}:{gameId:string;grades:WordwallGrade[];onSaved:()=>Promise<unknown>}) {
  const {user,activeClass,classrooms}=useSession();
  const [editing,setEditing]=useState(false),[selected,setSelected]=useState(""),[notice,setNotice]=useState("");
  const members=useMembers(editing&&user?.role==="teacher");
  const rows=grades.filter(grade=>grade.game_id===gameId);
  const saved=rows.find(grade=>String(grade.student_id)===selected);
  const archived=classrooms.find(c=>c.id===activeClass)?.archived;
  if(user?.role==="student") {
    const own=rows.find(grade=>grade.student_id===user.id);
    return <div className="wordwall-grade-panel"><strong>Nilai Wordwall: {own?own.score+" / 100":"Belum dinilai guru"}</strong>{own&&<><small>Dicatat oleh {own.teacher.name} · {new Date(own.updated_at).toLocaleDateString("id-ID")}</small>{own.feedback&&<p>Pesan guru: {own.feedback}</p>}</>}</div>;
  }
  return <div className="wordwall-grade-panel"><div className="section-heading"><h4>Nilai Wordwall · {rows.length} siswa</h4>{user?.role==="teacher"&&<button type="button" className="button secondary" disabled={archived} onClick={async()=>{if(await confirmLeave())setEditing(value=>!value);}}>{editing?"Tutup input nilai":"Input nilai siswa"}</button>}</div>
    {notice&&<p className="notice" role="status">{notice}</p>}
    {rows.length>0&&<details><summary>Lihat nilai yang sudah dicatat</summary><ul className="wordwall-grade-list">{rows.map(row=><li key={row.id}><span>{row.student.name}</span><strong>{row.score} / 100</strong></li>)}</ul></details>}
    {editing&&<><AsyncState loading={members.loading} error={members.error} retry={()=>members.reload()}/><ThemeSelect label="Siswa yang dinilai" value={selected} onChange={async value=>{if(await confirmLeave()){setSelected(value);setNotice("");}}} options={members.rows.map(member=>({value:String(member.id),label:member.name}))} placeholder="Pilih siswa kelas ini"/>{selected&&<ManualGradeForm key={selected+":"+(saved?.version??0)} gameId={gameId} studentId={Number(selected)} saved={saved} onSaved={async()=>{await onSaved();setNotice("Nilai Wordwall tersimpan dan sudah masuk ke buku nilai siswa.");}}/>}</>}
  </div>;
}

function ManualGradeForm({gameId,studentId,saved,onSaved}:{gameId:string;studentId:number;saved?:WordwallGrade;onSaved:()=>Promise<unknown>}) {
  const {activeClass}=useSession();
  const [score,setScore]=useState(saved?String(saved.score):""),[feedback,setFeedback]=useState(saved?.feedback??""),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const dirty=score!==(saved?String(saved.score):"")||feedback!==(saved?.feedback??"");
  useUnsavedChanges(dirty);
  const save=async(event:FormEvent)=>{event.preventDefault();setBusy(true);setError("");try{await apiRequest("/wordwall-grades",{method:"PUT",body:JSON.stringify({classroom_id:activeClass,student_id:studentId,game_id:gameId,version:saved?.version??0,score:Number(score),feedback:feedback||null})});await onSaved();}catch(cause){setError(errorMessage(cause));}finally{setBusy(false);}};
  return <form className="lms-form" onSubmit={save}><fieldset disabled={busy}><Field label="Nilai Wordwall · 0–100"><input required type="number" min={0} max={100} step="0.01" value={score} onChange={event=>setScore(event.target.value)}/></Field><Field label="Pesan guru · opsional"><textarea rows={2} maxLength={2000} value={feedback} onChange={event=>setFeedback(event.target.value)}/></Field><button className="button primary">{busy?"Menyimpan nilai…":saved?"Perbarui nilai":"Simpan nilai"}</button></fieldset>{error&&<div className="form-error" role="alert"><p>{error}</p><button type="button" className="text-button" disabled={busy} onClick={()=>{if(window.confirm("Muat nilai terbaru? Isian yang belum tersimpan akan diganti."))void onSaved();}}>Muat nilai terbaru</button></div>}</form>;
}

export function WordwallGradesSummary() {
  const {activeClass,user}=useSession();
  const rows=useApiRows<WordwallGrade>(activeClass&&user?.canUseSvil!==false?"/wordwall-grades?classroom_id="+activeClass:null);
  if(user?.canUseSvil===false)return null;
  return <section className="panel"><h2>Nilai kuis Wordwall</h2><AsyncState loading={rows.loading} error={rows.error} retry={()=>rows.reload()}/>{!rows.loading&&!rows.rows.length&&<p className="soft-note">Guru belum mencatat nilai Wordwall. Nilai akan tampil di sini setelah disimpan oleh guru.</p>}<div className="record-list">{rows.rows.map(grade=><article key={grade.id}><h3>{grade.game_title}</h3><strong>{grade.score} / 100</strong><p>Dicatat oleh {grade.teacher.name} · {new Date(grade.updated_at).toLocaleDateString("id-ID")}</p>{grade.feedback&&<p>Pesan guru: {grade.feedback}</p>}</article>)}</div></section>;
}
