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
  breakdown: Array<{
    priority_id: string;
    priority_name: string;
    priority_value: string;
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
  
  // Get priority stats
  const getPriorityStats = () => {
    if (!contributionData?.contributors) return { Low: 0, Medium: 0, High: 0, 'Very High': 0 };
    const stats: { [key: string]: number } = {};
    contributionData.contributors.forEach(contributor => {
      contributor.breakdown.forEach(item => {
        const name = item.priority_name || 'Unknown';
        stats[name] = (stats[name] || 0) + item.count;
      });
    });
    return stats;
  };

  const priorityStats = getPriorityStats();

  // Prepare chart data
  const comparisonData = contributionData?.contributors?.slice(0, 10).map((c) => {
    const low = c.breakdown.find(b => b.priority_name?.toLowerCase().includes('low'))?.count || 0;
    const medium = c.breakdown.find(b => b.priority_name?.toLowerCase().includes('medium'))?.count || 0;
    const high = c.breakdown.find(b => b.priority_name?.toLowerCase() === 'high')?.count || 0;
    const veryHigh = c.breakdown.find(b => b.priority_name?.toLowerCase().includes('very high'))?.count || 0;
    
    return {
      name: c.user?.full_name?.split(' ').pop() || 'N/A',
      Low: low,
      Medium: medium,
      High: high,
      'Very High': veryHigh,
    };
  }) || [];

  const summaryData = [
    { name: "Low", value: priorityStats['Low'] || 0, color: "#22c55e" },
    { name: "Medium", value: priorityStats['Medium'] || 0, color: "#f59e0b" },
    { name: "High", value: priorityStats['High'] || 0, color: "#ef4444" },
    { name: "Very High", value: priorityStats['Very High'] || 0, color: "#dc2626" },
  ].filter(item => item.value > 0);

  const COLORS = {
    low: "#22c55e",
    medium: "#f59e0b",
    high: "#ef4444",
    veryHigh: "#dc2626",
  };

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

          {/* Low Priority Tasks */}
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-green-200 text-sm mb-1">Low Priority</p>
                <p className="text-4xl font-bold">{summaryData.find(s => s.name === 'Low')?.value || 0}</p>
              </div>
              <svg className="w-8 h-8 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </div>
            <p className="text-sm text-green-200">Ưu tiên thấp</p>
          </div>

          {/* Medium Priority Tasks */}
          <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-xl p-6 text-white shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-amber-200 text-sm mb-1">Medium Priority</p>
                <p className="text-4xl font-bold">{summaryData.find(s => s.name === 'Medium')?.value || 0}</p>
              </div>
              <svg className="w-8 h-8 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-sm text-amber-200">Ưu tiên trung bình</p>
          </div>

          {/* High Priority Tasks */}
          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-6 text-white shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-red-200 text-sm mb-1">High Priority</p>
                <p className="text-4xl font-bold">{summaryData.find(s => s.name === 'High')?.value || 0}</p>
              </div>
              <svg className="w-8 h-8 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-sm text-red-200">Ưu tiên cao</p>
          </div>
        </div>

        {/* Charts Row */}
        {comparisonData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Comparison Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Phân bố Priority theo Thành viên</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: "12px" }} />
                  <YAxis stroke="#64748b" style={{ fontSize: "12px" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #cbd5e1" }}
                    labelStyle={{ color: "#0f172a" }}
                  />
                  <Legend />
                  <Bar dataKey="Low" fill={COLORS.low} name="Low" />
                  <Bar dataKey="Medium" fill={COLORS.medium} name="Medium" />
                  <Bar dataKey="High" fill={COLORS.high} name="High" />
                  <Bar dataKey="Very High" fill={COLORS.veryHigh} name="Very High" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Priority Distribution Pie Chart */}
            {summaryData.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Tỷ lệ Priority</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={summaryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {summaryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #cbd5e1" }}
                      labelStyle={{ color: "#0f172a" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Contributors with Calendar */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Chi tiết từng Thành viên</h2>
          {contributionData?.contributors && contributionData.contributors.length > 0 ? (
            <div className="space-y-4">
              {contributionData.contributors.map((contributor, index) => {
                const lowCount = contributor.breakdown.find(b => 
                  b.priority_name?.toLowerCase().includes('low')
                )?.count || 0;
                const mediumCount = contributor.breakdown.find(b => 
                  b.priority_name?.toLowerCase().includes('medium') && 
                  !b.priority_name?.toLowerCase().includes('very')
                )?.count || 0;
                const highCount = contributor.breakdown.find(b => 
                  b.priority_name?.toLowerCase() === 'high'
                )?.count || 0;
                const veryHighCount = contributor.breakdown.find(b => 
                  b.priority_name?.toLowerCase().includes('very high')
                )?.count || 0;

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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
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

                      {/* Priority Counts */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-green-50 rounded p-3 border border-green-200">
                          <p className="text-xs text-gray-500">Low</p>
                          <p className="text-xl font-bold text-green-600">{lowCount}</p>
                        </div>
                        <div className="bg-amber-50 rounded p-3 border border-amber-200">
                          <p className="text-xs text-gray-500">Medium</p>
                          <p className="text-xl font-bold text-amber-600">{mediumCount}</p>
                        </div>
                        <div className="bg-red-50 rounded p-3 border border-red-200">
                          <p className="text-xs text-gray-500">High</p>
                          <p className="text-xl font-bold text-red-600">{highCount}</p>
                        </div>
                        <div className="bg-red-50 rounded p-3 border border-red-300">
                          <p className="text-xs text-gray-500">Very High</p>
                          <p className="text-lg font-bold text-red-700">{veryHighCount}</p>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="bg-blue-50 rounded p-3 border border-blue-200">
                        <p className="text-xs text-gray-500">Tổng Task</p>
                        <p className="text-2xl font-bold text-blue-600">{contributor.total_tasks}</p>
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
