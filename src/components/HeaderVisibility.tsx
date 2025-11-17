"use client";
import Header from "@/components/Header";
import { usePathname } from "next/navigation";

export default function HeaderVisibility({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideHeader =
    pathname === "/login" ||
    pathname.startsWith("/admin");
  return (
    <>
      {!hideHeader && <Header />}
      {children}
    </>
  );
}