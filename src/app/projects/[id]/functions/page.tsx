"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "../../../../../ultis/axios";
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
  Card,
  CardContent,
  InputAdornment,
  Tooltip,
  Alert,
  Menu,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import FunctionsIcon from "@mui/icons-material/Functions";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

type Setting = {
  _id: string;
  name: string;
  value?: string;
};

type Feature = {
  _id: string;
  title: string;
  project_id: string;
  estimated_hours?: number;
};

type FunctionType = {
  _id: string;
  title: string;
  feature_id?: Feature | string;
  complexity_id?: Setting | string;
  status?: Setting | string;
  pipeline_id?: Setting | string;
  project_id: string;
  estimated_effort: number;
  actual_effort: number;
  description?: string;
  start_date?: string;
  deadline?: string;
  createAt?: string;
  updateAt?: string;
};

type FunctionStats = {
  total: number;
  completed: number;
  in_progress: number;
  pending: number;
  overdue: number;
  completion_rate: number;
};

export default function ProjectFunctionsPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);

  const [functions, setFunctions] = useState<FunctionType[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [complexityTypes, setComplexityTypes] = useState<Setting[]>([]);
  const [statusTypes, setStatusTypes] = useState<Setting[]>([]);
  const [stats, setStats] = useState<FunctionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingFunction, setEditingFunction] = useState<FunctionType | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterFeature, setFilterFeature] = useState<string>("all");

  const [functionForm, setFunctionForm] = useState({
    title: "",
    description: "",
    estimated_effort: 0,
    complexity_id: "",
    status: "",
    feature_id: "",
    pipeline_id: "",
    start_date: "",
    deadline: "",
  });

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFunction, setSelectedFunction] = useState<FunctionType | null>(null);
  
  // Effort validation warnings
  const [effortWarnings, setEffortWarnings] = useState<{[featureId: string]: any}>({});
  
  // Get effort validation for selected feature
  const getEffortValidation = (featureId: string, effort: number) => {
    if (!featureId || !effort) return null;
    
    const feature = features.find(f => f._id === featureId);
    if (!feature || !feature.estimated_hours) return null;
    
    const currentFunctions = functions.filter(f => 
      typeof f.feature_id === 'object' ? f.feature_id?._id === featureId : f.feature_id === featureId
    );
    
    const otherFunctionsEffort = currentFunctions
      .filter(f => editingFunction ? f._id !== editingFunction._id : true)
      .reduce((sum, f) => sum + (f.estimated_effort || 0), 0);
    
    const newTotalEffort = otherFunctionsEffort + effort;
    const featureEffort = feature.estimated_hours;
    
    if (newTotalEffort > featureEffort) {
      return {
        valid: false,
        feature_title: feature.title,
        feature_effort: featureEffort,
        other_functions_effort: otherFunctionsEffort,
        new_function_effort: effort,
        new_total_effort: newTotalEffort,
        overflow: newTotalEffort - featureEffort
      };
    }
    
    return { valid: true };
  };

  useEffect(() => {
    if (!projectId) return;
    loadAllData();
  }, [projectId]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [functionsRes, featuresRes, statsRes, allSettingsRes] = await Promise.all([
        axiosInstance.get(`/api/projects/${projectId}/functions`),
        axiosInstance.get(`/api/projects/${projectId}/features`),
        axiosInstance.get(`/api/projects/${projectId}/functions/stats`),
        axiosInstance.get(`/api/settings`).catch(() => ({ data: [] })),
      ]);
      
      const allSettings = allSettingsRes.data || [];
      const complexitySettings = allSettings.filter((s: any) => s.type_id === 1);
      const statusSettings = allSettings.filter((s: any) => s.type_id === 2);
      
      setFunctions(functionsRes.data || []);
      setFeatures(featuresRes.data || []);
      setStats(statsRes.data);
      setComplexityTypes(complexitySettings);
      setStatusTypes(statusSettings);
      
      // Calculate effort warnings
      calculateEffortWarnings(functionsRes.data || [], featuresRes.data || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  // Calculate effort warnings for features
  const calculateEffortWarnings = (functionsData: FunctionType[], featuresData: Feature[]) => {
    const warnings: {[featureId: string]: any} = {};
    
    featuresData.forEach(feature => {
      const featureFunctions = functionsData.filter(f => 
        typeof f.feature_id === 'object' ? f.feature_id?._id === feature._id : f.feature_id === feature._id
      );
      
      const totalFunctionEffort = featureFunctions.reduce((sum, f) => sum + (f.estimated_effort || 0), 0);
      const featureEffort = feature.estimated_hours || 0;
      
      if (featureEffort > 0 && totalFunctionEffort > featureEffort) {
        warnings[feature._id] = {
          feature_title: feature.title,
          feature_effort: featureEffort,
          functions_effort: totalFunctionEffort,
          overflow: totalFunctionEffort - featureEffort,
          percentage: Math.round((totalFunctionEffort / featureEffort) * 100)
        };
      }
    });
    
    setEffortWarnings(warnings);
  };

  const handleOpenDialog = (func?: FunctionType) => {
    if (func) {
      setEditingFunction(func);
      setFunctionForm({
        title: func.title,
        description: func.description || "",
        estimated_effort: func.estimated_effort,
        complexity_id: typeof func.complexity_id === "object" ? func.complexity_id?._id : func.complexity_id || "",
        status: typeof func.status === "object" ? func.status?._id : func.status || "",
        feature_id: typeof func.feature_id === "object" ? func.feature_id?._id : func.feature_id || "",
        pipeline_id: typeof func.pipeline_id === "object" ? func.pipeline_id?._id : func.pipeline_id || "",
        start_date: func.start_date ? new Date(func.start_date).toISOString().split('T')[0] : "",
        deadline: func.deadline ? new Date(func.deadline).toISOString().split('T')[0] : "",
      });
    } else {
      setEditingFunction(null);
      setFunctionForm({
        title: "",
        description: "",
        estimated_effort: 0,
        complexity_id: "",
        status: "",
        feature_id: "",
        pipeline_id: "",
        start_date: "",
        deadline: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingFunction(null);
  };

  const handleSaveFunction = async () => {
    try {
      const payload = {
        ...functionForm,
        estimated_effort: Number(functionForm.estimated_effort),
        feature_id: functionForm.feature_id || undefined,
        complexity_id: functionForm.complexity_id || undefined,
        status: functionForm.status || undefined,
        pipeline_id: functionForm.pipeline_id || undefined,
        start_date: functionForm.start_date || undefined,
        deadline: functionForm.deadline || undefined,
      };

      if (editingFunction) {
        await axiosInstance.patch(`/api/functions/${editingFunction._id}`, payload);
      } else {
        await axiosInstance.post(`/api/projects/${projectId}/functions`, payload);
      }
      
      handleCloseDialog();
      loadAllData();
    } catch (e: any) {
      const errorData = e?.response?.data;
      let errorMessage = errorData?.message || "Không thể lưu function";
      
      // Handle effort exceeded error
      if (errorData?.error === 'EFFORT_EXCEEDED') {
        errorMessage = `${errorMessage}\n\n💡 ${errorData.suggestion}`;
        if (errorData.details) {
          errorMessage += `\n\nChi tiết: Feature (${errorData.details.feature_effort}h) < Functions (${errorData.details.new_total_effort}h)`;
        }
      }
      
      setError(errorMessage);
    }
  };

  const handleDeleteFunction = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa function này?")) return;
    try {
      await axiosInstance.delete(`/api/functions/${id}`);
      loadAllData();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Không thể xóa function");
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await axiosInstance.patch(`/api/functions/${id}`, { status });
      loadAllData();
      handleMenuClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Không thể cập nhật status");
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, func: FunctionType) => {
    setAnchorEl(event.currentTarget);
    setSelectedFunction(func);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedFunction(null);
  };

  const filteredFunctions = useMemo(() => {
    return functions.filter((func) => {
      const matchSearch = func.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         func.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const funcStatusId = typeof func.status === "object" ? func.status?._id : func.status;
      const matchStatus = filterStatus === "all" || funcStatusId === filterStatus;
      const matchFeature = filterFeature === "all" || 
                          (typeof func.feature_id === "object" ? func.feature_id?._id : func.feature_id) === filterFeature;
      return matchSearch && matchStatus && matchFeature;
    });
  }, [functions, searchTerm, filterStatus, filterFeature]);

  const getStatusColor = (statusName: string) => {
    const colors: any = {
      'Pending': '#9ca3af',
      'In Progress': '#f59e0b',
      'Completed': '#22c55e',
      'Overdue': '#ef4444',
      'To Do': '#6b7280',
      'Done': '#10b981',
    };
    return colors[statusName] || '#3b82f6';
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
                  Quản lý Functions
                </Typography>
                <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FunctionsIcon /> Functions
                </Typography>
              </div>
            </div>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                onClick={() => router.push(`/projects/${projectId}/features`)}
              >
                Features
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Tạo Function
              </Button>
            </Stack>
          </div>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Statistics Cards */}
          {stats && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' }, gap: 2, mb: 4 }}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Tổng số
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Functions
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Hoàn thành
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {stats.completed}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats.completion_rate}%
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Đang làm
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {stats.in_progress}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    In Progress
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Chưa bắt đầu
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="info.main">
                    {stats.pending}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Quá hạn
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="error.main">
                    {stats.overdue}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overdue
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                <CardContent>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    <TrendingUpIcon fontSize="small" /> Tỷ lệ hoàn thành
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.completion_rate}%
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Completion Rate
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Effort Validation Warnings */}
          {Object.keys(effortWarnings).length > 0 && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                ⚠️ Effort Overflow Warning
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                Các features sau có tổng effort của functions vượt quá effort của feature:
              </Typography>
              {Object.entries(effortWarnings).map(([featureId, warning]) => (
                <Typography key={featureId} variant="caption" sx={{ display: 'block', ml: 2 }}>
                  • <strong>{warning.feature_title}</strong>: Functions ({warning.functions_effort}h) &gt; Feature ({warning.feature_effort}h) 
                  <span style={{ color: '#d32f2f', fontWeight: 600 }}> (+{warning.overflow}h, {warning.percentage}%)</span>
                </Typography>
              ))}
              <Typography variant="caption" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
                💡 Suggestion: Giảm effort của functions hoặc tăng effort của features
              </Typography>
            </Alert>
          )}

          {/* Filters */}
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                placeholder="Tìm kiếm function..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                sx={{ flex: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={filterStatus}
                  label="Trạng thái"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  {statusTypes.map((status) => (
                    <MenuItem key={status._id} value={status._id}>
                      {status.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Feature</InputLabel>
                <Select
                  value={filterFeature}
                  label="Feature"
                  onChange={(e) => setFilterFeature(e.target.value)}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  {features.map((feature) => (
                    <MenuItem key={feature._id} value={feature._id}>
                      {feature.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Paper>

          {/* Functions Table */}
          <Paper variant="outlined">
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Tên Function</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Feature</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Complexity</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Trạng thái</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Effort (giờ)</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Actual (giờ)</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Tiến độ</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Deadline</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredFunctions.map((func) => {
                    const progress = func.estimated_effort > 0 
                      ? Math.min(100, Math.round((func.actual_effort / func.estimated_effort) * 100))
                      : 0;
                    const featureName = typeof func.feature_id === "object" ? func.feature_id?.title : "-";
                    const complexityName = typeof func.complexity_id === "object" ? func.complexity_id?.name : "-";
                    const statusName = typeof func.status === "object" ? func.status?.name : "-";
                    
                    return (
                      <TableRow key={func._id} hover>
                        <TableCell>
                          <Typography fontWeight="medium">{func.title}</Typography>
                          {func.description && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {func.description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {featureName !== "-" ? (
                            <Chip label={featureName} size="small" variant="outlined" />
                          ) : (
                            <Typography variant="body2" color="text.secondary">—</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip label={complexityName} size="small" color="primary" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={statusName}
                            size="small"
                            sx={{
                              bgcolor: getStatusColor(statusName),
                              color: "#fff",
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {func.estimated_effort}h
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} color={func.actual_effort > func.estimated_effort ? "error.main" : "text.primary"}>
                            {func.actual_effort}h
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 80 }}>
                              <Typography variant="caption">{progress}%</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {func.deadline ? (
                            <Typography variant="body2">
                              {new Date(func.deadline).toLocaleDateString('vi-VN')}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">—</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuClick(e, func)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredFunctions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                          Không tìm thấy function nào. Bấm "Tạo Function" để thêm mới.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          </Paper>

          {/* Action Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => {
              if (selectedFunction) handleOpenDialog(selectedFunction);
            }}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} /> Chỉnh sửa
            </MenuItem>
            <Divider />
            {statusTypes.map((status) => (
              <MenuItem 
                key={status._id}
                onClick={() => {
                  if (selectedFunction) handleUpdateStatus(selectedFunction._id, status._id);
                }}
              >
                Chuyển sang {status.name}
              </MenuItem>
            ))}
            <Divider />
            <MenuItem 
              onClick={() => {
                if (selectedFunction) handleDeleteFunction(selectedFunction._id);
              }}
              sx={{ color: 'error.main' }}
            >
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Xóa
            </MenuItem>
          </Menu>

          {/* Function Dialog */}
          <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold' }}>
              {editingFunction ? "Chỉnh sửa Function" : "Tạo Function mới"}
            </DialogTitle>
            <DialogContent>
              <Stack spacing={3} sx={{ mt: 2 }}>
                <TextField
                  label="Tên Function *"
                  value={functionForm.title}
                  onChange={(e) => setFunctionForm({ ...functionForm, title: e.target.value })}
                  fullWidth
                  placeholder="VD: User Login API"
                />
                
                <TextField
                  label="Mô tả"
                  value={functionForm.description}
                  onChange={(e) => setFunctionForm({ ...functionForm, description: e.target.value })}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Mô tả chi tiết về function..."
                />

                <Stack direction="row" spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel>Feature</InputLabel>
                    <Select
                      value={functionForm.feature_id}
                      label="Feature"
                      onChange={(e) => setFunctionForm({ ...functionForm, feature_id: e.target.value })}
                    >
                      <MenuItem value="">
                        <em>Không chọn</em>
                      </MenuItem>
                      {features.map((feature) => (
                        <MenuItem key={feature._id} value={feature._id}>
                          {feature.title}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth required>
                    <InputLabel>Complexity *</InputLabel>
                    <Select
                      value={functionForm.complexity_id}
                      label="Complexity *"
                      onChange={(e) => setFunctionForm({ ...functionForm, complexity_id: e.target.value })}
                    >
                      {complexityTypes.map((complexity) => (
                        <MenuItem key={complexity._id} value={complexity._id}>
                          {complexity.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth required>
                    <InputLabel>Status *</InputLabel>
                    <Select
                      value={functionForm.status}
                      label="Status *"
                      onChange={(e) => setFunctionForm({ ...functionForm, status: e.target.value })}
                    >
                      {statusTypes.map((status) => (
                        <MenuItem key={status._id} value={status._id}>
                          {status.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>

                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Estimated Effort (giờ) *"
                    type="number"
                    value={functionForm.estimated_effort}
                    onChange={(e) => setFunctionForm({ ...functionForm, estimated_effort: Number(e.target.value) })}
                    fullWidth
                    placeholder="VD: 8"
                    error={(() => {
                      const validation = getEffortValidation(functionForm.feature_id, functionForm.estimated_effort);
                      return validation ? !validation.valid : false;
                    })()}
                    helperText={(() => {
                      const validation = getEffortValidation(functionForm.feature_id, functionForm.estimated_effort);
                      if (validation && !validation.valid) {
                        return `⚠️ Vượt quá effort của feature "${validation.feature_title}" (${validation.feature_effort}h). Tổng sẽ là ${validation.new_total_effort}h (+${validation.overflow}h)`;
                      }
                      return '';
                    })()}
                  />
                  <TextField
                    label="Start Date"
                    type="date"
                    value={functionForm.start_date}
                    onChange={(e) => setFunctionForm({ ...functionForm, start_date: e.target.value })}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    label="Deadline"
                    type="date"
                    value={functionForm.deadline}
                    onChange={(e) => setFunctionForm({ ...functionForm, deadline: e.target.value })}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Stack>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Hủy</Button>
              <Button 
                variant="contained" 
                onClick={handleSaveFunction}
                disabled={!functionForm.title || !functionForm.complexity_id || !functionForm.status}
              >
                {editingFunction ? "Cập nhật" : "Tạo"}
              </Button>
            </DialogActions>
          </Dialog>
        </div>
      </main>
    </div>
  );
}

