"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import axiosInstance from "../../../../ultis/axios";
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Typography,
  Alert,
  Box,
  Avatar,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Group as GroupIcon,
  Email as EmailIcon,
  Error as ErrorIcon,
  Logout as LogoutIcon,
  Login as LoginIcon,
} from "@mui/icons-material";

export default function AutoJoinTeamPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const teamCode = Array.isArray(params?.teamCode) ? params?.teamCode[0] : (params?.teamCode as string);
  
  const [email, setEmail] = useState("");
  const [emailFromLink, setEmailFromLink] = useState<string | null>(null);
  const [profileEmail, setProfileEmail] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [supervisorType, setSupervisorType] = useState<string | null>(null);
  const [shouldAutoJoin, setShouldAutoJoin] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [teamData, setTeamData] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const autoJoinTriggeredRef = useRef(false);
  const hasCheckedAfterLoginRef = useRef(false);

  useEffect(() => {
    // Reset ref khi component mount lại (sau khi quay từ login)
    autoJoinTriggeredRef.current = false;
    hasCheckedAfterLoginRef.current = false;
    
    // Kiểm tra xem có email trong URL params không
    const emailParam = searchParams.get('email');
    const supervisorParam = searchParams.get('supervisor_type');
    
    if (supervisorParam) {
      setSupervisorType(supervisorParam);
    }

    if (emailParam) {
      setEmailFromLink(emailParam);
      setEmail(emailParam);
    }

    // Lấy thông tin người dùng hiện tại (nếu đã đăng nhập)
    const fetchProfile = async () => {
      try {
        const res = await axiosInstance.get('/api/auth/profile');
        const emailFromProfile = res.data?.data?.email || null;
        setIsAuthenticated(true);
        setProfileEmail(emailFromProfile);
        
        // Nếu có email trong link
        if (emailParam) {
          // So sánh email đăng nhập với email trong link
          if (emailFromProfile?.toLowerCase() !== emailParam.toLowerCase()) {
            // Email không khớp -> yêu cầu logout
            setShowLogoutDialog(true);
            setIsCheckingAuth(false);
            return;
          }
          // Email khớp -> auto join
          setShouldAutoJoin(true);
        } else {
          // Không có email trong link -> dùng email đăng nhập
          setShouldAutoJoin(true);
        }
      } catch (err) {
        // Chưa đăng nhập
        setIsAuthenticated(false);
        setProfileEmail(null);
        
        // Nếu có email trong link nhưng chưa đăng nhập -> redirect đến login
        if (emailParam) {
          const currentUrl = window.location.href;
          router.replace(`/login?redirect=${encodeURIComponent(currentUrl)}`);
          return;
        }
      } finally {
        setIsCheckingAuth(false);
        hasCheckedAfterLoginRef.current = true;
      }
    };

    fetchProfile();
  }, [router, searchParams]);

  // Tự động join nếu đã có email (từ link hoặc từ profile) và đã kiểm tra auth
  useEffect(() => {
    // Chờ đến khi đã check auth xong
    if (isCheckingAuth || !hasCheckedAfterLoginRef.current) return;
    if (autoJoinTriggeredRef.current) return;
    if (!shouldAutoJoin) return;

    const emailToUse = emailFromLink || email || profileEmail || "";
    if (!emailToUse) {
      console.log('No email to use for auto join');
      return;
    }

    console.log('Triggering auto join with email:', emailToUse);
    // Đảm bảo chỉ trigger một lần
    autoJoinTriggeredRef.current = true;
    
    // Delay nhỏ để đảm bảo state đã được cập nhật
    setTimeout(() => {
      handleAutoJoin(emailToUse, supervisorType || undefined);
    }, 100);
  }, [emailFromLink, email, profileEmail, supervisorType, shouldAutoJoin, isCheckingAuth, isAuthenticated]);

  // Effect riêng để detect khi đăng nhập thành công sau khi quay lại từ login
  useEffect(() => {
    // Nếu đã authenticated, có email trong link, và chưa trigger auto join
    if (isAuthenticated && emailFromLink && !autoJoinTriggeredRef.current && !isCheckingAuth) {
      // So sánh email một lần nữa
      if (profileEmail?.toLowerCase() === emailFromLink.toLowerCase()) {
        console.log('Detected login after redirect, triggering auto join');
        setShouldAutoJoin(true);
      }
    }
  }, [isAuthenticated, emailFromLink, profileEmail, isCheckingAuth]);

  const handleAutoJoin = async (emailToUse?: string, supervisorTypeParam?: string) => {
    const emailValue = emailToUse || email;
    if (!emailValue.trim()) {
      setError('Vui lòng nhập email');
      return;
    }

    autoJoinTriggeredRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      const payload: any = { email: emailValue.trim() };
      if (supervisorTypeParam) {
        payload.supervisor_type = supervisorTypeParam;
      }

      const response = await axiosInstance.post(`/api/team/auto-join/${teamCode}`, payload);
      
      console.log('Auto join response:', response.data);
      setSuccess(true);
      setTeamData(response.data.data.team);
      setUserData(response.data.data.user);
      
      // Nếu đã đăng nhập, chuyển thẳng tới trang chi tiết dự án
      const projectId =
        response?.data?.data?.team?.project_id?._id ||
        response?.data?.data?.team?.project_id ||
        "";

      if (isAuthenticated && projectId) {
        router.replace(`/projects/${projectId}/details`);
        return;
      }

      // Nếu chưa đăng nhập, giữ luồng cũ: vào trang thông báo thành công
      setTimeout(() => {
        const teamParam = encodeURIComponent(JSON.stringify(response.data.data.team));
        const userParam = encodeURIComponent(JSON.stringify(response.data.data.user));
        router.push(`/team-join-success?team=${teamParam}&user=${userParam}`);
      }, 1500);
      
    } catch (e: any) {
      console.error('Error auto joining team:', e);
      setError(e?.response?.data?.message || "Không thể tham gia nhóm");
      autoJoinTriggeredRef.current = false; // Cho phép thử lại nếu nhập email khác
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAutoJoin(undefined, supervisorType || undefined);
  };

  const handleLogout = () => {
    // Xóa token
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("token");
      localStorage.removeItem("token");
    }
    // Redirect đến login với redirect
    const currentUrl = window.location.href;
    router.replace(`/login?redirect=${encodeURIComponent(currentUrl)}`);
  };

  const handleCancelLogout = () => {
    setShowLogoutDialog(false);
    router.push('/dashboard');
  };

  // Hiển thị loading khi đang kiểm tra auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <Box className="text-center">
          <CircularProgress size={48} />
          <Typography variant="body1" color="text.secondary" className="mt-4">
            Đang kiểm tra đăng nhập...
          </Typography>
        </Box>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="w-16 h-16 bg-blue-500">
                <GroupIcon className="w-10 h-10" />
              </Avatar>
            </div>
            <Typography variant="h5" className="font-semibold">
              Tham gia nhóm
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Mã nhóm: <code className="bg-gray-100 px-2 py-1 rounded">{teamCode}</code>
            </Typography>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {success ? (
              <Box className="text-center py-8">
                <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <Typography variant="h6" className="text-green-600 mb-2">
                  Tham gia nhóm thành công!
                </Typography>
                <Typography variant="body2" color="text.secondary" className="mb-4">
                  Đang chuyển hướng...
                </Typography>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <>
                {error && (
                  <Alert severity="error" icon={<ErrorIcon />}>
                    {error}
                  </Alert>
                )}

                {!emailFromLink && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <TextField
                      fullWidth
                      label="Email của bạn"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Nhập email để tham gia nhóm"
                      required
                      disabled={loading}
                      helperText="Email này phải đã được đăng ký trong hệ thống"
                    />
                    
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      fullWidth
                      disabled={loading || !email.trim()}
                      startIcon={loading ? <CircularProgress size={20} /> : <EmailIcon />}
                    >
                      {loading ? "Đang tham gia..." : "Tham gia nhóm"}
                    </Button>
                  </form>
                )}

                {emailFromLink && !isAuthenticated && (
                  <Alert severity="info" icon={<LoginIcon />}>
                    <Typography variant="body2">
                      Vui lòng đăng nhập với tài khoản <strong>{emailFromLink}</strong> để tiếp tục.
                    </Typography>
                  </Alert>
                )}

                <Box className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <Typography variant="body2" color="text.secondary">
                    <strong>Lưu ý:</strong> Email của bạn phải đã được đăng ký trong hệ thống. 
                    Nếu bạn đang đăng nhập, hệ thống sẽ chuyển thẳng tới trang chi tiết dự án sau khi tham gia thành công.
                  </Typography>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog yêu cầu logout khi email không khớp */}
      <Dialog open={showLogoutDialog} onClose={handleCancelLogout}>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <ErrorIcon color="warning" />
            <Typography variant="h6">Tài khoản không khớp</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" className="mb-2">
            Bạn đang đăng nhập với tài khoản: <strong>{profileEmail}</strong>
          </Typography>
          <Typography variant="body1" className="mb-2">
            Nhưng link này dành cho tài khoản: <strong>{emailFromLink}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Vui lòng đăng xuất và đăng nhập lại với tài khoản đúng để tiếp tục.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelLogout} variant="outlined">
            Hủy
          </Button>
          <Button 
            onClick={handleLogout} 
            variant="contained" 
            color="primary"
            startIcon={<LogoutIcon />}
          >
            Đăng xuất và đăng nhập lại
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
