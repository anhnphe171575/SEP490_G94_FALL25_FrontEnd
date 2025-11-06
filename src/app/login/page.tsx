
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axiosInstance from "../../../ultis/axios";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const googleBtnRef = useRef<HTMLDivElement | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectParam = searchParams.get("redirect") || undefined;

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const loadScript = () => {
      if (document.getElementById("google-identity")) return initGoogle();
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.id = "google-identity";
      script.onload = initGoogle;
      document.body.appendChild(script);
    };

    const initGoogle = () => {
      // @ts-expect-error
      if (!window.google || !google.accounts || !google.accounts.id) return;
      // @ts-expect-error
      google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse,
        ux_mode: "popup",
      });
      if (googleBtnRef.current) {
        // @ts-expect-error
        google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "signin_with",
        });
      }
    };

    loadScript();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigateAfterAuth = (user: any) => {
    const target =
      redirectParam ||
      user?.redirectUrl ||
      (user?.isAdmin ? "/admin/dashboard" : "/dashboard");
    router.replace(target);
  };

  const handleGoogleResponse = async (response: { credential: string }) => {
    try {
      setError(null);
      setLoading(true);
      const idToken = response?.credential;
      if (!idToken) throw new Error("Không nhận được phản hồi từ Google");

      // quick client-side email check (server still verifies)
      const payload = JSON.parse(atob(idToken.split(".")[1] || "{}"));
      const emailFromToken = payload?.email;
      if (!emailFromToken || (!emailFromToken.endsWith("@fpt.edu.vn") && !emailFromToken.includes("he"))) {
        throw new Error("Chỉ cho phép đăng nhập bằng tài khoản FPT (@fpt.edu.vn)");
      }

      const res = await axiosInstance.post("/api/auth/google", { idToken });
      const token = res.data?.token;

      const user = res.data?.user ?? res.data;

      if (!token) throw new Error("Không nhận được token từ server");

      sessionStorage.setItem("token", token);
      localStorage.setItem("token", token);
      if (user?.role !== undefined) localStorage.setItem("userRole", String(user.role));
      localStorage.setItem("isAdmin", String(Boolean(user?.isAdmin)));

      navigateAfterAuth(user);

      const userRole = res.data?.user?.role;
      if (token) {
        sessionStorage.setItem("token", token);
        localStorage.setItem("token", token); // keep both for existing interceptor behavior
      }
      
      // Redirect based on role
      if (userRole === 4) {
        router.replace("/dashboard-supervisor");
      } else {
        router.replace("/dashboard");
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setError(err?.response?.data?.message || err?.message || "Đăng nhập Google thất bại");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.post("/api/auth/login", { email, password });
      const token = res.data?.token;

      const user = res.data?.user ?? res.data;

      if (!token) throw new Error("Không nhận được token từ server");

      sessionStorage.setItem("token", token);
      localStorage.setItem("token", token);
      if (user?.role !== undefined) localStorage.setItem("userRole", String(user.role));
      localStorage.setItem("isAdmin", String(Boolean(user?.isAdmin)));

      navigateAfterAuth(user);
      const userRole = res.data?.user?.role;
      if (token) {
        sessionStorage.setItem("token", token);
        localStorage.setItem("token", token);
      }
      
      // Redirect based on role
      if (userRole === 4) {
        router.replace("/supervisor/dashboard");
      } else {
        router.replace("/dashboard");
      }

    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setError(err?.response?.data?.message || err?.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-orange-100"></div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Chào mừng trở lại</h1>
            <p className="text-sm text-gray-600">Đăng nhập để tiếp tục công việc của bạn</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Địa chỉ Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Mật khẩu
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-md font-semibold disabled:opacity-50"
              >
                {loading ? "Đang xử lý..." : "Đăng nhập"}
              </button>
            </form>

            <div className="my-4 flex items-center">
              <div className="flex-1 h-px bg-gray-200" />
              <div className="px-3 text-sm text-gray-500">hoặc</div>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="text-center">
              <div className="mb-3 text-xs text-blue-600">
                Chỉ cho phép đăng nhập bằng tài khoản Google có đuôi <strong>@fpt.edu.vn</strong>
              </div>
              <div ref={googleBtnRef} className="inline-block" />
            </div>
          </div>

          <div className="mt-4 text-right">
            <a href="/forgotpassword" className="text-sm text-orange-500">Quên mật khẩu?</a>
          </div>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Bạn chưa có tài khoản? <a href="#" className="text-orange-500 font-semibold">Đăng ký ngay</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
// ...existing code...