"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/../ultis/axios";
import {
  Drawer,
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
  IconButton,
  Stack,
  Breadcrumbs,
  Link,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FlagIcon from "@mui/icons-material/Flag";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ShareIcon from "@mui/icons-material/Share";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SendIcon from "@mui/icons-material/Send";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import Avatar from "@mui/material/Avatar";
import Paper from "@mui/material/Paper";
import Menu from "@mui/material/Menu";
import MilestoneProgressDetail from "./MilestoneProgressDetail";
import { toast } from "sonner";

type Update = { _id: string; content: string; createdAt: string; user_id?: { full_name?: string; email?: string; avatar?: string } };
type ActivityLog = { _id: string; action: string; createdAt: string; metadata?: any; created_by?: { full_name?: string; email?: string; avatar?: string } };
type FileDoc = { _id: string; title: string; file_url: string; createdAt: string };
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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedComment, setSelectedComment] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [tags, setTags] = useState<string>("");
  const [priorityId, setPriorityId] = useState("");
  const [statusId, setStatusId] = useState("");
  const [priorities, setPriorities] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
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


  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      try {
        const [m, u, f, a, p, priorityRes, statusRes] = await Promise.all([
          axiosInstance.get(`/api/projects/${projectId}/milestones/${milestoneId}`),
          axiosInstance.get(`/api/projects/${projectId}/milestones/${milestoneId}/comments`),
          axiosInstance.get(`/api/projects/${projectId}/milestones/${milestoneId}/files`),
          axiosInstance.get(`/api/projects/${projectId}/milestones/${milestoneId}/activity-logs`),
          axiosInstance.get(`/api/projects/${projectId}/milestones/${milestoneId}/progress`).catch(() => ({ data: { progress: null } })),
          axiosInstance.get('/api/setting').then(res => res.data.filter((s: any) => s.type_id === 1)).catch(() => []),
          axiosInstance.get('/api/setting').then(res => res.data.filter((s: any) => s.type_id === 2)).catch(() => [])
        ]);
        const md = m.data || {};
        setTitle(md.title || "");
        setDescription(md.description || "");
        setStartDate(md.start_date ? md.start_date.substring(0,10) : "");
        setDeadline(md.deadline ? md.deadline.substring(0,10) : "");
        setTags(Array.isArray(md.tags) ? md.tags.join(', ') : "");
        setPriorityId(md.priority_id?._id || md.priority_id || "");
        setStatusId(md.status_id?._id || md.status_id || "");
        setPriorities(priorityRes);
        setStatuses(statusRes);
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
    if (!confirm('Delete this comment?')) return;
    try {
      await axiosInstance.delete(`/api/projects/${projectId}/milestones/${milestoneId}/comments/${id}`);
      setUpdates(prev => prev.filter(u => u._id !== id));
      toast.success('Comment deleted');
    } catch (error: any) {
      toast.error('Failed to delete comment', {
        description: error?.response?.data?.message || 'You do not have permission to delete this comment',
      });
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffMs = now.getTime() - commentDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return commentDate.toLocaleDateString();
  };

  const getStatusColor = (statusName: string) => {
    const key = (statusName || '').toLowerCase();
    if (key.includes('completed') || key.includes('done')) return '#16a34a';
    if (key.includes('progress') || key.includes('doing')) return '#f59e0b';
    if (key.includes('overdue') || key.includes('blocked')) return '#ef4444';
    return '#9ca3af';
  };

  const getPriorityColor = (priorityName: string) => {
    const key = (priorityName || '').toLowerCase();
    if (key.includes('critical') || key.includes('high')) return '#ef4444';
    if (key.includes('medium')) return '#f59e0b';
    return '#3b82f6';
  };

  const currentStatus = statuses.find(s => s._id === statusId);
  const currentPriority = priorities.find(p => p._id === priorityId);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: '90%', md: '75%', lg: '60%' },
          maxWidth: '1200px',
          bgcolor: '#fafbfc',
        }
      }}
    >
      {/* Header - Clean ClickUp style */}
      <Box sx={{ 
        bgcolor: 'white',
        borderBottom: '1px solid #e8e9eb',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        {/* Top Bar with Breadcrumb */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          px: 3,
          py: 1.5,
          borderBottom: '1px solid #f3f4f6'
        }}>
          {/* Breadcrumb */}
          <Breadcrumbs separator={<ChevronRightIcon sx={{ fontSize: 16, color: '#9ca3af' }} />}>
            <Link 
              href="#" 
              underline="hover" 
              color="text.secondary"
              fontSize="13px"
              sx={{ '&:hover': { color: '#7b68ee' } }}
            >
              Milestones
            </Link>
            <Typography 
              fontSize="13px" 
              color="text.primary" 
              fontWeight={600}
              sx={{
                maxWidth: '400px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {title || 'Milestone Details'}
            </Typography>
          </Breadcrumbs>

          {/* Action Buttons */}
          <Stack direction="row" spacing={1}>
            <Tooltip title="Share">
              <IconButton size="small" sx={{ color: '#6b7280' }}>
                <ShareIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Watch">
              <IconButton size="small" sx={{ color: '#6b7280' }}>
                <NotificationsIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="More actions">
              <IconButton size="small" sx={{ color: '#6b7280' }}>
                <MoreVertIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <IconButton size="small" onClick={onClose} sx={{ color: '#6b7280' }}>
              <CloseIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Stack>
        </Box>

        {/* Milestone Title & Quick Info */}
        <Box sx={{ px: 3, py: 2.5 }}>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            {/* Checkbox */}
            <IconButton 
              size="small" 
              sx={{ 
                mt: 0.5,
                color: currentStatus?.name?.toLowerCase().includes('completed') ? '#10b981' : '#d1d5db',
                '&:hover': { color: '#10b981' }
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 24 }} />
            </IconButton>

            {/* Title - Editable */}
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="h5" 
                fontWeight={700}
                sx={{ 
                  mb: 1.5,
                  color: '#1f2937',
                  lineHeight: 1.3,
                }}
              >
                {title || 'Loading...'}
            </Typography>

              {/* Meta Info Row */}
              <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
                {/* Status */}
                {currentStatus && (
                  <Chip 
                    label={currentStatus.name} 
              size="small" 
                    sx={{ 
                      height: 24,
                      fontSize: '12px',
                      fontWeight: 600,
                      bgcolor: `${getStatusColor(currentStatus.name)}15`,
                      color: getStatusColor(currentStatus.name),
                      border: `1px solid ${getStatusColor(currentStatus.name)}40`,
                    }}
                  />
                )}

                {/* Priority */}
                {currentPriority && (
                  <Chip 
                    icon={<FlagIcon sx={{ fontSize: 14 }} />}
                    label={currentPriority.name} 
              size="small" 
                    sx={{ 
                      height: 24,
                      fontSize: '12px',
                      fontWeight: 600,
                      bgcolor: `${getPriorityColor(currentPriority.name)}15`,
                      color: getPriorityColor(currentPriority.name),
                      border: `1px solid ${getPriorityColor(currentPriority.name)}40`,
                    }}
                  />
                )}

                {/* Date Range */}
                {(startDate || deadline) && (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <CalendarMonthIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                    <Typography fontSize="13px" color="text.secondary">
                      {startDate ? new Date(startDate).toLocaleDateString() : '—'} → {deadline ? new Date(deadline).toLocaleDateString() : '—'}
            </Typography>
                  </Stack>
                )}

                {/* Tags */}
                {tags && tags.split(',').filter(Boolean).map((tag, idx) => (
                  <Chip 
                    key={idx}
                    label={tag.trim()} 
              size="small"
                    sx={{ 
                      height: 22,
                      fontSize: '11px',
                      bgcolor: '#f3f4f6',
                      color: '#6b7280',
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </Box>

        {/* Tabs Navigation */}
        <Box sx={{ px: 2 }}>
          <Tabs 
            value={tab} 
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 44,
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
                bgcolor: '#7b68ee',
              },
              '& .MuiTab-root': {
                minHeight: 44,
                fontSize: '13px',
                fontWeight: 600,
                textTransform: 'none',
                color: '#6b7280',
                px: 2,
                '&.Mui-selected': {
                  color: '#7b68ee',
                }
              }
            }}
          >
            <Tab value="updates" label={`Updates / ${updates.length}`} />
            <Tab value="files" label={`Files / ${files.length}`} />
            <Tab value="activity" label={`Activity / ${activity.length}`} />
            <Tab value="progress" label="Progress" />
          </Tabs>
        </Box>
      </Box>

      {/* Content Area - 2 Column Layout */}
      <Box sx={{ 
        display: 'flex', 
        height: 'calc(100vh - 220px)',
        overflow: 'hidden'
      }}>
        {/* Main Content - Left Column (scrollable) */}
        <Box sx={{ 
          flex: 1,
          overflow: 'auto',
          bgcolor: 'white',
          p: 3,
        }}>
          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {tab === 'updates' && (
                <Box>
                  {/* Header */}
                  <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ 
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      bgcolor: '#eff6ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <ChatBubbleOutlineIcon sx={{ fontSize: 18, color: '#3b82f6' }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>
                        Comments
            </Typography>
                      <Typography fontSize="12px" color="text.secondary">
                        {updates.length} {updates.length === 1 ? 'comment' : 'comments'}
              </Typography>
            </Box>
                  </Box>

                  {/* Add Comment Form */}
                  <Paper
                    elevation={0}
                    sx={{ 
                      mb: 4,
                      p: 2.5,
                      bgcolor: '#fafbfc',
                      border: '1px solid #e8e9eb',
                      borderRadius: 2
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Avatar sx={{ width: 36, height: 36, bgcolor: '#7b68ee', fontSize: '14px', fontWeight: 600 }}>
                        U
                      </Avatar>
                      <Box sx={{ flex: 1 }} component="form" onSubmit={submitUpdate}>
                      <TextField
                        fullWidth
                          multiline
                          rows={3}
                          placeholder="Add a comment... (Use @ to mention someone)"
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          sx={{
                            mb: 1.5,
                            '& .MuiOutlinedInput-root': {
                              bgcolor: 'white',
                              fontSize: '14px',
                              borderRadius: 2,
                              '&:hover fieldset': {
                                borderColor: '#7b68ee',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#7b68ee',
                              }
                            }
                          }}
                        />
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            onClick={() => setContent("")}
                            sx={{ textTransform: 'none', fontWeight: 600, color: '#6b7280' }}
                          >
                            Clear
                          </Button>
                      <Button
                        size="small"
                            variant="contained"
                            disabled={!content.trim() || posting}
                            startIcon={<SendIcon sx={{ fontSize: 16 }} />}
                            type="submit"
                            sx={{
                              textTransform: 'none',
                              fontWeight: 600,
                              bgcolor: '#7b68ee',
                              '&:hover': { bgcolor: '#6952d6' }
                            }}
                          >
                            Comment
                      </Button>
                        </Stack>
                    </Box>
                    </Stack>
                  </Paper>

                  {/* Comments List */}
                  {updates.length === 0 ? (
                    <Box sx={{ 
                      p: 6, 
                      textAlign: 'center',
                      bgcolor: '#fafbfc',
                      borderRadius: 2,
                      border: '1px dashed #e8e9eb'
                    }}>
                      <ChatBubbleOutlineIcon sx={{ fontSize: 48, color: '#d1d5db', mb: 2 }} />
                      <Typography fontSize="14px" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                        No comments yet
                      </Typography>
                      <Typography fontSize="12px" color="text.secondary">
                        Start the conversation by adding the first comment
                      </Typography>
                  </Box>
                  ) : (
                    <Stack spacing={3}>
                      {updates.map((comment) => (
                        <Paper
                          key={comment._id}
                          elevation={0}
                          sx={{
                            p: 2.5,
                            bgcolor: 'white',
                            border: '1px solid #e8e9eb',
                            borderRadius: 2,
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: '#d1d5db',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                            }
                          }}
                        >
                          <Stack direction="row" spacing={2}>
                            {/* Avatar */}
                            <Avatar 
                              sx={{ 
                                width: 40, 
                                height: 40, 
                                bgcolor: '#7b68ee',
                                fontSize: '16px',
                                fontWeight: 600
                              }}
                            >
                              {(comment.user_id?.full_name || comment.user_id?.email || 'U')[0].toUpperCase()}
                            </Avatar>

                            <Box sx={{ flex: 1 }}>
                              {/* Header */}
                              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                  <Typography fontSize="14px" fontWeight={700} color="text.primary">
                                    {comment.user_id?.full_name || comment.user_id?.email || 'Unknown User'}
            </Typography>
                                  <Typography fontSize="12px" color="text.secondary">
                                    {formatTimeAgo(comment.createdAt)}
                                  </Typography>
                                  {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                                    <Typography fontSize="11px" color="text.secondary" fontStyle="italic">
                                      (edited)
                                    </Typography> 
                                  )}
                                </Stack>

                                {/* Actions Menu */}
                                <IconButton
              size="small"
                                  onClick={(e) => {
                                    setAnchorEl(e.currentTarget);
                                    setSelectedComment(comment);
                                  }}
                                  sx={{ color: '#9ca3af' }}
                                >
                                  <MoreVertIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Stack>

                              {/* Comment Content */}
                              {editingId === comment._id ? (
                                <Box>
            <TextField 
              fullWidth 
                                    multiline
                                    rows={3}
                                    value={editingContent}
                                    onChange={(e) => setEditingContent(e.target.value)}
                                    autoFocus
                                    sx={{
                                      mb: 1.5,
                                      '& .MuiOutlinedInput-root': {
                                        fontSize: '14px',
                                        '&:hover fieldset': {
                                          borderColor: '#7b68ee',
                                        },
                                        '&.Mui-focused fieldset': {
                                          borderColor: '#7b68ee',
                                        }
                                      }
                                    }}
                                  />
                                  <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button 
                                      size="small"
                                      onClick={cancelEdit}
                                      sx={{ textTransform: 'none', fontWeight: 600, color: '#6b7280' }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="small"
                variant="contained" 
                                      onClick={saveEdit}
                                      disabled={!editingContent.trim()}
                                      sx={{
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        bgcolor: '#7b68ee',
                                        '&:hover': { bgcolor: '#6952d6' }
                                      }}
                                    >
                                      Save
              </Button>
                                  </Stack>
            </Box>
                              ) : (
                                <Typography
                                  fontSize="14px"
                                  color="text.primary"
                                  sx={{
                                    lineHeight: 1.6,
                                    whiteSpace: 'pre-wrap'
                                  }}
                                >
                                  {comment.content}
                                </Typography>
                                )}
                              </Box>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  )}

                  {/* Actions Menu */}
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={() => {
                      setAnchorEl(null);
                      setSelectedComment(null);
                    }}
                    PaperProps={{
                      sx: { borderRadius: 2, minWidth: 160 }
                    }}
                  >
                    <MenuItem
                      onClick={() => {
                        setEditingId(selectedComment?._id);
                        setEditingContent(selectedComment?.content);
                        setAnchorEl(null);
                      }}
                      sx={{ fontSize: '13px', gap: 1.5 }}
                    >
                      <EditIcon sx={{ fontSize: 16 }} />
                      Edit
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        deleteComment(selectedComment?._id);
                        setAnchorEl(null);
                        setSelectedComment(null);
                      }}
                      sx={{ fontSize: '13px', gap: 1.5, color: '#ef4444' }}
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                      Delete
                    </MenuItem>
                  </Menu>
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

        {/* Sidebar - Right Column (fixed properties) */}
        <Box sx={{ 
          width: 280,
          borderLeft: '1px solid #e8e9eb',
          bgcolor: 'white',
          p: 2.5,
          overflow: 'auto',
        }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#1f2937' }}>
            Properties
          </Typography>

          <Stack spacing={2.5}>
            {/* Title */}
            <Box>
              <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, mb: 0.5, display: 'block' }}>
                TITLE
              </Typography>
              <TextField 
                value={title} 
                onChange={(e)=>setTitle(e.target.value)} 
                fullWidth 
                size="small" 
                required
                error={!title.trim()}
                placeholder="Enter milestone title"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: '14px',
                  }
                }}
              />
          </Box>

            {/* Status */}
            <Box>
              <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, mb: 0.5, display: 'block' }}>
                STATUS
              </Typography>
              <FormControl fullWidth size="small">
                <Select 
                  value={statusId} 
                  onChange={(e)=>setStatusId(e.target.value)}
                  displayEmpty
                  sx={{ fontSize: '14px' }}
                >
                  <MenuItem value="">— None —</MenuItem>
                  {statuses.map((s) => (
                    <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
        </Box>

            {/* Priority */}
            <Box>
              <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, mb: 0.5, display: 'block' }}>
                PRIORITY
              </Typography>
              <FormControl fullWidth size="small">
                <Select 
                  value={priorityId} 
                  onChange={(e)=>setPriorityId(e.target.value)}
                  displayEmpty
                  sx={{ fontSize: '14px' }}
                >
                  <MenuItem value="">— None —</MenuItem>
                  {priorities.map((p) => (
                    <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Divider />

            {/* Start Date */}
            <Box>
              <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, mb: 0.5, display: 'block' }}>
                START DATE
              </Typography>
              <TextField 
                type="date" 
                value={startDate} 
                onChange={(e)=>setStartDate(e.target.value)} 
                fullWidth 
                size="small" 
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: '14px',
                  }
                }}
              />
            </Box>

            {/* Deadline */}
            <Box>
              <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, mb: 0.5, display: 'block' }}>
                DEADLINE
              </Typography>
              <TextField 
                type="date" 
                value={deadline} 
                onChange={(e)=>setDeadline(e.target.value)} 
                fullWidth 
                size="small" 
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: '14px',
                  }
                }}
              />
            </Box>

            <Divider />

            {/* Description */}
            <Box>
              <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, mb: 0.5, display: 'block' }}>
                DESCRIPTION
              </Typography>
              <TextField 
                value={description} 
                onChange={(e)=>setDescription(e.target.value)} 
                multiline 
                minRows={3} 
                fullWidth 
                size="small"
                placeholder="Add description..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: '14px',
                  }
                }}
              />
            </Box>

            {/* Tags */}
            <Box>
              <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, mb: 0.5, display: 'block' }}>
                TAGS
              </Typography>
              <TextField 
                value={tags} 
                onChange={(e)=>setTags(e.target.value)} 
                fullWidth 
                size="small" 
                placeholder="tag1, tag2, tag3"
                helperText="Comma separated"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: '14px',
                  }
                }}
              />
            </Box>

            <Divider />

            {/* Files Count */}
            <Box>
              <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, mb: 0.5, display: 'block' }}>
                FILES
              </Typography>
              <Chip 
                label={`${files.length} file${files.length !== 1 ? 's' : ''}`} 
                size="small"
                sx={{ 
                  bgcolor: '#f3f4f6',
                  color: '#374151',
                  fontWeight: 600,
                }}
              />
            </Box>

            {/* Last Updated */}
            <Box>
              <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, mb: 0.5, display: 'block' }}>
                LAST UPDATED
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '13px', color: '#6b7280' }}>
                {activity[0]?.createdAt ? new Date(activity[0].createdAt).toLocaleString() : '—'}
              </Typography>
            </Box>

            <Divider />

            {/* Save Button */}
            <Button 
              variant="contained" 
              fullWidth
              disabled={saving || !title.trim()} 
              onClick={async ()=>{ 
                setSaving(true); 
                try { 
                  await axiosInstance.patch(`/api/projects/${projectId}/milestones/${milestoneId}`, { 
                    title, 
                    description, 
                    priority_id: priorityId || undefined,
                    status_id: statusId || undefined,
                    start_date: startDate ? new Date(startDate).toISOString() : undefined, 
                    deadline: deadline ? new Date(deadline).toISOString() : undefined,
                    tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []
                  });
                  // Refresh activity logs to show the update
                  const a = await axiosInstance.get(`/api/projects/${projectId}/milestones/${milestoneId}/activity-logs`);
                  setActivity(Array.isArray(a.data) ? a.data : []);
                  toast.success('Milestone updated successfully!', {
                    description: title,
                  });
                  // Notify parent to refresh data/charts
                  if (onUpdate) onUpdate();
                } catch (error: any) {
                  const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error';
                  toast.error('Failed to update milestone', {
                    description: errorMessage,
                  });
                } finally { 
                  setSaving(false); 
                } 
              }}
              sx={{
                bgcolor: '#7b68ee',
                '&:hover': {
                  bgcolor: '#6952d6',
                }
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
}


