"use client";

import { useEffect, useState } from "react";
import axiosInstance from "../../../ultis/axios";
import Image from "next/image";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";
import AddressForm from "./AddressForm";
import { User, FolderKanban, Settings } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import ChangePasswordPage from "@/app/change-password/page";
import Project from "./project";

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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [googleAvatar, setGoogleAvatar] = useState<string | null>(null);
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<
    "profile" | "project" | "settings"
  >("profile");
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
      setIsEditDialogOpen(false);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field === "address") {
      setEditForm((prev) => ({
        ...prev,
        address: value,
      }));
    } else if (field.startsWith("address.")) {
      const addressField = field.split(".")[1];
      setEditForm((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setEditForm((prev) => ({
        ...prev,
        [field]: value,
      }));
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
          {/* Header actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              {/* Nút Thông tin cá nhân */}
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex items-center gap-2 text-sm font-medium px-2 py-1 rounded border-b-2 ${
                  activeTab === "profile"
                    ? "text-[var(--primary)] border-[var(--primary)]"
                    : "opacity-80 hover:text-[var(--primary)] border-transparent"
                }`}
              >
                <User className="w-4 h-4" />
                Thông tin cá nhân
              </button>

              {/* Nút Dự án */}
              <button
                onClick={() => setActiveTab("project")}
                className={`flex items-center gap-2 text-sm px-2 py-1 rounded border-b-2 ${
                  activeTab === "project"
                    ? "text-[var(--primary)] border-[var(--primary)]"
                    : "opacity-80 hover:text-[var(--primary)] border-transparent"
                }`}
              >
                <FolderKanban className="w-4 h-4" />
                Dự án
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className={`flex items-center gap-2 text-sm px-2 py-1 rounded border-b-2 ${
                  activeTab === "settings"
                    ? "text-[var(--primary)] border-[var(--primary)]"
                    : "opacity-80 hover:text-[var(--primary)] border-transparent"
                }`}
              >
                <Settings className="w-4 h-4" />
                Cài đặt
              </button>
            </div>

            <button
              onClick={() => setIsEditDialogOpen(true)}
              className="px-4 py-2 rounded-lg btn-primary text-white"
            >
              ✎ Chỉnh Sửa
            </button>
          </div>

          {/* Nội dung theo tab */}
          {activeTab === "profile" && (
            <div className="mx-auto w-full max-w-5xl">
              {/* Top section */}
              <div className="grid grid-cols-1 lg:grid-cols-[auto,1fr] gap-6 mb-8">
                {/* Avatar card */}
                <div className="card rounded-xl p-6 flex items-center gap-5">
                  <div
                    className="w-24 h-24 rounded-xl overflow-hidden flex items-center justify-center text-3xl font-semibold border bg-gray-100"
                    style={{ borderColor: "var(--border)" }}
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
                      <span className="text-gray-500">
                        {me.full_name?.[0]?.toUpperCase() ||
                          me.email?.[0]?.toUpperCase() ||
                          "N"}
                      </span>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="text-lg font-medium">
                      {me.full_name || "Chưa cập nhật tên"}
                    </div>
                    <div className="text-sm opacity-80">{me.email}</div>
                    {me.major && (
                      <div className="text-xs opacity-60 mt-1">{me.major}</div>
                    )}
                  </div>
                </div>

                {/* Banner */}
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
                  <div className="card rounded-xl p-6 flex items-center justify-between bg-yellow-50 border border-yellow-200">
                    <div>
                      <div className="font-medium mb-1 text-yellow-800">
                        Thông báo
                      </div>
                      <div className="text-sm opacity-75 text-yellow-900">
                        Cập nhật hồ sơ để tăng mức độ hoàn thiện tài khoản của
                        bạn.
                      </div>
                    </div>
                    <button
                      className="px-4 py-2 rounded-lg border border-yellow-300 text-yellow-800 hover:bg-yellow-100 transition"
                      onClick={() => setIsEditDialogOpen(true)}
                    >
                      Hoàn thiện
                    </button>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="mb-4">
                <h2
                  className="text-2xl font-bold mb-6 text-center pt-8 pb-2 text-green-700 tracking-wide"
                  
                >
                  Thông Tin Cá Nhân
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          )}

          {activeTab === "project" && (
            <div className="mx-auto w-full max-w-5xl">
              <Project userId={me._id} />
            </div>
          )}
        </div>
        {activeTab === "settings" && (
          <div className="mx-auto w-full max-w-5xl">
            <ChangePasswordPage />
          </div>
        )}

        {/* Edit Dialog */}
        {isEditDialogOpen && (
          <div className="fixed inset-0 bg-white flex items-center justify-center z-50 p-4 overflow-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 border-b pb-3">
                  <h2
                    className="text-2xl font-bold text-gray-800"
                    style={{ color: "var(--primary)" }}
                  >
                    ✏️ Chỉnh sửa thông tin cá nhân
                  </h2>
                  <button
                    onClick={() => setIsEditDialogOpen(false)}
                    className="text-gray-400 hover:text-red-500 text-2xl font-bold transition"
                  >
                    ×
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleEditSubmit} className="space-y-6">
                  {/* Thông tin cá nhân */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Họ và Tên
                      </label>
                      <input
                        type="text"
                        value={editForm.full_name}
                        onChange={(e) =>
                          handleInputChange("full_name", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                        placeholder="Nhập họ và tên"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Số Điện Thoại
                      </label>
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                        placeholder="Nhập số điện thoại"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Ngày Sinh
                      </label>
                      <input
                        type="date"
                        value={editForm.dob}
                        onChange={(e) =>
                          handleInputChange("dob", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Chuyên Ngành
                      </label>
                      <input
                        type="text"
                        value={editForm.major}
                        onChange={(e) =>
                          handleInputChange("major", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                        placeholder="Nhập chuyên ngành"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      📍 Địa chỉ
                    </h3>
                    <AddressForm
                      address={editForm.address}
                      onChange={(newAddress) =>
                        handleInputChange("address", newAddress)
                      }
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end gap-3 pt-6 border-t">
                    <button
                      type="button"
                      onClick={() => setIsEditDialogOpen(false)}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                    >
                      ❌ Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2 rounded-lg bg-gradient-to-r from-orange-400 to-orange-500 text-white font-semibold shadow hover:shadow-lg transition disabled:opacity-60"
                    >
                      {submitting ? "Đang cập nhật..." : "💾 Cập nhật"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
