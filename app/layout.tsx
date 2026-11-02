import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SessionProvider } from "./components/session-provider";
import { ToastViewport } from "./components/toast-viewport";

const jakarta = localFont({
  src: "./fonts/jakarta-latin.woff2",
  variable: "--font-jakarta",
  weight: "400 800",
  display: "swap",
});

const poppins = localFont({
  src: [
    { path: "./fonts/poppins-regular.woff2", weight: "400" },
    { path: "./fonts/poppins-medium.woff2", weight: "500" },
    { path: "./fonts/poppins-semibold.woff2", weight: "600" },
    { path: "./fonts/poppins-bold.woff2", weight: "700" },
  ],
  variable: "--font-poppins",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "SVIL · Belajar dengan hati",
  description: "Ruang pembelajaran IPAS berbasis Value Inquiry dan nilai cinta untuk Madrasah Ibtidaiyah.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${jakarta.variable} ${poppins.variable}`}
    >
      <body className="min-h-full flex flex-col"><SessionProvider>{children}</SessionProvider><ToastViewport/></body>
    </html>
  );
}
