"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "../../../../../../../ultis/axios";
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

export default function EditDefectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);
  const defectId = Array.isArray(params?.defectId) ? params?.defectId[0] : (params?.defectId as string);

  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [severity, setSeverity] = useState("Medium");
  const [priority, setPriority] = useState("Medium");
  const [status, setStatus] = useState("Open");
  const [functionId, setFunctionId] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [functions, setFunctions] = useState<ProjectFunction[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserRole, setCurrentUserRole] = useState<number | null>(null);

  useEffect(() => {
    if (!projectId || !defectId) return;
    (async () => {
      try {
        const [fnRes, meRes, defectRes] = await Promise.all([
          axiosInstance.get(`/api/projects/${projectId}/functions`),
          axiosInstance.get(`/api/users/me`),
          axiosInstance.get(`/api/defects/${defectId}`),
        ]);
        setFunctions(Array.isArray(fnRes.data.functions) ? fnRes.data.functions : []);
        const meData: any = meRes?.data;
        const extractedId = meData?._id || meData?.id || meData?.user?._id || meData?.data?._id || "";
        setCurrentUserId(extractedId || "");
        const roleVal = meData?.role ?? meData?.user?.role ?? meData?.data?.role ?? null;
        setCurrentUserRole(typeof roleVal === 'string' ? Number(roleVal) : roleVal);

        const body: any = defectRes.data?.defect || defectRes.data?.data || defectRes.data;
        if (body) {
          setTitle(body.title || "");
          setCode(body.code || "");
          setSeverity(body.severity || "Medium");
          setPriority(body.priority || "Medium");
          setStatus(body.status || "Open");
          const fn = body.function?._id || body.function_id || body.function;
          setFunctionId(fn || "");
          setDescription(body.description || "");
        }
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Không thể tải defect');
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId, defectId]);

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
      if (currentUserRole === 1 && status !== 'In Progress' && status !== 'Resolved') {
        setError('Role của bạn chỉ được cập nhật trạng thái In Progress hoặc Resolved');
        return;
      }
      const payload: any = {
        title,
        code: code || undefined,
        severity,
        priority,
        status,
        function: functionId || undefined,
        description: description || undefined,
        project_id: projectId,
      };
      const res = await axiosInstance.put(`/api/defects/${defectId}`, payload);
      if (res.status === 200) {
        router.replace(`/projects/${projectId}/defect`);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || "Cập nhật defect thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const canEdit = !!currentUserId; // Optionally enforce ownership on server too

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <ResponsiveSidebar />
      <main className="p-4 md:p-6 md:ml-64">
        <div className="mx-auto w-full max-w-3xl">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4" style={{color:'var(--primary)'}}>Sửa Defect</h1>
          {loading ? (
            <div className="text-sm opacity-70">Đang tải...</div>
          ) : (
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
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="mt-1 w-full border rounded-lg px-3 py-2 bg-transparent"
                    >
                      {/* role=1: chỉ cho phép In Progress, Resolved; các trạng thái khác để disabled */}
                      <option value="Open" disabled={currentUserRole === 1}>Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed" disabled={currentUserRole === 1}>Closed</option>
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

              {/* Removed deadline section as requested */}

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
                <button type="submit" disabled={submitting || !!validationMessage || !canEdit} className="rounded-lg px-4 py-2 bg-[var(--primary)] text-white disabled:opacity-60">
                  {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}


