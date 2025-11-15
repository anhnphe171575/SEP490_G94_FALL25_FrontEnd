"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axiosInstance from "../../ultis/axios";
import { io, Socket } from "socket.io-client";
import NotificationToast from "./NotificationToast";


let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io("http://localhost:5000", {
      transports: ["websocket", "polling"]
    });
  }
  return socket;
}

export default function ResponsiveSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  
  const [me, setMe] = useState<{ _id?: string; id?: string; full_name?: string; email?: string; avatar?: string; role?: number; current_project?: string } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState<{ team_unread: number; direct_unread: number; total_unread: number }>({ team_unread: 0, direct_unread: 0, total_unread: 0 });
  const [fetchedProjectId, setFetchedProjectId] = useState<string | null>(null);
  
  // Extract projectId from pathname if we're in a project
  const projectMatch = pathname?.match(/\/projects\/([^\/]+)/);
  const urlProjectId = projectMatch ? projectMatch[1] : null;
  
  // Use projectId from URL if available, otherwise use fetched projectId
  const projectId = urlProjectId || fetchedProjectId;
  
  // Debug: log projectId to console (remove in production)
  useEffect(() => {
    if (projectId) {
      console.log('Sidebar projectId:', projectId, 'from URL:', !!urlProjectId, 'from API:', !!fetchedProjectId);
    }
  }, [projectId, urlProjectId, fetchedProjectId]);

  useEffect(() => {
    setOpen(false);
    setShowDropdown(false);
  }, [pathname]);

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
        
        // Get current project from user's projects list
        try {
          const projectsRes = await axiosInstance.get('/api/projects');
          const data = projectsRes.data;
          // Check different possible response structures (based on dashboard page)
          const projects = data?.projects || data?.data?.projects || data?.data || [];
          console.log('Projects response:', { data, projects, length: projects?.length });
          if (Array.isArray(projects) && projects.length > 0) {
            // Get the first project (or you can use the most recent one)
            const firstProject = projects[0];
            const projectId = firstProject?._id || firstProject?.id;
            console.log('Setting fetchedProjectId:', projectId);
            if (projectId) {
              setFetchedProjectId(projectId);
            }
          }
        } catch (err) {
          console.error('Error fetching projects:', err);
          // If no projects or error, try to get from user data
          if (userData?.current_project) {
            setFetchedProjectId(userData.current_project);
          }
        }
        
        if (userData?._id || userData?.id) {
          const userId = userData._id || userData.id;
          const sock = getSocket();
          if (sock.connected) {
            sock.emit("join", userId.toString());
          } else {
            sock.once("connect", () => {
              sock.emit("join", userId.toString());
            });
          }
        }

      } catch {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = typeof window !== "undefined" ? sessionStorage.getItem("token") || localStorage.getItem("token") : null;
        if (!token) return;
        const res = await axiosInstance.get("/api/notifications/unread-count");
        if (res.data?.unread_count !== undefined) {
          setUnreadCount(res.data.unread_count);
        }
      } catch {
        // silently ignore
      }
    };

    fetchUnreadCount();

    const token = typeof window !== "undefined" ? sessionStorage.getItem("token") || localStorage.getItem("token") : null;
    if (token) {
      const sock = getSocket();

      sock.on("connect", () => {
        if (me?._id || me?.id) {
          const userId = (me._id || me.id)?.toString();
          if (userId) {
            sock.emit("join", userId);
          }
        }
      });

      sock.on("notification", () => {
        setUnreadCount((prev) => prev + 1);
      });

      sock.on("notification-read", (data: any) => {
        if (data?.unread_count !== undefined) {
          setUnreadCount(data.unread_count);
        } else {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      });

      return () => {
        sock.off("notification");
        sock.off("notification-read");
      };
    }
  }, [me?._id, me?.id]);

  // Fetch unread messages count (team + direct)
  useEffect(() => {
    const fetchUnreadMessages = async () => {
      try {
        const token = typeof window !== 'undefined' ? (sessionStorage.getItem('token') || localStorage.getItem('token')) : null;
        if (!token) return;
        const res = await axiosInstance.get('/api/messages/unread-count', {
          validateStatus: (status) => {
            // Không throw error cho các status code này, để xử lý trong catch
            return status < 500;
          }
        });
        if (res.status === 200 && res.data) {
          setUnreadMessages({
            team_unread: res.data.team_unread || 0,
            direct_unread: res.data.direct_unread || 0,
            total_unread: res.data.total_unread || 0,
          });
        }
      } catch (err: any) {
        // Chỉ log trong development, không crash app
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to fetch unread messages count:', err?.response?.status || err?.message);
        }
        // Giữ nguyên giá trị hiện tại hoặc set về 0 nếu chưa có
        setUnreadMessages(prev => prev.total_unread === undefined ? { team_unread: 0, direct_unread: 0, total_unread: 0 } : prev);
      }
    };

    fetchUnreadMessages();
    // Poll mỗi 30s
    const interval = setInterval(fetchUnreadMessages, 30000);

    // Cập nhật realtime theo socket events
    const sock = getSocket();
    const refresh = () => fetchUnreadMessages();
    sock.on('new-team-message', refresh);
    sock.on('new-direct-message', refresh);
    sock.on('message-read', refresh);
    sock.on('joined-team', refresh);
    sock.on('connect', refresh);

    return () => {
      clearInterval(interval);
      sock.off('new-team-message', refresh);
      sock.off('new-direct-message', refresh);
      sock.off('message-read', refresh);
      sock.off('joined-team', refresh);
      sock.off('connect', refresh);
    };
  }, []);

  

  const onLogout = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("token");
      localStorage.removeItem("token");
    }
    setUnreadCount(0);
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    router.replace('/login');

  };

  const handleAvatarClick = () => {
    setShowDropdown(!showDropdown);
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


  // Project-specific navigation items
  const projectNavItems = projectId ? [
    {
      href: `/projects/${projectId}/tasks/dashboard`,
      label: "Bảng điều khiển",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      href: `/projects/${projectId}/tasks`,
      label: "Công việc",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    },
    {
      href: `/projects/${projectId}/features`,
      label: "Tính năng",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      )
    },
    {
      href: `/projects/${projectId}/functions`,
      label: "Chức năng",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      href: `/projects/${projectId}`,
      label: "Cột mốc",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      href: `/projects/${projectId}/documents`,
      label: "Tài liệu",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      href: `/projects/${projectId}/team`,
      label: "Đội nhóm",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      href: `/notifications`,
      label: "Thông báo",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      )
    },
    {
      href: `/messages`,
      label: "Tin nhắn nhóm",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    {
      href: `/calendar`,
      label: "Lịch họp",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      )
    }
  ] : [];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        type="button"
        aria-controls="mobile-sidebar"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center p-2 mt-2 ms-3 text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600"
      >
        <span className="sr-only">Mở sidebar</span>
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        id="mobile-sidebar"
        className={`fixed top-0 left-0 z-50 w-56 h-screen transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:hidden`}
        aria-label="Sidebar"
      >
        <div className="h-full bg-white border-r border-gray-200 shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
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
              <Link href="/dashboard" className="flex items-center gap-3">
              <div>

                <h1 className="text-lg font-bold text-gray-900">
                  SEP Workspace
                  
                </h1>
                <p className="text-xs text-gray-500">Project Management</p>
              </div>
              </Link>
            </div>
            <button

                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>

            </button>
          </div>


          {/* Navigation */}
          <div className="px-4 py-4">
            <div className="space-y-1">
              {/* Project-specific navigation */}
              {projectNavItems.length > 0 && (
                <>
                  <div className="px-2 py-1">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Dự án
                    </h3>
                  </div>
                  {projectNavItems.map((item) => {
                    // Special handling for milestone (base project page)
                    let active = false;
                    if (item.href === `/projects/${projectId}`) {
                      // For milestone, check if we're on the base project page (not in sub-routes)
                      active = pathname === item.href || (pathname?.startsWith(item.href) && !pathname?.match(/\/projects\/[^\/]+\/(tasks|features|functions|documents|team|details|monitoring|notifications|messages|calendar)/));
                    } else {
                      active = pathname === item.href || pathname?.startsWith(item.href + '/');
                    }
                    const isNotification = item.href === `/notifications`;
                    const isMessages = item.href === `/messages`;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                          active
                            ? "bg-orange-50 text-orange-700 border-l-4 border-orange-500"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        <div className={`mr-3 flex-shrink-0 relative ${active ? 'text-orange-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                          {item.icon}
                          {isNotification && unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-4 min-w-4 px-1 text-[10px] font-semibold text-white bg-red-500 rounded-full">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          )}
                          {isMessages && unreadMessages.total_unread > 0 && (
                            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-4 min-w-4 px-1 text-[10px] font-semibold text-white bg-indigo-500 rounded-full">
                              {unreadMessages.total_unread > 99 ? '99+' : unreadMessages.total_unread}
                            </span>
                          )}
                        </div>
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </>
              )}
            </div>

          </div>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-56 md:flex-col md:fixed md:inset-y-0 z-50">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 shadow-sm">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
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
              <Link href="/dashboard" className="flex items-center gap-3">
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  SEP Workspace
                </h1>
                <p className="text-xs text-gray-500">Project Management</p>
              </div>
              </Link>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 flex flex-col px-4 py-4">
            <nav className="flex-1 space-y-2">
              {/* Project-specific navigation */}
              {projectNavItems.length > 0 && (
                <>
                  <div className="px-2 py-1">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Dự án
                    </h3>
                  </div>
                  <div className="space-y-1">
                    {projectNavItems.map((item) => {
                      // Special handling for milestone (base project page)
                      let active = false;
                      if (item.href === `/projects/${projectId}`) {
                        // For milestone, check if we're on the base project page (not in sub-routes)
                        active = pathname === item.href || (pathname?.startsWith(item.href) && !pathname?.match(/\/projects\/[^\/]+\/(tasks|features|functions|documents|team|details|monitoring|notifications|messages|calendar)/));
                      } else {
                        active = pathname === item.href || pathname?.startsWith(item.href + '/');
                      }
                      const isNotification = item.href === `/projects/${projectId}/notifications`;
                      const isMessages = item.href === `/projects/${projectId}/messages`;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                            active
                              ? "bg-orange-50 text-orange-700 border-l-4 border-orange-500"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          }`}
                        >
                          <div className={`mr-3 flex-shrink-0 relative ${active ? 'text-orange-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                            {item.icon}
                            {isNotification && unreadCount > 0 && (
                              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-4 min-w-4 px-1 text-[10px] font-semibold text-white bg-red-500 rounded-full">
                                {unreadCount > 99 ? '99+' : unreadCount}
                              </span>
                            )}
                            {isMessages && unreadMessages.total_unread > 0 && (
                              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-4 min-w-4 px-1 text-[10px] font-semibold text-white bg-indigo-500 rounded-full">
                                {unreadMessages.total_unread > 99 ? '99+' : unreadMessages.total_unread}
                              </span>
                            )}
                          </div>
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
            </nav>

          </div>
        </div>
      </aside>
      <NotificationToast />
    </>
  );
}
