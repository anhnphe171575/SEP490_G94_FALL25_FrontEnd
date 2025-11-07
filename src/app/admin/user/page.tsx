"use client";

import { useEffect, useState } from "react";
import axiosInstance from "../../../../ultis/axios";
import LeftSidebarHeader from "../dashboard-admin/herder";

interface User {
  _id: string;
  email: string;
  full_name: string;
  role: number;
  avatar?: string;
  phone?: string;
  createdAt: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    users: User[];
    pagination: {
      total: number;
      page: number;
      totalPages: number;
      limit: number;
    };
  };
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get<ApiResponse>("/api/users/all", {
          params: {
            page: currentPage,
            limit: 10,
            search: search || undefined,
          },
        });
        if (response.data.success) {
          setUsers(response.data.data.users);
          setTotalPages(response.data.data.pagination.totalPages);
        } else {
          throw new Error("Failed to fetch users");
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [currentPage, search]);

  const getRoleName = (role: number) => {
    switch (role) {
      case 7:
        return "Admin Developer";
      case 8:
        return "Admin";
      case 4:
        return "Supervisor";
      case 1:
        return "Student";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      <LeftSidebarHeader />

      <main className="flex-1 ml-64 p-6">
        {/* Header + Search */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-red-600 bg-red-50 p-4 rounded-lg mb-4 shadow">{error}</div>
        )}

        {/* User Table */}
        {!loading && !error && (
          <>
            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Joined Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-bold bg-blue-500 w-full h-full flex items-center justify-center">
                              {user.full_name?.[0]?.toUpperCase() || "U"}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.full_name}</div>
                          <div className="text-xs text-gray-400">{user._id}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${
                            user.role === 8 || user.role === 7
                              ? "bg-purple-100 text-purple-800"
                              : user.role === 4
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {getRoleName(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{user.phone || "N/A"}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm space-x-2">
                        <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition">
                          Edit
                        </button>
                        <button className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6 gap-2">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-4 py-2 rounded-lg border ${
                      currentPage === i + 1
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
