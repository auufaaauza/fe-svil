"use client";
import { apiRequest } from "./api";
import { useSession } from "../components/session-provider";

export type TeacherQuestion = {
  type: "choice" | "text"; prompt: string; options: string[];
  correctIndex?: number | null; modelAnswer?: string; explanation?: string; hasKey?: boolean; visualTopic?: number | null;
};
export type TeacherMaterial = {
  id: string; title: string; content: string; topic: number | null; topicLabel?: string | null; courseLessonId?: number | null; courseId?: number | null;
  videoId?:string|null; youtubeUrl?:string; videoCaption?:string|null; audioUrl?:string|null;
  image: string; imageAlt: string; question: TeacherQuestion | null;
  status: "draft" | "published"; updatedAt: string; classroomId: number; version: number;
  kind: "material" | "quiz"; subject?: string; uploadedBy?: { id: number; name: string }; updatedBy?: { id: number; name: string } | null;
  canEdit?: boolean; attachment?: { name: string; size: number; url: string; mime?: string; previewUrl?: string | null; slidesUrl?: string | null } | null;
};
export function useMaterials() { return useSession().materials; }

export async function saveMaterial(material: TeacherMaterial, attachment?: File, removeAttachment = false): Promise<{ ok: boolean; message: string; material?: TeacherMaterial }> {
  const body = new FormData();
  body.set("title", material.title); body.set("content", material.content);
  body.set("topic", material.topic === null ? "" : String(material.topic)); body.set("status", material.status);
  body.set("classroom_id", String(material.classroomId)); body.set("image_alt", material.imageAlt);
  body.set("question", JSON.stringify(material.question));
  body.set("topic_label", material.topic === null ? material.topicLabel || "" : ""); body.set("course_lesson_id", material.courseLessonId ? String(material.courseLessonId) : "");
  body.set("youtube_url",material.youtubeUrl??material.videoId??""); body.set("video_caption",material.videoCaption??""); body.set("audio_url",material.audioUrl??"");
  body.set("kind", material.kind); body.set("subject", material.subject || "IPAS");
  if (attachment) body.set("attachment", attachment);
  if (removeAttachment) body.set("remove_attachment", "1");
  if (material.id) { body.set("_method", "PUT"); body.set("version", String(material.version)); }
  if (!material.image) body.set("remove_image", "1");
  if (material.image.startsWith("data:image/")) {
    const response = await fetch(material.image);
    const blob = await response.blob();
    const extension = blob.type === "image/jpeg" ? "jpg" : blob.type === "image/webp" ? "webp" : "png";
    body.set("image", blob, "material."+extension);
  }
  try {
    const result = await apiRequest<{ data: TeacherMaterial }>(material.id ? "/materials/"+material.id : "/materials", { method: "POST", body, successMessage: material.status === "published" ? "Materi berhasil diterbitkan untuk kelas yang dipilih." : "Draf materi berhasil disimpan.", notifyError: true });
    return { ok: true, material: result.data, message: material.status === "published" ? "Materi terbit dan tersedia untuk siswa di kelas yang dipilih." : "Draf tersimpan di server. Siswa belum dapat melihatnya." };
  } catch (cause) {
    return { ok: false, message: cause instanceof Error ? cause.message : "Materi belum tersimpan. Coba lagi." };
  }
}
