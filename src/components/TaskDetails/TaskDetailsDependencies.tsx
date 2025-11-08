"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Divider,
  Alert,
  Avatar,
  Paper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import LinkIcon from "@mui/icons-material/Link";
import BlockIcon from "@mui/icons-material/Block";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import axiosInstance from "../../../ultis/axios";

interface TaskDetailsDependenciesProps {
  taskId: string | null;
  projectId?: string;
}

export default function TaskDetailsDependencies({ taskId, projectId }: TaskDetailsDependenciesProps) {
  const [dependencies, setDependencies] = useState<any[]>([]);
  const [dependents, setDependents] = useState<any[]>([]);
  const [availableTasks, setAvailableTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDependency, setNewDependency] = useState({
    depends_on_task_id: '',
    dependency_type: 'FS',
    lag_days: 0
  });

  useEffect(() => {
    if (taskId) {
      loadDependencies();
      if (projectId) {
        loadAvailableTasks();
      }
    }
  }, [taskId, projectId]);

  const loadDependencies = async () => {
    if (!taskId) return;
    
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/tasks/${taskId}/dependencies`);
      setDependencies(response.data.dependencies || []);
      setDependents(response.data.dependents || []);
      setError(null);
    } catch (error: any) {
      console.error("Error loading dependencies:", error);
      setError("Failed to load dependencies");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableTasks = async () => {
    // Load all tasks from current project to allow selection
    if (!projectId) {
      console.warn('No projectId provided - cannot load available tasks');
      return;
    }
    
    try {
      // Get project tasks
      const response = await axiosInstance.get(`/api/projects/${projectId}/tasks`);
      const tasks = response.data?.tasks || response.data || [];
      setAvailableTasks(tasks.filter((t: any) => t._id !== taskId));
    } catch (error) {
      console.error("Error loading tasks:", error);
      setError("Failed to load available tasks");
    }
  };

  const addDependency = async () => {
    if (!taskId || !newDependency.depends_on_task_id) return;
    
    try {
      const response = await axiosInstance.post(`/api/tasks/${taskId}/dependencies`, {
        depends_on_task_id: newDependency.depends_on_task_id,
        dependency_type: newDependency.dependency_type,
        lag_days: newDependency.lag_days
      });
      
      // Check for warning (non-blocking)
      if (response.data.warning) {
        const warning = response.data.warning;
        const confirmMessage = `${warning.message}\n\n${warning.suggestion}\n\nBạn có muốn tiếp tục không?`;
        if (!window.confirm(confirmMessage)) {
          return;
        }
      }
      
      setNewDependency({ depends_on_task_id: '', dependency_type: 'FS', lag_days: 0 });
      setShowAddForm(false);
      await loadDependencies();
    } catch (error: any) {
      const errorData = error?.response?.data;
      if (error?.response?.status === 400 && errorData?.violation) {
        // Date violation - show detailed error
        const violation = errorData.violation;
        const errorMessage = `${errorData.message}\n\n${violation.suggestion || ''}`;
        setError(errorMessage);
        
        // If auto-fix available, offer it
        if (errorData.can_auto_fix && violation.required_start_date) {
          const autoFix = window.confirm(
            `${errorMessage}\n\nBạn có muốn tự động điều chỉnh ngày tháng không?`
          );
          if (autoFix) {
            try {
              await axiosInstance.post(`/api/tasks/${taskId}/auto-adjust-dates`, {
                preserve_duration: true
              });
              // Retry adding dependency with same params
              const retryResponse = await axiosInstance.post(`/api/tasks/${taskId}/dependencies`, {
                depends_on_task_id: newDependency.depends_on_task_id,
                dependency_type: newDependency.dependency_type,
                lag_days: newDependency.lag_days
              });
              setNewDependency({ depends_on_task_id: '', dependency_type: 'FS', lag_days: 0 });
              setShowAddForm(false);
              await loadDependencies();
            } catch (fixError: any) {
              setError(fixError?.response?.data?.message || 'Không thể tự động điều chỉnh');
            }
          }
        }
      } else {
        setError(errorData?.message || 'Failed to add dependency');
      }
    }
  };

  const removeDependency = async (depId: string) => {
    if (!taskId) return;
    
    try {
      await axiosInstance.delete(`/api/tasks/${taskId}/dependencies/${depId}`);
      await loadDependencies();
    } catch (error: any) {
      setError(error?.response?.data?.message || 'Failed to remove dependency');
    }
  };

  const getDependencyTypeInfo = (type: string) => {
    const types: Record<string, { label: string; color: string; desc: string; icon: string }> = {
      'FS': { 
        label: 'Finish-to-Start', 
        color: '#3b82f6', 
        desc: 'Must finish before successor starts',
        icon: '→'
      },
      'FF': { 
        label: 'Finish-to-Finish', 
        color: '#8b5cf6', 
        desc: 'Must finish together',
        icon: '⟹'
      },
      'SS': { 
        label: 'Start-to-Start', 
        color: '#10b981', 
        desc: 'Must start together',
        icon: '⇉'
      },
      'SF': { 
        label: 'Start-to-Finish', 
        color: '#f59e0b', 
        desc: 'Must start before successor finishes',
        icon: '↷'
      },
      'relates_to': { 
        label: 'Related To', 
        color: '#6b7280', 
        desc: 'Reference link only',
        icon: '⟷'
      }
    };
    return types[type] || types['FS'];
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography>Loading dependencies...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Info Banner */}
      <Box sx={{ 
        mb: 4, 
        p: 2.5, 
        bgcolor: '#eff6ff', 
        borderRadius: 2,
        border: '1px solid #bfdbfe'
      }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <InfoOutlinedIcon sx={{ fontSize: 20, color: '#3b82f6', mt: 0.25 }} />
          <Box>
            <Typography fontSize="13px" fontWeight={600} color="#1e40af" sx={{ mb: 0.5 }}>
              About Dependencies
            </Typography>
            <Typography fontSize="12px" color="#3b82f6">
              Dependencies define relationships between tasks. The system will enforce these constraints when you change task status.
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Blocking Dependencies (Tasks this task blocks) */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 2.5
        }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ 
              width: 36,
              height: 36,
              borderRadius: '50%',
              bgcolor: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BlockIcon sx={{ fontSize: 18, color: '#ef4444' }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                This task blocks
              </Typography>
              <Typography fontSize="12px" color="text.secondary">
                Tasks that cannot proceed until this task meets certain conditions
              </Typography>
            </Box>
          </Stack>
          <Chip 
            label={dependencies.length} 
            size="small"
            sx={{ 
              height: 24,
              minWidth: 32,
              fontWeight: 700,
              bgcolor: '#fee2e2',
              color: '#dc2626'
            }}
          />
        </Box>

        {dependencies.length > 0 ? (
          <Stack spacing={1.5}>
            {dependencies.map((dep) => {
              const depInfo = getDependencyTypeInfo(dep.dependency_type);
              return (
                <Paper
                  key={dep._id}
                  elevation={0}
                  sx={{
                    p: 2.5,
                    border: '1px solid #e8e9eb',
                    borderRadius: 2,
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: '#7b68ee',
                      boxShadow: '0 2px 8px rgba(123,104,238,0.12)'
                    }
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={2}>
                    {/* Dependency Type Badge */}
                    <Tooltip title={depInfo.desc}>
                      <Chip
                        label={dep.dependency_type}
                        size="small"
                        sx={{
                          height: 26,
                          minWidth: 50,
                          fontSize: '12px',
                          fontWeight: 700,
                          bgcolor: `${depInfo.color}15`,
                          color: depInfo.color,
                          border: `2px solid ${depInfo.color}`,
                        }}
                      />
                    </Tooltip>

                    {/* Arrow */}
                    <ArrowForwardIcon sx={{ fontSize: 16, color: '#d1d5db' }} />

                    {/* Task Info */}
                    <Box sx={{ flex: 1 }}>
                      <Typography fontSize="14px" fontWeight={600} color="text.primary" sx={{ mb: 0.5 }}>
                        {dep.depends_on_task_id?.title}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip 
                          label={dep.depends_on_task_id?.status} 
                          size="small"
                          sx={{ 
                            height: 20,
                            fontSize: '11px',
                            fontWeight: 600
                          }}
                        />
                        {dep.depends_on_task_id?.assignee_id && (
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Avatar sx={{ width: 18, height: 18, fontSize: '9px', bgcolor: '#7b68ee' }}>
                              {(dep.depends_on_task_id.assignee_id?.full_name || 'U')[0]}
                            </Avatar>
                            <Typography fontSize="11px" color="text.secondary">
                              {dep.depends_on_task_id.assignee_id?.full_name || dep.depends_on_task_id.assignee_id?.email}
                            </Typography>
                          </Stack>
                        )}
                        {dep.lag_days !== 0 && (
                          <Chip
                            label={dep.lag_days > 0 ? `+${dep.lag_days}d` : `${dep.lag_days}d`}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '10px',
                              fontWeight: 600,
                              bgcolor: dep.lag_days > 0 ? '#fef3c7' : '#dbeafe',
                              color: dep.lag_days > 0 ? '#92400e' : '#1e40af'
                            }}
                          />
                        )}
                      </Stack>
                    </Box>

                    {/* Delete Button */}
                    <IconButton
                      size="small"
                      onClick={() => removeDependency(dep._id)}
                      sx={{
                        color: '#9ca3af',
                        '&:hover': {
                          color: '#ef4444',
                          bgcolor: '#fee2e2'
                        }
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Stack>

                  {/* Dependency Type Description */}
                  <Box sx={{ 
                    mt: 1.5, 
                    pt: 1.5, 
                    borderTop: '1px dashed #e8e9eb',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <Typography fontSize="11px" color="text.secondary" fontStyle="italic">
                      {depInfo.icon} {depInfo.desc}
                    </Typography>
                  </Box>
                </Paper>
              );
            })}
          </Stack>
        ) : (
          <Box sx={{ 
            p: 4, 
            textAlign: 'center',
            bgcolor: '#fafbfc',
            borderRadius: 2,
            border: '1px dashed #e8e9eb'
          }}>
            <Typography fontSize="14px" color="text.secondary">
              No blocking dependencies
            </Typography>
            <Typography fontSize="12px" color="text.secondary" sx={{ mt: 0.5 }}>
              Add dependencies to define which tasks this task blocks
            </Typography>
          </Box>
        )}

        {/* Add Dependency Form */}
        {showAddForm ? (
          <Paper
            elevation={0}
            sx={{
              mt: 2,
              p: 3,
              bgcolor: '#f8f9fb',
              borderRadius: 2,
              border: '2px dashed #7b68ee'
            }}
          >
            <Typography fontSize="14px" fontWeight={700} sx={{ mb: 2, color: '#7b68ee' }}>
              Add Blocking Dependency
            </Typography>
            
            <Stack spacing={2}>
              {/* Task Selection */}
              <FormControl fullWidth size="small">
                <InputLabel>Select Task</InputLabel>
                <Select
                  value={newDependency.depends_on_task_id}
                  label="Select Task"
                  onChange={(e) => setNewDependency({ ...newDependency, depends_on_task_id: e.target.value })}
                >
                  {availableTasks.map((task) => (
                    <MenuItem key={task._id} value={task._id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography fontSize="13px">{task.title}</Typography>
                        <Chip 
                          label={typeof task.status === 'object' ? task.status?.name : task.status} 
                          size="small"
                          sx={{ height: 18, fontSize: '10px' }}
                        />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Dependency Type & Lag */}
              <Stack direction="row" spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={newDependency.dependency_type}
                    label="Type"
                    onChange={(e) => setNewDependency({ ...newDependency, dependency_type: e.target.value })}
                  >
                    <MenuItem value="FS">
                      <Box>
                        <Typography fontSize="13px" fontWeight={600}>FS - Finish-to-Start</Typography>
                        <Typography fontSize="10px" color="text.secondary">
                          Predecessor must finish first
                        </Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="FF">
                      <Box>
                        <Typography fontSize="13px" fontWeight={600}>FF - Finish-to-Finish</Typography>
                        <Typography fontSize="10px" color="text.secondary">
                          Both must finish together
                        </Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="SS">
                      <Box>
                        <Typography fontSize="13px" fontWeight={600}>SS - Start-to-Start</Typography>
                        <Typography fontSize="10px" color="text.secondary">
                          Both must start together
                        </Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="SF">
                      <Box>
                        <Typography fontSize="13px" fontWeight={600}>SF - Start-to-Finish</Typography>
                        <Typography fontSize="10px" color="text.secondary">
                          Predecessor must start first
                        </Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="relates_to">
                      <Box>
                        <Typography fontSize="13px" fontWeight={600}>Related To</Typography>
                        <Typography fontSize="10px" color="text.secondary">
                          Reference only (no constraint)
                        </Typography>
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Lag (days)"
                  type="number"
                  size="small"
                  value={newDependency.lag_days}
                  onChange={(e) => setNewDependency({ ...newDependency, lag_days: parseInt(e.target.value) || 0 })}
                  sx={{ width: 150 }}
                  inputProps={{ min: -30, max: 30 }}
                  helperText={
                    newDependency.lag_days > 0 
                      ? `+${newDependency.lag_days}d delay` 
                      : newDependency.lag_days < 0 
                        ? `${newDependency.lag_days}d lead` 
                        : 'No lag'
                  }
                />
              </Stack>

              {/* Action Buttons */}
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  size="small"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewDependency({ depends_on_task_id: '', dependency_type: 'FS', lag_days: 0 });
                  }}
                  sx={{ textTransform: 'none', fontWeight: 600, color: '#6b7280' }}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  disabled={!newDependency.depends_on_task_id}
                  onClick={addDependency}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    bgcolor: '#7b68ee',
                    '&:hover': { bgcolor: '#6952d6' }
                  }}
                >
                  Add Dependency
                </Button>
              </Stack>
            </Stack>
          </Paper>
        ) : (
          <Button
            fullWidth
            startIcon={<AddIcon />}
            onClick={() => setShowAddForm(true)}
            sx={{
              mt: 2,
              py: 1.5,
              borderRadius: 2,
              border: '2px dashed #e8e9eb',
              bgcolor: 'transparent',
              color: '#9ca3af',
              fontSize: '13px',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                borderColor: '#7b68ee',
                bgcolor: '#f5f3ff',
                color: '#7b68ee'
              }
            }}
          >
            Add Blocking Dependency
          </Button>
        )}
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Blocked By Dependencies */}
      <Box>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 2.5
        }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ 
              width: 36,
              height: 36,
              borderRadius: '50%',
              bgcolor: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BlockIcon sx={{ fontSize: 18, color: '#f59e0b' }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Blocked by
              </Typography>
              <Typography fontSize="12px" color="text.secondary">
                Tasks that are blocking this task from proceeding
              </Typography>
            </Box>
          </Stack>
          <Chip 
            label={dependents.length} 
            size="small"
            sx={{ 
              height: 24,
              minWidth: 32,
              fontWeight: 700,
              bgcolor: '#fef3c7',
              color: '#d97706'
            }}
          />
        </Box>

        {dependents.length > 0 ? (
          <Stack spacing={1.5}>
            {dependents.map((dep) => {
              const depInfo = getDependencyTypeInfo(dep.dependency_type);
              const isBlocking = ['In Progress', 'Testing', 'Review', 'Done', 'Completed'].includes(dep.task_id?.status);
              
              return (
                <Paper
                  key={dep._id}
                  elevation={0}
                  sx={{
                    p: 2.5,
                    bgcolor: '#fffbeb',
                    border: '1px solid #fed7aa',
                    borderRadius: 2,
                    borderLeft: `4px solid ${depInfo.color}`
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={2}>
                    {/* Dependency Type Badge */}
                    <Tooltip title={depInfo.desc}>
                      <Chip
                        label={dep.dependency_type}
                        size="small"
                        sx={{
                          height: 26,
                          minWidth: 50,
                          fontSize: '12px',
                          fontWeight: 700,
                          bgcolor: `${depInfo.color}15`,
                          color: depInfo.color,
                          border: `2px solid ${depInfo.color}`,
                        }}
                      />
                    </Tooltip>

                    {/* Block Icon */}
                    <BlockIcon sx={{ fontSize: 16, color: '#f59e0b' }} />

                    {/* Task Info */}
                    <Box sx={{ flex: 1 }}>
                      <Typography fontSize="14px" fontWeight={600} color="text.primary" sx={{ mb: 0.5 }}>
                        {dep.task_id?.title}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip 
                          label={dep.task_id?.status} 
                          size="small"
                          sx={{ 
                            height: 20,
                            fontSize: '11px',
                            fontWeight: 600,
                            bgcolor: isBlocking ? '#dcfce7' : '#fee2e2',
                            color: isBlocking ? '#16a34a' : '#dc2626'
                          }}
                        />
                        {dep.task_id?.assignee_id && (
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Avatar sx={{ width: 18, height: 18, fontSize: '9px', bgcolor: '#f59e0b' }}>
                              {(dep.task_id.assignee_id?.full_name || 'U')[0]}
                            </Avatar>
                            <Typography fontSize="11px" color="text.secondary">
                              {dep.task_id.assignee_id?.full_name || dep.task_id.assignee_id?.email}
                            </Typography>
                          </Stack>
                        )}
                        {dep.lag_days !== 0 && (
                          <Chip
                            label={dep.lag_days > 0 ? `+${dep.lag_days}d` : `${dep.lag_days}d`}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '10px',
                              fontWeight: 600,
                              bgcolor: dep.lag_days > 0 ? '#fef3c7' : '#dbeafe',
                              color: dep.lag_days > 0 ? '#92400e' : '#1e40af'
                            }}
                          />
                        )}
                      </Stack>
                    </Box>
                  </Stack>

                  {/* Dependency Type Description */}
                  <Box sx={{ 
                    mt: 1.5, 
                    pt: 1.5, 
                    borderTop: '1px dashed #fed7aa',
                  }}>
                    <Typography fontSize="11px" color="#92400e" fontStyle="italic">
                      {depInfo.icon} {depInfo.desc}
                    </Typography>
                  </Box>
                </Paper>
              );
            })}
          </Stack>
        ) : (
          <Box sx={{ 
            p: 4, 
            textAlign: 'center',
            bgcolor: '#fafbfc',
            borderRadius: 2,
            border: '1px dashed #e8e9eb'
          }}>
            <Typography fontSize="14px" color="text.secondary">
              No blocking dependencies
            </Typography>
            <Typography fontSize="12px" color="text.secondary" sx={{ mt: 0.5 }}>
              This task is not blocked by any other tasks
            </Typography>
          </Box>
        )}
      </Box>

      {/* Legend */}
      <Box sx={{ 
        mt: 4,
        p: 2.5,
        bgcolor: '#f8f9fb',
        borderRadius: 2,
        border: '1px solid #e8e9eb'
      }}>
        <Typography fontSize="12px" fontWeight={700} color="#6b7280" sx={{ mb: 1.5 }}>
          DEPENDENCY TYPES
        </Typography>
        <Stack spacing={1}>
          {['FS', 'FF', 'SS', 'SF', 'relates_to'].map((type) => {
            const info = getDependencyTypeInfo(type);
            return (
              <Stack key={type} direction="row" alignItems="center" spacing={1.5}>
                <Chip
                  label={type}
                  size="small"
                  sx={{
                    height: 22,
                    minWidth: 60,
                    fontSize: '11px',
                    fontWeight: 700,
                    bgcolor: `${info.color}15`,
                    color: info.color,
                    border: `1px solid ${info.color}40`
                  }}
                />
                <Typography fontSize="12px" color="text.secondary">
                  {info.label}: {info.desc}
                </Typography>
              </Stack>
            );
          })}
        </Stack>
      </Box>
    </Box>
  );
}

