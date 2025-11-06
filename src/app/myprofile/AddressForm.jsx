"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";

const AddressForm = ({ address, onChange }) => {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");

  // 🏙️ Gọi API lấy dữ liệu tỉnh/thành
  useEffect(() => {
    axios
      .get("https://provinces.open-api.vn/api/?depth=3")
      .then((res) => setProvinces(res.data))
      .catch((err) => console.error("Lỗi tải danh sách tỉnh/thành:", err));
  }, []);

  // 🇻🇳 Mặc định quốc gia là Việt Nam
useEffect(() => {
  if (!address.contry || address.contry === "unknown") {
    onChange({ ...address, contry: "Việt Nam" });
  }
}, [address]);


  // 🔹 Khi chọn tỉnh
  const handleProvinceChange = (e) => {
    const code = e.target.value;
    setSelectedProvince(code);
    const selected = provinces.find((p) => p.code === Number(code));
    setDistricts(selected ? selected.districts : []);
    setWards([]);
    setSelectedDistrict("");
    setSelectedWard("");
    onChange({
      ...address,
      city: selected ? selected.name : "",
      postalCode: "",
      street: "",
    });
  };

  // 🔹 Khi chọn quận/huyện
  const handleDistrictChange = (e) => {
    const code = e.target.value;
    setSelectedDistrict(code);
    const selected = districts.find((d) => d.code === Number(code));
    setWards(selected ? selected.wards : []);
    setSelectedWard("");
    onChange({
      ...address,
      postalCode: selected ? selected.name : "",
      street: "",
    });
  };

  // 🔹 Khi chọn phường/xã
  const handleWardChange = (e) => {
    const code = e.target.value;
    setSelectedWard(code);
    const selected = wards.find((w) => w.code === Number(code));
    onChange({
      ...address,
      street: selected ? selected.name : "",
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
      {/* Quốc gia */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Quốc Gia
        </label>
        <input
          type="text"
          value={address.contry || "Việt Nam"}
          readOnly
          className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
        />
      </div>
      {/* Tỉnh / Thành phố */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Tỉnh / Thành phố
        </label>
        <select
          value={selectedProvince}
          onChange={handleProvinceChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="">-- Chọn Tỉnh/Thành phố --</option>
          {provinces.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Quận / Huyện */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Quận / Huyện
        </label>
        <select
          value={selectedDistrict}
          onChange={handleDistrictChange}
          disabled={!selectedProvince}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-100"
        >
          <option value="">-- Chọn Quận/Huyện --</option>
          {districts.map((d) => (
            <option key={d.code} value={d.code}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Phường / Xã */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Phường / Xã
        </label>
        <select
          value={selectedWard}
          onChange={handleWardChange}
          disabled={!selectedDistrict}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-100"
        >
          <option value="">-- Chọn Phường/Xã --</option>
          {wards.map((w) => (
            <option key={w.code} value={w.code}>
              {w.name}
            </option>
          ))}
        </select>
      </div>

    </div>
  );
};

export default AddressForm;
