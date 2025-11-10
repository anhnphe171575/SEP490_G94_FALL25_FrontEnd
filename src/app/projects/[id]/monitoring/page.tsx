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
  Grid,
  Divider,
  Badge,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import RefreshIcon from "@mui/icons-material/Refresh";
import PsychologyIcon from "@mui/icons-material/Psychology";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import GroupIcon from "@mui/icons-material/Group";
import AssignmentIcon from "@mui/icons-material/Assignment";
import SpeedIcon from "@mui/icons-material/Speed";
import TimelineIcon from "@mui/icons-material/Timeline";
import AssessmentIcon from "@mui/icons-material/Assessment";
import PeopleIcon from "@mui/icons-material/People";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import StarIcon from "@mui/icons-material/Star";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

// Feature Effort Predictor Component
function FeatureEffortPredictor({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [featureData, setFeatureData] = useState({
    title: '',
    description: '',
    tags: [] as string[],
    estimated_hours: 0,
    projectDuration: 0
  });
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.post('/api/ai/predictions/feature-effort', featureData);
      setPrediction(response.data.data);
    } catch (error) {
      console.error('Prediction error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        variant="outlined" 
        startIcon={<PsychologyIcon />}
        onClick={() => setOpen(true)}
        fullWidth
      >
        Dự đoán Effort cho Feature Mới
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>AI Feature Effort Prediction</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="Feature Title"
              value={featureData.title}
              onChange={(e) => setFeatureData({ ...featureData, title: e.target.value })}
              fullWidth
            />
            
            <TextField
              label="Description"
              value={featureData.description}
              onChange={(e) => setFeatureData({ ...featureData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            
            <TextField
              label="Estimated Hours"
              type="number"
              value={featureData.estimated_hours}
              onChange={(e) => setFeatureData({ ...featureData, estimated_hours: Number(e.target.value) })}
              fullWidth
            />
            
            <TextField
              label="Project Duration (days)"
              type="number"
              value={featureData.projectDuration}
              onChange={(e) => setFeatureData({ ...featureData, projectDuration: Number(e.target.value) })}
              fullWidth
            />

            {prediction && (
              <Card variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  AI Prediction Results
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {prediction.predictedEffort} giờ
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Confidence: {Math.round(prediction.confidence * 100)}%
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Recommendations:
                </Typography>
                <Stack spacing={1}>
                  {prediction.recommendations.map((rec: string, index: number) => (
                    <Typography key={index} variant="caption" display="block">
                      • {rec}
                    </Typography>
                  ))}
                </Stack>
              </Card>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            onClick={handlePredict} 
            variant="contained" 
            disabled={loading || !featureData.title}
          >
            {loading ? 'Predicting...' : 'Predict Effort'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

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

type AIPredictions = {
  projectProgress: {
    currentProgress: number;
    prediction: number;
    confidence: number;
    recommendations: string[];
  };
  teamPerformances: Array<{
    teamId: string;
    teamName: string;
    performanceScore: number;
    confidence: number;
    recommendations: string[];
  }>;
  taskDelays: Array<{
    taskId: string;
    taskTitle: string;
    delayProbability: number;
    riskLevel: 'High' | 'Medium' | 'Low';
    confidence: number;
    recommendations: string[];
  }>;
  overallRiskScore: number;
  summary: {
    totalTeams: number;
    totalTasks: number;
    highRiskTasks: number;
    mediumRiskTasks: number;
    avgTeamPerformance: number;
  };
  projectRisk?: {
    riskScore: number;
    riskLevel: 'High' | 'Medium' | 'Low';
    confidence: number;
    factors: {
      overdueTasks: number;
      effortVariance: number;
      scheduleVariance: number;
      activityDecline: number;
    };
    recommendations: string[];
  };
  resourceAllocation?: {
    allocationEfficiency: number;
    confidence: number;
    memberWorkloads: Array<{
      memberId: string;
      totalTasks: number;
      completedTasks: number;
      workload: number;
      timeSpent: number;
    }>;
    recommendations: string[];
  };
  timeline?: {
    predictedCompletionDate: string;
    daysDifference: number;
    confidence: number;
    currentVelocity: number;
    recommendations: string[];
  };
  quality?: {
    qualityScore: number;
    qualityLevel: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    confidence: number;
    indicators: {
      reworkCount: number;
      statusChanges: number;
      completionRate: number;
      avgCompletionTime: number;
    };
    recommendations: string[];
  };
};

type ChartsData = {
  project: {
    _id: string;
    topic: string;
    code: string;
    start_date: string;
    end_date: string;
  };
  period: 'week' | 'month' | 'day';
  charts: {
    progress_timeline: Array<{
      date: string;
      progress: number;
      completed_tasks: number;
      completed_functions: number;
      total_tasks: number;
      total_functions: number;
    }>;
    status_distribution: {
      milestones: {
        total: number;
        completed: number;
        in_progress: number;
        planned: number;
        overdue: number;
      };
      features: {
        total: number;
        completed: number;
        in_progress: number;
        planning: number;
        testing: number;
        cancelled: number;
      };
      tasks: {
        total: number;
        completed: number;
        in_progress: number;
        pending: number;
        overdue: number;
      };
      functions: {
        total: number;
        completed: number;
        in_progress: number;
        pending: number;
        overdue: number;
      };
    };
    effort_trends: Array<{
      date: string;
      estimated: number;
      actual: number;
      variance: number;
    }>;
    velocity: Array<{
      date: string;
      tasks_completed: number;
      functions_completed: number;
      features_completed: number;
    }>;
    completion_trends: Array<{
      date: string;
      tasks: number;
      functions: number;
      features: number;
      milestones: number;
    }>;
    burndown: Array<{
      date: string;
      remaining: number;
      ideal: number;
    }>;
    team_performance: Array<{
      user_id: string;
      user_name: string;
      total_tasks: number;
      completed_tasks: number;
      completion_rate: number;
    }>;
  };
  summary: {
    total_milestones: number;
    total_features: number;
    total_tasks: number;
    total_functions: number;
    overall_progress: number;
  };
};

export default function ProjectMonitoringPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);

  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [aiPredictions, setAiPredictions] = useState<AIPredictions | null>(null);
  const [chartsData, setChartsData] = useState<ChartsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [period, setPeriod] = useState<'week' | 'month' | 'day'>('week');
  const [error, setError] = useState<string | null>(null);
  const [retraining, setRetraining] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    loadStats();
    loadAIPredictions();
    loadCharts();
  }, [projectId, period]);

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

  const loadAIPredictions = async () => {
    try {
      setAiLoading(true);
      setError(null);
      
      // Load batch analysis (existing endpoint) - sử dụng Promise.allSettled để tránh crash
      const [batchResponse, riskResponse, resourceResponse, timelineResponse] = await Promise.allSettled([
        axiosInstance.get(`/api/ai/predictions/batch-analysis/${projectId}`).catch((err) => {
          console.error('Batch analysis error:', err);
          return null;
        }),
        axiosInstance.get(`/api/ai/predictions/project-risk/${projectId}`).catch(() => null),
        axiosInstance.get(`/api/ai/predictions/resource-allocation/${projectId}`).catch(() => null),
        axiosInstance.get(`/api/ai/predictions/timeline/${projectId}`).catch(() => null),
      ]);

      // Xử lý batch response
      let batchData = null;
      if (batchResponse.status === 'fulfilled' && batchResponse.value?.data?.data) {
        batchData = batchResponse.value.data.data;
      } else if (batchResponse.status === 'rejected' || !batchResponse.value) {
        console.error('Batch analysis failed:', batchResponse.status === 'rejected' ? batchResponse.reason : 'No data');
        setError('Không thể tải AI predictions. Vui lòng thử lại sau hoặc kiểm tra backend API.');
        // Không set aiPredictions nếu batch analysis fail
        return;
      }

      const predictions: AIPredictions = {
        ...batchData,
        projectRisk: riskResponse.status === 'fulfilled' && riskResponse.value?.data?.data 
          ? riskResponse.value.data.data 
          : undefined,
        resourceAllocation: resourceResponse.status === 'fulfilled' && resourceResponse.value?.data?.data
          ? resourceResponse.value.data.data
          : undefined,
        timeline: timelineResponse.status === 'fulfilled' && timelineResponse.value?.data?.data
          ? timelineResponse.value.data.data
          : undefined,
      };

      setAiPredictions(predictions);
    } catch (e: any) {
      console.error('AI Predictions error:', e);
      const errorMessage = e?.response?.data?.message || e?.message || 'Không thể tải AI predictions';
      setError(errorMessage);
      // Không set aiPredictions nếu có lỗi
      setAiPredictions(null);
    } finally {
      setAiLoading(false);
    }
  };

  const handleRetrain = async () => {
    try {
      setRetraining(true);
      await axiosInstance.post('/api/ai/predictions/retrain');
      // Reload predictions after retrain
      await loadAIPredictions();
      alert('AI models đã được retrain thành công!');
    } catch (e: any) {
      console.error('Retrain error:', e);
      alert('Lỗi khi retrain AI models: ' + (e?.response?.data?.message || e.message));
    } finally {
      setRetraining(false);
    }
  };

  const loadCharts = async () => {
    try {
      setChartsLoading(true);
      const response = await axiosInstance.get(`/api/projects/${projectId}/charts/overview`, {
        params: { period }
      });
      setChartsData(response.data);
    } catch (e: any) {
      console.error('Charts error:', e);
      // Không set error để không ảnh hưởng đến UI chính
    } finally {
      setChartsLoading(false);
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

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'High': return '#f44336';
      case 'Medium': return '#ff9800';
      case 'Low': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#ff9800';
    return '#f44336';
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

  const effortVariance = stats?.features.effort_variance || 0;
  const isOverBudget = effortVariance > 0;

  return (
    <div className="min-h-screen bg-white">
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
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Project Monitoring
                </Typography>
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#000' }}>
                  Dashboard & Adjustment
                </Typography>
              </div>
            </div>
            <Stack direction="row" spacing={2} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Khoảng thời gian</InputLabel>
                <Select
                  value={period}
                  label="Khoảng thời gian"
                  onChange={(e) => setPeriod(e.target.value as 'week' | 'month' | 'day')}
                >
                  <MenuItem value="day">Theo ngày</MenuItem>
                  <MenuItem value="week">Theo tuần</MenuItem>
                  <MenuItem value="month">Theo tháng</MenuItem>
                </Select>
              </FormControl>
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadStats}>
                Làm mới
              </Button>
              <Button 
                variant="contained" 
                startIcon={<PsychologyIcon />} 
                onClick={loadAIPredictions}
                disabled={aiLoading}
                color="secondary"
              >
                {aiLoading ? 'Đang phân tích...' : 'AI Predictions'}
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<AutoFixHighIcon />} 
                onClick={handleRetrain}
                disabled={retraining || aiLoading}
                color="primary"
              >
                {retraining ? 'Đang retrain...' : 'Retrain AI'}
              </Button>
            </Stack>
          </div>

          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 3 }}
              onClose={() => setError(null)}
              action={
                <Button color="inherit" size="small" onClick={loadAIPredictions}>
                  Thử lại
                </Button>
              }
            >
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Lỗi khi tải AI Predictions
              </Typography>
              {error}
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Lưu ý: Các tính năng AI predictions cần backend API được cấu hình đúng. 
                Vui lòng kiểm tra backend logs để biết thêm chi tiết.
              </Typography>
            </Alert>
          )}

          {/* Overview Cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
              <Card>
                <CardContent>
                  <Typography variant="caption" sx={{ color: '#666' }}>
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
                  <Typography variant="caption" sx={{ color: '#666' }}>
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
                  <Typography variant="body2" sx={{ color: '#333' }}>
                    {stats?.functions.completion_rate || 0}% hoàn thành
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      Completed: {stats?.functions.completed || 0} | In Progress:{" "}
                      {stats?.functions.in_progress || 0} | Pending: {stats?.functions.pending || 0}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography variant="caption" sx={{ color: '#666' }}>
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
                  <Typography variant="body2" sx={{ color: '#333' }}>
                    {stats?.tasks.completion_rate || 0}% hoàn thành
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" sx={{ color: '#666' }}>
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
                  <Typography variant="caption" sx={{ color: '#666' }}>
                    Estimated Effort
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#000' }}>
                    {stats?.features.total_estimated_effort || 0} giờ
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#666' }}>
                    Actual Effort
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#000' }}>
                    {stats?.features.total_actual_effort || 0} giờ
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#666' }}>
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
                  <Typography variant="body2" sx={{ color: '#333' }}>
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

          {/* AI Predictions Section */}
          {aiPredictions && (
            <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <PsychologyIcon color="secondary" />
                <Typography variant="h6" fontWeight="bold">
                  AI Predictions & Analysis
                </Typography>
                <Chip 
                  label={`Risk Score: ${aiPredictions.overallRiskScore}%`} 
                  color={aiPredictions.overallRiskScore > 70 ? 'error' : aiPredictions.overallRiskScore > 40 ? 'warning' : 'success'}
                  size="small"
                />
                {aiPredictions.projectRisk && (
                  <Chip 
                    label={`Project Risk: ${aiPredictions.projectRisk.riskLevel}`} 
                    color={aiPredictions.projectRisk.riskLevel === 'High' ? 'error' : aiPredictions.projectRisk.riskLevel === 'Medium' ? 'warning' : 'success'}
                    size="small"
                  />
                )}
              </Box>

              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                {/* Project Progress Prediction */}
                <Box sx={{ flex: 1 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <SpeedIcon color="primary" />
                        <Typography variant="h6" fontWeight="bold">
                          Project Progress Prediction
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h3" fontWeight="bold" color="primary">
                          {aiPredictions.projectProgress.prediction}%
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Confidence: {Math.round(aiPredictions.projectProgress.confidence * 100)}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={aiPredictions.projectProgress.prediction} 
                        sx={{ mb: 2 }}
                      />
                      <Typography variant="body2" sx={{ color: '#333', fontWeight: 500 }}>
                        Recommendations:
                      </Typography>
                      <Stack spacing={1}>
                        {aiPredictions.projectProgress.recommendations.map((rec, index) => (
                          <Typography key={index} variant="caption" display="block">
                            • {rec}
                          </Typography>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>

                {/* Team Performance */}
                <Box sx={{ flex: 1 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <GroupIcon color="primary" />
                        <Typography variant="h6" fontWeight="bold">
                          Team Performance
                        </Typography>
                      </Box>
                      <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                        {aiPredictions.summary.avgTeamPerformance}%
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
                        Average across {aiPredictions.summary.totalTeams} teams
                      </Typography>
                      <Stack spacing={1}>
                        {aiPredictions.teamPerformances.map((team, index) => (
                          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="body2" sx={{ minWidth: 120 }}>
                              {team.teamName}
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={team.performanceScore} 
                              sx={{ flexGrow: 1 }}
                              color={team.performanceScore >= 80 ? 'success' : team.performanceScore >= 60 ? 'warning' : 'error'}
                            />
                            <Typography variant="caption" sx={{ minWidth: 40 }}>
                              {team.performanceScore}%
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>
              </Box>

              {/* Task Risk Analysis */}
              <Box sx={{ mt: 3 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <AssignmentIcon color="primary" />
                        <Typography variant="h6" fontWeight="bold">
                          Task Risk Analysis
                        </Typography>
                        <Badge 
                          badgeContent={aiPredictions.summary.highRiskTasks} 
                          color="error"
                        >
                          <WarningIcon color="error" />
                        </Badge>
                      </Box>
                      
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                        <Box sx={{ flex: 1, textAlign: 'center', p: 2, bgcolor: '#f44336', color: 'white', borderRadius: 1 }}>
                          <Typography variant="h4" fontWeight="bold">
                            {aiPredictions.summary.highRiskTasks}
                          </Typography>
                          <Typography variant="body2">High Risk Tasks</Typography>
                        </Box>
                        <Box sx={{ flex: 1, textAlign: 'center', p: 2, bgcolor: '#ff9800', color: 'white', borderRadius: 1 }}>
                          <Typography variant="h4" fontWeight="bold">
                            {aiPredictions.summary.mediumRiskTasks}
                          </Typography>
                          <Typography variant="body2">Medium Risk Tasks</Typography>
                        </Box>
                        <Box sx={{ flex: 1, textAlign: 'center', p: 2, bgcolor: '#4caf50', color: 'white', borderRadius: 1 }}>
                          <Typography variant="h4" fontWeight="bold">
                            {aiPredictions.summary.totalTasks - aiPredictions.summary.highRiskTasks - aiPredictions.summary.mediumRiskTasks}
                          </Typography>
                          <Typography variant="body2">Low Risk Tasks</Typography>
                        </Box>
                      </Box>

                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                        High Risk Tasks:
                      </Typography>
                      <Stack spacing={1}>
                        {aiPredictions.taskDelays
                          .filter(task => task.riskLevel === 'High')
                          .slice(0, 5)
                          .map((task, index) => (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <ErrorIcon color="error" fontSize="small" />
                              <Typography variant="body2" sx={{ flexGrow: 1 }}>
                                {task.taskTitle}
                              </Typography>
                              <Chip 
                                label={`${task.delayProbability}%`} 
                                color="error" 
                                size="small"
                              />
                            </Box>
                          ))}
                        {aiPredictions.taskDelays.filter(task => task.riskLevel === 'High').length === 0 && (
                          <Typography variant="body2" sx={{ color: '#666' }}>
                            Không có task nào có rủi ro cao
                          </Typography>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
              </Box>

              {/* New AI Predictions - Project Risk, Resource Allocation, Timeline, Quality */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, mt: 3 }}>
                {/* Project Risk Prediction */}
                {aiPredictions.projectRisk && (
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <AssessmentIcon color="error" />
                        <Typography variant="h6" fontWeight="bold">
                          Project Risk Analysis
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h3" fontWeight="bold" color="error">
                          {aiPredictions.projectRisk.riskScore}%
                        </Typography>
                        <Chip 
                          label={aiPredictions.projectRisk.riskLevel} 
                          color={aiPredictions.projectRisk.riskLevel === 'High' ? 'error' : aiPredictions.projectRisk.riskLevel === 'Medium' ? 'warning' : 'success'}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                        <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                          Confidence: {Math.round(aiPredictions.projectRisk.confidence * 100)}%
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: '#000' }}>
                        Risk Factors:
                      </Typography>
                      <Stack spacing={1} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: '#333' }}>Overdue Tasks:</Typography>
                          <Typography variant="body2" fontWeight="bold" sx={{ color: '#000' }}>{aiPredictions.projectRisk.factors.overdueTasks}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: '#333' }}>Effort Variance:</Typography>
                          <Typography variant="body2" fontWeight="bold" sx={{ color: '#000' }}>{aiPredictions.projectRisk.factors.effortVariance}%</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: '#333' }}>Schedule Variance:</Typography>
                          <Typography variant="body2" fontWeight="bold" sx={{ color: '#000' }}>{aiPredictions.projectRisk.factors.scheduleVariance}%</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: '#333' }}>Activity Decline:</Typography>
                          <Typography variant="body2" fontWeight="bold" sx={{ color: '#000' }}>{aiPredictions.projectRisk.factors.activityDecline}%</Typography>
                        </Box>
                      </Stack>
                      <Typography variant="body2" sx={{ color: '#333', fontWeight: 500, mb: 1 }}>
                        Recommendations:
                      </Typography>
                      <Stack spacing={1}>
                        {aiPredictions.projectRisk.recommendations.map((rec, index) => (
                          <Typography key={index} variant="caption" display="block">
                            • {rec}
                          </Typography>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                )}

                {/* Resource Allocation */}
                {aiPredictions.resourceAllocation && (
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <PeopleIcon color="primary" />
                        <Typography variant="h6" fontWeight="bold">
                          Resource Allocation
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h3" fontWeight="bold" color="primary">
                          {aiPredictions.resourceAllocation.allocationEfficiency}%
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                          Allocation Efficiency
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Confidence: {Math.round(aiPredictions.resourceAllocation.confidence * 100)}%
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                        Member Workloads:
                      </Typography>
                      <Stack spacing={1} sx={{ mb: 2, maxHeight: 200, overflowY: 'auto' }}>
                        {aiPredictions.resourceAllocation.memberWorkloads.map((member, index) => (
                          <Box key={index} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2">Member {index + 1}:</Typography>
                              <Typography variant="body2" fontWeight="bold">{member.workload} pts</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                              <Typography variant="caption" sx={{ color: '#666' }}>
                                Tasks: {member.completedTasks}/{member.totalTasks}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#666' }}>
                                Time: {member.timeSpent}h
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={(member.completedTasks / Math.max(1, member.totalTasks)) * 100} 
                              sx={{ mt: 0.5, height: 4 }}
                            />
                          </Box>
                        ))}
                      </Stack>
                      <Typography variant="body2" sx={{ color: '#333', fontWeight: 500, mb: 1 }}>
                        Recommendations:
                      </Typography>
                      <Stack spacing={1}>
                        {aiPredictions.resourceAllocation.recommendations.map((rec, index) => (
                          <Typography key={index} variant="caption" display="block" sx={{ color: '#333' }}>
                            • {rec}
                          </Typography>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                )}

                {/* Timeline Prediction */}
                {aiPredictions.timeline && (
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <CalendarTodayIcon color="info" />
                        <Typography variant="h6" fontWeight="bold">
                          Timeline Prediction
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h5" fontWeight="bold" color="info.main" sx={{ mb: 1 }}>
                          {new Date(aiPredictions.timeline.predictedCompletionDate).toLocaleDateString('vi-VN')}
                        </Typography>
                        <Chip 
                          label={aiPredictions.timeline.daysDifference > 0 
                            ? `Trễ ${Math.abs(aiPredictions.timeline.daysDifference)} ngày`
                            : aiPredictions.timeline.daysDifference < 0
                            ? `Sớm ${Math.abs(aiPredictions.timeline.daysDifference)} ngày`
                            : 'Đúng hạn'
                          } 
                          color={aiPredictions.timeline.daysDifference > 7 ? 'error' : aiPredictions.timeline.daysDifference > 0 ? 'warning' : 'success'}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                        <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                          Velocity: {aiPredictions.timeline.currentVelocity} tasks/ngày
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Confidence: {Math.round(aiPredictions.timeline.confidence * 100)}%
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="body2" sx={{ color: '#333', fontWeight: 500, mb: 1 }}>
                        Recommendations:
                      </Typography>
                      <Stack spacing={1}>
                        {aiPredictions.timeline.recommendations.map((rec, index) => (
                          <Typography key={index} variant="caption" display="block">
                            • {rec}
                          </Typography>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                )}

                {/* Quality Prediction - Placeholder for future feature-level quality */}
                {aiPredictions.quality && (
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <StarIcon color="warning" />
                        <Typography variant="h6" fontWeight="bold">
                          Quality Prediction
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h3" fontWeight="bold" color="warning.main">
                          {aiPredictions.quality.qualityScore}%
                        </Typography>
                        <Chip 
                          label={aiPredictions.quality.qualityLevel} 
                          color={aiPredictions.quality.qualityLevel === 'Excellent' ? 'success' : aiPredictions.quality.qualityLevel === 'Good' ? 'info' : aiPredictions.quality.qualityLevel === 'Fair' ? 'warning' : 'error'}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                        <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                          Confidence: {Math.round(aiPredictions.quality.confidence * 100)}%
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: '#000' }}>
                        Quality Indicators:
                      </Typography>
                      <Stack spacing={1} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: '#333' }}>Rework Count:</Typography>
                          <Typography variant="body2" fontWeight="bold" sx={{ color: '#000' }}>{aiPredictions.quality.indicators.reworkCount}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: '#333' }}>Status Changes:</Typography>
                          <Typography variant="body2" fontWeight="bold" sx={{ color: '#000' }}>{aiPredictions.quality.indicators.statusChanges}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: '#333' }}>Completion Rate:</Typography>
                          <Typography variant="body2" fontWeight="bold" sx={{ color: '#000' }}>{Math.round(aiPredictions.quality.indicators.completionRate * 100)}%</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: '#333' }}>Avg Completion Time:</Typography>
                          <Typography variant="body2" fontWeight="bold" sx={{ color: '#000' }}>{Math.round(aiPredictions.quality.indicators.avgCompletionTime * 10) / 10} ngày</Typography>
                        </Box>
                      </Stack>
                      <Typography variant="body2" sx={{ color: '#333', fontWeight: 500, mb: 1 }}>
                        Recommendations:
                      </Typography>
                      <Stack spacing={1}>
                        {aiPredictions.quality.recommendations.map((rec, index) => (
                          <Typography key={index} variant="caption" display="block">
                            • {rec}
                          </Typography>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                )}
              </Box>
            </Paper>
          )}

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

          {/* Charts Section */}
          {chartsData && (
            <Paper variant="outlined" sx={{ p: 3, mt: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" fontWeight="bold">
                  Biểu đồ & Phân tích
                </Typography>
                {chartsLoading && <CircularProgress size={24} />}
              </Box>

              {/* Progress Timeline */}
              {chartsData.charts.progress_timeline && chartsData.charts.progress_timeline.length > 0 && (
                <Card 
                  variant="outlined" 
                  sx={{ 
                    mb: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: 6,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Tiến độ theo thời gian
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart 
                        data={chartsData.charts.progress_timeline}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" opacity={0.3} />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => {
                            if (period === 'day') return value.split('-')[2];
                            if (period === 'week') return `Tuần ${value}`;
                            return value;
                          }}
                          stroke="#888"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis domain={[0, 100]} stroke="#888" style={{ fontSize: '12px' }} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #ccc',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                          }}
                          labelStyle={{ fontWeight: 'bold', color: '#333' }}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px' }}
                          iconType="line"
                        />
                        <Area
                          type="monotone"
                          dataKey="progress"
                          stroke="#8884d8"
                          fill="url(#progressGradient)"
                          strokeWidth={3}
                          name="Tiến độ (%)"
                          dot={{ fill: '#8884d8', r: 4, strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 6, strokeWidth: 2 }}
                          animationDuration={1000}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Status Distribution */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, mb: 3 }}>
                {/* Tasks Status */}
                <Card 
                  variant="outlined"
                  sx={{
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: 6,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Phân bổ trạng thái Tasks
                    </Typography>
                    {(() => {
                      const tasksData = [
                        { name: 'Completed', value: chartsData.charts.status_distribution.tasks.completed || 0, color: '#22c55e' },
                        { name: 'In Progress', value: chartsData.charts.status_distribution.tasks.in_progress || 0, color: '#f59e0b' },
                        { name: 'Pending', value: chartsData.charts.status_distribution.tasks.pending || 0, color: '#3b82f6' },
                        { name: 'Overdue', value: chartsData.charts.status_distribution.tasks.overdue || 0, color: '#f44336' },
                      ].filter(item => item.value > 0);
                      
                      if (tasksData.length === 0) {
                        return (
                          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 250 }}>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                              Chưa có dữ liệu
                            </Typography>
                          </Box>
                        );
                      }
                      
                      return (
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={tasksData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              innerRadius={40}
                              fill="#8884d8"
                              dataKey="value"
                              animationDuration={1000}
                              animationBegin={0}
                              paddingAngle={2}
                            >
                              {tasksData.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={entry.color}
                                  stroke="#fff"
                                  strokeWidth={2}
                                  style={{
                                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer'
                                  }}
                                />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: '1px solid #ccc',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Functions Status */}
                <Card 
                  variant="outlined"
                  sx={{
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: 6,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Phân bổ trạng thái Functions
                    </Typography>
                    {(() => {
                      const functionsData = [
                        { name: 'Completed', value: chartsData.charts.status_distribution.functions.completed || 0, color: '#22c55e' },
                        { name: 'In Progress', value: chartsData.charts.status_distribution.functions.in_progress || 0, color: '#f59e0b' },
                        { name: 'Pending', value: chartsData.charts.status_distribution.functions.pending || 0, color: '#3b82f6' },
                        { name: 'Overdue', value: chartsData.charts.status_distribution.functions.overdue || 0, color: '#f44336' },
                      ].filter(item => item.value > 0);
                      
                      if (functionsData.length === 0) {
                        return (
                          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 250 }}>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                              Chưa có dữ liệu
                            </Typography>
                          </Box>
                        );
                      }
                      
                      return (
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={functionsData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              innerRadius={40}
                              fill="#8884d8"
                              dataKey="value"
                              animationDuration={1000}
                              animationBegin={0}
                              paddingAngle={2}
                            >
                              {functionsData.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={entry.color}
                                  stroke="#fff"
                                  strokeWidth={2}
                                  style={{
                                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer'
                                  }}
                                />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: '1px solid #ccc',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      );
                    })()}
                  </CardContent>
                </Card>
              </Box>

              {/* Effort Trends */}
              {chartsData.charts.effort_trends && chartsData.charts.effort_trends.length > 0 && (
                <Card 
                  variant="outlined" 
                  sx={{ 
                    mb: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: 6,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Xu hướng Effort
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart 
                        data={chartsData.charts.effort_trends}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="estimatedGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" opacity={0.3} />
                        <XAxis 
                          dataKey="date"
                          tickFormatter={(value) => {
                            if (period === 'day') return value.split('-')[2];
                            if (period === 'week') return `Tuần ${value}`;
                            return value;
                          }}
                          stroke="#888"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis stroke="#888" style={{ fontSize: '12px' }} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #ccc',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                          }}
                          labelStyle={{ fontWeight: 'bold', color: '#333' }}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="estimated" 
                          stackId="1" 
                          stroke="#8884d8" 
                          fill="url(#estimatedGradient)" 
                          name="Estimated (giờ)"
                          strokeWidth={2}
                          animationDuration={1000}
                          animationBegin={0}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="actual" 
                          stackId="1" 
                          stroke="#82ca9d" 
                          fill="url(#actualGradient)" 
                          name="Actual (giờ)"
                          strokeWidth={2}
                          animationDuration={1000}
                          animationBegin={200}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="variance" 
                          stroke="#ff7300" 
                          name="Variance (giờ)"
                          strokeWidth={3}
                          dot={{ fill: '#ff7300', r: 4, strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 6, strokeWidth: 2 }}
                          animationDuration={1000}
                          animationBegin={400}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Velocity Chart */}
              {chartsData.charts.velocity && chartsData.charts.velocity.length > 0 && (
                <Card 
                  variant="outlined" 
                  sx={{ 
                    mb: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: 6,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Vận tốc hoàn thành
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart 
                        data={chartsData.charts.velocity}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient id="tasksGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.9}/>
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0.5}/>
                          </linearGradient>
                          <linearGradient id="functionsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.9}/>
                            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.5}/>
                          </linearGradient>
                          <linearGradient id="featuresGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ffc658" stopOpacity={0.9}/>
                            <stop offset="95%" stopColor="#ffc658" stopOpacity={0.5}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" opacity={0.3} />
                        <XAxis 
                          dataKey="date"
                          tickFormatter={(value) => {
                            if (period === 'day') return value.split('-')[2];
                            if (period === 'week') return `Tuần ${value}`;
                            return value;
                          }}
                          stroke="#888"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis stroke="#888" style={{ fontSize: '12px' }} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #ccc',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                          }}
                          labelStyle={{ fontWeight: 'bold', color: '#333' }}
                          cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px' }}
                        />
                        <Bar 
                          dataKey="tasks_completed" 
                          fill="url(#tasksGradient)" 
                          name="Tasks hoàn thành"
                          radius={[8, 8, 0, 0]}
                          animationDuration={1000}
                          animationBegin={0}
                        />
                        <Bar 
                          dataKey="functions_completed" 
                          fill="url(#functionsGradient)" 
                          name="Functions hoàn thành"
                          radius={[8, 8, 0, 0]}
                          animationDuration={1000}
                          animationBegin={200}
                        />
                        <Bar 
                          dataKey="features_completed" 
                          fill="url(#featuresGradient)" 
                          name="Features hoàn thành"
                          radius={[8, 8, 0, 0]}
                          animationDuration={1000}
                          animationBegin={400}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Burndown Chart */}
              {chartsData.charts.burndown && chartsData.charts.burndown.length > 0 && (
                <Card 
                  variant="outlined" 
                  sx={{ 
                    mb: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: 6,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Burndown Chart
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart 
                        data={chartsData.charts.burndown}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient id="burndownGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f44336" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#f44336" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" opacity={0.3} />
                        <XAxis 
                          dataKey="date"
                          tickFormatter={(value) => {
                            if (period === 'day') return value.split('-')[2];
                            if (period === 'week') return `Tuần ${value}`;
                            return value;
                          }}
                          stroke="#888"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis stroke="#888" style={{ fontSize: '12px' }} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #ccc',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                          }}
                          labelStyle={{ fontWeight: 'bold', color: '#333' }}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px' }}
                          iconType="line"
                        />
                        <Area
                          type="monotone"
                          dataKey="remaining"
                          stroke="#f44336"
                          fill="url(#burndownGradient)"
                          strokeWidth={3}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="remaining" 
                          stroke="#f44336" 
                          name="Công việc còn lại"
                          strokeWidth={3}
                          dot={{ fill: '#f44336', r: 4, strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 6, strokeWidth: 2 }}
                          animationDuration={1000}
                          animationBegin={0}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="ideal" 
                          stroke="#8884d8" 
                          strokeDasharray="5 5"
                          name="Lý thuyết"
                          strokeWidth={2}
                          dot={false}
                          animationDuration={1000}
                          animationBegin={200}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Completion Trends */}
              {chartsData.charts.completion_trends && chartsData.charts.completion_trends.length > 0 && (
                <Card 
                  variant="outlined" 
                  sx={{ 
                    mb: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: 6,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Xu hướng hoàn thành (Cumulative)
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart 
                        data={chartsData.charts.completion_trends}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" opacity={0.3} />
                        <XAxis 
                          dataKey="date"
                          tickFormatter={(value) => {
                            if (period === 'day') return value.split('-')[2];
                            if (period === 'week') return `Tuần ${value}`;
                            return value;
                          }}
                          stroke="#888"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis stroke="#888" style={{ fontSize: '12px' }} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #ccc',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                          }}
                          labelStyle={{ fontWeight: 'bold', color: '#333' }}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px' }}
                          iconType="line"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="tasks" 
                          stroke="#8884d8" 
                          name="Tasks"
                          strokeWidth={3}
                          dot={{ fill: '#8884d8', r: 4, strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 6, strokeWidth: 2 }}
                          animationDuration={1000}
                          animationBegin={0}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="functions" 
                          stroke="#82ca9d" 
                          name="Functions"
                          strokeWidth={3}
                          dot={{ fill: '#82ca9d', r: 4, strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 6, strokeWidth: 2 }}
                          animationDuration={1000}
                          animationBegin={200}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="features" 
                          stroke="#ffc658" 
                          name="Features"
                          strokeWidth={3}
                          dot={{ fill: '#ffc658', r: 4, strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 6, strokeWidth: 2 }}
                          animationDuration={1000}
                          animationBegin={400}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="milestones" 
                          stroke="#ff7300" 
                          name="Milestones"
                          strokeWidth={3}
                          dot={{ fill: '#ff7300', r: 4, strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 6, strokeWidth: 2 }}
                          animationDuration={1000}
                          animationBegin={600}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Team Performance */}
              {chartsData.charts.team_performance && chartsData.charts.team_performance.length > 0 && (
                <Card 
                  variant="outlined"
                  sx={{
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: 6,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Hiệu suất Team
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart 
                        data={chartsData.charts.team_performance} 
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient id="teamGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.9}/>
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0.5}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" opacity={0.3} />
                        <XAxis 
                          type="number" 
                          domain={[0, 100]} 
                          stroke="#888"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis 
                          dataKey="user_name" 
                          type="category" 
                          width={150}
                          stroke="#888"
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #ccc',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                          }}
                          labelStyle={{ fontWeight: 'bold', color: '#333' }}
                          cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px' }}
                        />
                        <Bar 
                          dataKey="completion_rate" 
                          fill="url(#teamGradient)" 
                          name="Tỷ lệ hoàn thành (%)"
                          radius={[0, 8, 8, 0]}
                          animationDuration={1000}
                          animationBegin={0}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </Paper>
          )}

          {/* Feature Effort Prediction */}
          <Paper variant="outlined" sx={{ p: 3, mt: 4 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              AI Feature Effort Prediction
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', mb: 3 }}>
              Nhập thông tin feature để AI dự đoán effort cần thiết
            </Typography>
            
            <FeatureEffortPredictor projectId={projectId} />
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

