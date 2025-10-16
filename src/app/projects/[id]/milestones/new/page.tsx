"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "../../../../../../ultis/axios";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";

type SuccessCriterion = {
  title: string;
  description: string;
  status: "pending" | "in-review" | "verified" | "rejected";
};

export default function NewMilestonePage() {
  const router = useRouter();
  const params = useParams();
  const projectId = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [actualDate, setActualDate] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [estimatedEffort, setEstimatedEffort] = useState<number>(0);
  const [actualEffort, setActualEffort] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [tags, setTags] = useState<string>("");
  const [status, setStatus] = useState<string>("Planned");
  const [parentId, setParentId] = useState<string>("");
  const [parentOptions, setParentOptions] = useState<Array<{ _id: string; title: string }>>([]);
  const [successCriteria, setSuccessCriteria] = useState<SuccessCriterion[]>([]);
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

  const addSuccessCriterion = () => {
    setSuccessCriteria([...successCriteria, { title: "", description: "", status: "pending" }]);
  };

  const removeSuccessCriterion = (index: number) => {
    setSuccessCriteria(successCriteria.filter((_, i) => i !== index));
  };

  const updateSuccessCriterion = (index: number, field: keyof SuccessCriterion, value: string) => {
    const updated = [...successCriteria];
    updated[index] = { ...updated[index], [field]: value };
    setSuccessCriteria(updated);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      if (validationMessage) {
        setError(validationMessage);
        return;
      }
      const body: any = { 
        title, 
        code: code || undefined,
        start_date: startDate, 
        deadline,
        actual_date: actualDate || undefined,
        description, 
        notes: notes || undefined,
        estimated_effort: estimatedEffort || 0,
        actual_effort: actualEffort || 0,
        duration: duration || 0,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        status,
        success_criteria: successCriteria.filter(sc => sc.title.trim())
      };
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
            
            {/* Basic Info Section */}
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
                    placeholder="Ví dụ: Sprint 1"
                  />
                </div>

                <div>
                  <label className="text-sm">Mã Milestone</label>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                    placeholder="Ví dụ: MS-001"
                  />
                  <div className="text-xs opacity-70 mt-1">Tùy chọn. Mã định danh duy nhất.</div>
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

                <div className="md:col-span-2">
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
              </div>
            </div>

            {/* Timeline Section */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold mb-3" style={{color:'var(--primary)'}}>Thời gian</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold">Bắt đầu *</label>
                  <input
                    required
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`mt-1 w-full border rounded-lg px-3 py-2 ${validationMessage && startDate && deadline && new Date(startDate) > new Date(deadline) ? 'border-red-500' : ''}`}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">Hạn chót *</label>
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
                  <label className="text-sm">Ngày hoàn thành thực tế</label>
                  <input
                    type="date"
                    value={actualDate}
                    onChange={(e) => setActualDate(e.target.value)}
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                  />
                  <div className="text-xs opacity-70 mt-1">Ngày hoàn thành milestone (nếu đã xong)</div>
                </div>
                <div>
                  <label className="text-sm">Thời lượng (ngày)</label>
                  <input
                    type="number"
                    min="0"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                    placeholder="VD: 14"
                  />
                  <div className="text-xs opacity-70 mt-1">Thời lượng dự kiến</div>
                </div>
              </div>
            </div>

            {/* Effort Section */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold mb-3" style={{color:'var(--primary)'}}>Công sức</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">Ước tính công sức (giờ)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={estimatedEffort}
                    onChange={(e) => setEstimatedEffort(Number(e.target.value))}
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                    placeholder="VD: 80"
                  />
                </div>
                <div>
                  <label className="text-sm">Công sức thực tế (giờ)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={actualEffort}
                    onChange={(e) => setActualEffort(Number(e.target.value))}
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                    placeholder="VD: 85"
                  />
                </div>
              </div>
            </div>

            {/* Success Criteria Section */}
            <div className="border-b pb-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold" style={{color:'var(--primary)'}}>Tiêu chí thành công</h2>
                <button
                  type="button"
                  onClick={addSuccessCriterion}
                  className="px-3 py-1 text-sm rounded-lg bg-[var(--primary)] text-white"
                >
                  + Thêm tiêu chí
                </button>
              </div>
              {successCriteria.length === 0 ? (
                <div className="text-sm opacity-70 text-center py-4">Chưa có tiêu chí nào. Nhấn "Thêm tiêu chí" để thêm.</div>
              ) : (
                <div className="space-y-3">
                  {successCriteria.map((sc, idx) => (
                    <div key={idx} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <input
                          value={sc.title}
                          onChange={(e) => updateSuccessCriterion(idx, "title", e.target.value)}
                          className="flex-1 border rounded px-2 py-1 text-sm"
                          placeholder="Tiêu đề tiêu chí *"
                        />
                        <select
                          value={sc.status}
                          onChange={(e) => updateSuccessCriterion(idx, "status", e.target.value)}
                          className="border rounded px-2 py-1 text-sm bg-transparent"
                        >
                          <option value="pending">Pending</option>
                          <option value="in-review">In Review</option>
                          <option value="verified">Verified</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => removeSuccessCriterion(idx)}
                          className="text-red-600 hover:text-red-800 text-sm px-2"
                        >
                          ✕
                        </button>
                      </div>
                      <textarea
                        value={sc.description}
                        onChange={(e) => updateSuccessCriterion(idx, "description", e.target.value)}
                        className="w-full border rounded px-2 py-1 text-sm"
                        rows={2}
                        placeholder="Mô tả chi tiết tiêu chí..."
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Description & Tags Section */}
            <div>
              <h2 className="text-lg font-semibold mb-3" style={{color:'var(--primary)'}}>Mô tả & Tags</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm">Tags</label>
                  <input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                    placeholder="Nhập các tag, cách nhau bởi dấu phẩy"
                  />
                  <div className="text-xs opacity-70 mt-1">VD: backend, api, critical</div>
                </div>

                <div>
                  <label className="text-sm">Mô tả</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                    rows={3}
                    placeholder="Mô tả tổng quan về milestone..."
                  />
                  <div className="text-xs opacity-70 mt-1">{description.length}/1000</div>
                </div>

                <div>
                  <label className="text-sm">Ghi chú</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                    rows={3}
                    placeholder="Ghi chú phạm vi, tiêu chí, rủi ro..."
                  />
                  <div className="text-xs opacity-70 mt-1">{notes.length}/1000</div>
                </div>
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


