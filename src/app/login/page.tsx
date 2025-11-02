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

  // Initialize Google Identity Services
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return; // silently skip if not configured

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
      // @ts-expect-error - Google Identity Services types not available
      if (!window.google || !google.accounts || !google.accounts.id) return;
      // @ts-expect-error - Google Identity Services types not available
      google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse,
        ux_mode: "popup",
      });
      if (googleBtnRef.current) {
        // @ts-expect-error - Google Identity Services types not available
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

  const handleGoogleResponse = async (response: { credential: string }) => {
    try {
      setError(null);
      setLoading(true);
      const idToken = response?.credential;
      if (!idToken) throw new Error("Không nhận được phản hồi từ Google");
      
      // Decode JWT token để lấy thông tin email
      const payload = JSON.parse(atob(idToken.split('.')[1]));
      const email = payload.email;
      
      // Kiểm tra domain email
      if (!email || (!email.endsWith('@fpt.edu.vn') && !email.includes('he'))) {
        throw new Error("Chỉ cho phép đăng nhập bằng tài khoản FPT (@fpt.edu.vn)");
      }
      
      const res = await axiosInstance.post("/api/auth/google", { idToken });
      const token = res.data?.token;
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
      const userRole = res.data?.user?.role;
      if (token) {
        sessionStorage.setItem("token", token);
        localStorage.setItem("token", token);
      }
      
      // Redirect based on role
      if (userRole === 4) {
        router.replace("/dashboard-supervisor");
      } else {
        router.replace("/dashboard");
      }
    } catch (e: unknown) {
      const error = e as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Background với gradient động */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-orange-900">
        {/* Các hình tròn trang trí - tối ưu cho mobile */}
        <div className="absolute top-5 left-5 w-32 h-32 sm:w-48 sm:h-48 lg:w-72 lg:h-72 bg-orange-200 dark:bg-orange-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-20 sm:opacity-30 animate-blob"></div>
        <div className="absolute top-10 right-5 w-32 h-32 sm:w-48 sm:h-48 lg:w-72 lg:h-72 bg-yellow-200 dark:bg-yellow-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-20 sm:opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-2 left-10 w-32 h-32 sm:w-48 sm:h-48 lg:w-72 lg:h-72 bg-pink-200 dark:bg-pink-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-20 sm:opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Nội dung chính - căn giữa hoàn hảo */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg">
          {/* Logo hoặc tiêu đề - căn giữa hoàn hảo */}
          <div className="text-center mb-6 sm:mb-8 lg:mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 lg:w-18 lg:h-18 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl sm:rounded-2xl mb-4 sm:mb-5 lg:mb-6 shadow-lg">
              <svg className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">Chào mừng trở lại</h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400">Đăng nhập để tiếp tục công việc của bạn</p>
          </div>

          {/* Form đăng nhập - padding tối ưu */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-7 lg:p-9 shadow-2xl border border-white/20 dark:border-gray-700/20">
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-700 dark:text-red-300 text-xs sm:text-sm font-medium">{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-5 sm:space-y-6 lg:space-y-7">
              <div className="space-y-2 sm:space-y-3">
                <label htmlFor="email" className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 text-sm sm:text-base"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <label htmlFor="password" className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 text-sm sm:text-base"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold py-3 sm:py-4 px-4 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg text-sm sm:text-base lg:text-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xử lý...
                  </div>
                ) : (
                  "Đăng nhập"
                )}
              </button>
            </form>

            {/* Đường phân cách */}
            <div className="my-6 sm:my-8 lg:my-10 flex items-center">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
              <span className="px-4 sm:px-5 text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium">hoặc</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
            </div>

            {/* Google Sign In */}
            <div className="text-center">
              <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg sm:rounded-xl">
                <div className="flex items-center justify-center mb-1 sm:mb-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mr-1 sm:mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300">Lưu ý quan trọng</span>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Chỉ cho phép đăng nhập bằng tài khoản Google có đuôi <strong>@fpt.edu.vn</strong>
                </p>
              </div>
              <div 
                ref={googleBtnRef} 
                className="transform hover:scale-105 transition-transform duration-200"
              />
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="mt-6 sm:mt-8 text-right">
            <a href="/forgotpassword" className="text-sm sm:text-base text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 transition-colors duration-200">
              Quên mật khẩu?
            </a>
          </div>

          {/* Footer - căn giữa hoàn hảo */}
          <div className="text-center mt-6 sm:mt-8 lg:mt-10">
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400">
              Bạn chưa có tài khoản?{" "}
              <a href="#" className="font-semibold text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 transition-colors duration-200">
                Đăng ký ngay
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


