"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axiosInstance from "../../../../../../ultis/axios";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";
import QuickNav from "@/components/QuickNav";
import TaskDetailsModal from "@/components/TaskDetailsModal";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Chip,
  Stack,
  TextField,
  IconButton,
} from "@mui/material";
import {
  Speed,
  Group,
  Warning,
  Block,
  CheckCircle,
  Schedule,
  Refresh,
  ErrorOutline,
} from "@mui/icons-material";

const COLORS = {
  primary: '#7b68ee',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
};

export default function ProgressTaskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project_id");

  const [loading, setLoading] = useState(true);
  const [timeBasedProgress, setTimeBasedProgress] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [openTaskDetails, setOpenTaskDetails] = useState(false);
  const [expiredTasks, setExpiredTasks] = useState<any[]>([]);

  useEffect(() => {
    if (projectId) {
      fetchProgressData();
    } else {
      setLoading(false);
    }
  }, [projectId]);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      const [progressRes, tasksRes, membersRes, expiredRes] = await Promise.all([
        axiosInstance.get(`/api/projects/${projectId}/tasks/time-based-progress`).catch(() => ({ data: null })),
        axiosInstance.get(`/api/projects/${projectId}/tasks`, { params: { pageSize: 500 } }),
        axiosInstance.get(`/api/projects/${projectId}/members`).catch(() => ({ data: { members: [] } })),
        axiosInstance.get(`/api/projects/${projectId}/tasks/expired`).catch(() => ({ data: { tasks: [] } })),
      ]);
      
      // Debug time-based progress data
      console.log('=== TIME-BASED PROGRESS DATA ===');
      console.log('Full Response:', progressRes.data);
      if (progressRes.data) {
        console.log('Project Metrics:', progressRes.data.project_metrics);
        console.log('Total Tasks:', progressRes.data.total_tasks);
        console.log('Tasks with Dates:', progressRes.data.tasks_with_dates);
        if (progressRes.data.tasks && progressRes.data.tasks.length > 0) {
          console.log('Sample Task Progress:', progressRes.data.tasks[0]);
          console.log('All Tasks Progress:', progressRes.data.tasks);
        }
      }
      console.log('================================');
      
      setTimeBasedProgress(progressRes.data);
      const allTasksData = tasksRes.data || [];
      setAllTasks(allTasksData);
      const parentTasks = allTasksData.filter((task: any) => !task.parent_task_id);
      setTasks(parentTasks);
      setTeamMembers(membersRes.data.members || []);
      
      // Debug expired tasks response
      console.log('=== EXPIRED TASKS API RESPONSE ===');
      console.log('Full Response:', expiredRes.data);
      console.log('Response Type:', typeof expiredRes.data);
      console.log('Is Array:', Array.isArray(expiredRes.data));
      if (expiredRes.data) {
        if (Array.isArray(expiredRes.data)) {
          console.log('Response is array, length:', expiredRes.data.length);
          setExpiredTasks(expiredRes.data);
        } else if (expiredRes.data.tasks) {
          console.log('Response has tasks property, length:', expiredRes.data.tasks?.length || 0);
          setExpiredTasks(expiredRes.data.tasks || []);
        } else {
          console.log('Response format unknown, setting empty array');
          setExpiredTasks([]);
        }
      } else {
        console.log('No response data, setting empty array');
        setExpiredTasks([]);
      }
      console.log('Expired Tasks State:', expiredRes.data?.tasks || expiredRes.data || []);
      console.log('================================');
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  // === TEAM MEMBER TASK STATISTICS ===
  const teamMemberStatistics = useMemo(() => {
    const memberMap = new Map<string, { name: string; completed: number; notCompleted: number }>();
    
    // Initialize all team members
    teamMembers.forEach((member: any) => {
      if (member._id) {
        memberMap.set(member._id, {
          name: member.full_name || member.email || 'Unknown',
          completed: 0,
          notCompleted: 0
        });
      }
    });
    
    // Filter tasks by date range
    const filteredTasks = tasks.filter((task: any) => {
      if (!dateFrom && !dateTo) return true;
      
      const taskDate = new Date(task.createAt || task.createdAt);
      const from = dateFrom ? new Date(dateFrom) : null;
      const to = dateTo ? new Date(dateTo) : null;
      
      if (from && to) {
        return taskDate >= from && taskDate <= to;
      } else if (from) {
        return taskDate >= from;
      } else if (to) {
        return taskDate <= to;
      }
      return true;
    });
    
    // Count tasks for each member
    filteredTasks.forEach((task: any) => {
      if (task.assignee_id?._id) {
        const userId = task.assignee_id._id;
        const statusName = typeof task.status === 'object' ? task.status?.name : task.status;
        const isCompleted = statusName?.toLowerCase().includes('completed') || statusName?.toLowerCase().includes('done');
        
        if (!memberMap.has(userId)) {
          memberMap.set(userId, {
            name: task.assignee_id.full_name || task.assignee_id.email || 'Unknown',
            completed: 0,
            notCompleted: 0
          });
        }
        
        if (isCompleted) {
          memberMap.get(userId)!.completed++;
        } else {
          memberMap.get(userId)!.notCompleted++;
        }
      }
    });
    
    // Show ALL team members (including those with 0 tasks)
    return Array.from(memberMap.values())
      .map(m => ({
        name: m.name,
        'Task Completed': m.completed,
        'Task Not Completed': m.notCompleted
      }))
      .sort((a, b) => (b['Task Completed'] + b['Task Not Completed']) - (a['Task Completed'] + a['Task Not Completed']));
  }, [tasks, teamMembers, dateFrom, dateTo]);

  // === AT RISK TASKS ===
  const atRiskTasks = useMemo(() => {
    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    
    return tasks
      .filter((task: any) => {
        if (!task.deadline) return false;
        const deadline = new Date(task.deadline);
        const statusName = typeof task.status === 'object' ? task.status?.name : task.status;
        const isCompleted = statusName?.toLowerCase().includes('completed') || statusName?.toLowerCase().includes('done');
        return !isCompleted && deadline <= twoDaysFromNow;
      })
      .map((task: any) => {
        // Calculate impact score (higher = more critical)
        let impactScore = 0;
        
        // 1. Priority weight (0-40 points)
        const priorityName = typeof task.priority === 'object' 
          ? task.priority?.name?.toLowerCase() 
          : task.priority?.toLowerCase();
        
        if (priorityName?.includes('critical') || priorityName?.includes('highest')) {
          impactScore += 40;
        } else if (priorityName?.includes('high')) {
          impactScore += 30;
        } else if (priorityName?.includes('medium')) {
          impactScore += 20;
        } else if (priorityName?.includes('low')) {
          impactScore += 10;
        }
        
        // 2. Time urgency (0-30 points)
        const deadline = new Date(task.deadline);
        const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        if (hoursUntilDeadline < 0) {
          impactScore += 30; // Overdue
        } else if (hoursUntilDeadline < 24) {
          impactScore += 25; // Less than 1 day
        } else if (hoursUntilDeadline < 48) {
          impactScore += 20; // 1-2 days
        } else {
          impactScore += 15; // 2+ days
        }
        
        // 3. Dependencies impact (0-20 points)
        const blockingCount = task.dependents?.length || 0; // How many tasks depend on this
        impactScore += Math.min(blockingCount * 5, 20); // Up to 4+ dependencies = 20 points
        
        // 4. Has subtasks impact (0-10 points)
        const subtaskCount = allTasks.filter((t: any) => t.parent_task_id === task._id).length;
        if (subtaskCount > 0) {
          impactScore += 10;
        }
    
        return {
          ...task,
          impactScore,
          hoursUntilDeadline
        };
      })
      .sort((a, b) => {
        // Sort by impact score (higher first), then by deadline (sooner first)
        if (b.impactScore !== a.impactScore) {
          return b.impactScore - a.impactScore;
        }
        return a.hoursUntilDeadline - b.hoursUntilDeadline;
      })
      .slice(0, 5);
  }, [tasks, allTasks]);

  // === BLOCKED TASKS ===
  const blockedTasks = useMemo(() => {
    return tasks.filter((task: any) => {
      const statusName = typeof task.status === 'object' ? task.status?.name : task.status;
      return statusName?.toLowerCase().includes('blocked');
    }).slice(0, 5);
  }, [tasks]);

  const openTaskDetailsModal = (taskId: string) => {
    setSelectedTaskId(taskId);
    setOpenTaskDetails(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <ResponsiveSidebar />
        <div className="mx-auto w-full max-w-7xl px-6 py-8 md:ml-64">
          <QuickNav selectedProject={projectId ?? undefined} />
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
            <CircularProgress size={40} />
          </Box>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <ResponsiveSidebar />
      <div className="mx-auto w-full max-w-7xl px-6 py-8 md:ml-64">
        <QuickNav selectedProject={projectId ?? undefined} />
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Progress Task</h1>
          <p className="mt-2 text-sm text-slate-500">
            Theo dõi tiến độ dự án dựa trên thời gian
          </p>
        </div>

        {!projectId ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
            <Typography color="text.secondary">
              Vui lòng chọn dự án để xem tiến độ
            </Typography>
          </Paper>
        ) : timeBasedProgress && timeBasedProgress.project_metrics ? (
          <Box sx={{ mb: 4 }}>
            <Paper sx={{ 
              p: 3, 
              borderRadius: 3,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid #e8e9eb',
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body1" sx={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Speed sx={{ fontSize: 18, color: COLORS.primary }} />
                  Project Progress
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: '#0284c7' }} />
                    <Typography sx={{ fontSize: '12px', color: '#64748b' }}>
                      Expected: {timeBasedProgress.project_metrics.avgTargetPercent.toFixed(1)}%
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: timeBasedProgress.project_metrics.avgActualPercent >= timeBasedProgress.project_metrics.avgTargetPercent ? '#16a34a' : '#dc2626' }} />
                    <Typography sx={{ fontSize: '12px', color: '#64748b' }}>
                      Actual: {timeBasedProgress.project_metrics.avgActualPercent.toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Single Progress Bar with Both Indicators */}
              <Box sx={{ position: 'relative', height: 32, mb: 1 }}>
                <Box sx={{ 
                  width: '100%',
                  height: '100%',
                  bgcolor: '#f1f5f9',
                  borderRadius: 2,
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  {/* Actual Progress Fill */}
                  <Box sx={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${Math.min(timeBasedProgress.project_metrics.avgActualPercent, 100)}%`,
                    bgcolor: timeBasedProgress.project_metrics.avgActualPercent >= timeBasedProgress.project_metrics.avgTargetPercent ? '#16a34a' : '#dc2626',
                    transition: 'width 0.5s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    pr: 1.5
                  }}>
                    {timeBasedProgress.project_metrics.avgActualPercent > 5 && (
                      <Typography sx={{ fontSize: '13px', color: 'white', fontWeight: 700 }}>
                        {timeBasedProgress.project_metrics.avgActualPercent.toFixed(1)}%
                      </Typography>
                    )}
                  </Box>
                  
                  {/* Expected Progress Marker */}
                  <Box sx={{
                    position: 'absolute',
                    left: `${Math.min(timeBasedProgress.project_metrics.avgTargetPercent, 100)}%`,
                    top: 0,
                    bottom: 0,
                    width: 3,
                    bgcolor: '#0284c7',
                    boxShadow: '0 0 8px rgba(2, 132, 199, 0.6)',
                    zIndex: 2
                  }} />
                </Box>
              </Box>

              {/* Status Text */}
              <Typography sx={{ 
                fontSize: '11px', 
                color: timeBasedProgress.project_metrics.avgActualPercent >= timeBasedProgress.project_metrics.avgTargetPercent ? COLORS.success : COLORS.danger,
                fontWeight: 600,
                textAlign: 'center'
              }}>
                {timeBasedProgress.project_metrics.avgActualPercent >= timeBasedProgress.project_metrics.avgTargetPercent ? '✓ On Schedule' : '⚠ Behind Schedule'} 
                ({timeBasedProgress.project_metrics.avgActualPercent >= timeBasedProgress.project_metrics.avgTargetPercent ? '+' : ''}{(timeBasedProgress.project_metrics.avgActualPercent - timeBasedProgress.project_metrics.avgTargetPercent).toFixed(1)}%)
              </Typography>
            </Paper>
          </Box>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
            <Typography color="text.secondary">
              Không có dữ liệu tiến độ cho dự án này
            </Typography>
          </Paper>
        )}

        {/* Team Member Task Statistics */}
        {projectId && (
          <Paper sx={{ 
            p: 3, 
            borderRadius: 4,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #e8e9eb',
            mb: 4,
            background: 'white',
            '&:hover': {
              boxShadow: '0 8px 28px rgba(0,0,0,0.12)'
            },
            transition: 'all 0.3s ease'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Group sx={{ color: COLORS.primary, fontSize: 20 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '16px' }}>
                  Team Member Task Statistics
                </Typography>
                {(dateFrom || dateTo) && (
                  <Chip 
                    label={`Filtered: ${dateFrom || 'Start'} → ${dateTo || 'Now'}`}
                    size="small"
                    onDelete={() => {
                      setDateFrom('');
                      setDateTo('');
                    }}
                    sx={{ 
                      bgcolor: 'rgba(123, 104, 238, 0.1)',
                      color: COLORS.primary,
                      fontWeight: 600,
                      fontSize: '11px'
                    }}
                  />
                )}
              </Box>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <TextField
                  type="date"
                  size="small"
                  label="From"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ 
                    width: 150,
                    '& .MuiOutlinedInput-root': {
                      fontSize: '13px',
                      height: 36
                    }
                  }}
                />
                <TextField
                  type="date"
                  size="small"
                  label="To"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ 
                    width: 150,
                    '& .MuiOutlinedInput-root': {
                      fontSize: '13px',
                      height: 36
                    }
                  }}
                />
                {(dateFrom || dateTo) && (
                  <IconButton
                    size="small"
                    onClick={() => {
                      setDateFrom('');
                      setDateTo('');
                    }}
                    sx={{ 
                      bgcolor: '#f3f4f6',
                      '&:hover': { bgcolor: '#e5e7eb' }
                    }}
                  >
                    <Refresh sx={{ fontSize: 18 }} />
                  </IconButton>
                )}
              </Stack>
            </Box>
            {teamMemberStatistics.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={teamMemberStatistics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={120}
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: 8, 
                      border: '1px solid #e8e9eb',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Task Completed" fill={COLORS.success} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Task Not Completed" fill={COLORS.danger} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
                <Typography color="text.secondary">No team member data available</Typography>
              </Box>
            )}
          </Paper>
        )}

        {/* Issues & Alerts - Full Width */}
        {projectId && (
          <Box>
            <Stack spacing={3}>
              {/* At Risk Tasks */}
              {atRiskTasks.length > 0 && (
                <Paper sx={{ 
                  p: 3, 
                  borderRadius: 4,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  border: '1px solid #e8e9eb',
                  background: 'white',
                  '&:hover': {
                    boxShadow: '0 8px 28px rgba(0,0,0,0.12)'
                  },
                  transition: 'all 0.3s ease'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <Warning sx={{ color: COLORS.warning, fontSize: 20 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '14px' }}>
                      At Risk ({atRiskTasks.length})
                    </Typography>
                  </Box>
                  <Stack spacing={1}>
                    {atRiskTasks.map((task: any, idx: number) => {
                      // Determine impact level and color
                      const impactLevel = 
                        task.impactScore >= 70 ? { label: '🔴 CRITICAL', color: '#dc2626', bgcolor: 'rgba(220, 38, 38, 0.1)' } :
                        task.impactScore >= 50 ? { label: '🟠 HIGH', color: '#ea580c', bgcolor: 'rgba(234, 88, 12, 0.1)' } :
                        task.impactScore >= 30 ? { label: '🟡 MEDIUM', color: '#f59e0b', bgcolor: 'rgba(245, 158, 11, 0.1)' } :
                        { label: '🟢 LOW', color: '#16a34a', bgcolor: 'rgba(22, 163, 74, 0.1)' };
                      
                      const isOverdue = task.hoursUntilDeadline < 0;
                      
                      return (
                        <Box 
                          key={idx}
                          sx={{ 
                            p: 2, 
                            bgcolor: 'white',
                            borderRadius: 2,
                            border: `2px solid ${impactLevel.color}`,
                            borderLeft: `6px solid ${impactLevel.color}`,
                            cursor: 'pointer',
                            position: 'relative',
                            overflow: 'hidden',
                            '&:hover': { 
                              bgcolor: impactLevel.bgcolor,
                              transform: 'translateX(4px)',
                              boxShadow: `0 4px 12px ${impactLevel.color}40`
                            },
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => openTaskDetailsModal(task._id)}
                        >
                          {/* Rank Badge */}
                          <Box sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            bgcolor: impactLevel.color,
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '12px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }}>
                            {idx + 1}
                          </Box>
                          
                          <Stack spacing={1}>
                            {/* Impact Level Badge */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Chip 
                                label={impactLevel.label}
                                size="small"
                                sx={{ 
                                  bgcolor: impactLevel.color,
                                  color: 'white',
                                  fontWeight: 700,
                                  fontSize: '10px',
                                  height: 20,
                                  '& .MuiChip-label': { px: 1 }
                                }}
                              />
                              <Chip 
                                label={`Impact: ${task.impactScore}/100`}
                                size="small"
                                sx={{ 
                                  bgcolor: 'rgba(0,0,0,0.05)',
                                  color: 'text.secondary',
                                  fontWeight: 600,
                                  fontSize: '10px',
                                  height: 20,
                                  '& .MuiChip-label': { px: 1 }
                                }}
                              />
                            </Box>
                            
                            {/* Task Title */}
                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '13px', pr: 4 }}>
                              {task.title}
                            </Typography>
                            
                            {/* Task Details */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                              {/* Deadline Status */}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Schedule sx={{ fontSize: 14, color: isOverdue ? '#dc2626' : '#f59e0b' }} />
                                <Typography variant="caption" sx={{ 
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: isOverdue ? '#dc2626' : 'text.secondary'
                                }}>
                                  {isOverdue 
                                    ? `Overdue ${Math.abs(Math.round(task.hoursUntilDeadline / 24))}d`
                                    : task.hoursUntilDeadline < 24
                                      ? `${Math.round(task.hoursUntilDeadline)}h left`
                                      : `${Math.round(task.hoursUntilDeadline / 24)}d left`
                                  }
                                </Typography>
                              </Box>

                              {/* Priority */}
                              {task.priority && (
                                <Chip 
                                  label={typeof task.priority === 'object' ? task.priority.name : task.priority}
                                  size="small"
                                  sx={{ 
                                    fontSize: '10px',
                                    height: 18,
                                    bgcolor: 'rgba(0,0,0,0.05)',
                                    fontWeight: 600
                                  }}
                                />
                              )}
                              
                              {/* Blocking Tasks */}
                              {task.dependents && task.dependents.length > 0 && (
                                <Chip 
                                  label={`🔒 Blocks ${task.dependents.length} task${task.dependents.length > 1 ? 's' : ''}`}
                                  size="small"
                                  sx={{ 
                                    fontSize: '10px',
                                    height: 18,
                                    bgcolor: 'rgba(220, 38, 38, 0.1)',
                                    color: '#dc2626',
                                    fontWeight: 600
                                  }}
                                />
                              )}
                            </Box>
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>
                </Paper>
              )}

              {/* Blocked Tasks */}
              {blockedTasks.length > 0 && (
                <Paper sx={{ 
                  p: 3, 
                  borderRadius: 4,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  border: '1px solid #e8e9eb',
                  background: 'white',
                  '&:hover': {
                    boxShadow: '0 8px 28px rgba(0,0,0,0.12)'
                  },
                  transition: 'all 0.3s ease'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <Block sx={{ color: COLORS.danger, fontSize: 20 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '14px' }}>
                      🚫 Blocked ({blockedTasks.length})
                    </Typography>
                  </Box>
                  <Stack spacing={1}>
                    {blockedTasks.map((task: any, idx: number) => (
                      <Box 
                        key={idx}
                        sx={{ 
                          p: 1.5, 
                          bgcolor: 'rgba(239, 68, 68, 0.05)',
                          borderRadius: 2,
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' }
                        }}
                        onClick={() => openTaskDetailsModal(task._id)}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '12px', mb: 0.5 }}>
                          {task.title}
                        </Typography>
                        <Chip 
                          label={typeof task.status === 'object' ? task.status?.name : task.status}
                          size="small"
                          sx={{ 
                            height: 18, 
                            fontSize: '10px', 
                            bgcolor: 'rgba(239, 68, 68, 0.1)',
                            color: COLORS.danger
                          }}
                        />
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              )}

              {/* No Issues */}
              {atRiskTasks.length === 0 && blockedTasks.length === 0 && (
                <Paper sx={{ 
                  p: 4, 
                  borderRadius: 4,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  border: '1px solid #e8e9eb',
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(56, 239, 125, 0.05) 100%)',
                  '&:hover': {
                    boxShadow: '0 8px 28px rgba(16, 185, 129, 0.15)'
                  },
                  transition: 'all 0.3s ease'
                }}>
                  <CheckCircle sx={{ fontSize: 48, color: COLORS.success, mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                    All Good! 🎉
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    No blocked or at-risk tasks
                  </Typography>
                </Paper>
              )}
            </Stack>
          </Box>
        )}
        {/* Expired Tasks */}
        {projectId && (
          <>
            {expiredTasks.length > 0 ? (
          <Paper sx={{ 
            p: 3, 
            borderRadius: 4,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #e8e9eb',
            background: 'white',
            '&:hover': {
              boxShadow: '0 8px 28px rgba(0,0,0,0.12)'
            },
            transition: 'all 0.3s ease'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <ErrorOutline sx={{ color: COLORS.danger, fontSize: 20 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '14px' }}>
                ⏰ Expired Tasks ({expiredTasks.length})
              </Typography>
            </Box>
            <Stack spacing={1}>
              {expiredTasks.map((task: any, idx: number) => {
                const taskStatus = typeof task.status === 'object' ? task.status?.name : task.status || 'Unknown';
                const taskPriority = typeof task.priority === 'object' ? task.priority?.name : task.priority || '';
                const overdueDays = task.overdueDays || 0;
                
                return (
                  <Box 
                    key={task._id || idx}
                    sx={{ 
                      p: 2, 
                      bgcolor: 'white',
                      borderRadius: 2,
                      border: '2px solid #dc2626',
                      borderLeft: '6px solid #dc2626',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': { 
                        bgcolor: 'rgba(220, 38, 38, 0.1)',
                        transform: 'translateX(4px)',
                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => openTaskDetailsModal(task._id)}
                  >
                    {/* Overdue Days Badge */}
                    <Box sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      minWidth: 60,
                      height: 28,
                      borderRadius: 2,
                      bgcolor: '#dc2626',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '11px',
                      px: 1.5,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                      {overdueDays}d overdue
                    </Box>
                    
                    <Stack spacing={1}>
                      {/* Task Title */}
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '13px', pr: 8 }}>
                        {task.title} 
                      </Typography>
                      
                      {/* Task Details */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                        {/* Deadline Status */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Schedule sx={{ fontSize: 14, color: '#dc2626' }} />
                          <Typography variant="caption" sx={{ 
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#dc2626'
                          }}>
                            {task.deadline 
                              ? `Deadline: ${new Date(task.deadline).toLocaleDateString('vi-VN')}`
                              : 'No deadline'
                            }
                          </Typography>
                        </Box>

                        {/* Priority */}
                        {taskPriority && (
                          <Chip 
                            label={taskPriority}
                            size="small"
                            sx={{ 
                              fontSize: '10px',
                              height: 18,
                              bgcolor: 'rgba(0,0,0,0.05)',
                              fontWeight: 600
                            }}
                          />
                        )}
                        
                        {/* Status */}
                        <Chip 
                          label={taskStatus}
                          size="small"
                          sx={{ 
                            fontSize: '10px',
                            height: 18,
                            bgcolor: 'rgba(220, 38, 38, 0.1)',
                            color: COLORS.danger,
                            fontWeight: 600
                          }}
                        />
                        
                        {/* Assignee */}
                        {task.assignee_id && (
                          <Chip 
                            label={typeof task.assignee_id === 'object' 
                              ? task.assignee_id?.full_name || task.assignee_id?.email 
                              : 'Assigned'}
                            size="small"
                            sx={{ 
                              fontSize: '10px',
                              height: 18,
                              bgcolor: 'rgba(0,0,0,0.05)',
                              fontWeight: 600
                            }}
                          />
                        )}
                      </Box>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </Paper>
            ) : (
              <Paper sx={{ 
                p: 3, 
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid #e8e9eb',
                background: 'white',
                textAlign: 'center'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                  <CheckCircle sx={{ color: COLORS.success, fontSize: 20 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '14px' }}>
                    ⏰ Expired Tasks (0)
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
                  No expired tasks found
                </Typography>
              </Paper>
            )}
          </>
        )}

        {/* Task Details Modal */}
        {selectedTaskId && (
          <TaskDetailsModal
            open={openTaskDetails}
            onClose={() => {
              setOpenTaskDetails(false);
              setSelectedTaskId(null);
            }}
            taskId={selectedTaskId}
            projectId={projectId || undefined}
            onUpdate={() => {
              // Reload all data including expired tasks
              if (projectId) {
                fetchProgressData();
              }
            }}
            readonly={true}
          />
        )}
      </div>
    </div>
  );
}
