"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { homeForRole, studyForRole, sessionDestination, lessonLocation, lessonFromQuery, workspaceNavigation } from "../lib/navigation";
import { FriendlyIcon } from "./friendly-icon";
import { LearningScene, ScenePlayer } from "./learning-scene";
import { StudentMaterial } from "./material-workshop";
import { useMaterials } from "../lib/material-store";
import { lessons, phases, phaseNames } from "../lib/learning";
import { useSession } from "./session-provider";
import { LoginScreen } from "./login-screen";
import { LiveReport, AdminSetup } from "./server-panels";
import { apiRequest, loadPages } from "../lib/api";
import type { Classroom, LearningNote } from "./session-provider";
import { BrandLogo } from "./brand-logo";
import { PageLoader } from "./page-loader";
import { ThemeSelect } from "./theme-select";
import { QuestionVisual } from "./question-visual";
import { RegisterScreen } from "./register-screen";
import { ContentDetail, MaterialReader } from "./content-detail";
import { StudentReviewInbox, StudentReviewDetail } from "./student-review";
import { ContentWorkspace, StudentLearningHub } from "./content-workspace";
import { StaffHome } from "./stakeholder-home";
import { GroupWorkspace } from "./group-workspace";
import { TeacherAssessment, StudentFeedback } from "./teacher-assessment";

import { ReportWorkspace } from "./report-workspace";
import { ReflectionWorkspace, FollowupWorkspace } from "./reflection-workspace";
import { ClassBoard, RosterImport, SchoolDirectory } from "./school-tools";
import { ResearchWorkspace } from "./research-workspace";
import { AccountPanel, SettingsButton, NotificationCenter } from "./account-settings";
import { ClassroomManagement, GroupManagement } from "./classroom-management";
import { LessonVideo } from "./learning-media";
type Role = "Siswa" | "Guru" | "Admin";


function Dashboard() {
  const { user, classrooms, activeClass, setActiveClass, notes, refresh, logout, error: sessionError } = useSession();
  const role: Role = user!.role === "student" ? "Siswa" : user!.role === "teacher" ? "Guru" : "Admin";
  const router = useRouter();
  const pathname = usePathname();
  const query = useSearchParams();
  const canUseSvil = user?.canUseSvil !== false;
  const nav = workspaceNavigation[user!.role].filter(item => canUseSvil || !["Ceritaku","Aksiku"].includes(item.label));
  const view = nav.filter(item => item.href === pathname || pathname.startsWith(item.href+"/")).sort((a,b) => b.href.length-a.href.length)[0]?.label ?? "Beranda";
  const contentRoute = pathname.match(/^\/(?:guru\/materi|admin\/konten)\/([^/]+)\/([^/]+)$/);
  const studentReviewRoute = pathname.match(/^\/(?:guru\/tinjauan|admin\/laporan\/siswa)\/(\d+)$/);
  const lesson = lessonFromQuery(query.get("pertemuan"), 4);
  const phase = lessonFromQuery(query.get("langkah"), 5) ?? 0;
  const customId = query.get("materi");
  const [answer, setAnswer] = useState(() => user!.role === "student" ? notes.find(n => n.topic === lesson && n.phase === phase && n.classroom_id === activeClass)?.content ?? "" : "");
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [saveError, setSaveError] = useState("");
  const saveInFlight = useRef<Promise<boolean> | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const materials = useMaterials();
  const student = role === "Siswa";
  const customMaterial = materials.find(m => m.id === customId && m.status === "published");
  const currentNote = student ? notes.find(n => n.classroom_id === activeClass && n.topic === lesson && n.phase === phase) : undefined;
  const published = materials.filter(m => m.status === "published" && (!activeClass || m.classroomId === activeClass));
  const matchingLessons = lessons.map((l,index) => ({ ...l, index })).filter(l => `${l.title} ${l.short} ${l.desc}`.toLowerCase().includes(search.toLowerCase()));
  const focusContent = () => {
    mainRef.current?.focus({ preventScroll: true });
    mainRef.current?.scrollIntoView({ behavior: "instant", block: "start" });
  };
  const savePendingNote = async () => !student || lesson === null || !answer.trim() || answer === currentNote?.content ? true : saveDraft();
  const changeView = async (next: string) => {
    if (!await savePendingNote()) return;
    const target = nav.find(item => item.label === next);
    router.push(target?.href ?? studyForRole(user!.role));
    focusContent();
  };
  const openLesson = async (index: number, nextPhase = 0) => { if (!await savePendingNote()) return; router.push(lessonLocation(user!.role,index,nextPhase)); focusContent(); };
  const changePhase = async (index: number) => { if (!await savePendingNote()) return; if (lesson !== null) router.replace(lessonLocation(user!.role,lesson,index), { scroll: false }); };
  const openMaterial = async (id: string) => { if (!await savePendingNote()) return; router.push(studyForRole(user!.role)+"?materi="+encodeURIComponent(id)); focusContent(); };
  const saveDraft = async (): Promise<boolean> => {
    if (saveInFlight.current) return saveInFlight.current;
    if (lesson === null || !student || !answer.trim()) return false;
    const content = answer;
    const task = (async () => {
      setSaving(true); setSaveError("");
      try {
        const available = activeClass ? [] : await loadPages<Classroom>("/classrooms");
        const classroomId = activeClass ?? available[0]?.id;
        if (!classroomId) throw new Error("Akunmu belum mendapat kelas. Minta guru atau admin menghubungkan akunmu dengan kelas, lalu coba simpan lagi.");
        await apiRequest<{ data: LearningNote }>("/notes", { method: "PUT", body: JSON.stringify({ classroom_id: classroomId, topic: lesson, phase, content }) });
        setSaved(true); setNotice("Catatanmu sudah tersimpan. Gurumu bisa membacanya.");
        try { await refresh(); } catch { setNotice("Catatan sudah tersimpan. Daftar kelas belum termuat; coba muat ulang saat koneksi pulih."); }
        return true;
      } catch (cause) { setSaveError(cause instanceof Error ? cause.message : "Catatan belum tersimpan. Isianmu tetap ada; coba lagi, ya."); return false; }
      finally { setSaving(false); saveInFlight.current = null; }
    })();
    saveInFlight.current = task;
    return task;
  };

  const heading = customId ? "Materi dari gurumu" : lesson !== null ? lessons[lesson].short : view === "Beranda" ? student ? "Halo, penjelajah kecil!" : role === "Guru" ? "Ringkasan kelas hari ini" : "Informasi sekolah" : view;
  return <div className={"app-shell "+(student?"student-app":"staff-app")}>
    <a href="#main-content" className="skip-link">Langsung ke isi halaman</a>
    <aside className="sidebar">
      <Link className="brand" href={homeForRole(user!.role)} aria-label="SVIL beranda"><BrandLogo/></Link>
      <div className="workspace"><FriendlyIcon name="school" size={38}/><div><strong>{user!.schoolName??"Pengelolaan SVIL"}</strong><small>{classrooms.find(c=>c.id===activeClass)?.name??role}</small></div></div>
      <p className="nav-label">{student?"RUANG PETUALANGANMU":"RUANG "+role.toUpperCase()}</p>
      <nav aria-label="Navigasi utama" style={{gridTemplateColumns:"repeat("+nav.length+",minmax(0,1fr))"}}>{nav.map(item=><button type="button" key={item.label} disabled={saving} aria-current={view===item.label?"page":undefined} className={"nav-item "+(view===item.label?"active":"")} onClick={()=>changeView(item.label)}><FriendlyIcon name={item.icon} size={30}/><span>{item.label}</span></button>)}</nav>
      <div className="sidebar-note"><FriendlyIcon name="heart" size={42}/><strong>Kebaikan itu menular.</strong><p>Dengarkan teman.<br/>Sayangi lingkungan.<br/>Mulai dari hal kecil.</p></div>
      <div className="sidebar-footer"><span className="avatar"><FriendlyIcon name={student?"compass":"people"} size={30}/></span><div><strong>{user!.name}</strong><small>{student?"Penjelajah Nusantara":"Ruang pengelolaan"}</small></div></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div className="breadcrumb">Ruang {role.toLowerCase()} <span>/</span> <strong>{lesson!==null||customId?"Belajar":view}</strong></div>
        <div className="header-learning-actions"><NotificationCenter beforeLeave={savePendingNote}/><SettingsButton beforeLeave={savePendingNote}/></div><div className="top-actions desktop-session">{classrooms.length>0&&<div className="role-switch"><span>Kelas</span><ThemeSelect label="Kelas belajar" disabled={saving} value={activeClass??""} onChange={async value=>{if(!await savePendingNote())return;setActiveClass(Number(value));router.push(homeForRole(user!.role));focusContent();}} options={classrooms.map(c=>({value:String(c.id),label:c.name,description:c.schoolName}))}/></div>}<button className="button secondary logout-button" disabled={saving} onClick={async()=>{if(await savePendingNote())logout().catch(e=>setNotice(e.message));}}>Keluar</button></div>
      </header>
      <main ref={mainRef} tabIndex={-1} id="main-content">
        <div className="page-heading"><div><p className="eyebrow">{student?"BELAJAR, PEDULI, DAN TUMBUH BERSAMA":"SMART VALUE INQUIRY LEARNING"}</p><h1>{heading}<span className="heading-mascot"><FriendlyIcon name={student?"heart":"sprout"} size={36}/></span></h1><p>{student?"Baca bahan belajarmu, temukan hal baru, dan bertumbuh bersama.":"Dampingi proses belajar dan catat bukti perkembangan yang bermakna."}</p></div><span className="term-pill">{classrooms.find(c=>c.id===activeClass)?.name??"Ruang sekolah"}{classrooms.find(c=>c.id===activeClass)?.archived?" · Arsip":""}</span></div>
        <div className="page-content-stack">
        {sessionError&&<div className="form-error" role="alert">{sessionError}<button className="text-button" onClick={()=>refresh().catch(e=>setNotice(e.message))}>Coba muat lagi</button></div>}
        {notice&&<div className="notice" role="status"><FriendlyIcon name="check" size={26}/><span>{notice}</span><button onClick={()=>setNotice("")} aria-label="Tutup pemberitahuan"><FriendlyIcon name="close" size={20}/></button></div>}
        {student&&!canUseSvil&&(lesson!==null||["Ceritaku","Aksiku"].includes(view))?<section className="panel"><h2>Ruang belajarmu sudah siap</h2><p>Gurumu membagikan kegiatan melalui menu Belajar.</p><button className="button primary" onClick={()=>changeView("Belajar")}>Buka kegiatan belajar</button></section>
        :contentRoute?<ContentDetail kind={contentRoute[1]} id={contentRoute[2]} edit={query.get("edit")==="1"}/>
        :studentReviewRoute?<StudentReviewDetail studentId={Number(studentReviewRoute[1])} classroomId={query.get("kelas")&&/^\d+$/.test(query.get("kelas")!)?Number(query.get("kelas")):null}/>
        :customId&&student?<MaterialReader id={customId} onBack={()=>changeView("Belajar")}/>
        :customMaterial?<StudentMaterial key={customMaterial.id} material={customMaterial} onBack={()=>changeView("Belajar")}/>
        :lesson!==null?<>
          <button className="back-link" disabled={saving} onClick={()=>changeView(student?"Belajar":user?.role==="admin"?"Konten belajar":"Konten kelas")}><FriendlyIcon name="back" size={21}/>Kembali ke semua pertemuan</button>
          <div className="learning-header"><span className={"lesson-number "+lessons[lesson].color}>Pertemuan {lesson+1} dari 4</span><span>Belajar bersama guru · 70 menit</span></div>
          <div className="lesson-layout"><div><section className="panel learning-panel"><div className="phase-tabs" aria-label="Langkah belajar">{phases.map((p,i)=><button key={p} disabled={saving} className={phase===i?"selected":""} aria-pressed={phase===i} onClick={()=>changePhase(i)}><span>{i+1}</span>{p}</button>)}</div>
            <div className="phase-instruction" key={phase}><p className="eyebrow">LANGKAH {phase+1} DARI 5 · {phaseNames[phase].toUpperCase()}</p><h2>{["Apa yang kamu lihat?","Ayo, temukan faktanya!","Bagaimana menurutmu?","Ceritakan dengan hatimu.","Kebaikan apa yang akan kamu lakukan?"][phase]}</h2><p className="question-prompt">{lessons[lesson].prompts[phase]}</p><LessonVideo topic={lesson} phase={phase}/>
              <label className="field-label" htmlFor="reflection">{phase===3?"Cerita pribadiku":"Catatan belajarku"}</label><textarea id="reflection" value={answer} maxLength={8000} readOnly={!student||saving} onChange={e=>{setAnswer(e.target.value);setSaved(false);setSaveError("");}} placeholder={phase===3?"Aku merasa … Aku belajar … Aku ingin …":"Tulis dengan bahasamu sendiri, ya…"} rows={5}/>
              {currentNote?.feedback&&<div className="soft-note"><strong>Pesan dari gurumu</strong><p>{currentNote.feedback}</p></div>}
              <div className="form-actions"><small>{saved||currentNote?.content===answer?"Catatan sudah tersimpan di server.":"Simpan catatanmu. Saat pindah langkah, catatan juga akan disimpan."}</small><button className="button primary" disabled={!student||saving||!answer.trim()} onClick={saveDraft}><FriendlyIcon name="check" size={23}/>{saving?"Menyimpan…":saved||currentNote?.content===answer?"Tersimpan":"Simpan catatanku"}</button></div>
              {saveError&&<div className="form-error" role="alert">{saveError}</div>}{!activeClass&&<p className="helper">Jika belum mendapat kelas, minta bantuan guru atau admin.</p>}
            </div><div className="phase-footer"><span>{phase+1} dari 5 langkah</span><button className="button secondary" disabled={saving} onClick={()=>phase<4?changePhase(phase+1):changeView("Belajar")}>{phase<4?"Langkah berikutnya":"Kembali ke belajar"}<FriendlyIcon name="arrow" size={22}/></button></div>
          </section></div><aside className="panel lesson-guide"><FriendlyIcon name={lessons[lesson].icon} size={55}/><h3>Pelan-pelan juga boleh.</h3><p>Kalau belum paham, baca lagi atau tanya gurumu. Kita belajar bersama.</p><hr/><strong>Yang kamu perlukan</strong><p>LKPD {lesson+1}<br/>Buku IPAS halaman {lessons[lesson].pages}<br/>Teman kelompok dan rasa ingin tahu!</p><span className="tag">Cinta tanah air</span><span className="tag">Cinta lingkungan</span></aside></div>
        </>:view==="Konten kelas"||view==="Konten belajar"?<ContentWorkspace/>
        :view==="Belajar"&&student?<StudentLearningHub onOpenLesson={openLesson} onOpenMaterial={openMaterial}/>
        :view==="Laporan"?<ReportWorkspace/>
        :view==="Kelompok"||view==="Kelasku"?<><ClassBoard/><GroupManagement key={activeClass}/>{canUseSvil&&<GroupWorkspace/>}{!student&&<FollowupWorkspace/>}</>
        :view==="Aksiku"?<><GroupWorkspace actionsOnly/><FollowupWorkspace/></>
        :view==="Ceritaku"?<><ReflectionWorkspace/><StudentFeedback/><ResearchWorkspace/></>
        :view==="Tinjauan"?<StudentReviewInbox/>
        :view==="Madrasah"?<div className="lms-workspace"><AdminSetup/><ClassroomManagement key={activeClass}/><SchoolDirectory/><RosterImport/></div>
        :view==="Beranda"&&!student?<div className="lms-workspace"><StaffHome onNavigate={changeView}/><ClassBoard compact/></div>
        :<><ClassBoard compact/><StudentLearningHub onOpenLesson={openLesson} onOpenMaterial={openMaterial}/></>}
        </div>
        <footer className="page-footer"><span><strong>svil.</strong> Belajar dengan hati, bertumbuh bersama.</span><span>SVIL · belajar dengan hati</span></footer>
      </main>
    </div>
  </div>;
}

function SessionGate() {
  const { user, loading, activeClass } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const query = useSearchParams();
  const destination = sessionDestination(user?.role ?? null, pathname);
  useEffect(() => { if (!loading && destination) router.replace(destination); }, [loading, destination, router]);
  if (loading || destination) return <PageLoader/>;
  if(user?.mustChangePassword)return <main className="forced-password-page"><AccountPanel forced/></main>;
  return user ? <Dashboard key={user.id+":"+activeClass+":"+pathname+"?"+query.toString()}/> : pathname === "/register" ? <RegisterScreen/> : <LoginScreen/>;
}
export function LearningApp() { return <Suspense fallback={<PageLoader/>}><SessionGate/></Suspense>; }
