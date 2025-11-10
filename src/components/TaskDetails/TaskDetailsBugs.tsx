"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Divider,
  Alert,
  Tooltip,
  Avatar,
  LinearProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import BugReportIcon from "@mui/icons-material/BugReport";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import axiosInstance from "../../../ultis/axios";

interface Bug {
  _id: string;
  title: string;
  description?: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed' | 'Reopened';
  assignee_id?: {
    _id: string;
    full_name?: string;
    email?: string;
    avatar?: string;
  };
  assigner_id?: {
    _id: string;
    full_name?: string;
    email?: string;
  };
  solution?: string;
  deadline?: string;
  createAt?: string;
  updateAt?: string;
  task_id?: {
    _id: string;
    title: string;
    status?: string;
  };
  relationship_type?: 'blocks' | 'relates_to' | 'affects';
  affected_tasks?: Array<{
    _id: string;
    title: string;
    status?: string;
  }>;
}

interface TaskDetailsBugsProps {
  taskId: string;
  projectId?: string;
}

const SEVERITY_COLORS = {
  Critical: '#D31027',
  High: '#FF6B35',
  Medium: '#FFAA00',
  Low: '#4CAF50',
};

const STATUS_COLORS = {
  Open: '#0095FF',
  'In Progress': '#FFAA00',
  Resolved: '#00D68F',
  Closed: '#8E8E93',
  Reopened: '#FF3D71',
};

export default function TaskDetailsBugs({ taskId, projectId }: TaskDetailsBugsProps) {
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBug, setEditingBug] = useState<Bug | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'Medium' as const,
    priority: 'Medium' as const,
    status: 'Open' as const,
    solution: '',
    deadline: '',
    assignee_id: '',
    relationship_type: 'relates_to' as const,
    affected_tasks: [] as string[],
  });
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    if (taskId && projectId) {
      fetchBugs();
      fetchTeamMembers();
    }
  }, [taskId, projectId]);

  const fetchBugs = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/defects`, {
        params: { 
          project_id: projectId,
          task_id: taskId // Filter bugs related to this task
        }
      });
      setBugs(response.data.defects || []);
    } catch (error) {
      console.error('Error fetching bugs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await axiosInstance.get(`/api/projects/${projectId}/members`);
      setTeamMembers(response.data.members || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const handleOpenDialog = (bug?: Bug) => {
    if (bug) {
      setEditingBug(bug);
      setFormData({
        title: bug.title,
        description: bug.description || '',
        severity: bug.severity,
        priority: bug.priority,
        status: bug.status,
        solution: bug.solution || '',
        deadline: bug.deadline ? bug.deadline.split('T')[0] : '',
        assignee_id: bug.assignee_id?._id || '',
        relationship_type: bug.relationship_type || 'relates_to',
        affected_tasks: bug.affected_tasks?.map(t => t._id) || [],
      });
    } else {
      setEditingBug(null);
      setFormData({
        title: '',
        description: '',
        severity: 'Medium',
        priority: 'Medium',
        status: 'Open',
        solution: '',
        deadline: '',
        assignee_id: '',
        relationship_type: 'relates_to',
        affected_tasks: [],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingBug(null);
    setError('');
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError('');

      // Frontend Validation
      if (!formData.title.trim()) {
        setError('Title is required');
        setSubmitting(false);
        return;
      }

      if (formData.title.trim().length < 5) {
        setError('Title must be at least 5 characters');
        setSubmitting(false);
        return;
      }

      if (formData.title.length > 200) {
        setError('Title must not exceed 200 characters');
        setSubmitting(false);
        return;
      }

      if (formData.description && formData.description.length > 2000) {
        setError('Description must not exceed 2000 characters');
        setSubmitting(false);
        return;
      }

      if (formData.solution && formData.solution.length > 2000) {
        setError('Solution must not exceed 2000 characters');
        setSubmitting(false);
        return;
      }

      // Validate deadline is not in the past
      if (formData.deadline) {
        const deadlineDate = new Date(formData.deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (deadlineDate < today) {
          setError('Deadline cannot be in the past');
          setSubmitting(false);
          return;
        }
      }

      // Validate that if relationship_type is 'affects', there should be affected_tasks
      if (formData.relationship_type === 'affects' && formData.affected_tasks.length === 0) {
        setError('When relationship type is "Affects", you must specify at least one affected task');
        setSubmitting(false);
        return;
      }

      // Clean up form data - remove empty strings
      const submitData = {
        ...formData,
        title: formData.title.trim(),
        assignee_id: formData.assignee_id || undefined,
        solution: formData.solution || undefined,
        deadline: formData.deadline || undefined,
        description: formData.description || undefined,
        task_id: taskId, // Link bug to current task
        relationship_type: formData.relationship_type,
        affected_tasks: formData.affected_tasks.length > 0 ? formData.affected_tasks : undefined,
      };

      if (editingBug) {
        await axiosInstance.patch(`/api/defects/${editingBug._id}`, submitData);
      } else {
        await axiosInstance.post(`/api/defects`, {
          ...submitData,
          project_id: projectId,
        });
      }
      handleCloseDialog();
      fetchBugs();
    } catch (error: any) {
      console.error('Error saving bug:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to save bug. Please try again.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (bugId: string) => {
    if (!confirm('Are you sure you want to delete this bug?')) return;
    
    try {
      await axiosInstance.delete(`/api/defects/${bugId}`);
      fetchBugs();
    } catch (error) {
      console.error('Error deleting bug:', error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return <ErrorOutlineIcon sx={{ fontSize: 16 }} />;
      case 'High':
        return <PriorityHighIcon sx={{ fontSize: 16 }} />;
      default:
        return <BugReportIcon sx={{ fontSize: 16 }} />;
    }
  };

  if (loading && bugs.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <LinearProgress />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Loading bugs...
        </Typography>
      </Box>
    );
  }

  const bugStats = {
    total: bugs.length,
    open: bugs.filter(b => b.status === 'Open').length,
    inProgress: bugs.filter(b => b.status === 'In Progress').length,
    resolved: bugs.filter(b => b.status === 'Resolved').length,
    critical: bugs.filter(b => b.severity === 'Critical').length,
    high: bugs.filter(b => b.severity === 'High').length,
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '16px' }}>
              Bugs & Defects
            </Typography>
            {bugs.length > 0 && (
              <Chip 
                label={bugStats.total} 
                size="small" 
                sx={{ 
                  height: 20, 
                  fontSize: '11px',
                  fontWeight: 600,
                  bgcolor: '#f0f0f0'
                }} 
              />
            )}
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Track and manage bugs related to this task
          </Typography>
          {bugs.length > 0 && (
            <Stack direction="row" spacing={1.5} flexWrap="wrap">
              <Typography variant="caption" fontSize="11px" color="text.secondary">
                Open: <strong>{bugStats.open}</strong>
              </Typography>
              <Typography variant="caption" fontSize="11px" color="text.secondary">
                • In Progress: <strong>{bugStats.inProgress}</strong>
              </Typography>
              <Typography variant="caption" fontSize="11px" color="text.secondary">
                • Resolved: <strong>{bugStats.resolved}</strong>
              </Typography>
              {bugStats.critical > 0 && (
                <Typography variant="caption" fontSize="11px" sx={{ color: SEVERITY_COLORS.Critical, fontWeight: 600 }}>
                  • Critical: {bugStats.critical}
                </Typography>
              )}
              {bugStats.high > 0 && (
                <Typography variant="caption" fontSize="11px" sx={{ color: SEVERITY_COLORS.High, fontWeight: 600 }}>
                  • High: {bugStats.high}
                </Typography>
              )}
            </Stack>
          )}
        </Box>
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          size="small"
          onClick={() => handleOpenDialog()}
          sx={{
            textTransform: 'none',
            bgcolor: '#FF3D71',
            '&:hover': { bgcolor: '#D31027' }
          }}
        >
          Report Bug
        </Button>
      </Stack>

      {bugs.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#f8f9fa' }}>
          <BugReportIcon sx={{ fontSize: 64, color: '#8E8E93', mb: 2 }} />
          <Typography variant="body1" color="text.secondary" gutterBottom>
            No bugs reported yet
          </Typography>
          <Typography variant="body2" color="text.secondary" fontSize="13px">
            Report the first bug to start tracking defects
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {bugs.map((bug) => (
            <Paper
              key={bug._id}
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                '&:hover': {
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  borderColor: SEVERITY_COLORS[bug.severity],
                }
              }}
            >
              <Stack spacing={1.5}>
                {/* Header */}
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ flex: 1 }}>
                    <Box sx={{ 
                      mt: 0.5, 
                      color: SEVERITY_COLORS[bug.severity] 
                    }}>
                      {getSeverityIcon(bug.severity)}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '14px', mb: 0.5 }}>
                        {bug.title}
                      </Typography>
                      {bug.description && (
                        <Typography variant="body2" color="text.secondary" fontSize="13px">
                          {bug.description}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleOpenDialog(bug)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => handleDelete(bug._id)} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>

                {/* Tags */}
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip
                    label={bug.severity}
                    size="small"
                    sx={{
                      bgcolor: `${SEVERITY_COLORS[bug.severity]}15`,
                      color: SEVERITY_COLORS[bug.severity],
                      fontWeight: 600,
                      fontSize: '11px',
                      height: 22,
                    }}
                  />
                  <Chip
                    label={bug.status}
                    size="small"
                    sx={{
                      bgcolor: `${STATUS_COLORS[bug.status]}15`,
                      color: STATUS_COLORS[bug.status],
                      fontWeight: 600,
                      fontSize: '11px',
                      height: 22,
                    }}
                  />
                  <Chip
                    label={`Priority: ${bug.priority}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '11px', height: 22 }}
                  />
                  {bug.relationship_type && (
                    <Chip
                      label={bug.relationship_type === 'blocks' ? '🚫 Blocks' : bug.relationship_type === 'affects' ? '⚠️ Affects' : '🔗 Related'}
                      size="small"
                      sx={{
                        bgcolor: bug.relationship_type === 'blocks' ? '#fee2e2' : bug.relationship_type === 'affects' ? '#fef3c7' : '#e0e7ff',
                        color: bug.relationship_type === 'blocks' ? '#991b1b' : bug.relationship_type === 'affects' ? '#92400e' : '#3730a3',
                        fontWeight: 600,
                        fontSize: '11px',
                        height: 22,
                      }}
                    />
                  )}
                </Stack>

                {/* Footer */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                  <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" gap={1}>
                    {bug.assignee_id && (
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Tooltip title={bug.assignee_id.full_name || bug.assignee_id.email}>
                          <Avatar
                            src={bug.assignee_id.avatar}
                            sx={{ width: 24, height: 24, fontSize: '12px' }}
                          >
                            {(bug.assignee_id.full_name || bug.assignee_id.email)?.charAt(0).toUpperCase()}
                          </Avatar>
                        </Tooltip>
                        <Typography variant="caption" color="text.secondary" fontSize="11px">
                          Assigned to {bug.assignee_id.full_name || bug.assignee_id.email}
                        </Typography>
                      </Stack>
                    )}
                    {bug.assigner_id && (
                      <Typography variant="caption" color="text.secondary" fontSize="11px">
                        • Reported by {bug.assigner_id.full_name || bug.assigner_id.email}
                      </Typography>
                    )}
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {bug.deadline && (
                      <Typography variant="caption" color="text.secondary" fontSize="11px">
                        Due: {new Date(bug.deadline).toLocaleDateString()}
                      </Typography>
                    )}
                    {bug.createAt && (
                      <Typography variant="caption" color="text.secondary" fontSize="11px">
                        • Created: {new Date(bug.createAt).toLocaleDateString()}
                      </Typography>
                    )}
                  </Stack>
                </Stack>

                {bug.solution && (bug.status === 'Resolved' || bug.status === 'Closed') && (
                  <>
                    <Divider />
                    <Box sx={{ 
                      bgcolor: '#f0f9ff', 
                      p: 1.5, 
                      borderRadius: 1,
                      border: '1px solid #bfdbfe'
                    }}>
                      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.5 }}>
                        <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} />
                        <Typography variant="caption" fontWeight={600} color="success.main" fontSize="11px">
                          Solution:
                        </Typography>
                      </Stack>
                      <Typography variant="body2" fontSize="12px" sx={{ color: 'text.primary' }}>
                        {bug.solution}
                      </Typography>
                      {bug.updateAt && (
                        <Typography variant="caption" color="text.secondary" fontSize="10px" sx={{ mt: 0.5, display: 'block' }}>
                          Last updated: {new Date(bug.updateAt).toLocaleString()}
                        </Typography>
                      )}
                    </Box>
                  </>
                )}
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{editingBug ? 'Edit Bug' : 'Report New Bug'}</Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Bug Title"
              fullWidth
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              error={formData.title.trim().length > 0 && formData.title.trim().length < 5}
              helperText={
                formData.title.trim().length > 0 && formData.title.trim().length < 5
                  ? 'Title must be at least 5 characters'
                  : `${formData.title.length}/200 characters`
              }
              inputProps={{ maxLength: 200 }}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              error={formData.description.length > 2000}
              helperText={
                formData.description.length > 2000
                  ? 'Description exceeds 2000 characters'
                  : `${formData.description.length}/2000 characters - Describe what went wrong, steps to reproduce, expected vs actual behavior`
              }
              placeholder="Describe what went wrong, steps to reproduce, expected vs actual behavior..."
              inputProps={{ maxLength: 2000 }}
            />
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={formData.severity}
                  label="Severity"
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                >
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Critical">Critical</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  label="Priority"
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                >
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                <MenuItem value="Open">Open</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Resolved">Resolved</MenuItem>
                <MenuItem value="Closed">Closed</MenuItem>
                <MenuItem value="Reopened">Reopened</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Assign To</InputLabel>
              <Select
                value={formData.assignee_id}
                label="Assign To"
                onChange={(e) => setFormData({ ...formData, assignee_id: e.target.value })}
              >
                <MenuItem value="">
                  <em>Unassigned</em>
                </MenuItem>
                {teamMembers.map((member) => (
                  <MenuItem key={member._id} value={member._id}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar
                        src={member.avatar}
                        sx={{ width: 24, height: 24, fontSize: '11px' }}
                      >
                        {(member.full_name || member.email)?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography fontSize="14px">
                        {member.full_name || member.email}
                      </Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {formData.status === 'Resolved' && (
              <TextField
                label="Solution"
                fullWidth
                multiline
                rows={2}
                value={formData.solution}
                onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                error={formData.solution.length > 2000}
                helperText={
                  formData.solution.length > 2000
                    ? 'Solution exceeds 2000 characters'
                    : `${formData.solution.length}/2000 characters - Describe how this bug was resolved`
                }
                inputProps={{ maxLength: 2000 }}
              />
            )}
            <TextField
              label="Deadline"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              inputProps={{ 
                min: new Date().toISOString().split('T')[0] 
              }}
              helperText="Set a deadline for resolving this bug (cannot be in the past)"
            />
            
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Relationship with Task/Subtask
            </Typography>
            
            <FormControl fullWidth>
              <InputLabel>Relationship Type</InputLabel>
              <Select
                value={formData.relationship_type}
                label="Relationship Type"
                onChange={(e) => setFormData({ ...formData, relationship_type: e.target.value as any })}
              >
                <MenuItem value="relates_to">
                  <Stack>
                    <Typography fontSize="14px" fontWeight={600}>Relates To</Typography>
                    <Typography fontSize="12px" color="text.secondary">Bug is related to this task</Typography>
                  </Stack>
                </MenuItem>
                <MenuItem value="blocks">
                  <Stack>
                    <Typography fontSize="14px" fontWeight={600}>Blocks</Typography>
                    <Typography fontSize="12px" color="text.secondary">Bug blocks task completion (must fix first)</Typography>
                  </Stack>
                </MenuItem>
                <MenuItem value="affects">
                  <Stack>
                    <Typography fontSize="14px" fontWeight={600}>Affects</Typography>
                    <Typography fontSize="12px" color="text.secondary">Bug affects multiple tasks/subtasks</Typography>
                  </Stack>
                </MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.title || submitting}
            sx={{ bgcolor: '#FF3D71', '&:hover': { bgcolor: '#D31027' } }}
          >
            {submitting ? 'Saving...' : editingBug ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

