import type { CSSProperties } from "react";

export type IconName =
  | "home" | "compass" | "book" | "heart" | "sprout" | "people" | "edit" | "chart" | "school"
  | "lkpd" | "task" | "quiz" | "practice" | "note" | "review" | "feedback" | "bell" | "account"
  | "student" | "teacher" | "classroom" | "content" | "course" | "attendance" | "calendar"
  | "progress" | "gallery" | "discussion" | "observation" | "warning" | "info" | "audio"
  | "select" | "think" | "globe" | "forest" | "harvest" | "flag" | "announcement" | "survey"
  | "plus" | "play" | "pause" | "arrow" | "back" | "check" | "upload" | "download" | "search" | "close" | "exit";

/** Original SVG illustrations: labels stay in the surrounding button. */
export function FriendlyIcon({ name, size = 24, className = "" }: { name: IconName; size?: number; className?: string }) {
  const style = { "--icon-size": `${size}px` } as CSSProperties;
  return <svg className={`friendly-icon icon-${name} ${className}`} style={style} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="#28584f" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <g className="icon-drawing">
      {name === "home" && <><path fill="#ffd88c" d="M9 23 24 10l15 13v16H9Z"/><path fill="#ee9c87" d="m5 24 19-17 19 17-4 4-15-13-15 13Z"/><path fill="#fbfff9" d="M19 39V28h10v11"/><path d="M14 23h.1m20 0h.1"/><path d="M20 21q4 4 8 0"/></>}
      {name === "compass" && <><circle cx="24" cy="25" r="18" fill="#c9e8ff"/><path d="M21 6V3h6v3"/><path className="compass-needle" fill="#ffbda9" d="m32 16-5 13-12 5 5-13Z"/><circle cx="24" cy="25" r="3" fill="white"/><path d="M24 11v2m14 12h-2M24 39v-2M10 25h2"/></>}
      {name === "book" && <><path fill="#c8c0f2" d="M5 12q10-4 19 2 9-6 19-2v26q-10-4-19 2-9-6-19-2Z"/><path d="M24 14v26"/><path d="M10 19h8m-8 6h6m14-6h8m-8 6h6"/><path d="M14 31q3 3 6 0m8 0q3 3 6 0"/></>}
      {name === "heart" && <><path className="icon-heart-shape" fill="#ffb8bf" d="M24 40S5 30 5 18C5 5 20 6 24 15 28 6 43 5 43 18c0 12-19 22-19 22Z"/><path className="icon-eyes" d="M17 23v1m14-1v1"/><path d="M20 28q4 4 8 0"/><path stroke="white" d="M11 16q1-4 5-4"/></>}
      {name === "sprout" && <><path fill="#f2c493" d="m12 30 3 13h18l3-13Z"/><path d="M24 31V16"/><g className="icon-leaves"><path fill="#9cd4a7" d="M24 25C10 27 9 17 10 12c10 0 16 3 14 13Z"/><path fill="#c4e4a2" d="M24 20C22 7 31 4 38 5c1 10-4 16-14 15Z"/></g><path d="M19 36v.1m10-.1v.1m-8 3q3 2 6 0"/></>}
      {name === "people" && <><circle cx="16" cy="15" r="7" fill="#ffd8ad"/><circle cx="34" cy="18" r="6" fill="#e6b68d"/><path fill="#b1d8e8" d="M4 39V31c0-11 24-11 24 0v8Z"/><path fill="#c7c1ea" d="M28 39V30q10-7 16 3v6Z"/><path d="M13 16h.1m6 0h.1m-7 3q3 2 5 0m14 0h.1m5 0h.1"/></>}
      {name === "edit" && <><path fill="#fff1cc" d="M7 7h23v34H7Z"/><path d="M12 16h10m-10 7h8m-8 9h4"/><g className="icon-pencil"><path fill="#c1c2f3" d="m20 30 16-23 7 5-16 23-9 4Z"/><path fill="#f7c893" d="m20 30 7 5-9 4Z"/><path d="m33 12 7 5"/></g></>}
      {name === "chart" && <><path d="M6 6v35h37"/><rect className="icon-bar" x="11" y="25" width="7" height="11" rx="2" fill="#ffd393"/><rect className="icon-bar" x="23" y="17" width="7" height="19" rx="2" fill="#a3d5bd"/><rect className="icon-bar" x="35" y="8" width="7" height="28" rx="2" fill="#bbbcef"/></>}
      {name === "school" && <><path fill="#f4d6a8" d="M6 22h36v20H6Z"/><path fill="#99c9c0" d="m4 22 20-15 20 15Z"/><path d="M24 7V2h10v6H24" fill="#edaa9d"/><path d="M20 42V29h8v13" fill="white"/><path d="M12 29v4m24-4v4"/></>}
      {name === "lkpd" && <><path fill="#dcf0e4" d="M10 5h21l8 8v30H10Z"/><path fill="#a8d5c4" d="M31 5v8h8"/><circle cx="18" cy="22" r="3" fill="#ffd88c"/><path d="M25 22h7m-17 9h17m-17 6h12"/></>}
      {name === "task" && <><rect x="9" y="8" width="30" height="35" rx="4" fill="#ffe3b0"/><rect x="17" y="4" width="14" height="8" rx="3" fill="#b6dcd1"/><path d="m15 23 3 3 5-6m4 3h6m-18 11h18"/></>}
      {name === "quiz" && <><rect x="7" y="5" width="34" height="38" rx="8" fill="#d6cff4"/><path d="M18 17a6 6 0 0 1 12 0c0 5-6 4-6 10"/><circle cx="24" cy="34" r="1.6" fill="#28584f" stroke="none"/></>}
      {name === "practice" && <><circle cx="23" cy="25" r="18" fill="#ffe1c7"/><circle cx="23" cy="25" r="11" fill="#fff7e8"/><circle cx="23" cy="25" r="4" fill="#eda993"/><path d="m23 25 15-15m-1-5 1 5 5 1"/></>}
      {name === "note" && <><rect x="9" y="6" width="30" height="36" rx="4" fill="#ffe9a9"/><path fill="#f5cb7c" d="M9 10h7v28H9Z"/><path d="M6 14h7m-7 10h7M6 34h7m8-19h12m-12 8h12m-12 8h8"/></>}
      {name === "review" && <><path fill="#e4edf7" d="M8 5h25v35H8Z"/><path d="m13 14 2 2 4-4m4 2h5m-15 9h9"/><circle cx="31" cy="30" r="9" fill="#d4e9dd"/><path d="m37 37 7 7m-17-14 3 3 5-6"/></>}
      {name === "feedback" && <><path fill="#cce9dd" d="M6 7h36v26H23L13 42v-9H6Z"/><path d="M14 16h20m-20 8h13"/></>}
      {name === "bell" && <><path fill="#ffdfa0" d="M9 33h30l-4-7V18a11 11 0 0 0-22 0v8Z"/><path d="M21 6V3h6v3m-9 32a6 6 0 0 0 12 0"/><path stroke="white" d="M18 18q0-5 5-6"/></>}
      {name === "account" && <><circle cx="24" cy="24" r="20" fill="#d9eae5"/><circle cx="24" cy="17" r="7" fill="#ffd8ad"/><path fill="#a9cec8" d="M11 38v-3c0-14 26-14 26 0v3"/><path d="M21 18h.1m6 0h.1m-6 3q3 2 6 0"/></>}
      {name === "student" && <><path fill="#d4d0f2" d="M6 43v-6c0-12 30-12 30 0v6Z"/><circle cx="21" cy="22" r="9" fill="#ffd8ad"/><path fill="#a9cfd8" d="m3 11 18-8 18 8-18 8Z"/><path d="M10 14v7m29-10v15m-20-3h.1m5 0h.1m-6 4q3 2 6 0"/></>}
      {name === "teacher" && <><rect x="15" y="5" width="28" height="23" rx="3" fill="#b8dbcc"/><path d="M22 12h14m-14 7h8m-3 9v8m-6 0h13"/><circle cx="10" cy="25" r="6" fill="#ffd8ad"/><path fill="#c5cef0" d="M2 43v-6c0-9 16-9 16 0v6Z"/><path d="m16 32 9-8"/></>}
      {name === "classroom" && <><rect x="8" y="5" width="32" height="17" rx="2" fill="#b8dcd0"/><path d="M16 11h16m-10 5h10"/><path fill="#f1d6aa" d="M4 29h16v6H4Zm24 0h16v6H28Z"/><path d="M7 35v8m10-8v8m14-8v8m10-8v8"/></>}
      {name === "content" && <><path fill="#d3cef0" d="M5 12V7h15l5 5h18v28H5Z"/><path fill="#e5def8" d="M5 18h38l-4 23H9Z"/><path d="M18 27h13m-13 6h9"/></>}
      {name === "course" && <><path fill="#f7d7a6" d="m8 12 25-7 7 25-25 7Z"/><rect x="5" y="12" width="25" height="31" rx="3" fill="#b9d9e8"/><path d="M11 12v31m6-23h7m-7 7h7m-7 7h4"/></>}
      {name === "attendance" && <><rect x="5" y="8" width="38" height="35" rx="5" fill="#d3ead7"/><path d="M5 18h38M15 4v8m18-8v8m-18 17 6 6 12-12"/></>}
      {name === "calendar" && <><rect x="5" y="8" width="38" height="35" rx="5" fill="#ffe2d5"/><path fill="#f3baac" d="M5 13q0-5 5-5h28q5 0 5 5v5H5Z"/><path d="M15 4v8m18-8v8m-19 14h2m7 0h2m7 0h2m-20 9h2m7 0h2"/></>}
      {name === "progress" && <><path fill="#d0e6ed" d="M5 42V32h11V22h11V12h11v30Z"/><path d="M38 12V3m0 1h7l-2 4h-5M10 25l9-9m-6 0h6v6"/></>}
      {name === "gallery" && <><rect x="5" y="7" width="38" height="34" rx="4" fill="#dfd5f4"/><circle cx="32" cy="17" r="4" fill="#ffdb94"/><path fill="#add5bf" d="m8 37 11-15 9 10 5-6 8 11Z"/></>}
      {name === "discussion" && <><path fill="#c2dfee" d="M4 6h29v22H15l-8 7v-7H4Z"/><path fill="#dfd2ef" d="M33 17h11v22h-5v6l-8-6H20v-7h13Z"/><path d="M11 14h15m-15 7h10"/></>}
      {name === "observation" && <><path fill="#d7ebf1" d="M3 24s8-14 21-14 21 14 21 14-8 14-21 14S3 24 3 24Z"/><circle cx="24" cy="24" r="9" fill="#a9d5c3"/><circle cx="24" cy="24" r="3" fill="#28584f"/><path stroke="white" d="m21 20 1-1"/></>}
      {name === "warning" && <><path fill="#ffe0ac" d="M21 6a3.5 3.5 0 0 1 6 0l18 32a3 3 0 0 1-3 5H6a3 3 0 0 1-3-5Z"/><path d="M24 17v12"/><circle cx="24" cy="36" r="1.6" fill="#28584f" stroke="none"/></>}
      {name === "info" && <><circle cx="24" cy="24" r="20" fill="#d5e8f8"/><path d="M24 22v13m-4 0h8"/><circle cx="24" cy="14" r="1.6" fill="#28584f" stroke="none"/></>}
      {name === "audio" && <><path d="M6 27v-5a18 18 0 0 1 36 0v5"/><rect x="3" y="23" width="9" height="17" rx="4" fill="#c9c6ef"/><rect x="36" y="23" width="9" height="17" rx="4" fill="#c9c6ef"/><path d="M20 21v11m8-15v19"/></>}
      {name === "select" && <><path d="M6 12h36M6 24h36M6 36h36"/><rect x="12" y="7" width="8" height="10" rx="3" fill="#c5dff0"/><rect x="28" y="19" width="8" height="10" rx="3" fill="#e4d2f2"/><rect x="17" y="31" width="8" height="10" rx="3" fill="#c7e3d0"/></>}
      {name === "think" && <><path fill="#ffe4a4" d="M16 32c0-6-7-8-7-16a15 15 0 0 1 30 0c0 8-7 10-7 16Z"/><path d="M16 32h16m-15 6h14m-11 5h8m-8-13-2-11 6 4 6-4-2 11"/></>}
      {name === "globe" && <><circle cx="24" cy="24" r="20" fill="#c4e5f6"/><path fill="#b4dca5" d="m12 9 5 6-3 7-8 3m34-12-10 2-3 7 7 4-3 11-8 6"/><path d="M5 31q13 3 20 12"/></>}
      {name === "forest" && <><path fill="#c1dfac" d="m15 4 12 17h-5l8 13H1l8-13H4Z"/><path fill="#92c9af" d="m33 8 13 18h-6l7 11H21l7-11h-6Z"/><path d="M15 34v10m18-7v7"/></>}
      {name === "harvest" && <><path d="M24 44V7m-7 35 7-7 7 7"/><path fill="#f5d28f" d="M24 14C15 15 10 10 12 4c8 0 13 3 12 10Zm0 10c-9 1-14-4-12-10 8 0 13 3 12 10Zm0 10c-9 1-14-4-12-10 8 0 13 3 12 10Z"/><path fill="#f6dfab" d="M24 19C33 20 38 15 36 9c-8 0-13 3-12 10Zm0 10c9 1 14-4 12-10-8 0-13 3-12 10Z"/></>}
      {name === "flag" && <><path d="M9 44V4m-5 40h15"/><path fill="#f2b6ad" d="M9 6q9-5 16 0t15 0v13q-8 5-15 0t-16 0Z"/><path fill="#fff8e9" d="M9 19q9-5 16 0t15 0v13q-8 5-15 0t-16 0Z"/></>}
      {name === "announcement" && <><path fill="#bedfeb" d="m5 18 24-5v21L5 29Z"/><path fill="#f7c6ab" d="m29 13 10-7v35l-10-7Z"/><path fill="#c6c4ec" d="m10 30 3 13h8l-3-11Z"/><path d="M43 17h3m-3 13h3"/></>}
      {name === "survey" && <><path fill="#eee5f8" d="M9 5h30v38H9Z"/><path d="M15 13h18m-10 9h10m-10 10h10"/><circle cx="16" cy="22" r="2.5" fill="#a8d5c4"/><circle cx="16" cy="32" r="2.5" fill="#ffda95"/></>}
      {name === "plus" && <><rect x="6" y="6" width="36" height="36" rx="13" fill="#c9e8d9"/><path d="M24 15v18m-9-9h18"/></>}
      {name === "play" && <path fill="currentColor" stroke="currentColor" d="m17 10 23 14-23 14Z"/>}
      {name === "pause" && <g stroke="currentColor" strokeWidth="6"><path d="M17 12v24m14-24v24"/></g>}
      {name === "arrow" && <path stroke="currentColor" strokeWidth="3" d="M9 24h29M26 12l12 12-12 12"/>}
      {name === "back" && <path stroke="currentColor" strokeWidth="3" d="M39 24H10m12-12L10 24l12 12"/>}
      {name === "check" && <><circle fill="#c9e8d9" cx="24" cy="24" r="19"/><path d="m14 24 7 7 14-15"/></>}
      {name === "upload" && <><path fill="#d7e9f9" d="M9 28v13h30V28"/><path d="M24 32V7m-9 9 9-9 9 9"/></>}
      {name === "download" && <><path fill="#d7e9f9" d="M9 30v11h30V30"/><path d="M24 6v25m-9-9 9 9 9-9"/></>}
      {name === "search" && <><circle cx="21" cy="20" r="13" fill="#d8ecf3"/><path d="m31 30 11 12M14 18q1-5 6-5"/></>}
      {name === "close" && <path stroke="currentColor" d="m13 13 22 22m0-22L13 35"/>}
      {name === "exit" && <><rect x="6" y="6" width="24" height="36" rx="6" fill="#f7d5b0"/><path fill="#fff5e7" d="M12 12h12v24H12Z"/><circle cx="20" cy="25" r="1" fill="#28584f" stroke="none"/><g className="exit-arrow"><path d="M28 24h15m-6-6 6 6-6 6" stroke="#975743" strokeWidth="3"/></g><path d="M5 42h28"/></>}
    </g>
  </svg>;
}
