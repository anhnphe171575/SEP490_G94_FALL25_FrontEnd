"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "../../../ultis/axios";
import { Eye, Trash2 } from "lucide-react";

const SORT_OPTIONS = [
  { value: "az", label: "Tên dự án (A-Z)" },
  { value: "za", label: "Tên dự án (Z-A)" },
];

export default function ProjectsPage({ userId }) {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);
  const [sortOption, setSortOption] = useState("az");

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchProjects = async () => {
    try {
      const res = await axiosInstance.get("/api/projects");
      if (Array.isArray(res.data?.projects)) {
        setProjects(res.data.projects);
      } else if (Array.isArray(res.data)) {
        setProjects(res.data);
      } else {
        setProjects([]);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Không thể tải dự án");
      setProjects([]);
    }
  };

  // Sắp xếp theo tên dự án
  const sortedProjects = [...projects].sort((a, b) => {
    if (!a.topic) return 1;
    if (!b.topic) return -1;
    if (sortOption === "az") {
      return a.topic.localeCompare(b.topic, "vi", { sensitivity: "base" });
    } else {
      return b.topic.localeCompare(a.topic, "vi", { sensitivity: "base" });
    }
  });

  const handleDelete = async (id) => {
    if (!confirm("Bạn có chắc muốn xóa dự án này?")) return;
    try {
      await axiosInstance.delete(`/api/projects/${id}`);
      await fetchProjects();
    } catch (err) {
      alert(err?.response?.data?.message || "Không thể xóa dự án");
    }
  };

  return (
    <div className="w-full flex justify-center">
      <div
        className="w-full max-w-5xl bg-white rounded-2xl shadow-xl border border-green-100 mt-6 animate-fade-in"
        style={{
          overflow: "hidden",
          boxShadow: "0 4px 24px 0 rgba(34,197,94,0.10)",
        }}
      >
        <h2 className="text-2xl font-bold mb-6 text-center pt-8 pb-2 text-green-700 tracking-wide">
          📁 Danh sách dự án của bạn
        </h2>
        <div className="flex justify-end px-6 pb-2">
        
          <select
            id="sort-select"
            value={sortOption}
            onChange={e => setSortOption(e.target.value)}
            className="border border-green-300 rounded-lg px-3 py-1 text-green-800 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200 transition"
            style={{ minWidth: 170 }}
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                style={{
                  background: "linear-gradient(90deg, #e8f5e9 0%, #f6fff7 100%)",
                }}
                className="text-green-700 text-base"
              >
                <th className="py-4 px-2 font-semibold">STT</th>
                <th className="py-4 px-2 font-semibold">Tên dự án</th>
                <th className="py-4 px-2 font-semibold">Mã dự án</th>
                <th className="py-4 px-2 font-semibold">Ngày tạo</th>
                <th className="py-4 px-2 font-semibold">Trạng thái</th>
                <th className="py-4 px-2 font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(sortedProjects) && sortedProjects.map((project, index) => (
                <tr
                  key={project._id || index}
                  className="transition-all duration-200 hover:bg-green-50"
                  style={{
                    borderBottom: "1px solid #e8f5e9",
                  }}
                >
                  <td className="py-4 px-2 font-bold text-green-800 text-center">{index + 1}</td>
                  <td className="py-4 px-2 font-semibold text-green-900">{project.topic}</td>
                  <td className="py-4 px-2 font-mono text-green-700">{project.code}</td>
                  <td className="py-4 px-2 text-green-700">
                    {project.createAt
                      ? new Date(project.createAt).toLocaleDateString('vi-VN')
                      : '-'
                    }
                  </td>
                  <td className="py-4 px-2">
                    <span className={`px-4 py-1 rounded-full text-xs font-bold shadow-sm bg-green-50 text-green-700`}
                      style={{
                        background: project.status === 'active'
                          ? "#d1fae5"
                          : project.status === 'on-hold'
                          ? "#fef9c3"
                          : "#f3f4f6",
                        color: project.status === 'active'
                          ? "#15803d"
                          : project.status === 'on-hold'
                          ? "#b45309"
                          : "#64748b",
                        boxShadow: "0 2px 8px rgba(34,197,94,0.07)",
                        minWidth: 90,
                        display: "inline-block",
                        textAlign: "center"
                      }}
                    >
                      {project.status || 'Chưa có'}
                    </span>
                  </td>
                  <td className="py-4 px-2">
                    <div className="flex items-center gap-3 justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/projects/${project._id}`);
                        }}
                        className="p-2 bg-green-100 text-green-700 rounded-full shadow hover:bg-green-200 hover:text-green-900 hover:scale-110 transition-all duration-200"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-5 h-5" style={{ color: "#15803d" }} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(project._id);
                        }}
                        className="p-2 bg-red-100 text-red-600 rounded-full shadow hover:bg-red-200 hover:text-red-700 hover:scale-110 transition-all duration-200"
                        title="Xóa"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {Array.isArray(sortedProjects) && sortedProjects.length === 0 && (
            <div className="text-center py-12 text-green-700 text-lg animate-fade-in">
              Không có dự án nào!
            </div>
          )}
          {error && (
            <div className="text-center py-12 text-red-500 text-lg animate-fade-in">
              {error}
            </div>
          )}
        </div>
      </div>
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .animate-fade-in {
          animation: fade-in 0.5s;
        }
      `}</style>
    </div>
  );
}