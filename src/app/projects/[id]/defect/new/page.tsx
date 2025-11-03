"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "../../../../../../ultis/axios";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";

type User = {
  _id: string;
  full_name?: string;
  email?: string;
};

type ProjectFunction = {
  _id: string;
  title: string;
};

export default function NewDefectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);

  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [severity, setSeverity] = useState("Medium");
  const [priority, setPriority] = useState("Medium");
  const [status, setStatus] = useState("Open");
  const [functionId, setFunctionId] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [functions, setFunctions] = useState<ProjectFunction[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    if (!projectId) return;
    (async () => {
      try {
        // Optional: preload function list and users for project to select from
        const [fnRes, meRes] = await Promise.all([
          axiosInstance.get(`/api/projects/${projectId}/functions`),
          axiosInstance.get(`/api/users/me`),
        ]);
        console.log(fnRes.data);
        setFunctions(Array.isArray(fnRes.data.functions) ? fnRes.data.functions : []);
        const meData: any = meRes?.data;
        const extractedId = meData?._id || meData?.id || meData?.user?._id || meData?.data?._id || "";
        setCurrentUserId(extractedId || "");
      } catch (_) {
        // ignore preloading errors; fields can still be typed manually
      }
    })();
  }, [projectId]);

  const validationMessage = useMemo(() => {
    if (!title.trim()) return "Tiêu đề là bắt buộc";
    return "";
  }, [title]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      if (validationMessage) {
        setError(validationMessage);
        return;
      }
      const payload: any = {
        title,
        code: code || undefined,
        severity,
        priority,
        status,
        assigner_id: currentUserId || undefined,
        function: functionId || undefined,
        description: description || undefined,
        project_id: projectId,
      };
      const res = await axiosInstance.post(`/api/defects`, payload);
      console.log(res.data);
      if (res.status === 201 || res.status === 200) {
        router.replace(`/projects/${projectId}/defect`);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || "Tạo defect thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <ResponsiveSidebar />
      <main className="p-4 md:p-6 md:ml-64">
        <div className="mx-auto w-full max-w-3xl">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4" style={{color:'var(--primary)'}}>Thêm Defect</h1>
          <form onSubmit={onSubmit} className="card rounded-xl p-6 space-y-4">
            {error ? <div className="text-red-600 text-sm">{error}</div> : null}

            {/* Basic */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold mb-3" style={{color:'var(--primary)'}}>Thông tin cơ bản</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold">Tiêu đề *</label>
                  <input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                    placeholder="Ví dụ: Lỗi không lưu được form"
                  />
                </div>
                <div>
                  <label className="text-sm">Trạng thái</label>
                  <select value={status} disabled className="mt-1 w-full border rounded-lg px-3 py-2 bg-transparent">
                    <option value="Open">Open</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm">Mức độ nghiêm trọng</label>
                  <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2 bg-transparent">
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm">Ưu tiên</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2 bg-transparent">
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Function */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold mb-3" style={{color:'var(--primary)'}}>Chức năng liên quan</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm">Function</label>
                  <select value={functionId} onChange={(e) => setFunctionId(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2 bg-transparent">
                    <option value="">— Không —</option>
                    {functions.map((f) => (
                      <option key={f._id} value={f._id}>{f.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-lg font-semibold mb-3" style={{color:'var(--primary)'}}>Mô tả</h2>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded-lg px-3 py-2" rows={4} placeholder="Mô tả chi tiết lỗi, bước tái hiện, kỳ vọng..." />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button type="button" onClick={() => router.back()} className="px-4 py-2 rounded-lg" style={{border:'1px solid var(--border)'}}>Hủy</button>
              <button type="submit" disabled={submitting || !!validationMessage} className="rounded-lg px-4 py-2 bg-[var(--primary)] text-white disabled:opacity-60">
                {submitting ? 'Đang tạo...' : 'Tạo defect'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}


