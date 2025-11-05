"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import axiosInstance from "../../../../../ultis/axios";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";
import QuickNav from "@/components/QuickNav";

type FeatureDoc = {
  _id: string;
  title: string;
  description?: string;
  start_date?: string;
  due_date?: string;
  status?: string | { name?: string; value?: string };
  project_id?: string;
};

type Breakdown = {
  tasks?: Array<{ _id: string; title: string; status?: any; deadline?: string }>;
  functions?: Array<{ _id: string; title: string; status?: any }>;
};

export default function FeatureDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project_id") || undefined;

  const [feature, setFeature] = useState<FeatureDoc | null>(null);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [fRes, bRes] = await Promise.all([
          axiosInstance.get(`/api/features/${id}`),
          axiosInstance.get(`/api/features/${id}/breakdown`),
        ]);

        setFeature(fRes.data);
        setBreakdown(bRes.data || {});
      } catch (e: any) {
        setError(e?.response?.data?.message || "Không thể tải chi tiết feature");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const statusText = useMemo(() => {
    if (!feature?.status) return "Pending";
    if (typeof feature.status === "string") return feature.status;
    return feature.status.name || feature.status.value || "Pending";
  }, [feature]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <ResponsiveSidebar />
        <main className="p-4 md:p-6 md:ml-64">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải chi tiết feature...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <ResponsiveSidebar />
        <main className="p-4 md:p-6 md:ml-64">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Có lỗi xảy ra</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Thử lại
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!feature) return null;

  return (
    <div className="min-h-screen bg-white">
      <ResponsiveSidebar />
      <main className="p-4 md:p-6 md:ml-64 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{feature.title}</h1>
            {feature.description && (
              <p className="text-gray-600 mt-1 max-w-3xl">{feature.description}</p>
            )}
          </div>
          <QuickNav selectedProject={projectId} />
        </div>

        {/* Meta */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Trạng thái</p>
            <p className={`text-lg font-semibold ${
              statusText.toLowerCase().includes('completed') || statusText.toLowerCase().includes('done')
                ? 'text-green-600'
                : statusText.toLowerCase().includes('progress')
                ? 'text-blue-600'
                : 'text-gray-900'
            }`}>{statusText}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Bắt đầu</p>
            <p className="text-lg font-semibold text-gray-900">{feature.start_date ? new Date(feature.start_date).toLocaleDateString('vi-VN') : 'N/A'}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Hạn</p>
            <p className="text-lg font-semibold text-gray-900">{feature.due_date ? new Date(feature.due_date).toLocaleDateString('vi-VN') : 'N/A'}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Project</p>
            <p className="text-lg font-semibold text-gray-900">{feature.project_id || 'N/A'}</p>
          </div>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Tasks</h2>
            <div className="space-y-2">
              {(!breakdown?.tasks || breakdown.tasks.length === 0) && (
                <p className="text-sm text-gray-500">Chưa có task nào.</p>
              )}
              {(breakdown?.tasks || []).map(t => (
                <div key={t._id} className="p-3 rounded-lg border bg-white flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-purple-500" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{t.title}</p>
                    <p className="text-xs text-gray-600">{t.deadline ? `Hạn: ${new Date(t.deadline).toLocaleDateString('vi-VN')}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Functions</h2>
            <div className="space-y-2">
              {(!breakdown?.functions || breakdown.functions.length === 0) && (
                <p className="text-sm text-gray-500">Chưa có function nào.</p>
              )}
              {(breakdown?.functions || []).map(fn => (
                <div key={fn._id} className="p-3 rounded-lg border bg-white flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{fn.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
