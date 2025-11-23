"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import axiosInstance from "../../ultis/axios";
import Link from "next/link";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<{ _id?: string; id?: string; full_name?: string; email?: string; avatar?: string; role?: number } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setShowDropdown(false);
  }, [pathname]);

  useEffect(() => {
    if (showDropdown && buttonRef.current) {
      const updatePosition = () => {
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + 8,
            right: window.innerWidth - rect.right,
          });
        }
      };

      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [showDropdown]);

  useEffect(() => {
    (async () => {
      try {
        const token =
          typeof window !== "undefined"
            ? sessionStorage.getItem("token") || localStorage.getItem("token")
            : null;
        if (!token) return;

        const res = await axiosInstance.get('/api/users/me');
        const userData = res.data || null;
        setMe(userData);
      } catch {
        // ignore
      }
    })();
  }, []);

  const onLogout = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("token");
      localStorage.removeItem("token");
    }
    router.replace('/login');
  };

  const handleProfileClick = () => {
    router.push("/myprofile");
    setShowDropdown(false);
  };

  const handleChangePasswordClick = () => {
    router.push("/change-password");
    setShowDropdown(false);
  };

  const handleLogoutClick = () => {
    onLogout();
    setShowDropdown(false);
  };

  const isSupervisor = me?.role === 4;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 md:px-6 h-16">
        {/* Logo/Brand */}
        <div className="flex items-center gap-3">
          <Link href={isSupervisor ? "/supervisor/projects" : "/dashboard"} className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div className="hidden md:block">
              <h1 className="text-lg font-bold text-gray-900">SEP Workspace</h1>
            </div>
          </Link>
        </div>

        {/* User Profile Dropdown */}
        {me && (
          <div className="relative z-50">
            <button
              ref={buttonRef}
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 relative z-50"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center overflow-hidden">
                {me.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={me.avatar}
                    alt="avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-semibold text-white">
                    {(
                      me.full_name?.[0] ||
                      me.email?.[0] ||
                      "U"
                    ).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                  {me.full_name || "Người dùng"}
                </p>
                <p className="text-xs text-gray-500 truncate max-w-[150px]">
                  {me.email || "Sinh viên FPT"}
                </p>
              </div>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu - Render via Portal to avoid stacking context issues */}
            {showDropdown && mounted && typeof window !== 'undefined' && createPortal(
              <>
                <div
                  className="fixed inset-0 z-[9998]"
                  onClick={() => setShowDropdown(false)}
                />
                <div 
                  className="fixed w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[9999]"
                  style={{
                    top: `${dropdownPosition.top}px`,
                    right: `${dropdownPosition.right}px`,
                  }}
                >
                  <div className="px-4 py-3 border-b border-gray-200 md:hidden">
                    <p className="text-sm font-medium text-gray-900">
                      {me.full_name || "Người dùng"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {me.email || "Sinh viên FPT"}
                    </p>
                  </div>
                  <button
                    onClick={handleProfileClick}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors duration-200"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Hồ sơ của tôi</span>
                  </button>
                  <button
                    onClick={handleChangePasswordClick}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors duration-200"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    <span>Đổi mật khẩu</span>
                  </button>
                  <div className="border-t border-gray-200 my-1" />
                  <button
                    onClick={handleLogoutClick}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors duration-200"
                  >
                    <svg
                      className="w-5 h-5 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </>,
              document.body
            )}
          </div>
        )}
      </div>
    </header>
  );
}

