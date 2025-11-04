"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axiosInstance from "../../../../../ultis/axios";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";

export default function ContributorDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const projectId = searchParams.get("project_id") || undefined;

  type TaskItem = {
    _id: string;
    title: string;
    feature_id?: { _id: string; title: string; project_id: string };
    assigner_id?: { _id: string; full_name: string; email: string };
    assignee_id?: { _id: string; full_name: string; email: string };
    deadline?: string;
    status?: string;
    description?: string;
    updateAt?: string;
    priority?: string;
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    if (!userId) {
      setError("Missing userId");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setError(null);
        setLoading(true);
        const params = new URLSearchParams();
        if (projectId) params.append("project_id", projectId);
        const res = await axiosInstance.get(`/api/users/${userId}/tasks?${params.toString()}`);
        const data = res.data;
        setTasks(Array.isArray(data?.tasks) ? data.tasks : []);
      } catch (e: any) {
        setError(e?.response?.data?.message || "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, projectId]);

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      const matchesQ = q
        ? (t.title?.toLowerCase().includes(q.toLowerCase()) || t.description?.toLowerCase().includes(q.toLowerCase()))
        : true;
      const matchesStatus = status === "all" ? true : (t.status === status);
      return matchesQ && matchesStatus;
    });
  }, [tasks, q, status]);

  if (loading) {
    return <main className="p-6">Đang tải dữ liệu...</main>;
  }
  if (error) {
    return <main className="p-6 text-red-600">{error}</main>;
  }

  const contributorName = tasks[0]?.assignee_id?.full_name || "Thành viên";
  const contributorEmail = tasks[0]?.assignee_id?.email || "";
  const avatarText = contributorName ? contributorName.charAt(0).toUpperCase() : "U";
  const totalTasks = tasks.length;
  const completedCount = tasks.filter(t => t.status === "Completed").length;
  const inProgressCount = tasks.filter(t => t.status === "In Progress").length;
  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-white">
      <ResponsiveSidebar />
      <main className="p-4 md:p-6 md:ml-64">
        <div className="max-w-6xl mx-auto">
          {/* Header with back button */}
          <div className="mb-8">
            <Link href="/supervisor/contributor" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
              <span className="inline-block w-4 h-4">←</span>
              Back to Dashboard
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white flex items-center justify-center text-2xl font-bold">
                {avatarText}
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900">{contributorName}</h1>
                {contributorEmail && (
                  <p className="text-slate-600 text-sm md:text-lg">{contributorEmail}</p>
                )}
              </div>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 border border-slate-200 rounded-lg">
              <p className="text-slate-500 text-sm mb-1">Total Tasks</p>
              <p className="text-3xl font-bold text-slate-900">{totalTasks}</p>
            </div>
            <div className="bg-white p-4 border border-slate-200 rounded-lg">
              <p className="text-slate-500 text-sm mb-1">Completed</p>
              <p className="text-3xl font-bold text-blue-600">{completedCount}</p>
            </div>
            <div className="bg-white p-4 border border-slate-200 rounded-lg">
              <p className="text-slate-500 text-sm mb-1">In Progress</p>
              <p className="text-3xl font-bold text-purple-600">{inProgressCount}</p>
            </div>
            <div className="bg-white p-4 border border-slate-200 rounded-lg">
              <p className="text-slate-500 text-sm mb-1">Completion Rate</p>
              <p className="text-3xl font-bold text-green-600">{completionRate}%</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tiêu đề/mô tả"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Overdue">Overdue</option>
              <option value="Blocked">Blocked</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>
        </div>
        {/* List */}
        <div className="max-w-6xl mx-auto space-y-3">
          {filtered.length === 0 ? (
            <div className="p-6 border rounded-lg text-gray-600">Không có task phù hợp</div>
          ) : (
            filtered.map((task) => (
              <div key={task._id} className="p-4 border rounded-lg bg-white">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{task.title}</h3>
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {task.feature_id?.title && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">Feature: {task.feature_id.title}</span>
                      )}
                      {task.priority && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Priority: {task.priority}</span>
                      )}
                      {task.status && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded">{task.status}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    {task.deadline && (
                      <div>Deadline: {new Date(task.deadline).toLocaleString()}</div>
                    )}
                    {task.updateAt && (
                      <div>Cập nhật: {new Date(task.updateAt).toLocaleString()}</div>
                    )}
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-2">
                  {task.assigner_id?.full_name && <span>Assigner: {task.assigner_id.full_name}</span>}
                  {task.assignee_id?.full_name && <span>Assignee: {task.assignee_id.full_name}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
