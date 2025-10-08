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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

type Milestone = {
  _id: string;
  title: string;
  start_date?: string;
  deadline?: string;
  status?: string;
};

type Feature = {
  _id?: string;
  title: string;
  code: string;
  description?: string;
  project_id: string;
  milestone_id?: string | null;
  creator_id: string;
  assignee_id?: string | null;
  function_ids?: string[];
  status: 'planning' | 'in-progress' | 'testing' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimated_effort?: string;
  start_date?: string;
  end_date?: string;
  createdAt?: string;
  updatedAt?: string;
  // UI-only convenience
  milestone_ids?: string[];
};

// Mock data for display
const MOCK_MILESTONES: Milestone[] = [
  { _id: "ms-1", title: "Thiết kế kiến trúc", start_date: new Date().toISOString(), deadline: new Date(Date.now() + 7*86400000).toISOString() },
  { _id: "ms-2", title: "Phát triển tính năng cốt lõi", start_date: new Date().toISOString(), deadline: new Date(Date.now() + 14*86400000).toISOString() },
];

const MOCK_FEATURES = (projectId: string): Feature[] => [
  { _id: "ft-1", code: "FT-1", title: "Đăng nhập OAuth", description: "Hỗ trợ Google SSO", project_id: projectId, creator_id: "u-1", status: 'planning', priority: 'medium', estimated_effort: "8", milestone_ids: ["ms-1"] },
  { _id: "ft-2", code: "FT-2", title: "Bảng điều khiển", description: "Hiển thị KPI chính", project_id: projectId, creator_id: "u-1", status: 'in-progress', priority: 'high', estimated_effort: "13", milestone_ids: ["ms-1","ms-2"] },
  { _id: "ft-3", code: "FT-3", title: "Quản lý người dùng", description: "CRUD và phân quyền", project_id: projectId, creator_id: "u-1", status: 'testing', priority: 'medium', estimated_effort: "21", milestone_ids: ["ms-2"] },
];

export default function ProjectFeaturesPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState<Feature>({ title: "", code: "", description: "", project_id: projectId, creator_id: "", status: 'planning', priority: 'medium', milestone_ids: [] });

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
    title: string;
    code: string;
    description?: string;
    assignee_id?: string;
    status?: Feature['status'];
    priority?: Feature['priority'];
    estimated_effort?: string;
    start_date?: string;
    end_date?: string;
    milestone_id?: string;
    function_ids_csv?: string; // CSV for inline editing
  }>({ title: "", code: "", description: "", assignee_id: "", status: 'planning', priority: 'medium', estimated_effort: "", start_date: "", end_date: "", milestone_id: "", function_ids_csv: "" });

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
        const milestonesList = Array.isArray(milestoneRes.data) && milestoneRes.data.length > 0 ? milestoneRes.data : MOCK_MILESTONES;
        setMilestones(milestonesList);

        if (Array.isArray(featureRes.data)) {
          // Enrich features with linked milestone ids
          const enriched: Feature[] = await Promise.all(
            featureRes.data.map(async (f: any) => {
              try {
                const linkRes = await axiosInstance.get(`/api/features/${f._id}/milestones`);
                return { ...f, milestone_ids: Array.isArray(linkRes.data) ? linkRes.data : [] } as Feature;
              } catch {
                return { ...f, milestone_ids: [] } as Feature;
              }
            })
          );
          setFeatures(enriched);
        } else {
          // Fallback: localStorage or mock
          const key = `features:${projectId}`;
          const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
          if (raw) {
            setFeatures(JSON.parse(raw) as Feature[]);
          } else {
            setFeatures(MOCK_FEATURES(projectId));
          }
        }
      } catch (e: any) {
        // Fallback to mock data
        setMilestones(MOCK_MILESTONES);
        setFeatures(MOCK_FEATURES(projectId));
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
    setForm({ title: "", code: "", description: "", project_id: projectId, creator_id: "", status: 'planning', priority: 'medium', milestone_ids: [] });
    setOpenForm(true);
  };

  const handleCreateFeature = async () => {
    try {
      // Gọi backend tạo feature và liên kết milestones
      const res = await axiosInstance.post(`/api/projects/${projectId}/features`, {
        title: form.title,
        code: form.code,
        description: form.description,
        creator_id: form.creator_id,
        status: form.status,
        priority: form.priority,
        estimated_effort: form.estimated_effort,
        milestone_id: form.milestone_id,
      });
      const created = res.data;
      let milestone_ids: string[] = [];
      try {
        const linkRes = await axiosInstance.get(`/api/features/${created._id}/milestones`);
        milestone_ids = Array.isArray(linkRes.data) ? linkRes.data : [];
      } catch {}
      setFeatures(prev => [{ ...created, milestone_ids }, ...prev]);
      setOpenForm(false);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Không thể tạo feature");
    }
  };

  const startEditCell = (f: Feature, field: string) => {
    setEditingId(f._id as string);
    setEditingField(field);
    setEditDraft({
      title: f.title,
      code: f.code,
      description: f.description,
      assignee_id: f.assignee_id || "",
      status: f.status,
      priority: f.priority,
      estimated_effort: f.estimated_effort || "",
      start_date: f.start_date,
      end_date: f.end_date,
      milestone_id: f.milestone_id || "",
      function_ids_csv: (f.function_ids || []).join(',')
    });
  };
  const cancelEditRow = () => {
    setEditingId(null);
    setEditingField(null);
    setEditDraft({ title: "", code: "", description: "", assignee_id: "", status: 'planning', priority: 'medium', estimated_effort: "", start_date: "", end_date: "", milestone_id: "", function_ids_csv: "" });
  };
  const saveEditRow = async (id: string) => {
    try {
      const all: any = {
        title: editDraft.title,
        code: editDraft.code,
        description: editDraft.description,
        assignee_id: editDraft.assignee_id || null,
        status: editDraft.status,
        priority: editDraft.priority,
        estimated_effort: editDraft.estimated_effort,
        start_date: editDraft.start_date,
        end_date: editDraft.end_date,
        milestone_id: editDraft.milestone_id || null,
        function_ids: (editDraft.function_ids_csv || '').split(',').map(s => s.trim()).filter(Boolean),
      };
      const payload: any = editingField ? { [editingField === 'function_ids_csv' ? 'function_ids' : editingField]:
        editingField === 'function_ids_csv' ? all.function_ids : all[editingField] } : all;
      await axiosInstance.patch(`/api/features/${id}`, payload).catch(() => null);
      setFeatures(prev => prev.map(x => {
        if (x._id !== id) return x as Feature;
        const updated: any = { ...x, updatedAt: new Date().toISOString() };
        if (editingField) {
          if (editingField === 'function_ids_csv') updated.function_ids = all.function_ids;
          else (updated as any)[editingField] = (all as any)[editingField];
        } else Object.assign(updated, all);
        return updated;
      }));
      cancelEditRow();
    } catch {}
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
            </div>
            <div className="flex items-center gap-2">
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
                      <TableCell sx={{ width: 44 }}></TableCell>
                      <TableCell>Code</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Start date</TableCell>
                      <TableCell>End date</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Estimated effort</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Last updated</TableCell>
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
                      const dueDateText = due ? new Date(due).toLocaleString('en-US', { month: 'short', day: 'numeric' }) : '-';
                      const statusChip = (
                        <Chip
                          size="small"
                          label={f.status}
                          sx={{
                            color: '#fff',
                            bgcolor: f.status === 'completed' ? '#22c55e' : f.status === 'in-progress' ? '#f59e0b' : '#3b82f6',
                            fontWeight: 600,
                          }}
                        />
                      );
                      return (
                        <TableRow key={f._id || idx} hover>
                          <TableCell><Checkbox size="small" /></TableCell>
                          <TableCell sx={{ fontWeight: 600 }} onDoubleClick={() => startEditCell(f, 'code')}>
                            {editingId === f._id && editingField === 'code' ? (
                              <TextField size="small" value={editDraft.code} onChange={(e) => setEditDraft(s => ({ ...s, code: e.target.value }))} fullWidth onBlur={() => saveEditRow(f._id as string)} />
                            ) : (
                              (f.code || '-')
                            )}
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
                          
                          <TableCell onDoubleClick={() => startEditCell(f, 'status')}>
                            {editingId === f._id && editingField === 'status' ? (
                              <Select size="small" value={editDraft.status || 'planning'} onChange={(e) => setEditDraft(s => ({ ...s, status: e.target.value as any }))} fullWidth onClose={() => saveEditRow(f._id as string)}>
                                <MenuItem value="planning">planning</MenuItem>
                                <MenuItem value="in-progress">in-progress</MenuItem>
                                <MenuItem value="testing">testing</MenuItem>
                                <MenuItem value="completed">completed</MenuItem>
                                <MenuItem value="cancelled">cancelled</MenuItem>
                              </Select>
                            ) : (
                              statusChip
                            )}
                          </TableCell>
                          <TableCell onDoubleClick={() => startEditCell(f, 'start_date')}>
                            {editingId === f._id && editingField === 'start_date' ? (
                              <TextField size="small" type="date" value={editDraft.start_date?.slice(0,10) || ''} onChange={(e) => setEditDraft(s => ({ ...s, start_date: e.target.value }))} fullWidth onBlur={() => saveEditRow(f._id as string)} />
                            ) : (
                              <Typography variant="body2">{f.start_date ? new Date(f.start_date).toLocaleDateString() : '—'}</Typography>
                            )}
                          </TableCell>
                          <TableCell onDoubleClick={() => startEditCell(f, 'end_date')}>
                            {editingId === f._id && editingField === 'end_date' ? (
                              <TextField size="small" type="date" value={editDraft.end_date?.slice(0,10) || ''} onChange={(e) => setEditDraft(s => ({ ...s, end_date: e.target.value }))} fullWidth onBlur={() => saveEditRow(f._id as string)} />
                            ) : (
                              <Typography variant="body2">{f.end_date ? new Date(f.end_date).toLocaleDateString() : '—'}</Typography>
                            )}
                          </TableCell>
                          
                          <TableCell onDoubleClick={() => startEditCell(f, 'priority')}>
                            {editingId === f._id && editingField === 'priority' ? (
                              <Select size="small" value={editDraft.priority || 'medium'} onChange={(e) => setEditDraft(s => ({ ...s, priority: e.target.value as any }))} fullWidth onClose={() => saveEditRow(f._id as string)}>
                                <MenuItem value="low">low</MenuItem>
                                <MenuItem value="medium">medium</MenuItem>
                                <MenuItem value="high">high</MenuItem>
                                <MenuItem value="critical">critical</MenuItem>
                              </Select>
                            ) : (
                              <Typography variant="body2">{f.priority}</Typography>
                            )}
                          </TableCell>
                          <TableCell onDoubleClick={() => startEditCell(f, 'estimated_effort')}>
                            {editingId === f._id && editingField === 'estimated_effort' ? (
                              <TextField size="small" value={editDraft.estimated_effort || ''} onChange={(e) => setEditDraft(s => ({ ...s, estimated_effort: e.target.value }))} fullWidth onBlur={() => saveEditRow(f._id as string)} />
                            ) : (
                              <Typography variant="body2">{f.estimated_effort || '-'}</Typography>
                            )}
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
                              <Typography variant="body2" sx={{ opacity: .9 }}>
                                {f.description || '—'}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Avatar sx={{ width: 26, height: 26 }}>A</Avatar>
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>{formatRelative((f as any).updatedAt)}</Typography>
                            </Stack>
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

          <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth maxWidth="sm">
            <DialogTitle>Tạo Feature</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField
                  label="Tiêu đề"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  fullWidth
                />
                <TextField
                  label="Mô tả"
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  fullWidth
                  multiline
                  minRows={3}
                />
                <TextField
                  label="Mã (code)"
                  value={form.code}
                  onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value }))}
                  fullWidth
                />
                <Divider />
                <FormControl fullWidth>
                  <InputLabel id="milestone-select-label">Milestones</InputLabel>
                  <Select
                    labelId="milestone-select-label"
                    label="Milestones"
                    multiple
                    value={form.milestone_ids || []}
                    onChange={(e) => setForm(prev => ({ ...prev, milestone_ids: e.target.value as string[] }))}
                    renderValue={(selected) => (
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {(selected as string[]).map((id) => {
                          const m = milestoneOptions.find(o => o.id === id);
                          return <Chip key={id} label={m?.label || id} size="small" />;
                        })}
                      </Stack>
                    )}
                  >
                    {milestoneOptions.map((m) => (
                      <MenuItem key={m.id} value={m.id}>{m.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenForm(false)}>Hủy</Button>
              <Button variant="contained" onClick={handleCreateFeature}>Tạo</Button>
            </DialogActions>
          </Dialog>
        </div>
      </main>
    </div>
  );
}



