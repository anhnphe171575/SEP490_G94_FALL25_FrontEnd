"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "../../../../../../ultis/axios";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";
import { toast } from "sonner";

type SuccessCriterion = {
  title: string;
  description: string;
  status: "pending" | "in-review" | "verified" | "rejected";
};

type StatusOption = {
  _id: string;
  value: string;
  label: string;
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
  const [statusId, setStatusId] = useState<string>("");
  const [statuses, setStatuses] = useState<StatusOption[]>([]);
  const [successCriteria, setSuccessCriteria] = useState<SuccessCriterion[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);

  // Fetch milestone statuses
  useEffect(() => {
    (async () => {
      try {
        const res = await axiosInstance.get('/api/projects/milestones/statuses');
        const statusList = res.data.data || [];
        setStatuses(statusList);
        
        // Set default to 'planning'
        const planningStatus = statusList.find((s: StatusOption) => s.value === 'planning');
        if (planningStatus) setStatusId(planningStatus._id);
      } catch (err) {
        console.error('Failed to fetch statuses:', err);
      }
    })();
  }, []);

  const validationMessage = useMemo(() => {
    if (!title.trim()) return "Tiêu đề là bắt buộc";
    if (!startDate) return "Vui lòng chọn ngày bắt đầu";
    if (!deadline) return "Vui lòng chọn hạn";
    const s = new Date(startDate);
    const d = new Date(deadline);
    if (isNaN(s.getTime()) || isNaN(d.getTime())) return "Ngày không hợp lệ";
    // Rule 2.1: start_date phải < deadline
    if (s >= d) return "Ngày bắt đầu phải trước hạn chót (Rule 2.1)";
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
      setErrorDetails([]);
      
      if (validationMessage) {
        setError(validationMessage);
        setErrorDetails([validationMessage]);
        toast.error('Validation Error', {
          description: validationMessage,
          duration: 4000,
        });
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
        status_id: statusId,
        success_criteria: successCriteria.filter(sc => sc.title.trim())
      };
      
      const res = await axiosInstance.post(`/api/projects/${projectId}/milestones`, body);
      if (res.status === 201) {
        toast.success('Milestone Created', {
          description: `${title} đã được tạo thành công!`,
          duration: 3000,
        });
        router.replace(`/projects/${projectId}`);
      }
    } catch (e: any) {
      const errorMessage = e?.response?.data?.message || 'Tạo milestone thất bại';
      const errorDetailsArray = e?.response?.data?.errors || [];
      
      setError(errorMessage);
      setErrorDetails(errorDetailsArray);
      
      // Hiển thị chi tiết error
      if (Array.isArray(errorDetailsArray) && errorDetailsArray.length > 0) {
        toast.error('Business Rules Violation', {
          description: errorDetailsArray.slice(0, 3).join('\n'),
          duration: 5000,
        });
      } else {
        toast.error('Error', {
          description: errorMessage,
          duration: 4000,
        });
      }
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
            {error ? (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-4">
                <h3 className="text-red-800 font-semibold mb-3">⚠️ {error}</h3>
                {errorDetails.length > 0 && (
                  <ul className="list-disc list-inside space-y-1">
                    {errorDetails.map((detail, idx) => (
                      <li key={idx} className="text-red-700 text-sm">
                        {detail}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
            
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
                    value={statusId}
                    onChange={(e) => setStatusId(e.target.value)}
                    className="mt-1 w-full border rounded-lg px-3 py-2 bg-transparent"
                  >
                    <option value="">— Chọn trạng thái —</option>
                    {statuses.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.value}
                      </option>
                    ))}
                  </select>
                  <div className="text-xs opacity-70 mt-1">Phải theo thứ tự: planning → in-progress → testing → completed</div>
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


