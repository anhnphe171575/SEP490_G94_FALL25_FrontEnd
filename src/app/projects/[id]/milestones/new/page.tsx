"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "../../../../../../ultis/axios";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";
import { toast } from "sonner";


export default function NewMilestonePage() {
  const router = useRouter();
  const params = useParams();
  const projectId = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [actualDate, setActualDate] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);

  const validationMessage = useMemo(() => {
    if (!title.trim()) return "Tiêu đề là bắt buộc";
    return "";
  }, [title]);

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
        start_date: startDate || undefined, 
        actual_date: actualDate || undefined,
        description, 
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []
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
    <div className="min-h-screen bg-white">
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
              </div>
            </div>

            {/* Timeline Section */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold mb-3" style={{color:'var(--primary)'}}>Thời gian</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-sm">Ngày thực tế</label>
                  <input
                    type="date"
                    value={actualDate}
                    onChange={(e) => setActualDate(e.target.value)}
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
            </div>

            {/* Description & Tags Section */}
            <div>
              <h2 className="text-lg font-semibold mb-3" style={{color:'var(--primary)'}}>Mô tả & Tags</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm">Mô tả</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                    rows={3}
                    placeholder="Mô tả tổng quan về milestone..."
                  />
                </div>

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


