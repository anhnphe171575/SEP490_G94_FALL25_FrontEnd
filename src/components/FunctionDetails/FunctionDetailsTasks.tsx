"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import axiosInstance from "../../../ultis/axios";
import TaskDetailsModal from "../TaskDetailsModal";
import { STATUS_OPTIONS, PRIORITY_OPTIONS } from "@/constants/settings";

interface FunctionDetailsTasksProps {
  functionId: string | null;
  projectId?: string;
}

export default function FunctionDetailsTasks({
  functionId,
  projectId,
}: FunctionDetailsTasksProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [statusTypes, setStatusTypes] = useState<any[]>([]);
  const [priorityTypes, setPriorityTypes] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: '',
    priority_id: '',
    assignee_id: '',
    start_date: '',
    deadline: '',
  });

  useEffect(() => {
    if (functionId) {
      loadTasks();
      // Load constants instead of API call
      setStatusTypes(STATUS_OPTIONS);
      setPriorityTypes(PRIORITY_OPTIONS);
      loadTeamMembers();
    }
  }, [functionId, projectId]);

  const loadTeamMembers = async () => {
    if (!projectId) return;
    try {
      const response = await axiosInstance.get(`/api/projects/${projectId}/team-members`);
      const allMembers = [
        ...(response.data.leaders || []),
        ...(response.data.members || [])
      ];
      setTeamMembers(allMembers);
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  const loadTasks = async () => {
    if (!functionId) return;
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/functions/${functionId}/tasks`);
      console.log('Tasks for function:', functionId, response.data);
      setTasks(response.data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveStatusName = (status: any) => {
    if (!status) return "-";
    if (typeof status === "object") return status?.name || "-";
    // Handle string enum
    return status;
  };

  const resolvePriorityName = (priority: any) => {
    if (!priority) return "-";
    if (typeof priority === "object") return priority?.name || "-";
    // Handle string enum
    return priority;
  };

  const getStatusColor = (statusName: string) => {
    const statusLower = statusName.toLowerCase();
    if (statusLower.includes('completed') || statusLower.includes('done')) return '#16a34a';
    if (statusLower.includes('progress') || statusLower.includes('doing')) return '#f59e0b';
    if (statusLower.includes('overdue') || statusLower.includes('blocked')) return '#ef4444';
    return '#9ca3af';
  };

  const getPriorityColor = (priorityName: string) => {
    const priorityLower = priorityName.toLowerCase();
    if (priorityLower.includes('critical') || priorityLower.includes('high')) return '#ef4444';
    if (priorityLower.includes('medium')) return '#f59e0b';
    return '#3b82f6';
  };

  const handleOpenTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setTaskModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setTaskModalOpen(false);
    setSelectedTaskId(null);
  };

  const handleTaskUpdate = () => {
    loadTasks();
  };

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.status) {
      alert('Please fill in required fields (Title and Status)');
      return;
    }

    try {
      await axiosInstance.post(`/api/projects/${projectId}/tasks`, {
        ...newTask,
        function_id: functionId,
      });
      
      setCreateDialogOpen(false);
      setNewTask({ 
        title: '', 
        description: '', 
        status: '', 
        priority_id: '',
        assignee_id: '',
        start_date: '',
        deadline: '',
      });
      loadTasks();
    } catch (error: any) {
      console.error('Error creating task:', error);
      alert(error?.response?.data?.message || 'Failed to create task');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography fontSize="13px" fontWeight={700} color="#6b7280" textTransform="uppercase">
          Tasks ({tasks.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          size="small"
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            bgcolor: '#7b68ee',
            '&:hover': { bgcolor: '#6952d6' }
          }}
        >
          Add Task
        </Button>
      </Box>

      {tasks.length === 0 ? (
        <Box sx={{ 
          p: 6, 
          textAlign: 'center',
          bgcolor: '#fafbfc',
          borderRadius: 2,
          border: '1px dashed #e8e9eb'
        }}>
          <Typography fontSize="14px" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
            No tasks yet
          </Typography>
          <Typography fontSize="12px" color="text.secondary" sx={{ mb: 2 }}>
            Create your first task to get started
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{
              textTransform: 'none',
              borderColor: '#7b68ee',
              color: '#7b68ee',
              '&:hover': {
                borderColor: '#6952d6',
                bgcolor: '#7b68ee15'
              }
            }}
          >
            Add Task
          </Button>
        </Box>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, fontSize: '13px', color: '#6b7280', width: '60px' }}>STT</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '13px', color: '#6b7280' }}>Task</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '13px', color: '#6b7280' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '13px', color: '#6b7280', width: 80 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((task, index) => (
              <TableRow 
                key={task._id} 
                hover
                onClick={() => handleOpenTask(task._id)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>
                  <Typography 
                    sx={{ 
                      fontSize: '13px', 
                      fontWeight: 600, 
                      color: '#7b68ee',
                      cursor: 'pointer',
                      '&:hover': { 
                        textDecoration: 'underline',
                        color: '#6b5bd6'
                      }
                    }}
                  >
                    {index + 1}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{ 
                      color: '#7b68ee',
                      fontWeight: 600,
                      fontSize: '14px'
                    }}
                  >
                    {task.title}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={resolveStatusName(task.status)} 
                    size="small"
                    sx={{
                      height: 24,
                      fontSize: '12px',
                      fontWeight: 600,
                      bgcolor: `${getStatusColor(resolveStatusName(task.status))}15`,
                      color: getStatusColor(resolveStatusName(task.status)),
                      border: `1px solid ${getStatusColor(resolveStatusName(task.status))}40`,
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenTask(task._id);
                    }}
                    sx={{
                      textTransform: 'none',
                      fontSize: '13px',
                      color: '#7b68ee',
                      '&:hover': { bgcolor: '#f3f4f6' }
                    }}
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Create Task Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Task</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Task Title *"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={newTask.priority_id}
                label="Priority"
                onChange={(e) => setNewTask({ ...newTask, priority_id: e.target.value })}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {priorityTypes.map((priority) => (
                  <MenuItem key={priority._id} value={priority._id}>
                    {priority.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Status *</InputLabel>
              <Select
                value={newTask.status}
                label="Status *"
                onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
              >
                {statusTypes.map((status) => (
                  <MenuItem key={status._id} value={status._id}>
                    {status.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Assignee</InputLabel>
              <Select
                value={newTask.assignee_id}
                label="Assignee"
                onChange={(e) => setNewTask({ ...newTask, assignee_id: e.target.value })}
              >
                <MenuItem value="">
                  <em>Unassigned</em>
                </MenuItem>
                {teamMembers.map((member) => (
                  <MenuItem key={member._id} value={member._id}>
                    {member.name || member.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Start Date"
              type="date"
              value={newTask.start_date}
              onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Deadline"
              type="date"
              value={newTask.deadline}
              onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateTask}
            disabled={!newTask.title || !newTask.status}
            sx={{ bgcolor: '#7b68ee', '&:hover': { bgcolor: '#6952d6' } }}
          >
            Create Task
          </Button>
        </DialogActions>
      </Dialog>

      {/* Task Details Modal */}
      {taskModalOpen && selectedTaskId && (
        <TaskDetailsModal
          open={taskModalOpen}
          taskId={selectedTaskId}
          projectId={projectId}
          onClose={handleCloseTaskModal}
          onUpdate={handleTaskUpdate}
        />
      )}
    </Box>
  );
}

