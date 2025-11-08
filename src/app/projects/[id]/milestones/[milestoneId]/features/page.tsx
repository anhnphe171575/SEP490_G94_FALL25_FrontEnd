"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "../../../../../../../ultis/axios";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";
import SimpleGanttChart from "@/components/SimpleGanttChart";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Typography,
  Paper,
  Stack,
  Card,
  CardContent,
  LinearProgress,
  Breadcrumbs,
  Link,
  Divider,
  Avatar,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AssignmentIcon from "@mui/icons-material/Assignment";
import FunctionsIcon from "@mui/icons-material/Functions";
import HomeIcon from "@mui/icons-material/Home";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import CancelIcon from "@mui/icons-material/Cancel";
import RateReviewIcon from "@mui/icons-material/RateReview";
import PersonIcon from "@mui/icons-material/Person";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import WarningIcon from "@mui/icons-material/Warning";

type User = {
  _id: string;
  full_name?: string;
  email?: string;
};

type SuccessCriteria = {
  _id?: string;
  title: string;
  description?: string;
  status: "pending" | "in-review" | "verified" | "rejected";
  verified_by?: User;
  verified_at?: string;
};

type Milestone = {
  _id: string;
  title: string;
  code?: string;
  start_date?: string;
  deadline?: string;
  actual_date?: string;
  status?: string;
  description?: string;
  notes?: string;
  estimated_effort?: number;
  actual_effort?: number;
  delay_days?: number;
  tags?: string[];
  approved_by?: User;
  created_by?: User;
  last_updated_by?: User;
  success_criteria?: SuccessCriteria[];
  createdAt?: string;
  updatedAt?: string;
  progress?: {
    overall: number;
    by_feature: Array<{
      feature_id: string;
      feature_title: string;
      task_count: number;
      function_count: number;
      completed_tasks: number;
      completed_functions: number;
      percentage: number;
    }>;
  };
};

export default function MilestoneFeaturesPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);
  const milestoneId = Array.isArray(params?.milestoneId) ? params?.milestoneId[0] : (params?.milestoneId as string);

  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMilestone = async () => {
    if (!projectId || !milestoneId) return;
    
    try {
      setLoading(true);
      const [milestoneRes, progressRes] = await Promise.all([
        axiosInstance.get(`/api/projects/${projectId}/milestones/${milestoneId}`),
        axiosInstance.get(`/api/projects/${projectId}/milestones/${milestoneId}/progress`).catch(() => ({ data: { progress: null } }))
      ]);
      
      const milestoneData = milestoneRes.data || {};
      const progressData = progressRes.data?.progress || null;
      
      setMilestone({
        ...milestoneData,
        progress: progressData
      });
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể tải thông tin milestone');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestone();
  }, [projectId, milestoneId]);

  // Auto-refresh progress every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (projectId && milestoneId) {
        fetchMilestone();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [projectId, milestoneId]);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "success";
    if (percentage >= 50) return "warning";
    return "error";
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Completed": return "success";
      case "In Progress": return "warning";
      case "Overdue": return "error";
      default: return "default";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getSuccessCriteriaIcon = (status: string) => {
    switch (status) {
      case "verified": return <CheckCircleIcon fontSize="small" color="success" />;
      case "in-review": return <RateReviewIcon fontSize="small" color="warning" />;
      case "rejected": return <CancelIcon fontSize="small" color="error" />;
      default: return <PendingIcon fontSize="small" color="disabled" />;
    }
  };

  const getSuccessCriteriaColor = (status: string) => {
    switch (status) {
      case "verified": return "success";
      case "in-review": return "warning";
      case "rejected": return "error";
      default: return "default";
    }
  };

  // Transform features data for Gantt Chart
  const getGanttData = () => {
    const features = milestone?.progress?.by_feature || [];
    
    // Return empty array if no features or invalid milestone data
    if (!features.length || !milestone?.start_date || !milestone?.deadline) {
      return [];
    }

    try {
      const startDate = new Date(milestone.start_date);
      const endDate = new Date(milestone.deadline);
      
      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.warn('Invalid dates for milestone:', milestone);
        return [];
      }

      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Ensure totalDays is positive
      if (totalDays <= 0) {
        console.warn('Invalid total days:', totalDays);
        return [];
      }

      return features.map((feature, index) => {
        // Validate feature data
        const percentage = typeof feature.percentage === 'number' ? feature.percentage : 0;
        const featureTitle = feature.feature_title || `Feature ${index + 1}`;
        const featureId = feature.feature_id || `feature_${index}`;
        
        // Calculate progress-based positioning
        const startDay = Math.floor(index * (totalDays / features.length));
        const endDay = Math.floor((index + 1) * (totalDays / features.length));
        
        // Ensure valid day values
        const validStartDay = isNaN(startDay) ? 0 : Math.max(0, startDay);
        const validEndDay = isNaN(endDay) ? 1 : Math.max(1, endDay);
        const duration = Math.max(1, validEndDay - validStartDay);
        
        // Determine status based on progress
        let status: 'completed' | 'in-progress' | 'planned' | 'overdue' = 'planned';
        if (percentage >= 100) status = 'completed';
        else if (percentage > 0) status = 'in-progress';
        else if (new Date() > endDate) status = 'overdue';

      // Calculate actual dates
      const actualStartDate = new Date(startDate);
      actualStartDate.setDate(actualStartDate.getDate() + validStartDay);
      
      const actualEndDate = new Date(startDate);
      actualEndDate.setDate(actualEndDate.getDate() + validEndDay);

      return {
        name: featureTitle,
        start: validStartDay,
        end: validEndDay,
        duration: duration,
        status,
        progress: percentage,
        feature_id: featureId,
        feature_title: featureTitle,
        startDate: actualStartDate.toLocaleDateString('vi-VN'),
        endDate: actualEndDate.toLocaleDateString('vi-VN'),
      };
      });
    } catch (error) {
      console.error('Error processing gantt data:', error);
      console.log('Milestone data:', milestone);
      console.log('Features data:', features);
      return [];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <ResponsiveSidebar />
        <main className="p-4 md:p-6 md:ml-64">
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <ResponsiveSidebar />
        <main className="p-4 md:p-6 md:ml-64">
          <Box className="rounded-xl border border-red-500/40 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 p-4">
            {error}
          </Box>
        </main>
      </div>
    );
  }

  if (!milestone) {
    return (
      <div className="min-h-screen bg-white">
        <ResponsiveSidebar />
        <main className="p-4 md:p-6 md:ml-64">
          <Box className="rounded-xl border border-gray-500/40 bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-200 p-4">
            Không tìm thấy milestone
          </Box>
        </main>
      </div>
    );
  }

  const features = milestone.progress?.by_feature || [];

  return (
    <div className="min-h-screen bg-white">
      <ResponsiveSidebar />
      <main className="p-4 md:p-6 md:ml-64">
        <div className="mx-auto w-full max-w-7xl">
          {/* Breadcrumbs */}
          <Breadcrumbs sx={{ mb: 3 }} separator="›">
            <Link 
              color="inherit" 
              href="/projects" 
              sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
            >
              <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
              Dự án
            </Link>
            <Link 
              color="inherit" 
              href={`/projects/${projectId}`}
              sx={{ textDecoration: 'none' }}
            >
              Milestones
            </Link>
            <Typography color="text.primary">Features</Typography>
          </Breadcrumbs>

          {/* Header */}
          <div className="mb-6 md:mb-8 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-[10px] md:text-xs uppercase tracking-wider text-foreground/60">Milestone</div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                {milestone.title}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <Chip
                  label={milestone.status || "Planned"}
                  color={getStatusColor(milestone.status)}
                  size="small"
                />
                <Typography variant="body2" color="text.secondary">
                  {formatDate(milestone.start_date)} - {formatDate(milestone.deadline)}
                </Typography>
                {milestone.progress && (
                  <Chip
                    label={`${milestone.progress.overall}% hoàn thành`}
                    color={getProgressColor(milestone.progress.overall)}
                    size="small"
                  />
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outlined" 
                onClick={fetchMilestone}
                disabled={loading}
              >
                🔄 Refresh Progress
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<ArrowBackIcon />} 
                onClick={() => router.back()}
              >
                Quay lại
              </Button>
            </div>
          </div>

          {/* Milestone Info Card */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Thông tin Milestone
              </Typography>

              {/* Basic Info */}
              <Stack spacing={3} sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  {milestone.code && (
                    <Box sx={{ flex: '1 1 300px' }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Mã Milestone
                      </Typography>
                      <Chip label={milestone.code} color="primary" variant="outlined" />
                    </Box>
                  )}
                  
                  {milestone.tags && milestone.tags.length > 0 && (
                    <Box sx={{ flex: '1 1 300px' }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Tags
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                        {milestone.tags.map((tag, idx) => (
                          <Chip key={idx} label={tag} size="small" />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Mô tả
                  </Typography>
                  <Typography variant="body1">
                    {milestone.description || 'Chưa có mô tả'}
                  </Typography>
                </Box>

                {milestone.notes && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Ghi chú
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                      <Typography variant="body2">
                        {milestone.notes}
                      </Typography>
                    </Paper>
                  </Box>
                )}
              </Stack>

              <Divider sx={{ my: 3 }} />

              {/* Timeline */}
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Timeline
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Box sx={{ flex: '1 1 200px' }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <CalendarTodayIcon fontSize="small" color="primary" />
                    <Typography variant="body2" color="text.secondary">
                      Ngày bắt đầu
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight={600}>
                    {formatDate(milestone.start_date)}
                  </Typography>
                </Box>
                <Box sx={{ flex: '1 1 200px' }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <CalendarTodayIcon fontSize="small" color="error" />
                    <Typography variant="body2" color="text.secondary">
                      Hạn chót
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight={600}>
                    {formatDate(milestone.deadline)}
                  </Typography>
                </Box>
                {milestone.actual_date && (
                  <Box sx={{ flex: '1 1 200px' }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <CheckCircleIcon fontSize="small" color="success" />
                      <Typography variant="body2" color="text.secondary">
                        Hoàn thành thực tế
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight={600}>
                      {formatDate(milestone.actual_date)}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Effort & Delay */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Box sx={{ flex: '1 1 200px' }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <AccessTimeIcon fontSize="small" color="info" />
                    <Typography variant="body2" color="text.secondary">
                      Ước tính (giờ)
                    </Typography>
                  </Box>
                  <Typography variant="h6" fontWeight={600}>
                    {milestone.estimated_effort || 0}h
                  </Typography>
                </Box>
                <Box sx={{ flex: '1 1 200px' }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <AccessTimeIcon fontSize="small" color="warning" />
                    <Typography variant="body2" color="text.secondary">
                      Thực tế (giờ)
                    </Typography>
                  </Box>
                  <Typography variant="h6" fontWeight={600}>
                    {milestone.actual_effort || 0}h
                  </Typography>
                </Box>
                {milestone.delay_days !== undefined && milestone.delay_days > 0 && (
                  <Box sx={{ flex: '1 1 200px' }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <WarningIcon fontSize="small" color="error" />
                      <Typography variant="body2" color="text.secondary">
                        Trễ hạn
                      </Typography>
                    </Box>
                    <Typography variant="h6" fontWeight={600} color="error">
                      {milestone.delay_days} ngày
                    </Typography>
                  </Box>
                )}
              </Box>

              {milestone.progress && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                    Tiến độ tổng thể
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2}>
                    <LinearProgress
                      variant="determinate"
                      value={milestone.progress.overall}
                      color={getProgressColor(milestone.progress.overall)}
                      sx={{ flexGrow: 1, height: 10, borderRadius: 5 }}
                    />
                    <Typography variant="h6" fontWeight={600}>
                      {milestone.progress.overall}%
                    </Typography>
                  </Box>
                </>
              )}

              {/* People */}
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Người liên quan
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {milestone.created_by && (
                  <Box sx={{ flex: '1 1 250px' }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                        <PersonIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Người tạo
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {milestone.created_by.full_name || milestone.created_by.email}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
                {milestone.approved_by && (
                  <Box sx={{ flex: '1 1 250px' }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'success.main' }}>
                        <CheckCircleIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Người phê duyệt
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {milestone.approved_by.full_name || milestone.approved_by.email}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
                {milestone.last_updated_by && (
                  <Box sx={{ flex: '1 1 250px' }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'info.main' }}>
                        <PersonIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Cập nhật cuối
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {milestone.last_updated_by.full_name || milestone.last_updated_by.email}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Success Criteria Card */}
          {milestone.success_criteria && milestone.success_criteria.length > 0 && (
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Tiêu chí thành công ({milestone.success_criteria.length})
                </Typography>
                <List>
                  {milestone.success_criteria.map((criteria, idx) => (
                    <ListItem
                      key={criteria._id || idx}
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 2,
                        mb: 2,
                        bgcolor: 'background.paper',
                      }}
                    >
                      <ListItemIcon>
                        {getSuccessCriteriaIcon(criteria.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body1" fontWeight={600}>
                              {criteria.title}
                            </Typography>
                            <Chip
                              label={criteria.status}
                              size="small"
                              color={getSuccessCriteriaColor(criteria.status) as any}
                            />
                          </Box>
                        }
                        secondary={
                          <Stack component="span" spacing={1} sx={{ mt: 1, display: 'block' }}>
                            {criteria.description && (
                              <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block' }}>
                                {criteria.description}
                              </Typography>
                            )}
                            {criteria.verified_by && (
                              <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                Xác nhận bởi: {criteria.verified_by.full_name || criteria.verified_by.email}
                                {criteria.verified_at && ` - ${formatDate(criteria.verified_at)}`}
                              </Typography>
                            )}
                          </Stack>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}

          {/* Gantt Chart Section */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <SimpleGanttChart 
                data={getGanttData()}
                title="Timeline Features"
                height={300}
              />
            </CardContent>
          </Card>

          {/* Features Section */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Features trong Milestone này
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Tổng cộng {features.length} features
              </Typography>

              {features.length === 0 ? (
                <Box textAlign="center" py={6}>
                  <Typography variant="body2" color="text.secondary">
                    Chưa có feature nào được liên kết với milestone này
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {features.map((feature) => (
                    <Paper 
                      key={feature.feature_id} 
                      variant="outlined" 
                      sx={{ p: 3, borderRadius: 2 }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box>
                          <Typography variant="h6" fontWeight={600} color="primary" gutterBottom>
                            {feature.feature_title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ID: {feature.feature_id}
                          </Typography>
                        </Box>
                        <Chip 
                          label={`${feature.percentage}%`} 
                          color={getProgressColor(feature.percentage)}
                          size="medium"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>

                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Stack direction="row" spacing={3}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <AssignmentIcon fontSize="small" color="info" />
                            <Typography variant="body2">
                              Tasks: {feature.completed_tasks}/{feature.task_count}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={1}>
                            <FunctionsIcon fontSize="small" color="secondary" />
                            <Typography variant="body2">
                              Functions: {feature.completed_functions}/{feature.function_count}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>

                      <Box sx={{ width: '100%', height: 8, bgcolor: 'grey.200', borderRadius: 4, overflow: 'hidden' }}>
                        <Box 
                          sx={{ 
                            height: '100%', 
                            width: `${feature.percentage}%`,
                            bgcolor: feature.percentage >= 80 ? 'success.main' : feature.percentage >= 50 ? 'warning.main' : 'error.main',
                            transition: 'width 0.3s ease'
                          }} 
                        />
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
