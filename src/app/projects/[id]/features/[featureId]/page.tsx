"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "../../../../../../ultis/axios";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Paper,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  LinearProgress,
  Card,
  CardContent,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CalculateIcon from "@mui/icons-material/Calculate";

type Feature = {
  _id: string;
  title: string;
  description?: string;
  project_id: string;
  status_id?: Setting | string;
  priority_id?: Setting | string;
  complexity_id?: Setting | string;
  estimated_hours?: number;
  actual_effort?: number;
  start_date?: string;
  due_date?: string;
};

type Setting = {
  _id: string;
  name: string;
  value?: string;
};

type FunctionType = {
  _id: string;
  title: string;
  feature_id: string;
  complexity_id?: Setting | string;
  estimated_effort: number;
  actual_effort: number;
  status: Setting | string;
  description?: string;
  start_date?: string;
  deadline?: string;
};

type Task = {
  _id: string;
  title: string;
  feature_id: string;
  assignee_id?: any;
  assigner_id?: any;
  status: Setting | string;
  description?: string;
  deadline?: string;
};

export default function FeatureBreakdownPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);
  const featureId = Array.isArray(params?.featureId) ? params?.featureId[0] : (params?.featureId as string);

  const [feature, setFeature] = useState<Feature | null>(null);
  const [functions, setFunctions] = useState<FunctionType[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openFunctionDialog, setOpenFunctionDialog] = useState(false);
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [openFunctionDetailDialog, setOpenFunctionDetailDialog] = useState(false);
  const [selectedFunction, setSelectedFunction] = useState<FunctionType | null>(null);

  const [functionForm, setFunctionForm] = useState({
    title: "",
    description: "",
    estimated_effort: 0,
    type_id: "",
  });

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    deadline: "",
    assignee_id: "",
    assigner_id: "",
    type_id: "",
  });

  useEffect(() => {
    if (!featureId) return;
    loadFeatureBreakdown();
  }, [featureId]);

  const loadFeatureBreakdown = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/api/features/${featureId}/breakdown`);
      setFeature(res.data.feature);
      setFunctions(res.data.functions || []);
      setTasks(res.data.tasks || []);
      setStats(res.data.stats);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFunction = async () => {
    try {
      await axiosInstance.post(`/api/projects/${projectId}/functions`, {
        ...functionForm,
        feature_id: featureId,
        project_id: projectId,
      });
      setOpenFunctionDialog(false);
      setFunctionForm({ title: "", description: "", estimated_effort: 0, type_id: "" });
      loadFeatureBreakdown();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Không thể tạo function");
    }
  };

  const handleCreateTask = async () => {
    try {
      await axiosInstance.post(`/api/projects/${projectId}/tasks`, {
        ...taskForm,
        feature_id: featureId,
      });
      setOpenTaskDialog(false);
      setTaskForm({ title: "", description: "", deadline: "", assignee_id: "", assigner_id: "", type_id: "" });
      loadFeatureBreakdown();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Không thể tạo task");
    }
  };

  const handleDeleteFunction = async (id: string) => {
    if (!confirm("Xóa function này?")) return;
    try {
      await axiosInstance.delete(`/api/functions/${id}`);
      loadFeatureBreakdown();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Không thể xóa function");
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Xóa task này?")) return;
    try {
      await axiosInstance.delete(`/api/tasks/${id}`);
      loadFeatureBreakdown();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Không thể xóa task");
    }
  };

  const handleRecalculateEffort = async () => {
    try {
      await axiosInstance.post(`/api/features/${featureId}/calculate-effort`);
      loadFeatureBreakdown();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Không thể tính toán effort");
    }
  };

  const handleOpenFunctionDetail = async (functionId: string) => {
    try {
      const res = await axiosInstance.get(`/api/functions/${functionId}`);
      setSelectedFunction(res.data);
      setOpenFunctionDetailDialog(true);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Không thể tải chi tiết function");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      'Pending': '#9ca3af',
      'In Progress': '#f59e0b',
      'Completed': '#22c55e',
      'Overdue': '#ef4444',
      'planning': '#3b82f6',
      'in-progress': '#f59e0b',
      'testing': '#8b5cf6',
      'completed': '#22c55e',
      'cancelled': '#6b7280',
    };
    return colors[status] || '#3b82f6';
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
                  Feature Breakdown
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {feature?.title}
                </Typography>
                {feature?.description && (
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                )}
              </div>
            </div>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<CalculateIcon />}
                onClick={handleRecalculateEffort}
              >
                Tính toán Effort
              </Button>
            </Stack>
          </div>

          {error && (
            <Paper sx={{ p: 2, mb: 3, bgcolor: "error.light", color: "error.contrastText" }}>
              {error}
            </Paper>
          )}

          {/* Statistics Cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' }, gap: 3, mb: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  Tiến độ
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {stats?.progress_percentage || 0}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={stats?.progress_percentage || 0}
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  Estimated Hours
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {stats?.feature_estimated_hours || 0}h
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Feature estimate
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  Actual Effort
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {stats?.feature_actual_effort || 0}h
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Feature actual
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  Functions
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {stats?.completed_functions || 0}/{stats?.total_functions || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Hoàn thành
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  Tasks
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {stats?.completed_tasks || 0}/{stats?.total_tasks || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Hoàn thành
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Functions Section */}
          <Paper variant="outlined" sx={{ mb: 3 }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" fontWeight="bold">
                  Functions ({functions.length})
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenFunctionDialog(true)}
                >
                  Thêm Function
                </Button>
              </Stack>
            </Box>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tên</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Effort (giờ)</TableCell>
                  <TableCell>Actual (giờ)</TableCell>
                  <TableCell>Deadline</TableCell>
                  <TableCell>Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {functions.map((fn) => (
                  <TableRow key={fn._id} hover>
                    <TableCell 
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { 
                          bgcolor: 'action.hover' 
                        }
                      }}
                      onClick={() => handleOpenFunctionDetail(fn._id)}
                    >
                      <Typography 
                        fontWeight="medium" 
                        sx={{ 
                          color: 'primary.main',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        {fn.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {fn.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const statusName = typeof fn.status === 'object' ? fn.status?.name : fn.status;
                        return (
                          <Chip
                            label={statusName || '-'}
                            size="small"
                            sx={{
                              bgcolor: getStatusColor(statusName || ''),
                              color: "#fff",
                              fontWeight: 600,
                            }}
                          />
                        );
                      })()}
                    </TableCell>
                    <TableCell>{fn.estimated_effort}</TableCell>
                    <TableCell>{fn.actual_effort}</TableCell>
                    <TableCell>
                      {fn.deadline ? new Date(fn.deadline).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleDeleteFunction(fn._id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {functions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Chưa có function. Bấm "Thêm Function" để tạo.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>

          {/* Tasks Section */}
          <Paper variant="outlined">
            <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" fontWeight="bold">
                  Tasks ({tasks.length})
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenTaskDialog(true)}
                >
                  Thêm Task
                </Button>
              </Stack>
            </Box>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tên</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Người thực hiện</TableCell>
                  <TableCell>Deadline</TableCell>
                  <TableCell>Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task._id}>
                    <TableCell>
                      <Typography fontWeight="medium">{task.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {task.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const statusName = typeof task.status === 'object' ? task.status?.name : task.status;
                        return (
                          <Chip
                            label={statusName || '-'}
                            size="small"
                            sx={{
                              bgcolor: getStatusColor(statusName || ''),
                              color: "#fff",
                              fontWeight: 600,
                            }}
                          />
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {task.assignee_id?.full_name || "-"}
                    </TableCell>
                    <TableCell>
                      {task.deadline ? new Date(task.deadline).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleDeleteTask(task._id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {tasks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Chưa có task. Bấm "Thêm Task" để tạo.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>

          {/* Function Dialog */}
          <Dialog open={openFunctionDialog} onClose={() => setOpenFunctionDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Thêm Function</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField
                  label="Tên Function"
                  value={functionForm.title}
                  onChange={(e) => setFunctionForm({ ...functionForm, title: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Mô tả"
                  value={functionForm.description}
                  onChange={(e) => setFunctionForm({ ...functionForm, description: e.target.value })}
                  fullWidth
                  multiline
                  rows={3}
                />
                <TextField
                  label="Estimated Effort (giờ)"
                  type="number"
                  value={functionForm.estimated_effort}
                  onChange={(e) => setFunctionForm({ ...functionForm, estimated_effort: Number(e.target.value) })}
                  fullWidth
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenFunctionDialog(false)}>Hủy</Button>
              <Button variant="contained" onClick={handleCreateFunction}>
                Tạo
              </Button>
            </DialogActions>
          </Dialog>

          {/* Task Dialog */}
          <Dialog open={openTaskDialog} onClose={() => setOpenTaskDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Thêm Task</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField
                  label="Tên Task"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Mô tả"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  fullWidth
                  multiline
                  rows={3}
                />
                <TextField
                  label="Deadline"
                  type="date"
                  value={taskForm.deadline}
                  onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenTaskDialog(false)}>Hủy</Button>
              <Button variant="contained" onClick={handleCreateTask}>
                Tạo
              </Button>
            </DialogActions>
          </Dialog>

          {/* Function Detail Dialog */}
          <Dialog 
            open={openFunctionDetailDialog} 
            onClose={() => {
              setOpenFunctionDetailDialog(false);
              setSelectedFunction(null);
            }} 
            maxWidth="md" 
            fullWidth
          >
            <DialogTitle sx={{ fontWeight: 'bold' }}>
              Chi tiết Function
            </DialogTitle>
            <DialogContent>
              {selectedFunction && (
                <Stack spacing={3} sx={{ mt: 1 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                      Tên Function
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {selectedFunction.title}
                    </Typography>
                  </Box>

                  {selectedFunction.description && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                        Mô tả
                      </Typography>
                      <Typography variant="body1">
                        {selectedFunction.description}
                      </Typography>
                    </Box>
                  )}

                  <Stack direction="row" spacing={3}>
                    <Box flex={1}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                        Trạng thái
                      </Typography>
                      <Chip
                        label={selectedFunction.status}
                        size="medium"
                        sx={{
                          bgcolor: getStatusColor(selectedFunction.status),
                          color: "#fff",
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                    <Box flex={1}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                        Type
                      </Typography>
                      <Chip
                        label={typeof selectedFunction.type_id === 'object' ? selectedFunction.type_id?.name : '-'}
                        size="medium"
                        color="primary"
                      />
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={3}>
                    <Box flex={1}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                        Estimated Effort
                      </Typography>
                      <Typography variant="h6" fontWeight={600}>
                        {selectedFunction.estimated_effort} giờ
                      </Typography>
                    </Box>
                    <Box flex={1}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                        Actual Effort
                      </Typography>
                      <Typography variant="h6" fontWeight={600} color={selectedFunction.actual_effort > selectedFunction.estimated_effort ? "error.main" : "text.primary"}>
                        {selectedFunction.actual_effort} giờ
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={3}>
                    <Box flex={1}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                        Start Date
                      </Typography>
                      <Typography variant="body1">
                        {selectedFunction.start_date ? new Date(selectedFunction.start_date).toLocaleDateString('vi-VN') : '—'}
                      </Typography>
                    </Box>
                    <Box flex={1}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                        Deadline
                      </Typography>
                      <Typography variant="body1">
                        {selectedFunction.deadline ? new Date(selectedFunction.deadline).toLocaleDateString('vi-VN') : '—'}
                      </Typography>
                    </Box>
                  </Stack>

                  <Divider />

                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                      Tiến độ
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={selectedFunction.estimated_effort > 0 
                          ? Math.min(100, Math.round((selectedFunction.actual_effort / selectedFunction.estimated_effort) * 100))
                          : 0
                        }
                        sx={{ flex: 1, height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="body2" fontWeight={600}>
                        {selectedFunction.estimated_effort > 0 
                          ? Math.min(100, Math.round((selectedFunction.actual_effort / selectedFunction.estimated_effort) * 100))
                          : 0
                        }%
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setOpenFunctionDetailDialog(false);
                setSelectedFunction(null);
              }}>
                Đóng
              </Button>
            </DialogActions>
          </Dialog>
        </div>
      </main>
    </div>
  );
}

