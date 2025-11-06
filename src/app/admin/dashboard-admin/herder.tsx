"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axiosInstance from "../../../../ultis/axios";
import { io, Socket } from "socket.io-client";
import { LogOut, LayoutDashboard, Users, ChevronRight } from 'lucide-react';

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io("http://localhost:5000", {
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

const navItems = [
  { 
    href: "/admin/dashboard", 
    label: "Dashboard", 
    icon: <LayoutDashboard className="w-5 h-5" /> 
  },
  { 
    href: "/admin/user", 
    label: "Quản lý người dùng", 
    icon: <Users className="w-5 h-5" /> 
  }
];

export default function LeftSidebarHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = typeof window !== "undefined" ? 
          sessionStorage.getItem("token") || localStorage.getItem("token") : null;
        if (!token) return;

        const res = await axiosInstance.get("/api/users/me");
        setMe(res.data);

        const userId = res.data._id || res.data.id;
        if (userId) {
          const sock = getSocket();
          if (!sock.connected) {
            sock.once("connect", () => sock.emit("join", userId.toString()));
          } else {
            sock.emit("join", userId.toString());
          }
        }
      } catch (err) {
        console.warn("Fetch user failed", err);
      }
    })();
  }, []);

  const onLogout = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("token");
      localStorage.removeItem("token");
    }
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    router.replace("/login");
  };

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col">
      {/* Logo */}
      <div className="px-6 py-8 border-b border-gray-700">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-xl font-bold">A</span>
          </div>
          <span className="text-xl font-semibold">Admin<span className="text-blue-400">Panel</span></span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6">
        <ul className="space-y-1">
          {navItems.map(item => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-6 py-3.5 transition-colors relative group
                    ${active ? 
                      'text-white bg-gradient-to-r from-blue-600 to-blue-500' : 
                      'text-gray-300 hover:text-white hover:bg-gray-800'
                    }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  <ChevronRight className={`w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity
                    ${active ? 'opacity-100' : ''}`} 
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile & Logout */}
      <div className="border-t border-gray-700">
        {me && (
          <div className="px-6 py-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 
                flex items-center justify-center shadow-lg">
                {me.avatar ? (
                  <img src={me.avatar} alt="avatar" className="w-full h-full rounded-lg object-cover" />
                ) : (
                  <span className="text-white text-lg font-bold">
                    {(me.full_name?.[0] || "U").toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <p className="font-medium text-white">{me.full_name || "Người dùng"}</p>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-6 py-4 text-left 
            text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}