import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "dhtmlx-gantt/codebase/dhtmlxgantt.css";
import MuiProvider from "./MuiProvider";
import EmotionRegistry from "./EmotionRegistry";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SEP Workspace",
  description: "Modern project workspace for milestones, timelines, and collaboration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans text-[var(--foreground)] bg-[var(--background)]`}
      >
        <EmotionRegistry>
          <MuiProvider>
            {children}
            <Toaster position="top-right" richColors closeButton />
          </MuiProvider>
        </EmotionRegistry>
      </body>
    </html>
  );
}
