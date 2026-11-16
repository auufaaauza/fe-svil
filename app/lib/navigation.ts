import type { IconName } from "../components/friendly-icon";

export type AccountRole = "student" | "teacher" | "admin";
export type WorkspaceLink = { label: string; href: string; icon: IconName };
export const workspaceNavigation: Record<AccountRole, WorkspaceLink[]> = {
  student: [
    { label: "LKPD", href: "/siswa", icon: "edit" },
    { label: "Materi", href: "/siswa/materi", icon: "book" },
    { label: "Tugas", href: "/siswa/tugas", icon: "compass" },
    { label: "Ringkasan", href: "/siswa/ringkasan", icon: "chart" },
  ],
  teacher: [
    { label: "Beranda", href: "/guru", icon: "home" },
    { label: "Konten kelas", href: "/guru/materi", icon: "book" },
    { label: "Tinjauan", href: "/guru/tinjauan", icon: "edit" },
    { label: "Laporan", href: "/guru/laporan", icon: "chart" },
    { label: "Kelasku", href: "/guru/kelas", icon: "people" },
  ],
  admin: [
    { label: "Beranda", href: "/admin", icon: "home" },
    { label: "Madrasah", href: "/admin/madrasah", icon: "school" },
    { label: "Konten belajar", href: "/admin/konten", icon: "book" },
    { label: "Laporan", href: "/admin/laporan", icon: "chart" },
  ],
};

export function homeForRole(role: AccountRole): string { return workspaceNavigation[role][0].href; }
export function studyForRole(role: AccountRole): string { return workspaceNavigation[role][role === "admin" ? 2 : 1].href; }
export function sessionDestination(role: AccountRole | null, pathname: string): string | null {
  if (!role) return ["/login", "/register"].includes(pathname) ? null : "/login";
  return workspaceNavigation[role].some(item => item.href === pathname || pathname.startsWith(item.href+"/")) ? null : homeForRole(role);
}

export function lessonLocation(role: AccountRole, topic: number, phase = 0): string {
  return `${studyForRole(role)}?pertemuan=${topic+1}&langkah=${phase+1}`;
}

export function lessonFromQuery(value: string | null, max: number): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const number = Number(value);
  return number >= 1 && number <= max ? number-1 : null;
}
