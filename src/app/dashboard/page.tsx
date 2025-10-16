"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "../../../ultis/axios";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";
import { 
  Box, 
  Button, 
  Card, 
  CardActions, 
  CardContent, 
  CardHeader, 
  Chip, 
  Container, 
  Grid, 
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  IconButton
} from "@mui/material";
import { 
  Add as AddIcon,
  Login as LoginIcon,
  Close as CloseIcon,
  Group as GroupIcon
} from "@mui/icons-material";

type Project = {
  _id: string;
  title: string;
  code: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Join project dialog states
  const [openJoinDialog, setOpenJoinDialog] = useState(false);
  const [teamCode, setTeamCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? (sessionStorage.getItem('token') || localStorage.getItem('token')) : null;
    if (!token) {
      router.replace('/login');
      return;
    }
    (async () => {
      try {
        // Assuming endpoint exists: /api/projects (adjust if different)
        const res = await axiosInstance.get('/api/projects');
        const list = Array.isArray(res.data) ? res.data : (res.data?.items || []);
        if (!list || list.length === 0) {
          router.replace('/no-project');
          return;
        }
        setProjects(list);
      } catch (e: any) {
        if (e?.response?.status === 404) {
          router.replace('/no-project');
          return;
        }
        setError(e?.response?.data?.message || 'Không thể tải danh sách dự án');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  // Handle join project by team code
  const handleJoinProject = async () => {
    if (!teamCode.trim()) {
      setJoinError("Vui lòng nhập mã nhóm");
      return;
    }

    setJoinLoading(true);
    setJoinError(null);
    
    try {
      const response = await axiosInstance.post(`/api/team/join/${teamCode.trim()}`);
      
      setJoinSuccess("Tham gia nhóm thành công!");
      setTeamCode("");
      
      // Redirect to the project after 2 seconds
      setTimeout(() => {
        const projectId = response.data.data.team.project_id._id;
        router.push(`/projects/${projectId}`);
      }, 2000);
      
    } catch (e: any) {
      const errorMessage = e?.response?.data?.message || "Không thể tham gia nhóm";
      setJoinError(errorMessage);
    } finally {
      setJoinLoading(false);
    }
  };

  const handleCloseJoinDialog = () => {
    setOpenJoinDialog(false);
    setTeamCode("");
    setJoinError(null);
    setJoinSuccess(null);
  };

  if (loading) return <main className="p-6">Đang tải...</main>;
  if (error) return <main className="p-6 text-red-600">{error}</main>;
  if (!projects) return null;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <ResponsiveSidebar />
      <main className="p-4 md:p-6 md:ml-64">
        <Container maxWidth="lg">
          <Box sx={{ mb: { xs: 3, md: 4 }, display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2, alignItems: { md: "center" }, justifyContent: { md: "space-between" } }}>
            <Box>
              <Typography variant="h4" sx={{ color: "primary.main", fontWeight: 700 }}>Dự án</Typography>
              <Typography variant="body2" color="text.secondary">Quản lý và truy cập nhanh các dự án của bạn</Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined">Lọc</Button>
              <Button 
                variant="contained" 
                startIcon={<LoginIcon />}
                onClick={() => setOpenJoinDialog(true)}
                sx={{ backgroundColor: "success.main", "&:hover": { backgroundColor: "success.dark" } }}
              >
                Vào dự án
              </Button>
            
              <Button onClick={() => router.push('/projects/new')}>+ Tạo dự án</Button>
            </Box>
          </Box>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map((p) => (
              <Card key={p._id} variant="outlined" sx={{ borderRadius: 3, transition: 'box-shadow .2s', '&:hover': { boxShadow: 2 } }}>
                <CardHeader
                  title={<Typography variant="h6" fontWeight={700}>{p.title}</Typography>}
                  subheader={<Typography variant="caption" color="text.secondary">Mã: {p.code}</Typography>}
                  action={<Chip label="📁" variant="outlined" />}
                />
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Theo dõi tiến độ, quản lý milestone và tài liệu.</Typography>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button size="small" variant="outlined" onClick={() => router.push(`/projects/${p._id}`)}>Mở</Button>
                  <Button size="small" variant="text" onClick={() => router.push(`/projects/${p._id}`)}>Chi tiết</Button>
                </CardActions>
              </Card>
            ))}
          </div>
        </Container>
      </main>

      {/* Join Project Dialog */}
      <Dialog open={openJoinDialog} onClose={handleCloseJoinDialog} maxWidth="sm" fullWidth>
        <DialogTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GroupIcon className="text-blue-500" />
            <span>Tham gia dự án</span>
          </div>
          <IconButton onClick={handleCloseJoinDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <div className="space-y-4 pt-4">
            {/* Success Message */}
            {joinSuccess && (
              <Alert severity="success" onClose={() => setJoinSuccess(null)}>
                {joinSuccess}
                <Typography variant="body2" className="mt-1">
                  Đang chuyển hướng đến dự án...
                </Typography>
              </Alert>
            )}
            
            {/* Error Message */}
            {joinError && (
              <Alert severity="error" onClose={() => setJoinError(null)}>
                {joinError}
              </Alert>
            )}
            
            <TextField
              fullWidth
              label="Mã nhóm"
              value={teamCode}
              onChange={(e) => {
                setTeamCode(e.target.value);
                // Clear error when user starts typing
                if (joinError) setJoinError(null);
              }}
              placeholder="Nhập mã nhóm để tham gia dự án"
              required
              disabled={joinLoading}
              helperText="Nhập mã nhóm được chia sẻ bởi trưởng nhóm"
              sx={{ 
                '& .MuiInputBase-input': { 
                  fontFamily: 'monospace',
                  fontSize: '1.1rem',
                  letterSpacing: '0.1em'
                }
              }}
            />

            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <GroupIcon className="w-4 h-4 mt-0.5 text-blue-500" />
                <div>
                  <Typography variant="body2" color="text.secondary" component="div">
                    <strong>Hướng dẫn:</strong>
                  </Typography>
                  <ul className="mt-1 ml-4 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    <li>• Nhập mã nhóm chính xác để tham gia dự án</li>
                    <li>• Liên hệ trưởng nhóm để lấy mã nhóm</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseJoinDialog} disabled={joinLoading}>
            Hủy
          </Button>
          <Button
            onClick={handleJoinProject}
            variant="contained"
            disabled={!teamCode.trim() || joinLoading}
            startIcon={joinLoading ? <CircularProgress size={16} /> : <LoginIcon />}
          >
            {joinLoading ? "Đang tham gia..." : "Tham gia"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}


