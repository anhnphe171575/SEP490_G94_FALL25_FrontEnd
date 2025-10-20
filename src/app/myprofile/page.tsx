"use client";

import { useEffect, useState } from "react";
import axiosInstance from "../../../ultis/axios";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Address = {
  street: string;
  city: string;
  postalCode: string;
  contry: string;
  _id: string;
};

type Me = {
  _id: string;
  email: string;
  full_name?: string;
  address?: Address[];
  major?: string;
  phone?: string;
  dob?: string;
  avatar?: string;
  role?: number;
};

export default function MyProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    dob: '',
    major: '',
    address: {
      street: '',
      city: '',
      postalCode: '',
      contry: ''
    }
  });
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? (sessionStorage.getItem('token') || localStorage.getItem('token')) : null;
    if (!token) {
      router.replace('/login');
      return;
    }
    (async () => {
      try {
        await fetchProfile();
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Không thể tải hồ sơ');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const fetchProfile = async () => {
    try {
      const res = await axiosInstance.get('/api/users/profile');
      setMe(res.data);
      // Update edit form with fresh data
      if (res.data) {
        setEditForm({
          full_name: res.data.full_name || '',
          phone: res.data.phone || '',
          dob: res.data.dob || '',
          major: res.data.major || '',
          address: res.data.address && res.data.address.length > 0 ? res.data.address[0] : {
            street: '',
            city: '',
            postalCode: '',
            contry: ''
          }
        });
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể tải hồ sơ');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const updateData = {
        full_name: editForm.full_name,
        phone: editForm.phone,
        dob: editForm.dob,
        major: editForm.major,
        address: [editForm.address]
      };
      
      await axiosInstance.put('/api/users/profile', updateData);
      
      // Fetch lại dữ liệu trang sau khi cập nhật thành công
      await fetchProfile();
      
      setIsEditDialogOpen(false);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setEditForm(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

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
          <button 
            onClick={() => setIsEditDialogOpen(true)}
            className="px-4 py-2 rounded-lg btn-primary text-white"
          >
            ✎ Chỉnh Sửa
          </button>
        </div>

        {/* Top section */}
        <div className="grid grid-cols-1 lg:grid-cols-[auto,1fr] gap-6 mb-8">
          {/* Avatar card */}
          <div className="card rounded-xl p-6 flex items-center gap-5">
            <div className="w-24 h-24 rounded-xl overflow-hidden flex items-center justify-center text-3xl font-semibold border" style={{borderColor:'var(--border)', background:'var(--muted)'}}>
              {me.avatar ? (
                <Image 
                  src={me.avatar} 
                  alt="avatar" 
                  width={96} 
                  height={96} 
                  className="w-full h-full object-cover"
                />
              ) : (
                (me.full_name?.[0]?.toUpperCase() || me.email?.[0]?.toUpperCase() || 'N')
              )}
            </div>
            <div className="flex-1">
              <div className="text-lg font-medium">{me.full_name || 'Chưa cập nhật tên'}</div>
              <div className="text-sm opacity-80">{me.email}</div>
              {me.major && (
                <div className="text-xs opacity-60 mt-1">{me.major}</div>
              )}
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
            { label: 'Họ và Tên', icon: '👤', value: me.full_name || 'Chưa cập nhật' },
            { label: 'Email', icon: '✉️', value: me.email || 'Chưa cập nhật' },
            { label: 'Số Điện Thoại', icon: '📞', value: me.phone || 'Chưa cập nhật' },
            { label: 'Ngày Sinh', icon: '🎂', value: me.dob ? new Date(me.dob).toLocaleDateString('vi-VN') : 'Chưa cập nhật' },
            { label: 'Chuyên Ngành', icon: '📘', value: me.major || 'Chưa cập nhật' },
            { 
              label: 'Địa Chỉ', 
              icon: '📍', 
              value: me.address && me.address.length > 0 
                ? `${me.address[0].street}, ${me.address[0].city}, ${me.address[0].contry} ${me.address[0].postalCode}`
                : 'Chưa cập nhật' 
            },
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

      {/* Edit Dialog */}
      {isEditDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold" style={{color:'var(--primary)'}}>
                  Chỉnh sửa thông tin cá nhân
                </h2>
                <button 
                  onClick={() => setIsEditDialogOpen(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Họ và Tên</label>
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập họ và tên"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Số Điện Thoại</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập số điện thoại"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Ngày Sinh</label>
                    <input
                      type="date"
                      value={editForm.dob}
                      onChange={(e) => handleInputChange('dob', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Chuyên Ngành</label>
                    <input
                      type="text"
                      value={editForm.major}
                      onChange={(e) => handleInputChange('major', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập chuyên ngành"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-4">Địa Chỉ</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Đường/Phố</label>
                      <input
                        type="text"
                        value={editForm.address.street}
                        onChange={(e) => handleInputChange('address.street', e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập đường/phố"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Thành Phố</label>
                      <input
                        type="text"
                        value={editForm.address.city}
                        onChange={(e) => handleInputChange('address.city', e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập thành phố"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Mã Bưu Điện</label>
                      <input
                        type="text"
                        value={editForm.address.postalCode}
                        onChange={(e) => handleInputChange('address.postalCode', e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập mã bưu điện"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Quốc Gia</label>
                      <input
                        type="text"
                        value={editForm.address.contry}
                        onChange={(e) => handleInputChange('address.contry', e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập quốc gia"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setIsEditDialogOpen(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 btn-primary text-white rounded-lg disabled:opacity-60"
                  >
                    {submitting ? 'Đang cập nhật...' : 'Cập nhật'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

