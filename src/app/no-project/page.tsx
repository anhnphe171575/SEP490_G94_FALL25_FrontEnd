"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";

export default function NoProjectPage() {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? (sessionStorage.getItem('token') || localStorage.getItem('token')) : null;
    if (!token) {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <ResponsiveSidebar />
      <main className="p-4 md:p-6 md:ml-64 flex items-center justify-center">
        <div className="card rounded-xl p-8 md:p-10 max-w-md text-center shadow-sm">
          <h1 className="text-2xl md:text-3xl font-semibold mb-2 tracking-tight" style={{color:'var(--primary)'}}>Chưa có dự án nào</h1>
          <p className="opacity-80 mb-6">Hãy tạo dự án đầu tiên để bắt đầu quản lý công việc.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => router.replace('/projects/new')} className="btn-primary rounded-lg px-4 py-2 shadow-sm hover:shadow transition-shadow">+ Tạo dự án</button>
            <button
              className="rounded-lg px-4 py-2 hover:bg-[var(--muted)]"
              style={{border:'1px solid var(--border)'}}
              onClick={() => router.replace('/dashboard')}
            >Quay lại</button>
          </div>
        </div>
      </main>
    </div>
  );
}


