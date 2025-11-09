"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "../../../../../ultis/axios";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";
import TeamManagement from "@/components/TeamManagement";
import { 
  Button, 
  Typography, 
  Box, 
  Alert, 
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from "@mui/material";
import { 
  ArrowBack as ArrowBackIcon,
  ExitToApp as ExitToAppIcon,
  Close as CloseIcon,
  Group as GroupIcon
} from "@mui/icons-material";

type TeamMember = {
  _id: string;
  user_id: {
    _id: string;
    full_name: string;
    email: string;
    phone: string;
    major?: string;
    avatar: string;
  };
  team_leader: number;
};

type Team = {
  _id: string;
  name: string;
  project_id: string;
  team_member: TeamMember[];
  description?: string;
  team_code?: string;
  createAt: string;
  updateAt: string;
};

type Project = {
  _id: string;
  topic: string;
  code: string;
  description?: string;
  status: string;
};

export default function TeamManagementPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);
  
  const [team, setTeam] = useState<Team | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Leave team dialog states
  const [openLeaveTeam, setOpenLeaveTeam] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [leaveSuccess, setLeaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    
    const fetchData = async () => {
      try {
        // Fetch current user profile first
        const userRes = await axiosInstance.get('/api/auth/profile');
        setCurrentUserId(userRes.data.data._id);
        
        // Fetch team data
        const teamRes = await axiosInstance.get(`/api/team/${projectId}`);
        const teamData = teamRes.data.data; // API returns { success: true, data: {...} }
        // Ensure team_member is always an array
        if (teamData && !teamData.team_member) {
          teamData.team_member = [];
        }
        setTeam(teamData);
        
        // Fetch project data
        const projectRes = await axiosInstance.get(`/api/team/${projectId}`);
        setProject(projectRes.data.data.project_id);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Không thể tải thông tin nhóm');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  const handleTeamUpdate = (updatedTeam: Team) => {
    setTeam(updatedTeam);
  };

  // Handle leave team
  const handleLeaveTeam = async () => {
    if (!currentUserId) {
      setLeaveError("Không thể xác định người dùng hiện tại");
      return;
    }

    setLeaveLoading(true);
    setLeaveError(null);
    
    try {
      await axiosInstance.delete(`/api/team/${projectId}/members/${currentUserId}`);
      
      setLeaveSuccess("Rời nhóm thành công! Đang chuyển hướng...");
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      
    } catch (e: any) {
      setLeaveError(e?.response?.data?.message || "Không thể rời nhóm");
    } finally {
      setLeaveLoading(false);
    }
  };

  const handleCloseLeaveDialog = () => {
    setOpenLeaveTeam(false);
    setLeaveError(null);
    setLeaveSuccess(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <ResponsiveSidebar />
        <main className="p-4 md:p-6 md:ml-64">
          <div className="mx-auto w-full max-w-7xl">
            <div className="rounded-xl border border-[var(--border)] p-6 bg-[color-mix(in_olab,_var(--accent)_10%,_var(--background))] animate-pulse">
              <div className="h-6 w-32 rounded bg-foreground/10 mb-4"></div>
              <div className="h-4 w-48 rounded bg-foreground/10 mb-2"></div>
              <div className="h-72 w-full rounded bg-foreground/10"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <ResponsiveSidebar />
        <main className="p-4 md:p-6 md:ml-64">
          <div className="mx-auto w-full max-w-7xl">
            <div className="rounded-xl border border-red-500/40 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 p-4">
              {error}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <ResponsiveSidebar />
      <main className="p-4 md:p-6 md:ml-64">
        <div className="mx-auto w-full max-w-7xl">
          {/* Header */}
          <div className="mb-6 md:mb-8 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-[10px] md:text-xs uppercase tracking-wider text-foreground/60">
                Dự án
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                Quản lý thành viên nhóm
              </h1>
              {project && (
                <p className="text-sm text-foreground/70">
                  {project.code} - {project.topic}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outlined"
                size="medium"
                startIcon={<ArrowBackIcon />}
                onClick={() => router.back()}
              >
                Quay lại
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="medium"
                startIcon={<ExitToAppIcon />}
                onClick={() => setOpenLeaveTeam(true)}
                disabled={leaveLoading}
              >
                Rời nhóm
              </Button>
            </div>
          </div>

          {/* Team Management Component */}
          {team && (
            <TeamManagement
              team={team}
              projectId={projectId}
              currentUserId={currentUserId || undefined}
              onTeamUpdate={handleTeamUpdate}
            />
          )}
        </div>
      </main>

      {/* Leave Team Dialog */}
      <Dialog open={openLeaveTeam} onClose={handleCloseLeaveDialog} maxWidth="sm" fullWidth>
        <DialogTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ExitToAppIcon className="text-red-500" />
            <span>Xác nhận rời nhóm</span>
          </div>
          <IconButton onClick={handleCloseLeaveDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <div className="space-y-4 pt-4">
            {/* Error Message */}
            {leaveError && (
              <Alert severity="error" onClose={() => setLeaveError(null)}>
                {leaveError}
              </Alert>
            )}
            
            {/* Success Message */}
            {leaveSuccess && (
              <Alert severity="success">
                {leaveSuccess}
              </Alert>
            )}

            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <Typography variant="body1" className="mb-2 font-medium text-red-800 dark:text-red-200">
                Bạn có chắc chắn muốn rời khỏi nhóm "{team?.name}"?
              </Typography>
              <Typography variant="body2" color="text.secondary" className="mb-3">
                Hành động này sẽ:
              </Typography>
              <ul className="ml-4 space-y-1 text-sm text-red-700 dark:text-red-300">
                <li>• Xóa bạn khỏi danh sách thành viên nhóm</li>
                <li>• Bạn sẽ mất quyền truy cập vào dự án này</li>
                <li>• Cần được mời lại để tham gia nhóm</li>
              </ul>
            </div>

            {team && team.team_member && team.team_member.some(member => 
              member.user_id._id === currentUserId && member.team_leader === 1
            ) && (
              <Alert severity="warning">
                <Typography variant="body2" className="font-medium mb-1">
                  Cảnh báo: Bạn đang là trưởng nhóm!
                </Typography>
                <Typography variant="body2">
                  Nếu bạn rời nhóm, nhóm sẽ không còn trưởng nhóm. 
                  Hãy cân nhắc phong một thành viên khác làm trưởng nhóm trước khi rời.
                </Typography>
              </Alert>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLeaveDialog} disabled={leaveLoading}>
            Hủy
          </Button>
          <Button
            onClick={handleLeaveTeam}
            variant="contained"
            color="error"
            disabled={leaveLoading}
            startIcon={leaveLoading ? <CircularProgress size={16} /> : <ExitToAppIcon />}
          >
            {leaveLoading ? "Đang xử lý..." : "Rời nhóm"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

