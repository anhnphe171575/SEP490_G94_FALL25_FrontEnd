"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "../../../../../../ultis/axios";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";

export default function NewMilestonePage() {
  const router = useRouter();
  const params = useParams();
  const projectId = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string>("Planned");
  const [parentId, setParentId] = useState<string>("");
  const [parentOptions, setParentOptions] = useState<Array<{ _id: string; title: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    (async () => {
      try {
        const res = await axiosInstance.get(`/api/projects/${projectId}/milestones`);
        const opts = (Array.isArray(res.data) ? res.data : []).map((m: any) => ({ _id: m._id, title: m.title }));
        setParentOptions(opts);
      } catch (_) {
        // ignore: optional enhancement
      }
    })();
  }, [projectId]);

  const validationMessage = useMemo(() => {
    if (!title.trim()) return "Tiêu đề là bắt buộc";
    if (!startDate) return "Vui lòng chọn ngày bắt đầu";
    if (!deadline) return "Vui lòng chọn hạn";
    const s = new Date(startDate);
    const d = new Date(deadline);
    if (isNaN(s.getTime()) || isNaN(d.getTime())) return "Ngày không hợp lệ";
    if (s.getTime() > d.getTime()) return "Ngày bắt đầu phải trước hoặc bằng hạn";
    return "";
  }, [title, startDate, deadline]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      if (validationMessage) {
        setError(validationMessage);
        return;
      }
      const body: any = { title, start_date: startDate, deadline, description, status };
      if (parentId) body.parent_id = parentId;
      const res = await axiosInstance.post(`/api/projects/${projectId}/milestones`, body);
      if (res.status === 201) {
        router.replace(`/projects/${projectId}`);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Tạo milestone thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <ResponsiveSidebar />
      <main className="p-4 md:p-6 md:ml-64">
        <div className="mx-auto w-full max-w-3xl">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4" style={{color:'var(--primary)'}}>Thêm Milestone</h1>
          <form onSubmit={onSubmit} className="card rounded-xl p-6 space-y-4">
            {error ? <div className="text-red-600 text-sm">{error}</div> : null}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm">Tiêu đề</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  placeholder="Ví dụ: Sprint 1"
                />
              </div>
              <div>
                <label className="text-sm">Bắt đầu</label>
                <input
                  required
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`mt-1 w-full border rounded-lg px-3 py-2 ${validationMessage && startDate && deadline && new Date(startDate) > new Date(deadline) ? 'border-red-500' : ''}`}
                />
              </div>
              <div>
                <label className="text-sm">Hạn</label>
                <input
                  required
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className={`mt-1 w-full border rounded-lg px-3 py-2 ${validationMessage && startDate && deadline && new Date(startDate) > new Date(deadline) ? 'border-red-500' : ''}`}
                />
                {validationMessage && startDate && deadline && new Date(startDate) > new Date(deadline) ? (
                  <div className="text-xs text-red-600 mt-1">Ngày bắt đầu phải trước hoặc bằng hạn</div>
                ) : null}
              </div>
              <div>
                <label className="text-sm">Trạng thái</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2 bg-transparent"
                >
                  <option value="Planned">Planned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
              <div>
                <label className="text-sm">Thuộc milestone</label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2 bg-transparent"
                >
                  <option value="">— Không —</option>
                  {parentOptions.map((m) => (
                    <option key={m._id} value={m._id}>{m.title}</option>
                  ))}
                </select>
                <div className="text-xs opacity-70 mt-1">Tùy chọn. Dùng để tạo cấu trúc cha/con.</div>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm">Mô tả</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  rows={4}
                  placeholder="Ghi chú phạm vi, tiêu chí, rủi ro..."
                />
                <div className="text-xs opacity-70 mt-1">{description.length}/1000</div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button type="button" onClick={() => router.back()} className="px-4 py-2 rounded-lg" style={{border:'1px solid var(--border)'}}>Hủy</button>
              <button type="submit" disabled={submitting || !!validationMessage} className="rounded-lg px-4 py-2 bg-[var(--primary)] text-white disabled:opacity-60">
                {submitting ? 'Đang tạo...' : 'Tạo milestone'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}


