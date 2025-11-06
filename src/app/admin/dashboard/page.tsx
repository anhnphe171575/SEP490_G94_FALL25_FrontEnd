"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    students: 0,
    admins: 0,
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) throw new Error("No token found");

        const usersResponse = await axios.get("http://localhost:5000/api/users/all", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const users = Array.isArray(usersResponse.data) ? usersResponse.data : (usersResponse.data.users ?? []);

        const projectsResponse = await axios.get("http://localhost:5000/api/projects/all", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const projects = Array.isArray(projectsResponse.data) ? projectsResponse.data : (projectsResponse.data.projects ?? []);

        setStats({
          totalUsers: users.length,
          students: users.filter(user => user.role !== 8).length,
          admins: users.filter(user => user.role === 8).length,
          totalProjects: projects.length,
          activeProjects: projects.filter(p => p.status === 'active').length,
          completedProjects: projects.filter(p => p.status === 'completed').length,
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
        setError("Không thể tải thông tin thống kê");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const userChartData = {
    labels: ['Phân bố người dùng'],
    datasets: [
      {
        label: 'Sinh viên',
        data: [stats.students],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: '#3b82f6',
        borderWidth: 1
      },
      {
        label: 'Quản trị viên',
        data: [stats.admins],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: '#10b981',
        borderWidth: 1
      }
    ]
  };

  const projectPieData = {
    labels: ['Dự án đang thực hiện', 'Dự án hoàn thành'],
    datasets: [
      {
        data: [stats.activeProjects, stats.completedProjects],
        backgroundColor: [
          'rgba(245, 158, 11, 0.8)',
          'rgba(99, 102, 241, 0.8)'
        ],
        borderColor: [
          '#f59e0b',
          '#6366f1'
        ],
        borderWidth: 1
      }
    ]
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Sidebar />
        <main className="p-6 md:ml-72">
          <div className="flex items-center justify-center h-80">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="p-6 md:ml-72">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Tổng quan hệ thống</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-6 text-white shadow-lg">
            <div className="text-sm opacity-80 mb-2">Tổng người dùng</div>
            <div className="text-3xl font-bold mb-1">{stats.totalUsers}</div>
            <div className="text-sm opacity-80">Tài khoản đã đăng ký</div>
          </div>

          <div className="bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl p-6 text-white shadow-lg">
            <div className="text-sm opacity-80 mb-2">Tổng dự án</div>
            <div className="text-3xl font-bold mb-1">{stats.totalProjects}</div>
            <div className="text-sm opacity-80">Dự án đã tạo</div>
          </div>

          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
            <div className="text-sm opacity-80 mb-2">Đang thực hiện</div>
            <div className="text-3xl font-bold mb-1">{stats.activeProjects}</div>
            <div className="text-sm opacity-80">Dự án</div>
          </div>

          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white shadow-lg">
            <div className="text-sm opacity-80 mb-2">Đã hoàn thành</div>
            <div className="text-3xl font-bold mb-1">{stats.completedProjects}</div>
            <div className="text-sm opacity-80">Dự án</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Phân bố người dùng</h3>
            <div className="h-64">
              <Bar 
                data={userChartData}
                options={{
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: 'rgba(0,0,0,0.05)'
                      }
                    },
                    x: {
                      grid: {
                        display: false
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      position: 'top'
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Trạng thái dự án</h3>
            <div className="h-64 flex items-center justify-center">
              <div className="w-4/5">
                <Pie
                  data={projectPieData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }}
                />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-center">
              <div className="p-2 rounded bg-amber-50">
                <div className="text-amber-600 font-semibold">Đang thực hiện</div>
                <div className="text-2xl font-bold text-amber-700">{stats.activeProjects}</div>
              </div>
              <div className="p-2 rounded bg-indigo-50">
                <div className="text-indigo-600 font-semibold">Hoàn thành</div>
                <div className="text-2xl font-bold text-indigo-700">{stats.completedProjects}</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}