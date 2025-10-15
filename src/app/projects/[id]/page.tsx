"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "../../../../ultis/axios";
import { getStartOfWeekUTC, addDays } from "@/lib/timeline";  
import ResponsiveSidebar from "@/components/ResponsiveSidebar"; 
import GanttChart from "@/components/GanttChart";
import ModalMilestone from "@/components/ModalMilestone";
import { Button, Popover, FormGroup, FormControlLabel, Checkbox as MUICheckbox, Select as MUISelect, MenuItem, Typography, Box, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, LinearProgress, Stack, TextField, InputAdornment, Tooltip } from "@mui/material";
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
import VisibilityIcon from "@mui/icons-material/Visibility";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ArchiveIcon from "@mui/icons-material/Archive";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";

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
  const [milestoneFeatures, setMilestoneFeatures] = useState<Record<string, any[]>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"all" | "milestone" | "feature">("all");
  const [selectedMilestones, setSelectedMilestones] = useState<Set<string>>(new Set());
  const [showToolbar, setShowToolbar] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    (async () => {
      try {
        const res = await axiosInstance.get(`/api/projects/${projectId}/milestones`);
        const milestonesData = Array.isArray(res.data) ? res.data : [];
        
        // Lấy tiến độ chi tiết cho từng milestone
        const milestonesWithProgress = await Promise.all(
          milestonesData.map(async (milestone: any) => {
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
        const featuresMap: Record<string, any[]> = {};
        for (const milestone of milestonesWithProgress) {
          if (milestone.progress?.by_feature) {
            featuresMap[milestone._id] = milestone.progress.by_feature;
          }
        }
        setMilestoneFeatures(featuresMap);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Không thể tải milestone');
        toast.error(`Lỗi tải dữ liệu: ${e?.response?.data?.message || e.message}`);
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
    if (!milestones || !searchTerm) return milestones || [];
    
    const term = searchTerm.toLowerCase();
    
    if (searchType === "milestone") {
      return milestones.filter(milestone => 
        milestone.title.toLowerCase().includes(term) ||
        milestone.description?.toLowerCase().includes(term)
      );
    }
    
    if (searchType === "feature") {
      const filteredMilestoneIds = new Set<string>();
      Object.entries(milestoneFeatures).forEach(([milestoneId, features]) => {
        const hasMatchingFeature = features.some(feature =>
          feature.feature_title.toLowerCase().includes(term)
        );
        if (hasMatchingFeature) {
          filteredMilestoneIds.add(milestoneId);
        }
      });
      
      return milestones.filter(milestone => filteredMilestoneIds.has(milestone._id));
    }
    
    // searchType === "all"
    const filteredMilestoneIds = new Set<string>();
    
    // Search in milestone titles/descriptions
    milestones.forEach(milestone => {
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
    
    return milestones.filter(milestone => filteredMilestoneIds.has(milestone._id));
  };

  const getFilteredMilestoneFeatures = () => {
    if (!searchTerm || searchType === "milestone") return milestoneFeatures;
    
    const term = searchTerm.toLowerCase();
    const filtered: Record<string, any[]> = {};
    
    Object.entries(milestoneFeatures).forEach(([milestoneId, features]) => {
      if (searchType === "feature") {
        const matchingFeatures = features.filter(feature =>
          feature.feature_title.toLowerCase().includes(term)
        );
        if (matchingFeatures.length > 0) {
          filtered[milestoneId] = matchingFeatures;
        }
      } else {
        // searchType === "all" - include all features for matching milestones
        filtered[milestoneId] = features;
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
        milestonesData.map(async (milestone: any) => {
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
    } catch (error: any) {
      console.error('Error duplicating milestones:', error);
      toast.dismiss(loadingToast);
      toast.error(`Lỗi khi sao chép: ${error?.response?.data?.message || error.message}`);
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
    } catch (error: any) {
      console.error('Error exporting milestones:', error);
      toast.dismiss(loadingToast);
      toast.error(`Lỗi khi xuất: ${error?.response?.data?.message || error.message}`);
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
        milestonesData.map(async (milestone: any) => {
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
    } catch (error: any) {
      console.error('Error archiving milestones:', error);
      toast.dismiss(loadingToast);
      toast.error(`Lỗi khi lưu trữ: ${error?.response?.data?.message || error.message}`);
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
        milestonesData.map(async (milestone: any) => {
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
    } catch (error: any) {
      console.error('Error deleting milestones:', error);
      toast.dismiss(loadingToast);
      toast.error(`Lỗi khi xóa: ${error?.response?.data?.message || error.message}`);
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
    <div className="min-h-screen bg-[var(--background)]">
      <ResponsiveSidebar />
      <main className="p-4 md:p-6 md:ml-64">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-6 md:mb-8 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-[10px] md:text-xs uppercase tracking-wider text-foreground/60">Dự án</div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">Milestones</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="contained" size="medium" startIcon={<AddIcon />} onClick={() => router.push(`/projects/${projectId}/milestones/new`)}>
                Thêm Milestone
              </Button>
              <Button variant="outlined" size="medium" onClick={() => router.push(`/projects/${projectId}/features`)}>
                Features
              </Button>
              <Button variant="contained" color="secondary" size="medium" onClick={() => router.push(`/projects/${projectId}/monitoring`)}>
                Monitoring
              </Button>
              <Button variant="outlined" size="medium" startIcon={<ArrowBackIcon />} onClick={() => router.back()}>
                Quay lại
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
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
                <MUISelect
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as any)}
                  size="small"
                  sx={{ minWidth: 140 }}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="milestone">Milestone</MenuItem>
                  <MenuItem value="feature">Feature</MenuItem>
                </MUISelect>
                {searchTerm && (
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Tìm kiếm: "{searchTerm}"
                    </Typography>
                    <Chip 
                      label={`${getFilteredMilestones().length} milestone${getFilteredMilestones().length !== 1 ? 's' : ''}`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip 
                      label={`${Object.values(getFilteredMilestoneFeatures()).flat().length} feature${Object.values(getFilteredMilestoneFeatures()).flat().length !== 1 ? 's' : ''}`}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Action Toolbar */}
          {showToolbar && (
            <Card sx={{ 
              mb: 3, 
              bgcolor: '#E3F2FD', 
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
            <div className="rounded-xl border border-[var(--border)] p-6 bg-[color-mix(in_olab,_var(--accent)_10%,_var(--background))] animate-pulse">
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
                        Không có milestone hoặc feature nào khớp với từ khóa "{searchTerm}"
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
                  <Timeline 
                    milestones={getFilteredMilestones()} 
                    projectId={projectId} 
                    onLocalUpdate={setMilestones as any}
                    searchTerm={searchTerm}
                  />
                  <MilestoneFeaturesTable 
                    milestones={getFilteredMilestones()} 
                    milestoneFeatures={getFilteredMilestoneFeatures()}
                    searchTerm={searchTerm}
                    highlightText={highlightText}
                    projectId={projectId}
                  />
                  <MilestonesList 
                    milestones={getFilteredMilestones()}
                    projectId={projectId}
                    searchTerm={searchTerm}
                    highlightText={highlightText}
                    selectedMilestones={selectedMilestones}
                    setSelectedMilestones={setSelectedMilestones}
                  />
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function Timeline({ milestones, projectId, onLocalUpdate, searchTerm }: { milestones: Milestone[]; projectId: string; onLocalUpdate: any; searchTerm?: string }) {
  const router = useRouter();
  const [weekStart, setWeekStart] = useState<Date>(getStartOfWeekUTC(new Date()));
  const [viewMode, setViewMode] = useState<'Days' | 'Weeks' | 'Months' | 'Quarters'>('Days');
  const [autoFit, setAutoFit] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<Record<string, boolean>>({
    Planned: true,
    'In Progress': true,
    Completed: true,
    Overdue: true,
  });
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null);
  const [openModal, setOpenModal] = useState<{open: boolean; milestoneId?: string}>({open:false});
  if (!milestones || milestones.length === 0) {
    return <div className="opacity-70">Chưa có milestone nào.</div>;
  }

  return (
    <div className="w-full">
      <div className="sticky top-0 z-10 -mx-4 md:-mx-6 mb-4 bg-[color-mix(in_olab,_var(--background)_80%,_transparent)]/80 backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_olab,_var(--background)_70%,_transparent)] px-4 md:px-6 py-3 border-b border-[var(--border)]">
        <div className="flex flex-wrap items-center gap-3">
          <MUISelect
            value={viewMode}
            onChange={(e: any) => setViewMode(e.target.value as any)}
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
            control={<MUICheckbox size="small" checked={autoFit} onChange={(e: any) =>setAutoFit(e.target.checked)} />}
            label={<Typography variant="body2">Auto Fit</Typography>}
          />
          <div className="md:ml-2">
            <Button
              variant="outlined"
              size="small"
              onClick={(e: any)=>{ setFilterAnchor(e.currentTarget); setFilterOpen(true); }}
            >
              Bộ lọc
            </Button>
            <Popover
              open={filterOpen}
              anchorEl={filterAnchor}
              onClose={()=>setFilterOpen(false)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{ paper: { sx: { p: 2, width: 280 } } }}
            >
              <Typography variant="overline" sx={{ opacity: 0.7 }}>Trạng thái</Typography>
              <FormGroup sx={{ mt: 1 }}>
                {['Planned','In Progress','Completed','Overdue'].map(s => (
                  <FormControlLabel
                    key={s}
                    control={<MUICheckbox checked={!!statusFilter[s]} onChange={(e: any)=> setStatusFilter(prev => ({...prev, [s]: e.target.checked}))} />}
                    label={s}
                  />
                ))}
              </FormGroup>
              <Box sx={{ display:'flex', justifyContent:'flex-end', gap:1, mt:2 }}>
                <Button size="small" variant="outlined" onClick={()=>setStatusFilter({Planned:true,'In Progress':true,Completed:true,Overdue:true})}>Chọn hết</Button>
                <Button size="small" variant="outlined" onClick={()=>setStatusFilter({Planned:false,'In Progress':false,Completed:false,Overdue:false})}>Bỏ hết</Button>
                <Button size="small" variant="contained" onClick={()=>setFilterOpen(false)}>Áp dụng</Button>
              </Box>
            </Popover>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[color-mix(in_olab,_var(--accent)_8%,_var(--background))] shadow-sm">
        <div>
          <GanttChart
            milestones={(milestones || []).filter(m => m.status ? statusFilter[m.status] : true)}
            viewMode={viewMode as any}
            startDate={weekStart}
            autoFit={autoFit}
            pagingStepDays={viewMode === 'Quarters' ? 90 : viewMode === 'Months' ? 30 : viewMode === 'Weeks' ? 7 : 7}
            onRequestShift={(days) => setWeekStart(prev => addDays(prev, days))}
            onMilestoneShift={(id, deltaDays) => {
              // Local optimistic update: shift start_date and deadline by deltaDays
              onLocalUpdate((prev: Milestone[]) => {
                const shiftDate = (iso?: string) => {
                  if (!iso) return iso;
                  const d = new Date(iso);
                  d.setUTCDate(d.getUTCDate() + deltaDays);
                  return d.toISOString();
                };
                return (prev || []).map((m) => m._id === id ? ({
                  ...m,
                  start_date: shiftDate(m.start_date),
                  deadline: shiftDate(m.deadline),
                }) : m);
              });
            }}
            onMilestoneClick={(id) => setOpenModal({open:true, milestoneId: id})}
            searchTerm={searchTerm}
          />
        </div>
      </div>

      {openModal.open && openModal.milestoneId && (
        <ModalMilestone
          open={openModal.open}
          onClose={() => setOpenModal({open:false})}
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
              onLocalUpdate((prev: Milestone[]) => 
                (prev || []).map(m => m._id === openModal.milestoneId ? updatedMilestone : m)
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

function MilestoneFeaturesTable({ 
  milestones, 
  milestoneFeatures, 
  searchTerm, 
  highlightText,
  projectId
}: { 
  milestones: Milestone[]; 
  milestoneFeatures: Record<string, any[]>; 
  searchTerm?: string;
  highlightText?: (text: string, searchTerm: string) => any;
  projectId: string;
}) {
  const router = useRouter();
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

  // Tính tổng số features
  const totalFeatures = Object.values(milestoneFeatures).reduce((sum, features) => sum + features.length, 0);

  if (totalFeatures === 0) {
    return (
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Chi tiết Features theo Milestone
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" py={4}>
            Chưa có feature nào được liên kết với milestone
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Chi tiết Features theo Milestone
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Tổng cộng {totalFeatures} features được phân bổ trong {milestones.length} milestones
        </Typography>

        {milestones.map((milestone) => {
          const features = milestoneFeatures[milestone._id] || [];
          if (features.length === 0) return null;

          return (
            <Box key={milestone._id} sx={{ mb: 4 }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {milestone.title}
                </Typography>
                <Chip
                  label={milestone.status || "Planned"}
                  color={getStatusColor(milestone.status)}
                  size="small"
                />
                <Chip
                  label={`${features.length} features`}
                  variant="outlined"
                  size="small"
                />
                {milestone.progress && (
                  <Chip
                    label={`${milestone.progress.overall}%`}
                    color={getProgressColor(milestone.progress.overall)}
                    size="small"
                  />
                )}
                {milestone.progress && milestone.progress.overall === 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    (Chưa có task/function)
                  </Typography>
                )}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => router.push(`/projects/${projectId}/milestones/${milestone._id}/features`)}
                  sx={{ ml: 'auto' }}
                >
                  Xem Features
                </Button>
              </Stack>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Feature Title</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">Tasks</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">Functions</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">Tiến độ</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">Progress Bar</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {features.map((feature) => (
                      <TableRow key={feature.feature_id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {searchTerm && highlightText ? highlightText(feature.feature_title, searchTerm) : feature.feature_title}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
                            <AssignmentIcon fontSize="small" color="info" />
                            <Typography variant="body2">
                              {feature.task_count > 0 ? `${feature.completed_tasks}/${feature.task_count}` : 'Chưa có task'}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
                            <FunctionsIcon fontSize="small" color="secondary" />
                            <Typography variant="body2">
                              {feature.function_count > 0 ? `${feature.completed_functions}/${feature.function_count}` : 'Chưa có function'}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${feature.percentage}%`}
                            color={getProgressColor(feature.percentage)}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell>
                          <LinearProgress
                            variant="determinate"
                            value={feature.percentage}
                            color={getProgressColor(feature.percentage)}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          );
        })}
      </CardContent>
    </Card>
  );
}

function MilestonesList({
  milestones,
  projectId,
  searchTerm,
  highlightText,
  selectedMilestones,
  setSelectedMilestones
}: {
  milestones: Milestone[];
  projectId: string;
  searchTerm?: string;
  highlightText?: (text: string, searchTerm: string) => any;
  selectedMilestones: Set<string>;
  setSelectedMilestones: (selected: Set<string>) => void;
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
                        {milestone.code && (
                          <Chip
                            label={milestone.code}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        {milestone.status && (
                          <Chip
                            label={milestone.status}
                            size="small"
                            color={getStatusColor(milestone.status)}
                          />
                        )}
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
                    <Tooltip title="Xem chi tiết features">
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/projects/${projectId}/milestones/${milestone._id}/features`);
                        }}
                      >
                        Detail
                      </Button>
                    </Tooltip>
                  </Stack>
                </Box>

                <Box display="flex" flexWrap="wrap" gap={3} mb={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CalendarTodayIcon fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(milestone.start_date)} - {formatDate(milestone.deadline)}
                    </Typography>
                  </Box>
                  {milestone.estimated_effort && milestone.estimated_effort > 0 && (
                    <Box display="flex" alignItems="center" gap={1}>
                      <AccessTimeIcon fontSize="small" color="info" />
                      <Typography variant="caption" color="text.secondary">
                        Ước tính: {milestone.estimated_effort}h
                      </Typography>
                    </Box>
                  )}
                  {milestone.actual_effort && milestone.actual_effort > 0 && (
                    <Box display="flex" alignItems="center" gap={1}>
                      <AccessTimeIcon fontSize="small" color="warning" />
                      <Typography variant="caption" color="text.secondary">
                        Thực tế: {milestone.actual_effort}h
                      </Typography>
                    </Box>
                  )}
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

