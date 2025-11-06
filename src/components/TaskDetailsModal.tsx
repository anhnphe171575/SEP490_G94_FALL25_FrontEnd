"use client";

import { useState, useEffect } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Divider,
  Chip,
  Stack,
  LinearProgress,
  Avatar,
  Tooltip,
  TextField,
  Select,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  Breadcrumbs,
  Link,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FlagIcon from "@mui/icons-material/Flag";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PersonIcon from "@mui/icons-material/Person";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ShareIcon from "@mui/icons-material/Share";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import axiosInstance from "../../ultis/axios";

import TaskDetailsOverview from "./TaskDetails/TaskDetailsOverview";
import TaskDetailsSubtasks from "./TaskDetails/TaskDetailsSubtasks";
import TaskDetailsDependencies from "./TaskDetails/TaskDetailsDependencies";
import TaskDetailsDevelopment from "./TaskDetails/TaskDetailsDevelopment";
import TaskDetailsCICD from "./TaskDetails/TaskDetailsCICD";
import TaskDetailsTimeLogs from "./TaskDetails/TaskDetailsTimeLogs";
import TaskDetailsComments from "./TaskDetails/TaskDetailsComments";
import TaskDetailsAttachments from "./TaskDetails/TaskDetailsAttachments";
import TaskDetailsActivity from "./TaskDetails/TaskDetailsActivity";

type Task = {
  _id: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assignee_id?: any;
  assigner_id?: any;
  feature_id?: any;
  function_id?: any;
  milestone_id?: any;
  start_date?: string;
  deadline?: string;
  estimate?: number;
  actual?: number;
  progress?: number;
  parent_task_id?: string;
  tags?: string[];
  time_tracking?: {
    is_active: boolean;
    total_time: number;
  };
  createdAt?: string;
  updatedAt?: string;
};

interface TaskDetailsModalProps {
  open: boolean;
  taskId: string | null;
  projectId?: string;
  onClose: () => void;
  onUpdate?: () => void;
  onTaskChange?: (newTaskId: string) => void; // Callback to switch to another task
}

export default function TaskDetailsModal({ open, taskId, projectId, onClose, onUpdate, onTaskChange }: TaskDetailsModalProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [allStatuses, setAllStatuses] = useState<any[]>([]);
  const [allPriorities, setAllPriorities] = useState<any[]>([]);
  const [allFeatures, setAllFeatures] = useState<any[]>([]);
  const [allFunctions, setAllFunctions] = useState<any[]>([]);
  
  // Check if this is a subtask
  const isSubtask = !!task?.parent_task_id;

  // Handle subtask click - switch to view that subtask
  const handleSubtaskClick = (subtaskId: string) => {
    if (onTaskChange) {
      onTaskChange(subtaskId);
    }
  };

  // Get tab name from index (handles dynamic tabs for subtask)
  const getTabContent = (index: number) => {
    if (isSubtask) {
      // For subtasks: Overview, Time, Comments, Files, Activity
      const tabMap = ['overview', 'time', 'comments', 'files', 'activity'];
      return tabMap[index];
    } else {
      // For tasks: Overview, Subtasks, Dependencies, Development, CI/CD, Time, Comments, Files, Activity
      const tabMap = ['overview', 'subtasks', 'dependencies', 'development', 'cicd', 'time', 'comments', 'files', 'activity'];
      return tabMap[index];
    }
  };

  useEffect(() => {
    if (open && taskId) {
      setCurrentTab(0); // Reset to Overview tab when task changes
      loadTaskDetails();
      loadSettings();
      if (projectId) {
        loadFeatures();
      }
    }
  }, [open, taskId, projectId]);
  
  const loadSettings = async () => {
    try {
      const response = await axiosInstance.get('/api/settings');
      const settings = response.data || [];
      setAllStatuses(settings.filter((s: any) => s.type_id === 2));
      setAllPriorities(settings.filter((s: any) => s.type_id === 3));
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadFeatures = async () => {
    if (!projectId) return;
    try {
      const response = await axiosInstance.get(`/api/projects/${projectId}/features`);
      setAllFeatures(response.data || []);
    } catch (error) {
      console.error('Error loading features:', error);
    }
  };

  const loadFunctions = async (featureId: string) => {
    if (!featureId) {
      setAllFunctions([]);
      return;
    }
    if (!projectId) {
      console.error('Error loading functions: projectId is required');
      setAllFunctions([]);
      return;
    }
    try {
      const response = await axiosInstance.get(`/api/projects/${projectId}/features/${featureId}/functions`);
      setAllFunctions(response.data || []);
    } catch (error) {
      console.error('Error loading functions:', error);
      setAllFunctions([]);
    }
  };

  const loadTaskDetails = async () => {
    if (!taskId) return;
    
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/tasks/${taskId}`);
      setTask(response.data);
      
      // Load functions if task has feature_id
      const featureId = response.data?.feature_id?._id || response.data?.feature_id;
      if (featureId) {
        await loadFunctions(featureId);
      }
    } catch (error: any) {
      console.error("Error loading task:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdate = async (updates: any) => {
    try {
      await axiosInstance.patch(`/api/tasks/${taskId}`, updates);
      await loadTaskDetails();
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error("Error updating task:", error);
      throw error;
    }
  };

  const getStatusColor = (status: string) => {
    const key = (status || '').toLowerCase();
    if (key.includes('completed') || key.includes('done')) return '#16a34a';
    if (key.includes('progress') || key.includes('doing')) return '#f59e0b';
    if (key.includes('overdue') || key.includes('blocked')) return '#ef4444';
    return '#9ca3af';
  };

  const getPriorityColor = (priority: string) => {
    const key = (priority || '').toLowerCase();
    if (key.includes('critical') || key.includes('high')) return '#ef4444';
    if (key.includes('medium')) return '#f59e0b';
    return '#3b82f6';
  };

  if (!task && !loading) return null;

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
              {task?.feature_id?.title || 'Feature'}
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
              {task?.title || 'Task Details'}
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

        {/* Task Title & Quick Actions */}
        <Box sx={{ px: 3, py: 2.5 }}>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            {/* Checkbox */}
            <IconButton 
              size="small" 
              sx={{ 
                mt: 0.5,
                color: task?.status === 'Done' ? '#10b981' : '#d1d5db',
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
                  cursor: 'text',
                  '&:hover': {
                    bgcolor: '#f9fafb',
                    px: 1,
                    mx: -1,
                    borderRadius: 1,
                  }
                }}
              >
                {task?.title || 'Loading...'}
              </Typography>

              {/* Meta Info Row */}
              <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
                {/* Status */}
                {task?.status && (
                  <Chip 
                    label={typeof task.status === 'object' ? (task.status as any)?.name : task.status} 
                    size="small"
                    sx={{ 
                      height: 24,
                      fontSize: '12px',
                      fontWeight: 600,
                      bgcolor: `${getStatusColor(typeof task.status === 'object' ? (task.status as any)?.name : task.status)}15`,
                      color: getStatusColor(typeof task.status === 'object' ? (task.status as any)?.name : task.status),
                      border: `1px solid ${getStatusColor(typeof task.status === 'object' ? (task.status as any)?.name : task.status)}40`,
                    }}
                  />
                )}

                {/* Priority */}
                {task?.priority && (
                  <Chip 
                    icon={<FlagIcon sx={{ fontSize: 14 }} />}
                    label={typeof task.priority === 'object' ? (task.priority as any)?.name : task.priority} 
                    size="small"
                    sx={{ 
                      height: 24,
                      fontSize: '12px',
                      fontWeight: 600,
                      bgcolor: `${getPriorityColor(typeof task.priority === 'object' ? (task.priority as any)?.name : task.priority)}15`,
                      color: getPriorityColor(typeof task.priority === 'object' ? (task.priority as any)?.name : task.priority),
                      border: `1px solid ${getPriorityColor(typeof task.priority === 'object' ? (task.priority as any)?.name : task.priority)}40`,
                    }}
                  />
                )}

                {/* Assignee */}
                {task?.assignee_id && (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Avatar 
                      sx={{ 
                        width: 24, 
                        height: 24, 
                        fontSize: '11px',
                        bgcolor: '#7b68ee',
                        fontWeight: 600
                      }}
                    >
                      {(task.assignee_id?.full_name || task.assignee_id?.email || 'U')[0].toUpperCase()}
                    </Avatar>
                    <Typography fontSize="13px" color="text.secondary">
                      {task.assignee_id?.full_name || task.assignee_id?.email}
                    </Typography>
                  </Stack>
                )}

                {/* Due Date */}
                {task?.deadline && (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <CalendarMonthIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                    <Typography fontSize="13px" color="text.secondary">
                      {new Date(task.deadline).toLocaleDateString()}
                    </Typography>
                  </Stack>
                )}

                {/* Progress */}
                {task?.progress !== undefined && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ 
                      width: 60, 
                      height: 6, 
                      bgcolor: '#e5e7eb', 
                      borderRadius: 3,
                      overflow: 'hidden'
                    }}>
                      <Box sx={{ 
                        width: `${task.progress}%`, 
                        height: '100%', 
                        bgcolor: '#7b68ee',
                        transition: 'width 0.3s'
                      }} />
                    </Box>
                    <Typography fontSize="12px" fontWeight={600} color="text.secondary">
                      {task.progress}%
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          </Stack>
        </Box>

        {/* Tabs Navigation */}
        <Box sx={{ px: 2 }}>
          <Tabs 
            value={currentTab} 
            onChange={(_, v) => setCurrentTab(v)}
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
            <Tab label="Overview" />
            {!isSubtask && <Tab label="Subtasks" />}
            {!isSubtask && <Tab label="Dependencies" />}
            {!isSubtask && <Tab label="Development" />}
            {!isSubtask && <Tab label="CI/CD" />}
            <Tab label="Time" />
            <Tab label="Comments" />
            <Tab label="Files" />
            <Tab label="Activity" />
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
              <Typography>Loading...</Typography>
            </Box>
          ) : (
            <>
              {getTabContent(currentTab) === 'overview' && <TaskDetailsOverview task={task} onUpdate={handleTaskUpdate} />}
              {getTabContent(currentTab) === 'subtasks' && <TaskDetailsSubtasks taskId={taskId} task={task} statusOptions={allStatuses} projectId={projectId} onSubtaskClick={handleSubtaskClick} />}
              {getTabContent(currentTab) === 'dependencies' && <TaskDetailsDependencies taskId={taskId} projectId={projectId} />}
              {getTabContent(currentTab) === 'development' && <TaskDetailsDevelopment taskId={taskId} projectId={projectId} />}
              {getTabContent(currentTab) === 'cicd' && <TaskDetailsCICD taskId={taskId} projectId={projectId} />}
              {getTabContent(currentTab) === 'time' && <TaskDetailsTimeLogs taskId={taskId} task={task} onUpdate={loadTaskDetails} />}
              {getTabContent(currentTab) === 'comments' && <TaskDetailsComments taskId={taskId} />}
              {getTabContent(currentTab) === 'files' && <TaskDetailsAttachments taskId={taskId} />}
              {getTabContent(currentTab) === 'activity' && <TaskDetailsActivity taskId={taskId} />}
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
          <Typography 
            variant="subtitle2" 
            fontWeight={700} 
            sx={{ mb: 2, color: '#6b7280', fontSize: '11px', textTransform: 'uppercase' }}
          >
            Properties
          </Typography>

          <Stack spacing={2.5}>
            {/* Status */}
            <Box>
              <Typography fontSize="12px" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                Status
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={typeof task?.status === 'object' ? (task.status as any)?._id : task?.status || ''}
                  onChange={async (e) => {
                    try {
                      await handleTaskUpdate({ status: e.target.value });
                    } catch (error) {
                      console.error('Error updating status:', error);
                    }
                  }}
                  displayEmpty
                  renderValue={(value) => {
                    const statusObj = allStatuses.find(s => s._id === value);
                    return statusObj?.name || 'Select status';
                  }}
                  sx={{ 
                    fontSize: '13px', 
                    fontWeight: 500,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e8e9eb',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#7b68ee',
                    }
                  }}
                >
                  {allStatuses.map((s) => (
                    <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Priority */}
            <Box>
              <Typography fontSize="12px" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                Priority
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={typeof task?.priority === 'object' ? (task.priority as any)?._id : task?.priority || ''}
                  onChange={async (e) => {
                    try {
                      await handleTaskUpdate({ priority: e.target.value || null });
                    } catch (error) {
                      console.error('Error updating priority:', error);
                    }
                  }}
                  displayEmpty
                  renderValue={(value) => {
                    if (!value) return 'No priority';
                    const priorityObj = allPriorities.find(p => p._id === value);
                    const name = priorityObj?.name || '';
                    const emoji = name.toLowerCase().includes('critical') ? '🔥'
                      : name.toLowerCase().includes('high') ? '🔴'
                      : name.toLowerCase().includes('medium') ? '🟡'
                      : '🟢';
                    return `${emoji} ${name}`;
                  }}
                  sx={{ 
                    fontSize: '13px', 
                    fontWeight: 500,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e8e9eb',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#7b68ee',
                    }
                  }}
                >
                  <MenuItem value="">No Priority</MenuItem>
                  {allPriorities.map((p) => {
                    const emoji = p.name.toLowerCase().includes('critical') ? '🔥'
                      : p.name.toLowerCase().includes('high') ? '🔴'
                      : p.name.toLowerCase().includes('medium') ? '🟡'
                      : '🟢';
                    return (
                      <MenuItem key={p._id} value={p._id}>
                        {emoji} {p.name}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Box>

            {/* Feature & Function - Hide for Subtasks */}
            {!isSubtask && (
              <>
            <Divider />

                {/* Feature */}
                <Box>
              <Typography fontSize="12px" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                Feature
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={typeof task?.feature_id === 'object' ? task.feature_id?._id || '' : task?.feature_id || ''}
                  onChange={async (e) => {
                    const newFeatureId = e.target.value;
                    try {
                      await handleTaskUpdate({ 
                        feature_id: newFeatureId || null,
                        function_id: null // Reset function when feature changes
                      });
                      // Load functions for new feature
                      if (newFeatureId) {
                        await loadFunctions(newFeatureId);
                      } else {
                        setAllFunctions([]);
                      }
                    } catch (error) {
                      console.error('Error updating feature:', error);
                      alert('Không thể cập nhật feature. Vui lòng thử lại.');
                    }
                  }}
                  displayEmpty
                  renderValue={(value) => {
                    if (!value) return <em style={{ color: '#9ca3af' }}>Chọn feature</em>;
                    const selected = allFeatures.find((f: any) => f._id === value);
                    const title = selected?.title || 'Unknown';
                    return (
                      <Tooltip title={title} arrow placement="top">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#3b82f6', flexShrink: 0 }} />
                          <Typography 
                            fontSize="13px" 
                            fontWeight={500}
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {title}
                          </Typography>
                        </Box>
                      </Tooltip>
                    );
                  }}
                  sx={{ 
                    fontSize: '13px',
                    fontWeight: 500,
                    bgcolor: '#f0f9ff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#bae6fd',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3b82f6',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3b82f6',
                    }
                  }}
                >
                  <MenuItem value=""><em>Không chọn</em></MenuItem>
                  {allFeatures.map((f: any) => (
                    <MenuItem key={f._id} value={f._id}>
                      <Tooltip title={f.title} arrow placement="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden', width: '100%' }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#3b82f6', flexShrink: 0 }} />
                          <Typography 
                            fontSize="13px" 
                            fontWeight={500}
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {f.title}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Function */}
            <Box>
              <Typography fontSize="12px" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                Function
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={typeof task?.function_id === 'object' ? task.function_id?._id || '' : task?.function_id || ''}
                  onChange={async (e) => {
                    try {
                      await handleTaskUpdate({ function_id: e.target.value || null });
                    } catch (error) {
                      console.error('Error updating function:', error);
                      alert('Không thể cập nhật function. Vui lòng thử lại.');
                    }
                  }}
                  disabled={!task?.feature_id}
                  displayEmpty
                  renderValue={(value) => {
                    if (!value) return <em style={{ color: '#9ca3af' }}>Chọn function</em>;
                    const selected = allFunctions.find((f: any) => f._id === value);
                    const title = selected?.title || 'Unknown';
                    return (
                      <Tooltip title={title} arrow placement="top">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#8b5cf6', flexShrink: 0 }} />
                          <Typography 
                            fontSize="13px" 
                            fontWeight={500}
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {title}
                          </Typography>
                        </Box>
                      </Tooltip>
                    );
                  }}
                  sx={{ 
                    fontSize: '13px',
                    fontWeight: 500,
                    bgcolor: task?.feature_id ? '#faf5ff' : '#f9fafb',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: task?.feature_id ? '#e9d5ff' : '#e5e7eb',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: task?.feature_id ? '#8b5cf6' : '#d1d5db',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8b5cf6',
                    }
                  }}
                >
                  <MenuItem value=""><em>Không chọn</em></MenuItem>
                  {allFunctions.map((fn: any) => (
                    <MenuItem key={fn._id} value={fn._id}>
                      <Tooltip title={fn.title} arrow placement="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden', width: '100%' }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#8b5cf6', flexShrink: 0 }} />
                          <Typography 
                            fontSize="13px" 
                            fontWeight={500}
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {fn.title}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </MenuItem>
                  ))}
                </Select>
                {!task?.feature_id && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      mt: 0.5,
                      ml: 1,
                      color: '#9ca3af',
                      fontSize: '11px'
                    }}
                  >
                    ⓘ Vui lòng chọn Feature trước
                  </Typography>
                )}
              </FormControl>
                </Box>

                <Divider />
              </>
            )}

            {/* Dates - Hide Start Date for Subtasks */}
            {!isSubtask && (
            <Box>
              <Typography fontSize="12px" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                Start Date
              </Typography>
              <TextField
                type="date"
                fullWidth
                size="small"
                value={task?.start_date ? new Date(task.start_date).toISOString().split('T')[0] : ''}
                onChange={async (e) => {
                  try {
                    await handleTaskUpdate({ start_date: e.target.value });
                  } catch (error) {
                    console.error('Error updating start date:', error);
                  }
                }}
                InputProps={{
                  sx: { 
                    fontSize: '13px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e8e9eb',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#7b68ee',
                    }
                  }
                }}
              />
            </Box>
            )}

            <Box>
              <Typography fontSize="12px" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                Due Date
              </Typography>
              <TextField
                type="date"
                fullWidth
                size="small"
                value={task?.deadline ? new Date(task.deadline).toISOString().split('T')[0] : ''}
                onChange={async (e) => {
                  try {
                    await handleTaskUpdate({ deadline: e.target.value });
                  } catch (error) {
                    console.error('Error updating deadline:', error);
                  }
                }}
                InputProps={{
                  sx: { 
                    fontSize: '13px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e8e9eb',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#7b68ee',
                    }
                  }
                }}
              />
            </Box>

            <Divider />

            {/* Estimate only for Subtasks, both for Tasks */}
            <Box>
              <Typography fontSize="12px" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                Estimated Time (hours)
              </Typography>
              <TextField
                type="number"
                fullWidth
                size="small"
                value={task?.estimate || ''}
                onChange={async (e) => {
                  try {
                    await handleTaskUpdate({ estimate: Number(e.target.value) });
                  } catch (error) {
                    console.error('Error updating estimate:', error);
                  }
                }}
                placeholder="0"
                InputProps={{
                  sx: { 
                    fontSize: '13px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e8e9eb',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#7b68ee',
                    }
                  }
                }}
              />
            </Box>

            {/* Time Spent & Progress - Hide for Subtasks */}
            {!isSubtask && (
              <>
            <Box>
              <Typography fontSize="12px" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                Time Spent
              </Typography>
              <Box sx={{ 
                p: 1.5,
                bgcolor: '#fafbfc',
                borderRadius: 1,
                border: '1px solid #e8e9eb'
              }}>
                <Typography fontSize="16px" fontWeight={700} color="text.primary">
                  {task?.actual ? `${task.actual}h` : '0h'}
                </Typography>
                {task?.estimate && task.estimate > 0 && (
                  <Typography fontSize="11px" color={(task?.actual || 0) > task.estimate ? 'error.main' : 'success.main'}>
                    {(task?.actual || 0) > task.estimate ? 'Over' : 'Under'} by {Math.abs((task?.actual || 0) - task.estimate).toFixed(1)}h
                  </Typography>
                )}
              </Box>
            </Box>

            <Divider />

            {/* Progress */}
            <Box>
              <Typography fontSize="12px" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                Progress: {task?.progress || 0}%
              </Typography>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={task?.progress || 0}
                onChange={async (e) => {
                  try {
                    await handleTaskUpdate({ progress: Number(e.target.value) });
                  } catch (error) {
                    console.error('Error updating progress:', error);
                  }
                }}
                style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  outline: 'none',
                  background: `linear-gradient(to right, #7b68ee 0%, #7b68ee ${task?.progress || 0}%, #e8e9eb ${task?.progress || 0}%, #e8e9eb 100%)`,
                  cursor: 'pointer',
                }}
              />
            </Box>
              </>
            )}

            <Divider />

            {/* Tags */}
            {task?.tags && task.tags.length > 0 && (
              <Box>
                <Typography fontSize="12px" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                  Tags
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                  {task.tags.map((tag, i) => (
                    <Chip 
                      key={i}
                      label={tag} 
                      size="small"
                      sx={{ 
                        height: 20,
                        fontSize: '11px',
                        bgcolor: '#f3f4f6',
                        color: '#6b7280'
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Created Info */}
            <Box sx={{ pt: 2, borderTop: '1px solid #f3f4f6' }}>
              <Typography fontSize="11px" color="text.secondary" sx={{ mb: 0.5 }}>
                Created by
              </Typography>
              <Typography fontSize="12px" fontWeight={600} color="text.primary">
                {task?.assigner_id?.full_name || task?.assigner_id?.email || 'Unknown'}
              </Typography>
              {task?.createdAt && (
                <Typography fontSize="10px" color="text.secondary" sx={{ mt: 1 }}>
                  Created: {new Date(task.createdAt).toLocaleDateString()}
                </Typography>
              )}
            </Box>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
}

