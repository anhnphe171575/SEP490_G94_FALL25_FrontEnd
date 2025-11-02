"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axiosInstance from "../../../../ultis/axios";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";
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
    task_type_id: string;
    task_type_name: string;
    task_type_value: number;
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

// Contribution Calendar Component (GitHub-style)
const ContributionCalendar = ({ assigneeId, projectId }: { assigneeId: string; projectId?: string }) => {
  const [calendarData, setCalendarData] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [hoverDate, setHoverDate] = useState<{ date: string; count: number } | null>(null);

  useEffect(() => {
    fetchCalendarData();
  }, [assigneeId, projectId]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (projectId) params.append('project_id', projectId);
      if (assigneeId) params.append('assignee_id', assigneeId);

      const response = await axiosInstance.get(`/api/tasks/dashboard/contribution/calendar?${params.toString()}`);
      
      if (response.data.calendar) {
        setCalendarData(response.data.calendar);
      } else {
        setCalendarData({});
      }
    } catch (e) {
      console.error('Error fetching calendar data:', e);
      setCalendarData({});
    } finally {
      setLoading(false);
    }
  };

  const getIntensityColor = (count: number) => {
    if (count === 0) return 'bg-gray-100 hover:bg-gray-200';
    if (count === 1) return 'bg-green-200 hover:bg-green-300';
    if (count === 2) return 'bg-green-400 hover:bg-green-500';
    if (count === 3) return 'bg-green-600 hover:bg-green-700';
    return 'bg-green-800 hover:bg-green-900';
  };

  const generateCalendarDays = () => {
    const days: Array<{ date: Date; count: number } | null> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get the date 364 days ago
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364);
    
    // Find the Sunday of that week
    const startDayOfWeek = startDate.getDay();
    const daysToSunday = startDayOfWeek === 0 ? 0 : 7 - startDayOfWeek;
    startDate.setDate(startDate.getDate() + daysToSunday);
    
    // Generate all days (including padding days before start)
    const totalDays = 371; // 53 weeks * 7 days
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      if (date > today) {
        days.push(null); // Future date
      } else {
        const dateKey = date.toISOString().split('T')[0];
        days.push({
          date,
          count: calendarData[dateKey] || 0
        });
      }
    }
    return days;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse mt-4">
        <div className="h-24 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const days = generateCalendarDays();
  const weeks: Array<Array<{ date: Date; count: number } | null>> = [];
  
  // Group days into weeks
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-700">Đóng góp trong năm qua</span>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Ít hơn</span>
          <div className="flex gap-0.5">
            <div className="w-2.5 h-2.5 bg-gray-100 rounded"></div>
            <div className="w-2.5 h-2.5 bg-green-200 rounded"></div>
            <div className="w-2.5 h-2.5 bg-green-400 rounded"></div>
            <div className="w-2.5 h-2.5 bg-green-600 rounded"></div>
            <div className="w-2.5 h-2.5 bg-green-800 rounded"></div>
          </div>
          <span>Nhiều hơn</span>
        </div>
      </div>
      
      <div className="relative">
        {/* Tooltip */}
        {hoverDate && (
          <div 
            className="absolute z-50 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-xl pointer-events-none"
            style={{
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginBottom: '8px'
            }}
          >
            <p className="font-semibold text-white">{hoverDate.count} task{hoverDate.count !== 1 ? 's' : ''}</p>
            <p className="text-gray-300">{hoverDate.date}</p>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        )}

        {/* Calendar Grid */}
        <div className="flex gap-1 overflow-x-auto pb-2" style={{ minWidth: 'fit-content' }}>
          {/* Week labels */}
          <div className="flex flex-col gap-1 mr-2 text-xs text-gray-500" style={{ paddingTop: '14px' }}>
            <span className="h-2.5"></span>
            <span className="h-2.5">T2</span>
            <span className="h-2.5"></span>
            <span className="h-2.5">T4</span>
            <span className="h-2.5"></span>
            <span className="h-2.5">T6</span>
          </div>

          {/* Weeks */}
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-1">
              {week.map((day, dayIdx) => {
                if (!day) {
                  return (
                    <div
                      key={`${weekIdx}-${dayIdx}`}
                      className="w-2.5 h-2.5 rounded opacity-0"
                    />
                  );
                }
                
                const dateKey = day.date.toISOString().split('T')[0];
                
                return (
                  <div
                    key={`${weekIdx}-${dayIdx}`}
                    className={`w-2.5 h-2.5 rounded ${getIntensityColor(day.count)} cursor-pointer transition-all`}
                    onMouseEnter={() => setHoverDate({ date: formatDate(day.date), count: day.count })}
                    onMouseLeave={() => setHoverDate(null)}
                    title={`${formatDate(day.date)}: ${day.count} task${day.count !== 1 ? 's' : ''}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

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

      // Fetch statistics
      const statsParams = new URLSearchParams();
      if (selectedProject) statsParams.append('project_id', selectedProject);
      
      const statsRes = await axiosInstance.get(`/api/tasks/statistics?${statsParams.toString()}`);
      setStatistics(statsRes.data);
    } catch (e: unknown) {
      const error = e as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // Get top contributors
  const topContributors = contributionData?.contributors?.slice(0, 5) || [];
  
  // Get task type stats
  const getTaskTypeStats = () => {
    if (!contributionData?.contributors) return { Simple: 0, Medium: 0, Complex: 0 };
    const stats: { [key: string]: number } = {};
    contributionData.contributors.forEach(contributor => {
      contributor.breakdown.forEach(item => {
        const name = item.task_type_name || 'Unknown';
        stats[name] = (stats[name] || 0) + item.count;
      });
    });
    return stats;
  };

  const taskTypeStats = getTaskTypeStats();

  // Prepare chart data
  const comparisonData = contributionData?.contributors?.slice(0, 10).map((c) => {
    const simple = c.breakdown.find(b => b.task_type_name?.toLowerCase().includes('simple'))?.count || 0;
    const medium = c.breakdown.find(b => b.task_type_name?.toLowerCase().includes('medium'))?.count || 0;
    const complex = c.breakdown.find(b => b.task_type_name?.toLowerCase().includes('complex'))?.count || 0;
    
    return {
      name: c.user?.full_name?.split(' ').pop() || 'N/A',
      Simple: simple,
      Medium: medium,
      Complex: complex,
    };
  }) || [];

  const summaryData = [
    { name: "Simple", value: taskTypeStats['Simple'] || 0, color: "#22c55e" },
    { name: "Medium", value: taskTypeStats['Medium'] || 0, color: "#f59e0b" },
    { name: "Complex", value: taskTypeStats['Complex'] || 0, color: "#ef4444" },
  ].filter(item => item.value > 0);

  const COLORS = {
    simple: "#22c55e",
    medium: "#f59e0b",
    complex: "#ef4444",
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
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Thống kê Đóng góp 📊
          </h1>
          <p className="text-gray-600">
            Theo dõi và phân tích đóng góp của các thành viên trong dự án
          </p>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Bộ lọc</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dự án
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="">Tất cả dự án</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.code} - {project.topic}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 text-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-blue-200 text-sm">Tổng Task</p>
                <p className="text-3xl font-bold">{statistics?.statistics?.total || 0}</p>
              </div>
              <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-sm text-blue-200">
              {contributionData?.contributors?.length || 0} thành viên đóng góp
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-6 text-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-green-200 text-sm">Simple Tasks</p>
                <p className="text-3xl font-bold">{summaryData.find(s => s.name === 'Simple')?.value || 0}</p>
              </div>
            </div>
            <p className="text-sm text-green-200">Công việc đơn giản</p>
          </div>

          <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-lg p-6 text-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-amber-200 text-sm">Medium Tasks</p>
                <p className="text-3xl font-bold">{summaryData.find(s => s.name === 'Medium')?.value || 0}</p>
              </div>
            </div>
            <p className="text-sm text-amber-200">Công việc trung bình</p>
          </div>

          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-lg p-6 text-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-red-200 text-sm">Complex Tasks</p>
                <p className="text-3xl font-bold">{summaryData.find(s => s.name === 'Complex')?.value || 0}</p>
              </div>
            </div>
            <p className="text-sm text-red-200">Công việc phức tạp</p>
          </div>
        </div>

        {/* Charts Row */}
        {comparisonData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Comparison Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Phân bố Task theo Thành viên</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: "12px" }} />
                  <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #cbd5e1" }}
                    labelStyle={{ color: "#0f172a" }}
                  />
                  <Legend />
                  <Bar dataKey="Simple" fill={COLORS.simple} name="Simple" />
                  <Bar dataKey="Medium" fill={COLORS.medium} name="Medium" />
                  <Bar dataKey="Complex" fill={COLORS.complex} name="Complex" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Task Distribution Pie Chart */}
            {summaryData.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Tỷ lệ Task</h2>
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
                const simpleCount = contributor.breakdown.find(b => 
                  b.task_type_name?.toLowerCase().includes('simple') || 
                  b.task_type_value === 1
                )?.count || 0;
                const mediumCount = contributor.breakdown.find(b => 
                  b.task_type_name?.toLowerCase().includes('medium') || 
                  b.task_type_value === 2
                )?.count || 0;
                const complexCount = contributor.breakdown.find(b => 
                  b.task_type_name?.toLowerCase().includes('complex') || 
                  b.task_type_value >= 3
                )?.count || 0;

                return (
                  <div
                    key={contributor.assignee_id}
                    className="bg-white rounded-xl border border-gray-200 p-6 hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
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

                      {/* Task Counts */}
                      <div className="flex gap-2">
                        <div className="flex-1 bg-green-50 rounded p-3 border border-green-200">
                          <p className="text-xs text-gray-500">Simple</p>
                          <p className="text-xl font-bold text-green-600">{simpleCount}</p>
                        </div>
                        <div className="flex-1 bg-amber-50 rounded p-3 border border-amber-200">
                          <p className="text-xs text-gray-500">Medium</p>
                          <p className="text-xl font-bold text-amber-600">{mediumCount}</p>
                        </div>
                        <div className="flex-1 bg-red-50 rounded p-3 border border-red-200">
                          <p className="text-xs text-gray-500">Complex</p>
                          <p className="text-xl font-bold text-red-600">{complexCount}</p>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="bg-blue-50 rounded p-3 border border-blue-200">
                        <p className="text-xs text-gray-500">Tổng Task</p>
                        <p className="text-2xl font-bold text-blue-600">{contributor.total_tasks}</p>
                      </div>

                      {/* Contribution Calendar */}
                      <div className="md:col-span-2">
                        <ContributionCalendar assigneeId={contributor.assignee_id} projectId={selectedProject || undefined} />
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
