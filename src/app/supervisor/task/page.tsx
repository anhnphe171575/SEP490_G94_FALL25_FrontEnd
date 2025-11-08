"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import axiosInstance from "../../../../ultis/axios";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";
import QuickNav from "@/components/QuickNav";
import TaskDetailsComments from "@/components/TaskDetails/TaskDetailsComments";

const DHtmlxGanttChart = dynamic(
  () => import('@/components/DHtmlxGanttChart'),
  { ssr: false }
);
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  ResponsiveContainer,
} from "recharts";

// Types aligned with ClickUpGanttChart
type Task = {
  _id: string;
  title: string;
  start_date?: string;
  deadline?: string;
  status?: string | { _id: string; name: string };
  assignee_id?: any;
  progress?: number;
  parent_task_id?: string;
  feature_id?: string;
  milestone_id?: string;
  isMilestone?: boolean;
  [key: string]: any;
};

type Dependency = {
  _id: string;
  task_id: string;
  depends_on_task_id: any;
  dependency_type: "FS" | "FF" | "SS" | "SF";
};

type DashboardData = {
  tasks: Task[];
  dependencies: Record<string, { dependencies: Dependency[]; dependents: Dependency[] }>;
  statistics: {
    total: number;
    status: Record<string, number>;
  };
  milestones: Task[];
  upcoming: Task[];
  overdue: Task[];
};

type MilestoneSummary = {
  _id: string;
  title: string;
  description?: string;
  start_date?: string;
  deadline?: string;
  actual_date?: string;
  status: string;
  progress: number;
  statistics: {
    total_tasks: number;
    completed_tasks: number;
    in_progress_tasks: number;
    pending_tasks: number;
  };
  project?: {
    _id: string;
    topic: string;
    code: string;
  };
};

type MilestoneSummaryData = {
  filters: { project_id: string };
  statistics: {
    total: number;
    completed: number;
    in_progress: number;
    pending: number;
  };
  milestones: MilestoneSummary[];
};

export default function TaskDashboardPage() {
  const searchParams = useSearchParams();
  const selectedProject = searchParams.get('project_id') || undefined;
  
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [milestoneSummary, setMilestoneSummary] = useState<MilestoneSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const openComments = (taskId: string) => {
    setActiveTaskId(taskId);
    setCommentsOpen(true);
  };
  const closeComments = () => setCommentsOpen(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams();
        if (selectedProject) params.append('project_id', selectedProject);
        
        // Fetch dashboard data and milestone summary in parallel
        const [dashboardResponse, milestoneResponse] = await Promise.all([
          axiosInstance.get(`/api/tasks/dashboard?${params.toString()}`),
          axiosInstance.get(`/api/milestones/summary?${params.toString()}`)
        ]);
        
        setDashboardData(dashboardResponse.data);
        setMilestoneSummary(milestoneResponse.data);
      } catch (e: unknown) {
        const err = e as { response?: { data?: { message?: string } } };
        setError(err?.response?.data?.message || 'Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedProject]);

  const tasks = dashboardData?.tasks || [];
  const dependenciesMap = dashboardData?.dependencies || {};

  // Status overview from API
  const statusCounts = dashboardData?.statistics?.status || {};
  
  const pieData = useMemo(() => {
    const statusColors: Record<string, string> = {
      "Pending": "#94a3b8",
      "To Do": "#94a3b8",
      "In Progress": "#0ea5e9",
      "Review": "#a78bfa",
      "In Review": "#a78bfa",
      "Completed": "#22c55e",
      "Done": "#22c55e",
      "Overdue": "#ef4444",
      "Blocked": "#f59e0b",
      "On Hold": "#f59e0b",
    };

    return Object.entries(statusCounts)
      .map(([name, value]) => ({
        name,
        value: value as number,
        color: statusColors[name] || "#94a3b8",
      }))
      .filter(item => item.value > 0);
  }, [statusCounts]);

  // Use milestone summary from API instead of dashboard data
  const milestones = milestoneSummary?.milestones || [];
  const upcoming = dashboardData?.upcoming || [];
  const overdue = dashboardData?.overdue || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <ResponsiveSidebar />
        <main className="p-4 md:p-6 md:ml-64">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải dữ liệu...</p>
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
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Dashboard Task</h1>
            <p className="text-gray-600">Project Timeline & Progress Tracking</p>
          </div>
          <QuickNav selectedProject={selectedProject} />
        </div>

        {/* Local Nav Tabs */}
        <div className="mt-4 border-b border-gray-200">
          <nav className="-mb-px flex gap-6" aria-label="Tabs">
            <span className="whitespace-nowrap border-b-2 border-purple-600 px-1 pb-2 text-sm font-medium text-purple-700">
              Tổng quan
            </span>
            <Link
              href={`/supervisor/task/all${selectedProject ? `?project_id=${selectedProject}` : ''}`}
              className="whitespace-nowrap border-b-2 border-transparent px-1 pb-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Tất cả công việc
            </Link>
          </nav>
        </div>

        {/* Gantt Chart - Full Width */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm mb-6 overflow-hidden">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Gantt Chart & Dependencies</h2>
          <div className="h-[600px] w-full max-w-full overflow-hidden">
            <DHtmlxGanttChart tasks={tasks as any} dependencies={dependenciesMap as any} onTaskClick={openComments} />
          </div>
        </div>

        {/* Task Status Overview - Separate Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Task Status Overview</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={120} paddingAngle={2} dataKey="value">
                    {pieData.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <ReTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col justify-center">
              <div className="space-y-3">
                {pieData.map((p) => (
                  <div key={p.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="inline-block w-4 h-4 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-gray-700 font-medium flex-1">{p.name}</span>
                    <span className="ml-auto font-bold text-lg text-gray-900">{p.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Row: Milestones + Upcoming + Overdue */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Milestone Summary
              {milestoneSummary?.statistics && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({milestoneSummary.statistics.total} milestones)
                </span>
              )}
            </h2>
            <div className="space-y-3">
              {milestones.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Không có milestone nào.</p>
              ) : (
                milestones.map((m) => (
                  <div key={m._id} className="p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm text-gray-900 truncate flex-1">{m.title}</p>
                      {m.deadline && (
                        <span className="text-xs text-gray-600 ml-2 flex-shrink-0">
                          {new Date(m.deadline).toLocaleDateString("vi-VN")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2 text-xs">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        m.status === 'Completed' || m.status === 'Done' 
                          ? 'bg-green-100 text-green-700' 
                          : m.status === 'In Progress'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {m.status || "Pending"}
                      </span>
                      <span className="ml-auto text-gray-600 font-semibold">{m.progress}%</span>
                    </div>
                    {m.statistics && (
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                        <span>{m.statistics.completed_tasks}/{m.statistics.total_tasks} tasks hoàn thành</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Upcoming Deadlines (7 ngày)</h2>
            <div className="space-y-2">
              {upcoming.length === 0 && <p className="text-sm text-gray-500">Không có mục sắp đến hạn.</p>}
              {upcoming.map((t) => (
                <div key={t._id} className="p-3 rounded-lg border bg-white flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{t.title}</p>
                    <p className="text-xs text-gray-600">Hạn: {new Date(t.deadline || "").toLocaleDateString("vi-VN")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Overdue Tasks</h2>
            <div className="space-y-2">
              {overdue.length === 0 && <p className="text-sm text-gray-500">Không có task quá hạn.</p>}
              {overdue.map((t) => (
                <div key={t._id} className="p-3 rounded-lg border bg-white flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-red-600 truncate">{t.title} <span className="font-normal">( Quá hạn )</span></p>
                    <p className="text-xs text-red-600">Trễ: {t.overdueDays} ngày • Hạn {new Date(t.deadline || "").toLocaleDateString("vi-VN")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Comments Drawer */}
        {commentsOpen && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/30" onClick={closeComments} />
            <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl border-l border-gray-200 flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Comments</h3>
                  {activeTaskId && (
                    <p className="text-xs text-gray-500">Task ID: {activeTaskId}</p>
                  )}
                </div>
                <button onClick={closeComments} className="p-2 rounded hover:bg-gray-100">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <TaskDetailsComments taskId={activeTaskId} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

