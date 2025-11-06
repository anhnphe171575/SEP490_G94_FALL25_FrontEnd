"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axiosInstance from "../../../../../ultis/axios";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";
import QuickNav from "@/components/QuickNav";
import TaskDetailsComments from "@/components/TaskDetails/TaskDetailsComments";

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
  feature_id?: { _id: string; title: string; project_id?: string } | string;
  milestone_id?: { _id: string; title: string } | string;
  function_id?: { _id: string; title: string; complexity_id?: string } | string;
};

export default function AllTasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project_id") || "";

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  // Filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [sortBy, setSortBy] = useState("deadline:asc");

  const openComments = (taskId: string) => {
    setActiveTaskId(taskId);
    setCommentsOpen(true);
  };
  const closeComments = () => setCommentsOpen(false);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        if (q) params.append("q", q);
        params.append("sortBy", sortBy);

        const res = await axiosInstance.get(`/api/projects/${projectId}/tasks?${params.toString()}`);
        const data = Array.isArray(res.data) ? res.data : [];
        setTasks(data);
      } catch (e: any) {
        setError(e?.response?.data?.message || "Không thể tải danh sách công việc");
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId, q, status, priority, sortBy]);

  const displayed = useMemo(() => {
    return tasks.filter((t) => {
      const statusName = typeof t.status === "object" ? t.status?.name : t.status;
      const priorityName = typeof t.priority === "object" ? t.priority?.name : t.priority;
      const statusOk = status === "all" ? true : statusName === status;
      const priorityOk = priority === "all" ? true : priorityName === priority;
      return statusOk && priorityOk;
    });
  }, [tasks, status, priority]);

  const getName = (val: any) => (typeof val === "object" && val ? val.name : val || "");
  const getUserName = (val: any) => (typeof val === "object" && val ? val.full_name : "");

  if (!projectId) {
    return (
      <div className="min-h-screen bg-white">
        <ResponsiveSidebar />
        <main className="p-4 md:p-6 md:ml-64">
          <div className="max-w-5xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Tất cả công việc</h1>
                <p className="text-gray-600">Vui lòng chọn Project để xem danh sách công việc</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (<>
    <div className="min-h-screen bg-white">
      <ResponsiveSidebar />
      <main className="p-4 md:p-6 md:ml-64">
        <div className="max-w-[1400px] mx-auto">
          {/* Header + QuickNav */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Tất cả công việc</h1>
              <p className="text-gray-600">Danh sách công việc của project</p>
            </div>
            <QuickNav selectedProject={projectId} />
          </div>

          {/* Local Tabs */}
          <div className="mb-4 border-b border-gray-200">
            <nav className="-mb-px flex gap-6" aria-label="Tabs">
              <Link
                href={`/supervisor/task${projectId ? `?project_id=${projectId}` : ''}`}
                className="whitespace-nowrap border-b-2 border-transparent px-1 pb-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                Tổng quan
              </Link>
              <span className="whitespace-nowrap border-b-2 border-purple-600 px-1 pb-2 text-sm font-medium text-purple-700">
                Tất cả công việc
              </span>
            </nav>
          </div>

          {/* Filters */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Tìm kiếm</label>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Tiêu đề, mô tả..."
                  className="w-full rounded-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Trạng thái</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value="all">Tất cả</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="In Review">In Review</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Độ ưu tiên</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value="all">Tất cả</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Very High">Very High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Sắp xếp</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full rounded-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value="deadline:asc">Sớm hạn</option>
                  <option value="deadline:desc">Muộn hạn</option>
                  <option value="createdAt:desc">Mới nhất</option>
                  <option value="createdAt:asc">Cũ nhất</option>
                </select>
              </div>
            </div>
          </div>

          {/* List */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-3 text-xs font-medium text-gray-500 border-b">
              <div className="col-span-5">Công việc</div>
              <div className="col-span-2">Người thực hiện</div>
              <div className="col-span-2">Trạng thái</div>
              <div className="col-span-1">Ưu tiên</div>
              <div className="col-span-2 text-right">Hạn</div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-600">Đang tải...</div>
            ) : error ? (
              <div className="p-8 text-center text-red-600">{error}</div>
            ) : displayed.length === 0 ? (
              <div className="p-8 text-center text-gray-600">Không có công việc</div>
            ) : (
              <ul className="divide-y">
                {displayed.map((t) => {
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

                  const statusClass =
                    statusName === "Completed"
                      ? "bg-green-100 text-green-700"
                      : statusName === "In Progress"
                      ? "bg-blue-100 text-blue-700"
                      : statusName === "In Review"
                      ? "bg-violet-100 text-violet-700"
                      : "bg-gray-100 text-gray-700";

                  const priorityDot =
                    priorityName === "High" || priorityName === "Very High"
                      ? "bg-red-500"
                      : priorityName === "Medium"
                      ? "bg-amber-500"
                      : "bg-slate-400";

                  return (
                    <li key={t._id} className="px-4 py-3 hover:bg-slate-50">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                        <div className="md:col-span-5 min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate">{t.title}</p>
                              <p className="text-xs text-gray-500 truncate">{t.description || ""}</p>
                            </div>
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-white flex items-center justify-center text-xs font-bold">
                              {assigneeName ? assigneeName.split(" ").pop()?.[0] : "?"}
                            </div>
                            <span className="text-sm text-gray-700 truncate">{assigneeName || "—"}</span>
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusClass}`}>
                            {statusName || "Pending"}
                          </span>
                        </div>
                        <div className="md:col-span-1">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <span className={`inline-block w-2 h-2 rounded-full ${priorityDot}`} />
                            <span className="truncate">{priorityName || "—"}</span>
                          </div>
                        </div>
                        <div className="md:col-span-2 text-sm flex items-center justify-end gap-2">
                          <span className={`${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                            {t.deadline ? new Date(t.deadline).toLocaleDateString("vi-VN") : "—"}
                            {isOverdue && <span> ( Quá hạn )</span>}
                          </span>
                          <button
                            type="button"
                            onClick={() => openComments(t._id)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-purple-600 hover:bg-purple-50 border border-transparent hover:border-purple-200"
                            title="Bình luận"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                              <path d="M8.25 9.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 9.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 10.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                              <path fillRule="evenodd" d="M3.75 4.5A2.25 2.25 0 016 2.25h12A2.25 2.25 0 0120.25 4.5v9A2.25 2.25 0 0118 15.75H8.318l-3.034 2.276A1.125 1.125 0 013 17.076V4.5zm2.25-.75A.75.75 0 005.25 4.5v11.44l2.513-1.887a1.5 1.5 0 01.9-.303H18a.75.75 0 00.75-.75v-9a.75.75 0 00-.75-.75H6z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
            <div>
              {displayed.length} công việc
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/supervisor/task${projectId ? `?project_id=${projectId}` : ''}`}
                className="text-purple-600 hover:text-purple-700"
              >
                Quay lại Tổng quan
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
    {commentsOpen && (
      <div className="fixed inset-0 z-50" key="comments-drawer">
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
  </>);
}


