"use client";

import { useEffect, useState } from "react";
import axiosInstance from "../../../ultis/axios";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Me = {
  _id: string;
  email: string;
  full_name?: string;
  role?: number;
  avatar?: string;
};

export default function MyProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? (sessionStorage.getItem('token') || localStorage.getItem('token')) : null;
    if (!token) {
      router.replace('/login');
      return;
    }
    (async () => {
      try {
        const res = await axiosInstance.get('/api/users/me');
        setMe(res.data);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Không thể tải hồ sơ');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) {
    return <main className="p-6">Đang tải...</main>;
  }

  if (error) {
    return <main className="p-6 text-red-600">{error}</main>;
  }

  if (!me) return null;

  return (
    <main className="p-6">
      <div className="mx-auto w-full max-w-5xl">
        {/* Header actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <button className="text-sm font-medium px-2 py-1 rounded" style={{color:'var(--primary)'}}>Thông tin cá nhân</button>
            <button className="text-sm opacity-80 px-2 py-1">Dự án</button>
            <button className="text-sm opacity-80 px-2 py-1">Cài đặt</button>
          </div>
          <button className="px-4 py-2 rounded-lg btn-primary text-white">✎ Chỉnh Sửa</button>
        </div>

        {/* Top section */}
        <div className="grid grid-cols-1 lg:grid-cols-[auto,1fr] gap-6 mb-8">
          {/* Avatar card */}
          <div className="card rounded-xl p-6 flex items-center gap-5">
            <div className="w-24 h-24 rounded-xl overflow-hidden flex items-center justify-center text-3xl font-semibold border" style={{borderColor:'var(--border)', background:'var(--muted)'}}>
              {me.avatar ? (
                <Image src={me.avatar} alt="avatar" width={96} height={96} />
              ) : (
                (me.full_name?.[0]?.toUpperCase() || me.email?.[0]?.toUpperCase() || 'N')
              )}
            </div>
            <div className="flex-1">
              <div className="text-lg font-medium">{me.full_name || 'No name'}</div>
              <div className="text-sm opacity-80">{me.email}</div>
            </div>
            <button className="btn-primary rounded-lg px-4 py-2 text-sm">⬆ Tải Ảnh Lên</button>
          </div>

          {/* Banner */}
          <div className="card rounded-xl p-6 flex items-center justify-between">
            <div>
              <div className="font-medium mb-1">Thông báo</div>
              <div className="text-sm opacity-75">Cập nhật hồ sơ để tăng mức độ hoàn thiện tài khoản của bạn.</div>
            </div>
            <button className="px-4 py-2 rounded-lg" style={{border:'1px solid var(--border)'}}>Hoàn thiện</button>
          </div>
        </div>

        {/* Details */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold" style={{color:'var(--primary)'}}>Thông Tin Cá Nhân</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Họ và Tên', icon: '👤', value: me.full_name || 'Empty' },
            { label: 'Email', icon: '✉️', value: me.email || 'Empty' },
            { label: 'Số Điện Thoại', icon: '📞', value: 'Empty' },
            { label: 'Mã Số Sinh Viên', icon: '🆔', value: 'Empty' },
            { label: 'Chuyên Ngành', icon: '📘', value: 'Empty' },
          ].map((item) => (
            <div key={item.label} className="card rounded-xl p-4">
              <div className="text-xs opacity-70 mb-2">{item.label}</div>
              <div className="flex items-center gap-2">
                <span>{item.icon}</span>
                <div className="font-medium">{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

