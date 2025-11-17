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
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-orange-100 p-8 mt-10 animate-fade-in"
          style={{
            boxShadow: "0 4px 24px 0 rgba(251,146,60,0.10)",
          }}
        >
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-200 to-orange-400 rounded-full flex items-center justify-center shadow">
            <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-orange-600 text-center drop-shadow">
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
        className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-orange-200 mt-10 animate-fade-in relative"
        style={{
          boxShadow: "0 4px 24px 0 rgba(251,146,60,0.13)",
        }}
      >
        {/* Hiệu ứng ánh sáng cam */}
        <div className="absolute -top-8 -left-8 w-40 h-40 bg-gradient-to-br from-orange-300 via-orange-100 to-transparent rounded-full opacity-20 blur-2xl pointer-events-none animate-pulse"></div>
        <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-gradient-to-tr from-orange-400 via-orange-200 to-transparent rounded-full opacity-15 blur-2xl pointer-events-none animate-pulse"></div>
        <div className="w-full flex justify-center">
  <h1 className="w-max text-2xl font-bold mb-6 pt-8 pb-2 tracking-wide text-center relative z-10">
    <span
      className="bg-gradient-to-r from-orange-400 via-pink-400 via-purple-500 to-fuchsia-600 bg-clip-text text-transparent drop-shadow-lg"
      style={{
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        color: "transparent",
        display: "inline-block",
      }}
    >
      Thay đổi mật khẩu
    </span>
  </h1>
</div>
        <div className="px-8 pb-8">
          {error && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-600 text-sm animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-orange-700 mb-1">
                Mật khẩu hiện tại
              </label>
              <input
                id="currentPassword"
                type="password"
                required
                value={formData.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                className="w-full border border-orange-200 rounded-lg px-3 py-2 text-orange-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-200 transition"
                placeholder="Nhập mật khẩu hiện tại"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-orange-700 mb-1">
                Mật khẩu mới
              </label>
              <input
                id="newPassword"
                type="password"
                required
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                className="w-full border border-orange-200 rounded-lg px-3 py-2 text-orange-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-200 transition"
                placeholder="Nhập mật khẩu mới"
              />
              <p className="text-xs text-gray-500 mt-1">
                Mật khẩu phải có ít nhất 6 ký tự
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-orange-700 mb-1">
                Xác nhận mật khẩu mới
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="w-full border border-orange-200 rounded-lg px-3 py-2 text-orange-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-200 transition"
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-4 py-2 border border-orange-200 rounded-lg text-orange-700 hover:bg-orange-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-lg font-semibold shadow hover:shadow-lg transition disabled:opacity-60"
              >
                {loading ? "Đang xử lý..." : "Thay đổi mật khẩu"}
              </button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h3 className="text-sm font-medium text-orange-700 mb-2">Lưu ý:</h3>
            <ul className="text-xs text-orange-700 space-y-1">
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
        @keyframes bounceTitle {
          0% { transform: translateY(0);}
          50% { transform: translateY(-12px);}
          100% { transform: translateY(0);}
        }
      `}</style>
    </div>
  );
}