"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { apiRequest, ApiError, initializeCsrf, loadPages } from "../lib/api";
import type { TeacherMaterial } from "../lib/material-store";

export type Account = { id: number; name: string; username: string; email: string; role: "student" | "teacher" | "admin"; schoolId: number | null; schoolName: string | null; canUseSvil?: boolean };
export type Classroom = { id: number; name: string; schoolId: number; schoolName: string; academicYear: string; joinCode?: string };
export type RegistrationFields = { name: string; username: string; email: string; password: string; password_confirmation: string; class_code: string };
export type LearningNote = { id: number; classroom_id: number; student_id: number; topic: number; phase: number; content: string; feedback: string | null; reviewed_at: string | null };
type Session = {
  user: Account | null; loading: boolean; error: string; materials: TeacherMaterial[]; classrooms: Classroom[]; notes: LearningNote[];
  activeClass: number | null; setActiveClass: (id: number) => void;
  login: (identifier: string, password: string) => Promise<void>; register: (fields: RegistrationFields) => Promise<void>; logout: () => Promise<void>; refresh: () => Promise<void>;
};
const Context = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [materials, setMaterials] = useState<TeacherMaterial[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [notes, setNotes] = useState<LearningNote[]>([]);
  const [activeClass, setActiveClass] = useState<number | null>(null);
  const generation = useRef(0);

  const clear = useCallback(() => {
    generation.current++;
    setUser(null); setMaterials([]); setClassrooms([]); setNotes([]); setActiveClass(null);
  }, []);
  const refresh = useCallback(async () => {
    const current = ++generation.current;
    const [materialData, classData, noteData, profile] = await Promise.all([
      loadPages<TeacherMaterial>("/materials"), loadPages<Classroom>("/classrooms"), loadPages<LearningNote>("/notes"), apiRequest<{data:Account}>("/me"),
    ]);
    if (current !== generation.current) return;
    setUser(profile.data); setMaterials(materialData); setClassrooms(classData); setNotes(noteData);
    setActiveClass(previous => classData.some(c => c.id === previous) ? previous : classData[0]?.id ?? null);
    setError("");
  }, []);

  useEffect(() => {
    let alive = true;
    const expired = () => { clear(); setError("Silakan masuk untuk melanjutkan."); };
    window.addEventListener("svil-session-expired", expired);
    apiRequest<{ data: Account }>("/me").then(async response => {
      if (!alive) return;
      setUser(response.data);
      await refresh();
    }).catch(cause => {
      if (alive && (!(cause instanceof ApiError) || cause.status !== 401)) setError(cause.message || "Gagal memuat sesi.");
    }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; generation.current++; window.removeEventListener("svil-session-expired", expired); };
  }, [clear, refresh]);

  const login = async (identifier: string, password: string) => {
    await initializeCsrf();
    const result = await apiRequest<{ data: Account }>("/auth/login", { method: "POST", body: JSON.stringify({ login: identifier, password }) });
    setUser(result.data); setError("");
    try { await refresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Gagal memuat data kelas."); }
  };
  const register = async (fields: RegistrationFields) => {
    await initializeCsrf();
    const result = await apiRequest<{ data: Account }>("/auth/register", { method: "POST", body: JSON.stringify(fields) });
    setUser(result.data); setError("");
    try { await refresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Gagal memuat kelas."); }
  };
  const logout = async () => {
    await apiRequest("/auth/logout", { method: "POST" });
    clear(); setError("");
  };
  return <Context.Provider value={{ user, loading, error, materials, classrooms, notes, activeClass, setActiveClass, login, register, logout, refresh }}>{children}</Context.Provider>;
}

export function useSession(): Session {
  const session = useContext(Context);
  if (!session) throw new Error("SessionProvider diperlukan.");
  return session;
}
