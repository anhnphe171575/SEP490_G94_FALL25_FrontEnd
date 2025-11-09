"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "../../../../../../ultis/axios";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";
import ProjectBreadcrumb from "@/components/ProjectBreadcrumb";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Legend,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Typography,
  Avatar,
  Stack,
  Button,
  IconButton,
  Chip,
  Paper,
  LinearProgress,
  Container,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Badge,
  Tabs,
  Tab,
} from "@mui/material";
import {
  CheckCircle,
  Schedule,
  Warning,
  Assignment,
  Refresh,
  ViewList,
  Group,
  ChevronLeft,
  AccessTime,
  Block,
  Speed,
  Timeline,
  CalendarToday,
  AccountTree,
  BugReport,
  ErrorOutline,
} from "@mui/icons-material";

const COLORS = {
  primary: '#5B47FB',
  success: '#00D68F',
  warning: '#FFAA00',
  danger: '#FF3D71',
  info: '#0095FF',
};

export default function TaskDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [bugs, setBugs] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    if (projectId) {
      fetchDashboardData();
    }
  }, [projectId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, tasksRes, projectRes, membersRes, bugsRes] = await Promise.all([
        axiosInstance.get(`/api/projects/${projectId}/tasks/stats`),
        axiosInstance.get(`/api/projects/${projectId}/tasks`, { params: { pageSize: 500 } }),
        axiosInstance.get(`/api/projects/${projectId}/dashboard`).catch(() => ({ data: null })),
        axiosInstance.get(`/api/projects/${projectId}/members`).catch(() => ({ data: { members: [] } })),
        axiosInstance.get(`/api/defects`, { params: { project_id: projectId } }).catch(() => ({ data: { defects: [] } }))
      ]);
      
      setStats(statsRes.data);
      setTasks(tasksRes.data);
      setBugs(bugsRes.data.defects || []);
      setTeamMembers(membersRes.data.members || []);
      
      // Generate mock activities from tasks for demo
      const recentActivities = tasksRes.data.slice(0, 10).map((task: any, idx: number) => ({
        id: idx,
        type: idx % 3 === 0 ? 'status_change' : idx % 3 === 1 ? 'assignment' : 'comment',
        task_title: task.title,
        user: task.assignee_id?.full_name || 'Unknown',
        timestamp: new Date(task.updateAt || Date.now()).toISOString(),
        description: `Updated ${task.title}`
      }));
      setActivities(recentActivities);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setTimeout(() => setRefreshing(false), 500);
  };

  const chartData = useMemo(() => {
    // If stats from API are all 0, calculate from tasks directly
    const hasStatsData = stats && (stats.completed || stats.in_progress || stats.pending || stats.overdue);
    
    if (!hasStatsData && tasks.length > 0) {
      // Calculate stats from tasks array
      const statusMap = new Map<string, number>();
      tasks.forEach((task: any) => {
        const statusName = typeof task.status === 'object' ? task.status?.name : task.status;
        const normalizedStatus = statusName?.toLowerCase() || 'unknown';
        
        let category = 'Pending';
        if (normalizedStatus.includes('completed') || normalizedStatus.includes('done')) {
          category = 'Completed';
        } else if (normalizedStatus.includes('progress') || normalizedStatus.includes('doing')) {
          category = 'In Progress';
        } else if (normalizedStatus.includes('overdue')) {
          category = 'Overdue';
        }
        
        statusMap.set(category, (statusMap.get(category) || 0) + 1);
      });
      
      const data = [
        { name: 'Completed', value: statusMap.get('Completed') || 0, color: COLORS.success },
        { name: 'In Progress', value: statusMap.get('In Progress') || 0, color: COLORS.info },
        { name: 'Pending', value: statusMap.get('Pending') || 0, color: COLORS.warning },
        { name: 'Overdue', value: statusMap.get('Overdue') || 0, color: COLORS.danger },
      ].filter(item => item.value > 0);
      
      return data;
    }
    
    if (!stats) return [];
    const data = [
      { name: 'Completed', value: stats.completed || 0, color: COLORS.success },
      { name: 'In Progress', value: stats.in_progress || 0, color: COLORS.info },
      { name: 'Pending', value: stats.pending || 0, color: COLORS.warning },
      { name: 'Overdue', value: stats.overdue || 0, color: COLORS.danger },
    ].filter(item => item.value > 0);
    
    return data;
  }, [stats, tasks]);

  const priorityData = useMemo(() => {
    const priorityMap = new Map();
    tasks.forEach((task: any) => {
      const priority = task.priority?.name || 'No Priority';
      priorityMap.set(priority, (priorityMap.get(priority) || 0) + 1);
    });
    return Array.from(priorityMap.entries()).map(([name, value]) => ({
      name,
      value,
    })).sort((a, b) => b.value - a.value);
  }, [tasks]);

  const teamData = useMemo(() => {
    // Start with all team members
    const teamMap = new Map();
    
    // Initialize all team members with 0 tasks
    teamMembers.forEach((member: any) => {
      if (member._id) {
        teamMap.set(member._id, {
          name: member.full_name || member.email,
          avatar: member.avatar,
          total: 0,
          completed: 0,
          isLeader: member.team_leader === 1,
        });
      }
    });
    
    // Count tasks for each member
    tasks.forEach((task: any) => {
      if (task.assignee_id?._id) {
        const userId = task.assignee_id._id;
        if (!teamMap.has(userId)) {
          // If member not in team list but has tasks, add them
          teamMap.set(userId, {
            name: task.assignee_id.full_name || task.assignee_id.email,
            avatar: task.assignee_id.avatar,
            total: 0,
            completed: 0,
            isLeader: false,
          });
        }
        const member = teamMap.get(userId);
        member.total++;
        const statusName = typeof task.status === 'object' ? task.status?.name : task.status;
        if (statusName?.toLowerCase().includes('completed') || statusName?.toLowerCase().includes('done')) {
          member.completed++;
        }
      }
    });
    
    return Array.from(teamMap.values())
      .map(m => ({ ...m, rate: m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0 }))
      .sort((a, b) => {
        // Leaders first, then by completion rate
        if (a.isLeader && !b.isLeader) return -1;
        if (!a.isLeader && b.isLeader) return 1;
        return b.rate - a.rate;
      })
      .slice(0, 8); // Show top 8 members
  }, [tasks, teamMembers]);

  const weekData = useMemo(() => {
    // Calculate actual data from tasks created/completed in last 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Initialize data for last 7 days
    const dataMap = new Map();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayKey = date.toISOString().split('T')[0];
      dataMap.set(dayKey, {
        day: dayNames[date.getDay()],
        created: 0,
        completed: 0
      });
    }
    
    // Count tasks created and completed each day
    tasks.forEach((task: any) => {
      // Count created tasks
      if (task.createAt || task.createdAt) {
        const createdDate = new Date(task.createAt || task.createdAt);
        if (createdDate >= sevenDaysAgo) {
          const dayKey = createdDate.toISOString().split('T')[0];
          if (dataMap.has(dayKey)) {
            dataMap.get(dayKey).created++;
          }
        }
      }
      
      // Count completed tasks
      const statusName = typeof task.status === 'object' ? task.status?.name : task.status;
      if (statusName?.toLowerCase().includes('completed') || statusName?.toLowerCase().includes('done')) {
        if (task.updateAt || task.updatedAt) {
          const completedDate = new Date(task.updateAt || task.updatedAt);
          if (completedDate >= sevenDaysAgo) {
            const dayKey = completedDate.toISOString().split('T')[0];
            if (dataMap.has(dayKey)) {
              dataMap.get(dayKey).completed++;
            }
          }
        }
      }
    });
    
    return Array.from(dataMap.values());
  }, [tasks]);

  // Blocked Tasks
  const blockedTasks = useMemo(() => {
    return tasks.filter((task: any) => {
      const statusName = typeof task.status === 'object' ? task.status?.name : task.status;
      return statusName?.toLowerCase().includes('blocked') || 
             statusName?.toLowerCase().includes('overdue');
    }).slice(0, 5);
  }, [tasks]);

  // At Risk Tasks (overdue or deadline within 2 days)
  const atRiskTasks = useMemo(() => {
    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    return tasks.filter((task: any) => {
      if (!task.deadline) return false;
      const deadline = new Date(task.deadline);
      const statusName = typeof task.status === 'object' ? task.status?.name : task.status;
      const isCompleted = statusName?.toLowerCase().includes('completed') || statusName?.toLowerCase().includes('done');
      return !isCompleted && deadline <= twoDaysFromNow;
    }).slice(0, 5);
  }, [tasks]);

  // Burndown Chart Data - Real data from last 7 days
  const burndownData = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Get total tasks at start of period (7 days ago)
    const tasksAtStart = tasks.filter((task: any) => {
      const createdDate = new Date(task.createAt || task.createdAt);
      return createdDate <= sevenDaysAgo;
    }).length;
    
    // Calculate remaining tasks each day
    const data = [];
    for (let i = 0; i <= 7; i++) {
      const currentDate = new Date(sevenDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
      
      // Count completed tasks up to this date
      const completedByThisDate = tasks.filter((task: any) => {
        const statusName = typeof task.status === 'object' ? task.status?.name : task.status;
        const isCompleted = statusName?.toLowerCase().includes('completed') || statusName?.toLowerCase().includes('done');
        if (!isCompleted) return false;
        
        const completedDate = new Date(task.updateAt || task.updatedAt);
        return completedDate <= currentDate && completedDate >= sevenDaysAgo;
      }).length;
      
      // Count new tasks created up to this date
      const createdByThisDate = tasks.filter((task: any) => {
        const createdDate = new Date(task.createAt || task.createdAt);
        return createdDate <= currentDate && createdDate >= sevenDaysAgo;
      }).length;
      
      const totalAtThisPoint = tasksAtStart + createdByThisDate;
      const remaining = totalAtThisPoint - completedByThisDate;
      const ideal = totalAtThisPoint - (totalAtThisPoint / 7) * i;
      
      data.push({
        day: i === 0 ? 'Start' : `Day ${i}`,
        ideal: Math.max(0, Math.round(ideal)),
        actual: Math.max(0, remaining),
      });
    }
    
    return data;
  }, [tasks]);

  // Velocity Chart - Real data from last 4 weeks
  const velocityData = useMemo(() => {
    const now = new Date();
    const data = [];
    
    // Calculate for last 4 weeks
    for (let weekIndex = 3; weekIndex >= 0; weekIndex--) {
      const weekEnd = new Date(now.getTime() - weekIndex * 7 * 24 * 60 * 60 * 1000);
      const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      // Count tasks created in this week (committed)
      const committed = tasks.filter((task: any) => {
        const createdDate = new Date(task.createAt || task.createdAt);
        return createdDate >= weekStart && createdDate < weekEnd;
      }).length;
      
      // Count tasks completed in this week
      const completed = tasks.filter((task: any) => {
        const statusName = typeof task.status === 'object' ? task.status?.name : task.status;
        const isCompleted = statusName?.toLowerCase().includes('completed') || statusName?.toLowerCase().includes('done');
        if (!isCompleted) return false;
        
        const completedDate = new Date(task.updateAt || task.updatedAt);
        return completedDate >= weekStart && completedDate < weekEnd;
      }).length;
      
      data.push({
        week: weekIndex === 0 ? 'This Week' : `${4 - weekIndex} weeks ago`,
        committed: committed,
        completed: completed,
      });
    }
    
    return data;
  }, [tasks]);

  // Time Tracking Summary
  const timeTrackingData = useMemo(() => {
    let totalEstimate = 0;
    let totalActual = 0;
    tasks.forEach((task: any) => {
      totalEstimate += task.estimate || 0;
      totalActual += task.actual || 0;
    });
    return {
      estimated: totalEstimate,
      logged: totalActual,
      remaining: Math.max(0, totalEstimate - totalActual),
      efficiency: totalEstimate > 0 ? Math.round((totalActual / totalEstimate) * 100) : 0
    };
  }, [tasks]);

  // Workload Distribution
  const workloadData = useMemo(() => {
    const workloadMap = new Map();
    tasks.forEach((task: any) => {
      if (task.assignee_id?._id) {
        const userId = task.assignee_id._id;
        if (!workloadMap.has(userId)) {
          workloadMap.set(userId, {
            name: task.assignee_id.full_name || task.assignee_id.email,
            tasks: 0,
            hours: 0,
          });
        }
        const member = workloadMap.get(userId);
        member.tasks++;
        member.hours += (task.estimate || 0);
      }
    });
    return Array.from(workloadMap.values()).sort((a, b) => b.hours - a.hours).slice(0, 8);
  }, [tasks]);

  // Priority Breakdown with status
  const priorityBreakdownData = useMemo(() => {
    const breakdown: any = {};
    tasks.forEach((task: any) => {
      const priority = task.priority?.name || 'No Priority';
      if (!breakdown[priority]) {
        breakdown[priority] = { total: 0, completed: 0, inProgress: 0, pending: 0 };
      }
      breakdown[priority].total++;
      const statusName = typeof task.status === 'object' ? task.status?.name : task.status;
      if (statusName?.toLowerCase().includes('completed') || statusName?.toLowerCase().includes('done')) {
        breakdown[priority].completed++;
      } else if (statusName?.toLowerCase().includes('progress')) {
        breakdown[priority].inProgress++;
      } else {
        breakdown[priority].pending++;
      }
    });
    return Object.entries(breakdown).map(([name, data]: [string, any]) => ({
      priority: name,
      ...data,
    }));
  }, [tasks]);

  // Bug Statistics
  const bugStats = useMemo(() => {
    const total = bugs.length;
    const open = bugs.filter((b: any) => b.status === 'Open').length;
    const inProgress = bugs.filter((b: any) => b.status === 'In Progress').length;
    const resolved = bugs.filter((b: any) => b.status === 'Resolved').length;
    const closed = bugs.filter((b: any) => b.status === 'Closed').length;
    const critical = bugs.filter((b: any) => b.severity === 'Critical').length;
    const high = bugs.filter((b: any) => b.severity === 'High').length;
    
    return {
      total,
      open,
      inProgress,
      resolved,
      closed,
      critical,
      high,
      criticalAndHigh: critical + high,
    };
  }, [bugs]);

  const statCards = [
    { 
      title: 'Total Tasks', 
      value: stats?.total || 0, 
      subtitle: `${stats?.completion_rate || 0}% Complete`,
      icon: <Assignment sx={{ fontSize: { xs: 24, sm: 28 } }} />,
      bgGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    { 
      title: 'Completed', 
      value: stats?.completed || 0,
      subtitle: `${stats?.total ? Math.round((stats.completed / stats.total) * 100) : 0}% Done`,
      icon: <CheckCircle sx={{ fontSize: { xs: 24, sm: 28 } }} />,
      bgGradient: 'linear-gradient(135deg, #0BA360 0%, #3CBA92 100%)',
    },
    { 
      title: 'In Progress', 
      value: stats?.in_progress || 0,
      subtitle: 'Active Now',
      icon: <Schedule sx={{ fontSize: { xs: 24, sm: 28 } }} />,
      bgGradient: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
    },
    { 
      title: 'At Risk', 
      value: atRiskTasks.length + (stats?.overdue || 0),
      subtitle: 'Need Attention',
      icon: <Warning sx={{ fontSize: { xs: 24, sm: 28 } }} />,
      bgGradient: 'linear-gradient(135deg, #D31027 0%, #EA384D 100%)',
    },
    { 
      title: 'Total Bugs', 
      value: bugStats.total,
      subtitle: `${bugStats.open} Open • ${bugStats.resolved} Resolved`,
      icon: <BugReport sx={{ fontSize: { xs: 24, sm: 28 } }} />,
      bgGradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
    },
    { 
      title: 'Critical Issues', 
      value: bugStats.criticalAndHigh,
      subtitle: `${bugStats.critical} Critical • ${bugStats.high} High`,
      icon: <ErrorOutline sx={{ fontSize: { xs: 24, sm: 28 } }} />,
      bgGradient: 'linear-gradient(135deg, #C94B4B 0%, #4B134F 100%)',
    },
  ];

  // Bug Status Distribution
  const bugStatusData = useMemo(() => {
    if (bugs.length === 0) return [];
    const statusColors: any = {
      'Open': '#0095FF',
      'In Progress': '#FFAA00',
      'Resolved': '#00D68F',
      'Closed': '#8E8E93',
      'Reopened': '#FF3D71',
    };
    
    return [
      { name: 'Open', value: bugStats.open, color: statusColors['Open'] },
      { name: 'In Progress', value: bugStats.inProgress, color: statusColors['In Progress'] },
      { name: 'Resolved', value: bugStats.resolved, color: statusColors['Resolved'] },
      { name: 'Closed', value: bugStats.closed, color: statusColors['Closed'] },
    ].filter(item => item.value > 0);
  }, [bugs, bugStats]);

  // Bug Severity Breakdown
  const bugSeverityData = useMemo(() => {
    if (bugs.length === 0) return [];
    const severityColors: any = {
      'Critical': '#D31027',
      'High': '#FF6B35',
      'Medium': '#FFAA00',
      'Low': '#4CAF50',
    };
    
    const critical = bugs.filter((b: any) => b.severity === 'Critical').length;
    const high = bugs.filter((b: any) => b.severity === 'High').length;
    const medium = bugs.filter((b: any) => b.severity === 'Medium').length;
    const low = bugs.filter((b: any) => b.severity === 'Low').length;
    
    return [
      { name: 'Critical', value: critical, color: severityColors['Critical'] },
      { name: 'High', value: high, color: severityColors['High'] },
      { name: 'Medium', value: medium, color: severityColors['Medium'] },
      { name: 'Low', value: low, color: severityColors['Low'] },
    ].filter(item => item.value > 0);
  }, [bugs]);

  // Bug Trends over last 7 days
  const bugTrendsData = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const dataMap = new Map();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayKey = date.toISOString().split('T')[0];
      dataMap.set(dayKey, {
        day: dayNames[date.getDay()],
        reported: 0,
        resolved: 0,
      });
    }

    bugs.forEach((bug: any) => {
      // Count reported bugs
      if (bug.createAt || bug.createdAt) {
        const createdDate = new Date(bug.createAt || bug.createdAt);
        if (createdDate >= sevenDaysAgo) {
          const dayKey = createdDate.toISOString().split('T')[0];
          if (dataMap.has(dayKey)) {
            dataMap.get(dayKey).reported++;
          }
        }
      }

      // Count resolved bugs
      if (bug.status === 'Resolved' || bug.status === 'Closed') {
        if (bug.updateAt || bug.updatedAt) {
          const resolvedDate = new Date(bug.updateAt || bug.updatedAt);
          if (resolvedDate >= sevenDaysAgo) {
            const dayKey = resolvedDate.toISOString().split('T')[0];
            if (dataMap.has(dayKey)) {
              dataMap.get(dayKey).resolved++;
            }
          }
        }
      }
    });

    return Array.from(dataMap.values());
  }, [bugs]);

  // Critical and High Severity Bugs List
  const criticalBugsList = useMemo(() => {
    return bugs
      .filter((b: any) => b.severity === 'Critical' || b.severity === 'High')
      .filter((b: any) => b.status !== 'Closed' && b.status !== 'Resolved')
      .sort((a: any, b: any) => {
        // Sort by severity (Critical first) then by date
        if (a.severity === 'Critical' && b.severity !== 'Critical') return -1;
        if (a.severity !== 'Critical' && b.severity === 'Critical') return 1;
        return new Date(b.createAt || b.createdAt).getTime() - new Date(a.createAt || a.createdAt).getTime();
      })
      .slice(0, 5);
  }, [bugs]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#F7F9FC' }}>
        <ResponsiveSidebar />
        <Box sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginLeft: { xs: 0, md: '256px' }, // Tránh sidebar trên desktop
        }}>
          <Stack alignItems="center" spacing={2}>
            <CircularProgress size={50} thickness={4} sx={{ color: COLORS.primary }} />
            <Typography variant="body2" color="text.secondary">Loading dashboard...</Typography>
          </Stack>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F7F9FC' }}>
      <ResponsiveSidebar />
      
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto',
        marginLeft: { xs: 0, md: '256px' }, // Tránh sidebar trên desktop
      }}>
        {/* Header */}
        <Box sx={{ 
          bgcolor: 'white',
          borderBottom: '1px solid',
          borderColor: 'divider',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <Box sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
              <IconButton 
                onClick={() => router.push(`/projects/${projectId}/tasks`)}
                size="small"
                sx={{ 
                  bgcolor: 'action.hover',
                  '&:hover': { bgcolor: 'action.selected' }
                }}
              >
                <ChevronLeft fontSize="small" />
              </IconButton>
              
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.25, fontSize: { xs: '18px', sm: '20px' } }}>
                  📊 Analytics Dashboard
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px' }}>
                  Real-time insights
                </Typography>
              </Box>

              <Stack direction="row" spacing={1}>
                <Button
                  startIcon={<Refresh sx={{ fontSize: 16 }} />}
                  onClick={handleRefresh}
                  disabled={refreshing}
                  variant="outlined"
                  size="small"
                  sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: '12px', px: 1.5, py: 0.5 }}
                >
                  Refresh
                </Button>
                <Button
                  startIcon={<ViewList sx={{ fontSize: 16 }} />}
                  variant="contained"
                  size="small"
                  onClick={() => router.push(`/projects/${projectId}/tasks`)}
                  sx={{ 
                    textTransform: 'none', 
                    borderRadius: 1.5,
                    fontSize: '12px',
                    px: 1.5,
                    py: 0.5,
                    bgcolor: '#7b68ee',
                    '&:hover': { bgcolor: '#6952cc' }
                  }}
                >
                  Tasks
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Box>

        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 3, sm: 4 } }}>
          {/* Stats Cards */}
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            },
            gap: { xs: 2.5, sm: 3, md: 4 },
            mb: { xs: 4, sm: 5, md: 6 },
          }}>
            {statCards.map((stat, idx) => (
              <Card
                key={idx}
                sx={{
                  background: stat.bgGradient,
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 3,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: { xs: '80px', sm: '100px' },
                    height: { xs: '80px', sm: '100px' },
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '50%',
                    transform: 'translate(30px, -30px)',
                  }
                }}
              >
                <CardContent sx={{ position: 'relative', zIndex: 1, p: { xs: 2.5, sm: 3 } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.9, mb: 0.5, fontWeight: 500, fontSize: '11px' }}>
                        {stat.title}
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.75, fontSize: { xs: '24px', sm: '28px' } }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '10px' }}>
                        {stat.subtitle}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: { xs: 44, sm: 48 },
                        height: { xs: 44, sm: 48 },
                        borderRadius: 1.5,
                        bgcolor: 'rgba(255, 255, 255, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      {stat.icon}
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Charts Section */}
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              lg: 'repeat(2, 1fr)',
            },
            gap: { xs: 2.5, sm: 3, md: 4 },
            mb: { xs: 3, sm: 4, md: 5 },
          }}>
            {/* Activity Chart */}
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.25, fontSize: { xs: '14px', sm: '16px' } }}>
                      Weekly Activity
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                      Completion vs creation
                    </Typography>
                  </Box>
                  <Chip label="7 days" size="small" variant="outlined" sx={{ fontSize: '10px', height: 22 }} />
                </Stack>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={weekData}>
                    <defs>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={COLORS.success} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.info} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={COLORS.info} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: '11px' }} />
                    <Legend />
                    <Area type="monotone" dataKey="completed" stroke={COLORS.success} strokeWidth={2.5} fillOpacity={1} fill="url(#colorCompleted)" name="Completed" />
                    <Area type="monotone" dataKey="created" stroke={COLORS.info} strokeWidth={2.5} fillOpacity={1} fill="url(#colorCreated)" name="Created" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Donut Chart */}
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '14px', sm: '16px' } }}>
                  Status Overview
                </Typography>
                {chartData.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Assignment sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
                    <Typography variant="body2" color="text.secondary" fontSize="13px" fontWeight={500}>
                      No tasks yet
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontSize="11px">
                      Start creating tasks to see status overview
                    </Typography>
                  </Box>
                ) : (
                  <>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={chartData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value">
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Stack spacing={1.5}>
                  {chartData.map((item, idx) => (
                    <Stack key={idx} direction="row" alignItems="center" justifyContent="space-between">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: item.color, boxShadow: `0 2px 6px ${item.color}40` }} />
                        <Typography variant="caption" fontWeight={500} sx={{ fontSize: '11px' }}>{item.name}</Typography>
                      </Stack>
                      <Typography variant="body2" fontWeight={700} sx={{ fontSize: '14px' }}>{item.value}</Typography>
                    </Stack>
                  ))}
                </Stack>
                  </>
                )}
              </CardContent>
            </Card>
          </Box>

          {/* Burndown & Velocity Section */}
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              lg: 'repeat(2, 1fr)',
            },
            gap: { xs: 2.5, sm: 3, md: 4 },
            mb: { xs: 3, sm: 4, md: 5 },
          }}>
            {/* Burndown Chart */}
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <Timeline sx={{ fontSize: 20, color: COLORS.primary }} />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: { xs: '14px', sm: '16px' } }}>
                      Burndown Chart
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                      Sprint Progress
                    </Typography>
                  </Box>
                </Stack>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={burndownData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: '11px' }} />
                    <Legend />
                    <Line type="monotone" dataKey="ideal" stroke={COLORS.warning} strokeWidth={2} strokeDasharray="5 5" name="Ideal" />
                    <Line type="monotone" dataKey="actual" stroke={COLORS.primary} strokeWidth={2.5} name="Actual" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Velocity Chart */}
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <Speed sx={{ fontSize: 20, color: COLORS.success }} />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: { xs: '14px', sm: '16px' } }}>
                      Velocity Chart
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                      Completed vs Committed
                    </Typography>
                  </Box>
                </Stack>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={velocityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: '11px' }} />
                    <Legend />
                    <Bar dataKey="committed" fill={COLORS.warning} radius={[4, 4, 0, 0]} name="Committed" />
                    <Bar dataKey="completed" fill={COLORS.success} radius={[4, 4, 0, 0]} name="Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Box>

          {/* Time Tracking & Blocked Tasks */}
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              lg: 'repeat(2, 1fr)',
            },
            gap: { xs: 2.5, sm: 3, md: 4 },
            mb: { xs: 3, sm: 4, md: 5 },
          }}>
            {/* Time Tracking Summary */}
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <AccessTime sx={{ fontSize: 20, color: COLORS.info }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: { xs: '14px', sm: '16px' } }}>
                    Time Tracking
                  </Typography>
                </Stack>
                <Stack spacing={2}>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="body2" fontSize="12px" color="text.secondary">Estimated</Typography>
                      <Typography variant="body2" fontSize="12px" fontWeight={600}>{timeTrackingData.estimated.toFixed(0)}h</Typography>
                    </Stack>
                    <LinearProgress 
                      variant="determinate" 
                      value={100} 
                      sx={{ height: 8, borderRadius: 4, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: COLORS.info, borderRadius: 4 } }} 
                    />
                  </Box>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="body2" fontSize="12px" color="text.secondary">Logged</Typography>
                      <Typography variant="body2" fontSize="12px" fontWeight={600}>{timeTrackingData.logged.toFixed(0)}h</Typography>
                    </Stack>
                    <LinearProgress 
                      variant="determinate" 
                      value={timeTrackingData.efficiency} 
                      sx={{ height: 8, borderRadius: 4, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: COLORS.success, borderRadius: 4 } }} 
                    />
                  </Box>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="body2" fontSize="12px" color="text.secondary">Remaining</Typography>
                      <Typography variant="body2" fontSize="12px" fontWeight={600}>{timeTrackingData.remaining.toFixed(0)}h</Typography>
                    </Stack>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min(100, (timeTrackingData.remaining / timeTrackingData.estimated) * 100)} 
                      sx={{ height: 8, borderRadius: 4, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: COLORS.warning, borderRadius: 4 } }} 
                    />
                  </Box>
                  <Divider />
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" fontSize="13px" fontWeight={600}>Efficiency</Typography>
                    <Chip 
                      label={`${timeTrackingData.efficiency}%`} 
                      size="small"
                      sx={{ 
                        bgcolor: timeTrackingData.efficiency > 100 ? COLORS.danger : timeTrackingData.efficiency >= 80 ? COLORS.success : COLORS.warning,
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '11px'
                      }}
                    />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Blocked & At Risk Tasks */}
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <Warning sx={{ fontSize: 20, color: COLORS.danger }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: { xs: '14px', sm: '16px' } }}>
                    Tasks Needing Attention
                  </Typography>
                </Stack>
                <List dense sx={{ maxHeight: 240, overflow: 'auto' }}>
                  {atRiskTasks.length === 0 && blockedTasks.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <CheckCircle sx={{ fontSize: 48, color: COLORS.success, mb: 1 }} />
                      <Typography variant="body2" color="text.secondary" fontSize="12px">
                        All tasks are on track! 🎉
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      {atRiskTasks.map((task: any, idx: number) => (
                        <ListItem 
                          key={`risk-${idx}`}
                          sx={{ 
                            borderRadius: 1, 
                            mb: 0.5,
                            bgcolor: 'error.lighter',
                            '&:hover': { bgcolor: 'error.light' }
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: COLORS.danger }}>
                              <CalendarToday sx={{ fontSize: 16 }} />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText 
                            primary={
                              <Typography variant="body2" fontSize="12px" fontWeight={600} noWrap>
                                {task.title}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" fontSize="10px" color="text.secondary">
                                Due: {new Date(task.deadline).toLocaleDateString()}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                      {blockedTasks.map((task: any, idx: number) => (
                        <ListItem 
                          key={`blocked-${idx}`}
                          sx={{ 
                            borderRadius: 1, 
                            mb: 0.5,
                            bgcolor: 'action.hover',
                            '&:hover': { bgcolor: 'action.selected' }
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: COLORS.warning }}>
                              <Block sx={{ fontSize: 16 }} />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText 
                            primary={
                              <Typography variant="body2" fontSize="12px" fontWeight={600} noWrap>
                                {task.title}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" fontSize="10px" color="text.secondary">
                                Status: {typeof task.status === 'object' ? task.status?.name : task.status}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </>
                  )}
                </List>
              </CardContent>
            </Card>
          </Box>

          {/* Bottom Section */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, gap: { xs: 2.5, sm: 3, md: 4 }, mb: { xs: 3, sm: 4, md: 5 } }}>
            {/* Priority Chart */}
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '14px', sm: '16px' } }}>
                  Priority Levels
                </Typography>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={priorityData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: '11px' }} />
                    <Bar dataKey="value" fill={COLORS.primary} radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Team Performance */}
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: { xs: '14px', sm: '16px' } }}>
                    Top Contributors
                  </Typography>
                  <Chip icon={<Group sx={{ fontSize: 14 }} />} label={`${teamData.length}`} size="small" variant="outlined" sx={{ fontSize: '10px', height: 22 }} />
                </Stack>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: { xs: 1.5, sm: 2 } }}>
                  {teamData.map((member, idx) => (
                    <Paper
                      key={idx}
                      elevation={0}
                      sx={{
                        p: { xs: 1.5, sm: 2 },
                        border: '1.5px solid',
                        borderColor: idx === 0 ? COLORS.primary : 'divider',
                        borderRadius: 2,
                        transition: 'all 0.3s',
                        bgcolor: idx === 0 ? `${COLORS.primary}05` : 'transparent',
                        '&:hover': {
                          borderColor: COLORS.primary,
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(91, 71, 251, 0.12)',
                        }
                      }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar 
                          src={member.avatar} 
                          sx={{ 
                            width: { xs: 40, sm: 44 }, 
                            height: { xs: 40, sm: 44 }, 
                            bgcolor: member.isLeader ? COLORS.warning : COLORS.primary, 
                            fontWeight: 700, 
                            fontSize: { xs: 16, sm: 18 }, 
                            boxShadow: '0 2px 8px rgba(91, 71, 251, 0.2)',
                            border: member.isLeader ? '2px solid' : 'none',
                            borderColor: COLORS.warning
                          }}
                        >
                          {member.name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: { xs: '12px', sm: '13px' } }}>
                              {member.name}
                            </Typography>
                            {member.isLeader && (
                              <Chip label="Leader" size="small" sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: COLORS.warning, color: 'white' }} />
                            )}
                            {idx === 0 && !member.isLeader && (
                              <Chip label="🏆 Top" size="small" sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: COLORS.success, color: 'white' }} />
                            )}
                          </Stack>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontSize: '10px' }}>
                            {member.total > 0 ? `${member.completed}/${member.total} tasks • ${member.rate}%` : 'No tasks assigned'}
                          </Typography>
                          {member.total > 0 && (
                            <LinearProgress variant="determinate" value={member.rate} sx={{ height: 6, borderRadius: 3, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: member.isLeader ? COLORS.warning : COLORS.primary, borderRadius: 3 } }} />
                          )}
                        </Box>
                      </Stack>
                    </Paper>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Workload Distribution & Recent Activities */}
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              lg: 'repeat(2, 1fr)',
            },
            gap: { xs: 2.5, sm: 3, md: 4 },
            mb: { xs: 3, sm: 4, md: 5 },
          }}>
            {/* Workload Distribution */}
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <AccountTree sx={{ fontSize: 20, color: COLORS.primary }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: { xs: '14px', sm: '16px' } }}>
                    Workload Distribution
                  </Typography>
                </Stack>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={workloadData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: '11px' }} />
                    <Bar dataKey="hours" fill={COLORS.info} radius={[0, 6, 6, 0]} name="Hours" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <Timeline sx={{ fontSize: 20, color: COLORS.success }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: { xs: '14px', sm: '16px' } }}>
                    Recent Activities
                  </Typography>
                </Stack>
                <List dense sx={{ maxHeight: 240, overflow: 'auto' }}>
                  {activities.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary" fontSize="12px">
                        No recent activities
                      </Typography>
                    </Box>
                  ) : (
                    activities.map((activity: any) => (
                      <ListItem key={activity.id} sx={{ px: 1, py: 0.5 }}>
                        <ListItemAvatar>
                          <Avatar 
                            sx={{ 
                              width: 32, 
                              height: 32, 
                              bgcolor: activity.type === 'status_change' ? COLORS.info : 
                                       activity.type === 'assignment' ? COLORS.success : 
                                       COLORS.warning,
                              fontSize: 14
                            }}
                          >
                            {activity.user?.charAt(0).toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={
                            <Typography variant="body2" fontSize="11px" fontWeight={500}>
                              <strong>{activity.user}</strong> {activity.type === 'status_change' ? 'changed status of' : 
                                                                 activity.type === 'assignment' ? 'was assigned to' : 
                                                                 'commented on'} <strong>{activity.task_title}</strong>
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" fontSize="10px" color="text.secondary">
                              {new Date(activity.timestamp).toLocaleString()}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))
                  )}
                </List>
              </CardContent>
            </Card>
          </Box>

          {/* Bug Tracking Section */}
          <Box sx={{ mb: { xs: 3, sm: 4, md: 5 } }}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
              <BugReport sx={{ fontSize: 24, color: '#FF3D71' }} />
              <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: '18px', sm: '20px' } }}>
                Bug Tracking
              </Typography>
            </Stack>

            {/* Bug Charts Row 1: Status & Severity */}
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                lg: 'repeat(2, 1fr)',
              },
              gap: { xs: 2.5, sm: 3, md: 4 },
              mb: { xs: 2.5, sm: 3, md: 4 },
            }}>
              {/* Bug Status Distribution */}
              <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: { xs: '14px', sm: '16px' }, mb: 2 }}>
                    Bug Status Distribution
                  </Typography>
                  {bugStatusData.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <BugReport sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
                      <Typography variant="body2" color="text.secondary" fontSize="13px" fontWeight={500}>
                        No bugs reported
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontSize="11px">
                        Great! Your project has no bugs yet
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <ResponsiveContainer width="50%" height={200}>
                        <PieChart>
                          <Pie
                            data={bugStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {bugStatusData.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              borderRadius: 8, 
                              border: 'none', 
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
                              fontSize: '11px' 
                            }} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <Stack spacing={1.5} sx={{ flex: 1 }}>
                        {bugStatusData.map((item: any, idx: number) => (
                          <Stack key={idx} direction="row" alignItems="center" spacing={1.5}>
                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.color, flexShrink: 0 }} />
                            <Typography variant="body2" sx={{ fontSize: { xs: '11px', sm: '12px' }, flexGrow: 1 }}>
                              {item.name}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: { xs: '11px', sm: '12px' } }}>
                              {item.value}
                            </Typography>
                          </Stack>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Bug Severity Breakdown */}
              <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: { xs: '14px', sm: '16px' }, mb: 2 }}>
                    Bug Severity Breakdown
                  </Typography>
                  {bugSeverityData.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <ErrorOutline sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
                      <Typography variant="body2" color="text.secondary" fontSize="13px" fontWeight={500}>
                        No bugs to analyze
                      </Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={bugSeverityData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: 8, 
                            border: 'none', 
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
                            fontSize: '11px' 
                          }} 
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                          {bugSeverityData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Box>

            {/* Bug Charts Row 2: Trends & Critical List */}
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                lg: '2fr 1fr',
              },
              gap: { xs: 2.5, sm: 3, md: 4 },
            }}>
              {/* Bug Trends */}
              <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: { xs: '14px', sm: '16px' }, mb: 2 }}>
                    Bug Trends (Last 7 Days)
                  </Typography>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={bugTrendsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: 8, 
                          border: 'none', 
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
                          fontSize: '11px' 
                        }} 
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line 
                        type="monotone" 
                        dataKey="reported" 
                        stroke="#FF3D71" 
                        strokeWidth={2} 
                        name="Reported" 
                        dot={{ r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="resolved" 
                        stroke="#00D68F" 
                        strokeWidth={2} 
                        name="Resolved" 
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Critical & High Severity Bugs */}
              <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <ErrorOutline sx={{ fontSize: 20, color: '#D31027' }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: { xs: '14px', sm: '16px' } }}>
                      Critical Issues
                    </Typography>
                  </Stack>
                  {criticalBugsList.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <CheckCircle sx={{ fontSize: 48, color: COLORS.success, mb: 1 }} />
                      <Typography variant="body2" color="text.secondary" fontSize="12px">
                        No critical bugs!
                      </Typography>
                    </Box>
                  ) : (
                    <List dense sx={{ maxHeight: 220, overflow: 'auto' }}>
                      {criticalBugsList.map((bug: any, idx: number) => (
                        <ListItem 
                          key={idx}
                          sx={{ 
                            px: 1.5, 
                            py: 1, 
                            mb: 1, 
                            borderRadius: 1.5, 
                            bgcolor: '#FFF5F5',
                            border: '1px solid',
                            borderColor: bug.severity === 'Critical' ? '#D31027' : '#FF6B35',
                          }}
                        >
                          <Stack spacing={0.5} sx={{ width: '100%' }}>
                            <Stack direction="row" alignItems="center" spacing={0.75}>
                              <Chip 
                                label={bug.severity} 
                                size="small"
                                sx={{ 
                                  height: 18, 
                                  fontSize: '10px', 
                                  fontWeight: 700,
                                  bgcolor: bug.severity === 'Critical' ? '#D31027' : '#FF6B35',
                                  color: 'white',
                                }}
                              />
                              <Typography variant="body2" sx={{ fontSize: '11px', fontWeight: 600, flex: 1 }}>
                                {bug.title}
                              </Typography>
                            </Stack>
                            <Typography variant="caption" sx={{ fontSize: '10px', color: 'text.secondary' }}>
                              {bug.status} • {new Date(bug.createAt || bug.createdAt).toLocaleDateString()}
                            </Typography>
                          </Stack>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* Footer */}
          <Box sx={{ mt: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 }, textAlign: 'center' }}>
            <Stack direction="row" justifyContent="center" alignItems="center" spacing={2} flexWrap="wrap">
              <Chip 
                icon={<CheckCircle sx={{ fontSize: 14 }} />}
                label={`${stats?.completion_rate || 0}% Complete`}
                size="small"
                sx={{ bgcolor: COLORS.success, color: 'white', fontWeight: 600 }}
              />
              <Chip 
                icon={<AccessTime sx={{ fontSize: 14 }} />}
                label={`${timeTrackingData.logged.toFixed(0)}h Logged`}
                size="small"
                variant="outlined"
              />
              <Chip 
                icon={<Group sx={{ fontSize: 14 }} />}
                label={`${teamData.length} Contributors`}
                size="small"
                variant="outlined"
              />
              <Chip 
                icon={<BugReport sx={{ fontSize: 14 }} />}
                label={`${bugStats.total} Bugs (${bugStats.resolved} Resolved)`}
                size="small"
                variant="outlined"
                sx={{ 
                  borderColor: bugStats.criticalAndHigh > 0 ? '#FF3D71' : undefined,
                  color: bugStats.criticalAndHigh > 0 ? '#FF3D71' : undefined,
                }}
              />
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px', mt: 1, display: 'block' }}>
              Last updated: {new Date().toLocaleString()}
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

