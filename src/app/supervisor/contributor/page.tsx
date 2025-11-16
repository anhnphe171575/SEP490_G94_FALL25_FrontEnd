"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axiosInstance from "../../../../ultis/axios";
import ResponsiveSidebar from "../../../components/ResponsiveSidebar";
import QuickNav from "@/components/QuickNav";

type TypeKey = "Simple" | "Medium" | "Complex" | "Very Complex";

type TypeCounts = Record<TypeKey, number>;

type MemberInfo = {
  user_id: string | null;
  full_name: string;
  email: string | null;
  avatar: string | null;
};

type MemberContribution = {
  member: MemberInfo;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  todo_tasks: number;
  estimate_hours: number;
  actual_hours: number;
  type_counts: TypeCounts;
  completion_rate: number;
  workload_share: number;
  type_complexity_score?: number;
};

type ContributionResponse = {
  project_id: string;
  totals: {
    total_tasks: number;
    completed_tasks: number;
    in_progress_tasks: number;
    todo_tasks: number;
    total_estimate_hours: number;
    total_actual_hours: number;
    type_counts: TypeCounts;
  };
  members: MemberContribution[];
  unassigned: (MemberContribution & { member: MemberInfo }) | null;
  metadata: {
    feature_count: number;
    function_count: number;
    team_members: number;
  };
};

type ProjectOption = {
  value: string;
  label: string;
  code?: string;
};

type ProjectInfo = {
  _id: string;
  topic?: string;
  code?: string;
  description?: string;
  semester?: string;
  status?: string;
};

const TYPE_DISPLAY_ORDER: TypeKey[] = ["Very Complex", "Complex", "Medium", "Simple"];

const TYPE_BAR_COLOR: Record<TypeKey, string> = {
  Simple: "bg-slate-300",
  Medium: "bg-slate-400",
  Complex: "bg-slate-500",
  "Very Complex": "bg-slate-600",
};

const TYPE_BADGE_COLOR: Record<TypeKey, string> = {
  Simple: "bg-slate-100 text-slate-700",
  Medium: "bg-slate-200 text-slate-700",
  Complex: "bg-slate-300 text-slate-800",
  "Very Complex": "bg-slate-400 text-slate-900",
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  active: "bg-slate-200 text-slate-700",
  completed: "bg-slate-300 text-slate-800",
  "on-hold": "bg-slate-100 text-slate-600",
  planned: "bg-slate-100 text-slate-700",
  cancelled: "bg-slate-100 text-slate-600",
};

const formatNumber = (value: number | undefined) => {
  if (value === undefined || value === null || Number.isNaN(value)) return "0";
  return value.toLocaleString("vi-VN");
};

const formatPercent = (value: number | undefined) => {
  if (value === undefined || value === null || Number.isNaN(value)) return "0%";
  return `${value.toLocaleString("vi-VN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`;
};

const getInitials = (fullName: string) => {
  if (!fullName) return "U";
  const parts = fullName.split(" ").filter(Boolean);
  if (parts.length === 0) return fullName.charAt(0).toUpperCase();
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
};

const ContributionPlaceholder = ({ message }: { message: string }) => (
  <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-center">
    <svg className="mb-4 h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
    </svg>
    <p className="max-w-md text-sm text-slate-500">{message}</p>
  </div>
);

export default function ContributorDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project_id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  const [contribution, setContribution] = useState<ContributionResponse | null>(null);
  const [isFetchingProjects, setIsFetchingProjects] = useState(false);
  const [unassignedTasks, setUnassignedTasks] = useState<any[]>([]);
  const [loadingUnassignedTasks, setLoadingUnassignedTasks] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? sessionStorage.getItem("token") || localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    let ignore = false;

    const fetchProjects = async () => {
      try {
        setIsFetchingProjects(true);
        const profileResponse = await axiosInstance.get("/api/users/profile");
        const currentUser = profileResponse.data;

        const projectResponse = await axiosInstance.get(`/api/projects/supervisor/${currentUser._id}`);
        const data = projectResponse.data;

        const projectList: ProjectOption[] = Array.isArray(data?.data)
          ? data.data.map((proj: any) => ({
              value: proj._id,
              label: proj.topic || "Dự án không tên",
              code: proj.code,
            }))
          : [];

        if (!ignore) {
          setProjects(projectList);
        }

        // Auto-select first project if none provided and list not empty
        if (!projectId && projectList.length > 0) {
          router.replace(`/supervisor/contributor?project_id=${projectList[0].value}`, { scroll: false });
        }
      } catch (err: any) {
        console.error("Error loading projects:", err);
        if (!ignore) {
          setProjects([]);
        }
      } finally {
        if (!ignore) {
          setIsFetchingProjects(false);
        }
      }
    };

    fetchProjects();
    return () => {
      ignore = true;
    };
  }, [router]);

  useEffect(() => {
    if (!projectId) {
      setContribution(null);
      setProjectInfo(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchContribution = async () => {
      try {
        setLoading(true);
        setError(null);

        const [contributionRes, projectRes] = await Promise.all([
          axiosInstance.get(`/api/tasks/dashboard/contribution`, { params: { project_id: projectId } }),
          axiosInstance
            .get(`/api/projects/${projectId}`)
            .catch(() => ({ data: null })), // project info optional
        ]);

        if (cancelled) return;

        const contributionData = contributionRes.data as ContributionResponse;
        // Debug: Check user_id format in response
        if (contributionData?.members && contributionData.members.length > 0) {
          console.log('Sample member user_id:', contributionData.members[0].member.user_id, typeof contributionData.members[0].member.user_id);
        }
        setContribution(contributionData);
        setProjectInfo(projectRes?.data || null);
      } catch (err: any) {
        if (!cancelled) {
          console.error("Error fetching contribution:", err);
          setError(err?.response?.data?.message || "Không thể tải dữ liệu đóng góp");
          setContribution(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const fetchUnassignedTasks = async () => {
      if (!projectId) {
        setUnassignedTasks([]);
        return;
      }

      try {
        setLoadingUnassignedTasks(true);
        const tasksRes = await axiosInstance.get(`/api/projects/${projectId}/tasks`, { 
          params: { pageSize: 500 } 
        });
        
        const allTasks = Array.isArray(tasksRes.data) ? tasksRes.data : [];
        // Filter tasks without assignee_id
        const unassigned = allTasks.filter((task: any) => {
          // Check if assignee_id is null, undefined, empty string, or empty object
          if (!task.assignee_id) return true;
          if (typeof task.assignee_id === 'object' && Object.keys(task.assignee_id).length === 0) return true;
          if (typeof task.assignee_id === 'string' && task.assignee_id.trim() === '') return true;
          return false;
        });
        
        setUnassignedTasks(unassigned);
      } catch (err: any) {
        console.error("Error fetching unassigned tasks:", err);
        setUnassignedTasks([]);
      } finally {
        setLoadingUnassignedTasks(false);
      }
    };

    fetchContribution();
    fetchUnassignedTasks();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const typeDistribution = useMemo(() => {
    if (!contribution) {
      return {
        entries: [] as Array<{ type: TypeKey; count: number }>,
        total: 0,
      };
    }
    const entries = TYPE_DISPLAY_ORDER.map((type) => ({
      type,
      count: contribution.totals.type_counts[type],
    }));
    const total = entries.reduce((sum, entry) => sum + entry.count, 0);
    return {
      entries,
      total,
    };
  }, [contribution]);

  const handleProjectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (!value) {
      router.replace(`/supervisor/contributor`, { scroll: false });
    } else {
      router.replace(`/supervisor/contributor?project_id=${value}`, { scroll: false });
    }
  };

  const renderMemberRow = (member: MemberContribution, index: number) => {
    const avatarLetter = getInitials(member.member.full_name);
    // Extract user_id - handle both string and object formats
    let userId: string | null = null;
    const rawUserId = member.member.user_id;
    
    if (rawUserId) {
      if (typeof rawUserId === 'string') {
        // Already a string, use it directly
        userId = rawUserId.trim();
      } else if (typeof rawUserId === 'object' && rawUserId !== null) {
        // It's an object, extract _id
        const obj = rawUserId as any;
        if (obj._id) {
          userId = typeof obj._id === 'string' ? obj._id : obj._id.toString();
        } else if (obj.id) {
          userId = typeof obj.id === 'string' ? obj.id : obj.id.toString();
        } else {
          // Last resort: try toString but validate it's a valid ObjectId format
          const str = obj.toString?.();
          if (str && str.length === 24 && /^[0-9a-fA-F]{24}$/.test(str)) {
            userId = str;
          } else {
            console.warn('Cannot extract valid userId from object:', rawUserId);
            userId = null;
          }
        }
      }
    }
    
    // Final validation: ensure userId is a valid 24-character hex string (MongoDB ObjectId format)
    // But be more lenient - if it's a string and not empty, use it
    if (userId) {
      const trimmed = userId.trim();
      if (trimmed.length === 24 && /^[0-9a-fA-F]{24}$/.test(trimmed)) {
        userId = trimmed;
      } else if (trimmed.length > 0) {
        // If it's not a valid ObjectId but is a non-empty string, still use it (might be a different ID format)
        console.warn('userId is not in standard ObjectId format but using it anyway:', trimmed);
        userId = trimmed;
      } else {
        userId = null;
      }
    }
    
    // Debug logging for first member
    if (index === 0) {
      console.log('First member debug:', {
        rawUserId,
        userId,
        projectId,
        userIdType: typeof userId,
        userIdLength: userId?.length,
        willCreateHref: !!(userId && projectId)
      });
    }
    
    const detailHref =
      userId && projectId && typeof userId === 'string' && userId.length > 0
        ? `/supervisor/contributor/detail?userId=${encodeURIComponent(userId)}&project_id=${encodeURIComponent(projectId)}`
        : null;

    const topTypes = TYPE_DISPLAY_ORDER.filter((type) => member.type_counts[type] > 0).slice(0, 3);

    return (
      <tr key={`${member.member.user_id || "unassigned"}-${index}`} className="border-b last:border-b-0 border-slate-100">
        <td className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-semibold">
              {avatarLetter}
            </div>
            <div>
              <p className="font-medium text-slate-900">{member.member.full_name || "Chưa cập nhật"}</p>
              <p className="text-sm text-slate-500">{member.member.email || "Không có email"}</p>
            </div>
          </div>
        </td>

        <td className="px-4 py-4">
          <div className="flex items-end gap-3">
            <div>
              <p className="text-lg font-semibold text-slate-900">{formatNumber(member.completed_tasks)}</p>
              <p className="text-xs text-slate-500">Hoàn thành</p>
            </div>
            <div className="text-sm text-slate-500">/</div>
            <div>
              <p className="text-lg font-semibold text-slate-900">{formatNumber(member.total_tasks)}</p>
              <p className="text-xs text-slate-500">Tổng task</p>
            </div>
          </div>
        </td>

        <td className="px-4 py-4">
          <p className="text-lg font-semibold text-slate-900">{formatPercent(member.completion_rate)}</p>
          <p className="text-xs text-slate-500">Tỉ lệ hoàn thành</p>
        </td>

        <td className="px-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">Chiếm</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                {formatPercent(member.workload_share)}
              </span>
            </div>
            <div className="flex h-2 w-40 overflow-hidden rounded-full bg-slate-100">
              {TYPE_DISPLAY_ORDER.map((type) => {
                const total = member.total_tasks || 1;
                const share = member.type_counts[type] / total;
                if (share <= 0) return null;
                return (
                  <div
                    key={type}
                    className={TYPE_BAR_COLOR[type]}
                    style={{ width: `${Math.max(share * 100, 4)}%` }}
                    title={`${type}: ${member.type_counts[type]}`}
                  />
                );
              })}
            </div>
            <div className="flex flex-wrap gap-1">
              {topTypes.length === 0 ? (
                <span className="text-xs text-slate-400">Chưa có task theo loại</span>
              ) : (
                topTypes.map((type) => (
                  <span key={type} className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_BADGE_COLOR[type]}`}>
                    {type}: {member.type_counts[type]}
                  </span>
                ))
              )}
            </div>
          </div>
        </td>

        <td className="px-4 py-4">
          <div className="space-y-1 text-sm text-slate-500">
            <div>Ước tính: <span className="font-medium text-slate-700">{formatNumber(member.estimate_hours)}h</span></div>
            <div>Thực tế: <span className="font-medium text-slate-700">{formatNumber(member.actual_hours)}h</span></div>
          </div>
        </td>

        <td className="px-4 py-4 text-right">
          {detailHref ? (
            <button
              onClick={() => router.push(detailHref)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Chi tiết
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <span className="text-xs text-slate-400">Không khả dụng</span>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <ResponsiveSidebar />
      <div className="mx-auto w-full max-w-7xl px-6 py-8 md:ml-64">
          {/* QuickNav - Always at the top */}
          <div className="mb-6">
            <QuickNav selectedProject={projectId ?? undefined} />
          </div>
          
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Supervisor Dashboard</p>
              <h1 className="text-3xl font-bold text-slate-900">Bảng theo dõi đóng góp</h1>
              <p className="mt-2 text-sm text-slate-500">
                Giám sát hiệu suất của từng thành viên, phân bổ khối lượng công việc và chất lượng hoàn thành trong dự án.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <label className="sr-only" htmlFor="project-select">
                  Chọn dự án
                </label>
                <select
                  id="project-select"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  value={projectId ?? ""}
                  onChange={handleProjectChange}
                  disabled={isFetchingProjects}
                >
                  <option value="">{isFetchingProjects ? "Đang tải dự án..." : "Chọn dự án"}</option>
                  {projects.map((project) => (
                    <option key={project.value} value={project.value}>
                      {project.label} {project.code ? `(${project.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Không thể tải dữ liệu</h2>
                  <p className="mt-1 text-sm text-slate-600">{error}</p>
                </div>
              </div>
            </div>
          )}

          {!projectId && !loading && (
            <ContributionPlaceholder message="Hãy chọn một dự án để xem thông tin đóng góp của các thành viên." />
          )}

          {loading ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8">
              <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600" />
                <p className="text-sm font-medium text-slate-500">Đang tải dữ liệu đóng góp...</p>
              </div>
            </div>
          ) : contribution ? (
            <div className="space-y-6">
              <section className="rounded-lg border border-slate-200 bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      {projectInfo?.topic || "Thông tin dự án"}
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                      {projectInfo?.code && <span>Mã: <strong className="text-slate-700">{projectInfo.code}</strong></span>}
                      {projectInfo?.semester && (
                        <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                          {projectInfo.semester}
                        </span>
                      )}
                      {projectInfo?.status && (
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            STATUS_BADGE_CLASSES[String(projectInfo.status).toLowerCase()] || "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {projectInfo.status}
                        </span>
                      )}
                    </div>
                    {projectInfo?.description && (
                      <p className="mt-3 max-w-3xl text-sm text-slate-600">
                        {projectInfo.description}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Thành viên</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">
                        {formatNumber(contribution.metadata.team_members)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Tính năng</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">
                        {formatNumber(contribution.metadata.feature_count)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Chức năng</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">
                        {formatNumber(contribution.metadata.function_count)}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="rounded-lg border border-slate-200 bg-white p-6">
                    <h3 className="text-lg font-semibold text-slate-900">Tổng quan công việc</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Số lượng task, thời gian ước tính và trạng thái hoàn thành toàn dự án.
                    </p>
                    <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Tổng task</p>
                        <p className="mt-3 text-3xl font-semibold text-slate-900">{formatNumber(contribution.totals.total_tasks)}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Hoàn thành</p>
                        <p className="mt-3 text-2xl font-semibold text-slate-900">
                          {formatNumber(contribution.totals.completed_tasks)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Đang xử lý</p>
                        <p className="mt-3 text-2xl font-semibold text-slate-900">
                          {formatNumber(contribution.totals.in_progress_tasks)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Chưa bắt đầu</p>
                        <p className="mt-3 text-2xl font-semibold text-slate-900">
                          {formatNumber(contribution.totals.todo_tasks)}
                        </p>
                      </div>
                    </div>

                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Đóng góp theo thành viên</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Sắp xếp theo số lượng task hoàn thành, tổng task và độ phức tạp đảm nhiệm.
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {formatNumber(contribution.members.length)} thành viên có task
                      </span>
                    </div>

                    {contribution.members.length === 0 ? (
                      <ContributionPlaceholder message="Chưa có thành viên nào được giao task trong dự án này." />
                    ) : (
                      <div className="overflow-hidden rounded-xl border border-slate-100">
                        <div className="max-h-[560px] overflow-auto">
                          <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              <tr>
                                <th className="px-4 py-3">Thành viên</th>
                                <th className="px-4 py-3">Task</th>
                                <th className="px-4 py-3">Hoàn thành</th>
                                <th className="px-4 py-3">Tỉ lệ & loại task</th>
                                <th className="px-4 py-3">Thời gian</th>
                                <th className="px-4 py-3 text-right">Hành động</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {contribution.members.map((member, idx) => renderMemberRow(member, idx))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                
                
              </section>
              <section className="rounded-lg border border-slate-200 bg-white p-6">
              
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Task chưa được phân công</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Danh sách các công việc chưa có người phụ trách để tránh tồn đọng.
                        </p>
                      </div>
                      {contribution.unassigned && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {formatNumber(contribution.unassigned.total_tasks)} task
                        </span>
                      )}
                    </div>
                    
                    {loadingUnassignedTasks ? (
                      <div className="flex h-64 flex-col items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600" />
                        <p className="mt-4 text-sm font-medium text-slate-500">Đang tải danh sách task...</p>
                      </div>
                    ) : unassignedTasks.length === 0 ? (
                      <ContributionPlaceholder message="Hiện tất cả task đều đã có người phụ trách." />
                    ) : (
                      <div className="space-y-3">
                        {unassignedTasks.map((task) => {
                          const taskStatus = typeof task.status === "object" ? task.status?.name : task.status || "Unknown";
                          const taskPriority = typeof task.priority === "object" ? task.priority?.name : task.priority || "";
                          const isOverdue = task.deadline 
                            ? new Date(task.deadline).getTime() < Date.now() && !taskStatus.toLowerCase().includes('done') && !taskStatus.toLowerCase().includes('completed')
                            : false;
                          const deadlineDate = task.deadline ? new Date(task.deadline) : null;
                          const daysUntilDeadline = deadlineDate 
                            ? Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                            : null;
                          
                          // Get task type
                          let taskType = "Simple";
                          if (task.estimate) {
                            if (task.estimate >= 40) taskType = "Very Complex";
                            else if (task.estimate >= 20) taskType = "Complex";
                            else if (task.estimate >= 8) taskType = "Medium";
                            else taskType = "Simple";
                          }
                          
                          return (
                            <div
                              key={task._id}
                              onClick={() => {
                                if (projectId) {
                                  router.push(`/projects/${projectId}/tasks?taskId=${task._id}`);
                                }
                              }}
                              className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-600 font-semibold flex-shrink-0">
                                      UA
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-slate-900 text-base mb-1 line-clamp-2">
                                        {task.title || "Task không có tiêu đề"}
                                      </h4>
                                      {task.description && (
                                        <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                                          {task.description}
                                        </p>
                                      )}
                                      
                                      <div className="flex flex-wrap items-center gap-2 mt-3">
                                        {/* Status */}
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                          taskStatus.toLowerCase().includes('done') || taskStatus.toLowerCase().includes('completed')
                                            ? 'bg-green-100 text-green-800'
                                            : taskStatus.toLowerCase().includes('doing') || taskStatus.toLowerCase().includes('progress')
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-orange-100 text-orange-800'
                                        }`}>
                                          {taskStatus}
                                        </span>
                                        
                                        {/* Priority */}
                                        {taskPriority && (
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                            {taskPriority}
                                          </span>
                                        )}
                                        
                                        {/* Type */}
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGE_COLOR[taskType as TypeKey] || TYPE_BADGE_COLOR.Simple}`}>
                                          {taskType}
                                        </span>
                                        
                                        {/* Deadline */}
                                        {deadlineDate && (
                                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            isOverdue
                                              ? 'bg-red-100 text-red-800'
                                              : daysUntilDeadline !== null && daysUntilDeadline <= 3
                                              ? 'bg-yellow-100 text-yellow-800'
                                              : 'bg-slate-100 text-slate-700'
                                          }`}>
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {isOverdue 
                                              ? `Quá hạn ${Math.abs(daysUntilDeadline!)} ngày`
                                              : daysUntilDeadline === 0
                                              ? 'Hôm nay'
                                              : daysUntilDeadline === 1
                                              ? 'Ngày mai'
                                              : daysUntilDeadline! > 0
                                              ? `Còn ${daysUntilDeadline} ngày`
                                              : deadlineDate.toLocaleDateString('vi-VN')
                                            }
                                          </span>
                                        )}
                                        
                                        {/* Estimate */}
                                        {task.estimate && (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {task.estimate}h
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex-shrink-0">
                                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div></section>
              
            </div>
          ) : null}
        </div>
      </div>
  );
}