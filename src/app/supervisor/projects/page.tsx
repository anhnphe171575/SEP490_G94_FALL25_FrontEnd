"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "../../../../ultis/axios";
import ResponsiveSidebar from "../../../components/ResponsiveSidebar";
import QuickNav from "@/components/QuickNav";

type Project = {
  _id: string;
  topic: string;
  code: string;
  description?: string;
  status?: string;
  progress?: number;
  lastUpdated?: string;
  semester?: string;
  createdAt?: string;
  updatedAt?: string;
  created_by?: {
    _id: string;
    full_name: string;
    email: string;
  };
  supervisor_id?: {
    _id: string;
    full_name: string;
    email: string;
  };
};

type SemesterGroup = {
  semester: string;
  count: number;
  projects: Project[];
};

// Helper function to check if project is in progress
const isProjectInProgress = (project: Project): boolean => {
  return project.status === 'on-hold' || project.status === 'planned' || project.status === 'active';
};

// Helper function to get year from semester name for sorting
const getSemesterYear = (semester: string): number => {
  const match = semester.match(/(\d{4})/);
  return match ? parseInt(match[1]) : 0;
};

// Project Card Component
const ProjectCard = ({ project, router }: {
  project: Project;
  router: { push: (path: string) => void };
}) => (
  <div
    className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transform hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
    onClick={() => router.push(`/supervisor/contributor?project_id=${project._id}`)}
  >
    <div className="flex items-start justify-between mb-4">
      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <div className="flex flex-col gap-1">
        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
          {project.code || 'N/A'}
        </span>
        {project.semester && (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full text-center">
            {project.semester}
          </span>
        )}
      </div>
    </div>

    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors duration-200">
      {project.topic || 'Dự án không có tên'}
    </h3>

    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
      {project.description || 'Theo dõi tiến độ, quản lý milestone và tài liệu dự án.'}
    </p>

    {/* Created by info */}
    {project.created_by && (
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500 mb-1">Tạo bởi:</p>
        <p className="text-sm font-medium text-gray-900">{project.created_by.full_name}</p>
        <p className="text-xs text-gray-600">{project.created_by.email}</p>
      </div>
    )}

    {/* Status badge */}
    <div className="mb-4">
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
        project.status === 'active' ? 'bg-green-100 text-green-700' :
        project.status === 'completed' ? 'bg-blue-100 text-blue-700' :
        project.status === 'on-hold' ? 'bg-yellow-100 text-yellow-700' :
        project.status === 'planned' ? 'bg-gray-100 text-gray-700' :
        'bg-red-100 text-red-700'
      }`}>
        {project.status === 'active' ? 'Đang thực hiện' :
         project.status === 'completed' ? 'Đã hoàn thành' :
         project.status === 'on-hold' ? 'Tạm dừng' :
         project.status === 'planned' ? 'Đã lên kế hoạch' :
         project.status === 'cancelled' ? 'Đã hủy' : 'Không xác định'}
      </span>
    </div>

    {project.progress !== undefined && (
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Tiến độ</span>
          <span className="font-medium text-gray-900">{project.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${project.progress}%` }}
          ></div>
        </div>
      </div>
    )}

    <div className="pt-4 border-t border-gray-200">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {project.updatedAt ? new Date(project.updatedAt).toLocaleDateString('vi-VN') : 'Vừa cập nhật'}
      </div>

      {/* Open project button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/supervisor/contributor?project_id=${project._id}`);
        }}
        className="w-full text-purple-500 hover:text-purple-600 font-medium text-sm transition-colors duration-200 text-center py-2 border border-purple-200 hover:bg-purple-50 rounded-lg"
      >
        Xem chi tiết →
      </button>
    </div>
  </div>
);

export default function DashboardSupervisorPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [semesterGroups, setSemesterGroups] = useState<SemesterGroup[]>([]);
  const [userInfo, setUserInfo] = useState<{ _id: string; full_name?: string; email?: string } | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? (sessionStorage.getItem('token') || localStorage.getItem('token')) : null;
    if (!token) {
      router.replace('/login');
      return;
    }

    (async () => {
      try {
        // First, get current user info to get mentor ID
        const profileResponse = await axiosInstance.get('/api/users/profile');
        const userData = profileResponse.data;
        setUserInfo({
          _id: userData._id,
          full_name: userData.full_name,
          email: userData.email
        });

        // Then get projects by mentor
        const response = await axiosInstance.get(`/api/projects/mentor/${userData._id}`);
        const data = response.data;

        if (data.success && data.data) {
          const projectsList = Array.isArray(data.data) ? data.data : [];
          
          if (projectsList.length === 0) {
            setProjects([]);
            setSemesterGroups([]);
            setLoading(false);
            return;
          }

          setProjects(projectsList);

          // Group projects by semester
          const groups = projectsList.reduce((acc: { [key: string]: Project[] }, project: Project) => {
            const semester = project.semester || 'Unknown';
            if (!acc[semester]) acc[semester] = [];
            acc[semester].push(project);
            return acc;
          }, {});

          const semesterGroups = Object.keys(groups).map(semester => ({
            semester,
            count: groups[semester].length,
            projects: groups[semester].sort((a: Project, b: Project) => {
              const dateA = new Date(a.createdAt || a.updatedAt || 0);
              const dateB = new Date(b.createdAt || b.updatedAt || 0);
              return dateB.getTime() - dateA.getTime();
            })
          })).sort((a: SemesterGroup, b: SemesterGroup) => {
            return getSemesterYear(b.semester) - getSemesterYear(a.semester);
          });

          setSemesterGroups(semesterGroups);
        } else {
          setProjects([]);
          setSemesterGroups([]);
        }
      } catch (e: unknown) {
        const error = e as { response?: { status?: number; data?: { message?: string } } };
        if (error?.response?.status === 404 || error?.response?.status === 403) {
          setProjects([]);
          setSemesterGroups([]);
        } else {
          setError(error?.response?.data?.message || 'Không thể tải danh sách dự án');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  // Filter projects based on search term and semester
  const filteredProjects = projects?.filter(project => {
    const matchesSearch = (project.topic?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (project.code?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (project.created_by?.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesSemester = selectedSemester === "all" || project.semester === selectedSemester;
    return matchesSearch && matchesSemester;
  }).sort((a, b) => {
    const dateA = new Date(a.createdAt || a.updatedAt || 0);
    const dateB = new Date(b.createdAt || b.updatedAt || 0);
    return dateB.getTime() - dateA.getTime();
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <ResponsiveSidebar />
        <main className="p-4 md:p-6 md:ml-64">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải danh sách dự án...</p>
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

  if (!projects) return null;

  return (
    <div className="min-h-screen bg-white">
      <ResponsiveSidebar />
      <main className="p-4 md:p-6 md:ml-64">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Dashboard Giảng viên 👨‍🏫
              </h1>
              <p className="text-gray-600">
                Quản lý và theo dõi các dự án bạn đang hướng dẫn
              </p>
              {userInfo && (
                <p className="text-sm text-gray-500 mt-1">
                  {userInfo.full_name} ({userInfo.email})
                </p>
              )}
            </div>
            <QuickNav />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
                  <p className="text-sm text-gray-600">Tổng dự án</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{semesterGroups.length}</p>
                  <p className="text-sm text-gray-600">Kỳ học</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {projects.filter(p => p.status === 'completed' || p.status === 'cancelled').length}
                  </p>
                  <p className="text-sm text-gray-600">Đã hoàn thành</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {projects.filter(isProjectInProgress).length}
                  </p>
                  <p className="text-sm text-gray-600">Đang thực hiện</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search Bar */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm dự án hoặc sinh viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-all duration-200"
              />
            </div>

            {/* Semester Filter */}
            <div className="md:w-64">
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900 transition-all duration-200"
              >
                <option value="all">Tất cả kỳ học</option>
                {semesterGroups.map((group) => (
                  <option key={group.semester} value={group.semester}>
                    {group.semester} ({group.count} dự án)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Projects by Semester */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || selectedSemester !== "all" ? 'Không tìm thấy dự án' : 'Chưa có dự án nào'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedSemester !== "all" 
                ? 'Thử tìm kiếm với từ khóa khác hoặc chọn kỳ học khác' 
                : 'Bạn chưa được gán làm giảng viên hướng dẫn cho dự án nào'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {selectedSemester === "all" ? (
              // Hiển thị theo từng kỳ học
              semesterGroups.map((group) => (
                <div key={group.semester} className="space-y-4">
                  {/* Semester Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{group.semester}</h2>
                        <p className="text-sm text-gray-600">
                          {group.count} dự án
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Projects Grid for this semester */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {group.projects
                      .filter(project => {
                        const matchesSearch = (project.topic?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (project.code?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (project.created_by?.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
                        return matchesSearch;
                      })
                      .map((project) => (
                        <ProjectCard key={project._id} project={project} router={router} />
                      ))}
                  </div>
                </div>
              ))
            ) : (
              // Hiển thị tất cả projects khi filter
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <ProjectCard key={project._id} project={project} router={router} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
