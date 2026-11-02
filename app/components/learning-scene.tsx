"use client";

import { useEffect, useId, useRef, useState } from "react";
import { FriendlyIcon } from "./friendly-icon";

const stories = [
  [
    ["Baca peta bersama", "Nara menunjuk peta. Rara mendengarkan. Kita bisa belajar dari ide teman."],
    ["Laut menghubungkan kita", "Perahu membawa orang dan kebutuhan antarpulau. Laut membantu kehidupan warga."],
    ["Jaga laut tetap bersih", "Sampah dibawa ke tempatnya dengan pendampingan guru. Laut bersih, ikan pun sehat."],
  ],
  [
    ["Hutan adalah rumah", "Pohon menjadi tempat tinggal burung dan membantu menjaga air. Yuk, cari tahu bersama."],
    ["Rawat dengan penuh perhatian", "Nara menyiram secukupnya. Rara membantu merawat tanaman. Tugas kecil bisa dibagi."],
    ["Tumbuh karena kita peduli", "Tanaman tumbuh saat dirawat. Hemat air dan kertas juga cara menyayangi hutan."],
  ],
  [
    ["Terima kasih, petani", "Petani merawat padi agar kita punya pangan. Mari menghargai kerja kerasnya."],
    ["Terima kasih, nelayan", "Nelayan mencari ikan dengan memperhatikan alam. Laut yang sehat mendukung kehidupan."],
    ["Hargai setiap hasilnya", "Nara dan Rara berbagi hasil bumi. Ambil makanan secukupnya dan jangan membuangnya."],
  ],
  [
    ["Rencanakan aksi bersama", "Dengarkan usul semua anggota. Pilih satu aksi aman dan bagikan tugas dengan adil."],
    ["Mulai dari lingkungan kita", "Nara merawat tanaman. Rara memilah sampah aman. Guru mendampingi kegiatan mereka."],
    ["Ceritakan hasil dan perasaanmu", "Apa yang sudah berhasil? Apa yang sulit? Ceritamu membantu kita menjadi lebih peduli."],
  ],
];

function Heart({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}><path className="scene-heart" d="M0 6C-14-6-15-17-7-19c4-1 6 1 7 4 1-3 3-5 7-4C15-17 14-6 0 6" fill="#ee9da5"/></g>;
}

/** The outer group positions a character; inner groups animate without moving that placement. */
function Child({ x, y, girl = false, task = "wave", scale = 1 }: { x: number; y: number; girl?: boolean; task?: "wave" | "water" | "hold"; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ellipse cy="117" rx="40" ry="7" fill="#234f3c" opacity=".08"/>
    <g className="scene-child">
      <path d="m-20 77-3 33m43-33 3 33" stroke="#456570" strokeWidth="16" strokeLinecap="round"/>
      <path d="M-31 111h18m26 0h18" stroke="#305253" strokeWidth="12" strokeLinecap="round"/>
      <path d="M-28 36Q0 20 28 36l5 44h-66Z" fill={girl ? "#e9ba72" : "#83b9ac"}/>
      <path d="M-4 40v30m-8-24h-9" stroke={girl ? "#cc9a58" : "#659d90"} strokeWidth="2"/>
      <circle cy="-1" r="32" fill={girl ? "#e8b7a0" : "#edbf95"}/>
      {girl ? <path d="M-35 0q-2-43 35-43T35 0l5 43Q19 42 0 28q-19 14-40 15Zm9-7q0 27 26 28T26-7Q11-30-6-25-18-21-26-7" fill="#e6a4a3" fillRule="evenodd"/> : <><path d="M-31-8q-5-37 31-37t31 37Q20-18 14-28-3-10-31-8" fill="#594d48"/><path d="M-29-34v-16q29-12 58 0v16Z" fill="#38665f"/><path d="M-27-38h54" stroke="#639185" strokeWidth="2"/></>}
      <g className="scene-eyes"><ellipse cx="-11" cy="0" rx="2.6" ry="3.5" fill="#4e4640"/><ellipse cx="11" cy="0" rx="2.6" ry="3.5" fill="#4e4640"/></g>
      <ellipse cx="-20" cy="10" rx="6" ry="3.5" fill="#e79d91" opacity=".65"/><ellipse cx="20" cy="10" rx="6" ry="3.5" fill="#e79d91" opacity=".65"/>
      <path d="M-6 10q6 7 12 0" stroke="#a15c50" strokeWidth="2.3" fill="none" strokeLinecap="round"/>
      <path d="M-27 43q-11 9-12 22" stroke={girl ? "#e9ba72" : "#83b9ac"} strokeWidth="15" strokeLinecap="round"/><circle cx="-39" cy="69" r="7" fill="#edbf95"/>
      <g className={task === "wave" ? "scene-wave-hand" : task === "water" ? "scene-watering-hand" : ""}>
        <path d={task === "wave" ? "M28 43q19-1 19-24" : "M28 43q15 16 28 11"} stroke={girl ? "#e9ba72" : "#83b9ac"} strokeWidth="15" strokeLinecap="round"/>
        <circle cx={task === "wave" ? 47 : 57} cy={task === "wave" ? 16 : 53} r="7" fill="#edbf95"/>
        {task === "water" && <g transform="translate(44 50)"><path d="M0 0h24v23H0Zm24 6 21-13 3 7-24 17" fill="#9ebfdb" stroke="#648ca8" strokeWidth="2"/><path d="M4 0V-7q9-10 16 0v7" fill="none" stroke="#648ca8" strokeWidth="3"/></g>}
      </g>
    </g>
  </g>;
}

function Tree({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}><path d="M0 30v100" stroke="#b78c69" strokeWidth="13" strokeLinecap="round"/><g className="scene-leaves"><circle cx="-27" cy="24" r="35" fill="#8bc7a1"/><circle cx="25" cy="14" r="40" fill="#a5d2a2"/><circle cy="-13" r="39" fill="#7bb997"/><path d="M-17-10q16-12 32-1" stroke="#a3d4b1" strokeWidth="5" fill="none" strokeLinecap="round"/></g></g>;
}

function Worker({ x, y, fisher = false, scale = 1 }: { x: number; y: number; fisher?: boolean; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path d="m-15 51-5 52m37-52 5 52" stroke="#6f8171" strokeWidth="17" strokeLinecap="round"/>
    <path d="M-26 103h14m27 0h14" stroke="#596c5a" strokeWidth="10" strokeLinecap="round"/>
    <path d="M-29-2Q0-16 29-2l7 64h-72Z" fill={fisher ? "#d6a380" : "#90ae7b"}/>
    <path d="M-28 4q-12 7-15 27m72-27q10 7 15 22" stroke={fisher ? "#d6a380" : "#90ae7b"} strokeWidth="15" strokeLinecap="round"/>
    <path d="M-43 30h-1m88-3h1" stroke="#cfa482" strokeWidth="12" strokeLinecap="round"/>
    <ellipse cy="-29" rx="27" ry="30" fill="#d4a483"/>
    <path d="M-38-48 0-80l39 32q-39 16-77 0Z" fill="#e3c389" stroke="#c6a365" strokeWidth="2"/>
    <path d="m-20-50 20-20 20 20" fill="none" stroke="#d2b077" strokeWidth="2"/>
    <g className="scene-eyes"><path d="M-10-28v2m20-2v2" stroke="#624e41" strokeWidth="3" strokeLinecap="round"/></g>
    <path d="M-7-16q7 5 14 0" stroke="#9d6951" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    {fisher ? <path d="M44 29 70-35q20-14 36 0v87" stroke="#806e53" strokeWidth="2" fill="none"/> : <g className="scene-rice"><path d="M-43 35V-6m0 23-14-13m14 2 14-15" stroke="#64884d" strokeWidth="3"/><ellipse cx="-36" cy="-6" rx="5" ry="12" fill="#e4bd69" transform="rotate(25 -36 -6)"/></g>}
  </g>;
}

export function LearningScene({ topic = 3, step = 1, compact = false }: { topic?: number; step?: number; compact?: boolean }) {
  const id = useId();
  const sceneRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const node = sceneRef.current;
    if (!node || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => node.classList.toggle("scene-visible", entry.isIntersecting), { rootMargin: "40px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const water = topic === 0 || (topic === 2 && step === 1);
  return <svg ref={sceneRef} className={`learning-scene scene-topic-${topic} ${compact ? "compact-scene" : ""}`} viewBox="0 0 600 340" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
    <title id={`${id}-title`}>{stories[topic][step][0]}</title><desc id={`${id}-desc`}>{stories[topic][step][1]} Ilustrasi kartun bergerak.</desc>
    <defs><linearGradient id={`${id}-sky`} x2="0" y2="1"><stop stopColor={topic === 3 ? "#f0e9fb" : "#e8f4ed"}/><stop offset="1" stopColor={water ? "#dceef4" : "#f8f9e9"}/></linearGradient></defs>
    <rect width="600" height="340" rx="26" fill={`url(#${id}-sky)`}/>
    <g className="scene-sun"><circle cx="491" cy="60" r="26" fill="#f9d386"/><path d="M482 59v2m18-2v2m-15 8q6 5 12 0" stroke="#c39a56" strokeWidth="2.4" fill="none" strokeLinecap="round"/></g>
    <g className="scene-cloud" fill="white" opacity=".85"><path d="M65 67q-5-19 14-22 7-27 28-13 19-11 26 10 23-1 20 25Z"/><path d="M340 59q-3-11 10-12 5-18 19-10 17-5 19 10 15 0 15 12Z"/></g>
    <path d="M0 220q89-66 192-11 70-80 162-23 98-71 246 20v134H0Z" fill={water ? "#b2d9cb" : "#c6dfaf"}/>
    <path d="M0 258q144-49 303-9 146-55 297-5v96H0Z" fill={water ? "#9acdd6" : "#b2cf9c"}/>
    {water ? <>
      <g className="scene-boat" transform="translate(340 164)">{topic === 2 && <Worker x={75} y={-10} fisher scale={.45}/>}<path d="M-10 36h125l-18 30H14Z" fill="#dca57d"/><path d="M40 33V-26h7v59" fill="#b68c6b"/><path d="M51-25V28h47Z" fill="#fff9e8"/><path d="M36-13 0 26h36Z" fill="#edd08b"/><path d="M13 45h88" stroke="#bd8866" strokeWidth="4"/></g>
      <g className="scene-water-lines" stroke="#d6edf0" strokeWidth="4" strokeLinecap="round"><path d="M10 281h89m34 20h56m116-25h72m53 27h70m26-29h40"/><path d="M222 320h58m198 5h91"/></g>
      <path d="M0 270q87-36 193 15l30 55H0Z" fill="#f0d9aa"/>
      <Child x={75} y={210} scale={.68} task="hold"/><Child x={190} y={211} scale={.68} girl task={step === 2 ? "hold" : "wave"}/>
      {topic === 0 && step === 0 && <g transform="translate(92 226) rotate(-4)"><path d="m0 0 24-6 23 6 23-6v44l-23 6-23-6-24 6Z" fill="#fff7da" stroke="#bcab7d" strokeWidth="2"/><path d="m8 12 9 7 2 12m12-21 9 10 7-3 13 9" stroke="#9dc9ab" strokeWidth="7" fill="none"/><path d="M24-6v44m23-38v44" stroke="#e3d6aa" strokeWidth="2"/></g>}
      {step === 2 && <g transform="translate(255 247)"><path d="m0 0 5 54h39l5-54Z" fill="#83b7a3"/><path d="M-4 0h57m-38-6h20" stroke="#5f9985" strokeWidth="6" strokeLinecap="round"/><path d="m17 17 6-5 6 5m0 10-6 5-6-5" stroke="#eff8ed" strokeWidth="3"/><g className="scene-litter"><path d="m-33-18 16 6-4 14-16-6Z" fill="#edc58e"/></g></g>}
      <g className="scene-fish" transform="translate(385 303)"><ellipse rx="17" ry="9" fill="#f4ca83"/><path d="m15 0 12-9v18Z" fill="#f4ca83"/><circle cx="-9" cy="-2" r="2" fill="#715943"/></g>
    </> : topic === 2 ? <>
      <Tree x={79} y={151} scale={.55}/><path d="M0 301q170-40 315 0m-290 28q170-40 315 0" stroke="#8db47f" strokeWidth="6" fill="none"/>
      {[40,80,120,160,200].map(x => <g key={x} className="scene-rice" transform={`translate(${x} 295)`}><path d="M0 0v-46m0 28-11-14M0-28l12-13" stroke="#6b9e70" strokeWidth="3"/><ellipse cx="7" cy="-43" rx="5" ry="11" fill="#e6c579" transform="rotate(30 7 -43)"/></g>)}
      {step === 0 && <Worker x={213} y={201} scale={.8}/>}<Child x={330} y={171} scale={.85} task="hold"/><Child x={464} y={174} girl scale={.85} task="hold"/>
      <g transform="translate(347 235)"><path d="M0 0h111l-12 37H13Z" fill="#cc9b72"/><path d="M12 8h85m-81 10h73M26 0l8 37M55 0v37M83 0l-8 37" stroke="#b38562" strokeWidth="3"/><g className="scene-harvest"><circle cx="30" cy="-7" r="14" fill="#e6a06d"/><path d="m55-18 14 6-5 21-12-6Z" fill="#e8c777"/><path d="M72-10q0-30 16-20 18 7-3 32" fill="#9abd79"/><path d="m26-18 5-11 5 11" fill="#81a471"/></g></g>
      <Heart x={402} y={106} scale={.9}/>
    </> : <>
      <Tree x={85} y={117} scale={1.05}/><Tree x={510} y={164} scale={.65}/>
      <path d="M150 340q40-72 143-73 73-1 98 73" fill="#e4d4af"/>
      <Child x={215} y={171} scale={.9} task={(topic === 1 && step !== 0) || step === 1 ? "water" : "wave"}/><Child x={400} y={178} scale={.85} girl task="hold"/>
      {(topic === 1 || step === 1) && <g transform="translate(316 268)"><ellipse rx="28" ry="8" fill="#bb997a"/><g className={step === 2 ? "scene-growing-plant" : ""}><path d="M0 0v-43" stroke="#639e71" strokeWidth="5" strokeLinecap="round"/><path d="M0-18C-28-12-30-42-24-42-8-43 0-30 0-18" fill="#94bd79"/><path d="M0-32C-5-62 29-63 28-57 27-39 12-29 0-32" fill="#6aa87d"/></g><g className="scene-drops" fill="#71b2ce"><ellipse cx="-13" cy="-64" rx="2" ry="5"/><ellipse cx="-4" cy="-59" rx="2" ry="5"/><ellipse cx="-20" cy="-70" rx="2" ry="5"/></g></g>}
      {topic === 3 && step !== 1 && <g transform="translate(270 205) rotate(-5)"><rect width="88" height="80" rx="5" fill="#fff9e7" stroke="#d7b78c" strokeWidth="3"/><path d="M12 17h63m-63 49h41" stroke="#c7d7bf" strokeWidth="5" strokeLinecap="round"/><Heart x={44} y={44} scale={.65}/></g>}
      {topic === 3 && step === 1 && <g transform="translate(430 250)"><path d="m0 0 4 43h31l4-43Z" fill="#a89aca"/><path d="M-3 0h45" stroke="#8d7caf" strokeWidth="5" strokeLinecap="round"/><path d="m15 14 5-4 5 4m0 8-5 4-5-4" stroke="white" strokeWidth="3"/><g className="scene-litter"><path d="m-10-18 9 2-2 13-9-2Z" fill="#e6bc86"/></g></g>}
      <Heart x={316} y={120} scale={topic === 1 ? .8 : 1.1}/>
      <g className="scene-bird" transform="translate(144 76)"><path d="M0 0q8-13 16 0 8-13 16 0" stroke="#75a69c" strokeWidth="3" strokeLinecap="round" fill="none"/></g>
    </>}
    <g fill="#fff9d9"><circle cx="32" cy="151" r="3"/><circle cx="557" cy="126" r="4"/><circle cx="284" cy="44" r="3"/></g>
  </svg>;
}

export function ScenePlayer({ topic, compact = false }: { topic: number; compact?: boolean }) {
  const [step, setStep] = useState(0);
  return <figure className={`scene-player ${compact ? "scene-player-small" : ""}`}>
    <div className="scene-visual"><LearningScene topic={topic} step={step}/><span className="scene-label">Cerita nilai cinta</span></div>
    <figcaption><div className="story-heading"><span className="story-number">0{step+1}</span><h3>{stories[topic][step][0]}</h3></div><p aria-live="polite">{stories[topic][step][1]}</p></figcaption>
    <div className="story-controls"><div className="story-dots" aria-label="Pilih bagian cerita">{stories[topic].map((s,i) => <button type="button" key={s[0]} aria-label={`Bagian ${i+1}: ${s[0]}`} aria-pressed={i === step} onClick={() => setStep(i)}><span className={step === i ? "current" : ""}/></button>)}</div><button type="button" className="text-button" onClick={() => setStep((step+1)%3)}>{step === 2 ? "Ulangi cerita" : "Lanjut cerita"}<FriendlyIcon name="arrow" size={20}/></button></div>
  </figure>;
}
