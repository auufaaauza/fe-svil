"use client";

import { LearningScene } from "./learning-scene";
import { FriendlyIcon } from "./friendly-icon";

const guidance = [
  { title: "Lihat dan amati", text: "Perhatikan tempat, orang, dan kegiatan dalam gambar. Apa yang kamu lihat?", icon: "observation" as const },
  { title: "Cari hubungan di sekitarmu", text: "Gunakan gambar untuk mengingat topiknya. Lalu cari fakta dari materi dan sumbermu.", icon: "book" as const },
  { title: "Pikirkan pilihanmu", text: "Bayangkan dampaknya bagi orang lain dan alam. Jelaskan alasanmu dengan bahasamu sendiri.", icon: "think" as const },
  { title: "Dengarkan suara hatimu", text: "Bayangkan kamu ada di sana. Apa yang kamu rasakan? Ceritamu boleh berbeda dari teman.", icon: "heart" as const },
  { title: "Mulai dari satu tindakan", text: "Perhatikan cara mereka saling membantu. Pilih tindakan aman yang bisa kamu lakukan bersama guru.", icon: "sprout" as const },
];

export function QuestionVisual({ topic, phase = 2 }: { topic: number; phase?: number }) {
  const guide = guidance[phase] ?? guidance[2];
  return <figure className="question-visual"><div className="question-scene"><LearningScene topic={topic} step={[0,0,1,2,1][phase] ?? 1}/></div><figcaption><span className="question-guide-icon"><FriendlyIcon name={guide.icon} size={28}/></span><div><strong>{guide.title}</strong><p>{guide.text}</p></div></figcaption></figure>;
}
