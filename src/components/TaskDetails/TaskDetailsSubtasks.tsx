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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import axiosInstance from "../../../ultis/axios";

interface TaskDetailsSubtasksProps {
  taskId: string | null;
}

export default function TaskDetailsSubtasks({ taskId }: TaskDetailsSubtasksProps) {
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [newSubtask, setNewSubtask] = useState({
    title: '',
    description: '',
    estimate: 0,
  });

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

  const completedCount = subtasks.filter(s => s.status === 'Completed').length;
  const progress = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0;

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight="bold">Subtasks</Typography>
          <Typography variant="body2" color="text.secondary">
            {completedCount} / {subtasks.length} completed
          </Typography>
        </Box>
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
          {subtasks.map((subtask) => (
            <ListItem 
              key={subtask._id}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                mb: 1,
                '&:hover': {
                  bgcolor: 'action.hover',
                }
              }}
            >
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
                      color: subtask.status === 'Completed' ? 'text.secondary' : 'text.primary'
                    }}
                  >
                    {subtask.title}
                  </Typography>
                }
                secondary={
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                    <Chip label={subtask.status} size="small" />
                    {subtask.estimate > 0 && (
                      <Chip label={`${subtask.estimate}h`} size="small" variant="outlined" />
                    )}
                  </Stack>
                }
                secondaryTypographyProps={{ component: 'div' }}
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => deleteSubtask(subtask._id)}>
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
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

