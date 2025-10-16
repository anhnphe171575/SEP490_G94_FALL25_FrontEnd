"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Group as GroupIcon,
  Email as EmailIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";

export default function AutoJoinTeamPage() {
  const router = useRouter();
  const params = useParams();
  const teamCode = Array.isArray(params?.teamCode) ? params?.teamCode[0] : (params?.teamCode as string);
  
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [teamData, setTeamData] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    // Kiểm tra xem có email trong URL params không
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
      handleAutoJoin(emailParam);
    }
  }, []);

  const handleAutoJoin = async (emailToUse?: string) => {
    const emailValue = emailToUse || email;
    if (!emailValue.trim()) {
      setError('Vui lòng nhập email');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance.post(`/api/team/auto-join/${teamCode}`, {
        email: emailValue.trim()
      });
      
      console.log('Auto join response:', response.data);
      setSuccess(true);
      setTeamData(response.data.data.team);
      setUserData(response.data.data.user);
      
      // Redirect đến trang success sau 2 giây
      setTimeout(() => {
        const teamParam = encodeURIComponent(JSON.stringify(response.data.data.team));
        const userParam = encodeURIComponent(JSON.stringify(response.data.data.user));
        router.push(`/team-join-success?team=${teamParam}&user=${userParam}`);
      }, 2000);
      
    } catch (e: any) {
      console.error('Error auto joining team:', e);
      setError(e?.response?.data?.message || "Không thể tham gia nhóm");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAutoJoin();
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
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

                <Box className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <Typography variant="body2" color="text.secondary">
                    <strong>Lưu ý:</strong> Email của bạn phải đã được đăng ký trong hệ thống. 
                    Sau khi tham gia nhóm, bạn sẽ được chuyển đến trang đăng nhập.
                  </Typography>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
