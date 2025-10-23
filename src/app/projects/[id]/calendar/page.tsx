"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Button,
} from "@mui/material";
import axiosInstance from "../../../../../ultis/axios";
import MeetingCalendar from "../../../../components/MeetingCalendar";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";

interface Project {
  _id: string;
  topic: string;
  code: string;
  description: string;
  status: string;
  created_by: {
    _id: string;
    full_name: string;
    email: string;
  };
  lec_id?: {
    _id: string;
    full_name: string;
    email: string;
  };
}

interface Team {
  team_id: string;
  team_name: string;
  leaders: Array<{
    _id: string;
    user_id: {
      _id: string;
      full_name: string;
      email: string;
      student_id?: string;
      role: string;
    };
    team_leader: number;
  }>;
  members: Array<{
    _id: string;
    user_id: {
      _id: string;
      full_name: string;
      email: string;
      student_id?: string;
      role: string;
    };
    team_leader: number;
  }>;
  total: number;
}

export default function CalendarPage() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load project details
        const projectResponse = await axiosInstance.get(`/api/projects/${projectId}`);
        setProject(projectResponse.data);
        
        // Load team details
        try {
          const teamResponse = await axiosInstance.get(`/api/projects/${projectId}/team-members`);
          console.log('Team response:', teamResponse.data);
          setTeam(teamResponse.data.team_members);
        } catch (teamError: any) {
          console.error('Error loading team:', teamError);
          // Set empty team if error
          setTeam({
            team_id: '',
            team_name: '',
            leaders: [],
            members: [],
            total: 0
          });
        }
        
        // Get current user info from localStorage or API
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
          const user = JSON.parse(userInfo);
          setCurrentUserId(user.id);
          setUserRole(user.role);
        }
        
      } catch (error: any) {
        console.error('Error loading data:', error);
        setError(error?.response?.data?.message || "Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadData();
    }
  }, [projectId]);

  // Check if current user is team leader
  const isTeamLeader = team?.leaders.some(leader => 
    leader.user_id._id === currentUserId
  ) || false;

  // Check if current user is mentor/lecturer
  const isMentor = project?.lec_id?._id === currentUserId || false;

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <ResponsiveSidebar />
        <main className="p-4 md:p-6 md:ml-64">
          <div className="flex justify-center items-center min-h-screen">
            <CircularProgress />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <ResponsiveSidebar />
        <main className="p-4 md:p-6 md:ml-64">
          <Alert severity="error">{error}</Alert>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <ResponsiveSidebar />
        <main className="p-4 md:p-6 md:ml-64">
          <Alert severity="error">Không tìm thấy dự án</Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <ResponsiveSidebar />
      <main className="p-4 md:p-6 md:ml-64">
        <div className="mx-auto w-full max-w-7xl">
          {/* Header */}
          <div className="mb-6 md:mb-8 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-[10px] md:text-xs uppercase tracking-wider text-foreground/60">Dự án</div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">Lịch họp</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outlined"
                size="medium"
                onClick={() => window.history.back()}
              >
                Quay lại
              </Button>
            </div>
          </div>

          {/* Meeting Calendar Component */}
          <MeetingCalendar
            projectId={projectId}
            currentUserId={currentUserId}
            userRole={userRole}
            isTeamLeader={isTeamLeader}
            isMentor={isMentor}
          />
        </div>
      </main>
    </div>
  );
}
