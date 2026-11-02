export function BrandMark({ className = "" }: { className?: string }) {
  return <svg className={`brand-emblem ${className}`} width="52" height="52" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
    <rect x="1" y="1" width="62" height="62" rx="21" fill="#eaf3e9"/>
    <path d="M12 32q10-5 20 2 10-7 20-2v18q-10-4-20 3-10-7-20-3Z" fill="#fdf8e8" stroke="#397f6d" strokeWidth="2.6" strokeLinejoin="round"/>
    <path d="M32 35v17M18 39q5-1 9 2m10 0q4-3 9-2" stroke="#a8c4a3" strokeWidth="2" strokeLinecap="round"/>
    <path d="M32 32S17 24 17 17c0-8 12-9 15-1 3-8 15-7 15 1 0 7-15 15-15 15Z" fill="#e9aa92"/>
    <circle cx="23" cy="20" r="6" fill="#f8d58f"/><circle cx="41" cy="20" r="6" fill="#9ac7ac"/>
    <path d="M21 20v.3m4-.3v.3m14-.3v.3m4-.3v.3M21 24q2 2 4 0m14 0q2 2 4 0" stroke="#466a53" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="m17 29 6-2 9 6 9-6 6 2" stroke="#397f6d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return <span className={`brand-logo ${compact ? "brand-logo-compact" : ""}`}><BrandMark/><span className="brand-wordmark">svil<span className="brand-period">.</span><span className="brand-tagline">belajar dengan hati</span></span></span>;
}
