"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "../../../../../ultis/axios";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";
import TaskDetailsModal from "@/components/TaskDetailsModal";
import DependencyNetworkGraph from "@/components/DependencyNetworkGraph";
import dynamic from 'next/dynamic';

const ClickUpGanttChart = dynamic(
  () => import('@/components/ClickUpGanttChart'),
  { ssr: false }
);

const DHtmlxGanttChart = dynamic(
  () => import('@/components/DHtmlxGanttChart'),
  { ssr: false }
);
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
    Avatar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
  import FlagIcon from "@mui/icons-material/Flag";
  import TuneIcon from "@mui/icons-material/Tune";
  import GroupWorkIcon from "@mui/icons-material/GroupWork";
  import ViewColumnIcon from "@mui/icons-material/ViewColumn";
  import ListIcon from "@mui/icons-material/List";
  import ViewKanbanIcon from "@mui/icons-material/ViewKanban";
  import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
  import DashboardIcon from "@mui/icons-material/Dashboard";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PersonIcon from "@mui/icons-material/Person";
import LinkIcon from "@mui/icons-material/Link";
import BlockIcon from "@mui/icons-material/Block";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

type Task = {
  _id: string;
  title: string;
  description?: string;
  project_id: string;
  feature_id?: string | { _id: string; title: string };
  milestone_id?: string | { _id: string; title: string };
  status?: string | { _id: string; name: string };
  priority?: string | { _id: string; name: string };
  assignee?: string | { _id: string; name: string; email?: string };
  assignee_id?: string | { _id: string; full_name?: string; name?: string; email?: string };
  assigner_id?: string | { _id: string; full_name?: string; name?: string; email?: string };
  start_date?: string;
  deadline?: string;
  progress?: number;
  estimate?: number;
  actual?: number;
  parent_task_id?: string;
  createdAt?: string;
  updatedAt?: string;
};

type TaskStats = {
  total: number;
  by_status?: Record<string, number>;
  by_priority?: Record<string, number>;
};

export default function ProjectTasksPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);

  const [view, setView] = useState<"table" | "kanban" | "timeline" | "calendar" | "gantt" | "network">("table");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dependency violation dialog
  const [dependencyViolationDialog, setDependencyViolationDialog] = useState<{
    open: boolean;
    violations: any[];
    taskId: string;
    newStatus: string;
  }>({
    open: false,
    violations: [],
    taskId: '',
    newStatus: ''
  });
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // filters/sort/search
  const [search, setSearch] = useState("");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterFeature, setFilterFeature] = useState<string>("all");
  const [filterMilestone, setFilterMilestone] = useState<string>("all");
  const [filterDateRange, setFilterDateRange] = useState<{ from?: string; to?: string }>({});
  const [sortBy, setSortBy] = useState<string>("deadline:asc");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  
  // task details modal
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [openTaskDetails, setOpenTaskDetails] = useState(false);
  
  // inline editing
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  
  // dependencies
  const [taskDependencies, setTaskDependencies] = useState<Record<string, any>>({});
  const [openDependencyDialog, setOpenDependencyDialog] = useState(false);
  const [dependencyTaskId, setDependencyTaskId] = useState<string | null>(null);
  const [dependencyForm, setDependencyForm] = useState({
    depends_on_task_id: '',
    dependency_type: 'FS',
    lag_days: 0
  });

  // subtasks
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [taskSubtasks, setTaskSubtasks] = useState<Record<string, any[]>>({});

  // calendar view state
  const [calendarDate, setCalendarDate] = useState(new Date());

  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "",
    priority: "",
    assignee: "",
    feature_id: "",
    milestone_id: "",
    start_date: "",
    deadline: "",
    estimate: 0,
  });

  useEffect(() => {
    if (!projectId) return;
    loadAll();
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    loadTeamMembers();
  }, [projectId]);

  // Extract team members from tasks if no team members loaded
  useEffect(() => {
    if (teamMembers.length === 0 && tasks.length > 0) {
      const uniqueUsers = new Map();
      
      tasks.forEach(task => {
        // Add assignee
        if (task.assignee_id && typeof task.assignee_id === 'object') {
          uniqueUsers.set(task.assignee_id._id, {
            user_id: task.assignee_id,
          });
        }
        // Add assigner
        if (task.assigner_id && typeof task.assigner_id === 'object') {
          uniqueUsers.set(task.assigner_id._id, {
            user_id: task.assigner_id,
          });
        }
      });
      
      const extractedMembers = Array.from(uniqueUsers.values());
      if (extractedMembers.length > 0) {
        console.log("Extracted team members from tasks:", extractedMembers);
        setTeamMembers(extractedMembers);
      }
    }
  }, [tasks, teamMembers.length]);

  // Load dependencies for visible tasks
  useEffect(() => {
    if (tasks.length > 0) {
      tasks.forEach(task => {
        if (!taskDependencies[task._id]) {
          loadTaskDependencies(task._id);
        }
      });
    }
  }, [tasks]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadTeamMembers = async () => {
    try {
      const response = await axiosInstance.get(`/api/projects/${projectId}/team-members`);
      console.log("Team members response:", response.data);
      
      // API trả về { team_members: { leaders: [], members: [] } }
      const teamData = response.data?.team_members;
      if (teamData) {
        const allMembers = [...(teamData.leaders || []), ...(teamData.members || [])];
        console.log("All team members:", allMembers);
        setTeamMembers(allMembers);
      } else {
        setTeamMembers([]);
      }
    } catch (e: any) {
      console.error("Error loading team members:", e);
      // Fallback: extract assignees from existing tasks
      const uniqueAssignees = tasks
        .filter(t => t.assignee_id)
        .map(t => ({
          user_id: typeof t.assignee_id === 'object' ? {
            _id: t.assignee_id._id,
            full_name: t.assignee_id.full_name || t.assignee_id.name,
            email: t.assignee_id.email,
          } : { _id: t.assignee_id, full_name: 'User' },
        }))
        .filter((v, i, a) => a.findIndex(t => t.user_id._id === v.user_id._id) === i);
      setTeamMembers(uniqueAssignees);
    }
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      const params: any = {
        q: debouncedSearch || undefined,
        assignee_id: filterAssignee !== 'all' ? filterAssignee : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        priority: filterPriority !== 'all' ? filterPriority : undefined,
        feature_id: filterFeature !== 'all' ? filterFeature : undefined,
        milestone_id: filterMilestone !== 'all' ? filterMilestone : undefined,
        from: filterDateRange.from || undefined,
        to: filterDateRange.to || undefined,
        sortBy,
        page,
        pageSize,
      };
      const [tasksRes, statsRes] = await Promise.all([
        axiosInstance.get(`/api/projects/${projectId}/tasks`, { params }),
        axiosInstance.get(`/api/projects/${projectId}/tasks/stats`).catch(() => ({ data: null })),
      ]);

      const raw = tasksRes?.data;
      const normalized: Task[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.tasks)
            ? raw.tasks
            : [];

      // Separate parent tasks and subtasks
      const parentTasks = normalized.filter(task => !task.parent_task_id);
      const allSubtasks = normalized.filter(task => task.parent_task_id);
      
      // Group subtasks by parent task ID
      const subtasksByParent: Record<string, Task[]> = {};
      allSubtasks.forEach(subtask => {
        if (subtask.parent_task_id) {
          if (!subtasksByParent[subtask.parent_task_id]) {
            subtasksByParent[subtask.parent_task_id] = [];
          }
          subtasksByParent[subtask.parent_task_id].push(subtask);
        }
      });
      
      // Update subtasks state
      setTaskSubtasks(subtasksByParent);
      
      // Only show parent tasks in main list
      setTasks(parentTasks);
      setStats(statsRes?.data || null);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Không thể tải danh sách tasks");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      title: "",
      description: "",
      status: "",
      priority: "",
      assignee: "",
      feature_id: "",
      milestone_id: "",
      start_date: "",
      deadline: "",
      estimate: 0,
    });
    setOpenDialog(true);
  };

  const openEdit = (t: Task) => {
    setEditing(t);
    setForm({
      title: t.title,
      description: t.description || "",
      status: typeof t.status === "object" ? (t.status as any)?._id : (t.status as any) || "",
      priority: typeof t.priority === "object" ? (t.priority as any)?._id : (t.priority as any) || "",
      assignee: typeof t.assignee === "object" ? (t.assignee as any)?._id : (t.assignee as any) || "",
      feature_id: typeof t.feature_id === "object" ? (t.feature_id as any)?._id : (t.feature_id as any) || "",
      milestone_id: typeof t.milestone_id === "object" ? (t.milestone_id as any)?._id : (t.milestone_id as any) || "",
      start_date: t.start_date ? new Date(t.start_date).toISOString().split("T")[0] : "",
      deadline: t.deadline ? new Date(t.deadline).toISOString().split("T")[0] : "",
      estimate: t.estimate || 0,
    });
    setOpenDialog(true);
  };
  
  const openTaskDetailsModal = (taskId: string) => {
    setSelectedTaskId(taskId);
    setOpenTaskDetails(true);
  };

  const saveTask = async () => {
    try {
      const payload = {
        ...form,
        estimate: Number(form.estimate),
        assignee: form.assignee || undefined,
        feature_id: form.feature_id || undefined,
        milestone_id: form.milestone_id || undefined,
        start_date: form.start_date || undefined,
        deadline: form.deadline || undefined,
        status: form.status || undefined,
        priority: form.priority || undefined,
      };

      if (editing) {
        await axiosInstance.patch(`/api/tasks/${editing._id}`, payload);
      } else {
        await axiosInstance.post(`/api/projects/${projectId}/tasks`, payload);
      }
      setOpenDialog(false);
      await loadAll();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Không thể lưu task");
    }
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Xóa task này?")) return;
    try {
      await axiosInstance.delete(`/api/tasks/${id}`);
      await loadAll();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Không thể xóa task");
    }
  };

  const duplicateTask = async (t: Task) => {
    try {
      const payload = {
        title: `${t.title} (Copy)`,
        description: t.description,
        status: typeof t.status === "object" ? (t.status as any)?._id : t.status,
        priority: typeof t.priority === "object" ? (t.priority as any)?._id : t.priority,
        assignee: typeof t.assignee === "object" ? (t.assignee as any)?._id : t.assignee,
        feature_id: typeof t.feature_id === "object" ? (t.feature_id as any)?._id : t.feature_id,
        milestone_id: typeof t.milestone_id === "object" ? (t.milestone_id as any)?._id : t.milestone_id,
        start_date: t.start_date,
        deadline: t.deadline,
        estimate: t.estimate || 0,
      };
      await axiosInstance.post(`/api/projects/${projectId}/tasks`, payload);
      await loadAll();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Không thể nhân bản task");
    }
  };

  const loadTaskDependencies = async (taskId: string) => {
    try {
      const response = await axiosInstance.get(`/api/tasks/${taskId}/dependencies`);
      setTaskDependencies(prev => ({
        ...prev,
        [taskId]: response.data
      }));
    } catch (error) {
      console.error('Error loading dependencies:', error);
    }
  };

  const addDependency = async (taskId: string, dependsOnTaskId: string, type: string = 'FS', lagDays: number = 0) => {
    try {
      await axiosInstance.post(`/api/tasks/${taskId}/dependencies`, {
        depends_on_task_id: dependsOnTaskId,
        dependency_type: type,
        lag_days: lagDays
      });
      await loadTaskDependencies(taskId);
    } catch (error: any) {
      setError(error?.response?.data?.message || 'Không thể tạo dependency');
    }
  };

  const removeDependency = async (taskId: string, dependencyId: string) => {
    try {
      await axiosInstance.delete(`/api/tasks/${taskId}/dependencies/${dependencyId}`);
      await loadTaskDependencies(taskId);
    } catch (error: any) {
      setError(error?.response?.data?.message || 'Không thể xóa dependency');
    }
  };

  // Load subtasks for a task
  const loadSubtasks = async (taskId: string) => {
    try {
      const response = await axiosInstance.get(`/api/tasks/${taskId}/subtasks`);
      setTaskSubtasks(prev => ({ ...prev, [taskId]: response.data }));
    } catch (error) {
      console.error('Error loading subtasks:', error);
    }
  };

  // Toggle task expansion to show/hide subtasks
  const toggleTaskExpansion = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const newExpanded = new Set(expandedTasks);
    if (expandedTasks.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
      // Load subtasks if not already loaded
      if (!taskSubtasks[taskId]) {
        await loadSubtasks(taskId);
      }
    }
    setExpandedTasks(newExpanded);
  };

  // derived lists for filters (from tasks to avoid extra API calls)
  const assignees = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    tasks.forEach((t) => {
      if (typeof t.assignee === "object" && t.assignee) {
        map.set((t.assignee as any)._id, { id: (t.assignee as any)._id, name: (t.assignee as any).name || (t.assignee as any).email || "User" });
      }
    });
    return Array.from(map.values());
  }, [tasks]);

  const statuses = useMemo(() => {
    const set = new Set<string>();
    const list: string[] = [];
    tasks.forEach((t) => {
      const name = typeof t.status === "object" ? (t.status as any)?.name : (t.status as any);
      if (name && !set.has(name)) { set.add(name); list.push(name); }
    });
    return list;
  }, [tasks]);

  const priorities = useMemo(() => {
    const set = new Set<string>();
    const list: string[] = [];
    tasks.forEach((t) => {
      const name = typeof t.priority === "object" ? (t.priority as any)?.name : (t.priority as any);
      if (name && !set.has(name)) { set.add(name); list.push(name); }
    });
    return list;
  }, [tasks]);

  const features = useMemo(() => {
    const map = new Map<string, { id: string; title: string }>();
    tasks.forEach((t) => {
      if (typeof t.feature_id === "object" && t.feature_id) {
        map.set((t.feature_id as any)._id, { id: (t.feature_id as any)._id, title: (t.feature_id as any).title });
      }
    });
    return Array.from(map.values());
  }, [tasks]);

  const milestones = useMemo(() => {
    const map = new Map<string, { id: string; title: string }>();
    tasks.forEach((t) => {
      if (typeof t.milestone_id === "object" && t.milestone_id) {
        map.set((t.milestone_id as any)._id, { id: (t.milestone_id as any)._id, title: (t.milestone_id as any).title });
      }
    });
    return Array.from(map.values());
  }, [tasks]);

  const filteredSorted = useMemo(() => {
    // data is already filtered/sorted/paginated by backend
    return tasks;
  }, [tasks]);

  const paged = filteredSorted;

  const groupedByStatus = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    (paged || []).forEach((t) => {
      const key = typeof t.status === "object" ? (t.status as any)?.name || "No Status" : (t.status as any) || "No Status";
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    return groups;
  }, [paged]);

  const resolveName = (value: any, fallback = "-") => {
    if (!value) return fallback;
    if (typeof value === "object") return value.name || value.title || fallback;
    return String(value);
  };

  const getStatusColor = (name: string) => {
    const key = (name || '').toLowerCase();
    if (key.includes('completed') || key.includes('done')) return '#16a34a';
    if (key.includes('progress') || key.includes('doing')) return '#f59e0b';
    if (key.includes('overdue') || key.includes('blocked')) return '#ef4444';
    return '#9ca3af';
  };

  const getPriorityColor = (name: string) => {
    const key = (name || '').toLowerCase();
    if (key.includes('critical')) return 'error';
    if (key.includes('high')) return 'warning';
    if (key.includes('medium')) return 'info';
    return 'default';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <ResponsiveSidebar />
        <main className="p-4 md:p-6 md:ml-64">
          <Box sx={{ 
            display: "flex", 
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: "center", 
            py: 12 
          }}>
            <CircularProgress 
              size={60} 
              thickness={4}
              sx={{ 
                color: '#667eea',
                mb: 3
              }}
            />
            <Typography variant="h6" fontWeight={600} color="text.secondary">
              Đang tải dữ liệu tasks...
            </Typography>
          </Box>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <ResponsiveSidebar />
      <main className="md:ml-64">
        <div className="w-full">
          {/* ClickUp-style Top Bar */}
          <Box 
            sx={{ 
              bgcolor: 'white',
              borderBottom: '1px solid #e8e9eb',
              px: 3,
              py: 2,
              position: 'sticky',
              top: 0,
              zIndex: 100,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Breadcrumb & Title */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton 
                  onClick={() => router.back()}
                  size="small"
                  sx={{ 
                    color: '#49516f',
                    '&:hover': { bgcolor: '#f3f4f6' }
                  }}
                >
                  <ArrowBackIcon fontSize="small" />
              </IconButton>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 700,
                    color: '#1f2937',
                    fontSize: '24px',
                  }}
                >
                  Tasks
                </Typography>
              </Box>

              {/* Right Actions */}
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Button 
                  variant="contained" 
                  onClick={openCreate} 
                  startIcon={<AddIcon />} 
                  sx={{ 
                    bgcolor: '#7b68ee',
                    color: 'white',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '14px',
                    px: 2.5,
                    py: 1,
                    borderRadius: 1.5,
                    boxShadow: 'none',
                    '&:hover': { 
                      bgcolor: '#6952d6',
                      boxShadow: '0 2px 8px rgba(123, 104, 238, 0.3)',
                    },
                  }}
                >
                  New Task
                </Button>
            </Stack>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Quick Tips */}
          <Box sx={{ 
            bgcolor: '#f0f5ff', 
            px: 3, 
            py: 1.5, 
            borderBottom: '1px solid #dbeafe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1
          }}>
            <Typography sx={{ fontSize: '12px', color: '#3b82f6', fontWeight: 500 }}>
              💡 Quick Edit: Double-click task name to rename, click dropdowns to change assignee/status/priority/date
            </Typography>
            <Typography sx={{ fontSize: '11px', color: '#9ca3af', fontWeight: 500 }}>
              Team members: {teamMembers.length}
            </Typography>
          </Box>

          {/* ClickUp-style Stats */}
          {stats && (
            <Box sx={{ px: 3, py: 2, display: 'flex', gap: 2, borderBottom: '1px solid #e8e9eb', bgcolor: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, borderRadius: 1.5, bgcolor: '#f8f9fb' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '13px' }}>
                  Total:
                </Typography>
                <Typography variant="body2" fontWeight={700} sx={{ fontSize: '13px' }}>
                  {stats.total}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, borderRadius: 1.5, bgcolor: '#f0f5ff' }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#3b82f6' }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '13px' }}>
                  In Progress:
                </Typography>
                <Typography variant="body2" fontWeight={700} sx={{ fontSize: '13px', color: '#3b82f6' }}>
                  {stats.by_status ? Object.entries(stats.by_status).find(([k]) => k.toLowerCase().includes('progress'))?.[1] || 0 : 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, borderRadius: 1.5, bgcolor: '#f0fdf4' }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22c55e' }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '13px' }}>
                  Completed:
                </Typography>
                <Typography variant="body2" fontWeight={700} sx={{ fontSize: '13px', color: '#22c55e' }}>
                  {stats.by_status ? Object.entries(stats.by_status).find(([k]) => k.toLowerCase().includes('completed') || k.toLowerCase().includes('done'))?.[1] || 0 : 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, borderRadius: 1.5, bgcolor: '#fef2f2' }}>
                <FlagIcon sx={{ fontSize: 14, color: '#ef4444' }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '13px' }}>
                  High Priority:
                </Typography>
                <Typography variant="body2" fontWeight={700} sx={{ fontSize: '13px', color: '#ef4444' }}>
                  {stats.by_priority ? Object.entries(stats.by_priority).find(([k]) => k.toLowerCase().includes('high') || k.toLowerCase().includes('critical'))?.[1] || 0 : 0}
                </Typography>
              </Box>
            </Box>
          )}

          {/* ClickUp-style View Toolbar */}
          <Box 
            sx={{ 
              bgcolor: 'white',
              borderBottom: '1px solid #e8e9eb',
              px: 3,
              py: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Stack direction="row" spacing={0.5}>
              <Button
                onClick={() => setView('table')}
                startIcon={<ListIcon fontSize="small" />}
                sx={{
                  minWidth: 'auto',
                  px: 2,
                  py: 0.75,
                  color: view === 'table' ? '#7b68ee' : '#49516f',
                  bgcolor: view === 'table' ? '#f3f0ff' : 'transparent',
                  textTransform: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: 1.5,
                  '&:hover': {
                    bgcolor: view === 'table' ? '#f3f0ff' : '#f3f4f6',
                  }
                }}
              >
                List
              </Button>
              <Button
                onClick={() => setView('kanban')}
                startIcon={<ViewKanbanIcon fontSize="small" />}
                sx={{
                  minWidth: 'auto',
                  px: 2,
                  py: 0.75,
                  color: view === 'kanban' ? '#7b68ee' : '#49516f',
                  bgcolor: view === 'kanban' ? '#f3f0ff' : 'transparent',
                  textTransform: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: 1.5,
                  '&:hover': {
                    bgcolor: view === 'kanban' ? '#f3f0ff' : '#f3f4f6',
                  }
                }}
              >
                Board
              </Button>
              <Button
                onClick={() => setView('calendar')}
                startIcon={<CalendarMonthIcon fontSize="small" />}
                sx={{
                  minWidth: 'auto',
                  px: 2,
                  py: 0.75,
                  color: view === 'calendar' ? '#7b68ee' : '#49516f',
                  bgcolor: view === 'calendar' ? '#f3f0ff' : 'transparent',
                  textTransform: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: 1.5,
                  '&:hover': {
                    bgcolor: view === 'calendar' ? '#f3f0ff' : '#f3f4f6',
                  }
                }}
              >
                Calendar
              </Button>
              <Button
                onClick={() => setView('gantt')}
                startIcon={<DashboardIcon fontSize="small" />}
                sx={{
                  minWidth: 'auto',
                  px: 2,
                  py: 0.75,
                  color: view === 'gantt' ? '#7b68ee' : '#49516f',
                  bgcolor: view === 'gantt' ? '#f3f0ff' : 'transparent',
                  textTransform: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: 1.5,
                  '&:hover': {
                    bgcolor: view === 'gantt' ? '#f3f0ff' : '#f3f4f6',
                  }
                }}
              >
                Gantt
              </Button>
              <Button
                onClick={() => setView('network')}
                startIcon={<GroupWorkIcon fontSize="small" />}
                sx={{
                  minWidth: 'auto',
                  px: 2,
                  py: 0.75,
                  color: view === 'network' ? '#7b68ee' : '#49516f',
                  bgcolor: view === 'network' ? '#f3f0ff' : 'transparent',
                  textTransform: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: 1.5,
                  '&:hover': {
                    bgcolor: view === 'network' ? '#f3f0ff' : '#f3f4f6',
                  }
                }}
              >
                Network
              </Button>
              <Button
                onClick={() => setView('timeline')}
                startIcon={<DashboardIcon fontSize="small" />}
                sx={{
                  minWidth: 'auto',
                  px: 2,
                  py: 0.75,
                  color: view === 'timeline' ? '#7b68ee' : '#49516f',
                  bgcolor: view === 'timeline' ? '#f3f0ff' : 'transparent',
                  textTransform: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: 1.5,
                  '&:hover': {
                    bgcolor: view === 'timeline' ? '#f3f0ff' : '#f3f4f6',
                  }
                }}
              >
                Timeline
              </Button>
            </Stack>

            <Stack direction="row" spacing={1}>
              <IconButton 
                size="small"
                sx={{ 
                  color: '#49516f',
                  '&:hover': { bgcolor: '#f3f4f6' }
                }}
              >
                <TuneIcon fontSize="small" />
              </IconButton>
              <IconButton 
                size="small"
                sx={{ 
                  color: '#49516f',
                  '&:hover': { bgcolor: '#f3f4f6' }
                }}
              >
                <SearchIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Box>

          {/* ClickUp-style Compact Filters */}
          <Box 
            sx={{ 
              bgcolor: 'white',
              px: 3,
              py: 2,
              borderBottom: '1px solid #e8e9eb',
            }}
          >
            <Stack direction="row" spacing={1.5} flexWrap="wrap">
              <TextField
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="small"
                sx={{ 
                  width: 240,
                  '& .MuiOutlinedInput-root': { 
                    fontSize: '13px',
                    borderRadius: 1.5,
                    bgcolor: '#f8f9fb',
                    border: 'none',
                    '& fieldset': { border: 'none' },
                    '&:hover': { bgcolor: '#f3f4f6' },
                    '&.Mui-focused': { bgcolor: 'white', boxShadow: '0 0 0 2px #e8e9eb' }
                  } 
                }}
                InputProps={{ 
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 16, color: '#9ca3af' }} />
                    </InputAdornment>
                  ) 
                }}
              />

              <Select 
                value={filterAssignee} 
                onChange={(e) => setFilterAssignee(e.target.value)}
                size="small"
                displayEmpty
                sx={{ 
                  minWidth: 150,
                  fontSize: '13px',
                  borderRadius: 1.5,
                  bgcolor: '#f8f9fb',
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  '&:hover': { bgcolor: '#f3f4f6' },
                }}
              >
                <MenuItem value="all">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography fontSize="13px">All Assignees ({teamMembers.length})</Typography>
                  </Box>
                </MenuItem>
                {teamMembers.map((member, idx) => {
                  const userId = member.user_id?._id || member._id;
                  const userName = member.user_id?.full_name || member.full_name || member.user_id?.email || member.email || 'Unknown';
                  return (
                    <MenuItem key={userId || idx} value={userId}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 20, height: 20, bgcolor: '#7b68ee', fontSize: '10px' }}>
                          {userName.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography fontSize="13px">{userName}</Typography>
                      </Box>
                    </MenuItem>
                  );
                })}
                </Select>
              
              <Select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                size="small"
                displayEmpty
                sx={{ 
                  minWidth: 120,
                  fontSize: '13px',
                  borderRadius: 1.5,
                  bgcolor: '#f8f9fb',
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  '&:hover': { bgcolor: '#f3f4f6' },
                }}
              >
                <MenuItem value="all"><Typography fontSize="13px">All Status</Typography></MenuItem>
                {statuses.map((s) => <MenuItem key={s} value={s}><Typography fontSize="13px">{s}</Typography></MenuItem>)}
                </Select>
              
              <Select 
                value={filterPriority} 
                onChange={(e) => setFilterPriority(e.target.value)}
                size="small"
                displayEmpty
                sx={{ 
                  minWidth: 120,
                  fontSize: '13px',
                  borderRadius: 1.5,
                  bgcolor: '#f8f9fb',
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  '&:hover': { bgcolor: '#f3f4f6' },
                }}
              >
                <MenuItem value="all"><Typography fontSize="13px">All Priority</Typography></MenuItem>
                {priorities.map((p) => <MenuItem key={p} value={p}><Typography fontSize="13px">{p}</Typography></MenuItem>)}
                </Select>
            </Stack>
          </Box>

          {view === "table" && (
            <Box sx={{ bgcolor: 'white' }}>

              {/* ClickUp-style Column headers */}
              <Box sx={{ 
                px: 3, 
                py: 1.5, 
                display: 'grid', 
                gridTemplateColumns: { xs: '40px 1fr 120px 110px', md: '40px 1fr 140px 140px 120px 100px 100px 80px 60px' }, 
                columnGap: 2, 
                color: '#6b7280', 
                fontSize: '11px', 
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                bgcolor: '#fafbfc',
                borderBottom: '1px solid #e8e9eb',
              }}>
                <Box></Box>
                <Box>Task name</Box>
                <Box>Assignee</Box>
                <Box sx={{ display: { xs: 'none', md: 'block' } }}>Assigner</Box>
                <Box>Due date</Box>
                <Box sx={{ display: { xs: 'none', md: 'block' } }}>Status</Box>
                <Box sx={{ display: { xs: 'none', md: 'block' } }}>Priority</Box>
                <Box sx={{ display: { xs: 'none', md: 'block' } }}>Dependencies</Box>
                <Box sx={{ display: { xs: 'none', md: 'block' } }}>Progress</Box>
              </Box>

              {/* Groups */}
              <Box>
                {Object.entries(groupedByStatus).map(([statusName, rows]) => (
                  <Box key={statusName}>
                    {/* ClickUp-style Group header */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      px: 3, 
                      py: 1.5, 
                      bgcolor: '#fafbfc',
                      borderBottom: '1px solid #e8e9eb',
                      '&:hover': {
                        bgcolor: '#f3f4f6'
                      }
                    }}>
                      <IconButton 
                        size="small" 
                        onClick={() => setCollapsedGroups({ ...collapsedGroups, [statusName]: !collapsedGroups[statusName] })}
                        sx={{
                          p: 0.5,
                          mr: 1,
                          color: '#6b7280',
                          '&:hover': { bgcolor: '#e5e7eb' }
                        }}
                      >
                        {collapsedGroups[statusName] ? <ChevronRightIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
                      </IconButton>
                      <Box sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        background: getStatusColor(statusName), 
                        mr: 1.5,
                      }} />
                      <Typography fontWeight={600} sx={{ fontSize: '13px', color: '#1f2937', mr: 1 }}>
                        {statusName || 'No Status'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '12px' }}>
                        {rows.length}
                      </Typography>
                    </Box>

                    {/* ClickUp-style compact Rows */}
                    {!collapsedGroups[statusName] && rows.map((t) => {
                      const assigneeName = resolveName(t.assignee_id, "");
                      const assigneeInitials = assigneeName ? assigneeName.split(' ').map((part: string) => part[0]).join('').slice(0, 2).toUpperCase() : '';
                      const assignerName = resolveName(t.assigner_id, "");
                      const assignerInitials = assignerName ? assignerName.split(' ').map((part: string) => part[0]).join('').slice(0, 2).toUpperCase() : '';
                      const priorityName = typeof t.priority === 'object' ? (t.priority as any)?.name : (t.priority as any) || '-';
                      const isOverdue = t.deadline ? new Date(t.deadline).getTime() < Date.now() && (String(t.status).toLowerCase() !== 'completed') : false;
                      
                      // Check if task is blocked by incomplete dependencies
                      const hasBlockingDependencies = taskDependencies[t._id]?.dependents?.some((dep: any) => {
                        const status = dep.task_id?.status;
                        const isCompleted = ['Done', 'Completed'].includes(status);
                        const isStarted = ['In Progress', 'Testing', 'Review', 'Done', 'Completed'].includes(status);
                        
                        if (dep.dependency_type === 'FS' && !isCompleted) return true;
                        if (dep.dependency_type === 'FF' && !isCompleted) return true;
                        if (dep.dependency_type === 'SS' && !isStarted) return true;
                        if (dep.dependency_type === 'SF' && !isStarted) return true;
                        return false;
                      });
                      
                      return (
                        <>
                        <Box 
                          key={t._id} 
                          sx={{ 
                            px: 3, 
                            py: 1.25, 
                            display: 'grid', 
                            gridTemplateColumns: { xs: '40px 1fr 120px 110px', md: '40px 1fr 140px 140px 120px 100px 100px 80px 60px' }, 
                            columnGap: 2, 
                            alignItems: 'center', 
                            borderBottom: '1px solid #f3f4f6',
                            cursor: 'pointer',
                            '&:hover': { 
                              bgcolor: '#fafbfc',
                            }, 
                            '&:hover .row-actions': { opacity: 1 },
                          }}
                          onClick={() => openTaskDetailsModal(t._id)}
                        >
                          {/* Checkbox with expand/collapse for subtasks */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {/* Expand/Collapse chevron - only show if task has subtasks */}
                            {taskSubtasks[t._id]?.length > 0 ? (
                              <IconButton
                                size="small"
                                onClick={(e) => toggleTaskExpansion(t._id, e)}
                                sx={{ 
                                  padding: 0,
                                  width: 20,
                                  height: 20,
                                  color: expandedTasks.has(t._id) ? '#7b68ee' : '#6b7280',
                                  '&:hover': { 
                                    bgcolor: '#f3f4f6',
                                    color: '#7b68ee'
                                  },
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                {expandedTasks.has(t._id) ? (
                                  <ExpandMoreIcon sx={{ fontSize: 18 }} />
                                ) : (
                                  <ChevronRightIcon sx={{ fontSize: 18 }} />
                                )}
                              </IconButton>
                            ) : (
                              <Box sx={{ width: 20 }} />
                            )}
                            
                            {/* Checkbox */}
                            <Box sx={{ 
                              width: 16, 
                              height: 16, 
                              border: '2px solid #d1d5db',
                              borderRadius: 0.5,
                              '&:hover': { borderColor: '#7b68ee' }
                            }} />
                              </Box>

                          {/* Task name - double click to edit */}
                          <Box onClick={(e) => e.stopPropagation()}>
                            {editingTaskId === t._id ? (
                              <TextField
                                autoFocus
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onBlur={async () => {
                                  if (editingTitle.trim() && editingTitle !== t.title) {
                                    try {
                                      await axiosInstance.patch(`/api/tasks/${t._id}`, {
                                        title: editingTitle.trim()
                                      });
                                      await loadAll();
                                    } catch (error) {
                                      console.error('Error updating title:', error);
                                    }
                                  }
                                  setEditingTaskId(null);
                                  setEditingTitle('');
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.currentTarget.blur();
                                  } else if (e.key === 'Escape') {
                                    setEditingTaskId(null);
                                    setEditingTitle('');
                                  }
                                }}
                                size="small"
                                fullWidth
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    '& fieldset': { border: 'none' },
                                    bgcolor: 'white',
                                    boxShadow: '0 0 0 2px #7b68ee',
                                    borderRadius: 1,
                                  }
                                }}
                              />
                            ) : (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {hasBlockingDependencies && (
                                  <Tooltip title="⚠️ This task is blocked by incomplete dependencies" placement="top">
                                    <BlockIcon sx={{ fontSize: 14, color: '#f59e0b' }} />
                                  </Tooltip>
                                )}
                                <Tooltip title="Double-click to edit" placement="top">
                                  <Typography 
                                    onDoubleClick={(e) => {
                                      e.stopPropagation();
                                      setEditingTaskId(t._id);
                                      setEditingTitle(t.title);
                                    }}
                                    sx={{ 
                                      fontWeight: 500, 
                                      fontSize: '14px', 
                                      color: hasBlockingDependencies ? '#f59e0b' : '#1f2937',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      px: 1,
                                      py: 0.5,
                                      borderRadius: 1,
                                      '&:hover': {
                                        bgcolor: '#f3f4f6',
                                      }
                                    }}
                                  >
                                    {t.title}
                                  </Typography>
                                </Tooltip>
                                
                                {/* Subtask counter badge - Jira/ClickUp style */}
                                {taskSubtasks[t._id]?.length > 0 && (
                                  <Chip
                                    icon={<CheckCircleIcon sx={{ fontSize: 12, color: '#6b7280 !important' }} />}
                                    label={`${taskSubtasks[t._id].filter((st: any) => st.status === 'Completed' || st.status === 'Done').length}/${taskSubtasks[t._id].length}`}
                                    size="small"
                                    sx={{
                                      height: 20,
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      bgcolor: expandedTasks.has(t._id) ? '#ede9fe' : '#f3f4f6',
                                      color: expandedTasks.has(t._id) ? '#7b68ee' : '#6b7280',
                                      border: expandedTasks.has(t._id) ? '1px solid #7b68ee40' : 'none',
                                      '& .MuiChip-icon': {
                                        marginLeft: '4px',
                                      },
                                      transition: 'all 0.2s ease',
                                    }}
                                  />
                                )}
                          </Box>
                            )}
                          </Box>
                          {/* Assignee - với dropdown để quick assign */}
                          <Box onClick={(e) => e.stopPropagation()}>
                            <Select
                              value={typeof t.assignee_id === 'object' ? t.assignee_id?._id : t.assignee_id || ''}
                              onChange={async (e) => {
                                e.stopPropagation();
                                try {
                                  await axiosInstance.patch(`/api/tasks/${t._id}`, {
                                    assignee_id: e.target.value || null
                                  });
                                  await loadAll();
                                } catch (error) {
                                  console.error('Error updating assignee:', error);
                                }
                              }}
                              size="small"
                              displayEmpty
                              renderValue={(value) => {
                                if (!value) {
                                  return (
                                    <Avatar sx={{ width: 28, height: 28, bgcolor: '#e5e7eb', color: '#9ca3af' }}>
                                      <PersonIcon sx={{ fontSize: 16 }} />
                                    </Avatar>
                                  );
                                }
                                return (
                                  <Tooltip title={assigneeName}>
                                    <Avatar 
                                      sx={{ 
                                        width: 28, 
                                        height: 28, 
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        bgcolor: '#7b68ee',
                                      }}
                                    >
                                      {assigneeInitials}
                                    </Avatar>
                                  </Tooltip>
                                );
                              }}
                              sx={{
                                '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                                '& .MuiSelect-select': { p: 0 },
                                '&:hover': { bgcolor: '#f3f4f6', borderRadius: 1 },
                              }}
                            >
                              <MenuItem value="">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Avatar sx={{ width: 24, height: 24, bgcolor: '#e5e7eb', color: '#9ca3af' }}>
                                    <PersonIcon sx={{ fontSize: 14 }} />
                                  </Avatar>
                                  <Typography fontSize="13px" color="text.secondary">Unassigned</Typography>
                          </Box>
                              </MenuItem>
                              {teamMembers.map((member, idx) => {
                                const userId = member.user_id?._id || member._id;
                                const userName = member.user_id?.full_name || member.full_name || member.user_id?.email || member.email || 'Unknown';
                                return (
                                  <MenuItem key={userId || idx} value={userId}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Avatar sx={{ width: 24, height: 24, bgcolor: '#7b68ee', fontSize: '11px' }}>
                                        {userName.charAt(0).toUpperCase()}
                                      </Avatar>
                                      <Typography fontSize="13px">{userName}</Typography>
                          </Box>
                                  </MenuItem>
                                );
                              })}
                            </Select>
                          </Box>

                          {/* Assigner (người giao task) */}
                          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                            {assignerName ? (
                              <Tooltip title={`Assigned by: ${assignerName}`}>
                                <Avatar 
                                  sx={{ 
                                    width: 28, 
                                    height: 28, 
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    bgcolor: '#64748b',
                                  }}
                                >
                                  {assignerInitials}
                                </Avatar>
                              </Tooltip>
                            ) : (
                              <Avatar sx={{ width: 28, height: 28, bgcolor: '#e5e7eb', color: '#9ca3af' }}>
                                <PersonIcon sx={{ fontSize: 16 }} />
                              </Avatar>
                            )}
                          </Box>

                          {/* Due date - inline edit */}
                          <Box onClick={(e) => e.stopPropagation()}>
                            <TextField
                              type="date"
                              size="small"
                              value={t.deadline ? new Date(t.deadline).toISOString().split('T')[0] : ''}
                              onChange={async (e) => {
                                try {
                                  await axiosInstance.patch(`/api/tasks/${t._id}`, {
                                    deadline: e.target.value
                                  });
                                  await loadAll();
                                } catch (error) {
                                  console.error('Error updating deadline:', error);
                                }
                              }}
                              InputProps={{
                                sx: {
                                  fontSize: '13px',
                                  color: isOverdue ? '#ef4444' : '#6b7280',
                                  fontWeight: 500,
                                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                                  '&:hover': { bgcolor: '#f3f4f6', borderRadius: 1 },
                                  '& input': { 
                                    p: 0.5,
                                    cursor: 'pointer',
                                  }
                                }
                              }}
                              sx={{ width: '110px' }}
                            />
                          </Box>

                          {/* Status - inline edit */}
                          <Box sx={{ display: { xs: 'none', md: 'block' } }} onClick={(e) => e.stopPropagation()}>
                            <Select
                              value={typeof t.status === 'object' ? (t.status as any)?.name : t.status || ''}
                              onChange={async (e) => {
                                e.stopPropagation();
                                const newStatus = e.target.value;
                                try {
                                  await axiosInstance.patch(`/api/tasks/${t._id}`, {
                                    status: newStatus
                                  });
                                  await loadAll();
                                } catch (error: any) {
                                  console.error('Error updating status:', error);
                                  
                                  // Check if it's a dependency violation error
                                  if (error?.response?.data?.violations) {
                                    setDependencyViolationDialog({
                                      open: true,
                                      violations: error.response.data.violations,
                                      taskId: t._id,
                                      newStatus: newStatus
                                    });
                                  } else {
                                    setError(error?.response?.data?.message || 'Không thể cập nhật status');
                                  }
                                }
                              }}
                              size="small"
                              displayEmpty
                              renderValue={(value) => (
                                <Chip 
                                  label={value || 'No Status'} 
                                  size="small"
                                  sx={{
                                    height: 22,
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    bgcolor: `${getStatusColor(String(value))}15`,
                                    color: getStatusColor(String(value)),
                                    border: 'none',
                                  }}
                                />
                              )}
                              sx={{
                                '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                                '& .MuiSelect-select': { p: 0 },
                                '&:hover': { bgcolor: '#f3f4f6', borderRadius: 1 },
                              }}
                            >
                              <MenuItem value="To Do">
                                <Chip label="To Do" size="small" sx={{ bgcolor: '#9ca3af15', color: '#9ca3af', fontSize: '11px', fontWeight: 600 }} />
                              </MenuItem>
                              <MenuItem value="In Progress">
                                <Chip label="In Progress" size="small" sx={{ bgcolor: '#f59e0b15', color: '#f59e0b', fontSize: '11px', fontWeight: 600 }} />
                              </MenuItem>
                              <MenuItem value="Review">
                                <Chip label="Review" size="small" sx={{ bgcolor: '#8b5cf615', color: '#8b5cf6', fontSize: '11px', fontWeight: 600 }} />
                              </MenuItem>
                              <MenuItem value="Testing">
                                <Chip label="Testing" size="small" sx={{ bgcolor: '#06b6d415', color: '#06b6d4', fontSize: '11px', fontWeight: 600 }} />
                              </MenuItem>
                              <MenuItem value="Done">
                                <Chip label="Done" size="small" sx={{ bgcolor: '#16a34a15', color: '#16a34a', fontSize: '11px', fontWeight: 600 }} />
                              </MenuItem>
                              <MenuItem value="Blocked">
                                <Chip label="Blocked" size="small" sx={{ bgcolor: '#ef444415', color: '#ef4444', fontSize: '11px', fontWeight: 600 }} />
                              </MenuItem>
                            </Select>
                          </Box>

                          {/* Priority - inline edit */}
                          <Box sx={{ display: { xs: 'none', md: 'block' } }} onClick={(e) => e.stopPropagation()}>
                            <Select
                              value={priorityName !== '-' ? priorityName : ''}
                              onChange={async (e) => {
                                e.stopPropagation();
                                try {
                                  await axiosInstance.patch(`/api/tasks/${t._id}`, {
                                    priority: e.target.value
                                  });
                                  await loadAll();
                                } catch (error) {
                                  console.error('Error updating priority:', error);
                                }
                              }}
                              size="small"
                              displayEmpty
                              renderValue={(value) => {
                                if (!value || value === '-') {
                                  return (
                                    <Typography sx={{ fontSize: '13px', color: '#9ca3af', px: 0.5 }}>
                                      No priority
                                    </Typography>
                                  );
                                }
                                const color = value.toLowerCase().includes('critical') || value.toLowerCase().includes('high') ? '#ef4444'
                                  : value.toLowerCase().includes('medium') ? '#f59e0b'
                                  : '#3b82f6';
                                return (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <FlagIcon sx={{ fontSize: 14, color }} />
                                    <Typography sx={{ fontSize: '13px', fontWeight: 500, color }}>
                                      {value}
                                    </Typography>
                                  </Box>
                                );
                              }}
                              sx={{
                                '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                                '& .MuiSelect-select': { p: 0.5 },
                                '&:hover': { bgcolor: '#f3f4f6', borderRadius: 1 },
                              }}
                            >
                              <MenuItem value="">
                                <Typography fontSize="13px" color="text.secondary">No Priority</Typography>
                              </MenuItem>
                              <MenuItem value="Low">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <FlagIcon sx={{ fontSize: 14, color: '#3b82f6' }} />
                                  <Typography fontSize="13px" color="#3b82f6">Low</Typography>
                                </Box>
                              </MenuItem>
                              <MenuItem value="Medium">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <FlagIcon sx={{ fontSize: 14, color: '#f59e0b' }} />
                                  <Typography fontSize="13px" color="#f59e0b">Medium</Typography>
                                </Box>
                              </MenuItem>
                              <MenuItem value="High">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <FlagIcon sx={{ fontSize: 14, color: '#ef4444' }} />
                                  <Typography fontSize="13px" color="#ef4444">High</Typography>
                                </Box>
                              </MenuItem>
                              <MenuItem value="Critical">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <FlagIcon sx={{ fontSize: 14, color: '#dc2626' }} />
                                  <Typography fontSize="13px" color="#dc2626" fontWeight={700}>Critical</Typography>
                                </Box>
                              </MenuItem>
                            </Select>
                          </Box>

                          {/* Dependencies - inline manage */}
                          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                            {taskDependencies[t._id]?.dependencies?.length > 0 || taskDependencies[t._id]?.dependents?.length > 0 ? (
                              <Tooltip 
                                title={
                          <Box>
                                    {taskDependencies[t._id]?.dependencies?.length > 0 && (
                                      <Box sx={{ mb: 0.5 }}>
                                        <Typography fontSize="10px" fontWeight={700} sx={{ mb: 0.5, color: '#93c5fd' }}>
                                          This task blocks:
                                        </Typography>
                                        {taskDependencies[t._id].dependencies.map((d: any) => (
                                          <Typography key={d._id} fontSize="11px" sx={{ pl: 1 }}>
                                            • [{d.dependency_type}] {d.depends_on_task_id?.title}
                                            {d.lag_days !== 0 && ` (${d.lag_days > 0 ? '+' : ''}${d.lag_days}d)`}
                                          </Typography>
                                        ))}
                          </Box>
                                    )}
                                    {taskDependencies[t._id]?.dependents?.length > 0 && (
                          <Box>
                                        <Typography fontSize="10px" fontWeight={700} sx={{ mb: 0.5, color: '#fcd34d' }}>
                                          Blocked by:
                                        </Typography>
                                        {taskDependencies[t._id].dependents.map((d: any) => (
                                          <Typography key={d._id} fontSize="11px" sx={{ pl: 1 }}>
                                            • [{d.dependency_type}] {d.task_id?.title}
                                            {d.lag_days !== 0 && ` (${d.lag_days > 0 ? '+' : ''}${d.lag_days}d)`}
                                          </Typography>
                                        ))}
                          </Box>
                                    )}
                                  </Box>
                                }
                              >
                                <Chip 
                                  icon={<LinkIcon sx={{ fontSize: 12 }} />}
                                  label={
                                    (taskDependencies[t._id]?.dependencies?.length || 0) + 
                                    (taskDependencies[t._id]?.dependents?.length || 0)
                                  }
                                  size="small"
                                  sx={{ 
                                    height: 20,
                                    fontSize: '11px',
                                    bgcolor: '#f0f5ff',
                                    color: '#3b82f6',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    '&:hover': { bgcolor: '#dbeafe' }
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDependencyTaskId(t._id);
                                    loadTaskDependencies(t._id);
                                    setOpenDependencyDialog(true);
                                  }}
                                />
                              </Tooltip>
                            ) : (
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDependencyTaskId(t._id);
                                  loadTaskDependencies(t._id);
                                  setOpenDependencyDialog(true);
                                }}
                                sx={{ 
                                  color: '#9ca3af',
                                  '&:hover': { 
                                    color: '#7b68ee',
                                    bgcolor: '#f3f4f6' 
                                  }
                                }}
                              >
                                <LinkIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            )}
                          </Box>

                          {/* Progress - inline edit with slider */}
                          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                            <Tooltip title={`${t.progress || 0}% completed`}>
                              <Box 
                                sx={{ 
                                  width: 50,
                                  height: 6,
                                  bgcolor: '#e5e7eb',
                                  borderRadius: 3,
                                  overflow: 'hidden',
                                  cursor: 'pointer',
                                  '&:hover': {
                                    height: 8,
                                  },
                                  transition: 'height 0.2s ease'
                                }}
                              >
                                <Box 
                                  sx={{ 
                                    width: `${t.progress || 0}%`,
                                    height: '100%',
                                    bgcolor: t.progress === 100 ? '#22c55e' : '#7b68ee',
                                    transition: 'width 0.3s ease',
                                  }}
                                />
                              </Box>
                            </Tooltip>
                          </Box>
                        </Box>

                        {/* Subtasks - rendered below parent task with indentation */}
                        {expandedTasks.has(t._id) && taskSubtasks[t._id] && taskSubtasks[t._id].map((subtask: any, subIndex: number) => (
                          <Box 
                            key={subtask._id} 
                            sx={{ 
                              px: 3, 
                              py: 1,
                              pl: 6, // Extra left padding for indentation
                              display: 'grid', 
                              gridTemplateColumns: { xs: '40px 1fr 120px 110px', md: '40px 1fr 140px 140px 120px 100px 100px 80px 60px' }, 
                              columnGap: 2, 
                              alignItems: 'center', 
                              bgcolor: '#fafbfc',
                              borderBottom: '1px solid #f3f4f6',
                              cursor: 'pointer',
                              position: 'relative',
                              '&:hover': { 
                                bgcolor: '#f5f3ff',
                              },
                              // Tree line connector - vertical line
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                left: '35px',
                                top: 0,
                                bottom: subIndex === taskSubtasks[t._id].length - 1 ? '50%' : 0,
                                width: '2px',
                                bgcolor: '#e5e7eb',
                              },
                              // Tree line connector - horizontal line
                              '&::after': {
                                content: '""',
                                position: 'absolute',
                                left: '35px',
                                top: '50%',
                                width: '12px',
                                height: '2px',
                                bgcolor: '#e5e7eb',
                              },
                            }}
                            onClick={() => openTaskDetailsModal(subtask._id)}
                          >
                            {/* Subtask indicator with connection */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Box sx={{ width: 20 }} />
                              <Box sx={{ 
                                width: 14, 
                                height: 14, 
                                border: '2px solid #7b68ee',
                                borderRadius: '50%',
                                bgcolor: subtask.status === 'Completed' || subtask.status === 'Done' ? '#7b68ee' : 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}>
                                {(subtask.status === 'Completed' || subtask.status === 'Done') && (
                                  <CheckCircleIcon sx={{ fontSize: 10, color: 'white' }} />
                                )}
                              </Box>
                            </Box>

                            {/* Subtask name */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography 
                                sx={{ 
                                  fontWeight: 400, 
                                  fontSize: '13px', 
                                  color: subtask.status === 'Completed' || subtask.status === 'Done' ? '#9ca3af' : '#4b5563',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  textDecoration: subtask.status === 'Completed' || subtask.status === 'Done' ? 'line-through' : 'none',
                                }}
                              >
                                {subtask.title}
                              </Typography>
                              <Chip 
                                label="Subtask" 
                                size="small" 
                                sx={{ 
                                  height: 18,
                                  fontSize: '10px',
                                  bgcolor: '#ede9fe',
                                  color: '#7b68ee',
                                  fontWeight: 600,
                                }}
                              />
                            </Box>

                            {/* Assignee */}
                            <Box onClick={(e) => e.stopPropagation()}>
                              {subtask.assignee_id && (
                                <Tooltip title={subtask.assignee_id?.full_name || subtask.assignee_id?.email}>
                                  <Avatar 
                                    sx={{ 
                                      width: 24, 
                                      height: 24, 
                                      fontSize: '10px',
                                      fontWeight: 600,
                                      bgcolor: '#9333ea',
                                    }}
                                  >
                                    {(subtask.assignee_id?.full_name || subtask.assignee_id?.email || 'U')[0].toUpperCase()}
                                  </Avatar>
                                </Tooltip>
                              )}
                            </Box>

                            {/* Assigner - empty for subtasks */}
                            <Box sx={{ display: { xs: 'none', md: 'block' } }} />

                            {/* Due Date */}
                          <Box>
                              {subtask.deadline && (
                                <Typography fontSize="12px" color="text.secondary">
                                  {new Date(subtask.deadline).toLocaleDateString()}
                                </Typography>
                              )}
                          </Box>

                            {/* Status */}
                            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                              <Chip 
                                label={subtask.status} 
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  bgcolor: '#f3f4f6',
                                  color: '#6b7280',
                                }}
                              />
                          </Box>

                            {/* Priority - empty */}
                            <Box sx={{ display: { xs: 'none', md: 'block' } }} />

                            {/* Dependencies - empty */}
                            <Box sx={{ display: { xs: 'none', md: 'flex' } }} />

                            {/* Progress */}
                            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
                              {subtask.progress !== undefined && subtask.progress > 0 && (
                                <Box sx={{ 
                                  width: 40,
                                  height: 6,
                                  bgcolor: '#e5e7eb',
                                  borderRadius: 3,
                                  overflow: 'hidden'
                                }}>
                                  <Box sx={{ 
                                    width: `${subtask.progress}%`,
                                    height: '100%',
                                    bgcolor: '#9333ea',
                                    transition: 'width 0.3s ease',
                                  }} />
                        </Box>
                              )}
                            </Box>
                          </Box>
                        ))}
                      </>
                      );
                    })}

                    {/* ClickUp-style Add Task inline */}
                    {!collapsedGroups[statusName] && (
                      <Box 
                        sx={{ 
                          px: 3, 
                          py: 1.25, 
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          borderBottom: '1px solid #f3f4f6',
                          '&:hover': {
                            bgcolor: '#fafbfc'
                          }
                        }}
                      >
                        <IconButton size="small" sx={{ color: '#9ca3af' }}>
                          <AddIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                        <Button 
                          variant="text" 
                          onClick={openCreate}
                          sx={{
                            color: '#9ca3af',
                            fontSize: '13px',
                            fontWeight: 500,
                            textTransform: 'none',
                            '&:hover': {
                              color: '#7b68ee',
                              bgcolor: 'transparent'
                            },
                          }}
                        >
                          Add task
                        </Button>
                      </Box>
                    )}
                  </Box>
                ))}

                {Object.keys(groupedByStatus).length === 0 && (
                  <Box sx={{ py: 16, textAlign: 'center', bgcolor: 'white' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#6b7280' }}>
                      No tasks yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Create your first task to get started
                    </Typography>
                    <Button 
                      variant="contained" 
                      startIcon={<AddIcon />} 
                      onClick={openCreate}
                      sx={{
                        bgcolor: '#7b68ee',
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 3,
                        py: 1,
                        borderRadius: 1.5,
                        boxShadow: 'none',
                        '&:hover': {
                          bgcolor: '#6952d6',
                        },
                      }}
                    >
                      Create Task
                    </Button>
                  </Box>
                )}
              </Box>
              </Box>
          )}

          {/* Kanban Board View */}
          {view === "kanban" && (
            <Box sx={{ 
              p: 3,
              bgcolor: '#f8f9fb',
              minHeight: 'calc(100vh - 300px)',
              overflow: 'auto'
            }}>
              {/* Kanban Columns Container */}
              <Box sx={{ 
                display: 'flex',
                gap: 2,
                pb: 3,
                minWidth: 'fit-content'
              }}>
                {Object.entries(groupedByStatus).map(([statusName, tasks]) => (
                  <Box 
                    key={statusName}
                    sx={{ 
                      minWidth: 320,
                      maxWidth: 320,
                      bgcolor: '#ffffff',
                      borderRadius: 3,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      maxHeight: 'calc(100vh - 340px)'
                    }}
                  >
                    {/* Column Header */}
                    <Box sx={{ 
                      p: 2,
                      borderBottom: '2px solid',
                      borderColor: getStatusColor(statusName),
                    }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography fontWeight={700} fontSize="14px" color="text.primary">
                            {statusName}
                          </Typography>
                          <Chip 
                            label={tasks.length} 
                            size="small" 
                            sx={{ 
                              height: 20,
                              minWidth: 28,
                              fontSize: '11px',
                              fontWeight: 700,
                              bgcolor: `${getStatusColor(statusName)}15`,
                              color: getStatusColor(statusName),
                            }} 
                          />
                        </Stack>
                        <IconButton size="small" onClick={openCreate} sx={{ color: '#6b7280' }}>
                          <AddIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Stack>
              </Box>

                    {/* Cards Container - Scrollable */}
                    <Box sx={{ 
                      flex: 1,
                      overflow: 'auto',
                      p: 2,
                      '&::-webkit-scrollbar': {
                        width: '6px'
                      },
                      '&::-webkit-scrollbar-thumb': {
                        bgcolor: '#d1d5db',
                        borderRadius: '3px'
                      }
                    }}>
                      <Stack spacing={1.5}>
                        {tasks.map((task) => {
                          const assigneeName = typeof task.assignee_id === 'object' 
                            ? task.assignee_id?.full_name || task.assignee_id?.email 
                            : '';
                          const assigneeInitials = assigneeName 
                            ? assigneeName.split(' ').map((part: string) => part[0]).join('').slice(0, 2).toUpperCase() 
                            : '';
                          const priorityName = typeof task.priority === 'object' ? (task.priority as any)?.name : task.priority;
                          const isOverdue = task.deadline 
                            ? new Date(task.deadline).getTime() < Date.now() && String(task.status).toLowerCase() !== 'completed'
                            : false;

                          return (
                            <Box
                              key={task._id}
                              onClick={() => openTaskDetailsModal(task._id)}
                              sx={{
                                bgcolor: 'white',
                                border: '1px solid #e8e9eb',
                                borderRadius: 2,
                                p: 2,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                '&:hover': {
                                  boxShadow: '0 4px 12px rgba(123,104,238,0.15)',
                                  borderColor: '#7b68ee',
                                  transform: 'translateY(-2px)'
                                }
                              }}
                            >
                              {/* Task Title */}
                              <Typography 
                                fontSize="14px" 
                                fontWeight={600} 
                                sx={{ 
                                  mb: 1.5,
                                  color: '#1f2937',
                                  lineHeight: 1.4,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden'
                                }}
                              >
                                {task.title}
                              </Typography>

                              {/* Meta Info Row 1 - Priority & Due Date */}
                              <Stack direction="row" spacing={1} sx={{ mb: 1.5 }} flexWrap="wrap" gap={0.5}>
                                {priorityName && (
                                  <Chip
                                    icon={<FlagIcon sx={{ fontSize: 12 }} />}
                                    label={priorityName}
                                    size="small"
                                    sx={{
                                      height: 22,
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      bgcolor: `${getPriorityColor(priorityName)}15`,
                                      color: getPriorityColor(priorityName),
                                      border: `1px solid ${getPriorityColor(priorityName)}40`,
                                      '& .MuiChip-icon': {
                                        color: 'inherit'
                                      }
                                    }}
                                  />
                                )}
                                {task.deadline && (
                                  <Chip
                                    icon={<CalendarMonthIcon sx={{ fontSize: 12 }} />}
                                    label={new Date(task.deadline).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })}
                                    size="small"
                                    sx={{
                                      height: 22,
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      bgcolor: isOverdue ? '#fef3c7' : '#f3f4f6',
                                      color: isOverdue ? '#92400e' : '#6b7280',
                                      border: isOverdue ? '1px solid #fbbf24' : '1px solid #e8e9eb',
                                      '& .MuiChip-icon': {
                                        color: 'inherit'
                                      }
                                    }}
                                  />
                                )}
                              </Stack>

                              {/* Meta Info Row 2 - Progress */}
                              {task.progress !== undefined && task.progress > 0 && (
                                <Box sx={{ mb: 1.5 }}>
                                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                    <Typography fontSize="10px" fontWeight={600} color="text.secondary">
                                      Progress
                                    </Typography>
                                    <Typography fontSize="10px" fontWeight={700} color="#7b68ee">
                                      {task.progress}%
                                    </Typography>
                                  </Stack>
                                  <Box sx={{ 
                                    height: 6, 
                                    bgcolor: '#e8e9eb', 
                                    borderRadius: 3,
                                    overflow: 'hidden'
                                  }}>
                                    <Box sx={{ 
                                      width: `${task.progress}%`, 
                                      height: '100%', 
                                      bgcolor: task.progress === 100 ? '#22c55e' : '#7b68ee',
                                      transition: 'width 0.3s ease',
                                      borderRadius: 3
                                    }} />
                                  </Box>
                                </Box>
                              )}

                              {/* Bottom Row - Assignee & Indicators */}
                              <Stack direction="row" alignItems="center" justifyContent="space-between">
                                {/* Assignee Avatar */}
                                {assigneeName ? (
                                  <Tooltip title={assigneeName}>
                                    <Avatar 
                                      sx={{ 
                                        width: 28, 
                                        height: 28, 
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        bgcolor: '#7b68ee',
                                      }}
                                    >
                                      {assigneeInitials}
                                    </Avatar>
                                  </Tooltip>
                                ) : (
                                  <Avatar 
                                    sx={{ 
                                      width: 28, 
                                      height: 28, 
                                      bgcolor: '#e5e7eb',
                                      color: '#9ca3af'
                                    }}
                                  >
                                    <PersonIcon sx={{ fontSize: 16 }} />
                                  </Avatar>
                                )}

                                {/* Indicators */}
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  {/* Subtasks indicator */}
                                  {taskSubtasks[task._id]?.length > 0 && (
                                    <Tooltip title={`${taskSubtasks[task._id].filter((s: any) => s.status === 'Completed').length}/${taskSubtasks[task._id].length} subtasks`}>
                                      <Chip
                                        icon={<CheckCircleIcon sx={{ fontSize: 12 }} />}
                                        label={`${taskSubtasks[task._id].filter((s: any) => s.status === 'Completed').length}/${taskSubtasks[task._id].length}`}
                                        size="small"
                                        sx={{
                                          height: 20,
                                          fontSize: '10px',
                                          fontWeight: 600,
                                          bgcolor: '#f0fdf4',
                                          color: '#16a34a',
                                          '& .MuiChip-icon': {
                                            color: 'inherit'
                                          }
                                        }}
                                      />
                                    </Tooltip>
                                  )}

                                  {/* Dependencies indicator */}
                                  {(taskDependencies[task._id]?.dependencies?.length > 0 || 
                                    taskDependencies[task._id]?.dependents?.length > 0) && (
                                    <Tooltip title="Has dependencies">
                                      <IconButton size="small" sx={{ color: '#3b82f6', p: 0.25 }}>
                                        <LinkIcon sx={{ fontSize: 14 }} />
                                      </IconButton>
                                    </Tooltip>
                                  )}

                                  {/* Time estimate */}
                                  {task.estimate && (
                                    <Tooltip title={`${task.estimate}h estimated`}>
                                      <IconButton size="small" sx={{ color: '#6b7280', p: 0.25 }}>
                                        <AccessTimeIcon sx={{ fontSize: 14 }} />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </Stack>
                              </Stack>
                            </Box>
                          );
                        })}

                        {/* Add Card Button */}
                        <Button
                          fullWidth
                          startIcon={<AddIcon />}
                          onClick={openCreate}
                          sx={{
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
                          Add Task
                        </Button>
                      </Stack>
                    </Box>
                  </Box>
                ))}

                {Object.keys(groupedByStatus).length === 0 && (
                  <Box sx={{ 
                    width: '100%', 
                    py: 16, 
                    textAlign: 'center',
                    bgcolor: 'white',
                    borderRadius: 3
                  }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#6b7280' }}>
                      No tasks yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Create your first task to get started
                    </Typography>
                    <Button 
                      variant="contained" 
                      startIcon={<AddIcon />}
                      onClick={openCreate}
                      sx={{
                        bgcolor: '#7b68ee',
                        '&:hover': { bgcolor: '#6952d6' }
                      }}
                    >
                      Create Task
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {/* Calendar View */}
          {view === "calendar" && (
            <Box sx={{ p: 3, bgcolor: 'white', minHeight: 'calc(100vh - 300px)' }}>
              {/* Calendar Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <IconButton 
                    onClick={() => {
                      const newDate = new Date(calendarDate);
                      newDate.setMonth(newDate.getMonth() - 1);
                      setCalendarDate(newDate);
                    }}
                    sx={{ 
                      color: '#6b7280',
                      '&:hover': { bgcolor: '#f3f4f6' }
                    }}
                  >
                    <ChevronRightIcon sx={{ transform: 'rotate(180deg)' }} />
                  </IconButton>
                  <Typography variant="h6" fontWeight={700} sx={{ minWidth: 200, textAlign: 'center' }}>
                    {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </Typography>
                  <IconButton 
                    onClick={() => {
                      const newDate = new Date(calendarDate);
                      newDate.setMonth(newDate.getMonth() + 1);
                      setCalendarDate(newDate);
                    }}
                    sx={{ 
                      color: '#6b7280',
                      '&:hover': { bgcolor: '#f3f4f6' }
                    }}
                  >
                    <ChevronRightIcon />
                  </IconButton>
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={() => {
                      setCalendarDate(new Date());
                    }}
                    sx={{ 
                      textTransform: 'none', 
                      fontWeight: 600,
                      borderColor: '#7b68ee',
                      color: '#7b68ee',
                      '&:hover': {
                        borderColor: '#6952d6',
                        bgcolor: '#f5f3ff'
                      }
                    }}
                  >
                    Today
                  </Button>
                </Stack>
              </Box>

              {/* Calendar Grid */}
              <Box sx={{ border: '1px solid #e8e9eb', borderRadius: 2, overflow: 'hidden' }}>
                {/* Weekday Headers */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  bgcolor: '#f8f9fb',
                  borderBottom: '2px solid #e8e9eb'
                }}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <Box 
                      key={day}
                      sx={{ 
                        p: 1.5, 
                        textAlign: 'center',
                        fontWeight: 700,
                        fontSize: '13px',
                        color: '#6b7280'
                      }}
                    >
                      {day}
                    </Box>
                  ))}
                </Box>

                {/* Calendar Days Grid */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gridTemplateRows: 'repeat(5, 1fr)'
                }}>
                  {Array.from({ length: 35 }, (_, i) => {
                    const today = new Date();
                    const firstDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
                    const startingDayOfWeek = firstDay.getDay();
                    const currentDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), i - startingDayOfWeek + 1);
                    const isCurrentMonth = currentDate.getMonth() === calendarDate.getMonth();
                    const isToday = currentDate.toDateString() === today.toDateString();
                    
                    // Get tasks for this date
                    const dayTasks = filteredSorted.filter(task => {
                      if (!task.deadline) return false;
                      const taskDate = new Date(task.deadline);
                      return taskDate.toDateString() === currentDate.toDateString();
                    });

                    return (
                      <Box
                        key={i}
                        sx={{
                          minHeight: 120,
                          p: 1,
                          borderRight: '1px solid #e8e9eb',
                          borderBottom: '1px solid #e8e9eb',
                          bgcolor: !isCurrentMonth ? '#fafbfc' : 'white',
                          '&:hover': { bgcolor: '#f9fafb' },
                          cursor: 'pointer'
                        }}
                      >
                        {/* Date Number */}
                        <Box sx={{ mb: 1 }}>
                          <Typography
                            sx={{
                              fontSize: '13px',
                              fontWeight: isToday ? 700 : 600,
                              color: !isCurrentMonth ? '#9ca3af' : isToday ? 'white' : '#374151',
                              width: 24,
                              height: 24,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '50%',
                              bgcolor: isToday ? '#7b68ee' : 'transparent'
                            }}
                          >
                            {currentDate.getDate()}
                          </Typography>
                        </Box>

                        {/* Task Pills */}
                        <Stack spacing={0.5}>
                          {dayTasks.slice(0, 3).map((task) => (
                            <Box
                              key={task._id}
                              onClick={(e) => {
                                e.stopPropagation();
                                openTaskDetailsModal(task._id);
                              }}
                              sx={{
                                px: 1,
                                py: 0.5,
                                bgcolor: `${getStatusColor(typeof task.status === 'object' ? (task.status as any)?.name : task.status)}15`,
                                borderLeft: `3px solid ${getStatusColor(typeof task.status === 'object' ? (task.status as any)?.name : task.status)}`,
                                borderRadius: 1,
                                cursor: 'pointer',
                                '&:hover': {
                                  bgcolor: `${getStatusColor(typeof task.status === 'object' ? (task.status as any)?.name : task.status)}25`,
                                }
                              }}
                            >
                              <Typography
                                fontSize="11px"
                                fontWeight={600}
                                sx={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  color: '#1f2937'
                                }}
                              >
                                {task.title}
                              </Typography>
                            </Box>
                          ))}
                          {dayTasks.length > 3 && (
                            <Typography fontSize="10px" color="text.secondary" sx={{ pl: 1 }}>
                              +{dayTasks.length - 3} more
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          )}

          {/* Timeline/Gantt View */}
          {view === "timeline" && (
            <Box sx={{ p: 3, bgcolor: 'white', minHeight: 'calc(100vh - 300px)', overflow: 'auto' }}>
              {/* Timeline Header */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                  Project Timeline
                </Typography>
              <Typography variant="body2" color="text.secondary">
                  {filteredSorted.length} tasks · Gantt chart view
              </Typography>
              </Box>

              {/* Timeline Container */}
              <Box sx={{ 
                minWidth: 1200,
                border: '1px solid #e8e9eb',
                borderRadius: 2,
                overflow: 'hidden'
              }}>
                {/* Timeline Header - Months */}
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: '250px 1fr',
                  borderBottom: '2px solid #e8e9eb',
                  bgcolor: '#f8f9fb'
                }}>
                  <Box sx={{ 
                    p: 2,
                    borderRight: '2px solid #e8e9eb',
                    fontWeight: 700,
                    fontSize: '13px',
                    color: '#6b7280'
                  }}>
                    TASK NAME
                  </Box>
                  
                  {/* Month Headers */}
                  <Box sx={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(12, 1fr)',
                  }}>
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, idx) => (
                      <Box
                        key={month}
                        sx={{
                          p: 1,
                          textAlign: 'center',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#6b7280',
                          borderRight: idx < 11 ? '1px solid #e8e9eb' : 'none'
                        }}
                      >
                        {month}
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* Timeline Rows */}
                {filteredSorted.map((task) => {
                  const startDate = task.start_date ? new Date(task.start_date) : new Date();
                  const endDate = task.deadline ? new Date(task.deadline) : new Date();
                  const startMonth = startDate.getMonth();
                  const endMonth = endDate.getMonth();
                  const duration = endMonth - startMonth + 1;
                  const gridColumnStart = startMonth + 1;
                  const gridColumnEnd = endMonth + 2;

                  return (
                    <Box
                      key={task._id}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '250px 1fr',
                        borderBottom: '1px solid #e8e9eb',
                        '&:hover': { bgcolor: '#fafbfc' }
                      }}
                    >
                      {/* Task Name */}
                      <Box
                        sx={{
                          p: 2,
                          borderRight: '2px solid #e8e9eb',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          cursor: 'pointer'
                        }}
                        onClick={() => openTaskDetailsModal(task._id)}
                      >
                        <Typography
                          fontSize="13px"
                          fontWeight={600}
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1
                          }}
                        >
                          {task.title}
                        </Typography>
                        {task.assignee_id && typeof task.assignee_id === 'object' && (
                          <Avatar sx={{ width: 24, height: 24, fontSize: '10px', bgcolor: '#7b68ee' }}>
                            {(task.assignee_id?.full_name || task.assignee_id?.email || 'U')[0].toUpperCase()}
                          </Avatar>
                        )}
                      </Box>

                      {/* Timeline Bar */}
                      <Box sx={{ 
                        display: 'grid',
                        gridTemplateColumns: 'repeat(12, 1fr)',
                        position: 'relative',
                        p: 2
                      }}>
                        <Box
                          sx={{
                            gridColumn: `${gridColumnStart} / ${gridColumnEnd}`,
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          {/* Progress Bar */}
                          <Tooltip
                            title={`${task.progress || 0}% complete · ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`}
                          >
                            <Box
                              sx={{
                                width: '100%',
                                height: 32,
                                bgcolor: `${getStatusColor(typeof task.status === 'object' ? (task.status as any)?.name : task.status)}25`,
                                border: `2px solid ${getStatusColor(typeof task.status === 'object' ? (task.status as any)?.name : task.status)}`,
                                borderRadius: 2,
                                position: 'relative',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                '&:hover': {
                                  transform: 'scaleY(1.1)',
                                  boxShadow: `0 4px 12px ${getStatusColor(typeof task.status === 'object' ? (task.status as any)?.name : task.status)}40`
                                }
                              }}
                              onClick={() => openTaskDetailsModal(task._id)}
                            >
                              {/* Progress Fill */}
                              <Box
                                sx={{
                                  position: 'absolute',
                                  left: 0,
                                  top: 0,
                                  bottom: 0,
                                  width: `${task.progress || 0}%`,
                                  bgcolor: getStatusColor(typeof task.status === 'object' ? (task.status as any)?.name : task.status),
                                  transition: 'width 0.3s ease'
                                }}
                              />
                              
                              {/* Task Info */}
                              <Box
                                sx={{
                                  position: 'relative',
                                  zIndex: 1,
                                  px: 1.5,
                                  display: 'flex',
                                  alignItems: 'center',
                                  height: '100%',
                                  gap: 1
                                }}
                              >
                                <Typography
                                  fontSize="11px"
                                  fontWeight={700}
                                  color="white"
                                  sx={{
                                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    flex: 1
                                  }}
                                >
                                  {task.progress || 0}%
                                </Typography>
                                
                                {/* Priority Indicator */}
                                {task.priority && (
                                  <FlagIcon sx={{ fontSize: 12, color: 'white', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))' }} />
                                )}
                              </Box>
                            </Box>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Box>
                  );
                })}

                {/* Empty State */}
                {filteredSorted.length === 0 && (
                  <Box sx={{ p: 8, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                      No tasks with dates
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Add start and end dates to tasks to see them in timeline view
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}


          {/* ClickUp Gantt Chart View */}
          {view === "gantt" && (
            <Box sx={{ height: 'calc(100vh - 250px)' }}>
              <DHtmlxGanttChart 
                tasks={tasks}
                dependencies={taskDependencies}
                onTaskClick={openTaskDetailsModal}
              />
            </Box>
          )}

          {/* Dependency Network Graph View */}
          {view === "network" && (
            <Box sx={{ p: 3, bgcolor: 'white', height: 'calc(100vh - 300px)' }}>
              <DependencyNetworkGraph 
                tasks={tasks as any}
                dependencies={taskDependencies}
                onTaskClick={openTaskDetailsModal}
              />
            </Box>
          )}

          {/* Dialog - Tạo/Sửa Task */}
          <Dialog 
            open={openDialog} 
            onClose={() => setOpenDialog(false)} 
            maxWidth="md" 
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 4,
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
              }
            }}
          >
            <DialogTitle 
              sx={{ 
                fontWeight: 'bold',
                fontSize: '1.5rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                py: 3,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '200px',
                  height: '200px',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                  borderRadius: '50%',
                  transform: 'translate(30%, -30%)',
                }
              }}
            >
              {editing ? '✏️ Chỉnh sửa Task' : '➕ Tạo Task mới'}
            </DialogTitle>
            <DialogContent sx={{ mt: 3, pb: 3 }}>
              <Stack spacing={3}>
                <TextField 
                  label="📝 Tên task *" 
                  value={form.title} 
                  onChange={(e) => setForm({ ...form, title: e.target.value })} 
                  fullWidth 
                  sx={{ 
                    '& .MuiOutlinedInput-root': { 
                      borderRadius: 2.5,
                      '&:hover': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#667eea'
                        }
                      }
                    } 
                  }}
                />
                <TextField 
                  label="📄 Mô tả" 
                  value={form.description} 
                  onChange={(e) => setForm({ ...form, description: e.target.value })} 
                  fullWidth 
                  multiline 
                  rows={4} 
                  sx={{ 
                    '& .MuiOutlinedInput-root': { 
                      borderRadius: 2.5
                    } 
                  }}
                />
                
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: 'text.secondary' }}>
                    📅 Thời gian
                  </Typography>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField 
                      type="date" 
                      label="Ngày bắt đầu" 
                      InputLabelProps={{ shrink: true }} 
                      value={form.start_date} 
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })} 
                      fullWidth 
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                    />
                    <TextField 
                      type="date" 
                      label="Deadline" 
                      InputLabelProps={{ shrink: true }} 
                      value={form.deadline} 
                      onChange={(e) => setForm({ ...form, deadline: e.target.value })} 
                      fullWidth 
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                    />
                    <TextField 
                      type="number" 
                      label="Estimate (giờ)" 
                      value={form.estimate} 
                      onChange={(e) => setForm({ ...form, estimate: Number(e.target.value) })} 
                      fullWidth 
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                    />
                </Stack>
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: 'text.secondary' }}>
                    ⚙️ Cấu hình
                  </Typography>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}>
                      <InputLabel>📊 Status</InputLabel>
                      <Select value={form.status} label="📊 Status" onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      {statuses.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </Select>
                  </FormControl>
                    <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}>
                      <InputLabel>🚩 Priority</InputLabel>
                      <Select value={form.priority} label="🚩 Priority" onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                      {priorities.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}>
                    <InputLabel>👤 Assignee</InputLabel>
                    <Select value={form.assignee} label="👤 Assignee" onChange={(e) => setForm({ ...form, assignee: e.target.value })}>
                      <MenuItem value=""><em>Chưa gán</em></MenuItem>
                      {teamMembers.map((member, idx) => {
                        const userId = member.user_id?._id || member._id;
                        const userName = member.user_id?.full_name || member.full_name || member.user_id?.email || member.email || 'Unknown';
                        return (
                          <MenuItem key={userId || idx} value={userId}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 24, height: 24, bgcolor: '#7b68ee', fontSize: '11px' }}>
                                {userName.charAt(0).toUpperCase()}
                              </Avatar>
                              <Typography fontSize="14px">{userName}</Typography>
                            </Box>
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Stack>
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: 'text.secondary' }}>
                    🎯 Liên kết
                  </Typography>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}>
                      <InputLabel>⚡ Feature</InputLabel>
                      <Select value={form.feature_id} label="⚡ Feature" onChange={(e) => setForm({ ...form, feature_id: e.target.value })}>
                      <MenuItem value=""><em>Không chọn</em></MenuItem>
                      {features.map((f) => <MenuItem key={f.id} value={f.id}>{f.title}</MenuItem>)}
                    </Select>
                  </FormControl>
                    <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}>
                      <InputLabel>🎯 Milestone</InputLabel>
                      <Select value={form.milestone_id} label="🎯 Milestone" onChange={(e) => setForm({ ...form, milestone_id: e.target.value })}>
                      <MenuItem value=""><em>Không chọn</em></MenuItem>
                      {milestones.map((m) => <MenuItem key={m.id} value={m.id}>{m.title}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Stack>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 3, gap: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button 
                onClick={() => setOpenDialog(false)}
                variant="outlined"
                sx={{ 
                  borderRadius: 2.5,
                  px: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: 'divider',
                  color: 'text.secondary'
                }}
              >
                Hủy
              </Button>
              <Button 
                disabled={!form.title} 
                variant="contained" 
                onClick={saveTask}
                sx={{
                  borderRadius: 2.5,
                  px: 4,
                  textTransform: 'none',
                  fontWeight: 700,
                  bgcolor: '#667eea',
                  boxShadow: '0 4px 14px rgba(102, 126, 234, 0.4)',
                  '&:hover': {
                    bgcolor: '#5568d3',
                    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)'
                  }
                }}
              >
                {editing ? '💾 Cập nhật' : '➕ Tạo Task'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Task Details Modal */}
          <TaskDetailsModal 
            open={openTaskDetails}
            taskId={selectedTaskId}
            onClose={() => {
              setOpenTaskDetails(false);
              setSelectedTaskId(null);
            }}
            onUpdate={loadAll}
          />

          {/* Dependency Violation Warning Dialog */}
          <Dialog
            open={dependencyViolationDialog.open}
            onClose={() => setDependencyViolationDialog({ open: false, violations: [], taskId: '', newStatus: '' })}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: { borderRadius: 3 }
            }}
          >
            <DialogTitle sx={{ fontWeight: 700, pb: 2, bgcolor: '#fef3c7', color: '#92400e' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: '50%', 
                  bgcolor: '#fbbf24', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '20px'
                }}>
                  ⚠️
                </Box>
                <Typography variant="h6" fontWeight={700}>Dependency Violation</Typography>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                Cannot change status due to the following dependency constraints:
              </Typography>
              
              <Stack spacing={1.5}>
                {dependencyViolationDialog.violations.map((violation, index) => (
                  <Box 
                    key={index}
                    sx={{ 
                      p: 2, 
                      bgcolor: '#fffbeb',
                      border: '1px solid #fcd34d',
                      borderRadius: 2,
                      borderLeft: '4px solid #f59e0b'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Chip 
                        label={violation.type}
                        size="small"
                        sx={{ 
                          height: 20,
                          fontSize: '10px',
                          fontWeight: 700,
                          bgcolor: '#fbbf24',
                          color: 'white'
                        }}
                      />
                      <Typography variant="caption" fontWeight={600} color="text.secondary">
                        {violation.type === 'FS' && 'Finish-to-Start'}
                        {violation.type === 'FF' && 'Finish-to-Finish'}
                        {violation.type === 'SS' && 'Start-to-Start'}
                        {violation.type === 'SF' && 'Start-to-Finish'}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {violation.message}
                    </Typography>
                  </Box>
                ))}
              </Stack>

              <Box sx={{ mt: 3, p: 2, bgcolor: '#f3f4f6', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'start', gap: 1 }}>
                  <span style={{ fontSize: '16px' }}>💡</span>
                  <span>
                    <strong>Options:</strong><br/>
                    • Complete the blocking tasks first, or<br/>
                    • Click "Force Update" to override this constraint (not recommended)
                  </span>
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 2 }}>
              <Button 
                onClick={() => setDependencyViolationDialog({ open: false, violations: [], taskId: '', newStatus: '' })}
                sx={{ 
                  textTransform: 'none',
                  fontWeight: 600,
                  color: 'text.secondary'
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="warning"
                onClick={async () => {
                  try {
                    // Force update with force_update flag
                    await axiosInstance.patch(`/api/tasks/${dependencyViolationDialog.taskId}`, {
                      status: dependencyViolationDialog.newStatus,
                      force_update: true
                    });
                    await loadAll();
                    setDependencyViolationDialog({ open: false, violations: [], taskId: '', newStatus: '' });
                  } catch (error: any) {
                    setError(error?.response?.data?.message || 'Không thể cập nhật status');
                    setDependencyViolationDialog({ open: false, violations: [], taskId: '', newStatus: '' });
                  }
                }}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  bgcolor: '#f59e0b',
                  '&:hover': { bgcolor: '#d97706' }
                }}
              >
                ⚡ Force Update Anyway
              </Button>
            </DialogActions>
          </Dialog>

          {/* Dependencies Dialog */}
          <Dialog 
            open={openDependencyDialog} 
            onClose={() => {
              setOpenDependencyDialog(false);
              setDependencyTaskId(null);
            }}
            maxWidth="md" 
            fullWidth
            PaperProps={{
              sx: { borderRadius: 3 }
            }}
          >
            <DialogTitle sx={{ fontWeight: 700, pb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinkIcon sx={{ color: '#7b68ee' }} />
                Task Dependencies
              </Box>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={3} sx={{ mt: 1 }}>
                {/* Current Task Info */}
                {dependencyTaskId && (
                  <Box sx={{ p: 2, bgcolor: '#f8f9fb', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Managing dependencies for:
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {tasks.find(t => t._id === dependencyTaskId)?.title}
                    </Typography>
                  </Box>
                )}

                {/* Dependencies (tasks this task blocks) */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BlockIcon sx={{ fontSize: 18, color: '#ef4444' }} />
                      This task blocks
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setDependencyForm({ depends_on_task_id: '', dependency_type: 'FS', lag_days: 0 });
                      }}
                      sx={{ 
                        textTransform: 'none',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                    >
                      Add
                    </Button>
                  </Box>

                  {taskDependencies[dependencyTaskId || '']?.dependencies?.length > 0 ? (
                    <Stack spacing={1}>
                      {taskDependencies[dependencyTaskId || ''].dependencies.map((dep: any) => {
                        const depTypeLabels: Record<string, { label: string; color: string; icon: string }> = {
                          'FS': { label: 'FS', color: '#3b82f6', icon: '→' },
                          'FF': { label: 'FF', color: '#8b5cf6', icon: '⟹' },
                          'SS': { label: 'SS', color: '#10b981', icon: '⇉' },
                          'SF': { label: 'SF', color: '#f59e0b', icon: '↷' },
                          'relates_to': { label: 'Link', color: '#6b7280', icon: '⟷' }
                        };
                        const depInfo = depTypeLabels[dep.dependency_type] || depTypeLabels['FS'];
                        
                        return (
                          <Box 
                            key={dep._id}
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              p: 1.5,
                              border: '1px solid #e8e9eb',
                              borderRadius: 2,
                              '&:hover': { bgcolor: '#fafbfc' }
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                              {/* Dependency Type Badge */}
                              <Tooltip title={`${dep.dependency_type} dependency`}>
                                <Chip 
                                  label={depInfo.label}
                                  size="small"
                                  sx={{ 
                                    height: 22,
                                    minWidth: 40,
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    bgcolor: `${depInfo.color}15`,
                                    color: depInfo.color,
                                    border: `1px solid ${depInfo.color}40`
                                  }}
                                />
                              </Tooltip>
                              
                              {/* Arrow Icon */}
                              <ArrowForwardIcon sx={{ fontSize: 14, color: '#d1d5db' }} />
                              
                              {/* Task Title */}
                              <Typography fontSize="14px" fontWeight={500} sx={{ flex: 1 }}>
                                {dep.depends_on_task_id?.title}
                              </Typography>
                              
                              {/* Status */}
                              <Chip 
                                label={dep.depends_on_task_id?.status} 
                                size="small" 
                                sx={{ height: 20, fontSize: '11px' }}
                              />
                              
                              {/* Lag indicator */}
                              {dep.lag_days !== 0 && (
                                <Tooltip title={dep.lag_days > 0 ? `${dep.lag_days} days delay` : `${Math.abs(dep.lag_days)} days lead time`}>
                                  <Chip 
                                    label={dep.lag_days > 0 ? `+${dep.lag_days}d` : `${dep.lag_days}d`}
                                    size="small"
                                    sx={{ 
                                      height: 20, 
                                      fontSize: '10px',
                                      bgcolor: dep.lag_days > 0 ? '#fef3c7' : '#dbeafe',
                                      color: dep.lag_days > 0 ? '#92400e' : '#1e40af',
                                      fontWeight: 600
                                    }}
                                  />
                                </Tooltip>
                              )}
                            </Box>
                            
                            {/* Delete Button */}
                            <IconButton
                              size="small"
                              onClick={() => removeDependency(dependencyTaskId || '', dep._id)}
                              sx={{ 
                                color: '#9ca3af',
                                '&:hover': { 
                                  color: '#ef4444',
                                  bgcolor: '#fee2e2'
                                }
                              }}
                            >
                              <DeleteIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>
                        );
                      })}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      No blocking dependencies
                    </Typography>
                  )}

                  {/* Add new dependency form */}
                  <Box sx={{ mt: 2, p: 2.5, bgcolor: '#f8f9fb', borderRadius: 2, border: '1px dashed #d1d5db' }}>
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 2, color: '#6b7280' }}>
                      Add New Dependency
                    </Typography>
                    <Stack spacing={2}>
                      {/* Row 1: Task Selection */}
                      <FormControl size="small" fullWidth>
                        <InputLabel>Select Task</InputLabel>
                        <Select
                          value={dependencyForm.depends_on_task_id}
                          label="Select Task"
                          onChange={(e) => setDependencyForm({ ...dependencyForm, depends_on_task_id: e.target.value })}
                        >
                          {tasks
                            .filter(task => task._id !== dependencyTaskId)
                            .map(task => (
                              <MenuItem key={task._id} value={task._id}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography fontSize="14px">{task.title}</Typography>
                                  <Chip 
                                    label={typeof task.status === 'object' ? (task.status as any)?.name : task.status} 
                                    size="small" 
                                    sx={{ height: 18, fontSize: '10px' }} 
                                  />
                                </Box>
                              </MenuItem>
                            ))}
                        </Select>
                      </FormControl>

                      {/* Row 2: Dependency Type and Lag */}
                      <Stack direction="row" spacing={1.5}>
                        <FormControl size="small" sx={{ flex: 2 }}>
                          <InputLabel>Dependency Type</InputLabel>
                          <Select
                            value={dependencyForm.dependency_type}
                            label="Dependency Type"
                            onChange={(e) => setDependencyForm({ ...dependencyForm, dependency_type: e.target.value })}
                          >
                            <MenuItem value="FS">
                              <Box>
                                <Typography fontSize="13px" fontWeight={600}>Finish-to-Start (FS)</Typography>
                                <Typography fontSize="11px" color="text.secondary">
                                  Predecessor must finish before successor starts
                                </Typography>
                              </Box>
                            </MenuItem>
                            <MenuItem value="FF">
                              <Box>
                                <Typography fontSize="13px" fontWeight={600}>Finish-to-Finish (FF)</Typography>
                                <Typography fontSize="11px" color="text.secondary">
                                  Both tasks must finish together
                                </Typography>
                              </Box>
                            </MenuItem>
                            <MenuItem value="SS">
                              <Box>
                                <Typography fontSize="13px" fontWeight={600}>Start-to-Start (SS)</Typography>
                                <Typography fontSize="11px" color="text.secondary">
                                  Both tasks must start together
                                </Typography>
                              </Box>
                            </MenuItem>
                            <MenuItem value="SF">
                              <Box>
                                <Typography fontSize="13px" fontWeight={600}>Start-to-Finish (SF)</Typography>
                                <Typography fontSize="11px" color="text.secondary">
                                  Predecessor must start before successor finishes
                                </Typography>
                              </Box>
                            </MenuItem>
                            <MenuItem value="relates_to">
                              <Box>
                                <Typography fontSize="13px" fontWeight={600}>Related To</Typography>
                                <Typography fontSize="11px" color="text.secondary">
                                  Simple reference link (no constraint)
                                </Typography>
                              </Box>
                            </MenuItem>
                          </Select>
                        </FormControl>

                        <TextField
                          size="small"
                          label="Lag (days)"
                          type="number"
                          value={dependencyForm.lag_days}
                          onChange={(e) => setDependencyForm({ ...dependencyForm, lag_days: parseInt(e.target.value) || 0 })}
                          sx={{ flex: 1 }}
                          inputProps={{ min: -30, max: 30 }}
                          helperText={
                            dependencyForm.lag_days > 0 
                              ? `+${dependencyForm.lag_days}d delay` 
                              : dependencyForm.lag_days < 0 
                                ? `${dependencyForm.lag_days}d lead` 
                                : 'No lag'
                          }
                        />
                      </Stack>

                      {/* Submit Button */}
                      <Button
                        variant="contained"
                        fullWidth
                        disabled={!dependencyForm.depends_on_task_id}
                        onClick={async () => {
                          if (dependencyTaskId && dependencyForm.depends_on_task_id) {
                            await addDependency(
                              dependencyTaskId, 
                              dependencyForm.depends_on_task_id, 
                              dependencyForm.dependency_type,
                              dependencyForm.lag_days
                            );
                            setDependencyForm({ depends_on_task_id: '', dependency_type: 'FS', lag_days: 0 });
                          }
                        }}
                        sx={{
                          bgcolor: '#7b68ee',
                          textTransform: 'none',
                          fontWeight: 600,
                          py: 1,
                          '&:hover': { bgcolor: '#6952d6' }
                        }}
                      >
                        <AddIcon sx={{ mr: 0.5, fontSize: 18 }} />
                        Add Dependency
                      </Button>
                    </Stack>
                  </Box>
                </Box>

                <Divider />

                {/* Blocked by (tasks that block this task) */}
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BlockIcon sx={{ fontSize: 18, color: '#f59e0b' }} />
                    Blocked by
                  </Typography>

                  {taskDependencies[dependencyTaskId || '']?.dependents?.length > 0 ? (
                    <Stack spacing={1}>
                      {taskDependencies[dependencyTaskId || ''].dependents.map((dep: any) => {
                        const depTypeLabels: Record<string, { label: string; color: string }> = {
                          'FS': { label: 'FS', color: '#3b82f6' },
                          'FF': { label: 'FF', color: '#8b5cf6' },
                          'SS': { label: 'SS', color: '#10b981' },
                          'SF': { label: 'SF', color: '#f59e0b' },
                          'relates_to': { label: 'Link', color: '#6b7280' }
                        };
                        const depInfo = depTypeLabels[dep.dependency_type] || depTypeLabels['FS'];
                        
                        return (
                          <Box 
                            key={dep._id}
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 1.5,
                              p: 1.5,
                              border: '1px solid #fed7aa',
                              borderRadius: 2,
                              bgcolor: '#fffbeb'
                            }}
                          >
                            {/* Dependency Type Badge */}
                            <Tooltip title={`${dep.dependency_type} dependency`}>
                              <Chip 
                                label={depInfo.label}
                                size="small"
                                sx={{ 
                                  height: 22,
                                  minWidth: 40,
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  bgcolor: `${depInfo.color}15`,
                                  color: depInfo.color,
                                  border: `1px solid ${depInfo.color}40`
                                }}
                              />
                            </Tooltip>
                            
                            {/* Block Icon */}
                            <BlockIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
                            
                            {/* Task Title */}
                            <Typography fontSize="14px" fontWeight={500} sx={{ flex: 1 }}>
                              {dep.task_id?.title}
                            </Typography>
                            
                            {/* Status */}
                            <Chip 
                              label={dep.task_id?.status} 
                              size="small" 
                              sx={{ height: 20, fontSize: '11px' }}
                            />
                            
                            {/* Lag indicator */}
                            {dep.lag_days !== 0 && (
                              <Tooltip title={dep.lag_days > 0 ? `${dep.lag_days} days delay` : `${Math.abs(dep.lag_days)} days lead time`}>
                                <Chip 
                                  label={dep.lag_days > 0 ? `+${dep.lag_days}d` : `${dep.lag_days}d`}
                                  size="small"
                                  sx={{ 
                                    height: 20, 
                                    fontSize: '10px',
                                    bgcolor: dep.lag_days > 0 ? '#fef3c7' : '#dbeafe',
                                    color: dep.lag_days > 0 ? '#92400e' : '#1e40af',
                                    fontWeight: 600
                                  }}
                                />
                              </Tooltip>
                            )}
                          </Box>
                        );
                      })}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      This task is not blocked by any other tasks
                    </Typography>
                  )}
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 2 }}>
              <Button 
                onClick={() => {
                  setOpenDependencyDialog(false);
                  setDependencyTaskId(null);
                }}
                sx={{ 
                  textTransform: 'none',
                  fontWeight: 600,
                  color: 'text.secondary'
                }}
              >
                Close
              </Button>
            </DialogActions>
          </Dialog>

        </div>
      </main>
    </div>
  );
}


