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

  const redirectUrl = searchParams.get('redirect');

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
          size: "medium",
          shape: "pill",
          text: "signin_with",
        });
      }
    };

    loadScript();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleResponse = async (response: { credential: string }) => {
    try {
      setError(null);
      setLoading(true);
      const idToken = response?.credential;
      if (!idToken) throw new Error("Không nhận được phản hồi từ Google");

      const payload = JSON.parse(atob(idToken.split('.')[1]));
      const email = payload.email;

      if (!email || (!email.endsWith('@fpt.edu.vn') && !email.includes('he'))) {
        throw new Error("Chỉ cho phép đăng nhập bằng tài khoản FPT (@fpt.edu.vn)");
      }

      const res = await axiosInstance.post("/api/auth/google", { idToken });
      const token = res.data?.token;
      const userRole = res.data?.user?.role;
      if (token) {
        sessionStorage.setItem("token", token);
        localStorage.setItem("token", token);
      }

      if (userRole === 4) {
        router.replace("/supervisor/projects");
      } else {
        router.replace("/dashboard");
      }
    } catch (e: unknown) {
      const error = e as { response?: { data?: { message?: string } }; message?: string };
      setError(error?.response?.data?.message || error?.message || "Đăng nhập Google thất bại");
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
      const user = res.data?.user;

      if (token) {
        sessionStorage.setItem("token", token);
        localStorage.setItem("token", token);
      }

      if (user?.redirectUrl) {
        router.replace(user.redirectUrl);
      } else if (user?.role === 4) {
        router.replace("/supervisor/projects");
      } else {
        router.replace("/dashboard");
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100">
      <div className="w-full max-w-4xl bg-white/80 rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden border border-white/30">
        {/* Left side: intro */}
<div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-green-100 via-white to-pink-100 px-8 py-10 w-1/2">
  <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center leading-tight">
    Hệ thống quản lý đồ án ngành
  </h2>
  <h2 className="text-4xl font-extrabold text-green-600 mb-2 text-center leading-tight">
    Kỹ thuật phần mềm
  </h2>
  <p className="text-gray-700 text-lg mb-6 text-center">
    Nền tảng giúp bạn quản lý các dự án học tập và làm việc nhóm một cách thông minh
  </p>
  <img
    src="/illustration.png"
    alt="Login illustration"
    className="w-[400px] h-[220px] object-contain mb-2"
    style={{ maxWidth: "100%" }}
  />
</div>
        {/* Right side: login form */}
        <div className="flex-1 flex flex-col justify-center px-6 py-10 md:px-10">
          <h3 className="text-2xl font-bold text-green-600 mb-2 text-center">SoftCapstone</h3>
          <h4 className="text-lg font-semibold text-gray-800 mb-4 text-center">Welcome to SoftCapstone</h4>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ Email *
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 text-gray-900 bg-white"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu *
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 text-gray-900 bg-white"
                placeholder="••••••••"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input type="checkbox" id="remember" className="mr-2" />
                <label htmlFor="remember" className="text-sm text-gray-600">Ghi nhớ đăng nhập</label>
              </div>
              <a href="/forgotpassword" className="text-sm text-green-600 hover:underline font-medium">
                Quên mật khẩu?
              </a>
            </div>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-400 to-blue-400 hover:from-green-500 hover:to-blue-500 text-white font-semibold py-2 rounded-lg shadow-md transition-all duration-200 disabled:opacity-50"
            >
              {loading ? "Đang xử lý..." : "Đăng nhập"}
            </button>
          </form>
          {/* Divider */}
          <div className="flex items-center my-4">
            <div className="flex-1 h-px bg-gray-300" />
            <span className="px-3 text-gray-500 text-sm font-medium">HOẶC</span>
            <div className="flex-1 h-px bg-gray-300" />
          </div>
          {/* Google Sign In */}
          <div className="mb-2 flex justify-center">
            <div ref={googleBtnRef} />
          </div>
          {/* Register */}
          <button
            type="button"
            onClick={() => router.push("/register")}
            className="w-full border-2 border-green-400 text-green-600 hover:bg-green-50 font-semibold py-2 rounded-lg shadow-sm transition-all duration-200 mt-2"
          >
            Đăng ký tài khoản mới
          </button>
        </div>
      </div>
    </div>
  );
}