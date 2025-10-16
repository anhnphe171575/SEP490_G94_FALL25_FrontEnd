"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/../ultis/axios";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Box,
  Chip,
  Typography,
  Divider,
  CircularProgress,
} from "@mui/material";
import MilestoneProgressDetail from "./MilestoneProgressDetail";
import { DateRangePicker } from "@mui/x-date-pickers-pro/DateRangePicker";
import { SingleInputDateRangeField } from "@mui/x-date-pickers-pro/SingleInputDateRangeField";
import { DateRange } from "@mui/x-date-pickers-pro/models";
import { toast } from "sonner";

type Update = { _id: string; content: string; createdAt: string; user_id?: { full_name?: string; email?: string; avatar?: string } };
type ActivityLog = { _id: string; action: string; createdAt: string; metadata?: any; created_by?: { full_name?: string; email?: string; avatar?: string } };
type FileDoc = { _id: string; title: string; file_url: string; createdAt: string };
type SuccessCriterion = {
  _id?: string;
  title: string;
  description: string;
  status: "pending" | "in-review" | "verified" | "rejected";
  verified_by?: string;
  verified_at?: string;
};
type MilestoneProgress = {
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

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide opacity-60 mb-1">{label}</div>
      {children}
    </div>
  );
}

export default function ModalMilestone({ open, onClose, projectId, milestoneId, onUpdate }: { open: boolean; onClose: () => void; projectId: string; milestoneId: string; onUpdate?: () => void; }) {
  const [tab, setTab] = useState<"updates"|"files"|"activity"|"progress">("updates");
  const [updates, setUpdates] = useState<Update[]>([]);
  const [files, setFiles] = useState<FileDoc[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("Planned");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [estimatedEffort, setEstimatedEffort] = useState<number>(0);
  const [actualEffort, setActualEffort] = useState<number>(0);
  const [tags, setTags] = useState<string>("");
  const [actualDate, setActualDate] = useState("");
  const [duration, setDuration] = useState<number>(0);
  const [successCriteria, setSuccessCriteria] = useState<SuccessCriterion[]>([]);
  const [delayDays, setDelayDays] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [fileTitle, setFileTitle] = useState("");
  const [fileType, setFileType] = useState("Document");
  const [fileVersion, setFileVersion] = useState("1.0");
  const [fileStatus, setFileStatus] = useState("Pending");
  const [fileDescription, setFileDescription] = useState("");
  const [progress, setProgress] = useState<MilestoneProgress | null>(null);

  const toInputDate = (d: Date | null) => {
    if (!d) return "";
    const year = d.getFullYear();
    const month = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isOverdue = () => {
    if (!deadline) return false;
    const end = new Date(deadline);
    const today = new Date();
    end.setHours(23, 59, 59, 999);
    return end.getTime() < today.getTime();
  };

  const addSuccessCriterion = () => {
    setSuccessCriteria([...successCriteria, { title: "", description: "", status: "pending" }]);
  };

  const removeSuccessCriterion = (index: number) => {
    setSuccessCriteria(successCriteria.filter((_, i) => i !== index));
  };

  const updateSuccessCriterion = (index: number, field: keyof SuccessCriterion, value: string) => {
    const updated = [...successCriteria];
    updated[index] = { ...updated[index], [field]: value };
    setSuccessCriteria(updated);
  };

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      try {
        const [m, u, f, a, p] = await Promise.all([
          axiosInstance.get(`/api/projects/${projectId}/milestones/${milestoneId}`),
          axiosInstance.get(`/api/projects/${projectId}/milestones/${milestoneId}/comments`),
          axiosInstance.get(`/api/projects/${projectId}/milestones/${milestoneId}/files`),
          axiosInstance.get(`/api/projects/${projectId}/milestones/${milestoneId}/activity-logs`),
          axiosInstance.get(`/api/projects/${projectId}/milestones/${milestoneId}/progress`).catch(() => ({ data: { progress: null } })),
        ]);
        const md = m.data || {};
        setTitle(md.title || "");
        setCode(md.code || "");
        setDescription(md.description || "");
        setNotes(md.notes || "");
        setStatus(md.status || "Planned");
        setStartDate(md.start_date ? md.start_date.substring(0,10) : "");
        setDeadline(md.deadline ? md.deadline.substring(0,10) : "");
        setEstimatedEffort(md.estimated_effort || 0);
        setActualEffort(md.actual_effort || 0);
        setTags(Array.isArray(md.tags) ? md.tags.join(', ') : "");
        setActualDate(md.actual_date ? md.actual_date.substring(0,10) : "");
        setDuration(md.duration || 0);
        setSuccessCriteria(Array.isArray(md.success_criteria) ? md.success_criteria : []);
        setDelayDays(md.delay_days || 0);
        setUpdates(Array.isArray(u.data) ? u.data : []);
        setFiles(Array.isArray(f.data) ? f.data : []);
        setActivity(Array.isArray(a.data) ? a.data : []);
        setProgress(p.data?.progress || null);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, projectId, milestoneId]);

  const submitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setPosting(true);
    try {
      const res = await axiosInstance.post(`/api/projects/${projectId}/milestones/${milestoneId}/comments`, { content });
      setUpdates(prev => [res.data, ...prev]);
      setContent("");
      toast.success('Đã thêm bình luận mới');
    } catch (error: any) {
      toast.error('Không thể thêm bình luận', {
        description: error?.response?.data?.message || error?.message,
      });
    } finally {
      setPosting(false);
    }
  };

  const startEdit = (id: string, initial: string) => {
    setEditingId(id);
    setEditingContent(initial);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingContent("");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const body = { content: editingContent };
      const res = await axiosInstance.patch(`/api/projects/${projectId}/milestones/${milestoneId}/comments/${editingId}`, body);
      setUpdates(prev => prev.map(u => (u._id === editingId ? res.data : u)));
      cancelEdit();
      toast.success('Đã cập nhật bình luận');
    } catch (error: any) {
      toast.error('Không thể cập nhật bình luận', {
        description: error?.response?.data?.message || error?.message,
      });
    }
  };

  const deleteComment = async (id: string) => {
    try {
      await axiosInstance.delete(`/api/projects/${projectId}/milestones/${milestoneId}/comments/${id}`);
      setUpdates(prev => prev.filter(u => u._id !== id));
      toast.success('Đã xóa bình luận');
    } catch (error: any) {
      toast.error('Không thể xóa bình luận', {
        description: error?.response?.data?.message || 'Bạn không có quyền xóa bình luận này',
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{title || "Item"}</DialogTitle>
      <DialogContent dividers>
        <Box display="flex" gap={3} minHeight="52vh">
          <Box width={320} display="flex" flexDirection="column" gap={2} sx={{ maxHeight: '70vh', overflowY: 'auto', pr: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main', mt: 1 }}>
              Thông tin cơ bản
            </Typography>
            <TextField 
              label="Title" 
              value={title} 
              onChange={(e)=>setTitle(e.target.value)} 
              fullWidth 
              size="small" 
              required
              error={!title.trim()}
              helperText={!title.trim() ? "Title là bắt buộc" : ""}
            />
            <TextField 
              label="Code" 
              value={code} 
              onChange={(e)=>setCode(e.target.value)} 
              fullWidth 
              size="small" 
              placeholder="MS-001"
            />
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={status} onChange={(e)=>setStatus(e.target.value as string)}>
                <MenuItem value="Planned">Planned</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Overdue">Overdue</MenuItem>
              </Select>
            </FormControl>
            
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
              Thời gian
            </Typography>
            <TextField 
              label="Start Date" 
              type="date" 
              value={startDate} 
              onChange={(e)=>setStartDate(e.target.value)} 
              fullWidth 
              size="small" 
              InputLabelProps={{ shrink: true }}
            />
            <TextField 
              label="Deadline" 
              type="date" 
              value={deadline} 
              onChange={(e)=>setDeadline(e.target.value)} 
              fullWidth 
              size="small" 
              InputLabelProps={{ shrink: true }}
              required
              error={!deadline}
              helperText={!deadline ? "Deadline là bắt buộc" : ""}
            />
            <TextField 
              label="Actual Completion Date" 
              type="date" 
              value={actualDate} 
              onChange={(e)=>setActualDate(e.target.value)} 
              fullWidth 
              size="small" 
              InputLabelProps={{ shrink: true }}
              helperText="Ngày hoàn thành thực tế (nếu đã xong)"
            />
            <TextField 
              label="Duration (days)" 
              type="number" 
              value={duration} 
              onChange={(e)=>setDuration(Number(e.target.value))} 
              fullWidth 
              size="small"
              helperText="Thời lượng dự kiến (ngày)"
            />
            
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
              Effort
            </Typography>
            <TextField 
              label="Estimated Effort (hours)" 
              type="number" 
              value={estimatedEffort} 
              onChange={(e)=>setEstimatedEffort(Number(e.target.value))} 
              fullWidth 
              size="small"
              InputProps={{ inputProps: { min: 0, step: 0.5 } }}
            />
            <TextField 
              label="Actual Effort (hours)" 
              type="number" 
              value={actualEffort} 
              onChange={(e)=>setActualEffort(Number(e.target.value))} 
              fullWidth 
              size="small"
              InputProps={{ inputProps: { min: 0, step: 0.5 } }}
            />
            <TextField 
              label="Delay Days" 
              type="number" 
              value={delayDays} 
              fullWidth 
              size="small"
              disabled
              helperText="Tự động tính từ deadline và actual_date"
              InputProps={{ readOnly: true }}
            />
            
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
              Tiêu chí thành công
            </Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="caption" color="text.secondary">
                {successCriteria.length} tiêu chí
              </Typography>
              <Button size="small" variant="outlined" onClick={addSuccessCriterion}>
                + Thêm tiêu chí
              </Button>
            </Box>
            {successCriteria.length === 0 ? (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', py: 2, opacity: 0.6 }}>
                Chưa có tiêu chí nào
              </Typography>
            ) : (
              <Box display="flex" flexDirection="column" gap={1}>
                {successCriteria.map((sc, idx) => (
                  <Box 
                    key={idx} 
                    sx={{ 
                      p: 1.5, 
                      border: '1px solid', 
                      borderColor: 'divider', 
                      borderRadius: 1.5,
                      bgcolor: 'background.paper',
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: 1
                      }
                    }}
                  >
                    <Box display="flex" alignItems="start" gap={1} mb={1}>
                      <TextField
                        value={sc.title}
                        onChange={(e) => updateSuccessCriterion(idx, "title", e.target.value)}
                        size="small"
                        fullWidth
                        placeholder="Tiêu đề tiêu chí"
                        sx={{ flex: 1 }}
                        autoComplete="off"
                      />
                      <FormControl size="small" sx={{ minWidth: 100 }}>
                        <Select
                          value={sc.status}
                          onChange={(e) => updateSuccessCriterion(idx, "status", e.target.value)}
                        >
                          <MenuItem value="pending">Pending</MenuItem>
                          <MenuItem value="in-review">In Review</MenuItem>
                          <MenuItem value="verified">Verified</MenuItem>
                          <MenuItem value="rejected">Rejected</MenuItem>
                        </Select>
                      </FormControl>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => removeSuccessCriterion(idx)}
                        sx={{ minWidth: 'auto', px: 1 }}
                      >
                        ✕
                      </Button>
                    </Box>
                    <TextField
                      value={sc.description}
                      onChange={(e) => updateSuccessCriterion(idx, "description", e.target.value)}
                      size="small"
                      fullWidth
                      multiline
                      minRows={2}
                      placeholder="Mô tả chi tiết..."
                      autoComplete="off"
                    />
                  </Box>
                ))}
              </Box>
            )}
            
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
              Mô tả & Tags
            </Typography>
            <TextField 
              label="Description" 
              value={description} 
              onChange={(e)=>setDescription(e.target.value)} 
              multiline 
              minRows={3} 
              fullWidth 
              size="small"
              placeholder="Mô tả chi tiết về milestone này..."
            />
            <TextField 
              label="Notes" 
              value={notes} 
              onChange={(e)=>setNotes(e.target.value)} 
              multiline 
              minRows={2} 
              fullWidth 
              size="small"
              placeholder="Ghi chú nội bộ..."
            />
            <TextField 
              label="Tags (comma separated)" 
              value={tags} 
              onChange={(e)=>setTags(e.target.value)} 
              fullWidth 
              size="small" 
              placeholder="backend, api, critical"
              helperText="Phân cách bằng dấu phẩy"
            />
            <Box>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>Files</Typography>
              <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                <Chip size="small" label={files.length} />
              </Box>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>Timeline</Typography>
              <Box mt={1}>
                <DateRangePicker
                  slots={{ field: SingleInputDateRangeField }}
                  localeText={{ start: "Start", end: "End" }}
                  calendars={2}
                  value={[
                    startDate ? new Date(startDate) : null,
                    deadline ? new Date(deadline) : null,
                  ] as DateRange<Date>}
                  onChange={(range: DateRange<Date>) => {
                    const [start, end] = range;
                    setStartDate(start ? toInputDate(start) : "");
                    setDeadline(end ? toInputDate(end) : "");
                  }}
                  slotProps={{
                    field: {
                      sx: {
                        width: 'fit-content',
                        '& .MuiInputBase-root': {
                          borderRadius: 999,
                          bgcolor: isOverdue() ? 'error.main' : 'primary.main',
                          color: '#fff',
                          px: 0.75,
                          py: 0,
                          minHeight: 24,
                          lineHeight: 1.2,
                        },
                        '& input': {
                          textAlign: 'center',
                          fontWeight: 600,
                          fontSize: 12,
                        },
                        '& .MuiInputBase-input': {
                          paddingTop: 0,
                          paddingBottom: 0,
                          paddingLeft: 4,
                          paddingRight: 4,
                        },
                      },
                    },
                  }}
                />
              </Box>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>Last updated</Typography>
              <Typography variant="body2" color="text.secondary">{activity[0]?.createdAt ? new Date(activity[0].createdAt).toLocaleString() : '—'}</Typography>
            </Box>
            <Box display="flex" justifyContent="flex-end">
              <Button 
                variant="contained" 
                disabled={saving} 
                onClick={async ()=>{ 
                  setSaving(true); 
                  try { 
                    await axiosInstance.patch(`/api/projects/${projectId}/milestones/${milestoneId}`, { 
                      title, 
                      code: code || undefined,
                      description, 
                      notes: notes || undefined,
                      status, 
                      start_date: startDate ? new Date(startDate).toISOString() : undefined, 
                      deadline: deadline ? new Date(deadline).toISOString() : undefined,
                      actual_date: actualDate ? new Date(actualDate).toISOString() : undefined,
                      duration: duration || 0,
                      estimated_effort: estimatedEffort || 0,
                      actual_effort: actualEffort || 0,
                      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
                      success_criteria: successCriteria.filter(sc => sc.title.trim())
                    });
                    // Refresh activity logs to show the update
                    const a = await axiosInstance.get(`/api/projects/${projectId}/milestones/${milestoneId}/activity-logs`);
                    setActivity(Array.isArray(a.data) ? a.data : []);
                    toast.success('Milestone đã được cập nhật thành công!', {
                      description: `${title} - ${status}`,
                      duration: 3000,
                    });
                    // Notify parent to refresh data/charts
                    if (onUpdate) onUpdate();
                  } catch (error: any) {
                    toast.error('Không thể cập nhật milestone', {
                      description: error?.response?.data?.message || error?.message || 'Lỗi không xác định',
                      duration: 4000,
                    });
                  } finally { 
                    setSaving(false); 
                  } 
                }}
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </Box>
          </Box>

          <Box flex={1}>
            <Tabs value={tab} onChange={(_,v)=>setTab(v)}>
              <Tab value="updates" label={`Updates${typeof updates.length==='number' ? ` / ${updates.length}` : ''}`} />
              <Tab value="files" label={`Files${typeof files.length==='number' ? ` / ${files.length}` : ''}`} />
              <Tab value="activity" label={`Activity Log${typeof activity.length==='number' ? ` / ${activity.length}` : ''}`} />
              <Tab value="progress" label="Progress" />
            </Tabs>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ maxHeight: '44vh', overflowY: 'auto' }}>
              {loading ? (
                <Box display="flex" justifyContent="center" py={4}><CircularProgress size={24} /></Box>
              ) : (
                <>
                  {tab === 'updates' && (
                    <Box display="flex" flexDirection="column" gap={2}>
                      <Box component="form" onSubmit={submitUpdate} sx={{ borderRadius: 2, p: 2, border: '1px solid', borderColor: 'divider' }}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Chip size="small" label="@" />
                          <Chip size="small" label="GIF" />
                          <Chip size="small" label="🙂" />
                          <Chip size="small" label="✦" />
                        </Box>
                        <TextField placeholder="Write an update and mention others with @" value={content} onChange={(e)=>setContent(e.target.value)} fullWidth multiline minRows={4} />
                        <Box display="flex" justifyContent="flex-end" gap={1} mt={1}>
                          <Button variant="outlined" type="button" onClick={()=>setContent("")}>Cancel</Button>
                          <Button variant="contained" type="submit" disabled={posting}>Update</Button>
                        </Box>
                      </Box>
                      {updates.length === 0 && <Typography variant="body2" color="text.secondary" align="center" py={4}>No updates yet</Typography>}
                      <Box display="flex" flexDirection="column" gap={1.5}>
                        {updates.map(u => (
                          <Box key={u._id} sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Box>
                                <Typography component="span" variant="caption" color="text.secondary">{u.user_id?.full_name ? `• ${u.user_id.full_name}` : ''} </Typography>
                                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>{new Date(u.createdAt).toLocaleString()}</Typography>
                              </Box>
                              <Box display="flex" gap={1}>
                                {editingId === u._id ? (
                                  <>
                                    <Button size="small" variant="outlined" onClick={cancelEdit}>Cancel</Button>
                                    <Button size="small" variant="contained" onClick={saveEdit} disabled={!editingContent.trim()}>Save</Button>
                                  </>
                                ) : (
                                  <>
                                    <Button size="small" variant="text" onClick={() => startEdit(u._id, u.content)}>Edit</Button>
                                    <Button size="small" color="error" variant="text" onClick={() => deleteComment(u._id)}>Delete</Button>
                                  </>
                                )}
                              </Box>
                            </Box>
                            {editingId === u._id ? (
                              <TextField value={editingContent} onChange={(e)=>setEditingContent(e.target.value)} fullWidth multiline minRows={3} sx={{ mt: 1 }} />
                            ) : (
                              <Typography variant="body2" mt={0.5}>{u.content}</Typography>
                            )}
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                  {tab === 'files' && (
                    <Box display="flex" flexDirection="column" gap={1.5}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2">Files</Typography>
                        <Button variant="contained" size="small" onClick={()=>setShowUploader(v=>!v)}>
                          {showUploader ? 'Close' : 'Add file'}
                        </Button>
                      </Box>
                      {showUploader && (
                        <Box sx={{ p: 2, borderRadius: 1.5, border: '1px dashed', borderColor: 'divider', bgcolor: 'background.paper' }}>
                          <Typography variant="subtitle2" gutterBottom>Upload a file</Typography>
                          <Typography variant="caption" color="text.secondary">Max 20MB. Images and documents are supported.</Typography>
                          <Box mt={1.5} display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                            <TextField label="Title" value={fileTitle} onChange={(e)=>setFileTitle(e.target.value)} size="small" />
                            <TextField label="Type" value={fileType} onChange={(e)=>setFileType(e.target.value)} size="small" />
                            <TextField label="Version" value={fileVersion} onChange={(e)=>setFileVersion(e.target.value)} size="small" />
                            <TextField label="Status" value={fileStatus} onChange={(e)=>setFileStatus(e.target.value)} size="small" />
                            <TextField label="Description" value={fileDescription} onChange={(e)=>setFileDescription(e.target.value)} size="small" fullWidth multiline minRows={2} sx={{ gridColumn: '1 / span 2' }} />
                          </Box>
                          <Box mt={1.5} display="flex" alignItems="center" gap={1}>
                            <Button variant="contained" component="label" disabled={uploading}>
                              {uploading ? 'Uploading...' : 'Choose file'}
                              <input hidden type="file" accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" onChange={async (e) => {
                                const f = e.target.files?.[0];
                                if (!f) return;
                                setUploading(true);
                                try {
                                  const form = new FormData();
                                  form.append('file', f);
                                  if (fileTitle) form.append('title', fileTitle);
                                  if (fileType) form.append('type', fileType);
                                  if (fileVersion) form.append('version', fileVersion);
                                  if (fileStatus) form.append('status', fileStatus);
                                  if (fileDescription) form.append('description', fileDescription);
                                  const res = await axiosInstance.post(`/api/projects/${projectId}/milestones/${milestoneId}/files`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
                                  setFiles(prev => [res.data, ...prev]);
                                  setFileTitle("");
                                  setFileDescription("");
                                  setShowUploader(false);
                                  toast.success('Đã tải file lên thành công!', {
                                    description: fileTitle || f.name,
                                  });
                                } catch (error: any) {
                                  toast.error('Không thể tải file lên', {
                                    description: error?.response?.data?.message || error?.message,
                                  });
                                } finally {
                                  setUploading(false);
                                  e.currentTarget.value = '';
                                }
                              }} />
                            </Button>
                            {uploading && <CircularProgress size={20} />}
                            <Button variant="text" onClick={()=>setShowUploader(false)}>Cancel</Button>
                          </Box>
                        </Box>
                      )}
                      {files.length === 0 && <Typography variant="body2" color="text.secondary">No files</Typography>}
                      {files.map(f => (
                        <Box key={f._id} display="flex" alignItems="center" justifyContent="space-between" sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                          <Box>
                            <Typography variant="body2" fontWeight={600} sx={{ display: 'block' }}>{f.title}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{new Date(f.createdAt).toLocaleString()}</Typography>
                          </Box>
                          <Button size="small" href={f.file_url} target="_blank" rel="noreferrer" variant="text">Open</Button>
                        </Box>
                      ))}
                    </Box>
                  )}
                  {tab === 'activity' && (
                    <Box display="flex" flexDirection="column" gap={1.5}>
                      {activity.length === 0 && <Typography variant="body2" color="text.secondary">No activity</Typography>}
                      {activity.map(a => (
                        <Box key={a._id} sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{new Date(a.createdAt).toLocaleString()} {a.created_by?.full_name ? `• ${a.created_by.full_name}` : ''}</Typography>
                          <Typography variant="body2" fontWeight={600} mt={0.5} sx={{ display: 'block' }}>{a.action}</Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                  {tab === 'progress' && (
                    <Box>
                      {progress ? (
                        <MilestoneProgressDetail milestoneTitle={title} progress={progress} />
                      ) : (
                        <Typography variant="body2" color="text.secondary" align="center" py={4}>
                          Không có dữ liệu tiến độ
                        </Typography>
                      )}
                    </Box>
                  )}
                </>
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}


