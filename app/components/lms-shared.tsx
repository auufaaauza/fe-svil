"use client";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { apiRequest, loadPages, loadWorkspaceLists } from "../lib/api";
import { ThemeSelect } from "./theme-select";
import { useSession } from "./session-provider";

export type Course = { id:number; classroom_id:number; subject:string; title:string; semester:string; method:string; description:string|null; status:string; version:number; classroom?:{id:number;name:string;academic_year:string}; chapters?:Chapter[] };
export type Chapter = {id:number;course_id:number;title:string;position:number;version:number;lessons?:Lesson[]};
export type Lesson = {id:number;course_id:number;course_chapter_id:number;title:string;objective:string;position:number;scheduled_on:string|null;mode:string;status:string;version:number;completion_rule?:string;minimum_score?:number|null};
export type Member = {id:number;name:string;role:string};
export function useWorkspaceLists<T extends Record<string, unknown>>(path: string | null, sections: Record<keyof T, string>) {
 const [rows,setRows]=useState<{[Key in keyof T]:T[Key][]}|null>(null),[loading,setLoading]=useState(Boolean(path)),[error,setError]=useState("");
 const reload=useCallback(async()=>{if(!path)return null;try{const result=await loadWorkspaceLists<T>(path,sections,0);setRows(result);setError("");return result;}catch(e){setError(errorMessage(e));return null;}},[path,sections]);
 useEffect(()=>{let alive=true;setRows(null);setError("");setLoading(Boolean(path));if(path)loadWorkspaceLists<T>(path,sections).then(result=>{if(alive)setRows(result);}).catch(e=>{if(alive)setError(errorMessage(e));}).finally(()=>{if(alive)setLoading(false);});return()=>{alive=false;};},[path,sections]);
 return {rows,setRows,loading,error,reload};
}
export function useApiRows<T>(path:string|null) {
 const [rows,setRows]=useState<T[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const reload=useCallback(async()=>{if(!path)return [] as T[];try {const rows=await loadPages<T>(path);setRows(rows);setError("");return rows;} catch(e) {setError(errorMessage(e));return [] as T[];}},[path]);
 useEffect(()=>{let alive=true;if(!path){setRows([]);setLoading(false);setError("");return;}setLoading(true);setRows([]);setError("");loadPages<T>(path,undefined,{maxAgeMs:30000}).then(rows=>{if(alive){setRows(rows);setError("");}}).catch(e=>{if(alive)setError(e.message);}).finally(()=>{if(alive)setLoading(false);});return()=>{alive=false;};},[path]);
 return {rows,loading,error,reload,setRows};
}
export function AsyncState({loading,error,retry}:{loading:boolean;error:string;retry:()=>void}){return <>{loading && <p role="status">Memuat ruang belajar…</p>}{error && <div className="form-error" role="alert">{error}<button type="button" className="text-button" onClick={retry}>Muat lagi</button></div>}</>;}
export function Field({label,children,hint}:{label:string;children:ReactNode;hint?:string}){return <label className="lms-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;}
export const errorMessage=(e:unknown)=>e instanceof Error?e.message:"Belum berhasil. Coba lagi.";
export const localDate=()=>new Date().toLocaleDateString("en-CA");
export const toLocalInput=(iso?:string|null)=>{if(!iso)return "";const d=new Date(iso);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);};
export const toIso=(local:string)=>local?new Date(local).toISOString():null;
export const statusLabel=(status:string)=>({draft:"Draf",published:"Terbit",archived:"Arsip",open:"Dibuka",closed:"Ditutup",missing:"Belum dikumpulkan",submitted:"Sudah dikirim",partially_submitted:"Sebagian lembar terkirim",reviewed:"Sudah ditinjau",needs_revision:"Perlu perbaikan",pending_review:"Menunggu penilaian",graded:"Sudah dinilai",in_progress:"Sedang dikerjakan",active:"Aktif",approved:"Disahkan"}[status]??status);
export function LessonSelect({value,onChange,initialCourseId,classroomId,disabled=false,required=true}:{value:number;onChange:(id:number)=>void;initialCourseId?:number;classroomId?:number;disabled?:boolean;required?:boolean}) {
 const {activeClass}=useSession();
 const classId=classroomId??activeClass;
 const courses=useApiRows<Course>("/courses"+(classId?"?classroom_id="+classId:""));
 const [courseId,setCourseId]=useState(initialCourseId??0),[course,setCourse]=useState<Course|null>(null),[error,setError]=useState("");
 useEffect(()=>{let alive=true;if(!courseId){setCourse(null);return;}apiRequest<{data:Course}>("/courses/"+courseId).then(r=>{if(alive){setCourse(r.data);setError("");}}).catch(e=>{if(alive)setError(e.message);});return()=>{alive=false;};},[courseId]);
 const lessons=course?.chapters?.flatMap(ch=>(ch.lessons??[]).map(l=>({...l,chapterTitle:ch.title})))??[];
 return <div className="lesson-select-grid"><div><span className="field-label">Mata pelajaran / kelas belajar</span><ThemeSelect label="Mata pelajaran" value={courseId} disabled={disabled} onChange={v=>{setCourseId(Number(v));setCourse(null);onChange(0);}} placeholder="Pilih mapel" options={courses.rows.map(c=>({value:String(c.id),label:c.title,description:c.subject+" · "+(c.classroom?.name??"")+" · "+c.semester}))}/></div><div><span className="field-label">Pertemuan tujuan</span><ThemeSelect label="Pertemuan tujuan" value={value} required={required} disabled={disabled||!courseId} onChange={v=>onChange(Number(v))} placeholder={courseId?"Pilih pertemuan":"Pilih mapel dahulu"} options={lessons.map(l=>({value:String(l.id),label:l.title,description:l.chapterTitle+" · "+statusLabel(l.status)}))}/></div>{(courses.error||error) && <p className="form-error" role="alert">{courses.error||error}</p>}{!courses.loading && !courses.rows.length && <p className="helper">Buat mapel, bab dan pertemuan melalui tab Mapel terlebih dahulu.</p>}</div>;
}
export function useMembers(enabled=true) {
 const {activeClass}=useSession();const list=useApiRows<Member>(enabled&&activeClass?"/classrooms/"+activeClass+"/members":null);
 return {...list,rows:list.rows.filter(m=>m.role==="student")};
}

