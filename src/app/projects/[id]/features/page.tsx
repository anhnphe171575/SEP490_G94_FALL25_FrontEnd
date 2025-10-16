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
        const [milestoneRes, featureRes] = await Promise.all([
          axiosInstance.get(`/api/projects/${projectId}/milestones`).catch(() => ({ data: null })),
          axiosInstance.get(`/api/projects/${projectId}/features`).catch(() => ({ data: null })),
        ]);
        const milestonesList = Array.isArray(milestoneRes.data) && milestoneRes.data.length > 0 ? milestoneRes.data : [];
        setMilestones(milestonesList);

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
                      <TableCell sx={{ minWidth: 200 }}>Milestone</TableCell>
                      <TableCell>Estimated hours</TableCell>
                      <TableCell>Start - Due</TableCell>
                      <TableCell>Description</TableCell>
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
                          
                          <TableCell>
                            {statusChip}
                          </TableCell>
                          
                          <TableCell>
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
                  <TextField
                    label="Estimated Hours (giờ)"
                    type="number"
                    value={form.estimated_hours || 0}
                    onChange={(e) => setForm(prev => ({ ...prev, estimated_hours: Number(e.target.value) }))}
                    fullWidth
                    placeholder="VD: 40"
                  />
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
        </div>
      </main>
    </div>
  );
}



