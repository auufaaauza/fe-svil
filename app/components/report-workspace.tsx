"use client";
import { useState } from "react";
import { useSession } from "./session-provider";
import { LiveReport } from "./server-panels";
import { Gradebook } from "./gradebook";
import { ResearchWorkspace } from "./research-workspace";
import { FollowupWorkspace } from "./reflection-workspace";
import { StudentReviewInbox } from "./student-review";
export function ReportWorkspace() {
 const {user}=useSession();const [tab,setTab]=useState("gradebook");
 return <div className="lms-workspace"><div className="segmented-tabs" aria-label="Jenis laporan">{[["gradebook","Buku nilai & progres"],["students","Tinjauan murid"],["activity","Aktivitas"],["followups","Tindak lanjut"],["research",user?.role==="admin"?"Penelitian":"Kegiatan penelitian"]].map(([key,label])=><button key={key} className={tab===key?"selected":""} aria-pressed={tab===key} onClick={()=>setTab(key)}>{label}</button>)}</div>{tab==="gradebook"?<Gradebook/>:tab==="students"?<StudentReviewInbox/>:tab==="activity"?<LiveReport/>:tab==="followups"?<FollowupWorkspace/>:<ResearchWorkspace/>}</div>;
}
