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
    <div className="min-h-screen bg-white">
      <ResponsiveSidebar />
      <main className="p-4 md:p-6 md:ml-64 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Tổng quan Feature</h1>
            <p className="text-gray-600">Số lượng, tiến độ và hạn sắp tới</p>
          </div>
          <QuickNav selectedProject={projectId} />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Pie */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Biểu đồ Trạng thái</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {statusPieData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Upcoming vs Overdue Bar */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Sắp hết hạn vs Quá hạn</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={upcomingOverdueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8,8,0,0]}>
                    {upcomingOverdueData.map((e, i) => (
                      <Cell key={`bar-${i}`} fill={e.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Completion Donut */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">% Hoàn thành tổng thể</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={completionPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} startAngle={90} endAngle={-270}>
                    {completionPieData.map((entry, idx) => (
                      <Cell key={`comp-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-2 text-sm text-gray-600">{data?.statistics?.overall_completion_percent || 0}% hoàn thành</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Tổng Feature</p>
            <p className="text-3xl font-bold text-gray-900">{data?.statistics?.total || 0}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Hoàn thành</p>
            <p className="text-3xl font-bold text-green-600">{data?.statistics?.completed || 0}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">% hoàn thành tổng thể</p>
            <p className="text-3xl font-bold text-blue-600">{data?.statistics?.overall_completion_percent || 0}%</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Sắp hết hạn (7 ngày)</p>
            <p className="text-3xl font-bold text-amber-600">{data?.statistics?.upcoming_count || 0}</p>
          </div>
        </div>

        {/* Status breakdown */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Trạng thái Feature</h2>
          {statusEntries.length === 0 ? (
            <p className="text-sm text-gray-500">Không có dữ liệu trạng thái.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {statusEntries.map(([name, count]) => (
                <div key={name} className="px-4 py-3 bg-gray-50 rounded-lg border text-sm flex items-center justify-between">
                  <span className="text-gray-700">{name}</span>
                  <span className="font-semibold text-gray-900">{count as number}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming & Overdue */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Feature sắp hết hạn (7 ngày)</h2>
            <div className="space-y-2">
              {(data?.upcoming || []).length === 0 && (
                <p className="text-sm text-gray-500">Không có feature sắp hết hạn.</p>
              )}
              {(data?.upcoming || []).map((f) => (
                <div key={f._id} className="p-3 rounded-lg border bg-white flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{f.title}</p>
                    <p className="text-xs text-gray-600">Hạn: {f.due_date ? new Date(f.due_date).toLocaleDateString("vi-VN") : "N/A"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Feature quá hạn</h2>
            <div className="space-y-2">
              {(data?.overdue || []).length === 0 && (
                <p className="text-sm text-gray-500">Không có feature quá hạn.</p>
              )}
              {(data?.overdue || []).map((f) => (
                <div key={f._id} className="p-3 rounded-lg border bg-white flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{f.title}</p>
                    <p className="text-xs text-gray-600">Hạn: {f.due_date ? new Date(f.due_date).toLocaleDateString("vi-VN") : "N/A"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feature List (when a project is selected) */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4 gap-3">
            <h2 className="text-xl font-semibold text-gray-900">Danh sách Features</h2>
            <div className="relative w-full max-w-sm">
              <input
                value={featureSearch}
                onChange={(e) => setFeatureSearch(e.target.value)}
                placeholder="Tìm theo tiêu đề feature..."
                className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {!projectId ? (
            <p className="text-sm text-gray-500">Chọn một dự án để xem danh sách features.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features
                .filter(f => (f.title || '').toLowerCase().includes(featureSearch.toLowerCase()))
                .map((f: any) => (
                  <a
                    key={f._id}
                    href={`/supervisor/feature/${f._id}${projectId ? `?project_id=${projectId}` : ''}`}
                    className="block p-4 rounded-xl border bg-white hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">{f.title}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        (f.status || '').toLowerCase().includes('completed') || (f.status || '').toLowerCase().includes('done')
                          ? 'bg-green-100 text-green-700'
                          : (f.status || '').toLowerCase().includes('progress')
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {f.status || 'Pending'}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600 flex items-center justify-between">
                      <span>Hạn: {f.due_date ? new Date(f.due_date).toLocaleDateString('vi-VN') : 'N/A'}</span>
                      {Array.isArray(f.tasks) && (
                        <span className="text-gray-500">{f.tasks.length} tasks</span>
                      )}
                    </div>
                  </a>
                ))}
              {features.length === 0 && (
                <p className="text-sm text-gray-500 col-span-full">Không có feature nào.</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
