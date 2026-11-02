import type { CSSProperties } from "react";

export type IconName = "home" | "compass" | "book" | "heart" | "sprout" | "people" | "edit" | "chart" | "school" | "plus" | "play" | "pause" | "arrow" | "back" | "check" | "upload" | "search" | "close";

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
      {name === "plus" && <><rect x="6" y="6" width="36" height="36" rx="13" fill="#c9e8d9"/><path d="M24 15v18m-9-9h18"/></>}
      {name === "play" && <path fill="currentColor" stroke="currentColor" d="m17 10 23 14-23 14Z"/>}
      {name === "pause" && <g stroke="currentColor" strokeWidth="6"><path d="M17 12v24m14-24v24"/></g>}
      {name === "arrow" && <path stroke="currentColor" strokeWidth="3" d="M9 24h29M26 12l12 12-12 12"/>}
      {name === "back" && <path stroke="currentColor" strokeWidth="3" d="M39 24H10m12-12L10 24l12 12"/>}
      {name === "check" && <><circle fill="#c9e8d9" cx="24" cy="24" r="19"/><path d="m14 24 7 7 14-15"/></>}
      {name === "upload" && <><path fill="#d7e9f9" d="M9 28v13h30V28"/><path d="M24 32V7m-9 9 9-9 9 9"/></>}
      {name === "search" && <><circle cx="21" cy="20" r="13" fill="#d8ecf3"/><path d="m31 30 11 12M14 18q1-5 6-5"/></>}
      {name === "close" && <path stroke="currentColor" d="m13 13 22 22m0-22L13 35"/>}
    </g>
  </svg>;
}
