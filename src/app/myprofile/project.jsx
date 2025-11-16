"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "../../../ultis/axios";
import { Eye, Trash2 } from "lucide-react";

// Một số gradient màu nổi bật cho từng dòng
const ROW_GRADIENTS = [
  "from-blue-400 via-blue-200 to-blue-100",
  "from-green-400 via-cyan-200 to-blue-100",
  "from-purple-400 via-pink-200 to-blue-100",
  "from-teal-400 via-green-200 to-blue-100",
  "from-indigo-400 via-blue-200 to-blue-100",
  "from-cyan-400 via-blue-200 to-blue-100",
  "from-fuchsia-400 via-pink-200 to-blue-100",
];

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
          className="w-full max-w-5xl bg-white rounded-2xl shadow-xl mt-6 animate-fade-in relative"
  style={{
    overflow: "hidden",
    boxShadow: "0 0 14px 2px #2196f344, 0 2px 6px 0 #2196f322", // giảm blur và alpha
    backdropFilter: "blur(1.5px)",
  }}
>
  {/* Hiệu ứng ánh sáng xanh động, giảm opacity */}
  <div className="absolute -top-8 -left-8 w-32 h-32 bg-gradient-to-br from-blue-400 via-blue-200 to-transparent rounded-full opacity-15 blur-xl pointer-events-none animate-pulse"></div>
  <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-tr from-blue-500 via-blue-200 to-transparent rounded-full opacity-10 blur-xl pointer-events-none animate-pulse"></div>

       <div className="w-full flex justify-center">
  <h2 className="text-2xl font-extrabold mb-6 pt-8 pb-2 tracking-wide animate-bounce-title w-max text-center">
    <span
      className="bg-gradient-to-r from-green-400 via-blue-400 to-blue-600 bg-clip-text text-transparent drop-shadow-lg"
      style={{
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        color: "transparent",
      }}
    >
      📁 Danh sách dự án của bạn
    </span>
  </h2>
</div>
        <div className="flex justify-end px-6 pb-2">
          <select
            id="sort-select"
            value={sortOption}
            onChange={e => setSortOption(e.target.value)}
            className="border border-blue-300 rounded-lg px-3 py-1 text-blue-800 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
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
                  background: "linear-gradient(90deg, #e3f0fd 0%, #f6fbff 100%)",
                }}
                className="text-blue-700 text-base"
              >
                <th className="py-4 px-2 font-semibold">STT</th>
                <th className="py-4 px-2 font-semibold">Tên dự án</th>
                <th className="py-4 px-2 font-semibold">Mã dự án</th>
                <th className="py-4 px-2 font-semibold">Trạng thái</th>
                <th className="py-4 px-2 font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(sortedProjects) && sortedProjects.map((project, index) => (
                <tr
                  key={project._id || index}
                  className="transition-all duration-200 hover:scale-[1.015] hover:shadow-lg"
                  style={{
                    borderBottom: "1px solid #e3f0fd",
                    background: `linear-gradient(90deg, var(--tw-gradient-stops))`,
                  }}
                >
                  {/* Gradient màu cho từng dòng */}
                  <style>
                    {`
                      tr:nth-child(${index + 2}) {
                        --tw-gradient-from: ${ROW_GRADIENTS[index % ROW_GRADIENTS.length].split(" ")[0].replace("from-", "#")};
                        --tw-gradient-via: ${ROW_GRADIENTS[index % ROW_GRADIENTS.length].split(" ")[1].replace("via-", "#")};
                        --tw-gradient-to: ${ROW_GRADIENTS[index % ROW_GRADIENTS.length].split(" ")[2].replace("to-", "#")};
                      }
                    `}
                  </style>
                  <td className="py-4 px-2 font-bold text-blue-800 text-center">{index + 1}</td>
                  <td className="py-4 px-2 font-semibold text-blue-900">{project.topic}</td>
                  <td className="py-4 px-2 font-mono text-blue-700">{project.code}</td>
                 
                  <td className="py-4 px-2">
                    <span className={`px-4 py-1 rounded-full text-xs font-bold shadow-sm`}
                      style={{
                        background: project.status === 'active'
                          ? "linear-gradient(90deg,#dbeafe,#a7f3d0)"
                          : project.status === 'on-hold'
                          ? "linear-gradient(90deg,#fef9c3,#f3f4f6)"
                          : "linear-gradient(90deg,#f3f4f6,#e0e7ef)",
                        color: project.status === 'active'
                          ? "#2563eb"
                          : project.status === 'on-hold'
                          ? "#b45309"
                          : "#64748b",
                        boxShadow: "0 2px 8px rgba(59,130,246,0.07)",
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
                        className="p-2 bg-blue-100 text-blue-700 rounded-full shadow hover:bg-blue-200 hover:text-blue-900 hover:scale-110 transition-all duration-200"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-5 h-5" style={{ color: "#2563eb" }} />
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
            <div className="text-center py-12 text-blue-700 text-lg animate-fade-in">
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
        .animate-bounce-title {
          animation: bounceTitle 2.2s infinite alternate cubic-bezier(.68,-0.55,.27,1.55);
          display: inline-block;
        }
        @keyframes bounceTitle {
          0% { transform: translateY(0);}
          50% { transform: translateY(-12px);}
          100% { transform: translateY(0);}
        }
      `}</style>
    </div>
  );
}