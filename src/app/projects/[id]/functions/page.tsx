"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
import TuneIcon from "@mui/icons-material/Tune";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import BugReportIcon from "@mui/icons-material/BugReport";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Badge from "@mui/material/Badge";
import Popover from "@mui/material/Popover";
import ProjectBreadcrumb from "@/components/ProjectBreadcrumb";

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
  const searchParams = useSearchParams();
  const projectId = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);
  const featureIdFromUrl = searchParams.get('featureId');

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
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLButtonElement | null>(null);

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

  // Inline editing states
  const [editingCell, setEditingCell] = useState<{funcId: string, field: string} | null>(null);
  const [editValue, setEditValue] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  // Auto-filter by feature when featureId is in URL
  useEffect(() => {
    if (featureIdFromUrl && features.length > 0) {
      const featureExists = features.some(f => f._id === featureIdFromUrl);
      if (featureExists) {
        setFilterFeature(featureIdFromUrl);
      }
    }
  }, [featureIdFromUrl, features]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [functionsRes, featuresRes, statsRes, allSettingsRes] = await Promise.all([
        axiosInstance.get(`/api/projects/${projectId}/functions`),
        axiosInstance.get(`/api/projects/${projectId}/features`),
        axiosInstance.get(`/api/projects/${projectId}/functions/stats`),
        axiosInstance.get(`/api/settings`).catch(() => ({ data: [] })),
      ]);
      console.log(allSettingsRes.data);
      const allSettings = allSettingsRes.data || [];
      const complexitySettings = allSettings.filter((s: any) => s.type_id === 1);
      console.log(complexitySettings);
      const statusSettings = allSettings.filter((s: any) => s.type_id === 2);

      const rawFunctions = functionsRes?.data;
      const normalizedFunctions = Array.isArray(rawFunctions)
        ? rawFunctions
        : Array.isArray(rawFunctions?.data)
          ? rawFunctions.data
          : Array.isArray(rawFunctions?.functions)
            ? rawFunctions.functions
            : [];

      const rawFeatures = featuresRes?.data;
      const normalizedFeatures = Array.isArray(rawFeatures)
        ? rawFeatures
        : Array.isArray(rawFeatures?.data)
          ? rawFeatures.data
          : Array.isArray(rawFeatures?.features)
            ? rawFeatures.features
            : [];

      setFunctions(normalizedFunctions);
      setFeatures(normalizedFeatures);
      setStats(statsRes.data);
      setComplexityTypes(complexitySettings);
      setStatusTypes(statusSettings);
      
      // Calculate effort warnings
      calculateEffortWarnings(normalizedFunctions, normalizedFeatures);
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

  // Inline editing handlers
  const startEdit = (funcId: string, field: string, currentValue: any) => {
    setEditingCell({ funcId, field });
    setEditValue(currentValue);
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue(null);
  };

  const saveInlineEdit = async (funcId: string, field: string) => {
    // Prevent double-save
    if (isSaving) return;
    
    try {
      // Don't save if value is empty or null (except for optional fields like deadline)
      if (!editValue && field !== 'deadline' && field !== 'description') {
        cancelEdit();
        return;
      }

      setIsSaving(true);
      const updateData: any = {};
      updateData[field] = editValue;
      
      await axiosInstance.patch(`/api/functions/${funcId}`, updateData);
      
      // Reload data to get fresh data with populated fields
      await loadAllData();
      
      cancelEdit();
    } catch (e: any) {
      setError(e?.response?.data?.message || `Không thể cập nhật ${field}`);
      cancelEdit();
    } finally {
      setIsSaving(false);
    }
  };

  // Get icon and color for status
  const getStatusIconAndColor = (statusName: string) => {
    const name = statusName?.toLowerCase() || '';
    if (name.includes('planning')) return { icon: <HourglassEmptyIcon fontSize="small" />, color: '#f59e0b', bg: '#fef3c7' };
    if (name.includes('progress') || name.includes('doing')) return { icon: <PlayArrowIcon fontSize="small" />, color: '#3b82f6', bg: '#dbeafe' };
    if (name.includes('testing') || name.includes('test')) return { icon: <BugReportIcon fontSize="small" />, color: '#8b5cf6', bg: '#ede9fe' };
    if (name.includes('completed') || name.includes('done')) return { icon: <CheckCircleIcon fontSize="small" />, color: '#10b981', bg: '#d1fae5' };
    if (name.includes('cancelled') || name.includes('cancel')) return { icon: <CancelIcon fontSize="small" />, color: '#ef4444', bg: '#fee2e2' };
    if (name.includes('hold') || name.includes('pause')) return { icon: <PauseCircleIcon fontSize="small" />, color: '#6b7280', bg: '#f3f4f6' };
    return { icon: <ArrowForwardIcon fontSize="small" />, color: '#6b7280', bg: '#f3f4f6' };
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

  // Resolve display names when API returns only IDs
  const resolveFeatureTitle = (func: FunctionType) => {
    if (typeof func.feature_id === "object") return func.feature_id?.title || "-";
    if (!func.feature_id) return "-";
    const match = features.find((f) => f._id === func.feature_id);
    return match?.title || "-";
  };

  const resolveComplexityName = (func: FunctionType) => {
    if (typeof func.complexity_id === "object") return func.complexity_id?.name || "-";
    if (!func.complexity_id) return "-";
    const target = String(func.complexity_id);
    const match = complexityTypes.find((c) =>
      String((c as any)?._id) === target ||
      String((c as any)?.value) === target ||
      String((c as any)?.name) === target
    );
    return (match as any)?.name || "-";
  };

  const resolveStatusName = (func: FunctionType) => {
    if (typeof func.status === "object") return func.status?.name || "-";
    if (!func.status) return "-";
    const target = String(func.status);
    const match = statusTypes.find((s) =>
      String((s as any)?._id) === target ||
      String((s as any)?.value) === target ||
      String((s as any)?.name) === target
    );
    return (match as any)?.name || "-";
  };

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
          {/* Modern Header */}
          <Box sx={{ mb: 3 }}>
            <ProjectBreadcrumb 
              projectId={projectId} 
              items={[
                { label: 'Functions', active: true }
              ]} 
            />
            
            <Box sx={{ 
              bgcolor: 'white', 
              borderRadius: 3,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #e8e9eb',
              mb: 3
            }}>
              <Box sx={{ 
                px: 3, 
                py: 2.5, 
                borderBottom: '1px solid #e8e9eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                flexWrap: 'wrap'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2.5,
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)',
                  }}>
                    <FunctionsIcon sx={{ fontSize: 28, color: 'white' }} />
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#1f2937', mb: 0.5 }}>
                      Functions
                </Typography>
                    <Typography variant="body2" sx={{ color: '#6b7280' }}>
                      Quản lý các function trong dự án
                </Typography>
                  </Box>
                </Box>

                <Stack direction="row" spacing={1.5} alignItems="center">
              <Button
                variant="outlined"
                    size="small"
                onClick={() => router.push(`/projects/${projectId}/features`)}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '13px',
                      borderColor: '#e2e8f0',
                      borderWidth: '1.5px',
                      color: '#49516f',
                      height: 36,
                      px: 2,
                      borderRadius: 2.5,
                      '&:hover': {
                        borderColor: '#7b68ee',
                        bgcolor: '#f9fafb',
                      }
                    }}
              >
                Features
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '13px',
                      background: 'linear-gradient(135deg, #7b68ee, #9b59b6)',
                      height: 36,
                      px: 2.5,
                      borderRadius: 2.5,
                      boxShadow: '0 4px 12px rgba(123, 104, 238, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #6b5dd6, #8b49a6)',
                        boxShadow: '0 6px 16px rgba(123, 104, 238, 0.4)',
                        transform: 'translateY(-1px)',
                      },
                      transition: 'all 0.2s ease',
                    }}
              >
                Tạo Function
              </Button>
            </Stack>
              </Box>

              {/* Toolbar with Search and Filters */}
              <Box sx={{ 
                px: 3, 
                py: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                flexWrap: 'wrap',
              }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
                  <TextField
                    placeholder="Quick search functions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    size="small"
                    sx={{ 
                      width: 250,
                      '& .MuiOutlinedInput-root': { 
                        fontSize: '13px',
                        borderRadius: 2,
                        bgcolor: '#f8f9fb',
                        height: 36,
                        '& fieldset': { borderColor: 'transparent' },
                        '&:hover': { 
                          bgcolor: '#f3f4f6',
                          '& fieldset': { borderColor: '#e8e9eb' }
                        },
                        '&.Mui-focused': { 
                          bgcolor: 'white',
                          '& fieldset': { borderColor: '#7b68ee', borderWidth: '2px' }
                        }
                      } 
                    }}
                    InputProps={{ 
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ fontSize: 16, color: '#9ca3af' }} />
                        </InputAdornment>
                      ) 
                    }}
                  />

                  <Badge 
                    badgeContent={[filterStatus !== 'all', filterFeature !== 'all', searchTerm].filter(Boolean).length || 0}
                    color="primary"
                    sx={{
                      '& .MuiBadge-badge': {
                        background: 'linear-gradient(135deg, #7b68ee, #9b59b6)',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '10px',
                        boxShadow: '0 2px 8px rgba(123, 104, 238, 0.3)',
                        border: '2px solid white',
                      }
                    }}
                  >
                    <Button
                      variant={filterAnchorEl ? "contained" : "outlined"}
                      size="small"
                      startIcon={<TuneIcon fontSize="small" />}
                      onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '13px',
                        borderColor: filterAnchorEl ? 'transparent' : '#e2e8f0',
                        borderWidth: '1.5px',
                        color: filterAnchorEl ? 'white' : '#49516f',
                        background: filterAnchorEl ? 'linear-gradient(135deg, #7b68ee, #9b59b6)' : 'white',
                        height: 36,
                        px: 2,
                        borderRadius: 2.5,
                        boxShadow: filterAnchorEl ? '0 4px 12px rgba(123, 104, 238, 0.3)' : 'none',
                        '&:hover': {
                          borderColor: filterAnchorEl ? 'transparent' : '#b4a7f5',
                          background: filterAnchorEl ? 'linear-gradient(135deg, #6b5dd6, #8b49a6)' : 'linear-gradient(to bottom, white, #f9fafb)',
                          boxShadow: '0 4px 12px rgba(123, 104, 238, 0.2)',
                          transform: 'translateY(-1px)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      Filters
                    </Button>
                  </Badge>
                </Stack>

                <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                  Showing: {filteredFunctions.length} {filteredFunctions.length !== functions.length && `of ${functions.length}`} functions
                </Typography>
              </Box>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Feature Filter Alert */}
          {featureIdFromUrl && filterFeature === featureIdFromUrl && (
            <Alert 
              severity="info" 
              sx={{ 
                mb: 3,
                background: 'linear-gradient(135deg, #e0f2fe, #e0e7ff)',
                border: '1px solid #7b68ee',
                '& .MuiAlert-icon': {
                  color: '#7b68ee'
                }
              }}
              onClose={() => {
                setFilterFeature("all");
                router.push(`/projects/${projectId}/functions`);
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Đang xem Functions của Feature: 
                </Typography>
                <Chip 
                  label={features.find(f => f._id === featureIdFromUrl)?.title || 'Unknown'}
                  size="small"
                  sx={{
                    background: 'linear-gradient(135deg, #7b68ee, #9b59b6)',
                    color: 'white',
                    fontWeight: 600,
                  }}
                />
              </Box>
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

          {/* Modern Filter Popover */}
          <Popover
            open={Boolean(filterAnchorEl)}
            anchorEl={filterAnchorEl}
            onClose={() => setFilterAnchorEl(null)}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            slotProps={{
              paper: {
                sx: {
                  mt: 1.5,
                  width: 400,
                  maxHeight: 500,
                  borderRadius: 4,
                  boxShadow: '0 20px 60px rgba(123, 104, 238, 0.15), 0 0 0 1px rgba(123, 104, 238, 0.1)',
                  overflow: 'hidden',
                  background: 'linear-gradient(to bottom, #ffffff, #fafbff)',
                  display: 'flex',
                  flexDirection: 'column',
                }
              }
            }}
          >
            {/* Header */}
            <Box sx={{ 
              px: 3.5,
              pt: 3,
              pb: 2.5,
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at top right, rgba(255,255,255,0.2), transparent)',
                pointerEvents: 'none',
              }
            }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
                    <Box sx={{ 
                      width: 36, 
                      height: 36, 
                      borderRadius: 2, 
                      bgcolor: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(10px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(255,255,255,0.3)',
                    }}>
                      <TuneIcon sx={{ fontSize: 20, color: 'white' }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '18px', color: 'white', letterSpacing: '-0.02em' }}>
                      Function Filters
                    </Typography>
                  </Stack>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', ml: 6 }}>
                    Refine your function list
                  </Typography>
                </Box>
                <IconButton 
                size="small"
                  onClick={() => setFilterAnchorEl(null)}
                  sx={{ 
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    '&:hover': { 
                      bgcolor: 'rgba(255,255,255,0.25)',
                      transform: 'rotate(90deg)',
                      transition: 'all 0.3s ease'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  <span style={{ fontSize: '18px', fontWeight: 300 }}>×</span>
                </IconButton>
              </Stack>
            </Box>

            {/* Filter Content */}
            <Box sx={{ 
              px: 3.5,
              py: 3,
              flex: 1,
              overflowY: 'auto',
            }}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="caption" sx={{ mb: 1.5, display: 'block', fontWeight: 700, color: '#2d3748', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Status
                  </Typography>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: '#6b7280', '&.Mui-focused': { color: '#8b5cf6' } }}>Trạng thái</InputLabel>
                <Select
                  value={filterStatus}
                  label="Trạng thái"
                  onChange={(e) => setFilterStatus(e.target.value)}
                      sx={{
                        borderRadius: 2.5,
                        bgcolor: 'white',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0', borderWidth: '1.5px' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#b4a7f5' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#8b5cf6', borderWidth: '2px' },
                      }}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  {statusTypes.map((status) => (
                    <MenuItem key={status._id} value={status._id}>
                      {status.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="caption" sx={{ mb: 1.5, display: 'block', fontWeight: 700, color: '#2d3748', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Feature
                  </Typography>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: '#6b7280', '&.Mui-focused': { color: '#8b5cf6' } }}>Feature</InputLabel>
                <Select
                  value={filterFeature}
                  label="Feature"
                  onChange={(e) => setFilterFeature(e.target.value)}
                      sx={{
                        borderRadius: 2.5,
                        bgcolor: 'white',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0', borderWidth: '1.5px' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#b4a7f5' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#8b5cf6', borderWidth: '2px' },
                      }}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  {features.map((feature) => (
                    <MenuItem key={feature._id} value={feature._id}>
                      {feature.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
                </Box>
            </Stack>
            </Box>

            {/* Footer */}
            {(filterStatus !== 'all' || filterFeature !== 'all') && (
              <Box sx={{ 
                px: 3.5,
                py: 2.5,
                borderTop: '1px solid #e2e8f0',
                background: 'linear-gradient(to bottom, #fafbff, #f8f9fb)',
                flexShrink: 0,
              }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => {
                    setFilterStatus('all');
                    setFilterFeature('all');
                  }}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '14px',
                    color: 'white',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    borderRadius: 2.5,
                    py: 1.2,
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                      boxShadow: '0 6px 16px rgba(239, 68, 68, 0.4)',
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                  startIcon={
                    <Box sx={{ 
                      width: 20, 
                      height: 20, 
                      borderRadius: '50%', 
                      bgcolor: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px'
                    }}>
                      ✕
                    </Box>
                  }
                >
                  Clear All Filters
                </Button>
              </Box>
            )}
          </Popover>

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
                    const featureName = resolveFeatureTitle(func);
                    const complexityName = resolveComplexityName(func);
                    const statusName = resolveStatusName(func);
                    
                    const isEditingTitle = editingCell?.funcId === func._id && editingCell?.field === 'title';
                    const isEditingDescription = editingCell?.funcId === func._id && editingCell?.field === 'description';
                    const isEditingComplexity = editingCell?.funcId === func._id && editingCell?.field === 'complexity_id';
                    const isEditingStatus = editingCell?.funcId === func._id && editingCell?.field === 'status';
                    const isEditingEffort = editingCell?.funcId === func._id && editingCell?.field === 'estimated_effort';
                    const isEditingDeadline = editingCell?.funcId === func._id && editingCell?.field === 'deadline';
                    
                    return (
                      <TableRow 
                        key={func._id} 
                        hover
                        sx={{ 
                          '&:hover': {
                            bgcolor: '#fafbfc',
                          },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {/* Title - Inline Editable */}
                        <TableCell 
                          onClick={() => !isEditingTitle && startEdit(func._id, 'title', func.title)}
                          sx={{ 
                            cursor: isEditingTitle ? 'text' : 'pointer',
                            '&:hover': !isEditingTitle ? { bgcolor: '#f9fafb' } : {},
                          }}
                        >
                          {isEditingTitle ? (
                            <TextField
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => saveInlineEdit(func._id, 'title')}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveInlineEdit(func._id, 'title');
                                if (e.key === 'Escape') cancelEdit();
                              }}
                              size="small"
                              fullWidth
                              autoFocus
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  fontSize: '14px',
                                  bgcolor: 'white',
                                  '& fieldset': { borderColor: '#7b68ee' },
                                }
                              }}
                            />
                          ) : (
                            <>
                          <Typography fontWeight="medium">{func.title}</Typography>
                          {func.description && (
                                <Typography 
                                  variant="caption" 
                                  color="text.secondary" 
                                  sx={{ 
                                    display: 'block', 
                                    maxWidth: 300, 
                                    overflow: 'hidden', 
                                    textOverflow: 'ellipsis', 
                                    whiteSpace: 'nowrap',
                                    cursor: 'pointer',
                                    '&:hover': { color: '#7b68ee' }
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEdit(func._id, 'description', func.description);
                                  }}
                                >
                              {func.description}
                            </Typography>
                              )}
                            </>
                          )}
                        </TableCell>
                        <TableCell>
                          {featureName !== "-" ? (
                            <Chip label={featureName} size="small" variant="outlined" />
                          ) : (
                            <Typography variant="body2" color="text.secondary">—</Typography>
                          )}
                        </TableCell>
                        {/* Complexity - Inline Editable */}
                        <TableCell 
                          onClick={() => {
                            if (!isEditingComplexity) {
                              const currentComplexityId = typeof func.complexity_id === 'object' 
                                ? func.complexity_id?._id 
                                : func.complexity_id;
                              startEdit(func._id, 'complexity_id', currentComplexityId);
                            }
                          }}
                          sx={{ 
                            cursor: isEditingComplexity ? 'default' : 'pointer',
                            '&:hover': !isEditingComplexity ? { bgcolor: '#f9fafb' } : {},
                          }}
                        >
                          {isEditingComplexity ? (
                            <Select
                              value={editValue || ""}
                              onChange={(e) => {
                                setEditValue(e.target.value);
                                // Auto-save on change
                                setTimeout(() => saveInlineEdit(func._id, 'complexity_id'), 100);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  e.stopPropagation();
                                  cancelEdit();
                                }
                              }}
                              size="small"
                              autoFocus
                              open
                              sx={{
                                fontSize: '13px',
                                minWidth: 120,
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#7b68ee',
                                },
                              }}
                            >
                              {complexityTypes.map((complexity) => (
                                <MenuItem key={complexity._id} value={complexity._id}>
                                  {complexity.name}
                                </MenuItem>
                              ))}
                            </Select>
                          ) : (
                          <Chip label={complexityName} size="small" color="primary" />
                          )}
                        </TableCell>

                        {/* Status - Inline Editable */}
                        <TableCell 
                          onClick={() => {
                            if (!isEditingStatus) {
                              const currentStatusId = typeof func.status === 'object' 
                                ? func.status?._id 
                                : func.status;
                              startEdit(func._id, 'status', currentStatusId);
                            }
                          }}
                          sx={{ 
                            cursor: isEditingStatus ? 'default' : 'pointer',
                            '&:hover': !isEditingStatus ? { bgcolor: '#f9fafb' } : {},
                          }}
                        >
                          {isEditingStatus ? (
                            <Select
                              value={editValue || ""}
                              onChange={(e) => {
                                setEditValue(e.target.value);
                                // Auto-save on change
                                setTimeout(() => saveInlineEdit(func._id, 'status'), 100);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  e.stopPropagation();
                                  cancelEdit();
                                }
                              }}
                              size="small"
                              autoFocus
                              open
                              sx={{
                                fontSize: '13px',
                                minWidth: 140,
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#7b68ee',
                                },
                              }}
                            >
                              {statusTypes.map((status) => {
                                const { icon, color, bg } = getStatusIconAndColor(status.name);
                                return (
                                  <MenuItem key={status._id} value={status._id}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Box sx={{ 
                                        width: 24, 
                                        height: 24, 
                                        borderRadius: 1,
                                        bgcolor: bg,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}>
                                        {React.cloneElement(icon, { sx: { color, fontSize: 16 } })}
                                      </Box>
                                      {status.name}
                                    </Box>
                                  </MenuItem>
                                );
                              })}
                            </Select>
                          ) : (
                          <Chip
                            label={statusName}
                            size="small"
                            sx={{
                              bgcolor: getStatusColor(statusName),
                              color: "#fff",
                              fontWeight: 600,
                            }}
                          />
                          )}
                        </TableCell>
                        {/* Estimated Effort - Inline Editable */}
                        <TableCell 
                          onClick={() => !isEditingEffort && startEdit(func._id, 'estimated_effort', func.estimated_effort)}
                          sx={{ 
                            cursor: isEditingEffort ? 'text' : 'pointer',
                            '&:hover': !isEditingEffort ? { bgcolor: '#f9fafb' } : {},
                          }}
                        >
                          {isEditingEffort ? (
                            <TextField
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(Number(e.target.value))}
                              onBlur={() => saveInlineEdit(func._id, 'estimated_effort')}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveInlineEdit(func._id, 'estimated_effort');
                                if (e.key === 'Escape') cancelEdit();
                              }}
                              size="small"
                              autoFocus
                              sx={{
                                width: 80,
                                '& .MuiOutlinedInput-root': {
                                  fontSize: '14px',
                                  bgcolor: 'white',
                                  '& fieldset': { borderColor: '#7b68ee' },
                                }
                              }}
                            />
                          ) : (
                          <Typography variant="body2" fontWeight={600}>
                            {func.estimated_effort}h
                          </Typography>
                          )}
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
                        {/* Deadline - Inline Editable */}
                        <TableCell 
                          onClick={() => !isEditingDeadline && startEdit(func._id, 'deadline', func.deadline || '')}
                          sx={{ 
                            cursor: isEditingDeadline ? 'text' : 'pointer',
                            '&:hover': !isEditingDeadline ? { bgcolor: '#f9fafb' } : {},
                          }}
                        >
                          {isEditingDeadline ? (
                            <TextField
                              type="date"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => saveInlineEdit(func._id, 'deadline')}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveInlineEdit(func._id, 'deadline');
                                if (e.key === 'Escape') cancelEdit();
                              }}
                              size="small"
                              autoFocus
                              InputLabelProps={{ shrink: true }}
                              sx={{
                                width: 150,
                                '& .MuiOutlinedInput-root': {
                                  fontSize: '14px',
                                  bgcolor: 'white',
                                  '& fieldset': { borderColor: '#7b68ee' },
                                }
                              }}
                            />
                          ) : (
                            <>
                          {func.deadline ? (
                            <Typography variant="body2">
                              {new Date(func.deadline).toLocaleDateString('vi-VN')}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">—</Typography>
                              )}
                            </>
                          )}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="Xem Tasks của Function này">
                          <IconButton
                            size="small"
                                color="success"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/projects/${projectId}/tasks?functionId=${func._id}`);
                                }}
                              >
                                <AssignmentIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMenuClick(e, func);
                              }}
                          >
                            <MoreVertIcon />
                          </IconButton>
                          </Stack>
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

          {/* Action Menu - Modern Style */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            slotProps={{
              paper: {
                sx: {
                  borderRadius: 3,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
                  minWidth: 240,
                  mt: 1,
                  overflow: 'visible',
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 20,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                }
              }
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            {/* Edit Action */}
              <MenuItem 
                onClick={() => {
              if (selectedFunction) handleOpenDialog(selectedFunction);
              }}
              sx={{
                py: 1.5,
                px: 2,
                gap: 1.5,
                borderRadius: 2,
                mx: 1,
                my: 0.5,
                '&:hover': {
                  bgcolor: '#f3f4f6',
                  '& .MuiSvgIcon-root': {
                    transform: 'scale(1.1)',
                  }
                },
                transition: 'all 0.2s ease',
              }}
            >
              <Box sx={{ 
                width: 32, 
                height: 32, 
                borderRadius: 2,
                bgcolor: '#e0e7ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}>
                <EditIcon fontSize="small" sx={{ color: '#6366f1' }} />
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 500, flex: 1 }}>
                Chỉnh sửa
              </Typography>
              </MenuItem>

            <Divider sx={{ my: 1 }} />

            {/* Delete Action */}
            <MenuItem 
              onClick={() => {
                if (selectedFunction) handleDeleteFunction(selectedFunction._id);
              }}
              sx={{
                py: 1.5,
                px: 2,
                gap: 1.5,
                borderRadius: 2,
                mx: 1,
                my: 0.5,
                '&:hover': {
                  bgcolor: '#fee2e2',
                  '& .MuiSvgIcon-root': {
                    transform: 'scale(1.1) rotate(-5deg)',
                  }
                },
                transition: 'all 0.2s ease',
              }}
            >
              <Box sx={{ 
                width: 32, 
                height: 32, 
                borderRadius: 2,
                bgcolor: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}>
                <DeleteIcon fontSize="small" sx={{ color: '#ef4444' }} />
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 500, flex: 1, color: '#ef4444' }}>
                Xóa
              </Typography>
            </MenuItem>
          </Menu>

          {/* Function Dialog - Modern Style */}
          <Dialog 
            open={openDialog} 
            onClose={handleCloseDialog} 
            maxWidth="md" 
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 3,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              }
            }}
          >
            <DialogTitle sx={{ 
              fontWeight: 700,
              fontSize: '1.5rem',
              pb: 2,
              borderBottom: '1px solid #e8e9eb',
              background: 'linear-gradient(135deg, #fafbff 0%, #f8f9fb 100%)',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}>
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: editingFunction 
                  ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' 
                  : 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: editingFunction 
                  ? '0 4px 12px rgba(99, 102, 241, 0.3)' 
                  : '0 4px 12px rgba(16, 185, 129, 0.3)',
              }}>
                {editingFunction ? (
                  <EditIcon sx={{ color: 'white', fontSize: 22 }} />
                ) : (
                  <AddIcon sx={{ color: 'white', fontSize: 22 }} />
                )}
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              {editingFunction ? "Chỉnh sửa Function" : "Tạo Function mới"}
                </Typography>
                {editingFunction && (
                  <Typography variant="caption" sx={{ color: '#6b7280' }}>
                    Cập nhật thông tin function
                  </Typography>
                )}
              </Box>
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
            <DialogActions sx={{ 
              px: 3, 
              py: 2.5, 
              borderTop: '1px solid #e8e9eb',
              background: '#fafbff',
              gap: 1.5,
            }}>
              <Button 
                onClick={handleCloseDialog}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '13px',
                  color: '#6b7280',
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  '&:hover': {
                    bgcolor: '#f3f4f6',
                  }
                }}
              >
                Hủy
              </Button>
              <Button 
                variant="contained" 
                onClick={handleSaveFunction}
                disabled={!functionForm.title || !functionForm.complexity_id || !functionForm.status}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '13px',
                  background: editingFunction 
                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' 
                    : 'linear-gradient(135deg, #10b981, #059669)',
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  boxShadow: editingFunction 
                    ? '0 4px 12px rgba(99, 102, 241, 0.3)' 
                    : '0 4px 12px rgba(16, 185, 129, 0.3)',
                  '&:hover': {
                    background: editingFunction 
                      ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' 
                      : 'linear-gradient(135deg, #059669, #047857)',
                    boxShadow: editingFunction 
                      ? '0 6px 16px rgba(99, 102, 241, 0.4)' 
                      : '0 6px 16px rgba(16, 185, 129, 0.4)',
                    transform: 'translateY(-1px)',
                  },
                  '&:disabled': {
                    background: '#e5e7eb',
                    color: '#9ca3af',
                    boxShadow: 'none',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {editingFunction ? "💾 Cập nhật" : "✨ Tạo Function"}
              </Button>
            </DialogActions>
          </Dialog>
        </div>
      </main>
    </div>
  );
}

