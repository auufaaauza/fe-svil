"use client";

import { useRef, useState } from "react";
import { useSession } from "./session-provider";
import { useApiRows, AsyncState } from "./lms-shared";
import { FriendlyIcon } from "./friendly-icon";
import { WordwallGradePanel, type WordwallGrade } from "./wordwall-grades";

type LearningGame={id:string;topic:number;title:string;activity:string;url:string;embed_url:string};

export function WordwallGames({topic}:{topic?:number}) {
  const {activeClass,user}=useSession();
  const allowed=user?.canUseSvil!==false;
  const list=useApiRows<LearningGame>(activeClass&&allowed?"/learning-games?classroom_id="+activeClass:null);
  const grades=useApiRows<WordwallGrade>(activeClass&&allowed?"/wordwall-grades?classroom_id="+activeClass:null);
  const games=list.rows.filter(game=>topic===undefined||game.topic===topic);
  if(!activeClass||!allowed)return null;
  return <section className="panel wordwall-games"><div className="section-heading"><div><p className="eyebrow">KUIS DAN GAME</p><h2>Latihan seru dari LKPD</h2><p>Amati pertanyaan, lalu mainkan game sesuai materi yang kamu pelajari.</p></div><FriendlyIcon name="edit" size={38}/></div><AsyncState loading={list.loading||grades.loading} error={list.error||grades.error} retry={()=>{list.reload();grades.reload();}}/><div className="wordwall-game-list">{games.map(game=><GameCard key={game.id} game={game} grades={grades.rows} onSaved={()=>grades.reload()}/>)}</div><p className="helper">Setelah bermain, guru mencatat nilai Wordwall ke buku nilai SVIL. Nilai kuis dan nilai LKPD dilaporkan terpisah.</p></section>;
}

function GameCard({game,grades,onSaved}:{game:LearningGame;grades:WordwallGrade[];onSaved:()=>Promise<unknown>}) {
  const [opened,setOpened]=useState(false),[failed,setFailed]=useState(false),[fullscreenError,setFullscreenError]=useState(false);
  const stage=useRef<HTMLDivElement>(null);
  const safe=/^https:\/\/wordwall\.net\/(?:id\/)?embed\/[a-f0-9]{32}\?/.test(game.embed_url);
  const fullscreen=async()=>{try{setFullscreenError(false);await stage.current?.requestFullscreen();}catch{setFullscreenError(true);}};
  return <article className="wordwall-game-card"><div className="section-heading"><div><span className="soft-badge">LKPD {game.topic+1} · {game.activity}</span><h3>{game.title}</h3></div></div>{opened&&safe?<div className="wordwall-game-stage" ref={stage}><iframe src={game.embed_url} title={"Game "+game.title} loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" onError={()=>setFailed(true)}/></div>:<button className="button primary" type="button" disabled={!safe} onClick={()=>setOpened(true)}><FriendlyIcon name="play" size={24}/>Mainkan kuis di sini</button>}{opened&&<div className="inline-actions"><button type="button" className="button secondary" onClick={fullscreen}>Layar penuh</button><button type="button" className="text-button" onClick={()=>setOpened(false)}>Tutup game</button></div>}{fullscreenError&&<p className="helper" role="status">Layar penuh belum tersedia di perangkat ini. Game tetap bisa dimainkan pada halaman.</p>}{failed&&<p className="form-error" role="alert">Game belum termuat. Periksa koneksi atau gunakan tautan sumber.</p>}<WordwallGradePanel gameId={game.id} grades={grades} onSaved={onSaved}/><details className="video-alternative"><summary>Game tidak bisa dibuka?</summary><a className="text-button" href={game.url} target="_blank" rel="noopener noreferrer">Buka game di Wordwall</a></details></article>;
}
