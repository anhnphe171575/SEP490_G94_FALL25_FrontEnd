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

type TaskItem = {
  _id: string;
  title: string;
  description?: string;
  start_date?: string;
  deadline?: string;
  status?: string | { _id: string; name: string };
  priority?: string | { _id: string; name: string };
  assignee_id?: { _id: string; full_name: string; email?: string } | string;
  assigner_id?: { _id: string; full_name: string; email?: string } | string;
};

export default function FeatureDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project_id") || undefined;

  const [feature, setFeature] = useState<FeatureDoc | null>(null);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [featureTasks, setFeatureTasks] = useState<TaskItem[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);

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

  // Fetch full tasks of this feature using listTasks API (populated with status/priority)
  useEffect(() => {
    (async () => {
      if (!projectId) {
        setFeatureTasks([]);
        return;
      }
      try {
        setTasksLoading(true);
        setTasksError(null);
        const params = new URLSearchParams();
        params.append('feature_id', id);
        params.append('sortBy', 'deadline:asc');
        const res = await axiosInstance.get(`/api/projects/${projectId}/tasks?${params.toString()}`);
        const data = Array.isArray(res.data) ? res.data : [];
        setFeatureTasks(data);
      } catch (e: any) {
        setTasksError(e?.response?.data?.message || 'Không thể tải tasks của feature');
      } finally {
        setTasksLoading(false);
      }
    })();
  }, [id, projectId]);

  const getName = (val: any) => (typeof val === "object" && val ? val.name : val || "");
  const getUserName = (val: any) => (typeof val === "object" && val ? val.full_name : "");
  const getStatusColor = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('completed') || s.includes('done')) return 'bg-green-100 text-green-700';
    if (s.includes('progress')) return 'bg-blue-100 text-blue-700';
    if (s.includes('review')) return 'bg-violet-100 text-violet-700';
    return 'bg-gray-100 text-gray-700';
  };
  const getPriorityDot = (priority: string) => {
    const p = (priority || '').toLowerCase();
    if (p.includes('high') || p.includes('very')) return 'bg-red-500';
    if (p.includes('medium')) return 'bg-amber-500';
    return 'bg-slate-400';
  };

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
            {tasksLoading ? (
              <div className="text-sm text-gray-600">Đang tải tasks...</div>
            ) : tasksError ? (
              <div className="text-sm text-red-600">{tasksError}</div>
            ) : featureTasks.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có task nào.</p>
            ) : (
              <div className="space-y-4">
                {featureTasks.map((t) => {
                  const statusName = getName(t.status);
                  const priorityName = getName(t.priority);
                  const assigneeName = getUserName(t.assignee_id);
                  const isOverdue = (() => {
                    if (!t.deadline) return false;
                    const dl = new Date(t.deadline);
                    const now = new Date();
                    const done = (statusName || '').toLowerCase();
                    const isDone = done.includes('completed') || done.includes('done');
                    return dl < now && !isDone;
                  })();

                  return (
                    <div key={t._id} className="bg-white rounded-xl border border-gray-200 p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-base font-semibold truncate ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                            {t.title}{isOverdue && <span className="font-normal"> ( Quá hạn )</span>}
                          </h3>
                          {t.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{t.description}</p>
                          )}

                          <div className="flex flex-wrap gap-2 mt-3">
                            {priorityName && (
                              <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium ${isOverdue ? 'ring-1 ring-red-200' : 'ring-1 ring-gray-200'}`}>
                                <span className={`inline-block w-2 h-2 rounded-full ${getPriorityDot(priorityName)}`} />
                                {priorityName}
                              </span>
                            )}
                            {statusName && (
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(statusName)}`}>
                                {statusName}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-3">
                            {assigneeName && (
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-white flex items-center justify-center text-[10px] font-bold">
                                  {assigneeName.split(' ').pop()?.[0]}
                                </div>
                                <span>{assigneeName}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={`text-sm ${isOverdue ? 'text-red-600' : 'text-gray-700'} whitespace-nowrap`}>
                          {t.deadline ? new Date(t.deadline).toLocaleDateString('vi-VN') : '—'}
                          {isOverdue && <span> ( Quá hạn )</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
