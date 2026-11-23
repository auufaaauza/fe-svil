"use client";
import { useRouter } from "next/navigation";
import { useSession } from "./session-provider";
import { confirmLeave } from "../lib/unsaved-changes";
import { FriendlyIcon, type IconName } from "./friendly-icon";

export function StaffShortcuts() {
 const {user}=useSession();const router=useRouter();const base=user?.role==="admin"?"/admin":"/guru";
 const content=base+(user?.role==="admin"?"/konten":"/materi");
 const links:[string,string,IconName][]=[["LKPD",content+"?kegiatan=lkpd","lkpd"],["Kuis dan game",content+"?kegiatan=assessment","quiz"],["Materi",content+"?kegiatan=material","book"],["Tugas",content+"?kegiatan=task","task"],["Absen",base+"/laporan?tab=attendance","attendance"],["Nilai LKPD",base+"/laporan?tab=lkpd","chart"]];
 return <section className="panel"><h2>Akses pembelajaran</h2><div className="staff-feature-shortcuts">{links.map(([label,href,icon])=><button className="button secondary" key={label} onClick={async()=>{if(await confirmLeave())router.push(href);}}><FriendlyIcon name={icon} size={25}/>{label}</button>)}</div></section>;
}
