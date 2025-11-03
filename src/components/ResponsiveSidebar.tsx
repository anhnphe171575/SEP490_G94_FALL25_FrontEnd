"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axiosInstance from "../../ultis/axios";
import { io, Socket } from "socket.io-client";

const navItems = [
  { 
    href: "/dashboard", 
    label: "Dashboard", 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21v-4a2 2 0 012-2h4a2 2 0 012 2v4" />
      </svg>
    )
  },
  { 
    href: "/projects", 
    label: "Dự án", 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    )
  },
  { 
    href: "/notifications", 
    label: "Thông báo", 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    )
  },
  { 
    href: "/messages", 
    label: "Tin nhắn nhóm", 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    )
  },
  { 
    href: "/myprofile", 
    label: "Hồ sơ", 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  },
];

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io("http://localhost:5000", {
      transports: ['websocket', 'polling']
    });
  }
  return socket;
}

export default function ResponsiveSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<{ _id?: string; id?: string; full_name?: string; email?: string; avatar?: string } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setOpen(false);
    setShowDropdown(false);
  }, [pathname]);

  useEffect(() => {
    (async () => {
      try {
        const token = typeof window !== 'undefined' ? (sessionStorage.getItem('token') || localStorage.getItem('token')) : null;
        if (!token) return;
        const res = await axiosInstance.get('/api/users/me');
        const userData = res.data || null;
        setMe(userData);
        // Join socket room với user_id nếu đã có socket
        if (userData?._id || userData?.id) {
          const userId = userData._id || userData.id;
          const sock = getSocket();
          if (sock.connected) {
            sock.emit('join', userId.toString());
          } else {
            sock.once('connect', () => {
              sock.emit('join', userId.toString());
            });
          }
        }
      } catch {
        // silently ignore
      }
    })();
  }, []);

  // Fetch unread notifications count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = typeof window !== 'undefined' ? (sessionStorage.getItem('token') || localStorage.getItem('token')) : null;
        if (!token) return;
        const res = await axiosInstance.get('/api/notifications/unread-count');
        if (res.data?.unread_count !== undefined) {
          setUnreadCount(res.data.unread_count);
        }
      } catch {
        // silently ignore
      }
    };

    fetchUnreadCount();

    // Setup socket.io for real-time notifications
    const token = typeof window !== 'undefined' ? (sessionStorage.getItem('token') || localStorage.getItem('token')) : null;
    if (token) {
      const sock = getSocket();
      
      sock.on('connect', () => {
        console.log('Socket connected');
        // Join room với user_id nếu đã có
        if (me?._id || me?.id) {
          const userId = (me._id || me.id)?.toString();
          if (userId) {
            sock.emit('join', userId);
          }
        }
      });

      sock.on('notification', (data: any) => {
        // Increase unread count when new notification arrives
        setUnreadCount(prev => prev + 1);
      });

      sock.on('notification-read', (data: any) => {
        // Update unread count từ server response
        if (data?.unread_count !== undefined) {
          setUnreadCount(data.unread_count);
        } else {
          // Fallback: giảm count nếu không có unread_count
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      });

      return () => {
        sock.off('notification');
        sock.off('notification-read');
      };
    }
  }, [me?._id, me?.id]);

  

  const onLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('token');
      localStorage.removeItem('token');
    }
    // Reset notifications count
    setUnreadCount(0);
    // Disconnect socket
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
    router.push('/myprofile');
    setShowDropdown(false);
  };

  const handleChangePasswordClick = () => {
    router.push('/change-password');
    setShowDropdown(false);
  };

  const handleLogoutClick = () => {
    onLogout();
    setShowDropdown(false);
  };

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
          <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
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
        className={`fixed top-0 left-0 z-50 w-64 h-screen transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        } md:hidden`}
        aria-label="Sidebar"
      >
        <div className="h-full bg-white border-r border-gray-200 shadow-lg">
          {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">SEP Workspace</h1>
                <p className="text-xs text-gray-500">Project Management</p>
              </div>
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

          {/* User Info */}
          {me && (
            <div className="px-4 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center overflow-hidden">
                  {me.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={me.avatar} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-semibold text-white">
                      {(me.full_name?.[0] || me.email?.[0] || 'U').toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {me.full_name || 'Người dùng'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {me.email || 'Sinh viên FPT'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="px-4 py-4">
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Điều hướng
              </h3>
              {navItems.map((item) => {
                const active = pathname === item.href;
                const isNotification = item.href === '/notifications';
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      active
                        ? 'bg-orange-50 text-orange-700 border-l-4 border-orange-500'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className={`mr-3 flex-shrink-0 relative ${active ? 'text-orange-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                      {item.icon}
                      {isNotification && unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-4 min-w-4 px-1 text-[10px] font-semibold text-white bg-red-500 rounded-full">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </div>
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            

            {/* Logout */}
            <div className="mt-8">
              <button
                onClick={onLogout}
                className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group"
              >
                <svg className="mr-3 w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-50">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 shadow-sm">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">SEP Workspace</h1>
                <p className="text-xs text-gray-500">Project Management</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 flex flex-col px-4 py-4">
            <nav className="flex-1 space-y-2">
              <div className="px-2 py-1">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Điều hướng
                </h3>
              </div>
              <div className="space-y-1">
                {navItems.map((item) => {
                  const active = pathname === item.href;
                  const isNotification = item.href === '/notifications';
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                        active
                          ? 'bg-orange-50 text-orange-700 border-l-4 border-orange-500'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <div className={`mr-3 flex-shrink-0 relative ${active ? 'text-orange-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                        {item.icon}
                        {isNotification && unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-4 min-w-4 px-1 text-[10px] font-semibold text-white bg-red-500 rounded-full">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </div>
                      <span className="truncate">{item.label}</span>
                      
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* User Profile & Logout */}
            <div className="mt-auto">
              <div className="px-2 py-1 mb-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Tài khoản
                </h3>
              </div>
              
              

              {/* User Info */}
              {me && (
                <div className="px-3 py-3 bg-gray-50 rounded-lg mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center overflow-hidden">
                      {me.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={me.avatar} alt="avatar" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs font-semibold text-white">
                          {(me.full_name?.[0] || me.email?.[0] || 'U').toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {me.full_name || 'Người dùng'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {me.email || 'Sinh viên FPT'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group"
              >
                <svg className="mr-3 w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>

        </div>
      </aside>
    </>
  );
}


