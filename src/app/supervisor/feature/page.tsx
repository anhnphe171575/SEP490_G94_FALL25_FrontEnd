"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import axiosInstance from "../../../../ultis/axios";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";
import QuickNav from "@/components/QuickNav";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

type FeatureItem = {
  _id: string;
  title: string;
  start_date?: string;
  due_date?: string;
  status?: string;
  project_id?: string;
};

type FeatureDashboard = {
  filters: { project_id: string };
  statistics: {
    total: number;
    completed: number;
    overall_completion_percent: number;
    by_status: Record<string, number>;
    upcoming_count: number;
    overdue_count: number;
  };
  upcoming: FeatureItem[];
  overdue: FeatureItem[];
};

export default function SupervisorFeaturePage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project_id") || undefined;

  const [data, setData] = useState<FeatureDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [featureSearch, setFeatureSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        if (projectId) {
          const res = await axiosInstance.get(`/api/users/dashboard/feature/${projectId}`);
          setData(res.data);
        } else {
          const res = await axiosInstance.get(`/api/users/dashboard/feature`);
          setData(res.data);
        }
      } catch (e: any) {
        setError(e?.response?.data?.message || "Không thể tải thống kê feature");
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  // Fetch features list when project selected
  useEffect(() => {
    (async () => {
      if (!projectId) {
        setFeatures([]);
        return;
      }
      try {
        const res = await axiosInstance.get(`/api/features/project/${projectId}`);
        const items = Array.isArray(res.data) ? res.data : [];
        // API returns tasks array; normalize to our FeatureItem shape
        setFeatures(items.map((f: any) => ({
          _id: f._id,
          title: f.title,
          start_date: f.start_date,
          due_date: f.due_date,
          status: typeof f.status_id === 'object' ? (f.status_id?.name || f.status_id?.value) : f.status,
          project_id: f.project_id,
          tasks: f.tasks || [],
        })) as any);
      } catch (e) {
        setFeatures([]);
      }
    })();
  }, [projectId]);

  const statusEntries = useMemo(() => Object.entries(data?.statistics?.by_status || {}), [data]);

  const statusPieData = useMemo(() => {
    const colors: Record<string, string> = {
      Completed: "#22c55e",
      Done: "#22c55e",
      "In Progress": "#0ea5e9",
      Pending: "#94a3b8",
      "To Do": "#94a3b8",
      Overdue: "#ef4444",
      Blocked: "#f59e0b",
      "On Hold": "#f59e0b",
    };
    return statusEntries
      .map(([name, value]) => ({ name, value: value as number, color: colors[name] || "#64748b" }))
      .filter(d => d.value > 0);
  }, [statusEntries]);

  const upcomingOverdueData = useMemo(() => {
    return [
      { name: "Sắp hết hạn", value: data?.statistics?.upcoming_count || 0, color: "#f59e0b" },
      { name: "Quá hạn", value: data?.statistics?.overdue_count || 0, color: "#ef4444" },
    ];
  }, [data]);

  const completionPieData = useMemo(() => {
    const completed = data?.statistics?.overall_completion_percent || 0;
    const remaining = Math.max(0, 100 - completed);
    return [
      { name: "Hoàn thành", value: completed, color: "#22c55e" },
      { name: "Còn lại", value: remaining, color: "#e5e7eb" },
    ];
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <ResponsiveSidebar />
        <main className="p-4 md:p-6 md:ml-64">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải thống kê feature...</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100">
      <ResponsiveSidebar />
      <main className="p-4 md:p-6 md:ml-64 space-y-8">
        {/* QuickNav - Always at the top */}
        <div>
          <QuickNav selectedProject={projectId} />
        </div>

        {/* Header with gradient background */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 shadow-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mb-32"></div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium mb-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Feature Dashboard
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Tổng quan Feature 📊</h1>
            <p className="text-indigo-100">Theo dõi số lượng, tiến độ và hạn sắp tới của các feature</p>
          </div>
        </div>

        

        {/* Feature List with enhanced design */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Danh sách Features</h2>
                <p className="text-xs text-gray-500">{features.length} feature</p>
              </div>
            </div>
            <div className="relative w-full md:w-auto md:min-w-[320px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                value={featureSearch}
                onChange={(e) => setFeatureSearch(e.target.value)}
                placeholder="Tìm theo tiêu đề feature..."
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              />
            </div>
          </div>

          {!projectId ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">Chọn một dự án để xem danh sách features</p>
            </div>
          ) : features.filter(f => (f.title || '').toLowerCase().includes(featureSearch.toLowerCase())).length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">Không tìm thấy feature nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features
                .filter(f => (f.title || '').toLowerCase().includes(featureSearch.toLowerCase()))
                .map((f: any) => (
                  <a
                    key={f._id}
                    href={`/supervisor/feature/${f._id}${projectId ? `?project_id=${projectId}` : ''}`}
                    className="group block p-5 rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 hover:border-purple-300 hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-2">{f.title}</h3>
                      <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        (f.status || '').toLowerCase().includes('completed') || (f.status || '').toLowerCase().includes('done')
                          ? 'bg-green-100 text-green-700'
                          : (f.status || '').toLowerCase().includes('progress')
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {f.status || 'Pending'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {f.due_date ? new Date(f.due_date).toLocaleDateString('vi-VN') : 'N/A'}
                      </div>
                      {Array.isArray(f.tasks) && (
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          {f.tasks.length}
                        </div>
                      )}
                    </div>
                  </a>
                ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
