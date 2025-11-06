// ...existing code...
"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";

type NavItem = {
  key: string;
  label: string;
  path: string;
  Icon: React.FC<{ className?: string }>;
};

const IconDashboard: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M3 13h8V3H3v10zM3 21h8v-6H3v6zM13 21h8V11h-8v10zM13 3v6h8V3h-8z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconProject: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M3 7v10a2 2 0 0 0 2 2h14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconCalendar: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <rect x="3" y="5" width="18" height="16" rx="2" ry="2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 3v4M8 3v4M3 11h18" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconProfile: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="7" r="4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconPlus: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M12 5v14M5 12h14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function Sidebar(): JSX.Element {
  const router = useRouter();
  const pathname = usePathname();

  const nav: NavItem[] = [
    { key: "dashboard", label: "Dashboard", path: "/admin/dashboard", Icon: IconDashboard },
    { key: "manageruser", label: "Quản lý User", path:"/admin/dashboard/manageruser", Icon: IconPlus },
  ];

  const handleNavigation = (path: string) => router.push(path);

  const logout = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("token");
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      localStorage.removeItem("isAdmin");
      localStorage.removeItem("userEmail");
    }
    router.replace("/login");
  };

  const userEmail = typeof window !== "undefined" ? localStorage.getItem("userEmail") : null;
  const userName = typeof window !== "undefined" ? (localStorage.getItem("userName") || "") : "";

  return (
    <aside className="w-72 bg-white h-screen fixed left-0 top-0 border-r border-gray-100 shadow-sm flex flex-col">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-r from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold shadow">
            S
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">SEP Workspace</div>
            <div className="text-xs text-gray-400">Project Management</div>
          </div>
        </div>
      </div>

      <div className="px-3 py-4">
        <div className="text-xs text-gray-400 uppercase px-3 mb-2">Điều hướng</div>
        <nav className="space-y-2">
          {nav.map((item) => {
            const active = pathname === item.path || pathname?.startsWith(item.path + "/");
            return (
              <button
                key={item.key}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  active ? "bg-orange-50 ring-1 ring-orange-200 text-orange-600" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <item.Icon className={`w-5 h-5 ${active ? "text-orange-500" : "text-gray-400"}`} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto px-4 pb-6">
        <div className="text-xs text-gray-400 mb-3">Tài khoản</div>
        <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
          <img
            src={typeof window !== "undefined" ? (localStorage.getItem("userAvatar") || "/default-avatar.png") : "/default-avatar.png"}
            alt="avatar"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{userName || "Người dùng"}</div>
            <div className="text-xs text-gray-500 truncate">{userEmail ?? ""}</div>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full mt-3 flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 17l5-5-5-5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12H9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
