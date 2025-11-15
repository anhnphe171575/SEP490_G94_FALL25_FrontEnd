"use client";

import { useEffect, useState } from "react";
import axiosInstance from "../../../../ultis/axios";
import LeftSidebarHeader from "../dashboard-admin/herder";
import { ChevronDown, AlertCircle, Edit, Trash2 } from 'lucide-react';
import EditUserModal from './edit';
import { User, EditUserForm } from './edit';

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

const roleOptions = [
  { value: "all", label: "Tất cả vai trò" },
  { value: "8", label: "Admin" },
  { value: "4", label: "Giám sát viên" },
  { value: "1", label: "Sinh viên" }
];

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get<ApiResponse>("/api/users/all", {
        params: {
          page: currentPage,
          limit: 10,
          search: search || undefined,
          role: roleFilter === "all" ? undefined : Number(roleFilter),
        },
      });
      
      if (response.data.success) {
        setUsers(response.data.data.users);
        setTotalPages(response.data.data.pagination.totalPages);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tải danh sách người dùng");
      console.error("Fetch users error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, search, roleFilter]);

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa người dùng này?")) return;

    try {
      setDeleteLoading(id);
      const response = await axiosInstance.delete(`/api/user/delete/${id}`);
      if (response.data.success) {
        setUsers(users.filter(user => user._id !== id));
        alert("Xóa người dùng thành công!");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Không thể xóa người dùng");
      console.error("Delete error:", err);
    } finally {
      setDeleteLoading(null);
      await fetchUsers();
    }
  };
  
  const handleEditSubmit = async (formData: EditUserForm) => {
    if (!editingUser) return;

    try {
      setEditLoading(true);
      const response = await axiosInstance.put(`/api/users/update/${editingUser._id}`, formData);

      if (response.data.success) {
        await fetchUsers();
        setEditingUser(null);
        alert("Cập nhật thông tin thành công!");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Không thể cập nhật thông tin người dùng");
      console.error("Update error:", err);
    } finally {
      setEditLoading(false);
    }
  };

  const getRoleName = (role: number) => {
    switch (role) {
      case 7: return "Admin Developer";
      case 8: return "Admin";
      case 4: return "Giám sát viên";
      case 1: return "Sinh viên";
      default: return "Không xác định";
    }
  };

  const getRoleColor = (role: number) => {
    switch (role) {
      case 7:
      case 8:
        return "bg-purple-100 text-purple-800";
      case 4:
        return "bg-green-100 text-green-800";
      case 1:
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderUserRow = (user: User) => (
    <tr key={user._id} className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold bg-blue-500 w-full h-full flex items-center justify-center">
                {user.full_name?.[0]?.toUpperCase() || "U"}
              </span>
            )}
          </div>
          <div>
            <div className="font-medium text-gray-900">{user.full_name}</div>
            <div className="text-xs text-gray-500">{user._id}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {user.email}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
          {getRoleName(user.role)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {user.phone || "N/A"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(user.createdAt).toLocaleDateString("vi-VN")}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
        <button 
          className={`inline-flex items-center px-3 py-1 rounded transition ${
            user.role === 7 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
          onClick={() => setEditingUser(user)}
          disabled={user.role === 7}
        >
          <Edit className="w-4 h-4 mr-1" />
          Sửa
        </button>
        <button
          className={`inline-flex items-center px-3 py-1 rounded transition ${
            user.role === 7 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-red-100 text-red-700 hover:bg-red-200'
          }`}
          onClick={() => handleDeleteUser(user._id)}
          disabled={user.role === 7 || deleteLoading === user._id}
        >
          <Trash2 className="w-4 h-4 mr-1" />
          {deleteLoading === user._id ? 'Đang xóa...' : 'Xóa'}
        </button>
      </td>
    </tr>
  );

  return (
    <div className="min-h-screen flex bg-gray-100">
      <LeftSidebarHeader />
      
      <main className="flex-1 ml-64 p-6">
        {/* Header and Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
          
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="relative">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="appearance-none w-full md:w-48 px-4 py-2 bg-white border rounded-lg shadow-sm 
                  focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 pr-10"
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
            
            <input
              type="text"
              placeholder="Tìm kiếm người dùng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-64 px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* User Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Người dùng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vai trò
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số điện thoại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày tham gia
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map(renderUserRow)}
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

        {/* Edit Modal */}
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSubmit={handleEditSubmit}
          loading={editLoading}
        />
      </main>
    </div>
  );
}