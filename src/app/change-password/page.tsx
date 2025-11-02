"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "../../../ultis/axios";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError(null);
  };

  const validateForm = () => {
    if (!formData.currentPassword) {
      setError("Vui lòng nhập mật khẩu hiện tại");
      return false;
    }
    if (!formData.newPassword) {
      setError("Vui lòng nhập mật khẩu mới");
      return false;
    }
    if (formData.newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự");
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return false;
    }
    if (formData.currentPassword === formData.newPassword) {
      setError("Mật khẩu mới phải khác mật khẩu hiện tại");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setError(null);
    try {
      await axiosInstance.put("/api/auth/change-password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      setSuccess(true);
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => {
        router.push("/myprofile");
      }, 2000);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Thay đổi mật khẩu thất bại");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full flex justify-center">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-green-100 p-8 mt-10 animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center shadow">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-green-700 text-center drop-shadow">
            Thay đổi mật khẩu thành công!
          </h1>
          <p className="text-gray-600 mb-4 text-center">
            Mật khẩu của bạn đã được cập nhật thành công.
          </p>
          <p className="text-sm text-gray-500 text-center">
            Đang chuyển hướng về trang hồ sơ...
          </p>
        </div>
        <style jsx global>{`
          .animate-fade-in { animation: fade-in 0.5s; }
          @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center">
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-green-100 mt-10 animate-fade-in"
        style={{
          boxShadow: "0 4px 24px 0 rgba(34,197,94,0.10)",
        }}
      >
        <h1 className="text-2xl font-bold mb-6 text-green-700 text-center pt-8 pb-2 tracking-wide">
          Thay đổi mật khẩu
        </h1>
        <div className="px-8 pb-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-green-800 mb-1">
                Mật khẩu hiện tại
              </label>
              <input
                id="currentPassword"
                type="password"
                required
                value={formData.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                className="w-full border border-green-300 rounded-lg px-3 py-2 text-green-800 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200 transition"
                placeholder="Nhập mật khẩu hiện tại"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-green-800 mb-1">
                Mật khẩu mới
              </label>
              <input
                id="newPassword"
                type="password"
                required
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                className="w-full border border-green-300 rounded-lg px-3 py-2 text-green-800 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200 transition"
                placeholder="Nhập mật khẩu mới"
              />
              <p className="text-xs text-gray-500 mt-1">
                Mật khẩu phải có ít nhất 6 ký tự
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-green-800 mb-1">
                Xác nhận mật khẩu mới
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="w-full border border-green-300 rounded-lg px-3 py-2 text-green-800 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200 transition"
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-4 py-2 border border-green-300 rounded-lg text-green-700 hover:bg-green-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-lg font-semibold shadow hover:shadow-lg transition disabled:opacity-60"
              >
                {loading ? "Đang xử lý..." : "Thay đổi mật khẩu"}
              </button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-sm font-medium text-green-800 mb-2">Lưu ý:</h3>
            <ul className="text-xs text-green-700 space-y-1">
              <li>• Mật khẩu mới phải có ít nhất 6 ký tự</li>
              <li>• Mật khẩu mới phải khác mật khẩu hiện tại</li>
              <li>• Sau khi thay đổi, bạn sẽ cần đăng nhập lại</li>
            </ul>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .animate-fade-in { animation: fade-in 0.5s; }
        .animate-shake { animation: shake 0.3s; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes shake {
          0% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}