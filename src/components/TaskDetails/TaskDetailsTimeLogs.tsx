"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Paper,
  IconButton,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
  LinearProgress,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import TimerIcon from "@mui/icons-material/Timer";
import axiosInstance from "../../../ultis/axios";

interface TaskDetailsTimeLogsProps {
  taskId: string | null;
  task: any;
  onUpdate: () => void;
}

export default function TaskDetailsTimeLogs({ taskId, task, onUpdate }: TaskDetailsTimeLogsProps) {
  const [timeLogs, setTimeLogs] = useState<any[]>([]);
  const [totalTime, setTotalTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [openManualLog, setOpenManualLog] = useState(false);
  const [manualLogForm, setManualLogForm] = useState({
    started_at: '',
    ended_at: '',
    description: ''
  });

  useEffect(() => {
    if (taskId) {
      loadTimeLogs();
    }
  }, [taskId]);

  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const loadTimeLogs = async () => {
    if (!taskId) return;
    
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/tasks/${taskId}/time-logs`);
      setTimeLogs(response.data.time_logs || []);
      setTotalTime(response.data.total_time || 0);
      setIsTimerRunning(task?.time_tracking?.is_active || false);
    } catch (error: any) {
      console.error("Error loading time logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const startTimer = async () => {
    try {
      await axiosInstance.post(`/api/tasks/${taskId}/time-logs/start`);
      setIsTimerRunning(true);
      setTimerSeconds(0);
      await onUpdate();
    } catch (error: any) {
      console.error("Error starting timer:", error);
    }
  };

  const stopTimer = async () => {
    try {
      await axiosInstance.post(`/api/tasks/${taskId}/time-logs/stop`);
      setIsTimerRunning(false);
      setTimerSeconds(0);
      await loadTimeLogs();
      await onUpdate();
    } catch (error: any) {
      console.error("Error stopping timer:", error);
    }
  };

  const logTimeManually = async () => {
    if (!taskId || !manualLogForm.started_at || !manualLogForm.ended_at) return;
    
    try {
      await axiosInstance.post(`/api/tasks/${taskId}/time-logs/manual`, {
        started_at: manualLogForm.started_at,
        ended_at: manualLogForm.ended_at,
        description: manualLogForm.description
      });
      setManualLogForm({ started_at: '', ended_at: '', description: '' });
      setOpenManualLog(false);
      await loadTimeLogs();
    } catch (error: any) {
      console.error("Error logging time:", error);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatHours = (seconds: number) => {
    return (seconds / 3600).toFixed(2) + 'h';
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      {/* Header with Timer */}
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          p: 3,
          bgcolor: isTimerRunning ? '#eff6ff' : '#f8f9fb',
          border: isTimerRunning ? '2px solid #3b82f6' : '1px solid #e8e9eb',
          borderRadius: 3
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
              Time Tracker
            </Typography>
            <Typography fontSize="12px" color="text.secondary">
              Total time tracked: <strong>{formatHours(totalTime)}</strong>
            </Typography>
          </Box>

          {/* Timer Display & Controls */}
          <Stack direction="row" alignItems="center" spacing={2}>
            {isTimerRunning && (
              <Box sx={{ 
                px: 3,
                py: 1.5,
                bgcolor: 'white',
                borderRadius: 2,
                border: '2px solid #3b82f6'
              }}>
                <Typography 
                  variant="h5" 
                  fontWeight={700} 
                  color="#3b82f6"
                  sx={{ fontFamily: 'monospace' }}
                >
                  {formatDuration(timerSeconds)}
                </Typography>
              </Box>
            )}
            
            {isTimerRunning ? (
              <Button
                variant="contained"
                color="error"
                startIcon={<StopIcon />}
                onClick={stopTimer}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3
                }}
              >
                Stop Timer
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={startTimer}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  bgcolor: '#10b981',
                  px: 3,
                  '&:hover': { bgcolor: '#059669' }
                }}
              >
                Start Timer
              </Button>
            )}
          </Stack>
        </Stack>

        {/* Progress vs Estimate */}
        {task?.estimate > 0 && (
          <Box sx={{ mt: 3 }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography fontSize="12px" fontWeight={600} color="text.secondary">
                Time Progress
              </Typography>
              <Typography fontSize="12px" fontWeight={700} color={totalTime / 3600 > task.estimate ? '#ef4444' : '#10b981'}>
                {formatHours(totalTime)} / {task.estimate}h
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={Math.min((totalTime / 3600 / task.estimate) * 100, 100)}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: '#e8e9eb',
                '& .MuiLinearProgress-bar': {
                  bgcolor: totalTime / 3600 > task.estimate ? '#ef4444' : '#10b981',
                  borderRadius: 4
                }
              }}
            />
          </Box>
        )}
      </Paper>

      {/* Manual Log Button */}
      <Button
        fullWidth
        startIcon={<AddIcon />}
        onClick={() => setOpenManualLog(true)}
        sx={{
          mb: 3,
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
        Log Time Manually
      </Button>

      {/* Time Logs List */}
      <Box sx={{ mb: 2 }}>
        <Typography fontSize="13px" fontWeight={700} color="#6b7280" textTransform="uppercase" sx={{ mb: 2 }}>
          Time Logs ({timeLogs.length})
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">Loading time logs...</Typography>
        </Box>
      ) : timeLogs.length === 0 ? (
        <Box sx={{ 
          p: 6, 
          textAlign: 'center',
          bgcolor: '#fafbfc',
          borderRadius: 2,
          border: '1px dashed #e8e9eb'
        }}>
          <TimerIcon sx={{ fontSize: 48, color: '#d1d5db', mb: 2 }} />
          <Typography fontSize="14px" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
            No time logs yet
          </Typography>
          <Typography fontSize="12px" color="text.secondary">
            Start the timer or log time manually to track your work
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {timeLogs.map((log) => (
            <Paper
              key={log._id}
              elevation={0}
              sx={{
                p: 2.5,
                border: '1px solid #e8e9eb',
                borderRadius: 2,
                bgcolor: log.is_manual ? '#fffbeb' : 'white',
                borderLeft: log.is_manual ? '3px solid #f59e0b' : '3px solid #3b82f6',
                '&:hover': {
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                }
              }}
            >
              <Stack direction="row" alignItems="flex-start" spacing={2}>
                {/* User Avatar */}
                <Avatar sx={{ width: 36, height: 36, bgcolor: '#7b68ee', fontSize: '14px', fontWeight: 600 }}>
                  {(log.user_id?.full_name || log.user_id?.email || 'U')[0].toUpperCase()}
                </Avatar>

                <Box sx={{ flex: 1 }}>
                  {/* User & Time */}
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography fontSize="14px" fontWeight={700}>
                        {log.user_id?.full_name || log.user_id?.email || 'Unknown'}
                      </Typography>
                      {log.is_manual && (
                        <Chip 
                          label="Manual" 
                          size="small" 
                          sx={{ 
                            height: 18, 
                            fontSize: '10px',
                            bgcolor: '#fef3c7',
                            color: '#92400e'
                          }} 
                        />
                      )}
                    </Stack>
                    
                    <Typography fontSize="16px" fontWeight={700} color="#7b68ee">
                      {formatDuration(log.duration)}
                    </Typography>
                  </Stack>

                  {/* Time Range */}
                  <Typography fontSize="12px" color="text.secondary" sx={{ mb: 0.5 }}>
                    {new Date(log.started_at).toLocaleString()} → {new Date(log.ended_at).toLocaleString()}
                  </Typography>

                  {/* Description */}
                  {log.description && (
                    <Typography fontSize="13px" color="text.primary" sx={{ mt: 1 }}>
                      {log.description}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      {/* Manual Log Dialog */}
      <Dialog
        open={openManualLog}
        onClose={() => setOpenManualLog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Log Time Manually</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Start Time *"
              type="datetime-local"
              fullWidth
              value={manualLogForm.started_at}
              onChange={(e) => setManualLogForm({ ...manualLogForm, started_at: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Time *"
              type="datetime-local"
              fullWidth
              value={manualLogForm.ended_at}
              onChange={(e) => setManualLogForm({ ...manualLogForm, ended_at: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={manualLogForm.description}
              onChange={(e) => setManualLogForm({ ...manualLogForm, description: e.target.value })}
              placeholder="What did you work on?"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => {
              setOpenManualLog(false);
              setManualLogForm({ started_at: '', ended_at: '', description: '' });
            }}
            sx={{ textTransform: 'none', fontWeight: 600, color: '#6b7280' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!manualLogForm.started_at || !manualLogForm.ended_at}
            onClick={logTimeManually}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#7b68ee',
              '&:hover': { bgcolor: '#6952d6' }
            }}
          >
            Log Time
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

