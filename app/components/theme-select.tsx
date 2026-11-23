"use client";

import { useId, useRef, useState } from "react";
import { FriendlyIcon } from "./friendly-icon";

export type SelectOption = { value: string; label: string; description?: string };

/** A themed modal picker. Native dialog provides focus containment, Escape and an inert background. */
export function ThemeSelect({ id, label, value, options, onChange, placeholder = "Pilih salah satu", disabled = false, required = false }: {
  id?: string; label: string; value: string | number; options: SelectOption[];
  onChange: (value: string) => void; placeholder?: string; disabled?: boolean; required?: boolean;
}) {
  const generatedId = useId();
  const dialogId = `${id ?? generatedId}-picker`;
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const validation = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const selected = options.find(o => o.value === String(value));
  const visible = options.filter(o => `${o.label} ${o.description ?? ""}`.toLocaleLowerCase("id").includes(search.toLocaleLowerCase("id")));
  const open = () => { if (!disabled) { setSearch(""); dialog.current?.showModal(); } };
  const close = () => { dialog.current?.close(); trigger.current?.focus(); };
  const choose = (next: string) => { onChange(next); validation.current?.setCustomValidity(""); close(); };
  return <div className="theme-select">
    <button ref={trigger} id={id} type="button" className={`select-trigger ${selected ? "has-value" : ""}`} aria-label={label} aria-haspopup="dialog" aria-controls={dialogId} disabled={disabled} onClick={open}>
      <span>{selected?.label || placeholder}</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
    </button>
    {required && <input ref={validation} className="select-validation" aria-label={label} tabIndex={-1} required disabled={disabled} value={selected?.value ?? ""} onChange={() => {}} onInvalid={event => { event.preventDefault(); open(); }} />}
    <dialog ref={dialog} id={dialogId} className="theme-dialog select-dialog" aria-labelledby={`${dialogId}-heading`} onClick={event => { if (event.target === event.currentTarget) close(); }}>
      <div className="dialog-surface"><div className="dialog-heading"><div className="dialog-title"><span className="dialog-symbol"><FriendlyIcon name="select" size={30}/></span><div><p className="eyebrow">PILIHANMU</p><h2 id={`${dialogId}-heading`}>{label}</h2></div></div><button type="button" className="icon-button" onClick={close} aria-label="Tutup pilihan"><FriendlyIcon name="close" size={22}/></button></div>
      {options.length > 6 && <div className="picker-search"><FriendlyIcon name="search" size={23}/><input aria-label={`Cari ${label.toLowerCase()}`} value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === "Enter") e.preventDefault(); }} placeholder="Cari pilihan…"/></div>}
      <div ref={list} className="picker-options" role="listbox" aria-label={label} onKeyDown={event => {
        const buttons = Array.from(list.current?.querySelectorAll<HTMLButtonElement>("[role=option]") ?? []);
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        let target = index;
        if (event.key === "ArrowDown") target = Math.min(index+1, buttons.length-1);
        else if (event.key === "ArrowUp") target = Math.max(index-1, 0);
        else if (event.key === "Home") target = 0;
        else if (event.key === "End") target = buttons.length-1;
        else return;
        event.preventDefault(); buttons[target]?.focus();
      }}>{visible.map(option => <button type="button" role="option" aria-selected={String(value) === option.value} className={`picker-option ${String(value) === option.value ? "selected" : ""}`} key={option.value} onClick={() => choose(option.value)}><span><strong>{option.label}</strong>{option.description && <small>{option.description}</small>}</span><span className="picker-check">{String(value) === option.value ? <FriendlyIcon name="check" size={25}/> : <span className="choice-circle"/>}</span></button>)}{!visible.length && <p className="picker-empty">Belum ada pilihan yang cocok.</p>}</div>
      <p className="dialog-hint">Pilih yang kamu perlukan, lalu lanjutkan.</p></div>
    </dialog>
  </div>;
}
