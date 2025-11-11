"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "../../../ultis/axios";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [major, setMajor] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("Việt Nam");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!fullName.trim()) {
      setError("Vui lòng nhập họ và tên");
      return;
    }
    
    if (!email.trim()) {
      setError("Vui lòng nhập email");
      return;
    }
    
    if (!email.endsWith('@fpt.edu.vn')) {
      setError("Email phải có đuôi @fpt.edu.vn");
      return;
    }
    
    if (!password) {
      setError("Vui lòng nhập mật khẩu");
      return;
    }
    
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    
    if (!phone.trim()) {
      setError("Vui lòng nhập số điện thoại");
      return;
    }
    
    if (!dob) {
      setError("Vui lòng chọn ngày sinh");
      return;
    }
    
    if (!street.trim() || !city.trim() || !postalCode.trim() || !country.trim()) {
      setError("Vui lòng điền đầy đủ thông tin địa chỉ");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const registerData = {
        full_name: fullName.trim(),
        email: email.trim(),
        password: password,
        phone: phone.trim(),
        dob: dob,
        major: major.trim() || undefined,
        address: [
          {
            street: street.trim(),
            city: city.trim(),
            postalCode: postalCode.trim(),
            contry: country.trim(), // Note: using 'contry' as per schema (typo in schema)
          }
        ],
        role: 1, // Default role for regular user
        avatar: "", // Empty string as required by schema
      };

      const res = await axiosInstance.post("/api/auth/register", registerData);
      
      // If registration successful, redirect to login or verify page
      if (res.data?.message || res.status === 201) {
        router.push("/login?registered=true");
      }

    } catch (e: any) {
      setError(e?.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen relative overflow-hidden flex flex-col">
      {/* Background với gradient động */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-orange-900">
        {/* Các hình tròn trang trí */}
        <div className="absolute top-5 left-5 w-32 h-32 sm:w-48 sm:h-48 lg:w-72 lg:h-72 bg-orange-200 dark:bg-orange-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-20 sm:opacity-30 animate-blob"></div>
        <div className="absolute top-10 right-5 w-32 h-32 sm:w-48 sm:h-48 lg:w-72 lg:h-72 bg-yellow-200 dark:bg-yellow-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-20 sm:opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-2 left-10 w-32 h-32 sm:w-48 sm:h-48 lg:w-72 lg:h-72 bg-pink-200 dark:bg-pink-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-20 sm:opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Nội dung chính */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-3 sm:px-4 pt-4 pb-4 sm:pt-5 sm:pb-5 overflow-y-auto">
        <div className="w-full max-w-md sm:max-w-lg lg:max-w-xl my-auto">
          {/* Logo hoặc tiêu đề */}
          <div className="text-center mb-3 sm:mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 mb-2 sm:mb-3 relative">
              {/* Background gradient circle */}
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl sm:rounded-2xl shadow-lg"></div>
              {/* Icon SVG - User với dấu cộng */}
              <svg 
                className="relative z-10 w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 text-white pointer-events-none flex-shrink-0" 
                viewBox="0 0 100 100" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* User icon */}
                <circle cx="50" cy="35" r="12" fill="currentColor"/>
                <path d="M30 70 Q30 60 50 60 Q70 60 70 70 L70 75 L30 75 Z" fill="currentColor"/>
                {/* Plus sign */}
                <rect x="65" y="20" width="18" height="6" rx="3" fill="currentColor"/>
                <rect x="74" y="11" width="6" height="18" rx="3" fill="currentColor"/>
              </svg>
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">Tạo tài khoản mới</h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Điền thông tin để đăng ký tài khoản</p>
          </div>

          {/* Form đăng ký */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 shadow-2xl border border-white/20 dark:border-gray-700/20">
            {error && (
              <div className="mb-3 p-2.5 sm:p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg sm:rounded-xl">
                <div className="flex items-start">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-700 dark:text-red-300 text-xs sm:text-sm font-medium break-words">{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-2.5 sm:space-y-3">
              {/* Full Name */}
              <div className="space-y-1.5 sm:space-y-2">
                <label htmlFor="fullName" className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 text-sm"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5 sm:space-y-2">
                <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Địa chỉ Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 text-sm"
                    placeholder="your.email@fpt.edu.vn"
                  />
                </div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Chỉ chấp nhận email @fpt.edu.vn</p>
              </div>

              {/* Password và Confirm Password - Grid trên tablet/desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
                <div className="space-y-1.5 sm:space-y-2">
                  <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Xác nhận mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <input
                      id="confirmPassword"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              {/* Phone và DOB - Grid trên tablet/desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
                <div className="space-y-1.5 sm:space-y-2">
                  <label htmlFor="phone" className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <input
                      id="phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 text-sm"
                      placeholder="0123456789"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label htmlFor="dob" className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Ngày sinh <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      id="dob"
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full pl-9 sm:pl-11 md:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 md:py-3.5 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 text-sm sm:text-base [color-scheme:light] dark:[color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>

              {/* Major */}
              <div className="space-y-1.5 sm:space-y-2">
                <label htmlFor="major" className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Chuyên ngành
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <input
                    id="major"
                    type="text"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 text-sm"
                    placeholder="Software Engineering"
                  />
                </div>
              </div>

              {/* Address Section */}
              <div className="space-y-2.5 sm:space-y-3 pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Thông tin địa chỉ</h3>
                
                {/* Street */}
                <div className="space-y-1.5 sm:space-y-2">
                  <label htmlFor="street" className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Đường/Phố <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <input
                      id="street"
                      type="text"
                      required
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 text-sm"
                      placeholder="123 Đường ABC"
                    />
                  </div>
                </div>

                {/* City và Postal Code - Grid trên tablet/desktop */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
                  <div className="space-y-1.5 sm:space-y-2">
                    <label htmlFor="city" className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Thành phố <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="city"
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 text-sm"
                      placeholder="Hà Nội"
                    />
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <label htmlFor="postalCode" className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Mã bưu điện <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="postalCode"
                      type="text"
                      required
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 text-sm"
                      placeholder="100000"
                    />
                  </div>
                </div>

                {/* Country */}
                <div className="space-y-1.5 sm:space-y-2">
                  <label htmlFor="country" className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Quốc gia <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="country"
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 md:py-3.5 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 text-sm sm:text-base"
                    placeholder="Việt Nam"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base mt-3 sm:mt-4"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xử lý...
                  </div>
                ) : (
                  "Đăng ký"
                )}
              </button>
            </form>

            {/* Link to Login */}
            <div className="mt-3 sm:mt-4 text-center">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Đã có tài khoản?{" "}
                <a href="/login" className="font-semibold text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 transition-colors duration-200">
                  Đăng nhập ngay
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

