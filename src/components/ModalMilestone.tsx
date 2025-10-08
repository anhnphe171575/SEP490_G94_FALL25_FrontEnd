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
import { DateRangePicker } from "@mui/x-date-pickers-pro/DateRangePicker";
import { SingleInputDateRangeField } from "@mui/x-date-pickers-pro/SingleInputDateRangeField";
import { DateRange } from "@mui/x-date-pickers-pro/models";

type Update = { _id: string; content: string; createdAt: string; user_id?: { full_name?: string; email?: string; avatar?: string } };
type ActivityLog = { _id: string; action: string; createdAt: string; metadata?: any; created_by?: { full_name?: string; email?: string; avatar?: string } };
type FileDoc = { _id: string; title: string; file_url: string; createdAt: string };

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide opacity-60 mb-1">{label}</div>
      {children}
    </div>
  );
}

export default function ModalMilestone({ open, onClose, projectId, milestoneId }: { open: boolean; onClose: () => void; projectId: string; milestoneId: string; }) {
  const [tab, setTab] = useState<"updates"|"files"|"activity">("updates");
  const [updates, setUpdates] = useState<Update[]>([]);
  const [files, setFiles] = useState<FileDoc[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Planned");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [fileTitle, setFileTitle] = useState("");
  const [fileType, setFileType] = useState("Document");
  const [fileVersion, setFileVersion] = useState("1.0");
  const [fileStatus, setFileStatus] = useState("Pending");
  const [fileDescription, setFileDescription] = useState("");

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

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      try {
        const [m, u, f, a] = await Promise.all([
          axiosInstance.get(`/api/projects/${projectId}/milestones/${milestoneId}`),
          axiosInstance.get(`/api/projects/${projectId}/milestones/${milestoneId}/comments`),
          axiosInstance.get(`/api/projects/${projectId}/milestones/${milestoneId}/files`),
          axiosInstance.get(`/api/projects/${projectId}/milestones/${milestoneId}/activity-logs`),
        ]);
        const md = m.data || {};
        setTitle(md.title || "");
        setDescription(md.description || "");
        setStatus(md.status || "Planned");
        setStartDate(md.start_date ? md.start_date.substring(0,10) : "");
        setDeadline(md.deadline ? md.deadline.substring(0,10) : "");
        setUpdates(Array.isArray(u.data) ? u.data : []);
        setFiles(Array.isArray(f.data) ? f.data : []);
        setActivity(Array.isArray(a.data) ? a.data : []);
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
    const body = { content: editingContent };
    const res = await axiosInstance.patch(`/api/projects/${projectId}/milestones/${milestoneId}/comments/${editingId}`, body);
    setUpdates(prev => prev.map(u => (u._id === editingId ? res.data : u)));
    cancelEdit();
  };

  const deleteComment = async (id: string) => {
    try {
      await axiosInstance.delete(`/api/projects/${projectId}/milestones/${milestoneId}/comments/${id}`);
      setUpdates(prev => prev.filter(u => u._id !== id));
    } catch (_) {
      // ignore; backend enforces permission
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{title || "Item"}</DialogTitle>
      <DialogContent dividers>
        <Box display="flex" gap={3} minHeight="52vh">
          <Box width={300} display="flex" flexDirection="column" gap={2}>
            <TextField label="Name" value={title} onChange={(e)=>setTitle(e.target.value)} fullWidth size="small" />
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={status} onChange={(e)=>setStatus(e.target.value as string)}>
                <MenuItem value="Planned">Planned</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Overdue">Overdue</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Due date" type="date" value={deadline} onChange={(e)=>setDeadline(e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
            <TextField label="Notes" value={description} onChange={(e)=>setDescription(e.target.value)} multiline minRows={2} fullWidth />
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
              <Button variant="contained" disabled={saving} onClick={async ()=>{ setSaving(true); try { await axiosInstance.patch(`/api/projects/${projectId}/milestones/${milestoneId}`, { title, description, status, start_date: startDate ? new Date(startDate).toISOString() : undefined, deadline: deadline ? new Date(deadline).toISOString() : undefined }); } finally { setSaving(false); } }}>Save</Button>
            </Box>
          </Box>

          <Box flex={1}>
            <Tabs value={tab} onChange={(_,v)=>setTab(v)}>
              <Tab value="updates" label={`Updates${typeof updates.length==='number' ? ` / ${updates.length}` : ''}`} />
              <Tab value="files" label={`Files${typeof files.length==='number' ? ` / ${files.length}` : ''}`} />
              <Tab value="activity" label={`Activity Log${typeof activity.length==='number' ? ` / ${activity.length}` : ''}`} />
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
                                <Typography variant="caption" color="text.secondary">{u.user_id?.full_name ? `• ${u.user_id.full_name}` : ''} </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>{new Date(u.createdAt).toLocaleString()}</Typography>
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
                            <Typography variant="body2" fontWeight={600}>{f.title}</Typography>
                            <Typography variant="caption" color="text.secondary">{new Date(f.createdAt).toLocaleString()}</Typography>
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
                          <Typography variant="caption" color="text.secondary">{new Date(a.createdAt).toLocaleString()} {a.created_by?.full_name ? `• ${a.created_by.full_name}` : ''}</Typography>
                          <Typography variant="body2" fontWeight={600} mt={0.5}>{a.action}</Typography>
                        </Box>
                      ))}
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


