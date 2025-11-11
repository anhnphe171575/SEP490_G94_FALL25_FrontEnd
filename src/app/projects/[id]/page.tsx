"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "../../../../ultis/axios";
import { getStartOfWeekUTC, addDays } from "@/lib/timeline";
import ResponsiveSidebar from "@/components/ResponsiveSidebar"; // Import ResponsiveSidebar để sử dụng cho sidebar
import GanttChart from "@/components/GanttChart";
import ModalMilestone from "@/components/ModalMilestone";
import { Button, FormControlLabel, Checkbox as MUICheckbox, Select as MUISelect, MenuItem, Typography, Box, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, LinearProgress, Stack, TextField, InputAdornment, Tooltip, Collapse, Slider, Divider, Badge, Popover, Tabs, Tab } from "@mui/material";
import { toast } from "sonner";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import AssignmentIcon from "@mui/icons-material/Assignment";
import FunctionsIcon from "@mui/icons-material/Functions";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EditIcon from "@mui/icons-material/Edit";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ArchiveIcon from "@mui/icons-material/Archive";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import FilterListIcon from "@mui/icons-material/FilterList";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import DateRangeIcon from "@mui/icons-material/DateRange";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import FlagIcon from "@mui/icons-material/Flag";
import TuneIcon from "@mui/icons-material/Tune";
import ProjectBreadcrumb from "@/components/ProjectBreadcrumb";

type User = {
  _id: string;
  full_name?: string;
  email?: string;
};


type Milestone = {
  _id: string;
  title: string;
  start_date?: string;
  deadline?: string;
  description?: string;
  tags?: string[];
  created_by?: User;
  last_updated_by?: User;
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
    by_task: {
      total: number;
      completed: number;
      percentage: number;
    };
    by_function: {
      total: number;
      completed: number;
      percentage: number;
    };
  };
};

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);
  const [milestones, setMilestones] = useState<Milestone[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [milestoneFeatures, setMilestoneFeatures] = useState<Record<string, Array<{
    feature_id: string;
    feature_title: string;
    task_count: number;
    function_count: number;
    completed_tasks: number;
    completed_functions: number;
    percentage: number;
  }>>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMilestones, setSelectedMilestones] = useState<Set<string>>(new Set());
  const [showToolbar, setShowToolbar] = useState(false);
  const [viewTab, setViewTab] = useState<'list' | 'timeline'>('list');

  // Advanced filter states
  const [statusFilter, setStatusFilter] = useState<Record<string, boolean>>({
    Planned: true,
    'In Progress': true,
    Completed: true,
    Overdue: true,
  });
  const [dateRangeFilter, setDateRangeFilter] = useState<{
    startDate: string;
    endDate: string;
    enabled: boolean;
  }>({
    startDate: '',
    endDate: '',
    enabled: false,
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!projectId) return;
    (async () => {
      try {
        const res = await axiosInstance.get(`/api/projects/${projectId}/milestones`);
        const milestonesData = Array.isArray(res.data) ? res.data : [];

        // Lấy tiến độ chi tiết cho từng milestone
        const milestonesWithProgress = await Promise.all(
          milestonesData.map(async (milestone: Milestone) => {
            try {
              const progressRes = await axiosInstance.get(`/api/projects/${projectId}/milestones/${milestone._id}/progress`);
              return { ...milestone, progress: progressRes.data.progress };
            } catch (e) {
              console.log(`Không thể lấy tiến độ cho milestone ${milestone._id}:`, e);
              return milestone;
            }
          })
        );

        setMilestones(milestonesWithProgress);

        // Lấy thông tin features cho từng milestone
        const featuresMap: Record<string, Array<{
          feature_id: string;
          feature_title: string;
          task_count: number;
          function_count: number;
          completed_tasks: number;
          completed_functions: number;
          percentage: number;
        }>> = {};
        for (const milestone of milestonesWithProgress) {
          if (milestone.progress?.by_feature) {
            featuresMap[milestone._id] = milestone.progress.by_feature;
          }
        }
        setMilestoneFeatures(featuresMap);
      } catch (e: unknown) {
        const error = e as { response?: { data?: { message?: string } }; message?: string };
        setError(error?.response?.data?.message || 'Không thể tải milestone');
        toast.error(`Lỗi tải dữ liệu: ${error?.response?.data?.message || error.message}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  // Keyboard shortcuts for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Tìm kiếm"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
      // Escape to clear search
      if (e.key === 'Escape' && searchTerm) {
        setSearchTerm("");
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchTerm]);

  // Filter functions
  const getFilteredMilestones = () => {
    if (!milestones) return [];

    let filtered = [...milestones];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const filteredMilestoneIds = new Set<string>();

      // Search in milestone titles/descriptions
      filtered.forEach(milestone => {
        if (milestone.title.toLowerCase().includes(term) ||
          milestone.description?.toLowerCase().includes(term)) {
          filteredMilestoneIds.add(milestone._id);
        }
      });

      // Search in features
      Object.entries(milestoneFeatures).forEach(([milestoneId, features]) => {
        const hasMatchingFeature = features.some(feature =>
          feature.feature_title.toLowerCase().includes(term)
        );
        if (hasMatchingFeature) {
          filteredMilestoneIds.add(milestoneId);
        }
      });

      filtered = filtered.filter(milestone => filteredMilestoneIds.has(milestone._id));
    }

    // Status filter is no longer applicable as milestone model doesn't have status field

    // Apply date range filter
    if (dateRangeFilter.enabled && (dateRangeFilter.startDate || dateRangeFilter.endDate)) {
      filtered = filtered.filter(milestone => {
        const milestoneStart = milestone.start_date ? new Date(milestone.start_date) : null;
        const milestoneEnd = milestone.deadline ? new Date(milestone.deadline) : null;

        if (dateRangeFilter.startDate) {
          const filterStart = new Date(dateRangeFilter.startDate);
          if (milestoneEnd && milestoneEnd < filterStart) return false;
        }

        if (dateRangeFilter.endDate) {
          const filterEnd = new Date(dateRangeFilter.endDate);
          if (milestoneStart && milestoneStart > filterEnd) return false;
        }

        return true;
      });
    }

    return filtered;
  };

  const getFilteredMilestoneFeatures = () => {
    if (!searchTerm) return milestoneFeatures;

    const term = searchTerm.toLowerCase();
    const filtered: Record<string, Array<{
      feature_id: string;
      feature_title: string;
      task_count: number;
      function_count: number;
      completed_tasks: number;
      completed_functions: number;
      percentage: number;
    }>> = {};

    Object.entries(milestoneFeatures).forEach(([milestoneId, features]) => {
      const matchingFeatures = features.filter(feature =>
        feature.feature_title.toLowerCase().includes(term)
      );
      if (matchingFeatures.length > 0) {
        filtered[milestoneId] = matchingFeatures;
      }
    });

    return filtered;
  };

  // Helper function to highlight search terms
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;

    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} style={{ backgroundColor: '#ffeb3b', padding: '0 2px' }}>
          {part}
        </mark>
      ) : part
    );
  };

  // Toolbar functions
  const handleDuplicate = async () => {
    let loadingToast: string | number | undefined;
    try {
      const selectedIds = Array.from(selectedMilestones);
      if (selectedIds.length === 0) return;

      // Show loading toast
      loadingToast = toast.loading(`Đang sao chép ${selectedIds.length} milestone(s)...`);

      // Show loading state
      setLoading(true);

      // Duplicate each selected milestone
      const duplicatePromises = selectedIds.map(milestoneId =>
        axiosInstance.post(`/api/projects/${projectId}/milestones/${milestoneId}/duplicate`)
      );

      const results = await Promise.all(duplicatePromises);

      // Refresh milestones list
      const res = await axiosInstance.get(`/api/projects/${projectId}/milestones`);
      const milestonesData = Array.isArray(res.data) ? res.data : [];

      // Get progress for all milestones
      const milestonesWithProgress = await Promise.all(
        milestonesData.map(async (milestone: Milestone) => {
          try {
            const progressRes = await axiosInstance.get(`/api/projects/${projectId}/milestones/${milestone._id}/progress`);
            return { ...milestone, progress: progressRes.data.progress };
          } catch (e) {
            console.log(`Không thể lấy tiến độ cho milestone ${milestone._id}:`, e);
            return milestone;
          }
        })
      );

      setMilestones(milestonesWithProgress);

      // Clear selection
      setSelectedMilestones(new Set());

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success(`Đã sao chép thành công ${results.length} milestone(s)`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      console.error('Error duplicating milestones:', error);
      toast.dismiss(loadingToast);
      toast.error(`Lỗi khi sao chép: ${err?.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    let loadingToast: string | number | undefined;
    try {
      const selectedIds = Array.from(selectedMilestones);
      if (selectedIds.length === 0) return;

      // Show loading toast
      loadingToast = toast.loading(`Đang xuất ${selectedIds.length} milestone(s) thành Excel...`);

      // Export each selected milestone as Excel
      for (const milestoneId of selectedIds) {
        const response = await axiosInstance.get(`/api/projects/${projectId}/milestones/${milestoneId}/export?format=excel`, {
          responseType: 'blob'
        });

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `milestone-${milestoneId}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success(`Đã xuất thành công ${selectedIds.length} milestone(s) dưới dạng Excel`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      console.error('Error exporting milestones:', error);
      toast.dismiss(loadingToast);
      toast.error(`Lỗi khi xuất: ${err?.response?.data?.message || err.message}`);
    }
  };

  const handleArchive = async () => {
    let loadingToast: string | number | undefined;
    try {
      const selectedIds = Array.from(selectedMilestones);
      if (selectedIds.length === 0) return;

      const confirmed = window.confirm(`Bạn có chắc muốn lưu trữ ${selectedIds.length} milestone(s) đã chọn?`);
      if (!confirmed) return;

      // Show loading toast
      loadingToast = toast.loading(`Đang lưu trữ ${selectedIds.length} milestone(s)...`);

      // Show loading state
      setLoading(true);

      // Archive each selected milestone
      const archivePromises = selectedIds.map(milestoneId =>
        axiosInstance.patch(`/api/projects/${projectId}/milestones/${milestoneId}/archive`, { archived: true })
      );

      await Promise.all(archivePromises);

      // Refresh milestones list
      const res = await axiosInstance.get(`/api/projects/${projectId}/milestones`);
      const milestonesData = Array.isArray(res.data) ? res.data : [];

      // Get progress for all milestones
      const milestonesWithProgress = await Promise.all(
        milestonesData.map(async (milestone: Milestone) => {
          try {
            const progressRes = await axiosInstance.get(`/api/projects/${projectId}/milestones/${milestone._id}/progress`);
            return { ...milestone, progress: progressRes.data.progress };
          } catch (e) {
            console.log(`Không thể lấy tiến độ cho milestone ${milestone._id}:`, e);
            return milestone;
          }
        })
      );

      setMilestones(milestonesWithProgress);

      // Clear selection
      setSelectedMilestones(new Set());

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success(`Đã lưu trữ thành công ${selectedIds.length} milestone(s)`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      console.error('Error archiving milestones:', error);
      toast.dismiss(loadingToast);
      toast.error(`Lỗi khi lưu trữ: ${err?.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    let loadingToast: string | number | undefined;
    try {
      const selectedIds = Array.from(selectedMilestones);
      if (selectedIds.length === 0) return;

      const confirmed = window.confirm(`Bạn có chắc muốn XÓA VĨNH VIỄN ${selectedIds.length} milestone(s) đã chọn?\n\nHành động này không thể hoàn tác!`);
      if (!confirmed) return;

      const forceConfirmed = window.confirm(`CẢNH BÁO: Xóa vĩnh viễn sẽ xóa tất cả dữ liệu liên quan (features, comments, files).\n\nBạn có chắc chắn muốn tiếp tục?`);
      if (!forceConfirmed) return;

      // Show loading toast
      loadingToast = toast.loading(`Đang xóa ${selectedIds.length} milestone(s)...`);

      // Show loading state
      setLoading(true);

      // Delete each selected milestone
      const deletePromises = selectedIds.map(milestoneId =>
        axiosInstance.delete(`/api/projects/${projectId}/milestones/${milestoneId}?force=true`)
      );

      await Promise.all(deletePromises);

      // Refresh milestones list
      const res = await axiosInstance.get(`/api/projects/${projectId}/milestones`);
      const milestonesData = Array.isArray(res.data) ? res.data : [];

      // Get progress for all milestones
      const milestonesWithProgress = await Promise.all(
        milestonesData.map(async (milestone: Milestone) => {
          try {
            const progressRes = await axiosInstance.get(`/api/projects/${projectId}/milestones/${milestone._id}/progress`);
            return { ...milestone, progress: progressRes.data.progress };
          } catch (e) {
            console.log(`Không thể lấy tiến độ cho milestone ${milestone._id}:`, e);
            return milestone;
          }
        })
      );

      setMilestones(milestonesWithProgress);

      // Clear selection
      setSelectedMilestones(new Set());

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success(`Đã xóa thành công ${selectedIds.length} milestone(s)`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      console.error('Error deleting milestones:', error);
      toast.dismiss(loadingToast);
      toast.error(`Lỗi khi xóa: ${err?.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };


  const handleCloseToolbar = () => {
    setShowToolbar(false);
    setSelectedMilestones(new Set());
    toast.info('Đã bỏ chọn tất cả milestones');
  };

  // Update toolbar visibility when selection changes
  useEffect(() => {
    setShowToolbar(selectedMilestones.size > 0);
  }, [selectedMilestones]);

  return (
    <div className="min-h-screen bg-white text-black">
      <ResponsiveSidebar />
      <main className="p-4 md:p-6 md:ml-64">
        <div className="mx-auto w-full max-w-7xl">
          {/* Modern Header */}
          <Box sx={{ mb: 3 }}>
            <ProjectBreadcrumb 
              projectId={projectId}
              items={[
                { label: 'Milestones', icon: <FlagIcon sx={{ fontSize: 16 }} /> }
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
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
                  }}>
                    <FlagIcon sx={{ fontSize: 28, color: 'white' }} />
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#1f2937', mb: 0.5 }}>
                      Milestones
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6b7280' }}>
                      Quản lý các milestone trong dự án
                    </Typography>
                  </Box>
                </Box>

                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => router.push(`/projects/${projectId}/milestones/new`)}
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
                Thêm Milestone
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
                  <Badge 
                    badgeContent={showAdvancedFilters ? 1 : 0}
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
                      Quick Nav
              </Button>
                  </Badge>
                </Stack>

                <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                  Showing: {getFilteredMilestones().length} milestones
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Quick Navigation Popover */}
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
                  width: 300,
                  borderRadius: 3,
                  boxShadow: '0 20px 60px rgba(123, 104, 238, 0.15), 0 0 0 1px rgba(123, 104, 238, 0.1)',
                  overflow: 'hidden',
                  background: 'linear-gradient(to bottom, #ffffff, #fafbff)',
                }
              }
            }}
          >
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: '#2d3748' }}>
                Quick Navigation
              </Typography>
              <Stack spacing={1}>
                <Button 
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    router.push(`/projects/${projectId}/features`);
                    setFilterAnchorEl(null);
                  }}
                  sx={{
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    borderColor: '#e2e8f0',
                    '&:hover': { borderColor: '#7b68ee', bgcolor: '#f9fafb' }
                  }}
                >
                  ⭐ Features
              </Button>
                <Button 
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    router.push(`/projects/${projectId}/functions`);
                    setFilterAnchorEl(null);
                  }}
                  sx={{
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    borderColor: '#e2e8f0',
                    '&:hover': { borderColor: '#7b68ee', bgcolor: '#f9fafb' }
                  }}
                >
                  🔧 Functions
              </Button>
                <Button 
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    router.push(`/projects/${projectId}/tasks`);
                    setFilterAnchorEl(null);
                  }}
                  sx={{
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    borderColor: '#e2e8f0',
                    '&:hover': { borderColor: '#7b68ee', bgcolor: '#f9fafb' }
                  }}
                >
                  ✅ Tasks
                </Button>
                <Button 
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    router.push(`/projects/${projectId}/team`);
                    setFilterAnchorEl(null);
                  }}
                  sx={{
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    borderColor: '#e2e8f0',
                    '&:hover': { borderColor: '#7b68ee', bgcolor: '#f9fafb' }
                  }}
                >
                  👥 Team
              </Button>
                <Button 
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    router.push(`/projects/${projectId}/documents`);
                    setFilterAnchorEl(null);
                  }}
                  sx={{
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    borderColor: '#e2e8f0',
                    '&:hover': { borderColor: '#7b68ee', bgcolor: '#f9fafb' }
                  }}
                >
                  📄 Documents
              </Button>
                <Button 
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    router.push(`/projects/${projectId}/defect`);
                    setFilterAnchorEl(null);
                  }}
                  sx={{
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    borderColor: '#e2e8f0',
                    '&:hover': { borderColor: '#7b68ee', bgcolor: '#f9fafb' }
                  }}
                >
                  🐛 Defects
                </Button>
                <Button 
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    router.push(`/projects/${projectId}/monitoring`);
                    setFilterAnchorEl(null);
                  }}
                  sx={{
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    borderColor: '#e2e8f0',
                    '&:hover': { borderColor: '#7b68ee', bgcolor: '#f9fafb' }
                  }}
                >
                  📊 Monitoring
                </Button>
              </Stack>
            </Box>
          </Popover>


          {/* Action Toolbar */}
          {showToolbar && (
            <Card sx={{
              mb: 3,
              bgcolor: '#ffffff',
              color: '#1976D2',
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
              boxShadow: '0 -4px 8px rgba(0,0,0,0.1)',
              borderRadius: 0,
              borderTop: '1px solid #BBDEFB'
            }}>
              <CardContent sx={{ py: 2 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        bgcolor: '#1976D2',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        fontWeight: 600
                      }}
                    >
                      {selectedMilestones.size}
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Milestone{selectedMilestones.size !== 1 ? 's' : ''} selected
                    </Typography>
                  </Box>

                  <Button
                    variant="text"
                    size="small"
                    startIcon={<ContentCopyIcon />}
                    onClick={handleDuplicate}
                    sx={{ color: '#1976D2', minWidth: 'auto', px: 2 }}
                  >
                    <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                      Duplicate
                    </Typography>
                  </Button>

                  <Button
                    variant="text"
                    size="small"
                    startIcon={<FileDownloadIcon />}
                    onClick={handleExport}
                    sx={{ color: '#1976D2', minWidth: 'auto', px: 2 }}
                  >
                    <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                      Export
                    </Typography>
                  </Button>

                  <Button
                    variant="text"
                    size="small"
                    startIcon={<ArchiveIcon />}
                    onClick={handleArchive}
                    sx={{ color: '#1976D2', minWidth: 'auto', px: 2 }}
                  >
                    <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                      Archive
                    </Typography>
                  </Button>

                  <Button
                    variant="text"
                    size="small"
                    startIcon={<DeleteIcon />}
                    onClick={handleDelete}
                    sx={{ color: '#1976D2', minWidth: 'auto', px: 2 }}
                  >
                    <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                      Delete
                    </Typography>
                  </Button>


                  <Box sx={{ flexGrow: 1 }} />

                  <Button
                    variant="text"
                    size="small"
                    onClick={handleCloseToolbar}
                    sx={{ color: '#1976D2', minWidth: 'auto', px: 1 }}
                  >
                    <CloseIcon fontSize="small" />
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="rounded-xl border border-[var(--border)] p-6 bg-white animate-pulse">
              <div className="h-6 w-32 rounded bg-foreground/10 mb-4"></div>
              <div className="h-4 w-48 rounded bg-foreground/10 mb-2"></div>
              <div className="h-72 w-full rounded bg-foreground/10"></div>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/40 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 p-4">
              {error}
            </div>
          ) : (
            <>
              {getFilteredMilestones().length === 0 && searchTerm ? (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Box textAlign="center" py={4}>
                      <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Không tìm thấy kết quả
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Không có milestone hoặc feature nào khớp với từ khóa &ldquo;{searchTerm}&rdquo;
                      </Typography>
                      <Button
                        variant="outlined"
                        onClick={() => setSearchTerm("")}
                        startIcon={<ClearIcon />}
                      >
                        Xóa bộ lọc
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Tabs */}
                  <Paper variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
                    <Tabs 
                      value={viewTab} 
                      onChange={(e, newValue) => setViewTab(newValue)}
                      sx={{
                        borderBottom: '1px solid #e2e8f0',
                        px: 2,
                        '& .MuiTab-root': {
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '14px',
                          minHeight: 48,
                          color: '#6b7280',
                          '&.Mui-selected': {
                            color: '#7b68ee',
                          }
                        },
                        '& .MuiTabs-indicator': {
                          backgroundColor: '#7b68ee',
                          height: 3,
                          borderRadius: '3px 3px 0 0',
                        }
                      }}
                    >
                      <Tab label="📋 Danh sách" value="list" />
                      <Tab label="📊 Timeline" value="timeline" />
                    </Tabs>
                  </Paper>

                  {/* Tab Content */}
                  {viewTab === 'list' && (
                    <MilestonesList
                      milestones={getFilteredMilestones()}
                      projectId={projectId}
                      searchTerm={searchTerm}
                      highlightText={highlightText}
                      selectedMilestones={selectedMilestones}
                      setSelectedMilestones={setSelectedMilestones}
                      statusFilter={statusFilter}
                      setStatusFilter={setStatusFilter}
                      dateRangeFilter={dateRangeFilter}
                      setDateRangeFilter={setDateRangeFilter}
                      showAdvancedFilters={showAdvancedFilters}
                      setShowAdvancedFilters={setShowAdvancedFilters}
                      getFilteredMilestones={getFilteredMilestones}
                      setSearchTerm={setSearchTerm}
                    />
                  )}

                  {viewTab === 'timeline' && (
                    <Timeline
                      milestones={getFilteredMilestones()}
                      projectId={projectId}
                      onLocalUpdate={setMilestones}
                      searchTerm={searchTerm}
                    />
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function Timeline({ milestones, projectId, onLocalUpdate, searchTerm }: { milestones: Milestone[]; projectId: string; onLocalUpdate: React.Dispatch<React.SetStateAction<Milestone[] | null>>; searchTerm?: string }) {
  const [weekStart, setWeekStart] = useState<Date>(getStartOfWeekUTC(new Date()));
  const [viewMode, setViewMode] = useState<'Days' | 'Weeks' | 'Months' | 'Quarters'>('Days');
  const [autoFit, setAutoFit] = useState<boolean>(true);
  const [openModal, setOpenModal] = useState<{ open: boolean; milestoneId?: string }>({ open: false });
  if (!milestones || milestones.length === 0) {
    return <div className="text-black">Chưa có milestone nào.</div>;
  }

  return (
    <div className="w-full">
      <div className="sticky top-0 z-10 -mx-4 md:-mx-6 mb-4 bg-white px-4 md:px-6 py-3 border-b border-[var(--border)]">
        <div className="flex flex-wrap items-center gap-3">
          <MUISelect
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as 'Days' | 'Weeks' | 'Months' | 'Quarters')}
            size="small"
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="Days">Days</MenuItem>
            <MenuItem value="Weeks">Weeks</MenuItem>
            <MenuItem value="Months">Months</MenuItem>
            <MenuItem value="Quarters">Quarters</MenuItem>
          </MUISelect>
          <FormControlLabel
            className="ml-2"
            control={<MUICheckbox size="small" checked={autoFit} onChange={(e) => setAutoFit(e.target.checked)} />}
            label={<Typography variant="body2">Auto Fit</Typography>}
          />
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-white shadow-sm">
        <div>
          <GanttChart
            milestones={milestones || []}
            viewMode={viewMode}
            startDate={weekStart}
            autoFit={autoFit}
            pagingStepDays={viewMode === 'Quarters' ? 90 : viewMode === 'Months' ? 30 : viewMode === 'Weeks' ? 7 : 7}
            onRequestShift={(days) => setWeekStart(prev => addDays(prev, days))}
            onMilestoneShift={(id, deltaDays) => {
              // Local optimistic update: shift start_date and deadline by deltaDays
              onLocalUpdate((prev) => {
                if (!prev) return prev;
                const shiftDate = (iso?: string) => {
                  if (!iso) return iso;
                  const d = new Date(iso);
                  d.setUTCDate(d.getUTCDate() + deltaDays);
                  return d.toISOString();
                };
                return prev.map((m) => m._id === id ? ({
                  ...m,
                  start_date: shiftDate(m.start_date),
                  deadline: shiftDate(m.deadline),
                }) : m);
              });
            }}
            onMilestoneClick={(id) => setOpenModal({ open: true, milestoneId: id })}
            searchTerm={searchTerm}
          />
        </div>
      </div>

      {openModal.open && openModal.milestoneId && (
        <ModalMilestone
          open={openModal.open}
          onClose={() => setOpenModal({ open: false })}
          projectId={projectId}
          milestoneId={openModal.milestoneId}
          onUpdate={async () => {
            // Refresh the specific milestone data
            try {
              const [milestoneRes, progressRes] = await Promise.all([
                axiosInstance.get(`/api/projects/${projectId}/milestones/${openModal.milestoneId}`),
                axiosInstance.get(`/api/projects/${projectId}/milestones/${openModal.milestoneId}/progress`).catch(() => ({ data: { progress: null } }))
              ]);
              const updatedMilestone = { ...milestoneRes.data, progress: progressRes.data?.progress || null };
              // Update the milestone in the list
              onLocalUpdate((prev) =>
                prev ? prev.map(m => m._id === openModal.milestoneId ? updatedMilestone : m) : prev
              );
            } catch (e) {
              console.error('Failed to refresh milestone:', e);
            }
          }}
        />
      )}
    </div>
  );
}


function MilestonesList({
  milestones,
  projectId,
  searchTerm,
  highlightText,
  selectedMilestones,
  setSelectedMilestones,
  statusFilter,
  setStatusFilter,
  dateRangeFilter,
  setDateRangeFilter,
  showAdvancedFilters,
  setShowAdvancedFilters,
  getFilteredMilestones,
  setSearchTerm
}: {
  milestones: Milestone[];
  projectId: string;
  searchTerm?: string;
  highlightText?: (text: string, searchTerm: string) => React.ReactNode;
  selectedMilestones: Set<string>;
  setSelectedMilestones: (selected: Set<string>) => void;
  statusFilter: Record<string, boolean>;
  setStatusFilter: (filter: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
  dateRangeFilter: { startDate: string; endDate: string; enabled: boolean };
  setDateRangeFilter: (filter: { startDate: string; endDate: string; enabled: boolean } | ((prev: { startDate: string; endDate: string; enabled: boolean }) => { startDate: string; endDate: string; enabled: boolean })) => void;
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: (show: boolean) => void;
  getFilteredMilestones: () => Milestone[];
  setSearchTerm: (term: string) => void;
}) {
  const router = useRouter();
  const [openModal, setOpenModal] = useState<{ open: boolean; milestoneId?: string }>({ open: false });
  const [localMilestones, setLocalMilestones] = useState<Milestone[]>(milestones);

  // Sync with parent milestones
  useEffect(() => {
    setLocalMilestones(milestones);
  }, [milestones]);

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

  const handleMilestoneSelect = (milestoneId: string) => {
    const newSelected = new Set(selectedMilestones);
    if (newSelected.has(milestoneId)) {
      newSelected.delete(milestoneId);
    } else {
      newSelected.add(milestoneId);
    }
    setSelectedMilestones(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedMilestones.size === localMilestones.length) {
      setSelectedMilestones(new Set());
    } else {
      setSelectedMilestones(new Set(localMilestones.map(m => m._id)));
    }
  };

  return (
    <Card sx={{ mt: 4 }}>
      <CardContent>
        {/* Search and Filter Bar */}
        <Box sx={{ mb: 3 }}>
          <Stack spacing={2}>
            {/* Main Search Row */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
              <Tooltip title="Ctrl+K để focus, Esc để xóa">
                <TextField
                  fullWidth
                  placeholder="Tìm kiếm milestone hoặc feature... (Ctrl+K)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm && (
                      <InputAdornment position="end">
                        <Button
                          size="small"
                          onClick={() => setSearchTerm("")}
                          sx={{ minWidth: 'auto', p: 0.5 }}
                        >
                          <ClearIcon fontSize="small" />
                        </Button>
                      </InputAdornment>
                    ),
                  }}
                  size="small"
                />
              </Tooltip>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FilterListIcon />}
                endIcon={showAdvancedFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                sx={{ minWidth: 'auto' }}
              >
                <Typography variant="body2">Bộ lọc</Typography>
              </Button>
            </Stack>

            {/* Advanced Filters */}
            <Collapse in={showAdvancedFilters}>
              <Box sx={{ pt: 2 }}>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={3}>
                  {/* Status Filter */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                      <FilterListIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                      Trạng thái
                    </Typography>
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      {['Planned', 'In Progress', 'Completed', 'Overdue'].map(status => (
                        <FormControlLabel
                          key={status}
                          control={
                            <MUICheckbox
                              size="small"
                              checked={statusFilter[status] !== false}
                              onChange={(e) => setStatusFilter((prev: Record<string, boolean>) => ({ ...prev, [status]: e.target.checked }))}
                            />
                          }
                          label={status}
                          sx={{ minWidth: 'auto' }}
                        />
                      ))}
                    </Stack>
                  </Box>

                  {/* Date Range Filter */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                      <DateRangeIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                      Khoảng thời gian
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                      <FormControlLabel
                        control={
                          <MUICheckbox
                            size="small"
                            checked={dateRangeFilter.enabled}
                            onChange={(e) => setDateRangeFilter((prev: { startDate: string; endDate: string; enabled: boolean }) => ({ ...prev, enabled: e.target.checked }))}
                          />
                        }
                        label="Bật lọc theo ngày"
                      />
                      <TextField
                        type="date"
                        size="small"
                        label="Từ ngày"
                        value={dateRangeFilter.startDate}
                        onChange={(e) => setDateRangeFilter((prev: { startDate: string; endDate: string; enabled: boolean }) => ({ ...prev, startDate: e.target.value }))}
                        disabled={!dateRangeFilter.enabled}
                        sx={{ minWidth: 150 }}
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        type="date"
                        size="small"
                        label="Đến ngày"
                        value={dateRangeFilter.endDate}
                        onChange={(e) => setDateRangeFilter((prev: { startDate: string; endDate: string; enabled: boolean }) => ({ ...prev, endDate: e.target.value }))}
                        disabled={!dateRangeFilter.enabled}
                        sx={{ minWidth: 150 }}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Stack>
                  </Box>

                  {/* Filter Actions */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setStatusFilter({ Planned: true, 'In Progress': true, Completed: true, Overdue: true });
                        setDateRangeFilter({ startDate: '', endDate: '', enabled: false });
                      }}
                    >
                      Reset
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => setShowAdvancedFilters(false)}
                    >
                      Áp dụng
                    </Button>
                  </Box>
                </Stack>
              </Box>
            </Collapse>

            {/* Search Results Summary */}
            {(searchTerm || showAdvancedFilters) && (
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                <Typography variant="body2" color="text.secondary">
                  Kết quả: {getFilteredMilestones().length} milestone{getFilteredMilestones().length !== 1 ? 's' : ''}
                </Typography>
                {(searchTerm || dateRangeFilter.enabled || Object.values(statusFilter).some(v => !v)) && (
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter({ Planned: true, 'In Progress': true, Completed: true, Overdue: true });
                      setDateRangeFilter({ startDate: '', endDate: '', enabled: false });
                    }}
                    startIcon={<ClearIcon />}
                  >
                    Xóa tất cả bộ lọc
                  </Button>
                )}
              </Stack>
            )}
          </Stack>
        </Box>

        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Danh sách Milestones
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tổng cộng {milestones.length} milestones
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            onClick={handleSelectAll}
            sx={{ minWidth: 'auto' }}
          >
            {selectedMilestones.size === localMilestones.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
          </Button>
        </Box>

        {localMilestones.length === 0 ? (
          <Box textAlign="center" py={6}>
            <Typography variant="body2" color="text.secondary">
              Chưa có milestone nào
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {localMilestones.map((milestone) => (
              <Paper
                key={milestone._id}
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  borderColor: selectedMilestones.has(milestone._id) ? 'primary.main' : undefined,
                  bgcolor: selectedMilestones.has(milestone._id) ? 'primary.light' : undefined,
                  '&:hover': {
                    bgcolor: selectedMilestones.has(milestone._id) ? 'primary.light' : 'action.hover',
                    borderColor: 'primary.main',
                    boxShadow: 2,
                  }
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box display="flex" alignItems="flex-start" gap={2} flex={1}>
                    <MUICheckbox
                      checked={selectedMilestones.has(milestone._id)}
                      onChange={() => handleMilestoneSelect(milestone._id)}
                      sx={{ mt: -0.5 }}
                    />
                    <Box flex={1}>
                      <Box display="flex" alignItems="center" gap={2} mb={1}>
                        <Typography variant="h6" fontWeight={600} color="primary">
                          {searchTerm && highlightText ? highlightText(milestone.title, searchTerm) : milestone.title}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} mb={1}>
                        {milestone.tags && milestone.tags.slice(0, 3).map((tag, idx) => (
                          <Chip
                            key={idx}
                            label={tag}
                            size="small"
                            sx={{ height: 22, fontSize: '0.75rem' }}
                          />
                        ))}
                        {milestone.tags && milestone.tags.length > 3 && (
                          <Chip
                            label={`+${milestone.tags.length - 3}`}
                            size="small"
                            variant="outlined"
                            sx={{ height: 22, fontSize: '0.75rem' }}
                          />
                        )}
                      </Stack>
                      {milestone.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {milestone.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    {milestone.progress && (
                      <Chip
                        label={`${milestone.progress.overall}%`}
                        color={getProgressColor(milestone.progress.overall)}
                        size="medium"
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                    <Tooltip title="Chỉnh sửa milestone">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenModal({ open: true, milestoneId: milestone._id });
                        }}
                        sx={{ minWidth: 'auto' }}
                      >
                        Edit
                      </Button>
                    </Tooltip>
                  </Stack>
                </Box>

                <Box display="flex" flexWrap="wrap" gap={3} mb={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CalendarTodayIcon fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(milestone.start_date)} {milestone.deadline ? ` → ${formatDate(milestone.deadline)}` : ''}
                    </Typography>
                  </Box>
                  {milestone.progress && milestone.progress.by_feature && (
                    <Box display="flex" alignItems="center" gap={1}>
                      <AssignmentIcon fontSize="small" color="info" />
                      <Typography variant="caption" color="text.secondary">
                        {milestone.progress.by_feature.length} features
                      </Typography>
                    </Box>
                  )}
                </Box>

                {milestone.progress && (
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="caption" color="text.secondary">
                        Tiến độ tổng thể
                      </Typography>
                      <Typography variant="caption" fontWeight={600}>
                        {milestone.progress.overall}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={milestone.progress.overall}
                      color={getProgressColor(milestone.progress.overall)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                )}
              </Paper>
            ))}
          </Stack>
        )}

        {/* Modal for editing milestone */}
        {openModal.open && openModal.milestoneId && (
          <ModalMilestone
            open={openModal.open}
            onClose={() => setOpenModal({ open: false })}
            projectId={projectId}
            milestoneId={openModal.milestoneId}
            onUpdate={async () => {
              // Refresh the specific milestone data
              try {
                const [milestoneRes, progressRes] = await Promise.all([
                  axiosInstance.get(`/api/projects/${projectId}/milestones/${openModal.milestoneId}`),
                  axiosInstance.get(`/api/projects/${projectId}/milestones/${openModal.milestoneId}/progress`).catch(() => ({ data: { progress: null } }))
                ]);
                const updatedMilestone = { ...milestoneRes.data, progress: progressRes.data?.progress || null };
                // Update the milestone in the local list
                setLocalMilestones((prev) =>
                  prev.map((m) => (m._id === openModal.milestoneId ? updatedMilestone : m))
                );
              } catch (e) {
                console.error('Failed to refresh milestone:', e);
              }
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}

