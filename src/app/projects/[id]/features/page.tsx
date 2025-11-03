"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "../../../../../ultis/axios";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";
import GanttChart from "@/components/GanttChart";
import { getStartOfWeekUTC, addDays } from "@/lib/timeline";
import ModalMilestone from "@/components/ModalMilestone";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Avatar,
  AvatarGroup,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  LinearProgress,
  Tooltip,
  TextField,
  Typography,
  Paper,
  Divider,
  Checkbox,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import FunctionsIcon from "@mui/icons-material/Functions";
import CreateMilestoneFromFeatures from "@/components/CreateMilestoneFromFeatures";

type Milestone = {
  _id: string;
  title: string;
  start_date?: string;
  deadline?: string;
  status?: string;
};

type Setting = {
  _id: string;
  name: string;
  value?: string;
};

type User = {
  _id: string;
  full_name?: string;
  email?: string;
};

type Feature = {
  _id?: string;
  title: string;
  description?: string;
  plan_effort?: string;
  estimated_hours?: number;
  actual_effort?: number;
  priority_id?: Setting | string;
  status_id?: Setting | string;
  complexity_id?: Setting | string;
  created_by?: User | string;
  reviewer_id?: User | string;
  last_updated_by?: User | string;
  start_date?: string;
  due_date?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  // UI-only convenience
  milestone_ids?: string[];
};

// Mock data for display  


export default function ProjectFeaturesPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Settings for dropdowns
  const [priorities, setPriorities] = useState<Setting[]>([]);
  const [statuses, setStatuses] = useState<Setting[]>([]);
  const [complexities, setComplexities] = useState<Setting[]>([]);
  
  // Project data with man_days
  const [projectData, setProjectData] = useState<{ man_days?: number; topic?: string; start_date?: string; end_date?: string } | null>(null);
  
  // Team data for capacity calculation
  const [teamData, setTeamData] = useState<{ team_members?: { total?: number } } | null>(null);

  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState<Feature>({ 
    title: "", 
    description: "", 
    plan_effort: "",
    estimated_hours: 0,
    milestone_ids: [],
    start_date: "",
    due_date: "",
    tags: []
  });

  // Chart controls
  const [weekStart, setWeekStart] = useState<Date>(getStartOfWeekUTC(new Date()));
  const [viewMode, setViewMode] = useState<'Days' | 'Weeks' | 'Months' | 'Quarters'>('Weeks');
  const [autoFit, setAutoFit] = useState<boolean>(true);
  const [detailMode, setDetailMode] = useState<boolean>(false);
  const [milestoneModal, setMilestoneModal] = useState<{ open: boolean; milestoneId?: string }>({ open: false });
  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{
    title?: string;
    description?: string;
    plan_effort?: string;
    estimated_hours?: number;
    start_date?: string;
    due_date?: string;
  }>({ title: "", description: "", plan_effort: "", estimated_hours: 0, start_date: "", due_date: "" });

  // Feature selection for milestone creation
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([]);
  const [openMilestoneFromFeaturesDialog, setOpenMilestoneFromFeaturesDialog] = useState(false);
  
  // Feature detail dialog
  const [selectedFeatureDetail, setSelectedFeatureDetail] = useState<Feature | null>(null);
  const [openFeatureDetail, setOpenFeatureDetail] = useState(false);
  
  // Effort allocation suggestions
  const [allocationSuggestions, setAllocationSuggestions] = useState<any>(null);
  const [openAllocationDialog, setOpenAllocationDialog] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  // Estimated hours suggestion based on complexity
  const getEstimatedHoursByComplexity = (complexityId: string | Setting | undefined) => {
    if (!complexityId) return 0;
    
    // Handle both string ID and Setting object
    const id = typeof complexityId === 'string' ? complexityId : complexityId._id;
    const complexity = complexities.find(c => c._id === id);
    if (!complexity || !complexity.value) return 0;
    
    // Map complexity to estimated hours
    const hoursByComplexity: { [key: string]: number } = {
      'simple': 20,      // Simple: 20h (2-3 days)
      'medium': 40,      // Medium: 40h (1 week)
      'complex': 80,     // Complex: 80h (2 weeks)
      'very-complex': 160 // Very Complex: 160h (4 weeks)
    };
    
    return hoursByComplexity[complexity.value] || 0;
  };

  const formatRelative = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const ms = Date.now() - d.getTime();
    const sec = Math.floor(ms / 1000);
    const min = Math.floor(sec / 60);
    const hr = Math.floor(min / 60);
    const day = Math.floor(hr / 24);
    if (day > 0) return `${day} day${day>1?'s':''} ago`;
    if (hr > 0) return `${hr} hour${hr>1?'s':''} ago`;
    if (min > 0) return `${min} minute${min>1?'s':''} ago`;
    return `just now`;
  };

  useEffect(() => {
    if (!projectId) return;
    (async () => {
      try {
        setLoading(true);
        const [projectRes, teamRes, milestoneRes, featureRes, priorityRes, statusRes, complexityRes] = await Promise.all([
          axiosInstance.get(`/api/projects/${projectId}`).catch(() => ({ data: null })),
          axiosInstance.get(`/api/projects/${projectId}/team-members`).catch(() => ({ data: null })),
          axiosInstance.get(`/api/projects/${projectId}/milestones`).catch(() => ({ data: null })),
          axiosInstance.get(`/api/projects/${projectId}/features`).catch(() => ({ data: null })),
          axiosInstance.get(`/api/settings/by-type/1`).catch(() => ({ data: [] })), // Priority
          axiosInstance.get(`/api/settings/by-type/2`).catch(() => ({ data: [] })), // Status
          axiosInstance.get(`/api/settings/by-type/3`).catch(() => ({ data: [] })), // Complexity
        ]);
        
        // Set project data
        setProjectData(projectRes.data);
        
        // Set team data
        setTeamData(teamRes.data || null);
        
        // Debug logging
        console.log('🔍 Team data:', teamRes.data);
        console.log('🔍 Project data:', projectRes.data);
        
        const milestonesList = Array.isArray(milestoneRes.data) && milestoneRes.data.length > 0 ? milestoneRes.data : [];
        setMilestones(milestonesList);

        // Set settings
        setPriorities(Array.isArray(priorityRes.data) ? priorityRes.data : []);
        setStatuses(Array.isArray(statusRes.data) ? statusRes.data : []);
        setComplexities(Array.isArray(complexityRes.data) ? complexityRes.data : []);
        
        // Debug logging
        console.log('Settings loaded:', {
          priorities: priorityRes.data,
          statuses: statusRes.data,
          complexities: complexityRes.data
        });

        if (Array.isArray(featureRes.data)) {
          // Enrich features with linked milestone ids
          const enriched: Feature[] = await Promise.all(
            featureRes.data.map(async (f: any) => {
              try {
                const linkRes = await axiosInstance.get(`/api/features/${f._id}/milestones`);
                // Loại bỏ duplicates
                const uniqueMilestoneIds = Array.isArray(linkRes.data) ? [...new Set(linkRes.data)] : [];
                return { ...f, milestone_ids: uniqueMilestoneIds } as Feature;
              } catch {
                return { ...f, milestone_ids: [] } as Feature;
              }
            })
          );
          console.log('Enriched features:', enriched);
          setFeatures(enriched);
        } else {
          // Fallback: localStorage or mock
          const key = `features:${projectId}`;
          const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
          if (raw) {
            setFeatures(JSON.parse(raw) as Feature[]);
          } 
        }
      } catch (e: any) {
        // Fallback to mock data
      
        setError(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  // Persist features to localStorage whenever they change
  useEffect(() => {
    if (!projectId) return;
    const key = `features:${projectId}`;
    if (features && features.length > 0) {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(features));
      }
    }
  }, [projectId, features]);

  const milestoneOptions = useMemo(() => milestones.map(m => ({ id: m._id, label: m.title })), [milestones]);

  // Calculate project capacity and usage
  const capacityInfo = useMemo(() => {
    const hoursPerDay = projectData?.man_days || 0; // Giờ làm việc mỗi ngày của 1 người
    const teamMemberCount = teamData?.team_members?.total || 0; // Số người trong team
    
    // Tính số ngày dự án
    const projectDurationDays = projectData?.start_date && projectData?.end_date 
      ? Math.ceil((new Date(projectData.end_date).getTime() - new Date(projectData.start_date).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    
    // Total Capacity = số người × giờ mỗi ngày × số ngày dự án
    const totalCapacityHours = teamMemberCount * hoursPerDay * projectDurationDays;
    
    const usedHours = features.reduce((sum, f) => sum + (f.estimated_hours || 0), 0);
    const remainingHours = totalCapacityHours - usedHours;
    const usagePercentage = totalCapacityHours > 0 ? (usedHours / totalCapacityHours) * 100 : 0;
    
    return {
      hoursPerDay,
      teamMemberCount,
      projectDurationDays,
      totalCapacityHours,
      usedHours,
      remainingHours,
      usagePercentage
    };
  }, [projectData, teamData, features]);

  // Compute progress per feature: % milestones completed
  const featureProgress = useMemo(() => {
    const statusById = new Map(milestones.map(m => [m._id, m.status] as const));
    const map = new Map<string, number>();
    features.forEach(f => {
      const ids = f.milestone_ids || [];
      if (!ids.length) { map.set(f._id as string, 0); return; }
      const total = ids.length;
      const completed = ids.reduce((acc, id) => acc + (statusById.get(id) === 'Completed' ? 1 : 0), 0);
      map.set(f._id as string, Math.round((completed / total) * 100));
    });
    return map;
  }, [features, milestones]);

  // Derive feature bars from linked milestones (min start -> max deadline)
  const featureBars = useMemo(() => {
    const byId = new Map(milestones.map(m => [m._id, m] as const));
    return features.map((f) => {
      const linked = (f.milestone_ids || []).map(id => byId.get(id)).filter(Boolean) as Milestone[];
      const start = linked.reduce<string | undefined>((acc, m) => {
        if (!m.start_date) return acc;
        return !acc || new Date(m.start_date) < new Date(acc) ? m.start_date : acc;
      }, undefined);
      const end = linked.reduce<string | undefined>((acc, m) => {
        if (!m.deadline) return acc;
        return !acc || new Date(m.deadline) > new Date(acc) ? m.deadline : acc;
      }, undefined);
      const pct = featureProgress.get(f._id as string) ?? 0;
      return {
        _id: f._id as string,
        title: `${f.title}${linked.length ? ` (${linked.length})` : ''} • ${pct}%`,
        start_date: start,
        deadline: end,
      };
    });
  }, [features, milestones, featureProgress]);

  // Expand to detailed chart rows per milestone when detailMode is on
  const chartRows = useMemo(() => {
    if (!detailMode) return featureBars;
    const byId = new Map(milestones.map(m => [m._id, m] as const));
    const rows: { _id: string; title: string; start_date?: string; deadline?: string }[] = [];
    features.forEach((f) => {
      const ids = f.milestone_ids || [];
      ids.forEach((mid) => {
        const m = byId.get(mid);
        if (m) {
          rows.push({
            _id: m._id,
            title: `${f.title} • ${m.title}`,
            start_date: m.start_date,
            deadline: m.deadline,
          });
        }
      });
    });
    return rows.length ? rows : featureBars;
  }, [detailMode, featureBars, features, milestones]);

  const handleOpenForm = () => {
    setForm({ 
      title: "", 
      description: "", 
      plan_effort: "",
      estimated_hours: 0,
      milestone_ids: [],
      start_date: "",
      due_date: "",
      tags: []
    });
    setOpenForm(true);
  };

  const handleCreateFeature = async () => {
    try {
      // Gọi backend tạo feature
      const payload = {
        title: form.title,
        description: form.description,
        plan_effort: form.plan_effort,
        estimated_hours: form.estimated_hours || 0,
        priority_id: form.priority_id,
        status_id: form.status_id,
        complexity_id: form.complexity_id,
        reviewer_id: form.reviewer_id,
        start_date: form.start_date,
        due_date: form.due_date,
        tags: form.tags || [],
        milestone_ids: form.milestone_ids || [],
      };
      console.log('Creating feature with payload:', payload);
      const res = await axiosInstance.post(`/api/projects/${projectId}/features`, payload);
      console.log('Feature created response:', res.data);
      const created = res.data;
      
      // Link milestones nếu có
      let milestone_ids: string[] = form.milestone_ids || [];
      if (milestone_ids.length > 0) {
        try {
          await axiosInstance.post(`/api/features/${created._id}/milestones`, {
            milestone_ids: milestone_ids
          });
        } catch (err) {
          console.error('Error linking milestones:', err);
        }
      }
      
      setFeatures(prev => [{ ...created, milestone_ids }, ...prev]);
      setOpenForm(false);
      setForm({ 
        title: "", 
        description: "", 
        plan_effort: "",
        estimated_hours: 0,
        milestone_ids: [],
        start_date: "",
        due_date: "",
        tags: []
      });
    } catch (e: any) {
      setError(e?.response?.data?.message || "Không thể tạo feature");
    }
  };

  const startEditCell = (f: Feature, field: string) => {
    setEditingId(f._id as string);
    setEditingField(field);
    setEditDraft({
      title: f.title,
      description: f.description,
      plan_effort: f.plan_effort,
      estimated_hours: f.estimated_hours,
      start_date: f.start_date,
      due_date: f.due_date
    });
  };
  const cancelEditRow = () => {
    setEditingId(null);
    setEditingField(null);
    setEditDraft({ title: "", description: "", plan_effort: "", estimated_hours: 0, start_date: "", due_date: "" });
  };
  const saveEditRow = async (id: string) => {
    try {
      const all: any = {
        title: editDraft.title,
        description: editDraft.description,
        plan_effort: editDraft.plan_effort,
        estimated_hours: editDraft.estimated_hours,
        start_date: editDraft.start_date,
        due_date: editDraft.due_date
      };
      const payload: any = editingField ? { [editingField]: all[editingField] } : all;
      await axiosInstance.patch(`/api/features/${id}`, payload).catch(() => null);
      setFeatures(prev => prev.map(x => {
        if (x._id !== id) return x as Feature;
        const updated: any = { ...x, updatedAt: new Date().toISOString() };
        if (editingField) {
          (updated as any)[editingField] = (all as any)[editingField];
        } else {
          Object.assign(updated, all);
        }
        return updated;
      }));
      cancelEditRow();
    } catch {}
  };

  const handleToggleFeatureSelection = (featureId: string) => {
    setSelectedFeatureIds(prev => 
      prev.includes(featureId) 
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };

  const handleToggleAllFeatures = () => {
    if (selectedFeatureIds.length === features.length) {
      setSelectedFeatureIds([]);
    } else {
      setSelectedFeatureIds(features.map(f => f._id as string));
    }
  };

  const selectedFeatures = features.filter(f => selectedFeatureIds.includes(f._id as string));

  // Fetch effort allocation suggestions
  const fetchAllocationSuggestions = async (mode: 'complexity' | 'hybrid' = 'complexity') => {
    try {
      setLoadingSuggestions(true);
      const res = await axiosInstance.post(
        `/api/projects/${projectId}/suggest-feature-allocation?mode=${mode}`
      );
      setAllocationSuggestions(res.data);
      setOpenAllocationDialog(true);
    } catch (err: any) {
      const errorData = err?.response?.data;
      let errorMessage = errorData?.message || 'Không thể lấy gợi ý phân bổ';
      
      // Add suggestion if available
      if (errorData?.suggestion) {
        errorMessage += `\n\n💡 ${errorData.suggestion}`;
      }
      
      // Add details for debugging
      if (errorData?.details) {
        console.log('❌ Allocation Error Details:', errorData.details);
      }
      
      setError(errorMessage);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Apply suggestion to a feature
  const applySuggestion = async (featureId: string, suggestedHours: number) => {
    try {
      await axiosInstance.patch(`/api/features/${featureId}`, {
        estimated_hours: suggestedHours
      });
      
      // Update local state
      setFeatures(prev => prev.map(f => 
        f._id === featureId ? { ...f, estimated_hours: suggestedHours } : f
      ));
      
      // Refresh suggestions
      await fetchAllocationSuggestions();
    } catch (err: any) {
      console.error('❌ Error applying suggestion:', err?.response?.data || err);
      setError(err?.response?.data?.message || err?.response?.data?.errors?.join(', ') || 'Không thể apply suggestion');
    }
  };

  // Apply all suggestions
  const applyAllSuggestions = async () => {
    if (!allocationSuggestions?.suggestions) return;
    
    try {
      setLoadingSuggestions(true);
      
      await Promise.all(
        allocationSuggestions.suggestions.map((s: any) =>
          axiosInstance.patch(`/api/features/${s.feature_id}`, {
            estimated_hours: s.suggested_hours
          })
        )
      );
      
      // Refresh features
      const res = await axiosInstance.get(`/api/projects/${projectId}/features`);
      if (Array.isArray(res.data)) {
        const enriched: Feature[] = await Promise.all(
          res.data.map(async (f: any) => {
            try {
              const linkRes = await axiosInstance.get(`/api/features/${f._id}/milestones`);
              const uniqueMilestoneIds = Array.isArray(linkRes.data) ? [...new Set(linkRes.data)] : [];
              return { ...f, milestone_ids: uniqueMilestoneIds } as Feature;
            } catch {
              return { ...f, milestone_ids: [] } as Feature;
            }
          })
        );
        setFeatures(enriched);
      }
      
      setOpenAllocationDialog(false);
      setAllocationSuggestions(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể apply suggestions');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <ResponsiveSidebar />
      <main className="p-4 md:p-6 md:ml-64">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-6 md:mb-8 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-[10px] md:text-xs uppercase tracking-wider text-foreground/60">Dự án</div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">Features</h1>
              {selectedFeatureIds.length > 0 && (
                <Chip 
                  label={`${selectedFeatureIds.length} features đã chọn`} 
                  color="primary" 
                  size="small"
                  onDelete={() => setSelectedFeatureIds([])}
                />
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectedFeatureIds.length > 0 && (
                <Button 
                  variant="contained" 
                  color="secondary"
                  onClick={() => setOpenMilestoneFromFeaturesDialog(true)}
                >
                  Tạo Milestone từ Features
                </Button>
              )}
              <Button 
                variant="outlined" 
                color="info"
                onClick={() => fetchAllocationSuggestions('complexity')}
                disabled={loadingSuggestions}
              >
                💡 Gợi ý phân bổ
              </Button>
              <Button variant="contained" onClick={handleOpenForm}>Tạo Feature</Button>
              <Button variant="outlined" onClick={() => router.push(`/projects/${projectId}`)}>Milestones</Button>
              <Button variant="outlined" onClick={() => router.back()}>Quay lại</Button>
            </div>
          </div>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress size={28} />
            </Box>
          ) : error ? (
            <Box className="rounded-xl border border-red-500/40 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 p-4">
              {error}
            </Box>
          ) : (
            <Stack spacing={3}>
              {/* Project Capacity Card */}
              {projectData && (
                <Paper variant="outlined" sx={{ p: 3, bgcolor: 'background.paper' }}>
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6" fontWeight={600}>
                        📊 Công suất dự án
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Chip 
                          label={`${capacityInfo.teamMemberCount} thành viên`}
                          color={capacityInfo.teamMemberCount > 0 ? "primary" : "error"}
                          size="small"
                        />
                        <Chip 
                          label={`${capacityInfo.hoursPerDay}h/ngày`}
                          color={capacityInfo.hoursPerDay > 0 ? "secondary" : "error"}
                          size="small"
                        />
                        <Chip 
                          label={`${capacityInfo.projectDurationDays} ngày`}
                          color={capacityInfo.projectDurationDays > 0 ? "info" : "error"}
                          size="small"
                        />
                      </Stack>
                    </Stack>
                    
                    {capacityInfo.totalCapacityHours > 0 ? (
                      <>
                        <Alert severity="info" sx={{ mb: 1 }}>
                          💡 Công thức: {capacityInfo.teamMemberCount} người × {capacityInfo.hoursPerDay}h/ngày × {capacityInfo.projectDurationDays} ngày = <strong>{capacityInfo.totalCapacityHours} giờ</strong>
                        </Alert>
                      </>
                    ) : (
                      <Alert severity="warning">
                        ⚠️ Không thể tính capacity. Vui lòng kiểm tra:
                        {capacityInfo.teamMemberCount === 0 && <div>• Chưa có team members (vào trang Team để thêm)</div>}
                        {!projectData.start_date && <div>• Project chưa có start_date</div>}
                        {!projectData.end_date && <div>• Project chưa có end_date</div>}
                        {capacityInfo.hoursPerDay === 0 && <div>• Project chưa có man_days (giờ làm việc/ngày)</div>}
                      </Alert>
                    )}
                    
                    {capacityInfo.totalCapacityHours > 0 && (
                      <>
                      <Stack direction="row" spacing={4} alignItems="center">
                        <Box flex={1}>
                          <Typography variant="caption" color="text.secondary">
                            Tổng công suất
                          </Typography>
                          <Typography variant="h5" fontWeight={600}>
                            {capacityInfo.totalCapacityHours} giờ
                          </Typography>
                        </Box>
                        
                        <Divider orientation="vertical" flexItem />
                        
                        <Box flex={1}>
                          <Typography variant="caption" color="text.secondary">
                            Đã phân bổ
                          </Typography>
                          <Typography variant="h5" fontWeight={600} color="primary.main">
                            {capacityInfo.usedHours} giờ
                          </Typography>
                        </Box>
                        
                        <Divider orientation="vertical" flexItem />
                        
                        <Box flex={1}>
                          <Typography variant="caption" color="text.secondary">
                            Còn lại
                          </Typography>
                          <Typography 
                            variant="h5" 
                            fontWeight={600}
                            color={capacityInfo.remainingHours < 0 ? 'error.main' : 'success.main'}
                          >
                            {capacityInfo.remainingHours} giờ
                          </Typography>
                        </Box>
                        
                        <Divider orientation="vertical" flexItem />
                        
                        <Box flex={1}>
                          <Typography variant="caption" color="text.secondary">
                            Tỷ lệ sử dụng
                          </Typography>
                          <Typography 
                            variant="h5" 
                            fontWeight={600}
                            color={
                              capacityInfo.usagePercentage > 100 ? 'error.main' : 
                            capacityInfo.usagePercentage > 80 ? 'warning.main' : 
                            'text.primary'
                          }
                        >
                          {capacityInfo.usagePercentage.toFixed(1)}%
                        </Typography>
                      </Box>
                      </Stack>
                      
                        <Box sx={{ width: '100%' }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={Math.min(capacityInfo.usagePercentage, 100)} 
                            color={
                              capacityInfo.usagePercentage > 100 ? "error" : 
                              capacityInfo.usagePercentage > 80 ? "warning" : 
                              "primary"
                            }
                            sx={{ height: 10, borderRadius: 5 }}
                          />
                        </Box>
                        
                        {capacityInfo.usagePercentage > 100 && (
                          <Alert severity="error" sx={{ mt: 1 }}>
                            ⚠️ Cảnh báo: Đã vượt quá công suất dự án {Math.abs(capacityInfo.remainingHours)} giờ ({(capacityInfo.usagePercentage - 100).toFixed(1)}%)
                          </Alert>
                        )}
                        {capacityInfo.usagePercentage > 80 && capacityInfo.usagePercentage <= 100 && (
                          <Alert severity="warning" sx={{ mt: 1 }}>
                            💡 Lưu ý: Đã sử dụng hơn 80% công suất dự án. Còn {capacityInfo.remainingHours} giờ.
                          </Alert>
                        )}
                      </>
                    )}
                  </Stack>
                </Paper>
              )}
              
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel id="view-mode-label">View</InputLabel>
                    <Select labelId="view-mode-label" label="View" value={viewMode} onChange={(e) => setViewMode(e.target.value as any)}>
                      <MenuItem value="Days">Days</MenuItem>
                      <MenuItem value="Weeks">Weeks</MenuItem>
                      <MenuItem value="Months">Months</MenuItem>
                      <MenuItem value="Quarters">Quarters</MenuItem>
                    </Select>
                  </FormControl>
                  <Button size="small" variant="outlined" onClick={() => setAutoFit(a => !a)}>
                    {autoFit ? 'Auto Fit: On' : 'Auto Fit: Off'}
                  </Button>
                  <Button size="small" variant="outlined" onClick={() => setDetailMode(d => !d)}>
                    {detailMode ? 'Chi tiết milestone: Bật' : 'Chi tiết milestone: Tắt'}
                  </Button>
                </Stack>
                <GanttChart
                  milestones={chartRows}
                  viewMode={viewMode as any}
                  startDate={weekStart}
                  autoFit={autoFit}
                  pagingStepDays={viewMode === 'Quarters' ? 90 : viewMode === 'Months' ? 30 : viewMode === 'Weeks' ? 7 : 7}
                  onRequestShift={(days) => setWeekStart(prev => addDays(prev, days))}
                  onMilestoneShift={async (rowId, deltaDays) => {
                    if (detailMode) {
                      // Shift a single milestone row directly
                      const m = milestones.find(x => x._id === rowId);
                      if (!m) return;
                      const toIso = (iso?: string) => {
                        if (!iso) return undefined;
                        const d = new Date(iso);
                        d.setUTCDate(d.getUTCDate() + deltaDays);
                        return d.toISOString();
                      };
                      setMilestones(prev => (prev || []).map(x => x._id === rowId ? ({ ...x, start_date: toIso(x.start_date), deadline: toIso(x.deadline) }) : x));
                      await axiosInstance.patch(`/api/projects/${projectId}/milestones/${rowId}`, {
                        start_date: toIso(m.start_date),
                        deadline: toIso(m.deadline),
                      }).catch(() => null);
                    } else {
                      // Shift all milestones linked to a feature bar
                      const f = features.find(x => x._id === rowId);
                      if (!f || !f.milestone_ids || f.milestone_ids.length === 0) return;
                      setMilestones(prev => (prev || []).map(m => {
                        if (!f.milestone_ids?.includes(m._id)) return m;
                        const shiftDate = (iso?: string) => {
                          if (!iso) return iso;
                          const d = new Date(iso);
                          d.setUTCDate(d.getUTCDate() + deltaDays);
                          return d.toISOString();
                        };
                        return { ...m, start_date: shiftDate(m.start_date), deadline: shiftDate(m.deadline) };
                      }));
                      const updates = (f.milestone_ids || []).map(async (mid) => {
                        const m = milestones.find(x => x._id === mid);
                        if (!m) return;
                        const toIso = (iso?: string) => {
                          if (!iso) return undefined;
                          const d = new Date(iso);
                          d.setUTCDate(d.getUTCDate() + deltaDays);
                          return d.toISOString();
                        };
                        await axiosInstance.patch(`/api/projects/${projectId}/milestones/${mid}`, {
                          start_date: toIso(m.start_date),
                          deadline: toIso(m.deadline),
                        }).catch(() => null);
                      });
                      await Promise.all(updates);
                    }
                  }}
                  onMilestoneClick={(rowId) => {
                    if (detailMode) {
                      setMilestoneModal({ open: true, milestoneId: rowId });
                    }
                  }}
                />
              </Paper>
              {/* Expanded inline editor for full model fields */}
              {/* Removed expanded editor panel; inline editing only */}
              {/* Feature Table Section - inline editors only */}
              <Paper variant="outlined" sx={{ p: 0 }}>
                <Box sx={{ overflowX: 'auto', width: '100%', '&::-webkit-scrollbar': { height: 8 }, '&::-webkit-scrollbar-thumb': { background: 'rgba(0,0,0,0.3)', borderRadius: 8 } }}>
                <Table size="small" sx={{ minWidth: 1400, '& td, & th': { borderColor: 'var(--border)' } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 44 }}>
                        <Checkbox 
                          size="small" 
                          checked={selectedFeatureIds.length === features.length && features.length > 0}
                          indeterminate={selectedFeatureIds.length > 0 && selectedFeatureIds.length < features.length}
                          onChange={handleToggleAllFeatures}
                        />
                      </TableCell>
                      <TableCell sx={{ width: 60 }}>STT</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Complexity</TableCell>
                      <TableCell sx={{ minWidth: 200 }}>Milestone</TableCell>
                      <TableCell>Estimated hours</TableCell>
                      <TableCell>Start - Due</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(features || []).map((f, idx) => {
                      const pct = featureProgress.get(f._id as string) ?? 0;
                      const owners = [
                        { id: '1', name: 'A' },
                        { id: '2', name: 'B' },
                      ];
                      const due = (() => {
                        const ids = f.milestone_ids || [];
                        if (!ids.length) return undefined;
                        const ms = milestones.filter(m => ids.includes(m._id));
                        const latest = ms.reduce<string | undefined>((acc, m) => {
                          if (!m.deadline) return acc;
                          return !acc || new Date(m.deadline) > new Date(acc) ? m.deadline : acc;
                        }, undefined);
                        return latest;
                      })();
                      const dueDateText = due ? new Date(due).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
                      const statusName = typeof f.status_id === 'object' ? f.status_id?.name : '';
                      const priorityName = typeof f.priority_id === 'object' ? f.priority_id?.name : '';
                      const statusChip = (
                        <Chip
                          size="small"
                          label={statusName || '-'}
                          sx={{
                            color: '#fff',
                            bgcolor: statusName === 'completed' ? '#22c55e' : statusName === 'in-progress' ? '#f59e0b' : '#3b82f6',
                            fontWeight: 600,
                          }}
                        />
                      );
                      return (
                        <TableRow key={f._id || idx} hover>
                          <TableCell>
                            <Checkbox 
                              size="small" 
                              checked={selectedFeatureIds.includes(f._id as string)}
                              onChange={() => handleToggleFeatureSelection(f._id as string)}
                            />
                          </TableCell>
                          <TableCell 
                            sx={{ 
                              fontWeight: 600, 
                              cursor: 'pointer',
                              color: 'primary.main',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                            onClick={async () => {
                              try {
                                // Gọi API để lấy feature detail với đầy đủ populate
                                const res = await axiosInstance.get(`/api/features/${f._id}`);
                                setSelectedFeatureDetail(res.data);
                                setOpenFeatureDetail(true);
                              } catch (err) {
                                console.error('Error loading feature detail:', err);
                                // Fallback to current data
                                setSelectedFeatureDetail(f);
                                setOpenFeatureDetail(true);
                              }
                            }}
                          >
                            {idx + 1}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }} onDoubleClick={() => startEditCell(f, 'title')}>
                            {editingId === f._id && editingField === 'title' ? (
                              <TextField
                                size="small"
                                value={editDraft.title}
                                onChange={(e) => setEditDraft(s => ({ ...s, title: e.target.value }))}
                                fullWidth
                                onBlur={() => saveEditRow(f._id as string)}
                              />
                            ) : (
                              f.title
                            )}
                          </TableCell>
                          
                          <TableCell onClick={() => startEditCell(f, 'status_id')} sx={{ cursor: 'pointer' }}>
                            {editingId === f._id && editingField === 'status_id' ? (
                              <Select
                                size="small"
                                value={typeof f.status_id === 'object' ? f.status_id?._id : (f.status_id || '')}
                                onChange={async (e) => {
                                  const newStatusId = e.target.value;
                                  try {
                                    await axiosInstance.patch(`/api/features/${f._id}`, { status_id: newStatusId });
                                    setFeatures(prev => prev.map(x => 
                                      x._id === f._id ? { ...x, status_id: statuses.find(s => s._id === newStatusId) } : x
                                    ));
                                    cancelEditRow();
                                  } catch (err) {
                                    console.error('Error updating status:', err);
                                  }
                                }}
                                onBlur={cancelEditRow}
                                autoFocus
                                fullWidth
                              >
                                {statuses.map((s) => (
                                  <MenuItem key={s._id} value={s._id}>
                                    {s.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            ) : (
                              statusChip
                            )}
                          </TableCell>
                          
                          <TableCell onClick={() => startEditCell(f, 'priority_id')} sx={{ cursor: 'pointer' }}>
                            {editingId === f._id && editingField === 'priority_id' ? (
                              <Select
                                size="small"
                                value={typeof f.priority_id === 'object' ? f.priority_id?._id : (f.priority_id || '')}
                                onChange={async (e) => {
                                  const newPriorityId = e.target.value;
                                  try {
                                    await axiosInstance.patch(`/api/features/${f._id}`, { priority_id: newPriorityId });
                                    setFeatures(prev => prev.map(x => 
                                      x._id === f._id ? { ...x, priority_id: priorities.find(p => p._id === newPriorityId) } : x
                                    ));
                                    cancelEditRow();
                                  } catch (err) {
                                    console.error('Error updating priority:', err);
                                  }
                                }}
                                onBlur={cancelEditRow}
                                autoFocus
                                fullWidth
                              >
                                {priorities.map((p) => (
                                  <MenuItem key={p._id} value={p._id}>
                                    {p.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            ) : (
                              <Chip
                                label={priorityName || '-'}
                                size="small"
                                color={
                                  priorityName === 'critical' ? 'error' :
                                  priorityName === 'high' ? 'warning' :
                                  priorityName === 'medium' ? 'primary' : 'default'
                                }
                                variant="outlined"
                              />
                            )}
                          </TableCell>
                          
                          <TableCell onClick={() => startEditCell(f, 'complexity_id')} sx={{ cursor: 'pointer' }}>
                            {editingId === f._id && editingField === 'complexity_id' ? (
                              <Select
                                size="small"
                                value={typeof f.complexity_id === 'object' ? f.complexity_id?._id : (f.complexity_id || '')}
                                onChange={async (e) => {
                                  const newComplexityId = e.target.value;
                                  try {
                                    await axiosInstance.patch(`/api/features/${f._id}`, { complexity_id: newComplexityId });
                                    setFeatures(prev => prev.map(x => 
                                      x._id === f._id ? { ...x, complexity_id: complexities.find(c => c._id === newComplexityId) } : x
                                    ));
                                    cancelEditRow();
                                  } catch (err) {
                                    console.error('Error updating complexity:', err);
                                  }
                                }}
                                onBlur={cancelEditRow}
                                autoFocus
                                fullWidth
                              >
                                {complexities.map((c) => (
                                  <MenuItem key={c._id} value={c._id}>
                                    {c.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            ) : (
                              (() => {
                                const complexityName = typeof f.complexity_id === 'object' ? f.complexity_id?.name : '';
                                return (
                                  <Chip
                                    label={complexityName || '-'}
                                    size="small"
                                    color={
                                      complexityName === 'Very Complex' ? 'error' :
                                      complexityName === 'Complex' ? 'warning' :
                                      complexityName === 'Medium' ? 'primary' : 'default'
                                    }
                                    variant="outlined"
                                  />
                                );
                              })()
                            )}
                          </TableCell>
                          
                          <TableCell onDoubleClick={() => startEditCell(f, 'milestone_ids')}>
                            {editingId === f._id && editingField === 'milestone_ids' ? (
                              <Select
                                size="small"
                                multiple
                                value={f.milestone_ids || []}
                                onChange={async (e) => {
                                  const newMilestoneIds = e.target.value as string[];
                                  try {
                                    // Xóa tất cả liên kết cũ và tạo mới
                                    await axiosInstance.delete(`/api/features/${f._id}/milestones`).catch(() => null);
                                    if (newMilestoneIds.length > 0) {
                                      await axiosInstance.post(`/api/features/${f._id}/milestones`, {
                                        milestone_ids: newMilestoneIds
                                      });
                                    }
                                    setFeatures(prev => prev.map(x => 
                                      x._id === f._id ? { ...x, milestone_ids: newMilestoneIds } : x
                                    ));
                                    setEditingId(null);
                                    setEditingField(null);
                                  } catch (err) {
                                    console.error('Error updating milestones:', err);
                                  }
                                }}
                                renderValue={(selected) => (
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {(selected as string[]).map((id) => {
                                      const m = milestones.find(m => m._id === id);
                                      return <Chip key={id} label={m?.title || id} size="small" />;
                                    })}
                                  </Box>
                                )}
                              >
                                {milestones.map((m) => (
                                  <MenuItem key={m._id} value={m._id}>
                                    <Checkbox checked={(f.milestone_ids || []).includes(m._id)} />
                                    {m.title}
                                  </MenuItem>
                                ))}
                              </Select>
                            ) : (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {f.milestone_ids && f.milestone_ids.length > 0 ? (
                                  [...new Set(f.milestone_ids)].map((mid) => {
                                    const m = milestones.find(m => m._id === mid);
                                    return (
                                      <Chip
                                        key={mid}
                                        label={m?.title || mid}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                      />
                                    );
                                  })
                                ) : (
                                  <Typography variant="body2" color="text.secondary">—</Typography>
                                )}
                              </Box>
                            )}
                          </TableCell>
                          
                          <TableCell onDoubleClick={() => startEditCell(f, 'estimated_hours')}>
                            {editingId === f._id && editingField === 'estimated_hours' ? (
                              <TextField size="small" type="number" value={editDraft.estimated_hours || 0} onChange={(e) => setEditDraft(s => ({ ...s, estimated_hours: Number(e.target.value) }))} fullWidth onBlur={() => saveEditRow(f._id as string)} />
                            ) : (
                              <Typography variant="body2" fontWeight={600}>
                                {f.estimated_hours !== undefined && f.estimated_hours !== null ? `${f.estimated_hours}h` : '-'}
                              </Typography>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            <Stack direction="column" spacing={0.5}>
                              <Typography variant="caption" color="text.secondary">
                                {f.start_date ? new Date(f.start_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {f.due_date ? new Date(f.due_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                              </Typography>
                            </Stack>
                          </TableCell>
                          
                          <TableCell onDoubleClick={() => startEditCell(f, 'description')}>
                            {editingId === f._id && editingField === 'description' ? (
                              <TextField
                                size="small"
                                value={editDraft.description || ''}
                                onChange={(e) => setEditDraft(s => ({ ...s, description: e.target.value }))}
                                fullWidth onBlur={() => saveEditRow(f._id as string)}
                              />
                            ) : (
                              <Typography variant="body2" sx={{ opacity: .9, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {f.description || '—'}
                              </Typography>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            <Tooltip title="Tự động tính từ Functions">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={async () => {
                                  try {
                                    // Call API to calculate effort from functions
                                    const res = await axiosInstance.post(`/api/features/${f._id}/calculate-effort`);
                                    // Update local state
                                    setFeatures(prev => prev.map(x => 
                                      x._id === f._id 
                                        ? { ...x, estimated_hours: res.data.estimated_hours, actual_effort: res.data.actual_effort }
                                        : x
                                    ));
                                  } catch (err) {
                                    console.error('Error calculating effort:', err);
                                  }
                                }}
                              >
                                <FunctionsIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                </Box>
              </Paper>
              {features.length === 0 && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>
                    Chưa có feature nào. Bấm "Tạo Feature" để thêm.
                  </Typography>
                </Paper>
              )}
            </Stack>
          )}

          <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth maxWidth="md">
            <DialogTitle sx={{ fontWeight: 'bold' }}>
              Tạo Feature Mới - Lên Kế Hoạch
              <Box component="span" sx={{ display: 'block', fontSize: '0.75rem', color: 'text.secondary', fontWeight: 'normal', mt: 0.5 }}>
                Tạo feature và gắn vào milestone để lên kế hoạch dự án
              </Box>
            </DialogTitle>
            <DialogContent>
              {/* Capacity Info */}
              {projectData && capacityInfo.totalCapacityHours > 0 && (
                <Alert 
                  severity={capacityInfo.usagePercentage > 100 ? "error" : capacityInfo.usagePercentage > 80 ? "warning" : "info"}
                  sx={{ mb: 2, mt: 2 }}
                >
                  <Stack spacing={1}>
                    <Typography variant="body2" fontWeight={600}>
                      📊 Công suất dự án: {capacityInfo.teamMemberCount} người × {capacityInfo.hoursPerDay}h/ngày × {capacityInfo.projectDurationDays} ngày = {capacityInfo.totalCapacityHours} giờ
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography variant="caption">
                        Đã phân bổ: <strong>{capacityInfo.usedHours}h</strong>
                      </Typography>
                      <Typography variant="caption">
                        Còn lại: <strong style={{ color: capacityInfo.remainingHours < 0 ? 'red' : 'inherit' }}>
                          {capacityInfo.remainingHours}h
                        </strong>
                      </Typography>
                      <Typography variant="caption">
                        Tỷ lệ: <strong>{capacityInfo.usagePercentage.toFixed(1)}%</strong>
                      </Typography>
                    </Stack>
                    <Box sx={{ width: '100%', mt: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min(capacityInfo.usagePercentage, 100)} 
                        color={capacityInfo.usagePercentage > 100 ? "error" : capacityInfo.usagePercentage > 80 ? "warning" : "primary"}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  </Stack>
                </Alert>
              )}
              <Stack spacing={3} sx={{ mt: 2 }}>
                <TextField
                  label="Tiêu đề *"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  fullWidth
                  placeholder="VD: User Authentication"
                />
                
                <TextField
                  label="Mô tả"
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Mô tả chi tiết về feature này..."
                />
                
                <TextField
                  label="Plan Effort"
                  value={form.plan_effort || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, plan_effort: e.target.value }))}
                  fullWidth
                  placeholder="VD: Sprint 1, Q1 2024"
                />
                
                <Divider />
                
                <Stack direction="row" spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel id="status-label">Status</InputLabel>
                    <Select
                      labelId="status-label"
                      label="Status"
                      value={form.status_id || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, status_id: e.target.value }))}
                    >
                      {statuses.length === 0 ? (
                        <MenuItem disabled>Đang tải...</MenuItem>
                      ) : (
                        statuses.map((s) => (
                          <MenuItem key={s._id} value={s._id}>
                            {s.name}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                      {statuses.length} options
                    </Typography>
                  </FormControl>
                  
                  <FormControl fullWidth>
                    <InputLabel id="priority-label">Priority</InputLabel>
                    <Select
                      labelId="priority-label"
                      label="Priority"
                      value={form.priority_id || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, priority_id: e.target.value }))}
                    >
                      {priorities.length === 0 ? (
                        <MenuItem disabled>Đang tải...</MenuItem>
                      ) : (
                        priorities.map((p) => (
                          <MenuItem key={p._id} value={p._id}>
                            {p.name}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                      {priorities.length} options
                    </Typography>
                  </FormControl>
                  
                  <FormControl fullWidth>
                    <InputLabel id="complexity-label">Complexity</InputLabel>
                    <Select
                      labelId="complexity-label"
                      label="Complexity"
                      value={form.complexity_id || ''}
                      onChange={(e) => {
                        const complexityId = e.target.value;
                        const suggestedHours = getEstimatedHoursByComplexity(complexityId);
                        setForm(prev => ({ 
                          ...prev, 
                          complexity_id: complexityId,
                          // Auto-fill estimated hours if empty
                          estimated_hours: prev.estimated_hours === 0 ? suggestedHours : prev.estimated_hours
                        }));
                      }}
                    >
                      {complexities.length === 0 ? (
                        <MenuItem disabled>Đang tải...</MenuItem>
                      ) : (
                        complexities.map((c) => {
                          const hours = getEstimatedHoursByComplexity(c._id);
                          return (
                            <MenuItem key={c._id} value={c._id}>
                              {c.name} {hours > 0 && `(~${hours}h)`}
                            </MenuItem>
                          );
                        })
                      )}
                    </Select>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                      💡 Chọn complexity để tự động gợi ý giờ
                    </Typography>
                  </FormControl>
                </Stack>
                
                <Divider />
                
                <Stack direction="row" spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      label="Estimated Hours (giờ) *"
                      type="number"
                      value={form.estimated_hours || 0}
                      onChange={(e) => setForm(prev => ({ ...prev, estimated_hours: Number(e.target.value) }))}
                      fullWidth
                      placeholder="VD: 40"
                      helperText={
                        capacityInfo.remainingHours > 0 
                          ? `💡 Còn ${capacityInfo.remainingHours}h trong công suất dự án` 
                          : capacityInfo.remainingHours < 0 
                            ? `⚠️ Vượt quá công suất ${Math.abs(capacityInfo.remainingHours)}h`
                            : ''
                      }
                      error={Boolean(form.estimated_hours && form.estimated_hours > capacityInfo.remainingHours && capacityInfo.remainingHours > 0)}
                    />
                    {form.complexity_id && (
                      <Alert severity="info" sx={{ mt: 1, py: 0.5 }}>
                        <Typography variant="caption">
                          💡 Gợi ý: {getEstimatedHoursByComplexity(form.complexity_id)}h (dựa vào complexity)
                        </Typography>
                      </Alert>
                    )}
                  </Box>
                  <TextField
                    label="Start Date"
                    type="date"
                    value={form.start_date || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, start_date: e.target.value }))}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    label="Due Date"
                    type="date"
                    value={form.due_date || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, due_date: e.target.value }))}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Stack>
                
                <Divider>
                  <Chip label="Gắn vào Milestone" size="small" />
                </Divider>
                
                <FormControl fullWidth>
                  <InputLabel id="milestone-select-label">Chọn Milestones</InputLabel>
                  <Select
                    labelId="milestone-select-label"
                    label="Chọn Milestones"
                    multiple
                    value={form.milestone_ids || []}
                    onChange={(e) => setForm(prev => ({ ...prev, milestone_ids: e.target.value as string[] }))}
                    renderValue={(selected) => (
                      <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                        {(selected as string[]).map((id) => {
                          const m = milestoneOptions.find(o => o.id === id);
                          return <Chip key={id} label={m?.label || id} size="small" color="primary" />;
                        })}
                      </Stack>
                    )}
                  >
                    {milestoneOptions.map((m) => (
                      <MenuItem key={m.id} value={m.id}>
                        <Checkbox checked={(form.milestone_ids || []).includes(m.id)} />
                        {m.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                {(form.milestone_ids || []).length === 0 && (
                  <Alert severity="info">
                    💡 Tip: Gắn feature vào milestone để dễ quản lý timeline và theo dõi tiến độ
                  </Alert>
                )}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenForm(false)}>Hủy</Button>
              <Button 
                variant="contained" 
                onClick={handleCreateFeature}
                disabled={!form.title}
              >
                Tạo Feature
              </Button>
            </DialogActions>
          </Dialog>

          <CreateMilestoneFromFeatures
            open={openMilestoneFromFeaturesDialog}
            onClose={() => setOpenMilestoneFromFeaturesDialog(false)}
            projectId={projectId}
            selectedFeatures={selectedFeatures.filter(f => f._id) as any}
            onSuccess={() => {
              setSelectedFeatureIds([]);
              // Optionally reload milestones or navigate
            }}
          />

          {/* Feature Detail Dialog */}
          <Dialog 
            open={openFeatureDetail} 
            onClose={() => {
              setOpenFeatureDetail(false);
              setSelectedFeatureDetail(null);
            }} 
            maxWidth="md" 
            fullWidth
          >
            <DialogTitle sx={{ fontWeight: 'bold' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box component="span">Chi tiết Feature</Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => router.push(`/projects/${projectId}/features/${selectedFeatureDetail?._id}`)}
                >
                  Xem Breakdown
                </Button>
              </Stack>
            </DialogTitle>
            <DialogContent>
            {selectedFeatureDetail && (
              <Stack spacing={3} sx={{ mt: 1 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                    Title
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {selectedFeatureDetail.title}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                    Description
                  </Typography>
                  <Typography variant="body1">
                    {selectedFeatureDetail.description || '—'}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={3}>
                  <Box flex={1}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                      Status
                    </Typography>
                    <Chip
                      label={typeof selectedFeatureDetail.status_id === 'object' ? selectedFeatureDetail.status_id?.name : '-'}
                      size="medium"
                      sx={{
                        color: '#fff',
                        bgcolor: (typeof selectedFeatureDetail.status_id === 'object' && selectedFeatureDetail.status_id?.name === 'completed') ? '#22c55e' : 
                                 (typeof selectedFeatureDetail.status_id === 'object' && selectedFeatureDetail.status_id?.name === 'in-progress') ? '#f59e0b' : 
                                 (typeof selectedFeatureDetail.status_id === 'object' && selectedFeatureDetail.status_id?.name === 'testing') ? '#8b5cf6' : '#3b82f6',
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                  <Box flex={1}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                      Priority
                    </Typography>
                    <Chip
                      label={typeof selectedFeatureDetail.priority_id === 'object' ? selectedFeatureDetail.priority_id?.name : '-'}
                      size="medium"
                      color={
                        (typeof selectedFeatureDetail.priority_id === 'object' && selectedFeatureDetail.priority_id?.name === 'critical') ? 'error' :
                        (typeof selectedFeatureDetail.priority_id === 'object' && selectedFeatureDetail.priority_id?.name === 'high') ? 'warning' :
                        (typeof selectedFeatureDetail.priority_id === 'object' && selectedFeatureDetail.priority_id?.name === 'medium') ? 'primary' : 'default'
                      }
                      variant="outlined"
                    />
                  </Box>
                  <Box flex={1}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                      Complexity
                    </Typography>
                    <Chip
                      label={typeof selectedFeatureDetail.complexity_id === 'object' ? selectedFeatureDetail.complexity_id?.name : '-'}
                      size="medium"
                      color={
                        (typeof selectedFeatureDetail.complexity_id === 'object' && selectedFeatureDetail.complexity_id?.name === 'Very Complex') ? 'error' :
                        (typeof selectedFeatureDetail.complexity_id === 'object' && selectedFeatureDetail.complexity_id?.name === 'Complex') ? 'warning' :
                        (typeof selectedFeatureDetail.complexity_id === 'object' && selectedFeatureDetail.complexity_id?.name === 'Medium') ? 'primary' : 'default'
                      }
                      variant="outlined"
                    />
                  </Box>
                </Stack>

                <Stack direction="row" spacing={3}>
                  <Box flex={1}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                      Estimated Hours
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {selectedFeatureDetail.estimated_hours ? `${selectedFeatureDetail.estimated_hours} giờ` : '—'}
                    </Typography>
                  </Box>
                  <Box flex={1}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                      Actual Effort
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {selectedFeatureDetail.actual_effort ? `${selectedFeatureDetail.actual_effort} giờ` : '—'}
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={3}>
                  <Box flex={1}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                      Start Date
                    </Typography>
                    <Typography variant="body1">
                      {selectedFeatureDetail.start_date ? new Date(selectedFeatureDetail.start_date).toLocaleDateString('vi-VN') : '—'}
                    </Typography>
                  </Box>
                  <Box flex={1}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                      Due Date
                    </Typography>
                    <Typography variant="body1">
                      {selectedFeatureDetail.due_date ? new Date(selectedFeatureDetail.due_date).toLocaleDateString('vi-VN') : '—'}
                    </Typography>
                  </Box>
                </Stack>

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                    Creator
                  </Typography>
                  <Typography variant="body1">
                    {typeof selectedFeatureDetail.created_by === 'object' ? selectedFeatureDetail.created_by?.full_name : '—'}
                  </Typography>
                </Box>

                  <Stack direction="row" spacing={3}>
                    <Box flex={1}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                        Created At
                      </Typography>
                      <Typography variant="body2">
                        {selectedFeatureDetail.createdAt ? new Date(selectedFeatureDetail.createdAt).toLocaleString('vi-VN') : '—'}
                      </Typography>
                    </Box>
                    <Box flex={1}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                        Updated At
                      </Typography>
                      <Typography variant="body2">
                        {selectedFeatureDetail.updatedAt ? new Date(selectedFeatureDetail.updatedAt).toLocaleString('vi-VN') : '—'}
                      </Typography>
                    </Box>
                  </Stack>

                  {selectedFeatureDetail.milestone_ids && selectedFeatureDetail.milestone_ids.length > 0 && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        Linked Milestones
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                        {[...new Set(selectedFeatureDetail.milestone_ids)].map((milestoneId) => {
                          const milestone = milestones.find(m => m._id === milestoneId);
                          return (
                            <Chip
                              key={milestoneId}
                              label={milestone?.title || milestoneId}
                              size="small"
                              variant="outlined"
                              color="primary"
                            />
                          );
                        })}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setOpenFeatureDetail(false);
                setSelectedFeatureDetail(null);
              }}>
                Đóng
              </Button>
              <Button 
                variant="contained" 
                onClick={() => router.push(`/projects/${projectId}/features/${selectedFeatureDetail?._id}`)}
              >
                Xem Breakdown
              </Button>
            </DialogActions>
          </Dialog>

          {/* Effort Allocation Suggestions Dialog */}
          <Dialog
            open={openAllocationDialog}
            onClose={() => setOpenAllocationDialog(false)}
            maxWidth="lg"
            fullWidth
          >
            <DialogTitle sx={{ fontWeight: 'bold' }}>
              💡 Gợi ý phân bổ Effort theo Complexity
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                Phân bổ capacity dựa trên độ phức tạp kỹ thuật của features
              </Typography>
            </DialogTitle>
            <DialogContent>
              {allocationSuggestions && (
                <Stack spacing={3} sx={{ mt: 2 }}>
                  {/* Summary */}
                  <Alert severity="info">
                    <Stack spacing={1}>
                      <Typography variant="body2" fontWeight={600}>
                        📊 Tổng capacity: {allocationSuggestions.total_capacity} giờ
                      </Typography>
                      <Typography variant="caption">
                        Method: {allocationSuggestions.allocation_method} | 
                        Total points: {allocationSuggestions.total_points || allocationSuggestions.total_weighted_points}
                      </Typography>
                      <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                        <Chip label={`${allocationSuggestions.summary?.total_features || 0} features`} size="small" />
                        <Chip label={`Suggested: ${allocationSuggestions.summary?.total_suggested || 0}h`} color="primary" size="small" />
                        <Chip label={`Current: ${allocationSuggestions.summary?.total_current || 0}h`} color="default" size="small" />
                      </Stack>
                    </Stack>
                  </Alert>

                  {/* Suggestions Table */}
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Feature</TableCell>
                        <TableCell>Complexity</TableCell>
                        <TableCell align="right">Points</TableCell>
                        <TableCell align="right">%</TableCell>
                        <TableCell align="right">Suggested</TableCell>
                        <TableCell align="right">Current</TableCell>
                        <TableCell align="right">Diff</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {allocationSuggestions.suggestions?.map((s: any) => (
                        <TableRow key={s.feature_id}>
                          <TableCell>{s.feature_title}</TableCell>
                          <TableCell>
                            <Chip 
                              label={s.complexity} 
                              size="small"
                              color={
                                s.complexity === 'very-complex' ? 'error' :
                                s.complexity === 'complex' ? 'warning' :
                                s.complexity === 'medium' ? 'primary' : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell align="right">{s.complexity_points || s.weighted_points}</TableCell>
                          <TableCell align="right">{s.percentage}%</TableCell>
                          <TableCell align="right">
                            <Typography fontWeight={600} color="primary.main">
                              {s.suggested_hours}h
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{s.current_hours}h</TableCell>
                          <TableCell align="right">
                            <Typography 
                              color={s.difference > 0 ? 'error.main' : s.difference < 0 ? 'success.main' : 'text.secondary'}
                              fontWeight={600}
                            >
                              {s.difference > 0 ? '+' : ''}{s.difference}h
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={s.status}
                              size="small"
                              color={s.status === 'ok' ? 'success' : s.status === 'under-estimated' ? 'error' : 'warning'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => applySuggestion(s.feature_id, s.suggested_hours)}
                              disabled={s.status === 'ok'}
                            >
                              Apply
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Stack>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenAllocationDialog(false)}>
                Đóng
              </Button>
              <Button
                variant="outlined"
                onClick={() => fetchAllocationSuggestions('hybrid')}
                disabled={loadingSuggestions}
              >
                🔥 Hybrid Mode
              </Button>
              <Button
                variant="contained"
                onClick={applyAllSuggestions}
                disabled={loadingSuggestions || !allocationSuggestions?.suggestions?.length}
              >
                Apply Tất Cả
              </Button>
            </DialogActions>
          </Dialog>
        </div>
      </main>
    </div>
  );
}



