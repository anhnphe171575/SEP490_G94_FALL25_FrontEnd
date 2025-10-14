"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "../../../ultis/axios";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      await axiosInstance.post("api/auth/forgot-password", { email });
      setMessage("Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.");
      router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Yêu cầu thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md card rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-6" style={{color:'var(--primary)'}}>Quên mật khẩu</h1>

        {message ? (
          <div className="mb-4 text-green-600 text-sm">{message}</div>
        ) : null}
        {error ? (
          <div className="mb-4 text-red-600 text-sm">{error}</div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary rounded-lg py-2 disabled:opacity-60"
          >
            {loading ? "Đang gửi..." : "Đặt lại"}
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


