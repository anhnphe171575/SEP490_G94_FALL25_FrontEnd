"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "../../../../../ultis/axios";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import RefreshIcon from "@mui/icons-material/Refresh";

type ProjectStats = {
  features: {
    total: number;
    by_status: { [key: string]: number };
    total_estimated_effort: number;
    total_actual_effort: number;
    effort_variance: number;
  };
  functions: {
    total: number;
    completed: number;
    in_progress: number;
    pending: number;
    overdue: number;
    completion_rate: number;
  };
  tasks: {
    total: number;
    completed: number;
    in_progress: number;
    pending: number;
    overdue: number;
    completion_rate: number;
  };
};

export default function ProjectMonitoringPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);

  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    loadStats();
  }, [projectId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [featuresRes, functionsRes, tasksRes] = await Promise.all([
        axiosInstance.get(`/api/projects/${projectId}/features/stats`),
        axiosInstance.get(`/api/projects/${projectId}/functions/stats`),
        axiosInstance.get(`/api/projects/${projectId}/tasks/stats`),
      ]);

      setStats({
        features: featuresRes.data,
        functions: functionsRes.data,
        tasks: tasksRes.data,
      });
    } catch (e: any) {
      setError(e?.response?.data?.message || "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      planning: "#3b82f6",
      "in-progress": "#f59e0b",
      testing: "#8b5cf6",
      completed: "#22c55e",
      cancelled: "#6b7280",
    };
    return colors[status] || "#3b82f6";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <ResponsiveSidebar />
        <main className="p-4 md:p-6 md:ml-64">
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        </main>
      </div>
    );
  }

  const effortVariance = stats?.features.effort_variance || 0;
  const isOverBudget = effortVariance > 0;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <ResponsiveSidebar />
      <main className="p-4 md:p-6 md:ml-64">
        <div className="mx-auto w-full max-w-7xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <IconButton onClick={() => router.back()}>
                <ArrowBackIcon />
              </IconButton>
              <div>
                <Typography variant="caption" color="text.secondary">
                  Project Monitoring
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  Dashboard & Adjustment
                </Typography>
              </div>
            </div>
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadStats}>
                Làm mới
              </Button>
            </Stack>
          </div>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Overview Cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Features
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                    {stats?.features.total || 0}
                  </Typography>
                  <Stack spacing={1}>
                    {stats?.features.by_status &&
                      Object.entries(stats.features.by_status).map(([status, count]) => (
                        <Box key={status} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Chip
                            label={status}
                            size="small"
                            sx={{ bgcolor: getStatusColor(status), color: "#fff", minWidth: 80 }}
                          />
                          <Typography variant="body2">{count}</Typography>
                        </Box>
                      ))}
                  </Stack>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Functions
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                    {stats?.functions.total || 0}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={stats?.functions.completion_rate || 0}
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {stats?.functions.completion_rate || 0}% hoàn thành
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Completed: {stats?.functions.completed || 0} | In Progress:{" "}
                      {stats?.functions.in_progress || 0} | Pending: {stats?.functions.pending || 0}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Tasks
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                    {stats?.tasks.total || 0}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={stats?.tasks.completion_rate || 0}
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {stats?.tasks.completion_rate || 0}% hoàn thành
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Completed: {stats?.tasks.completed || 0} | In Progress:{" "}
                      {stats?.tasks.in_progress || 0} | Pending: {stats?.tasks.pending || 0}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
          </Box>

          {/* Effort Analysis */}
          <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Phân tích Effort
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Estimated Effort
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats?.features.total_estimated_effort || 0} giờ
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Actual Effort
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats?.features.total_actual_effort || 0} giờ
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Variance
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography
                      variant="h4"
                      fontWeight="bold"
                      color={isOverBudget ? "error.main" : "success.main"}
                    >
                      {effortVariance > 0 ? "+" : ""}
                      {effortVariance} giờ
                    </Typography>
                    {isOverBudget ? (
                      <TrendingUpIcon color="error" />
                    ) : (
                      <TrendingDownIcon color="success" />
                    )}
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {isOverBudget
                      ? "Vượt budget - Cần điều chỉnh"
                      : "Trong budget - Tốt"}
                  </Typography>
                </Box>
            </Box>

            {isOverBudget && (
              <Alert severity="warning" sx={{ mt: 3 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Cảnh báo vượt budget
                </Typography>
                <Typography variant="body2">
                  Dự án đang vượt effort estimate {Math.abs(effortVariance)} giờ. Đề xuất:
                </Typography>
                <ul style={{ marginTop: 8, marginLeft: 20 }}>
                  <li>Xem xét lại scope của features</li>
                  <li>Re-estimate các functions còn lại</li>
                  <li>Thêm resources hoặc điều chỉnh timeline</li>
                  <li>Ưu tiên các features critical</li>
                </ul>
              </Alert>
            )}
          </Paper>

          {/* Recommendations */}
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Khuyến nghị điều chỉnh
            </Typography>
            <Stack spacing={2}>
              {stats?.tasks.overdue && stats.tasks.overdue > 0 && (
                <Alert severity="error">
                  Có {stats.tasks.overdue} tasks quá hạn - Cần xử lý ngay
                </Alert>
              )}
              {stats?.functions.overdue && stats.functions.overdue > 0 && (
                <Alert severity="error">
                  Có {stats.functions.overdue} functions quá hạn - Cần review
                </Alert>
              )}
              {stats?.tasks.pending && stats.tasks.pending > stats.tasks.total * 0.5 && (
                <Alert severity="info">
                  Nhiều tasks chưa bắt đầu ({stats.tasks.pending}) - Xem xét phân bổ lại resources
                </Alert>
              )}
              {stats?.functions.completion_rate &&
                stats.functions.completion_rate < 30 &&
                stats.functions.total > 10 && (
                  <Alert severity="warning">
                    Tỷ lệ hoàn thành functions thấp ({stats.functions.completion_rate}%) - Cần tăng tốc
                  </Alert>
                )}
              {(!stats?.tasks.overdue || stats.tasks.overdue === 0) &&
                (!stats?.functions.overdue || stats.functions.overdue === 0) &&
                !isOverBudget && (
                  <Alert severity="success">
                    Dự án đang đi đúng hướng! Tiếp tục maintain progress hiện tại.
                  </Alert>
                )}
            </Stack>
          </Paper>

          {/* Quick Actions */}
          <Paper variant="outlined" sx={{ p: 3, mt: 4 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Quick Actions
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" gap={2}>
              <Button
                variant="contained"
                onClick={() => router.push(`/projects/${projectId}/features`)}
              >
                Quản lý Features
              </Button>
              <Button
                variant="outlined"
                onClick={() => router.push(`/projects/${projectId}/milestones`)}
              >
                Quản lý Milestones
              </Button>
              <Button
                variant="outlined"
                onClick={() => router.push(`/projects/${projectId}`)}
              >
                Project Overview
              </Button>
            </Stack>
          </Paper>
        </div>
      </main>
    </div>
  );
}

