"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axiosInstance from "../../ultis/axios";

const navItems = [

  { href: "/dashboard", label: "Dashboard", icon: (
    <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 21">
      <path d="M16.975 11H10V4.025a1 1 0 0 0-1.066-.998 8.5 8.5 0 1 0 9.039 9.039.999.999 0 0 0-1-1.066h.002Z"/>
      <path d="M12.5 0c-.157 0-.311.01-.565.027A1 1 0 0 0 11 1.02V10h8.975a1 1 0 0 0 1-.935c.013-.188.028-.374.028-.565A8.51 8.51 0 0 0 12.5 0Z"/>
    </svg>
  )},
  { href: "/", label: "Dự án", icon: (
    <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 18">
      <path d="M6.143 0H1.857A1.857 1.857 0 0 0 0 1.857v4.286C0 7.169.831 8 1.857 8h4.286A1.857 1.857 0 0 0 8 6.143V1.857A1.857 1.857 0 0 0 6.143 0Zm10 0h-4.286A1.857 1.857 0 0 0 10 1.857v4.286C10 7.169 10.831 8 11.857 8h4.286A1.857 1.857 0 0 0 18 6.143V1.857A1.857 1.857 0 0 0 16.143 0Zm-10 10H1.857A1.857 1.857 0 0 0 0 11.857v4.286C0 17.169.831 18 1.857 18h4.286A1.857 1.857 0 0 0 8 16.143v-4.286A1.857 1.857 0 0 0 6.143 10Zm10 0h-4.286A1.857 1.857 0 0 0 10 11.857v4.286c0 1.026.831 1.857 1.857 1.857h4.286A1.857 1.857 0 0 0 18 16.143v-4.286A1.857 1.857 0 0 0 16.143 10Z"/>
    </svg>
  )},
 

  { 
    href: "/dashboard", 
    label: "Bảng điều khiển", 
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
    href: "/myprofile", 
    label: "Hồ sơ", 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  },
];

export default function ResponsiveSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<{ full_name?: string; email?: string; avatar?: string } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

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
        setMe(res.data || null);
      } catch {
        // silently ignore
      }
    })();
  }, []);

  const onLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('token');
      localStorage.removeItem('token');
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
        <div className="h-full px-3 py-4 overflow-y-auto glass">
          {me ? (
            <div className="mb-4 relative">
              <div 
                className="flex items-center gap-3 p-3 card cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={handleAvatarClick}
              >
                <div className="h-10 w-10 rounded-full flex items-center justify-center overflow-hidden bg-gray-100">
                  {me.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={me.avatar} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-semibold text-gray-600">{(me.full_name?.[0] || me.email?.[0] || 'U').toUpperCase()}</span>
                  )}
                </div>
                <div className="truncate">
                  <div className="text-sm font-medium truncate">{me.full_name || 'User'}</div>
                  <div className="text-xs text-gray-500 truncate">{me.email || ''}</div>
                </div>
                <svg className="w-4 h-4 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
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
              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="py-1">
                    <button
                      onClick={handleProfileClick}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                      Thông tin cá nhân
                    </button>
                    <button
                      onClick={handleChangePasswordClick}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                      </svg>
                      Thay đổi mật khẩu
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={handleLogoutClick}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                      </svg>
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
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
                    <div className={`mr-3 flex-shrink-0 ${active ? 'text-orange-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                      {item.icon}
                    </div>
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
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
                      <div className={`mr-3 flex-shrink-0 ${active ? 'text-orange-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                        {item.icon}
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


