"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { homeForRole, sessionDestination, workspaceNavigation } from "../lib/navigation";
import { confirmLeave } from "../lib/unsaved-changes";
import { FriendlyIcon } from "./friendly-icon";
import { useSession } from "./session-provider";
import { LoginScreen } from "./login-screen";
import { AdminSetup } from "./server-panels";
import { BrandLogo } from "./brand-logo";
import { PageLoader } from "./page-loader";
import { ThemeSelect } from "./theme-select";
import { RegisterScreen } from "./register-screen";
import { ContentDetail, MaterialReader } from "./content-detail";
import { StudentReviewInbox, StudentReviewDetail } from "./student-review";
import { ContentWorkspace } from "./content-workspace";
import { StaffHome } from "./stakeholder-home";
import { GroupWorkspace } from "./group-workspace";
import { ReportWorkspace } from "./report-workspace";
import { FollowupWorkspace } from "./reflection-workspace";
import { ClassBoard, RosterImport, SchoolDirectory } from "./school-tools";
import { AccountPanel, SettingsButton, NotificationCenter } from "./account-settings";
import { ClassroomManagement, GroupManagement } from "./classroom-management";
import { AccountSessionCard } from "./account-session-card";
import { StudentAccountGenerator } from "./student-account-generator";
import { StudentApp } from "./student-app";
import { StaffShortcuts } from "./staff-shortcuts";

function Dashboard() {
  const {user,classrooms,activeClass,setActiveClass,refresh,error:sessionError}=useSession();
  const router=useRouter();const pathname=usePathname();const query=useSearchParams();
  const role=user!.role==="teacher"?"Guru":"Admin";
  const nav=workspaceNavigation[user!.role];
  const view=nav.filter(item=>item.href===pathname||pathname.startsWith(item.href+"/")).sort((a,b)=>b.href.length-a.href.length)[0]?.label??"Beranda";
  const contentRoute=pathname.match(/^\/(?:guru\/materi|admin\/konten)\/([^/]+)\/([^/]+)$/);
  const studentReviewRoute=pathname.match(/^\/(?:guru\/tinjauan|admin\/laporan\/siswa)\/(\d+)$/);
  const [membershipRevision,setMembershipRevision]=useState(0),[accountRevision,setAccountRevision]=useState(0),[notice,setNotice]=useState("");
  const rosterCreated=(classroomId:number)=>{setAccountRevision(v=>v+1);if(classroomId===activeClass)setMembershipRevision(v=>v+1);};
  const changeView=async(label:string)=>{if(await confirmLeave())router.push(nav.find(item=>item.label===label)?.href??homeForRole(user!.role));};
  const classroom=classrooms.find(c=>c.id===activeClass);
  return <div className="app-shell staff-app"><a href="#main-content" className="skip-link">Langsung ke isi halaman</a><aside className="sidebar"><Link className="brand" href={homeForRole(user!.role)} onClick={async e=>{e.preventDefault();if(await confirmLeave())router.push(homeForRole(user!.role));}}><BrandLogo/></Link><div className="sidebar-scroll"><div className="workspace"><FriendlyIcon name="school" size={38}/><div><strong>{user!.schoolName??"Pengelolaan SVIL"}</strong><small>{classroom?.name??role}</small></div></div><p className="nav-label">RUANG {role.toUpperCase()}</p><nav aria-label="Navigasi utama" style={{gridTemplateColumns:"repeat("+nav.length+",minmax(0,1fr))"}}>{nav.map(item=><button type="button" key={item.href} className={"nav-item "+(view===item.label?"active":"")} aria-current={view===item.label?"page":undefined} onClick={()=>changeView(item.label)}><FriendlyIcon name={item.icon} size={30}/><span>{item.label}</span></button>)}</nav></div><div className="sidebar-footer"><AccountSessionCard beforeLeave={confirmLeave}/></div></aside><div className="main-shell"><header className="topbar"><div className="breadcrumb">Ruang {role.toLowerCase()} <span>/</span><strong>{view}</strong></div><div className="header-learning-actions"><NotificationCenter beforeLeave={confirmLeave}/><SettingsButton beforeLeave={confirmLeave}/></div>{classrooms.length>0&&<div className="role-switch desktop-session"><span>Kelas</span><ThemeSelect label="Kelas belajar" value={activeClass??""} onChange={async value=>{if(await confirmLeave()){setActiveClass(Number(value));router.push(homeForRole(user!.role));}}} options={classrooms.map(c=>({value:String(c.id),label:c.name,description:c.schoolName}))}/></div>}</header>
  <main id="main-content" tabIndex={-1}><div className="page-heading"><div><p className="eyebrow">SMART VALUE INQUIRY LEARNING</p><h1>{view==="Beranda"?role==="Guru"?"Ringkasan kelas hari ini":"Informasi sekolah":view}</h1><p>Dampingi pembelajaran dan pantau kegiatan kelas.</p></div><span className="term-pill">{classroom?.name??"Ruang sekolah"}{classroom?.archived?" · Arsip":""}</span></div><div className="page-content-stack">
  {sessionError&&<div className="form-error" role="alert">{sessionError}<button className="text-button" onClick={()=>refresh().catch(e=>setNotice(e.message))}>Coba muat lagi</button></div>}{notice&&<p className="notice" role="status">{notice}</p>}
  {query.get("akun")==="1"?<AccountPanel/>:contentRoute?<ContentDetail kind={contentRoute[1]} id={contentRoute[2]} edit={query.get("edit")==="1"}/>:studentReviewRoute?<StudentReviewDetail studentId={Number(studentReviewRoute[1])} classroomId={query.get("kelas")&&/^\d+$/.test(query.get("kelas")!)?Number(query.get("kelas")):null}/>:query.get("materi")?<MaterialReader id={query.get("materi")!} onBack={()=>changeView(user?.role==="admin"?"Konten belajar":"Konten kelas")}/>:view==="Konten kelas"||view==="Konten belajar"?<ContentWorkspace/>:view==="Laporan"?<ReportWorkspace/>:view==="Kelasku"?<><ClassBoard/><StudentAccountGenerator onCreated={rosterCreated}/><GroupManagement key={activeClass} membershipRevision={membershipRevision}/><GroupWorkspace membershipRevision={membershipRevision}/><FollowupWorkspace/></>:view==="Tinjauan"?<StudentReviewInbox/>:view==="Madrasah"?<div className="lms-workspace"><StudentAccountGenerator onCreated={rosterCreated}/><AdminSetup/><ClassroomManagement key={activeClass} membershipRevision={membershipRevision}/><SchoolDirectory membershipRevision={membershipRevision} accountRevision={accountRevision}/><RosterImport/></div>:<><StaffShortcuts/><StaffHome onNavigate={changeView}/><ClassBoard compact/></>}
  </div><footer className="page-footer"><span><strong>svil.</strong> Belajar bersama, tumbuh bersama.</span></footer></main></div></div>;
}

function SessionGate() {
 const {user,loading,activeClass}=useSession();const pathname=usePathname();const router=useRouter();const query=useSearchParams();
 const destination=sessionDestination(user?.role??null,pathname);
 useEffect(()=>{if(!loading&&destination)router.replace(destination);},[loading,destination,router]);
 if(loading||destination)return <PageLoader/>;
 if(user?.mustChangePassword)return <main className="forced-password-page"><AccountPanel forced/></main>;
 return user?user.role==="student"?<StudentApp key={user.id+":"+activeClass+":"+pathname+"?"+query.toString()}/>:<Dashboard key={user.id+":"+activeClass+":"+pathname+"?"+query.toString()}/>:pathname==="/register"?<RegisterScreen/>:<LoginScreen/>;
}
export function LearningApp(){return <Suspense fallback={<PageLoader/>}><SessionGate/></Suspense>;}
