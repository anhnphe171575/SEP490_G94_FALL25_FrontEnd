"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axiosInstance from "../../../../ultis/axios";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";
import QuickNav from "@/components/QuickNav";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";

type Contributor = {
  assignee_id: string;
  user: {
    _id: string;
    full_name: string;
    email: string;
  };
  total_tasks: number;
  completed_tasks: number;
  breakdown: Array<{
    priority_id: string;
    priority_name: string;
    priority_value: string;
    count: number;
  }>;
  type_breakdown: Array<{
    type_id: string;
    type_name: string;
    count: number;
  }>;
};

type ContributionData = {
  filters: {
    project_id?: string;
  };
  contributors: Contributor[];
};

type Statistics = {
  filters: {
    project_id: string;
  };
  statistics: {
    total: number;
    not_assigned: number;
    status: {
      [key: string]: number;
    };
  };
};

type Project = {
  _id: string;
  topic: string;
  code: string;
};

// (Removed) ContributionCalendar component and related UI

export default function ContributorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [contributionData, setContributionData] = useState<ContributionData | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("Completed");

  useEffect(() => {
    const token = typeof window !== 'undefined' ? (sessionStorage.getItem('token') || localStorage.getItem('token')) : null;
    if (!token) {
      router.replace('/login');
      return;
    }

    // Get project_id from query params
    const projectIdFromUrl = searchParams.get('project_id');
    if (projectIdFromUrl) {
      setSelectedProject(projectIdFromUrl);
    }

    // Fetch projects for filter
    (async () => {
      try {
        const projectsRes = await axiosInstance.get('/api/projects');
        if (projectsRes.data.projects) {
          setProjects(projectsRes.data.projects);
        }
      } catch (e) {
        console.error('Error fetching projects:', e);
      }
    })();
  }, [router, searchParams]);

  useEffect(() => {
    fetchData();
  }, [selectedProject, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch contribution data
      const contributionParams = new URLSearchParams();
      if (selectedProject) contributionParams.append('project_id', selectedProject);
      
      const contributionRes = await axiosInstance.get(`/api/tasks/dashboard/contribution?${contributionParams.toString()}`);
      setContributionData(contributionRes.data);
      console.log("contributionRes.data", contributionRes.data)

      // Fetch statistics
      const statsParams = new URLSearchParams();
      if (selectedProject) statsParams.append('project_id', selectedProject);
      
      const statsRes = await axiosInstance.get(`/api/tasks/statistics?${statsParams.toString()}`);
      setStatistics(statsRes.data);
      console.log(statsRes.data)
    } catch (e: unknown) {
      const error = e as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // Get top contributors
  const topContributors = contributionData?.contributors?.slice(0, 5) || [];
  
  // Get status stats from statistics API
  const statusStats = statistics?.statistics?.status || {};
  
  // Status colors mapping
  const STATUS_COLORS: { [key: string]: string } = {
    'Planning': '#6b7280',      // Gray
    'In Progress': '#3b82f6',   // Blue
    'Testing': '#a855f7',       // Purple
    'Completed': '#10b981',     // Green
    'Cancelled': '#ef4444',     // Red
    'On Hold': '#f59e0b',       // Amber
  };

  // Prepare status summary data for charts and cards
  const statusSummaryData = [
    { name: "Planning", value: statusStats['Planning'] || 0, color: STATUS_COLORS['Planning'] },
    { name: "In Progress", value: statusStats['In Progress'] || 0, color: STATUS_COLORS['In Progress'] },
    { name: "Testing", value: statusStats['Testing'] || 0, color: STATUS_COLORS['Testing'] },
    { name: "Completed", value: statusStats['Completed'] || 0, color: STATUS_COLORS['Completed'] },
    { name: "Cancelled", value: statusStats['Cancelled'] || 0, color: STATUS_COLORS['Cancelled'] },
    { name: "On Hold", value: statusStats['On Hold'] || 0, color: STATUS_COLORS['On Hold'] },
  ].filter(item => item.value > 0);

  // Prepare chart data for status distribution by contributor
  // Note: This requires status breakdown per contributor, which we don't have in current API
  // For now, we'll show overall status distribution
  const statusChartData = statusSummaryData.map(item => ({
    name: item.name,
    value: item.value,
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <ResponsiveSidebar />
        <main className="p-4 md:p-6 md:ml-64">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải thống kê đóng góp...</p>
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
                onClick={fetchData}
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

  const totalTasks = contributionData?.contributors?.reduce((sum, c) => sum + c.total_tasks, 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <ResponsiveSidebar />
      <main className="p-4 md:p-6 md:ml-64">
        {/* Header */}
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 p-8 shadow-xl mb-6">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mb-32"></div>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium mb-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Contributor Statistics
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Thống kê Đóng góp 📊</h1>
              <p className="text-cyan-100">Theo dõi và phân tích đóng góp của các thành viên trong dự án</p>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="flex justify-end">
            <QuickNav selectedProject={selectedProject} />
          </div>
        </div>

    

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {/* Tổng Task */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-blue-200 text-sm mb-1">Tổng Task</p>
                <p className="text-4xl font-bold">{statistics?.statistics?.total || 0}</p>
              </div>
              <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-sm text-blue-200">
              {contributionData?.contributors?.length || 0} thành viên đóng góp
            </p>
          </div>

          {/* Planning Tasks */}
          <div className="bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl p-6 text-white shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-200 text-sm mb-1">Planning</p>
                <p className="text-4xl font-bold">{statusStats['Planning'] || 0}</p>
              </div>
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <p className="text-sm text-gray-200">Đang lập kế hoạch</p>
          </div>

          {/* In Progress Tasks */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-blue-200 text-sm mb-1">In Progress</p>
                <p className="text-4xl font-bold">{statusStats['In Progress'] || 0}</p>
              </div>
              <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-sm text-blue-200">Đang thực hiện</p>
          </div>

          {/* Testing Tasks */}
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-purple-200 text-sm mb-1">Testing</p>
                <p className="text-4xl font-bold">{statusStats['Testing'] || 0}</p>
              </div>
              <svg className="w-8 h-8 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-purple-200">Đang kiểm thử</p>
          </div>

          {/* Completed Tasks */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-6 text-white shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-emerald-200 text-sm mb-1">Completed</p>
                <p className="text-4xl font-bold">{statusStats['Completed'] || 0}</p>
              </div>
              <svg className="w-8 h-8 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-emerald-200">
              {statistics?.statistics?.total 
                ? Math.round((statusStats['Completed'] || 0) / statistics.statistics.total * 100)
                : 0}% hoàn thành
            </p>
          </div>

          {/* Cancelled Tasks */}
          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-6 text-white shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-red-200 text-sm mb-1">Cancelled</p>
                <p className="text-4xl font-bold">{statusStats['Cancelled'] || 0}</p>
              </div>
              <svg className="w-8 h-8 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-sm text-red-200">Đã hủy</p>
          </div>

          {/* On Hold Tasks */}
          <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-xl p-6 text-white shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-amber-200 text-sm mb-1">On Hold</p>
                <p className="text-4xl font-bold">{statusStats['On Hold'] || 0}</p>
              </div>
              <svg className="w-8 h-8 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-amber-200">Tạm dừng</p>
          </div>
        </div>

        

        {/* Contributors with Calendar */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Chi tiết từng Thành viên</h2>
          {contributionData?.contributors && contributionData.contributors.length > 0 ? (
            <div className="space-y-4">
              {contributionData.contributors.map((contributor, index) => {
                return (
                  <div
                    key={contributor.assignee_id}
                    className="bg-white rounded-xl border border-gray-200 p-6 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                    onClick={() => {
                      const params = new URLSearchParams();
                      params.set('userId', contributor.user?._id || contributor.assignee_id);
                      if (selectedProject) params.set('project_id', selectedProject);
                      router.push(`/supervisor/contributor/detail?${params.toString()}`);
                    }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                      {/* Member Info */}
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                          {index + 1 <= 3 ? (index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉') : `${index + 1}`}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{contributor.user?.full_name || 'Không có tên'}</p>
                          <p className="text-sm text-gray-500">{contributor.user?.email || ''}</p>
                        </div>
                      </div>

                      {/* Type Breakdown */}
                      <div className="grid grid-cols-2 gap-2">
                        {(() => {
                          const simpleCount = contributor.type_breakdown?.find(t => t.type_name === 'Simple')?.count || 0;
                          const mediumCount = contributor.type_breakdown?.find(t => t.type_name === 'Medium')?.count || 0;
                          const complexCount = contributor.type_breakdown?.find(t => t.type_name === 'Complex')?.count || 0;
                          const veryComplexCount = contributor.type_breakdown?.find(t => t.type_name === 'Very Complex')?.count || 0;
                          
                          return (
                            <>
                              <div className="bg-blue-50 rounded p-3 border border-blue-200">
                                <p className="text-xs text-gray-500">Simple</p>
                                <p className="text-xl font-bold text-blue-600">{simpleCount}</p>
                              </div>
                              <div className="bg-indigo-50 rounded p-3 border border-indigo-200">
                                <p className="text-xs text-gray-500">Medium</p>
                                <p className="text-xl font-bold text-indigo-600">{mediumCount}</p>
                              </div>
                              <div className="bg-purple-50 rounded p-3 border border-purple-200">
                                <p className="text-xs text-gray-500">Complex</p>
                                <p className="text-xl font-bold text-purple-600">{complexCount}</p>
                              </div>
                              <div className="bg-pink-50 rounded p-3 border border-pink-200">
                                <p className="text-xs text-gray-500">Very Complex</p>
                                <p className="text-lg font-bold text-pink-600">{veryComplexCount}</p>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Total and Completed */}
                      <div className="space-y-2">
                        <div className="bg-blue-50 rounded p-3 border border-blue-200">
                          <p className="text-xs text-gray-500">Tổng Task</p>
                          <p className="text-2xl font-bold text-blue-600">{contributor.total_tasks}</p>
                        </div>
                        <div className="bg-emerald-50 rounded p-3 border border-emerald-200">
                          <p className="text-xs text-gray-500">Đã Hoàn Thành</p>
                          <p className="text-2xl font-bold text-emerald-600">{contributor.completed_tasks || 0}</p>
                        </div>
                        <div className="bg-gray-50 rounded p-3 border border-gray-200">
                          <p className="text-xs text-gray-500">Tỷ lệ</p>
                          <p className="text-lg font-bold text-gray-700">
                            {contributor.total_tasks > 0 
                              ? Math.round((contributor.completed_tasks || 0) / contributor.total_tasks * 100)
                              : 0}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-600">Chưa có dữ liệu đóng góp</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
