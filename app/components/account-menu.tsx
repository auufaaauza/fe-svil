"use client";

import { useRef } from "react";
import { BrandMark } from "./brand-logo";
import { FriendlyIcon } from "./friendly-icon";
import { useSession } from "./session-provider";

export function AccountMenu({ disabled, onClassChange, onError, beforeLeave }: { disabled?: boolean; onClassChange: () => void; onError: (message: string) => void; beforeLeave?: () => Promise<boolean> }) {
  const { user, classrooms, activeClass, setActiveClass, logout } = useSession();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = () => { dialog.current?.close(); trigger.current?.focus(); };
  return <><button ref={trigger} className="mobile-account-trigger" type="button" aria-haspopup="dialog" aria-controls="account-dialog" disabled={disabled} onClick={() => dialog.current?.showModal()}><span className="account-initial">{user?.name.slice(0,1).toUpperCase()}</span><span>Akun</span></button>
    <dialog ref={dialog} id="account-dialog" className="theme-dialog account-dialog" aria-labelledby="account-title" onClick={e => { if (e.target === e.currentTarget) close(); }}><div className="dialog-surface"><div className="dialog-heading"><div className="dialog-title"><BrandMark/><h2 id="account-title">Ruang akunmu</h2></div><button type="button" className="icon-button" onClick={close} aria-label="Tutup akun"><FriendlyIcon name="close" size={22}/></button></div><div className="account-details"><strong>{user?.name}</strong><span>{user?.role === "student" ? "Siswa" : user?.role === "teacher" ? "Guru" : "Admin"}{user?.schoolName ? ` · ${user.schoolName}` : ""}</span></div>
    {classrooms.length > 0 && <><p className="field-label">Kelas belajarmu</p><div className="picker-options">{classrooms.map(c => <button key={c.id} type="button" className={`picker-option ${activeClass === c.id ? "selected" : ""}`} onClick={async () => { if (beforeLeave && !await beforeLeave()) { close(); return; } setActiveClass(c.id); onClassChange(); close(); }}><span><strong>{c.name}</strong><small>{c.schoolName} · {c.academicYear}</small></span>{activeClass === c.id && <FriendlyIcon name="check" size={27}/>}</button>)}</div></>}
    <button type="button" className="button account-logout full-width" onClick={async () => { try { if (beforeLeave && !await beforeLeave()) { close(); return; } await logout(); close(); } catch (cause) { close(); onError(cause instanceof Error ? cause.message : "Belum berhasil keluar."); } }}>Keluar dari akun <FriendlyIcon name="back" size={22}/></button></div></dialog>
  </>;
}
