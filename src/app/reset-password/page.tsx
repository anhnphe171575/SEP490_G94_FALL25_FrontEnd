"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axiosInstance from "../../../ultis/axios";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState("");

  useEffect(() => {
    const queryEmail = searchParams.get("email") || "";
    const queryToken = searchParams.get("token") || "";
    setEmail(queryEmail);
    setResetToken(queryToken);
  }, [searchParams]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      await axiosInstance.post("/api/auth/reset-password", { 
        
        resetToken, newPassword: password
      });
      toast.success("Đặt lại mật khẩu thành công!");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Đặt lại mật khẩu thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md card rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-6" style={{color:'var(--primary)'}}>Đặt lại mật khẩu</h1>

        {message ? (
          <div className="mb-4 text-green-600 text-sm">{message}</div>
        ) : null}
        {error ? (
          <div className="mb-4 text-red-600 text-sm">{error}</div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full border rounded-lg px-3 py-2 bg-gray-50"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm">Mật khẩu mới</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="block text-sm">Xác nhận mật khẩu</label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary rounded-lg py-2 disabled:opacity-60"
          >
            {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button 
            className="text-sm" 
            style={{color:'var(--primary)'}} 
            onClick={() => router.push("/login")}
          >
            Quay lại đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
}
