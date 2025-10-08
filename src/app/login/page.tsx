"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "../../../ultis/axios";

export default function LoginPage() {
  const router = useRouter();
  const googleBtnRef = useRef<HTMLDivElement | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      // @ts-ignore
      if (!window.google || !google.accounts || !google.accounts.id) return;
      // @ts-ignore
      google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse,
        ux_mode: "popup",
      });
      if (googleBtnRef.current) {
        // @ts-ignore
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

  const handleGoogleResponse = async (response: any) => {
    try {
      setError(null);
      setLoading(true);
      const idToken = response?.credential;
      if (!idToken) throw new Error("Không nhận được phản hồi từ Google");
      const res = await axiosInstance.post("/api/auth/google", { idToken });
      const token = res.data?.token;
      if (token) {
        sessionStorage.setItem("token", token);
        localStorage.setItem("token", token); // keep both for existing interceptor behavior
      }
      router.replace("/dashboard");
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Đăng nhập Google thất bại");
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
      if (token) {
        sessionStorage.setItem("token", token);
        localStorage.setItem("token", token);
      }
      router.replace("/dashboard");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md card rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-6" style={{color:'var(--primary)'}}>Đăng nhập</h1>

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
          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm">Mật khẩu</label>
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
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary rounded-lg py-2 disabled:opacity-60"
          >
            {loading ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-1 h-px" style={{background:'var(--border)'}} />
          <span className="px-3 text-xs" style={{color:'var(--primary-700)'}}>hoặc</span>
          <div className="flex-1 h-px" style={{background:'var(--border)'}} />
        </div>

        <div className="flex justify-center">
          <div ref={googleBtnRef} />
        </div>
      </div>
    </div>
  );
}


