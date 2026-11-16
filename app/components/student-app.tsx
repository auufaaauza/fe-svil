"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "./session-provider";
import { workspaceNavigation } from "../lib/navigation";
import { confirmLeave } from "../lib/unsaved-changes";
import { FriendlyIcon } from "./friendly-icon";
import { BrandLogo } from "./brand-logo";
import { GroupWorkspace } from "./group-workspace";
import { AccountPanel, SettingsButton, NotificationCenter } from "./account-settings";
import { AccountSessionCard } from "./account-session-card";
import { AssignmentWorkspace } from "./assignment-workspace";
import { CalendarWorkspace, ProgressWorkspace } from "./calendar-progress";
import { LkpdSummary } from "./lkpd-summary";
import { Gradebook } from "./gradebook";
import { MaterialReader } from "./content-detail";
import { ReflectionWorkspace } from "./reflection-workspace";
import { ResearchWorkspace } from "./research-workspace";
import { ThemeSelect } from "./theme-select";
import { AssessmentWorkspace } from "./assessment-workspace";
import { WordwallGradesSummary } from "./wordwall-grades";

export function StudentApp() {
  const { user, classrooms, activeClass, setActiveClass, error, refresh } = useSession();
  const pathname = usePathname(); const query = useSearchParams(); const router = useRouter();
  const material = query.get("materi");
  const legacy = query.get("kegiatan");
  const section = pathname.endsWith("/profil") ? "Profil" : pathname.endsWith("/cerita") ? "Refleksi" : pathname.endsWith("/aksi") ? "Aksi" : pathname.endsWith("/materi") || material || legacy === "material" ? "Materi" : pathname.endsWith("/tugas") || legacy === "task" ? "Tugas" : ["/siswa/ringkasan","/siswa/nilai","/siswa/absen"].includes(pathname) || legacy === "grade" ? "Ringkasan" : "LKPD";
  const canUseSvil = user?.canUseSvil !== false;
  const navigate = async (href: string) => { if (await confirmLeave()) router.push(href); };
  const classroom = classrooms.find(c => c.id === activeClass);
  return <div className="app-shell student-app student-simple">
    <a href="#main-content" className="skip-link">Langsung ke isi halaman</a>
    <aside className="sidebar"><Link href="/siswa" className="brand" onClick={async e=>{e.preventDefault();await navigate("/siswa");}}><BrandLogo/></Link><div className="sidebar-scroll"><div className="workspace"><FriendlyIcon name="school" size={34}/><div><strong>{classroom?.name??"Kelas belajarmu"}</strong><small>{user?.name}</small></div></div><nav aria-label="Navigasi utama siswa" style={{gridTemplateColumns:"repeat(4,minmax(0,1fr))"}}>{workspaceNavigation.student.map(item=><button key={item.href} className={"nav-item "+(section===item.label?"active":"")} aria-current={section===item.label?"page":undefined} onClick={()=>navigate(item.href)}><FriendlyIcon name={item.icon} size={28}/><span>{item.label}</span></button>)}</nav><p className="student-nav-help">Buka LKPD, kerjakan perlahan, lalu kirim jawabanmu.</p></div><div className="sidebar-footer"><AccountSessionCard beforeLeave={confirmLeave}/></div></aside>
    <div className="main-shell"><header className="topbar"><div className="breadcrumb">Ruang siswa <span>/</span><strong>{section}</strong></div><div className="header-learning-actions"><NotificationCenter beforeLeave={confirmLeave}/><SettingsButton beforeLeave={confirmLeave}/></div></header>
      <main id="main-content" tabIndex={-1}><div className="student-welcome"><div><p className="eyebrow">{classroom?.name??"SVIL"}</p><h1>{section==="LKPD"?"Yuk, kerjakan LKPD!":section}</h1><p>{section==="LKPD"?"Baca satu pertanyaan, amati medianya, lalu tuliskan jawabanmu.":"Belajar dan melihat hasilmu dalam satu tempat."}</p></div>{classrooms.length>1&&<ThemeSelect label="Kelas belajarku" value={activeClass??""} onChange={async value=>{if(await confirmLeave())setActiveClass(Number(value));}} options={classrooms.map(c=>({value:String(c.id),label:c.name+(c.archived?" · Arsip":"")}))}/>}</div>
      <div className="page-content-stack">{error&&<div className="form-error" role="alert">{error}<button className="text-button" onClick={()=>refresh()}>Coba lagi</button></div>}
      {!activeClass&&section!=="Profil"?<section className="panel"><h2>Akunmu belum terhubung ke kelas</h2><p>Minta guru atau admin menambahkanmu ke kelas yang benar.</p></section>:section==="Profil"?<AccountPanel/>:section==="Materi"?<StudentMaterials/>:section==="Tugas"?<AssignmentWorkspace/>:section==="Ringkasan"?<StudentSummary initialTab={pathname.endsWith("/nilai")||legacy==="grade"?"nilai":pathname.endsWith("/absen")?"absen":query.get("tab")??"ringkasan"}/>:section==="Refleksi"&&canUseSvil?<ReflectionWorkspace/>:section==="Aksi"&&canUseSvil?<GroupWorkspace actionsOnly/>:!canUseSvil?<><section className="panel"><h2>Kegiatan kelasmu</h2><p>Ikuti materi dan tugas yang diberikan guru.</p></section><StudentMaterials/><ResearchWorkspace/></>:<GroupWorkspace/>}
      </div><footer className="page-footer"><span><strong>svil.</strong> Belajar bersama, tumbuh bersama.</span></footer></main>
    </div>
  </div>;
}

function StudentMaterials() {
  const { materials, activeClass } = useSession(); const query = useSearchParams(); const router = useRouter();
  const [search,setSearch] = useState(""); const selected = query.get("materi");
  const quizzes=query.get("kegiatan")==="assessment";
  const rows = materials.filter(m=>m.status==="published"&&m.classroomId===activeClass&&(m.kind??"material")==="material"&&m.title.toLowerCase().includes(search.toLowerCase()));
  if(selected)return <MaterialReader id={selected} onBack={()=>router.push("/siswa/materi")}/>;
  if(quizzes)return <><div className="segmented-tabs" aria-label="Materi dan kuis"><button onClick={()=>router.push("/siswa/materi")}>Materi</button><button className="selected" aria-pressed="true">Kuis dan game</button></div><AssessmentWorkspace/></>;
  return <><div className="segmented-tabs" aria-label="Materi dan kuis"><button className="selected" aria-pressed="true">Materi</button><button onClick={()=>router.push("/siswa/materi?kegiatan=assessment")}>Kuis dan game</button></div><section className="panel"><div className="section-heading"><div><h2>Materi dari gurumu</h2><p>Buka sumber belajar untuk membantu menjawab LKPD.</p></div><FriendlyIcon name="book" size={40}/></div><label className="search-field"><FriendlyIcon name="search" size={23}/><input aria-label="Cari materi" placeholder="Cari judul materi…" value={search} onChange={e=>setSearch(e.target.value)}/></label><div className="student-resource-grid">{rows.map(m=><Link className="student-resource-card" key={m.id} href={"/siswa/materi?materi="+encodeURIComponent(m.id)}><FriendlyIcon name="book" size={32}/><div><strong>{m.title}</strong><small>{m.subject??"IPAS"} · {m.uploadedBy?.name??"Gurumu"}</small></div><FriendlyIcon name="arrow" size={22}/></Link>)}</div>{!rows.length&&<p className="soft-note">Belum ada materi yang sesuai. Tanyakan kepada gurumu, ya.</p>}</section></>;
}

function StudentSummary({initialTab}:{initialTab:string}) {
  const { user } = useSession(); const [tab,setTab] = useState(initialTab);
  return <div className="lms-workspace"><div className="segmented-tabs" aria-label="Ringkasan belajarku">{[["ringkasan","Dashboard"],["nilai","Nilai LKPD"],["absen","Absen"]].map(([key,label])=><button key={key} className={tab===key?"selected":""} onClick={()=>setTab(key)}>{label}</button>)}</div>{tab==="nilai"?<><LkpdSummary showGrades/><WordwallGradesSummary/><details className="panel"><summary>Nilai tugas dan asesmen lainnya</summary><Gradebook/></details></>:tab==="absen"?<CalendarWorkspace attendanceOnly/>:<><section className="panel"><h2>Halo, {user?.name}!</h2><p>Lihat hasil dan kehadiranmu atau lanjutkan LKPD.</p><div className="student-shortcuts"><Link className="button primary" href="/siswa">Lanjutkan LKPD</Link><button className="button secondary" onClick={()=>setTab("nilai")}>Lihat nilai</button><button className="button secondary" onClick={()=>setTab("absen")}>Lihat absen</button><Link className="button secondary" href="/siswa/profil">Ubah profil</Link>{user?.canUseSvil!==false&&<Link className="button secondary" href="/siswa/cerita">Refleksi pribadiku</Link>}</div></section><LkpdSummary/><ProgressWorkspace/><ResearchWorkspace/></>}</div>;
}
