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
  Tooltip,
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
};

export default function ProjectMonitoringPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);

  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [aiPredictions, setAiPredictions] = useState<AIPredictions | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    loadStats();
    loadAIPredictions();
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

  const loadAIPredictions = async () => {
    try {
      setAiLoading(true);
      const response = await axiosInstance.get(`/api/ai/predictions/batch-analysis/${projectId}`);
      setAiPredictions(response.data.data);
    } catch (e: any) {
      console.error('AI Predictions error:', e);
      // Không set error để không ảnh hưởng đến UI chính
    } finally {
      setAiLoading(false);
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
              <Button 
                variant="contained" 
                startIcon={<PsychologyIcon />} 
                onClick={loadAIPredictions}
                disabled={aiLoading}
                color="secondary"
              >
                {aiLoading ? 'Đang phân tích...' : 'AI Predictions'}
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

          {/* AI Predictions Section */}
          {aiPredictions && (
            <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <PsychologyIcon color="secondary" />
                <Typography variant="h6" fontWeight="bold">
                  AI Predictions & Analysis
                </Typography>
                <Chip 
                  label={`Risk Score: ${aiPredictions.overallRiskScore}%`} 
                  color={aiPredictions.overallRiskScore > 70 ? 'error' : aiPredictions.overallRiskScore > 40 ? 'warning' : 'success'}
                  size="small"
                />
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
                        <Typography variant="body2" color="text.secondary">
                          Confidence: {Math.round(aiPredictions.projectProgress.confidence * 100)}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={aiPredictions.projectProgress.prediction} 
                        sx={{ mb: 2 }}
                      />
                      <Typography variant="body2" color="text.secondary">
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
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
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
                          <Typography variant="body2" color="text.secondary">
                            Không có task nào có rủi ro cao
                          </Typography>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
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

          {/* Feature Effort Prediction */}
          <Paper variant="outlined" sx={{ p: 3, mt: 4 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              AI Feature Effort Prediction
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
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

