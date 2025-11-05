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
}

export default function TaskDetailsSubtasks({ taskId, task }: TaskDetailsSubtasksProps) {
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [newSubtask, setNewSubtask] = useState({
    title: '',
    description: '',
    estimate: 0,
  });
  
  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  
  // Status options from settings
  const [statusOptions, setStatusOptions] = useState<any[]>([]);

  useEffect(() => {
    if (taskId) {
      loadSubtasks();
      loadStatusOptions();
    }
  }, [taskId]);
  
  const loadStatusOptions = async () => {
    try {
      const response = await axiosInstance.get('/api/settings?type_id=2'); // type_id=2 is Status
      setStatusOptions(response.data || []);
    } catch (error) {
      console.error('Error loading status options:', error);
    }
  };

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
      setNewSubtask({ title: '', description: '', estimate: 0 });
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
    
    setEditForm({
      title: subtask.title,
      description: subtask.description || '',
      estimate: subtask.estimate || 0,
      status: statusValue,
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
                // Edit Mode
                <Box sx={{ width: '100%' }}>
                  <Stack spacing={2}>
                    <TextField
                      label="Tên subtask"
                      fullWidth
                      size="small"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      autoFocus
                    />
                    <TextField
                      label="Mô tả"
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    />
                    <Stack direction="row" spacing={2}>
                      <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={editForm.status || ''}
                          label="Status"
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        >
                          {statusOptions.length === 0 ? (
                            <MenuItem disabled>Loading...</MenuItem>
                          ) : (
                            statusOptions.map((status) => (
                              <MenuItem key={status._id} value={status._id}>
                                {status.name}
                              </MenuItem>
                            ))
                          )}
                        </Select>
                      </FormControl>
                      <TextField
                        label="Estimate (giờ)"
                        type="number"
                        size="small"
                        sx={{ width: 150 }}
                        value={editForm.estimate}
                        onChange={(e) => setEditForm({ ...editForm, estimate: Number(e.target.value) })}
                      />
                    </Stack>
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        size="small"
                        onClick={cancelEdit}
                        startIcon={<CloseIcon />}
                        sx={{ textTransform: 'none' }}
                      >
                        Hủy
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => saveEdit(subtask._id)}
                        startIcon={<SaveIcon />}
                        sx={{ 
                          textTransform: 'none',
                          bgcolor: '#667eea',
                          '&:hover': { bgcolor: '#5568d3' }
                        }}
                      >
                        Lưu
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              ) : (
                // View Mode
                <>
                  <IconButton 
                    onClick={() => toggleSubtaskStatus(subtask)}
                    sx={{ mr: 1 }}
                  >
                    {subtask.status === 'Completed' ? (
                      <CheckCircleIcon color="success" />
                    ) : (
                      <RadioButtonUncheckedIcon />
                    )}
                  </IconButton>
                  <ListItemText
                    primary={
                      <Typography 
                        sx={{ 
                          textDecoration: subtask.status === 'Completed' ? 'line-through' : 'none',
                          color: subtask.status === 'Completed' ? 'text.secondary' : 'text.primary',
                          fontWeight: 500,
                        }}
                      >
                        {subtask.title}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        {subtask.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1 }}>
                            {subtask.description}
                          </Typography>
                        )}
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                          <Chip 
                            label={typeof subtask.status === 'object' ? subtask.status?.name : subtask.status} 
                            size="small"
                            sx={{
                              bgcolor: (typeof subtask.status === 'object' ? subtask.status?.name : subtask.status) === 'Completed' ? '#dcfce7' : '#f3f4f6',
                              color: (typeof subtask.status === 'object' ? subtask.status?.name : subtask.status) === 'Completed' ? '#16a34a' : '#6b7280',
                            }}
                          />
                          {subtask.estimate > 0 && (
                            <Chip 
                              label={`${subtask.estimate}h`} 
                              size="small" 
                              variant="outlined"
                              sx={{ borderColor: '#d1d5db' }}
                            />
                          )}
                        </Stack>
                      </Box>
                    }
                    secondaryTypographyProps={{ component: 'div' }}
                  />
                  <ListItemSecondaryAction>
                    <Stack direction="row" spacing={0.5}>
                      <IconButton 
                        edge="end" 
                        onClick={() => startEdit(subtask)}
                        sx={{
                          color: '#667eea',
                          '&:hover': { bgcolor: '#f0f1ff' }
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        onClick={() => deleteSubtask(subtask._id)}
                        sx={{
                          color: '#ef4444',
                          '&:hover': { bgcolor: '#fee2e2' }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </ListItemSecondaryAction>
                </>
              )}
            </ListItem>
          )})}
        </List>
      )}

      {/* Create Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tạo Subtask Mới</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField 
              label="Tên subtask *"
              fullWidth
              value={newSubtask.title}
              onChange={(e) => setNewSubtask({ ...newSubtask, title: e.target.value })}
            />
            <TextField 
              label="Mô tả"
              fullWidth
              multiline
              rows={3}
              value={newSubtask.description}
              onChange={(e) => setNewSubtask({ ...newSubtask, description: e.target.value })}
            />
            <TextField 
              label="Estimate (giờ)"
              type="number"
              fullWidth
              value={newSubtask.estimate}
              onChange={(e) => setNewSubtask({ ...newSubtask, estimate: Number(e.target.value) })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
          <Button 
            variant="contained" 
            onClick={createSubtask}
            disabled={!newSubtask.title}
          >
            Tạo
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

