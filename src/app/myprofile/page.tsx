"use client";

import { useEffect, useState } from "react";
import axiosInstance from "../../../ultis/axios";
import Image from "next/image";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";
import AddressForm from "./AddressForm";
import { Settings } from "lucide-react";
import { useRouter } from "next/navigation";

type Address = {
  street: string;
  city: string;
  postalCode: string;
  contry: string;
  _id?: string;
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
  const [googleAvatar, setGoogleAvatar] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    phone: "",
    dob: "",
    major: "",
    address: {
      street: "",
      city: "",
      postalCode: "",
      contry: "Việt Nam",
    },
  });
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? sessionStorage.getItem("token") || localStorage.getItem("token")
        : null;
    if (!token) {
      router.replace("/login");
      return;
    }
    (async () => {
      try {
        await fetchProfile();
      } catch (e: any) {
        setError(e?.response?.data?.message || "Không thể tải hồ sơ");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ga =
        sessionStorage.getItem("googleAvatar") ||
        localStorage.getItem("googleAvatar");
      if (ga) setGoogleAvatar(ga);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axiosInstance.get("/api/users/profile");
      setMe(res.data);
      if (res.data) {
        setEditForm({
          full_name: res.data.full_name || "",
          phone: res.data.phone || "",
          dob: res.data.dob || "",
          major: res.data.major || "",
          address:
            res.data.address && res.data.address.length > 0
              ? res.data.address[0]
              : {
                  street: "",
                  city: "",
                  postalCode: "",
                  contry: "Việt Nam",
                },
        });
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || "Không thể tải hồ sơ");
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
        address: [editForm.address],
      };

      await axiosInstance.put("/api/users/profile", updateData);
      await fetchProfile();
      setShowEdit(false);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (error) {
    return <main className="p-6 text-red-600">{error}</main>;
  }
  if (!me) return null;

  return (
    <div className="flex min-h-screen">
      <ResponsiveSidebar />

      <main className="flex-1 p-6 ml-64">
        <div className="mx-auto w-full max-w-5xl">
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowEdit(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-400 to-orange-600 text-white font-semibold shadow hover:scale-105 hover:shadow-orange-300 transition-all duration-200"
            >
              <Settings className="w-5 h-5" />
              Chỉnh Sửa
            </button>
          </div>

          {/* Trang thông tin cá nhân */}
          {!showEdit && (
            <div className="mx-auto w-full max-w-5xl">
              {/* Hiệu ứng ánh sáng cam nền */}
              <div className="relative">
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-orange-300 via-orange-100 to-transparent rounded-full opacity-30 blur-2xl pointer-events-none animate-pulse"></div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-tr from-orange-400 via-orange-100 to-transparent rounded-full opacity-20 blur-2xl pointer-events-none animate-pulse"></div>
                {/* Top section */}
                <div className="grid grid-cols-1 lg:grid-cols-[auto,1fr] gap-6 mb-8 z-10 relative">
                  {/* Avatar card */}
                  <div className="card rounded-xl p-6 flex items-center gap-5 bg-white/90 border border-orange-200 shadow-xl">
                    <div
                      className="w-24 h-24 rounded-xl overflow-hidden flex items-center justify-center text-3xl font-semibold border bg-orange-50"
                      style={{ borderColor: "#fdba74" }}
                    >
                      {me.avatar ? (
                        <Image
                          src={
                            me.avatar.startsWith("http")
                              ? me.avatar
                              : `${process.env.NEXT_PUBLIC_API_URL}${me.avatar}`
                          }
                          alt="avatar"
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      ) : googleAvatar ? (
                        <Image
                          src={googleAvatar}
                          alt="google avatar"
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-orange-400">
                          {me.full_name?.[0]?.toUpperCase() ||
                            me.email?.[0]?.toUpperCase() ||
                            "N"}
                        </span>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="text-lg font-bold text-orange-700">
                        {me.full_name || "Chưa cập nhật tên"}
                      </div>
                      <div className="text-sm opacity-80 text-orange-600">{me.email}</div>
                      {me.major && (
                        <div className="text-xs opacity-60 mt-1 text-orange-500">{me.major}</div>
                      )}
                    </div>
                  </div>

                  {/* Banner */}
                  {(!me.full_name ||
                    !me.phone ||
                    !me.dob ||
                    !me.major ||
                    !me.address ||
                    !me.address[0]?.street ||
                    !me.address[0]?.city ||
                    !me.address[0]?.postalCode ||
                    !me.address[0]?.contry) && (
                    <div className="card rounded-xl p-6 flex items-center justify-between bg-orange-50 border border-orange-200 shadow">
                      <div>
                        <div className="font-medium mb-1 text-orange-800">
                          Thông báo
                        </div>
                        <div className="text-sm opacity-75 text-orange-900">
                          Cập nhật hồ sơ để tăng mức độ hoàn thiện tài khoản của bạn.
                        </div>
                      </div>
                      <button
                        className="px-4 py-2 rounded-lg border border-orange-300 text-orange-800 hover:bg-orange-100 transition"
                        onClick={() => setShowEdit(true)}
                      >
                        Hoàn thiện
                      </button>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="w-full flex justify-center">
             <h2
  className="text-2xl font-extrabold mb-6 text-center pt-8 pb-2 tracking-wide"
>
  <span
    className="bg-gradient-to-r from-orange-400 via-yellow-400 via-green-400 via-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-lg"
    style={{
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      color: "transparent",
    }}
  >
    Thông Tin Cá Nhân
  </span>
</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 z-10 relative">
                  {[
                    {
                      label: "Họ và Tên",
                      icon: "👤",
                      value: me.full_name || "Chưa cập nhật",
                    },
                    {
                      label: "Email",
                      icon: "✉️",
                      value: me.email || "Chưa cập nhật",
                    },
                    {
                      label: "Số Điện Thoại",
                      icon: "📞",
                      value: me.phone || "Chưa cập nhật",
                    },
                    {
                      label: "Ngày Sinh",
                      icon: "🎂",
                      value: me.dob
                        ? new Date(me.dob).toLocaleDateString("vi-VN")
                        : "Chưa cập nhật",
                    },
                    {
                      label: "Chuyên Ngành",
                      icon: "📘",
                      value: me.major || "Chưa cập nhật",
                    },
                    {
                      label: "Địa Chỉ",
                      icon: "📍",
                      value:
                        me.address && me.address.length > 0
                          ? `${me.address[0].street},${me.address[0].postalCode}, ${me.address[0].city}, ${me.address[0].contry}`
                          : "Chưa cập nhật",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="card rounded-xl p-4 bg-white/80 border border-orange-100 shadow hover:shadow-orange-200 transition-all duration-200"
                    >
                      <div className="text-xs opacity-70 mb-2 text-orange-700">{item.label}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{item.icon}</span>
                        <div className="font-semibold text-orange-900">{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
           
            </div>
          )}

          {/* Trang cập nhật thông tin cá nhân */}
          {showEdit && (
            <div className="mx-auto w-full max-w-xl">
              <div
                className="relative bg-white/90 rounded-2xl p-5 overflow-hidden"
                style={{
                  boxShadow:
                    "0 0 24px 6px #fb923c88, 0 2px 12px 0 #fb923c55",
                  backdropFilter: "blur(1.5px)",
                }}
              >
                {/* Hiệu ứng ánh sáng cam động */}
                <div className="absolute -top-8 -left-8 w-40 h-40 bg-gradient-to-br from-orange-400 via-orange-200 to-transparent rounded-full opacity-50 blur-2xl pointer-events-none animate-pulse"></div>
                <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-gradient-to-tr from-orange-500 via-orange-200 to-transparent rounded-full opacity-40 blur-2xl pointer-events-none animate-pulse"></div>
                <div className="w-full flex justify-center">
              <h2
  className="w-max text-2xl font-extrabold mb-4 pt-8 pb-2 tracking-wide"
>
  <span
    className="bg-gradient-to-r from-orange-400 via-yellow-400 via-green-400 via-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-lg"
    style={{
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      color: "transparent",
    }}
  >
    Cập nhật thông tin cá nhân
  </span>
</h2>
                </div>
                <form onSubmit={handleEditSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Họ và Tên
                      </label>
                      <input
                        type="text"
                        value={editForm.full_name}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            full_name: e.target.value,
                          }))
                        }
                        className="w-full border border-orange-200 rounded-lg px-3 py-1.5 bg-white/80 shadow focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                        placeholder="Nhập họ và tên"
                        autoComplete="off"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Số Điện Thoại
                      </label>
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        className="w-full border border-orange-200 rounded-lg px-3 py-1.5 bg-white/80 shadow focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                        placeholder="Nhập số điện thoại"
                        autoComplete="off"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Ngày Sinh
                      </label>
                      <input
                        type="date"
                        value={editForm.dob}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            dob: e.target.value,
                          }))
                        }
                        className="w-full border border-orange-200 rounded-lg px-3 py-1.5 bg-white/80 shadow focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Chuyên Ngành
                      </label>
                      <input
                        type="text"
                        value={editForm.major}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            major: e.target.value,
                          }))
                        }
                        className="w-full border border-orange-200 rounded-lg px-3 py-1.5 bg-white/80 shadow focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                        placeholder="Nhập chuyên ngành"
                        autoComplete="off"
                      />
                    </div>
                  </div>
                  <div className="border-t border-orange-100 pt-4">
                    <h3 className="text-base font-semibold text-orange-700 mb-2 flex items-center gap-2">
                      <span role="img" aria-label="address">📍</span> Địa chỉ
                    </h3>
                    <div className="rounded-lg border border-orange-100 bg-orange-50/30 p-3 shadow-inner">
                      <AddressForm
                        address={editForm.address}
                        onChange={(newAddress) =>
                          setEditForm((prev) => ({
                            ...prev,
                            address: newAddress,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-orange-100">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-1.5 rounded-lg bg-gradient-to-r from-orange-400 to-orange-500 text-white font-bold shadow-lg hover:scale-105 hover:shadow-orange-300 transition-all duration-200 disabled:opacity-60 border-2 border-transparent hover:border-orange-400"
                    >
                      {submitting ? (
                        <span className="animate-pulse">Đang cập nhật...</span>
                      ) : (
                        <>
                          <span className="drop-shadow">💾</span> Cập nhật
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEdit(false)}
                      className="px-5 py-1.5 rounded-lg bg-gradient-to-r from-gray-200 to-gray-300 text-orange-700 font-bold shadow hover:scale-105 hover:shadow-orange-100 transition-all duration-200 border-2 border-transparent"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            
            </div>
          )}
        </div>
      </main>
    </div>
  );
}