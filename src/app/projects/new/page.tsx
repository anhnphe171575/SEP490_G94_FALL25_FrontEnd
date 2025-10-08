"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "../../../../ultis/axios";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";

export default function NewProjectPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const res = await axiosInstance.post('/api/projects', { topic, code });
      if (res.status === 201) {
        router.replace('/dashboard');
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Tạo dự án thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <ResponsiveSidebar />
      <main className="p-4 md:p-6 md:ml-64">
        <div className="mx-auto w-full max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4" style={{color:'var(--primary)'}}>Tạo dự án mới</h1>
          <form onSubmit={onSubmit} className="card rounded-xl p-6 space-y-4">
            {error ? <div className="text-red-600 text-sm">{error}</div> : null}
            <div>
              <label className="text-sm">Tên dự án</label>
              <input
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2"
                placeholder="Ví dụ: SEP490 G94"
              />
            </div>
            <div>
              <label className="text-sm">Mã dự án</label>
              <input
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="mt-1 w-full border rounded-lg px-3 py-2 uppercase tracking-wider"
                placeholder="VD: SEP490"
              />
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => router.back()} className="px-4 py-2 rounded-lg" style={{border:'1px solid var(--border)'}}>Hủy</button>
              <button type="submit" disabled={submitting} className="btn-primary rounded-lg px-4 py-2 disabled:opacity-60">
                <span style={{color:'black'}}>{submitting ? 'Đang tạo...' : 'Tạo dự án'} </span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );  
}


