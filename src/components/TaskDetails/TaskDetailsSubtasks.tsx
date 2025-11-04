"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Stack,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import axiosInstance from "../../../ultis/axios";

interface TaskDetailsSubtasksProps {
  taskId: string | null;
  task?: any;
  statusOptions?: any[]; // Receive from parent to avoid re-fetching
  teamMembers?: any[]; // Team members for assignee dropdown
  projectId?: string; // For loading team members
  onSubtaskClick?: (subtaskId: string) => void; // Callback to handle subtask click
}

export default function TaskDetailsSubtasks({ 
  taskId, 
  task, 
  statusOptions = [],
  teamMembers = [],
  projectId,
  onSubtaskClick
}: TaskDetailsSubtasksProps) {
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [newSubtask, setNewSubtask] = useState({
    title: '',
    description: '',
    estimate: 0,
    assignee_id: '',
  });
  
  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  
  // Load team members if not provided
  const [localTeamMembers, setLocalTeamMembers] = useState<any[]>(teamMembers);

  useEffect(() => {
    if (teamMembers.length > 0) {
      setLocalTeamMembers(teamMembers);
    } else if (projectId) {
      loadTeamMembers();
    }
  }, [teamMembers, projectId]);

  const loadTeamMembers = async () => {
    if (!projectId) return;
    try {
      const response = await axiosInstance.get(`/api/projects/${projectId}/team-members`);
      // API returns { team_members: { leaders: [], members: [] } }
      const teamData = response.data?.team_members || {};
      const allMembers = [...(teamData.leaders || []), ...(teamData.members || [])];
      setLocalTeamMembers(allMembers);
    } catch (error) {
      console.error('Error loading team members:', error);
      setLocalTeamMembers([]); // Set empty array on error
    }
  };

  useEffect(() => {
    if (taskId) {
      loadSubtasks();
    }
  }, [taskId]);

  const loadSubtasks = async () => {
    if (!taskId) return;
    
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/tasks/${taskId}/subtasks`);
      setSubtasks(response.data);
    } catch (error: any) {
      console.error("Error loading subtasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const createSubtask = async () => {
    try {
      await axiosInstance.post(`/api/tasks/${taskId}/subtasks`, newSubtask);
      setOpenDialog(false);
      setNewSubtask({ title: '', description: '', estimate: 0, assignee_id: '' });
      await loadSubtasks();
    } catch (error: any) {
      console.error("Error creating subtask:", error);
    }
  };

  const toggleSubtaskStatus = async (subtask: any) => {
    try {
      const newStatus = subtask.status === 'Completed' ? 'Pending' : 'Completed';
      await axiosInstance.patch(`/api/tasks/${subtask._id}`, { status: newStatus });
      await loadSubtasks();
    } catch (error: any) {
      console.error("Error updating subtask:", error);
    }
  };

  const deleteSubtask = async (subtaskId: string) => {
    if (!confirm('Xóa subtask này?')) return;
    
    try {
      await axiosInstance.delete(`/api/tasks/${subtaskId}`);
      await loadSubtasks();
    } catch (error: any) {
      console.error("Error deleting subtask:", error);
    }
  };
  
  // Inline editing handlers
  const startEdit = (subtask: any) => {
    setEditingId(subtask._id);
    // Handle status - get the ID if it's an object, otherwise keep as is
    const statusValue = typeof subtask.status === 'object' 
      ? subtask.status?._id 
      : subtask.status;
    
    // Handle assignee - get the ID if it's an object, otherwise keep as is
    const assigneeValue = typeof subtask.assignee_id === 'object'
      ? subtask.assignee_id?._id
      : subtask.assignee_id;
    
    setEditForm({
      title: subtask.title,
      description: subtask.description || '',
      estimate: subtask.estimate || 0,
      status: statusValue,
      assignee_id: assigneeValue || '',
    });
  };
  
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };
  
  const saveEdit = async (subtaskId: string) => {
    try {
      // Validate required fields
      if (!editForm.title || editForm.title.trim() === '') {
        alert('Tên subtask không được để trống');
        return;
      }
      
      // Only send fields that are changed
      const updateData: any = {};
      if (editForm.title) updateData.title = editForm.title.trim();
      if (editForm.description !== undefined) updateData.description = editForm.description;
      if (editForm.estimate !== undefined && editForm.estimate >= 0) {
        updateData.estimate = Number(editForm.estimate);
      }
      if (editForm.status) updateData.status = editForm.status;
      
      console.log('=== UPDATING SUBTASK ===');
      console.log('SubtaskId:', subtaskId);
      console.log('Update Data:', JSON.stringify(updateData, null, 2));
      
      const response = await axiosInstance.patch(`/api/tasks/${subtaskId}`, updateData);
      console.log('Update response:', response.data);
      
      await loadSubtasks();
      setEditingId(null);
      setEditForm({});
    } catch (error: any) {
      console.error("=== ERROR UPDATING SUBTASK ===");
      console.error("Full error:", error);
      console.error("Error response:", error?.response);
      console.error("Error response data:", JSON.stringify(error?.response?.data, null, 2));
      
      // Show detailed error message
      const errorData = error?.response?.data;
      let errorMessage = 'Không thể cập nhật subtask';
      
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        errorMessage = 'Lỗi validation:\n' + errorData.errors.join('\n');
      } else if (errorData?.message) {
        errorMessage = errorData.message;
        if (errorData?.errors) {
          errorMessage += '\n\nChi tiết:\n' + JSON.stringify(errorData.errors, null, 2);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`Lỗi:\n\n${errorMessage}\n\nCheck console để xem chi tiết`);
    }
  };

  const completedCount = subtasks.filter(s => s.status === 'Completed').length;
  const progress = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0;
  
  // Check if current task is a subtask (has parent_task_id)
  const isSubtask = task?.parent_task_id ? true : false;

  return (
    <Box sx={{ p: 4 }}>
      {/* Warning message if this is a subtask */}
      {isSubtask && (
        <Box sx={{ 
          mb: 3, 
          p: 2, 
          bgcolor: '#fff3cd', 
          border: '1px solid #ffc107',
          borderRadius: 2 
        }}>
          <Typography variant="body2" fontWeight={600} color="#856404">
            ⚠️ Subtasks không thể có subtask con. Chỉ cho phép 1 level.
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight="bold">Subtasks</Typography>
          <Typography variant="body2" color="text.secondary">
            {completedCount} / {subtasks.length} completed
          </Typography>
        </Box>
        {/* Only show Add button if this is NOT a subtask */}
        {!isSubtask && (
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{ 
            borderRadius: 2, 
            textTransform: 'none', 
            fontWeight: 600,
            bgcolor: '#667eea',
            '&:hover': { bgcolor: '#5568d3' }
          }}
        >
          Thêm Subtask
        </Button>
        )}
      </Box>

      {subtasks.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress 
            variant="determinate" 
            value={progress}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'rgba(102, 126, 234, 0.1)',
              '& .MuiLinearProgress-bar': {
                bgcolor: '#667eea',
                borderRadius: 4,
              }
            }}
          />
        </Box>
      )}

      {loading ? (
        <Typography>Loading...</Typography>
      ) : subtasks.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="body1" color="text.secondary">
            Chưa có subtask nào
          </Typography>
        </Box>
      ) : (
        <List>
          {subtasks.map((subtask) => {
            const isEditing = editingId === subtask._id;
            
            return (
            <ListItem 
              key={subtask._id}
              sx={{
                border: '1px solid',
                borderColor: isEditing ? '#667eea' : 'divider',
                borderRadius: 2,
                mb: 2,
                p: 2,
                bgcolor: isEditing ? '#f8f9ff' : 'white',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: isEditing ? '#f8f9ff' : 'action.hover',
                  borderColor: isEditing ? '#667eea' : '#d1d5db',
                }
              }}
            >
              {isEditing ? (
                // Edit Mode - Simplified
                <Box sx={{ width: '100%' }}>
                  <Stack spacing={2.5}>
                    {/* Title Field */}
                    <Box>
                      <Typography fontSize="12px" fontWeight={600} color="#374151" sx={{ mb: 0.5 }}>
                        Tên subtask <Typography component="span" color="error">*</Typography>
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Nhập tên subtask..."
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        autoFocus
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1.5,
                          }
                        }}
                      />
                    </Box>

                    {/* Description Field */}
                    <Box>
                      <Typography fontSize="12px" fontWeight={600} color="#374151" sx={{ mb: 0.5 }}>
                        Mô tả
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        multiline
                        rows={2}
                        placeholder="Mô tả chi tiết..."
                        value={editForm.description || ''}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1.5,
                          }
                        }}
                      />
                    </Box>

                    {/* Inline Row: Status, Assignee & Estimate */}
                    <Stack direction="row" spacing={2}>
                      <Box sx={{ width: 140 }}>
                        <Typography fontSize="12px" fontWeight={600} color="#374151" sx={{ mb: 0.5 }}>
                          Status
                        </Typography>
                        <FormControl size="small" fullWidth>
                          <Select
                            value={editForm.status || ''}
                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                            displayEmpty
                            sx={{
                              borderRadius: 1.5,
                            }}
                          >
                            <MenuItem value="" disabled>
                              <em>Chọn status</em>
                            </MenuItem>
                            {statusOptions.map((status) => (
                              <MenuItem key={status._id} value={status._id}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box sx={{ 
                                    width: 8, 
                                    height: 8, 
                                    borderRadius: '50%', 
                                    bgcolor: status.name === 'Completed' || status.name === 'Done' ? '#10b981' : '#f59e0b'
                                  }} />
                                  {status.name}
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>

                      <Box sx={{ flex: 1 }}>
                        <Typography fontSize="12px" fontWeight={600} color="#374151" sx={{ mb: 0.5 }}>
                          Assignee
                        </Typography>
                        <FormControl size="small" fullWidth>
                          <Select
                            value={editForm.assignee_id || ''}
                            onChange={(e) => setEditForm({ ...editForm, assignee_id: e.target.value })}
                            displayEmpty
                            sx={{
                              borderRadius: 1.5,
                            }}
                          >
                            <MenuItem value="">
                              <em>Chưa gán</em>
                            </MenuItem>
                            {localTeamMembers.map((member: any) => {
                              const userId = member.user_id?._id || member._id;
                              const userName = member.user_id?.full_name || member.full_name || member.user_id?.email || member.email || 'Unknown';
                              const userInitial = userName.charAt(0).toUpperCase();
                              return (
                                <MenuItem key={userId} value={userId}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box 
                                      sx={{ 
                                        width: 20, 
                                        height: 20, 
                                        borderRadius: '50%', 
                                        bgcolor: '#667eea', 
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '10px',
                                        fontWeight: 600,
                                      }}
                                    >
                                      {userInitial}
                                    </Box>
                                    <Typography fontSize="12px">{userName}</Typography>
                                  </Box>
                                </MenuItem>
                              );
                            })}
                          </Select>
                        </FormControl>
                      </Box>

                      <Box sx={{ width: 100 }}>
                        <Typography fontSize="12px" fontWeight={600} color="#374151" sx={{ mb: 0.5 }}>
                          Estimate (h)
                        </Typography>
                        <TextField
                          type="number"
                          size="small"
                          fullWidth
                          placeholder="0"
                          value={editForm.estimate || ''}
                          onChange={(e) => setEditForm({ ...editForm, estimate: Number(e.target.value) })}
                          inputProps={{ min: 0, step: 0.5 }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1.5,
                            }
                          }}
                        />
                      </Box>
                    </Stack>

                    {/* Action Buttons */}
                    <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ pt: 1 }}>
                      <Button
                        size="small"
                        onClick={cancelEdit}
                        startIcon={<CloseIcon fontSize="small" />}
                        sx={{ 
                          textTransform: 'none',
                          fontWeight: 600,
                          color: '#6b7280',
                          borderRadius: 1.5,
                          '&:hover': { bgcolor: '#f3f4f6' }
                        }}
                      >
                        Hủy
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => saveEdit(subtask._id)}
                        startIcon={<SaveIcon fontSize="small" />}
                        sx={{ 
                          textTransform: 'none',
                          fontWeight: 700,
                          bgcolor: '#667eea',
                          borderRadius: 1.5,
                          px: 2,
                          '&:hover': { bgcolor: '#5568d3' }
                        }}
                      >
                        Lưu
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              ) : (
                // View Mode - Simplified & Clean
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  width: '100%',
                  gap: 2
                }}>
                  {/* Checkbox */}
              <IconButton 
                onClick={() => toggleSubtaskStatus(subtask)}
                    size="small"
                    sx={{ 
                      p: 0,
                      color: subtask.status === 'Completed' ? '#10b981' : '#d1d5db',
                      '&:hover': { 
                        bgcolor: subtask.status === 'Completed' ? '#dcfce7' : '#f3f4f6' 
                      }
                    }}
              >
                {subtask.status === 'Completed' ? (
                      <CheckCircleIcon fontSize="small" />
                ) : (
                      <RadioButtonUncheckedIcon fontSize="small" />
                )}
              </IconButton>

                  {/* Title with Assignee */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography 
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent event bubbling
                      if (onSubtaskClick) {
                        console.log('Clicking subtask:', subtask._id, subtask.title);
                        onSubtaskClick(subtask._id);
                      } else {
                        console.warn('onSubtaskClick callback not provided');
                      }
                    }}
                    sx={{ 
                      textDecoration: subtask.status === 'Completed' ? 'line-through' : 'none',
                          color: subtask.status === 'Completed' ? '#9ca3af' : '#1f2937',
                          fontWeight: 500,
                          fontSize: '14px',
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          cursor: onSubtaskClick ? 'pointer' : 'default',
                          '&:hover': onSubtaskClick ? {
                            color: '#667eea',
                            textDecoration: 'underline',
                          } : {},
                    }}
                  >
                    {subtask.title}
                  </Typography>
                      
                      {/* Assignee Avatar - Mini */}
                      {subtask.assignee_id && (() => {
                        const assignee = typeof subtask.assignee_id === 'object' 
                          ? subtask.assignee_id 
                          : null;
                        const assigneeName = assignee?.full_name || assignee?.email || '';
                        const assigneeInitial = assigneeName ? assigneeName.charAt(0).toUpperCase() : '?';
                        
                        return assigneeName ? (
                          <Tooltip title={assigneeName} arrow>
                            <Box 
                              sx={{ 
                                width: 24, 
                                height: 24, 
                                borderRadius: '50%', 
                                bgcolor: '#667eea', 
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {assigneeInitial}
                            </Box>
                          </Tooltip>
                        ) : null;
                      })()}

                      {/* Estimate Badge - Mini */}
                    {subtask.estimate > 0 && (
                        <Typography 
                          fontSize="11px" 
                          fontWeight={600}
                          sx={{ 
                            color: '#6b7280',
                            bgcolor: '#f3f4f6',
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                            flexShrink: 0,
                          }}
                        >
                          {subtask.estimate}h
                        </Typography>
                    )}
                  </Stack>
                  </Box>

                  {/* Action Buttons */}
                  <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                    <IconButton 
                      size="small"
                      onClick={() => startEdit(subtask)}
                      sx={{
                        color: '#667eea',
                        '&:hover': { bgcolor: '#ede9fe' }
                      }}
                    >
                      <EditIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton 
                      size="small"
                      onClick={() => deleteSubtask(subtask._id)}
                      sx={{
                        color: '#ef4444',
                        '&:hover': { bgcolor: '#fee2e2' }
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
                  </Stack>
                </Box>
              )}
            </ListItem>
          )})}
        </List>
      )}

      {/* Create Dialog - Simple & Clean */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#f8f9ff', 
          fontWeight: 700,
          fontSize: '18px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <AddIcon sx={{ color: '#667eea' }} />
          Tạo Subtask Mới
          <Typography variant="caption" sx={{ ml: 'auto', color: '#9ca3af' }}>
            Đơn giản, nhanh chóng
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography fontSize="13px" fontWeight={600} color="#374151" sx={{ mb: 1 }}>
                Tên subtask <Typography component="span" color="error">*</Typography>
              </Typography>
            <TextField 
              fullWidth
                placeholder="VD: Viết unit test cho API login"
              value={newSubtask.title}
              onChange={(e) => setNewSubtask({ ...newSubtask, title: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Box>
            
            <Box>
              <Typography fontSize="13px" fontWeight={600} color="#374151" sx={{ mb: 1 }}>
                Mô tả
                <Typography component="span" fontSize="12px" fontWeight={400} color="#9ca3af" sx={{ ml: 1 }}>
                  (Tùy chọn)
                </Typography>
              </Typography>
            <TextField 
              fullWidth
              multiline
              rows={3}
                placeholder="Mô tả chi tiết subtask này..."
              value={newSubtask.description}
              onChange={(e) => setNewSubtask({ ...newSubtask, description: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Box>
            
            {/* Inline Row: Assignee & Estimate */}
            <Stack direction="row" spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography fontSize="13px" fontWeight={600} color="#374151" sx={{ mb: 1 }}>
                  Assignee
                  <Typography component="span" fontSize="12px" fontWeight={400} color="#9ca3af" sx={{ ml: 1 }}>
                    (Người thực hiện)
                  </Typography>
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={newSubtask.assignee_id}
                    onChange={(e) => setNewSubtask({ ...newSubtask, assignee_id: e.target.value })}
                    displayEmpty
                    sx={{
                      borderRadius: 2,
                    }}
                  >
                    <MenuItem value="">
                      <em>Chưa gán</em>
                    </MenuItem>
                    {localTeamMembers.map((member: any) => {
                      const userId = member.user_id?._id || member._id;
                      const userName = member.user_id?.full_name || member.full_name || member.user_id?.email || member.email || 'Unknown';
                      const userInitial = userName.charAt(0).toUpperCase();
                      return (
                        <MenuItem key={userId} value={userId}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box 
                              sx={{ 
                                width: 28, 
                                height: 28, 
                                borderRadius: '50%', 
                                bgcolor: '#667eea', 
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 600,
                              }}
                            >
                              {userInitial}
                            </Box>
                            <Typography fontSize="13px">{userName}</Typography>
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ width: 140 }}>
                <Typography fontSize="13px" fontWeight={600} color="#374151" sx={{ mb: 1 }}>
                  Estimate
                  <Typography component="span" fontSize="12px" fontWeight={400} color="#9ca3af" sx={{ ml: 1 }}>
                    (giờ)
                  </Typography>
                </Typography>
            <TextField 
              type="number"
              fullWidth
                  size="small"
                  placeholder="0"
                  value={newSubtask.estimate || ''}
              onChange={(e) => setNewSubtask({ ...newSubtask, estimate: Number(e.target.value) })}
                  inputProps={{ min: 0, step: 0.5 }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                />
              </Box>
            </Stack>

            <Typography fontSize="11px" color="#9ca3af" sx={{ ml: 1 }}>
              💡 Subtask thừa kế feature, priority từ task cha
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #e5e7eb', gap: 1 }}>
          <Button 
            onClick={() => setOpenDialog(false)}
            sx={{ 
              textTransform: 'none',
              fontWeight: 600,
              color: '#6b7280',
              '&:hover': { bgcolor: '#f3f4f6' }
            }}
          >
            Hủy
          </Button>
          <Button 
            variant="contained" 
            onClick={createSubtask}
            disabled={!newSubtask.title}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              bgcolor: '#667eea',
              borderRadius: 2,
              px: 3,
              '&:hover': { bgcolor: '#5568d3' },
              '&:disabled': { bgcolor: '#e5e7eb', color: '#9ca3af' }
            }}
          >
            Tạo Subtask
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

