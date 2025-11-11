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

export default function FeatureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project_id") || undefined;

  useEffect(() => {
    params.then(p => setId(p.id));
  }, [params]);

  const [feature, setFeature] = useState<FeatureDoc | null>(null);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [featureTasks, setFeatureTasks] = useState<TaskItem[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
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
    if (!id || !projectId) {
      setFeatureTasks([]);
      return;
    }
    (async () => {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100">
      <ResponsiveSidebar />
      <main className="p-4 md:p-6 md:ml-64 space-y-8">
        {/* Header with gradient background */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 p-8 shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
          <div className="relative z-10">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium mb-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Feature Detail
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{feature.title}</h1>
              {feature.description && (
                <p className="text-purple-100 max-w-3xl leading-relaxed">{feature.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="flex justify-end">
          <QuickNav selectedProject={projectId} />
        </div>

        {/* Meta Cards with improved styling */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-500">Trạng thái</p>
            </div>
            <p className={`text-xl font-bold ${
              statusText.toLowerCase().includes('completed') || statusText.toLowerCase().includes('done')
                ? 'text-green-600'
                : statusText.toLowerCase().includes('progress')
                ? 'text-blue-600'
                : 'text-gray-900'
            }`}>{statusText}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-500">Ngày bắt đầu</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{feature.start_date ? new Date(feature.start_date).toLocaleDateString('vi-VN') : 'N/A'}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-500">Hạn chót</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{feature.due_date ? new Date(feature.due_date).toLocaleDateString('vi-VN') : 'N/A'}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-500">Project ID</p>
            </div>
            <p className="text-xl font-bold text-gray-900 truncate">{feature.project_id || 'N/A'}</p>
          </div>
        </div>

        {/* Breakdown Section with improved design */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tasks Section */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
                <p className="text-sm text-gray-500">{featureTasks.length} công việc</p>
              </div>
            </div>
            
            {tasksLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500 mx-auto mb-3"></div>
                  <p className="text-sm text-gray-600">Đang tải tasks...</p>
                </div>
              </div>
            ) : tasksError ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                  </svg>
                </div>
                <p className="text-sm text-red-600">{tasksError}</p>
              </div>
            ) : featureTasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">Chưa có task nào</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
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
                    <div key={t._id} className={`relative rounded-xl border-2 p-4 hover:shadow-md transition-all duration-200 ${
                      isOverdue ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200 hover:border-purple-300'
                    }`}>
                      {isOverdue && (
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                          Quá hạn
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-base font-bold mb-2 ${isOverdue ? 'text-red-700' : 'text-gray-900'}`}>
                            {t.title}
                          </h3>
                          {t.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{t.description}</p>
                          )}

                          <div className="flex flex-wrap gap-2 mb-3">
                            {priorityName && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white border-2 border-gray-200">
                                <span className={`inline-block w-2 h-2 rounded-full ${getPriorityDot(priorityName)}`} />
                                {priorityName}
                              </span>
                            )}
                            {statusName && (
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(statusName)}`}>
                                {statusName}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-4 text-sm">
                            {assigneeName && (
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-md">
                                  {assigneeName.split(' ').pop()?.[0]}
                                </div>
                                <span className="font-medium text-gray-700">{assigneeName}</span>
                              </div>
                            )}
                            <div className={`flex items-center gap-1.5 font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {t.deadline ? new Date(t.deadline).toLocaleDateString('vi-VN') : '—'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Functions Section */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Functions</h2>
                <p className="text-sm text-gray-500">{breakdown?.functions?.length || 0} chức năng</p>
              </div>
            </div>
            
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {(!breakdown?.functions || breakdown.functions.length === 0) ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">Chưa có function nào</p>
                </div>
              ) : (
                (breakdown?.functions || []).map(fn => (
                  <div key={fn._id} className="p-4 rounded-xl border-2 border-gray-200 bg-gradient-to-r from-cyan-50 to-blue-50 hover:border-cyan-300 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-sm font-bold text-gray-900">{fn.title}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
