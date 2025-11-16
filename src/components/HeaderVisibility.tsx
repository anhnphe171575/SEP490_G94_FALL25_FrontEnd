"use client";
import Header from "@/components/Header";
import { usePathname } from "next/navigation";

export default function HeaderVisibility({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideHeader = pathname === "/login";
  return (
    <>
      {!hideHeader && <Header />}
      {children}
    </>
  );
}