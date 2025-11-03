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
  onClose: () => void;
  onUpdate?: () => void;
}

export default function TaskDetailsModal({ open, taskId, onClose, onUpdate }: TaskDetailsModalProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);

  useEffect(() => {
    if (open && taskId) {
      loadTaskDetails();
    }
  }, [open, taskId]);

  const loadTaskDetails = async () => {
    if (!taskId) return;
    
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/tasks/${taskId}`);
      setTask(response.data);
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
            <Typography fontSize="13px" color="text.primary" fontWeight={600}>
              Task Details
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
                    label={task.status} 
                    size="small"
                    sx={{ 
                      height: 24,
                      fontSize: '12px',
                      fontWeight: 600,
                      bgcolor: `${getStatusColor(task.status)}15`,
                      color: getStatusColor(task.status),
                      border: `1px solid ${getStatusColor(task.status)}40`,
                    }}
                  />
                )}

                {/* Priority */}
                {task?.priority && (
                  <Chip 
                    icon={<FlagIcon sx={{ fontSize: 14 }} />}
                    label={task.priority} 
                    size="small"
                    sx={{ 
                      height: 24,
                      fontSize: '12px',
                      fontWeight: 600,
                      bgcolor: `${getPriorityColor(task.priority)}15`,
                      color: getPriorityColor(task.priority),
                      border: `1px solid ${getPriorityColor(task.priority)}40`,
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
            <Tab label="Subtasks" />
            <Tab label="Dependencies" />
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
              {currentTab === 0 && <TaskDetailsOverview task={task} onUpdate={handleTaskUpdate} />}
              {currentTab === 1 && <TaskDetailsSubtasks taskId={taskId} />}
              {currentTab === 2 && <TaskDetailsDependencies taskId={taskId} />}
              {currentTab === 3 && <TaskDetailsTimeLogs taskId={taskId} task={task} onUpdate={loadTaskDetails} />}
              {currentTab === 4 && <TaskDetailsComments taskId={taskId} />}
              {currentTab === 5 && <TaskDetailsAttachments taskId={taskId} />}
              {currentTab === 6 && <TaskDetailsActivity taskId={taskId} />}
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
                  value={typeof task?.status === 'object' ? (task.status as any)?.name : task?.status || ''}
                  onChange={async (e) => {
                    try {
                      await handleTaskUpdate({ status: e.target.value });
                    } catch (error) {
                      console.error('Error updating status:', error);
                    }
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
                  <MenuItem value="To Do">To Do</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Review">Review</MenuItem>
                  <MenuItem value="Testing">Testing</MenuItem>
                  <MenuItem value="Done">Done</MenuItem>
                  <MenuItem value="Blocked">Blocked</MenuItem>
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
                  value={typeof task?.priority === 'object' ? (task.priority as any)?.name : task?.priority || ''}
                  onChange={async (e) => {
                    try {
                      await handleTaskUpdate({ priority: e.target.value });
                    } catch (error) {
                      console.error('Error updating priority:', error);
                    }
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
                  <MenuItem value="Low">🟢 Low</MenuItem>
                  <MenuItem value="Medium">🟡 Medium</MenuItem>
                  <MenuItem value="High">🔴 High</MenuItem>
                  <MenuItem value="Critical">🔥 Critical</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Divider />

            {/* Dates */}
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

            {/* Estimate vs Actual */}
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
              <Typography fontSize="10px" color="text.secondary" sx={{ mt: 1 }}>
                Task ID: #{task?._id?.slice(-8).toUpperCase()}
              </Typography>
              {task?.createdAt && (
                <Typography fontSize="10px" color="text.secondary">
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

