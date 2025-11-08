"use client";

import React, { Fragment, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import axiosInstance from "../../../../../ultis/axios";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";
import TaskDetailsModal from "@/components/TaskDetailsModal";
import ProjectBreadcrumb from "@/components/ProjectBreadcrumb";
import dynamic from 'next/dynamic';
import './tasks.module.css';

const ClickUpGanttChart = dynamic(
  () => import('@/components/ClickUpGanttChart'),
  { ssr: false }
);

const DHtmlxGanttChart = dynamic(
  () => import('@/components/DHtmlxGanttChart'),
  { ssr: false }
);

const ProjectCICDView = dynamic(
  () => import('@/components/ProjectCICDView'),
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
  Badge,
  Popover,
  Checkbox,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
  import FlagIcon from "@mui/icons-material/Flag";
  import TuneIcon from "@mui/icons-material/Tune";
  import ViewColumnIcon from "@mui/icons-material/ViewColumn";
  import ListIcon from "@mui/icons-material/List";
  import ViewKanbanIcon from "@mui/icons-material/ViewKanban";
  import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
  import DashboardIcon from "@mui/icons-material/Dashboard";
  import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PersonIcon from "@mui/icons-material/Person";
import LinkIcon from "@mui/icons-material/Link";
import BlockIcon from "@mui/icons-material/Block";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CloseIcon from "@mui/icons-material/Close";

type Task = {
  _id: string;
  title: string;
  description?: string;
  project_id: string;
  feature_id?: string | { _id: string; title: string };
  milestone_id?: string | { _id: string; title: string };
  status?: string | { _id: string; name: string };
  priority?: string | { _id: string; name: string };
  assignee?: string | { _id: string; name: string };
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
  const searchParams = useSearchParams();
  const projectId = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);
  const featureIdFromUrl = searchParams.get('featureId');
  const functionIdFromUrl = searchParams.get('functionId');

  const [view, setView] = useState<"table" | "kanban" | "calendar" | "gantt" | "cicd">("table");
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
  const [filterFunction, setFilterFunction] = useState<string>("all");
  const [filterMilestone, setFilterMilestone] = useState<string>("all");
  const [filterDateRange, setFilterDateRange] = useState<{ from?: string; to?: string }>({});
  const [sortBy, setSortBy] = useState<string>("deadline:asc");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLButtonElement | null>(null);

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
  
  // functions for selected feature
  const [functions, setFunctions] = useState<any[]>([]);
  
  // Filter options - fetch from backend
  const [allFeatures, setAllFeatures] = useState<any[]>([]);
  const [allMilestones, setAllMilestones] = useState<any[]>([]);
  const [allStatuses, setAllStatuses] = useState<any[]>([]);
  const [allPriorities, setAllPriorities] = useState<any[]>([]);
  const [allFunctions, setAllFunctions] = useState<any[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "",
    priority: "",
    assignee: "",
    feature_id: "",
    function_id: "",
    milestone_id: "",
    start_date: "",
    deadline: "",
    estimate: 0,
  });

  useEffect(() => {
    if (!projectId) return;
    loadAll();
    loadFilterOptions();
  }, [projectId]);

  // Auto-fetch when filters change
  useEffect(() => {
    if (!projectId) return;
    loadAll();
  }, [filterAssignee, filterStatus, filterPriority, filterFeature, filterMilestone, debouncedSearch, sortBy, page, pageSize]);

  useEffect(() => {
    if (!projectId) return;
    loadTeamMembers();
  }, [projectId]);

  // Load functions when feature_id changes
  useEffect(() => {
    if (form.feature_id) {
      loadFunctionsByFeature(form.feature_id);
    } else {
      setFunctions([]);
      setForm(prev => ({ ...prev, function_id: "" }));
    }
  }, [form.feature_id]);

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

  // Auto-filter by feature when featureId is in URL
  useEffect(() => {
    if (featureIdFromUrl && allFeatures.length > 0) {
      const featureExists = allFeatures.some(f => f._id === featureIdFromUrl);
      if (featureExists) {
        setFilterFeature(featureIdFromUrl);
      }
    }
  }, [featureIdFromUrl, allFeatures]);

  // Auto-filter by function when functionId is in URL
  useEffect(() => {
    if (functionIdFromUrl && allFunctions.length > 0) {
      const functionExists = allFunctions.some((f: any) => f._id === functionIdFromUrl);
      if (functionExists) {
        setFilterFunction(functionIdFromUrl);
      }
    }
  }, [functionIdFromUrl, allFunctions]);

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

  const loadFunctionsByFeature = async (featureId: string) => {
    try {
      if (!featureId) {
        setFunctions([]);
        return;
      }
      const response = await axiosInstance.get(`/api/projects/${projectId}/features/${featureId}/functions`);
      setFunctions(response.data || []);
    } catch (e: any) {
      console.error("Error loading functions:", e);
      setFunctions([]);
    }
  };

  const loadFilterOptions = async () => {
    try {
      // Fetch all features, milestones, functions, and settings for filters
      const [featuresRes, milestonesRes, functionsRes, settingsRes] = await Promise.all([
        axiosInstance.get(`/api/projects/${projectId}/features`).catch(() => ({ data: [] })),
        axiosInstance.get(`/api/projects/${projectId}/milestones`).catch(() => ({ data: [] })),
        axiosInstance.get(`/api/projects/${projectId}/functions`).catch(() => ({ data: [] })),
        axiosInstance.get(`/api/settings`).catch(() => ({ data: [] })),
      ]);

      // Set features
      const featuresData = Array.isArray(featuresRes.data) ? featuresRes.data : featuresRes.data?.features || [];
      setAllFeatures(featuresData);

      // Set milestones
      const milestonesData = Array.isArray(milestonesRes.data) ? milestonesRes.data : milestonesRes.data?.milestones || [];
      setAllMilestones(milestonesData);

      // Set functions
      const functionsData = Array.isArray(functionsRes.data) ? functionsRes.data : functionsRes.data?.functions || [];
      setAllFunctions(functionsData);

      // Set statuses and priorities from settings
      const settingsData = Array.isArray(settingsRes.data) ? settingsRes.data : [];
      
      // Status settings (type_id = 2)
      const statusSettings = settingsData.filter((s: any) => s.type_id === 2 || s.type_id?._id === 2);
      setAllStatuses(statusSettings);

      // Priority settings (type_id = 3)
      const prioritySettings = settingsData.filter((s: any) => s.type_id === 3 || s.type_id?._id === 3);
      setAllPriorities(prioritySettings);

    } catch (e: any) {
      console.error("Error loading filter options:", e);
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
      function_id: "",
      milestone_id: "",
      start_date: "",
      deadline: "",
      estimate: 0,
    });
    setFunctions([]);
    setOpenDialog(true);
  };

  const openEdit = (t: Task) => {
    setEditing(t);
    const featureId = typeof t.feature_id === "object" ? (t.feature_id as any)?._id : (t.feature_id as any) || "";
    const functionId = typeof (t as any).function_id === "object" ? ((t as any).function_id as any)?._id : ((t as any).function_id as any) || "";
    
    setForm({
      title: t.title,
      description: t.description || "",
      status: typeof t.status === "object" ? (t.status as any)?._id : (t.status as any) || "",
      priority: typeof t.priority === "object" ? (t.priority as any)?._id : (t.priority as any) || "",
      assignee: typeof t.assignee === "object" ? (t.assignee as any)?._id : (t.assignee as any) || "",
      feature_id: featureId,
      function_id: functionId,
      milestone_id: typeof t.milestone_id === "object" ? (t.milestone_id as any)?._id : (t.milestone_id as any) || "",
      start_date: t.start_date ? new Date(t.start_date).toISOString().split("T")[0] : "",
      deadline: t.deadline ? new Date(t.deadline).toISOString().split("T")[0] : "",
      estimate: t.estimate || 0,
    });
    
    // Load functions for the feature
    if (featureId) {
      loadFunctionsByFeature(featureId);
    }
    
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
        function_id: form.function_id || undefined,
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
      const response = await axiosInstance.post(`/api/tasks/${taskId}/dependencies`, {
        depends_on_task_id: dependsOnTaskId,
        dependency_type: type,
        lag_days: lagDays
      });
      
      // Check for warning (non-blocking)
      if (response.data.warning) {
        const warning = response.data.warning;
        console.warn('Dependency created with warning:', warning.message);
      }
      
      await loadTaskDependencies(taskId);
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
              // Retry adding dependency
              await addDependency(taskId, dependsOnTaskId, type, lagDays);
            } catch (fixError: any) {
              setError(fixError?.response?.data?.message || 'Không thể tự động điều chỉnh');
            }
          }
        }
      } else {
        setError(errorData?.message || 'Không thể tạo dependency');
      }
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

  // Use fetched filter options
  const features = allFeatures.map(f => ({ id: f._id, title: f.title }));
  const milestones = allMilestones.map(m => ({ id: m._id, title: m.title }));
  // Keep full objects with _id and name for status/priority
  const statuses = allStatuses;
  const priorities = allPriorities;

  const filteredSorted = useMemo(() => {
    let filtered = tasks;
    
    // Additional client-side filtering for Function (since backend doesn't support it yet)
    if (filterFunction !== 'all') {
      filtered = filtered.filter(task => {
        const taskFunctionId = typeof (task as any).function_id === 'object' 
          ? ((task as any).function_id as any)?._id 
          : (task as any).function_id;
        return taskFunctionId === filterFunction;
      });
    }
    
    return filtered;
  }, [tasks, filterFunction]);

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
        <main className="p-4 md:p-6">
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
      <main>
        <div className="w-full">
          {/* Breadcrumb Navigation */}
          <Box sx={{ bgcolor: 'white', px: 3, pt: 2, borderBottom: '1px solid #e8e9eb' }}>
            <ProjectBreadcrumb 
              projectId={projectId}
              items={[
                { label: 'Tasks', icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> }
              ]}
            />
          </Box>

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
                {/* Quick Navigation */}
                <Button
                  variant="outlined"
                  onClick={() => router.push(`/projects/${projectId}`)}
                  sx={{
                    textTransform: 'none',
                    fontSize: '13px',
                    fontWeight: 600,
                    borderColor: '#e8e9eb',
                    color: '#49516f',
                    '&:hover': {
                      borderColor: '#7b68ee',
                      bgcolor: '#f3f0ff',
                    }
                  }}
                >
                  Milestones
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => router.push(`/projects/${projectId}/features`)}
                  sx={{
                    textTransform: 'none',
                    fontSize: '13px',
                    fontWeight: 600,
                    borderColor: '#e8e9eb',
                    color: '#49516f',
                    '&:hover': {
                      borderColor: '#7b68ee',
                      bgcolor: '#f3f0ff',
                    }
                  }}
                >
                  Features
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => router.push(`/projects/${projectId}/functions`)}
                  sx={{
                    textTransform: 'none',
                    fontSize: '13px',
                    fontWeight: 600,
                    borderColor: '#e8e9eb',
                    color: '#49516f',
                    '&:hover': {
                      borderColor: '#7b68ee',
                      bgcolor: '#f3f0ff',
                    }
                  }}
                >
                  Functions
                </Button>
                
                <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                
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

          {/* Quick Tips & Stats */}
          <Box sx={{ 
            bgcolor: '#f0f5ff', 
            px: 3, 
            py: 1.5, 
            borderBottom: '1px solid #dbeafe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 1
          }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography sx={{ fontSize: '11px', color: '#9ca3af', fontWeight: 500 }}>
                Showing: {filteredSorted.length} {filteredSorted.length !== tasks.length && `of ${tasks.length}`} tasks
              </Typography>
              <Typography sx={{ fontSize: '11px', color: '#9ca3af', fontWeight: 500 }}>
                Team: {teamMembers.length}
              </Typography>
            </Stack>
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
                onClick={() => router.push(`/projects/${projectId}/tasks/dashboard`)}
                startIcon={<DashboardIcon fontSize="small" />}
                sx={{
                  minWidth: 'auto',
                  px: 2,
                  py: 0.75,
                  color: '#49516f',
                  bgcolor: 'transparent',
                  textTransform: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: 1.5,
                  '&:hover': {
                    bgcolor: '#f3f4f6',
                  }
                }}
              >
                Dashboard
              </Button>
              <Box sx={{ width: '1px', height: 24, bgcolor: '#e8e9eb', mx: 0.5 }} />
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
                startIcon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
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
                onClick={() => setView('cicd')}
                startIcon={<RocketLaunchIcon fontSize="small" />}
                sx={{
                  minWidth: 'auto',
                  px: 2,
                  py: 0.75,
                  color: view === 'cicd' ? '#7b68ee' : '#49516f',
                  bgcolor: view === 'cicd' ? '#f3f0ff' : 'transparent',
                  textTransform: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: 1.5,
                  '&:hover': {
                    bgcolor: view === 'cicd' ? '#f3f0ff' : '#f3f4f6',
                  }
                }}
              >
                CI/CD
              </Button>
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="center">
              {/* Quick Search */}
              <TextField
                placeholder="Quick search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="small"
                sx={{ 
                  width: 200,
                  '& .MuiOutlinedInput-root': { 
                    fontSize: '13px',
                    borderRadius: 2,
                    bgcolor: '#f8f9fb',
                    height: 32,
                    '& fieldset': { borderColor: 'transparent' },
                    '&:hover': { 
                      bgcolor: '#f3f4f6',
                      '& fieldset': { borderColor: '#e8e9eb' }
                    },
                    '&.Mui-focused': { 
                      bgcolor: 'white',
                      '& fieldset': { borderColor: '#7b68ee', borderWidth: '2px' }
                    }
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
              
              <Badge 
                badgeContent={[filterAssignee !== 'all', filterStatus !== 'all', filterPriority !== 'all', 
                  filterFeature !== 'all', filterFunction !== 'all', filterMilestone !== 'all', search].filter(Boolean).length || 0}
                color="primary"
                sx={{
                  '& .MuiBadge-badge': {
                    background: 'linear-gradient(135deg, #7b68ee, #9b59b6)',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '10px',
                    boxShadow: '0 2px 8px rgba(123, 104, 238, 0.3)',
                    border: '2px solid white',
                  }
                }}
              >
                <Button
                  variant={filterAnchorEl ? "contained" : "outlined"}
                  size="small"
                  startIcon={<TuneIcon fontSize="small" />}
                  onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '13px',
                    borderColor: filterAnchorEl ? 'transparent' : '#e2e8f0',
                    borderWidth: '1.5px',
                    color: filterAnchorEl ? 'white' : '#49516f',
                    background: filterAnchorEl ? 'linear-gradient(135deg, #7b68ee, #9b59b6)' : 'white',
                    height: 36,
                    px: 2,
                    borderRadius: 2.5,
                    boxShadow: filterAnchorEl ? '0 4px 12px rgba(123, 104, 238, 0.3)' : 'none',
                    '&:hover': {
                      borderColor: filterAnchorEl ? 'transparent' : '#b4a7f5',
                      background: filterAnchorEl ? 'linear-gradient(135deg, #6b5dd6, #8b49a6)' : 'linear-gradient(to bottom, white, #f9fafb)',
                      boxShadow: '0 4px 12px rgba(123, 104, 238, 0.2)',
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  Filters
                </Button>
              </Badge>
            </Stack>
          </Box>

          {/* Active Filters Chips - Modern Enhanced Style */}
          {(filterAssignee !== 'all' || filterStatus !== 'all' || filterPriority !== 'all' || 
            filterFeature !== 'all' || filterFunction !== 'all' || filterMilestone !== 'all' || search) && (
            <Box 
              sx={{ 
                background: 'linear-gradient(to bottom, #ffffff, #fafbff)',
                px: 3,
                py: 2,
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <Stack direction="row" spacing={1.5} flexWrap="wrap" alignItems="center" useFlexGap>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  bgcolor: 'rgba(123, 104, 238, 0.08)',
                  border: '1px solid rgba(123, 104, 238, 0.15)',
                }}>
                  <Box sx={{ 
                    width: 6, 
                    height: 6, 
                    borderRadius: '50%', 
                    bgcolor: '#7b68ee',
                    animation: 'pulse 2s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.5 },
                    }
                  }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#7b68ee', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Active Filters
                </Typography>
                </Box>
                
                {search && (
                  <Chip
                    label={`"${search}"`}
                    size="small"
                    onDelete={() => setSearch('')}
                    icon={<SearchIcon sx={{ fontSize: 14 }} />}
                    sx={{
                      bgcolor: 'white',
                      border: '1.5px solid #e2e8f0',
                      fontWeight: 600,
                      fontSize: '12px',
                      px: 0.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: '#7b68ee',
                        boxShadow: '0 2px 8px rgba(123, 104, 238, 0.12)',
                      },
                      '& .MuiChip-deleteIcon': { 
                        color: '#9ca3af', 
                        fontSize: '18px',
                        transition: 'all 0.2s ease',
                        '&:hover': { 
                          color: '#ef4444',
                          transform: 'scale(1.1)'
                        } 
                      }
                    }}
                  />
                )}
                
                {filterFeature !== 'all' && (
                  <Chip
                    icon={
                      <Box sx={{ 
                        width: 18, 
                        height: 18, 
                        borderRadius: 1, 
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px'
                      }}>
                        ⚡
                      </Box>
                    }
                    label={features.find(f => f.id === filterFeature)?.title || 'Feature'}
                    size="small"
                    onDelete={() => {
                      setFilterFeature('all');
                      setFilterFunction('all');
                    }}
                    sx={{
                      bgcolor: 'white',
                      border: '1.5px solid #bfdbfe',
                      color: '#1e40af',
                      fontWeight: 600,
                      fontSize: '12px',
                      px: 0.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: '#3b82f6',
                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)',
                        bgcolor: '#eff6ff',
                      },
                      '& .MuiChip-icon': { ml: 0.5 },
                      '& .MuiChip-deleteIcon': { 
                        color: '#60a5fa', 
                        fontSize: '18px',
                        transition: 'all 0.2s ease',
                        '&:hover': { 
                          color: '#ef4444',
                          transform: 'scale(1.1)'
                        } 
                      }
                    }}
                  />
                )}
                
                {filterFunction !== 'all' && (
                  <Chip
                    icon={
                      <Box sx={{ 
                        width: 18, 
                        height: 18, 
                        borderRadius: 1, 
                        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px'
                      }}>
                        🔧
                      </Box>
                    }
                    label={functions.find(fn => fn._id === filterFunction)?.title || 'Function'}
                    size="small"
                    onDelete={() => setFilterFunction('all')}
                    sx={{
                      bgcolor: 'white',
                      border: '1.5px solid #ddd6fe',
                      color: '#5b21b6',
                      fontWeight: 600,
                      fontSize: '12px',
                      px: 0.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: '#8b5cf6',
                        boxShadow: '0 2px 8px rgba(139, 92, 246, 0.2)',
                        bgcolor: '#f5f3ff',
                      },
                      '& .MuiChip-icon': { ml: 0.5 },
                      '& .MuiChip-deleteIcon': { 
                        color: '#a78bfa', 
                        fontSize: '18px',
                        transition: 'all 0.2s ease',
                        '&:hover': { 
                          color: '#ef4444',
                          transform: 'scale(1.1)'
                        } 
                      }
                    }}
                  />
                )}
                
                {filterMilestone !== 'all' && (
                  <Chip
                    icon={
                      <Box sx={{ 
                        width: 18, 
                        height: 18, 
                        borderRadius: 1, 
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px'
                      }}>
                        🎯
                      </Box>
                    }
                    label={milestones.find(m => m.id === filterMilestone)?.title || 'Milestone'}
                    size="small"
                    onDelete={() => setFilterMilestone('all')}
                    sx={{
                      bgcolor: 'white',
                      border: '1.5px solid #fed7aa',
                      color: '#92400e',
                      fontWeight: 600,
                      fontSize: '12px',
                      px: 0.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: '#f59e0b',
                        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.2)',
                        bgcolor: '#fffbeb',
                      },
                      '& .MuiChip-icon': { ml: 0.5 },
                      '& .MuiChip-deleteIcon': { 
                        color: '#fbbf24', 
                        fontSize: '18px',
                        transition: 'all 0.2s ease',
                        '&:hover': { 
                          color: '#ef4444',
                          transform: 'scale(1.1)'
                        } 
                      }
                    }}
                  />
                )}
                
                {filterAssignee !== 'all' && (
                  <Chip
                    icon={<PersonIcon sx={{ fontSize: 16, color: '#7b68ee' }} />}
                    label={teamMembers.find(m => (m.user_id?._id || m._id) === filterAssignee)?.user_id?.full_name || 
                           teamMembers.find(m => (m.user_id?._id || m._id) === filterAssignee)?.full_name || 'Assignee'}
                    size="small"
                    onDelete={() => setFilterAssignee('all')}
                    sx={{
                      bgcolor: 'white',
                      border: '1.5px solid #e9d5ff',
                      color: '#6b21a8',
                      fontWeight: 600,
                      fontSize: '12px',
                      px: 0.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: '#a855f7',
                        boxShadow: '0 2px 8px rgba(168, 85, 247, 0.2)',
                        bgcolor: '#faf5ff',
                      },
                      '& .MuiChip-deleteIcon': { 
                        color: '#c084fc', 
                        fontSize: '18px',
                        transition: 'all 0.2s ease',
                        '&:hover': { 
                          color: '#ef4444',
                          transform: 'scale(1.1)'
                        } 
                      }
                    }}
                  />
                )}
                
              {filterStatus !== 'all' && (() => {
                const statusName = allStatuses.find(s => s._id === filterStatus)?.name || 'Status';
                return (
                  <Chip
                  icon={<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: getStatusColor(statusName), boxShadow: `0 0 0 2px ${getStatusColor(statusName)}20` }} />}
                  label={statusName}
                    size="small"
                    onDelete={() => setFilterStatus('all')}
                    sx={{
                    bgcolor: 'white',
                    border: '1.5px solid #ccfbf1',
                      color: '#115e59',
                      fontWeight: 600,
                      fontSize: '12px',
                    px: 0.5,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#14b8a6',
                      boxShadow: '0 2px 8px rgba(20, 184, 166, 0.2)',
                      bgcolor: '#f0fdfa',
                    },
                    '& .MuiChip-deleteIcon': { 
                      color: '#5eead4', 
                      fontSize: '18px',
                      transition: 'all 0.2s ease',
                      '&:hover': { 
                        color: '#ef4444',
                        transform: 'scale(1.1)'
                      } 
                    }
                  }}
                />
                );
              })()}
                
              {filterPriority !== 'all' && (() => {
                const priorityName = allPriorities.find(p => p._id === filterPriority)?.name || 'Priority';
                return (
                  <Chip
                  icon={<FlagIcon sx={{ fontSize: 16, color: getPriorityColor(priorityName) === 'error' ? '#ef4444' : '#f59e0b' }} />}
                  label={priorityName}
                    size="small"
                    onDelete={() => setFilterPriority('all')}
                    sx={{
                    bgcolor: 'white',
                    border: '1.5px solid #fecaca',
                      color: '#991b1b',
                      fontWeight: 600,
                      fontSize: '12px',
                    px: 0.5,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#ef4444',
                      boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)',
                      bgcolor: '#fef2f2',
                    },
                    '& .MuiChip-deleteIcon': { 
                      color: '#fca5a5', 
                      fontSize: '18px',
                      transition: 'all 0.2s ease',
                      '&:hover': { 
                        color: '#dc2626',
                        transform: 'scale(1.1)'
                      } 
                    }
                  }}
                />
                );
              })()}
                
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setFilterAssignee('all');
                    setFilterStatus('all');
                    setFilterPriority('all');
                    setFilterFeature('all');
                    setFilterFunction('all');
                    setFilterMilestone('all');
                    setSearch('');
                  }}
                  sx={{
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'none',
                    color: '#ef4444',
                    minWidth: 'auto',
                    px: 2,
                    py: 0.75,
                    borderRadius: 2,
                    borderColor: '#fecaca',
                    bgcolor: 'white',
                    border: '1.5px solid #fecaca',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      color: 'white',
                      bgcolor: '#ef4444',
                      borderColor: '#ef4444',
                      boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)',
                      transform: 'translateY(-1px)',
                    }
                  }}
                  startIcon={
                    <Box sx={{ fontSize: '14px' }}>✕</Box>
                  }
                >
                  Clear all
                </Button>
              </Stack>
            </Box>
          )}

          {/* Modern Filter Popover - Enhanced Design */}
          <Popover
            open={Boolean(filterAnchorEl)}
            anchorEl={filterAnchorEl}
            onClose={() => setFilterAnchorEl(null)}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            slotProps={{
              paper: {
                sx: {
                  mt: 1.5,
                  width: 450,
                  maxHeight: 600,
                  borderRadius: 4,
                  boxShadow: '0 20px 60px rgba(123, 104, 238, 0.15), 0 0 0 1px rgba(123, 104, 238, 0.1)',
                  overflow: 'hidden',
                  background: 'linear-gradient(to bottom, #ffffff, #fafbff)',
                  display: 'flex',
                  flexDirection: 'column',
                }
              }
            }}
          >
            {/* Header with Gradient */}
            <Box 
              sx={{ 
                px: 3.5,
                pt: 3,
                pb: 2.5,
                background: 'linear-gradient(135deg, #7b68ee 0%, #9b59b6 100%)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'radial-gradient(circle at top right, rgba(255,255,255,0.2), transparent)',
                  pointerEvents: 'none',
                }
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
                    <Box sx={{ 
                      width: 36, 
                      height: 36, 
                      borderRadius: 2, 
                      bgcolor: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(10px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(255,255,255,0.3)',
                    }}>
                      <TuneIcon sx={{ fontSize: 20, color: 'white' }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '18px', color: 'white', letterSpacing: '-0.02em' }}>
                      Advanced Filters
                  </Typography>
                  </Stack>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', ml: 6 }}>
                    Customize your task view
                  </Typography>
                </Box>
                <IconButton 
                  size="small" 
                  onClick={() => setFilterAnchorEl(null)}
                  sx={{ 
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    '&:hover': { 
                      bgcolor: 'rgba(255,255,255,0.25)',
                      transform: 'rotate(90deg)',
                      transition: 'all 0.3s ease'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  <span style={{ fontSize: '18px', fontWeight: 300 }}>×</span>
                </IconButton>
              </Stack>
            </Box>

            {/* Filter Content */}
            <Box 
              sx={{ 
                px: 3.5,
                py: 3,
                flex: 1,
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  bgcolor: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  bgcolor: '#e0e0e0',
                  borderRadius: '10px',
                  border: '2px solid transparent',
                  backgroundClip: 'content-box',
                  '&:hover': {
                    bgcolor: '#bdbdbd',
                  }
                }
              }}
            >
              <Stack spacing={3.5}>
                {/* People Section */}
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                    <PersonIcon sx={{ fontSize: 16, color: '#7b68ee' }} />
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#2d3748', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      People
                  </Typography>
                  </Stack>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: '#6b7280', '&.Mui-focused': { color: '#7b68ee' } }}>Assignee</InputLabel>
                    <Select 
                      value={filterAssignee} 
                      onChange={(e) => setFilterAssignee(e.target.value)}
                      label="Assignee"
                      sx={{
                        borderRadius: 2.5,
                        bgcolor: 'white',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0', borderWidth: '1.5px' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#b4a7f5' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7b68ee', borderWidth: '2px' },
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(123, 104, 238, 0.08)',
                        }
                      }}
                    >
                      <MenuItem value="all">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 24, height: 24, bgcolor: '#e2e8f0', color: '#6b7280', fontSize: '11px', fontWeight: 600 }}>
                            All
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>All Assignees</Typography>
                            <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '11px' }}>
                              {teamMembers.length} members
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                      {teamMembers.map((member, idx) => {
                        const userId = member.user_id?._id || member._id;
                        const userName = member.user_id?.full_name || member.full_name || member.user_id?.email || member.email || 'Unknown';
                        return (
                          <MenuItem key={userId || idx} value={userId}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar sx={{ width: 24, height: 24, bgcolor: '#7b68ee', fontSize: '11px', fontWeight: 600 }}>
                                {userName.charAt(0).toUpperCase()}
                              </Avatar>
                              <Typography sx={{ fontSize: '14px' }}>{userName}</Typography>
                            </Box>
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Box>

                <Divider sx={{ borderColor: '#e2e8f0' }} />

                {/* Status & Priority Section */}
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                    <Box sx={{ 
                      width: 16, 
                      height: 16, 
                      borderRadius: '4px', 
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: '10px' }}>✓</span>
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#2d3748', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Status & Priority
                  </Typography>
                  </Stack>
                  <Stack spacing={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ color: '#6b7280', '&.Mui-focused': { color: '#7b68ee' } }}>Status</InputLabel>
                      <Select 
                        value={filterStatus} 
                        onChange={(e) => setFilterStatus(e.target.value)}
                        label="Status"
                        sx={{
                          borderRadius: 2.5,
                          bgcolor: 'white',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0', borderWidth: '1.5px' },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#b4a7f5' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7b68ee', borderWidth: '2px' },
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            boxShadow: '0 4px 12px rgba(123, 104, 238, 0.08)',
                          }
                        }}
                      >
                        <MenuItem value="all">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#cbd5e0', border: '2px solid #e2e8f0' }} />
                            <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>All Status</Typography>
                          </Box>
                        </MenuItem>
                        {statuses.map((s) => (
                        <MenuItem key={s._id} value={s._id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ 
                              width: 10, 
                              height: 10, 
                              borderRadius: '50%', 
                              bgcolor: getStatusColor(s.name),
                              boxShadow: `0 0 0 2px ${getStatusColor(s.name)}20`
                            }} />
                            <Typography sx={{ fontSize: '14px' }}>{s.name}</Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ color: '#6b7280', '&.Mui-focused': { color: '#7b68ee' } }}>Priority</InputLabel>
                      <Select 
                        value={filterPriority} 
                        onChange={(e) => setFilterPriority(e.target.value)}
                        label="Priority"
                        sx={{
                          borderRadius: 2.5,
                          bgcolor: 'white',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0', borderWidth: '1.5px' },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#b4a7f5' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7b68ee', borderWidth: '2px' },
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            boxShadow: '0 4px 12px rgba(123, 104, 238, 0.08)',
                          }
                        }}
                      >
                        <MenuItem value="all">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <FlagIcon sx={{ fontSize: 16, color: '#9ca3af' }} />
                            <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>All Priority</Typography>
                          </Box>
                        </MenuItem>
                        {priorities.map((p) => (
                        <MenuItem key={p._id} value={p._id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <FlagIcon sx={{ 
                              fontSize: 16, 
                              color: getPriorityColor(p.name) === 'error' ? '#ef4444' : getPriorityColor(p.name) === 'warning' ? '#f59e0b' : '#9ca3af' 
                            }} />
                            <Typography sx={{ fontSize: '14px' }}>{p.name}</Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                </Box>

                <Divider sx={{ borderColor: '#e2e8f0' }} />

                {/* Project Structure Section */}
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                    <Box sx={{ 
                      width: 16, 
                      height: 16, 
                      borderRadius: '4px', 
                      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: '10px', color: 'white' }}>⚙</span>
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#2d3748', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Project Structure
                  </Typography>
                  </Stack>
                  <Stack spacing={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ color: '#6b7280', '&.Mui-focused': { color: '#7b68ee' } }}>Feature</InputLabel>
                      <Select 
                        value={filterFeature} 
                        onChange={(e) => {
                          setFilterFeature(e.target.value);
                          if (e.target.value === 'all') {
                            setFilterFunction('all');
                          }
                        }}
                        label="Feature"
                        sx={{
                          borderRadius: 2.5,
                          bgcolor: 'white',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0', borderWidth: '1.5px' },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#b4a7f5' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7b68ee', borderWidth: '2px' },
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            boxShadow: '0 4px 12px rgba(123, 104, 238, 0.08)',
                          }
                        }}
                      >
                        <MenuItem value="all">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ 
                              width: 22, 
                              height: 22, 
                              borderRadius: 1.5, 
                              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px'
                            }}>
                              ⚡
                            </Box>
                            <Box>
                              <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>All Features</Typography>
                              <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '11px' }}>
                                {features.length} items
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                        {features.map((f) => (
                          <MenuItem key={f.id} value={f.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Box sx={{ 
                                width: 22, 
                                height: 22, 
                                borderRadius: 1.5, 
                                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px'
                              }}>
                                ⚡
                              </Box>
                              <Typography sx={{ fontSize: '14px' }}>{f.title}</Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ 
                        color: filterFeature === 'all' ? '#9ca3af' : '#6b7280', 
                        '&.Mui-focused': { color: filterFeature === 'all' ? '#9ca3af' : '#7b68ee' } 
                      }}>
                        Function
                      </InputLabel>
                      <Select 
                        value={filterFunction}
                        onChange={(e) => setFilterFunction(e.target.value)}
                        disabled={filterFeature === 'all'}
                        label="Function"
                        sx={{
                          borderRadius: 2.5,
                          bgcolor: filterFeature === 'all' ? '#f8f9fb' : 'white',
                          '& .MuiOutlinedInput-notchedOutline': { 
                            borderColor: filterFeature === 'all' ? '#e2e8f0' : '#e2e8f0', 
                            borderWidth: '1.5px' 
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': { 
                            borderColor: filterFeature === 'all' ? '#e2e8f0' : '#b4a7f5' 
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { 
                            borderColor: filterFeature === 'all' ? '#e2e8f0' : '#7b68ee', 
                            borderWidth: '2px' 
                          },
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            boxShadow: filterFeature === 'all' ? 'none' : '0 4px 12px rgba(123, 104, 238, 0.08)',
                          },
                          opacity: filterFeature === 'all' ? 0.6 : 1,
                        }}
                      >
                        <MenuItem value="all">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ 
                              width: 22, 
                              height: 22, 
                              borderRadius: 1.5, 
                              background: filterFeature === 'all' ? '#e2e8f0' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px'
                            }}>
                              🔧
                            </Box>
                            <Box>
                              <Typography sx={{ fontSize: '14px', fontWeight: 500, color: filterFeature === 'all' ? '#9ca3af' : 'inherit' }}>
                                {filterFeature === 'all' ? 'Select Feature first' : 'All Functions'}
                              </Typography>
                              {filterFeature !== 'all' && (
                                <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '11px' }}>
                                  {functions.length} items
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </MenuItem>
                        {functions.map((fn) => (
                          <MenuItem key={fn._id} value={fn._id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Box sx={{ 
                                width: 22, 
                                height: 22, 
                                borderRadius: 1.5, 
                                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px'
                              }}>
                                🔧
                              </Box>
                              <Typography sx={{ fontSize: '14px' }}>{fn.title}</Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ color: '#6b7280', '&.Mui-focused': { color: '#7b68ee' } }}>Milestone</InputLabel>
                      <Select 
                        value={filterMilestone} 
                        onChange={(e) => setFilterMilestone(e.target.value)}
                        label="Milestone"
                        sx={{
                          borderRadius: 2.5,
                          bgcolor: 'white',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0', borderWidth: '1.5px' },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#b4a7f5' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7b68ee', borderWidth: '2px' },
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            boxShadow: '0 4px 12px rgba(123, 104, 238, 0.08)',
                          }
                        }}
                      >
                        <MenuItem value="all">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ 
                              width: 22, 
                              height: 22, 
                              borderRadius: 1.5, 
                              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px'
                            }}>
                              🎯
                            </Box>
                            <Box>
                              <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>All Milestones</Typography>
                              <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '11px' }}>
                                {milestones.length} items
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                        {milestones.map((m) => (
                          <MenuItem key={m.id} value={m.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Box sx={{ 
                                width: 22, 
                                height: 22, 
                                borderRadius: 1.5, 
                                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px'
                              }}>
                                🎯
                              </Box>
                              <Typography sx={{ fontSize: '14px' }}>{m.title}</Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                </Box>
              </Stack>
            </Box>

            {/* Footer Actions */}
            {(filterAssignee !== 'all' || filterStatus !== 'all' || filterPriority !== 'all' || 
              filterFeature !== 'all' || filterFunction !== 'all' || filterMilestone !== 'all' || search) && (
              <Box 
                sx={{ 
                  px: 3.5,
                  py: 2.5,
                  borderTop: '1px solid #e2e8f0',
                  background: 'linear-gradient(to bottom, #fafbff, #f8f9fb)',
                  flexShrink: 0,
                }}
              >
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => {
                    setFilterAssignee('all');
                    setFilterStatus('all');
                    setFilterPriority('all');
                    setFilterFeature('all');
                    setFilterFunction('all');
                    setFilterMilestone('all');
                    setSearch('');
                  }}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '14px',
                    color: 'white',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    borderRadius: 2.5,
                    py: 1.2,
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                      boxShadow: '0 6px 16px rgba(239, 68, 68, 0.4)',
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                  startIcon={
                    <Box sx={{ 
                      width: 20, 
                      height: 20, 
                      borderRadius: '50%', 
                      bgcolor: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px'
                    }}>
                      ✕
                    </Box>
                  }
                >
                  Clear All Filters
                </Button>
              </Box>
            )}
          </Popover>

          {/* Feature Filter Alert */}
          {featureIdFromUrl && filterFeature === featureIdFromUrl && (
            <Alert 
              severity="info" 
              sx={{ 
                mb: 3,
                background: 'linear-gradient(135deg, #e0f2fe, #e0e7ff)',
                border: '1px solid #7b68ee',
                '& .MuiAlert-icon': {
                  color: '#7b68ee'
                }
              }}
              onClose={() => {
                setFilterFeature("all");
                router.push(`/projects/${projectId}/tasks`);
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Đang xem Tasks của Feature: 
                </Typography>
                <Chip 
                  label={allFeatures.find(f => f._id === featureIdFromUrl)?.title || 'Unknown'}
                  size="small"
                  sx={{
                    background: 'linear-gradient(135deg, #7b68ee, #9b59b6)',
                    color: 'white',
                    fontWeight: 600,
                  }}
                />
              </Box>
            </Alert>
          )}

          {/* Function Filter Alert */}
          {functionIdFromUrl && filterFunction === functionIdFromUrl && (
            <Alert 
              severity="info" 
              sx={{ 
                mb: 3,
                background: 'linear-gradient(135deg, #f0e7ff, #e0e7ff)',
                border: '1px solid #8b5cf6',
                '& .MuiAlert-icon': {
                  color: '#8b5cf6'
                }
              }}
              onClose={() => {
                setFilterFunction("all");
                router.push(`/projects/${projectId}/tasks`);
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Đang xem Tasks của Function: 
                </Typography>
                <Chip 
                  label={allFunctions.find(f => f._id === functionIdFromUrl)?.title || 'Unknown'}
                  size="small"
                  sx={{
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    color: 'white',
                    fontWeight: 600,
                  }}
                />
              </Box>
            </Alert>
          )}

          {view === "table" && (
            <Box sx={{ bgcolor: 'white' }}>

              {/* ClickUp-style Column headers */}
              <Box sx={{ 
                px: 3, 
                py: 1.5, 
                display: 'grid !important', 
                gridTemplateColumns: { 
                  xs: '40px minmax(200px, 1fr) 120px 110px', 
                  md: '40px minmax(250px, 2fr) 140px 140px 120px 100px 100px 80px 60px' 
                }, 
                columnGap: 2, 
                color: '#6b7280', 
                fontSize: '11px', 
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                bgcolor: '#fafbfc',
                borderBottom: '1px solid #e8e9eb',
                alignItems: 'center',
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
                        <Fragment key={t._id}>
                        <Box 
                          sx={{ 
                            px: 3, 
                            py: 1.25, 
                            display: 'grid !important', 
                            gridTemplateColumns: { 
                              xs: '40px minmax(200px, 1fr) 120px 110px', 
                              md: '40px minmax(250px, 2fr) 140px 140px 120px 100px 100px 80px 60px' 
                            }, 
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
                            {/* Expand/Collapse chevron - only show if task has subtasks AND is not a subtask itself */}
                            {taskSubtasks[t._id]?.length > 0 && !t.parent_task_id ? (
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
                                <Tooltip 
                                  title={
                                    <Box>
                                      <Typography fontSize="12px" fontWeight={600} sx={{ mb: 0.5 }}>
                                        {t.title}
                                      </Typography>
                                      <Typography fontSize="11px" color="rgba(255,255,255,0.8)">
                                        Double-click to edit
                                      </Typography>
                                    </Box>
                                  } 
                                  placement="top"
                                  arrow
                                >
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
                                      cursor: 'pointer',
                                      maxWidth: '100%',
                                      '&:hover': {
                                        bgcolor: '#f3f4f6',
                                      }
                                    }}
                                  >
                                    {t.title}
                                  </Typography>
                                </Tooltip>
                                
                                {/* Subtask counter badge - Jira/ClickUp style with progress */}
                                {/* Only show for parent tasks (not subtasks themselves) */}
                                {taskSubtasks[t._id]?.length > 0 && !t.parent_task_id && (() => {
                                  const completedCount = taskSubtasks[t._id].filter((st: any) => {
                                    const stName = typeof st.status === 'object' ? st.status?.name : st.status;
                                    return stName === 'Completed' || stName === 'Done';
                                  }).length;
                                  const totalCount = taskSubtasks[t._id].length;
                                  const subtaskProgress = Math.round((completedCount / totalCount) * 100);
                                  const allCompleted = completedCount === totalCount;
                                  
                                  return (
                                    <Tooltip title={`${completedCount} of ${totalCount} subtasks completed (${subtaskProgress}%)`}>
                                      <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        gap: 0.75,
                                        px: 1,
                                        py: 0.5,
                                        borderRadius: 1.5,
                                      bgcolor: expandedTasks.has(t._id) ? '#ede9fe' : '#f3f4f6',
                                      border: expandedTasks.has(t._id) ? '1px solid #7b68ee40' : 'none',
                                      transition: 'all 0.2s ease',
                                      }}>
                                        <Box sx={{ 
                                          width: 14,
                                          height: 14,
                                          borderRadius: '50%',
                                          border: `2px solid ${allCompleted ? '#10b981' : '#7b68ee'}`,
                                          bgcolor: allCompleted ? '#10b981' : 'transparent',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          flexShrink: 0,
                                        }}>
                                          {allCompleted && (
                                            <CheckCircleIcon sx={{ fontSize: 10, color: 'white' }} />
                                          )}
                                        </Box>
                                        <Typography sx={{ 
                                          fontSize: '11px',
                                          fontWeight: 700,
                                          color: allCompleted ? '#10b981' : (expandedTasks.has(t._id) ? '#7b68ee' : '#6b7280'),
                                        }}>
                                          {completedCount}/{totalCount}
                                        </Typography>
                                        {/* Mini progress bar */}
                                        <Box sx={{
                                          width: 32,
                                          height: 4,
                                          bgcolor: expandedTasks.has(t._id) ? '#c4b5fd' : '#e5e7eb',
                                          borderRadius: 2,
                                          overflow: 'hidden',
                                          flexShrink: 0,
                                        }}>
                                          <Box sx={{
                                            width: `${subtaskProgress}%`,
                                            height: '100%',
                                            bgcolor: allCompleted ? '#10b981' : '#7b68ee',
                                            transition: 'width 0.3s ease',
                                          }} />
                                        </Box>
                                      </Box>
                                    </Tooltip>
                                  );
                                })()}
                                
                                {/* Hierarchy badges: Milestone → Feature → Function - Clickable with truncation */}
                                {t.milestone_id && typeof t.milestone_id === 'object' && (
                                  <Tooltip title={`Milestone: ${(t.milestone_id as any).title}`} arrow>
                                  <Chip 
                                    label={`🎯 ${(t.milestone_id as any).title}`}
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(`/projects/${projectId}/milestones/${(t.milestone_id as any)._id}/features`);
                                    }}
                                    sx={{ 
                                      height: 18,
                                        maxWidth: 120,
                                      fontSize: '10px',
                                      fontWeight: 600,
                                      bgcolor: '#fef3c7',
                                      color: '#92400e',
                                      cursor: 'pointer',
                                        '& .MuiChip-label': { 
                                          px: 0.75,
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                        },
                                      '&:hover': {
                                        bgcolor: '#fde68a',
                                        transform: 'scale(1.05)',
                                      },
                                      transition: 'all 0.2s',
                                    }}
                                  />
                                  </Tooltip>
                                )}
                                {t.feature_id && typeof t.feature_id === 'object' && (
                                  <Tooltip title={`Feature: ${(t.feature_id as any).title}`} arrow>
                                  <Chip 
                                    label={`⚡ ${(t.feature_id as any).title}`}
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(`/projects/${projectId}/features`);
                                    }}
                                    sx={{ 
                                      height: 18,
                                        maxWidth: 120,
                                      fontSize: '10px',
                                      fontWeight: 600,
                                      bgcolor: '#dbeafe',
                                      color: '#1e40af',
                                      cursor: 'pointer',
                                        '& .MuiChip-label': { 
                                          px: 0.75,
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                        },
                                      '&:hover': {
                                        bgcolor: '#bfdbfe',
                                        transform: 'scale(1.05)',
                                      },
                                      transition: 'all 0.2s',
                                    }}
                                  />
                                  </Tooltip>
                                )}
                                {(t as any).function_id && typeof (t as any).function_id === 'object' && (
                                  <Tooltip title={`Function: ${((t as any).function_id as any).title}`} arrow>
                                  <Chip 
                                    label={`🔧 ${((t as any).function_id as any).title}`}
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(`/projects/${projectId}/functions`);
                                    }}
                                    sx={{ 
                                      height: 18,
                                        maxWidth: 120,
                                      fontSize: '10px',
                                      fontWeight: 600,
                                      bgcolor: '#e0e7ff',
                                      color: '#4338ca',
                                      cursor: 'pointer',
                                        '& .MuiChip-label': { 
                                          px: 0.75,
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                        },
                                      '&:hover': {
                                        bgcolor: '#c7d2fe',
                                        transform: 'scale(1.05)',
                                      },
                                      transition: 'all 0.2s',
                                    }}
                                  />
                                  </Tooltip>
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
                            value={typeof t.status === 'object' ? (t.status as any)?._id : t.status || ''}
                              onChange={async (e) => {
                                e.stopPropagation();
                              const newStatusId = e.target.value;
                                try {
                                  await axiosInstance.patch(`/api/tasks/${t._id}`, {
                                  status: newStatusId
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
                                    newStatus: newStatusId
                                    });
                                  } else {
                                    setError(error?.response?.data?.message || 'Không thể cập nhật status');
                                  }
                                }
                              }}
                              size="small"
                              displayEmpty
                            renderValue={(value) => {
                              const statusObj = allStatuses.find(s => s._id === value);
                              const statusName = statusObj?.name || 'No Status';
                              return (
                                <Chip 
                                  label={statusName} 
                                  size="small"
                                  sx={{
                                    height: 22,
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    bgcolor: `${getStatusColor(statusName)}15`,
                                    color: getStatusColor(statusName),
                                    border: 'none',
                                  }}
                                />
                              );
                            }}
                              sx={{
                                '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                                '& .MuiSelect-select': { p: 0 },
                                '&:hover': { bgcolor: '#f3f4f6', borderRadius: 1 },
                              }}
                            >
                            {allStatuses.map((s) => (
                              <MenuItem key={s._id} value={s._id}>
                                <Chip 
                                  label={s.name} 
                                  size="small" 
                                  sx={{ 
                                    bgcolor: `${getStatusColor(s.name)}15`, 
                                    color: getStatusColor(s.name), 
                                    fontSize: '11px', 
                                    fontWeight: 600 
                                  }} 
                                />
                              </MenuItem>
                            ))}
                            </Select>
                          </Box>

                          {/* Priority - inline edit */}
                          <Box sx={{ display: { xs: 'none', md: 'block' } }} onClick={(e) => e.stopPropagation()}>
                            <Select
                            value={typeof t.priority === 'object' ? (t.priority as any)?._id : t.priority || ''}
                              onChange={async (e) => {
                                e.stopPropagation();
                                try {
                                  await axiosInstance.patch(`/api/tasks/${t._id}`, {
                                  priority: e.target.value || null
                                  });
                                  await loadAll();
                                } catch (error) {
                                  console.error('Error updating priority:', error);
                                }
                              }}
                              size="small"
                              displayEmpty
                              renderValue={(value) => {
                              if (!value) {
                                  return (
                                    <Typography sx={{ fontSize: '13px', color: '#9ca3af', px: 0.5 }}>
                                      No priority
                                    </Typography>
                                  );
                                }
                              const priorityObj = allPriorities.find(p => p._id === value);
                              const priorityName = priorityObj?.name || '-';
                              const color = priorityName.toLowerCase().includes('critical') || priorityName.toLowerCase().includes('high') ? '#ef4444'
                                : priorityName.toLowerCase().includes('medium') ? '#f59e0b'
                                  : '#3b82f6';
                                return (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <FlagIcon sx={{ fontSize: 14, color }} />
                                    <Typography sx={{ fontSize: '13px', fontWeight: 500, color }}>
                                    {priorityName}
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
                            {allPriorities.map((p) => {
                              const color = p.name.toLowerCase().includes('critical') || p.name.toLowerCase().includes('high') ? '#ef4444'
                                : p.name.toLowerCase().includes('medium') ? '#f59e0b'
                                : '#3b82f6';
                              return (
                                <MenuItem key={p._id} value={p._id}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <FlagIcon sx={{ fontSize: 14, color }} />
                                    <Typography fontSize="13px" color={color} fontWeight={p.name.toLowerCase().includes('critical') ? 700 : 400}>
                                      {p.name}
                                    </Typography>
                                </Box>
                              </MenuItem>
                              );
                            })}
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
                        {/* Only render subtasks if t is a parent task (not a subtask itself) */}
                        {expandedTasks.has(t._id) && !t.parent_task_id && taskSubtasks[t._id] && taskSubtasks[t._id].map((subtask: any, subIndex: number) => {
                          const isLastSubtask = subIndex === taskSubtasks[t._id].length - 1;
                          const subtaskStatusName = typeof subtask.status === 'object' ? subtask.status?.name : subtask.status;
                          const isSubtaskCompleted = subtaskStatusName === 'Completed' || subtaskStatusName === 'Done';
                          
                          return (
                          <Box 
                            key={subtask._id} 
                            sx={{ 
                              px: 3, 
                              py: 1.5,
                              pl: 7, // Extra left padding for indentation
                              display: 'grid !important', 
                              gridTemplateColumns: { 
                                xs: '40px minmax(200px, 1fr) 120px 110px', 
                                md: '40px minmax(250px, 2fr) 140px 140px 120px 100px 100px 80px 60px' 
                              }, 
                              columnGap: 2, 
                              alignItems: 'center', 
                              bgcolor: '#fafbfc',
                              borderBottom: '1px solid #f3f4f6',
                              cursor: 'pointer',
                              position: 'relative',
                              transition: 'all 0.2s ease',
                              '&:hover': { 
                                bgcolor: '#f5f3ff',
                                '& .subtask-actions': {
                                  opacity: 1,
                                },
                              },
                              // Tree line connector - vertical line
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                left: '35px',
                                top: 0,
                                bottom: isLastSubtask ? '50%' : 0,
                                width: '1.5px',
                                bgcolor: '#d1d5db',
                              },
                              // Tree line connector - horizontal line (L-shape)
                              '&::after': {
                                content: '""',
                                position: 'absolute',
                                left: '35px',
                                top: '50%',
                                width: '16px',
                                height: '1.5px',
                                bgcolor: '#d1d5db',
                              },
                            }}
                            onClick={() => openTaskDetailsModal(subtask._id)}
                          >
                            {/* Checkbox/Status indicator */}
                            <Box 
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 0.5,
                                pl: 2, 
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                checked={isSubtaskCompleted}
                                size="small"
                                sx={{
                                  padding: 0,
                                  color: '#d1d5db',
                                  '&.Mui-checked': {
                                    color: '#7b68ee',
                                  },
                                }}
                                onChange={(e: any) => {
                                  e.stopPropagation();
                                  // Quick status toggle
                                  const newStatusId = isSubtaskCompleted 
                                    ? allStatuses.find((s: any) => s.name === 'To Do')?._id 
                                    : allStatuses.find((s: any) => s.name === 'Done')?._id;
                                  if (newStatusId) {
                                    axiosInstance.patch(`/api/tasks/${subtask._id}`, { status: newStatusId })
                                      .then(() => loadSubtasks(t._id))
                                      .catch((err: any) => console.error('Error updating subtask:', err));
                                  }
                                }}
                              />
                            </Box>

                            {/* Subtask name with icon */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
                              <Box sx={{ 
                                width: 20,
                                height: 20,
                                borderRadius: 1,
                                bgcolor: '#ede9fe',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}>
                                <Box sx={{ 
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  bgcolor: '#7b68ee',
                                }} />
                              </Box>
                              <Tooltip title={subtask.title} arrow placement="top">
                              <Typography 
                                sx={{ 
                                  fontWeight: 400, 
                                  fontSize: '13px', 
                                    color: isSubtaskCompleted ? '#9ca3af' : '#4b5563',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                    textDecoration: isSubtaskCompleted ? 'line-through' : 'none',
                                    flex: 1,
                                    cursor: 'pointer',
                                }}
                              >
                                {subtask.title}
                              </Typography>
                              </Tooltip>
                              {/* Quick actions on hover */}
                              <Box 
                                className="subtask-actions"
                                sx={{ 
                                  display: 'flex',
                                  gap: 0.5,
                                  opacity: 0,
                                  transition: 'opacity 0.2s ease',
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Tooltip title="Edit subtask">
                                  <IconButton 
                                size="small" 
                                sx={{ 
                                      width: 22,
                                      height: 22,
                                      color: '#9ca3af',
                                      '&:hover': { 
                                  color: '#7b68ee',
                                        bgcolor: '#ede9fe',
                                      },
                                    }}
                                    onClick={() => openTaskDetailsModal(subtask._id)}
                                  >
                                    <EditIcon sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete subtask">
                                  <IconButton 
                                    size="small"
                                    sx={{ 
                                      width: 22,
                                      height: 22,
                                      color: '#9ca3af',
                                      '&:hover': { 
                                        color: '#ef4444',
                                        bgcolor: '#fee2e2',
                                      },
                                    }}
                                    onClick={() => {
                                      if (confirm('Delete this subtask?')) {
                                        axiosInstance.delete(`/api/tasks/${subtask._id}`)
                                          .then(() => loadSubtasks(t._id))
                                          .catch((err: any) => console.error('Error deleting subtask:', err));
                                      }
                                    }}
                                  >
                                    <DeleteIcon sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Box>

                            {/* Assignee */}
                            <Box onClick={(e) => e.stopPropagation()}>
                              {subtask.assignee_id ? (
                                <Tooltip title={subtask.assignee_id?.full_name || subtask.assignee_id?.email}>
                                  <Avatar 
                                    sx={{ 
                                      width: 26, 
                                      height: 26, 
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      bgcolor: '#9333ea',
                                      cursor: 'pointer',
                                      '&:hover': {
                                        opacity: 0.8,
                                      },
                                    }}
                                  >
                                    {(subtask.assignee_id?.full_name || subtask.assignee_id?.email || 'U')[0].toUpperCase()}
                                  </Avatar>
                                </Tooltip>
                              ) : (
                                <Tooltip title="Assign to someone">
                                  <Avatar 
                                    sx={{ 
                                      width: 26, 
                                      height: 26, 
                                      fontSize: '11px',
                                      bgcolor: '#f3f4f6',
                                      color: '#9ca3af',
                                      cursor: 'pointer',
                                      '&:hover': {
                                        bgcolor: '#e5e7eb',
                                      },
                                    }}
                                  >
                                    +
                                  </Avatar>
                                </Tooltip>
                              )}
                            </Box>

                            {/* Assigner - empty for subtasks */}
                            <Box sx={{ display: { xs: 'none', md: 'block' } }} />

                            {/* Due Date */}
                          <Box>
                              {subtask.deadline ? (
                                <Chip
                                  label={new Date(subtask.deadline).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })}
                                  size="small"
                                  icon={<CalendarMonthIcon sx={{ fontSize: 12 }} />}
                                  sx={{
                                    height: 22,
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    bgcolor: new Date(subtask.deadline) < new Date() && !isSubtaskCompleted ? '#fee2e2' : '#f3f4f6',
                                    color: new Date(subtask.deadline) < new Date() && !isSubtaskCompleted ? '#dc2626' : '#6b7280',
                                    '& .MuiChip-icon': {
                                      marginLeft: '6px',
                                    },
                                  }}
                                />
                              ) : (
                                <Typography fontSize="11px" color="#d1d5db">—</Typography>
                              )}
                          </Box>

                            {/* Status */}
                            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                              <Chip 
                                label={subtaskStatusName} 
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  bgcolor: isSubtaskCompleted ? '#dcfce7' : '#f3f4f6',
                                  color: isSubtaskCompleted ? '#16a34a' : '#6b7280',
                                  border: isSubtaskCompleted ? '1px solid #bbf7d0' : 'none',
                                }}
                              />
                          </Box>

                            {/* Priority */}
                            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                              {subtask.priority && (
                                <Chip 
                                  label={typeof subtask.priority === 'object' ? subtask.priority?.name : subtask.priority}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    bgcolor: getPriorityColor(typeof subtask.priority === 'object' ? subtask.priority?.name : subtask.priority) + '20',
                                    color: getPriorityColor(typeof subtask.priority === 'object' ? subtask.priority?.name : subtask.priority),
                                  }}
                                />
                              )}
                            </Box>

                            {/* Dependencies - empty */}
                            <Box sx={{ display: { xs: 'none', md: 'flex' } }} />

                            {/* Progress */}
                            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', justifyContent: 'center' }}>
                              {subtask.progress !== undefined && subtask.progress > 0 ? (
                                <Tooltip title={`${subtask.progress}% complete`}>
                                <Box sx={{ 
                                    width: 48,
                                    height: 7,
                                  bgcolor: '#e5e7eb',
                                    borderRadius: 4,
                                    overflow: 'hidden',
                                    position: 'relative',
                                }}>
                                  <Box sx={{ 
                                    width: `${subtask.progress}%`,
                                    height: '100%',
                                      bgcolor: isSubtaskCompleted ? '#10b981' : '#7b68ee',
                                      transition: 'all 0.3s ease',
                                  }} />
                        </Box>
                                </Tooltip>
                              ) : (
                                <Typography fontSize="11px" color="#d1d5db">—</Typography>
                              )}
                            </Box>
                          </Box>
                        );
                        })}
                      </Fragment>
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

          {/* CI/CD View */}
          {view === "cicd" && (
            <ProjectCICDView projectId={projectId} />
          )}

          {/* Dialog - Tạo/Sửa Task */}
          <Dialog 
            open={openDialog} 
            onClose={() => setOpenDialog(false)} 
            maxWidth="lg" 
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 3,
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                bgcolor: '#fafbfc'
              }
            }}
          >
            {/* Modern Header */}
            <Box sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                top: '-50%',
                right: '-10%',
                width: '300px',
                height: '300px',
                background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
                  borderRadius: '50%',
              }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                px: 4,
                py: 3,
                position: 'relative',
                zIndex: 1
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <AssignmentIcon sx={{ fontSize: 28, color: 'white' }} />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight={700} color="white">
                      {editing ? 'Chỉnh sửa Task' : 'Tạo Task mới'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
                      {editing ? 'Cập nhật thông tin task' : 'Thêm task mới vào dự án'}
                    </Typography>
                  </Box>
                </Box>
                <IconButton 
                  onClick={() => setOpenDialog(false)}
                  sx={{ 
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>
            <DialogContent sx={{ p: 4 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
                {/* Left Column - Main Info */}
              <Stack spacing={3}>
                  {/* Section: Basic Info */}
                  <Box>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        mb: 2, 
                        fontWeight: 700, 
                        color: '#374151',
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <Box sx={{ width: 4, height: 16, bgcolor: '#667eea', borderRadius: 1 }} />
                      Thông tin cơ bản
                    </Typography>
                    <Stack spacing={2.5}>
                <TextField 
                        label="Tên task *" 
                  value={form.title} 
                  onChange={(e) => setForm({ ...form, title: e.target.value })} 
                  fullWidth 
                        required
                        placeholder="Nhập tên task..."
                  sx={{ 
                    '& .MuiOutlinedInput-root': { 
                            bgcolor: 'white',
                            borderRadius: 2,
                      '&:hover': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#667eea'
                        }
                            },
                            '&.Mui-focused': {
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#667eea',
                                borderWidth: 2
                        }
                      }
                    } 
                  }}
                />
                <TextField 
                        label="Mô tả" 
                  value={form.description} 
                  onChange={(e) => setForm({ ...form, description: e.target.value })} 
                  fullWidth 
                  multiline 
                  rows={4} 
                        placeholder="Nhập mô tả chi tiết..."
                  sx={{ 
                    '& .MuiOutlinedInput-root': { 
                            bgcolor: 'white',
                            borderRadius: 2
                    } 
                  }}
                />
                    </Stack>
                  </Box>
                
                  {/* Section: Timeline */}
                <Box>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        mb: 2, 
                        fontWeight: 700, 
                        color: '#374151',
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <Box sx={{ width: 4, height: 16, bgcolor: '#10b981', borderRadius: 1 }} />
                      Thời gian & Effort
                  </Typography>
                    <Stack spacing={2.5}>
                    <TextField 
                      type="date" 
                      label="Ngày bắt đầu" 
                      InputLabelProps={{ shrink: true }} 
                      value={form.start_date} 
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })} 
                      fullWidth 
                        sx={{ 
                          '& .MuiOutlinedInput-root': { 
                            bgcolor: 'white',
                            borderRadius: 2 
                          } 
                        }}
                    />
                    <TextField 
                      type="date" 
                        label="Deadline *" 
                      InputLabelProps={{ shrink: true }} 
                      value={form.deadline} 
                      onChange={(e) => setForm({ ...form, deadline: e.target.value })} 
                      fullWidth 
                        sx={{ 
                          '& .MuiOutlinedInput-root': { 
                            bgcolor: 'white',
                            borderRadius: 2 
                          } 
                        }}
                    />
                    <TextField 
                      type="number" 
                      label="Estimate (giờ)" 
                      value={form.estimate} 
                      onChange={(e) => setForm({ ...form, estimate: Number(e.target.value) })} 
                      fullWidth 
                        placeholder="0"
                        InputProps={{
                          startAdornment: (
                            <Box sx={{ mr: 1, color: '#9ca3af' }}>
                              <AccessTimeIcon sx={{ fontSize: 20 }} />
                            </Box>
                          )
                        }}
                        sx={{ 
                          '& .MuiOutlinedInput-root': { 
                            bgcolor: 'white',
                            borderRadius: 2 
                          } 
                        }}
                    />
                </Stack>
                </Box>
                </Stack>

                {/* Right Column - Settings & Links */}
                <Stack spacing={3}>
                  {/* Section: Status & Assignment */}
                <Box>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        mb: 2, 
                        fontWeight: 700, 
                        color: '#374151',
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <Box sx={{ width: 4, height: 16, bgcolor: '#f59e0b', borderRadius: 1 }} />
                      Trạng thái & Phân công
                  </Typography>
                    <Stack spacing={2.5}>
                      <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select 
                          value={form.status} 
                          label="Status" 
                          onChange={(e) => setForm({ ...form, status: e.target.value })}
                          sx={{ 
                            bgcolor: 'white',
                            borderRadius: 2,
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#e5e7eb'
                            }
                          }}
                        >
                          <MenuItem value=""><em>Chọn status</em></MenuItem>
                        {statuses.map((s) => (
                            <MenuItem key={s._id} value={s._id}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box sx={{ 
                                  width: 10, 
                                  height: 10, 
                                  borderRadius: '50%', 
                                  bgcolor: getStatusColor(s.name),
                                  boxShadow: `0 0 0 2px ${getStatusColor(s.name)}20`
                                }} />
                                <Typography fontSize="14px" fontWeight={500}>{s.name}</Typography>
                            </Box>
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                      
                      <FormControl fullWidth>
                        <InputLabel>Priority</InputLabel>
                        <Select 
                          value={form.priority} 
                          label="Priority" 
                          onChange={(e) => setForm({ ...form, priority: e.target.value })}
                          sx={{ 
                            bgcolor: 'white',
                            borderRadius: 2 
                          }}
                        >
                          <MenuItem value=""><em>Chọn priority</em></MenuItem>
                        {priorities.map((p) => (
                            <MenuItem key={p._id} value={p._id}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <FlagIcon sx={{ 
                                  fontSize: 16, 
                                  color: p.name.toLowerCase().includes('critical') || p.name.toLowerCase().includes('high') 
                                    ? '#ef4444' 
                                    : p.name.toLowerCase().includes('medium')
                                    ? '#f59e0b'
                                    : '#6b7280'
                                }} />
                                <Typography fontSize="14px" fontWeight={500}>{p.name}</Typography>
                            </Box>
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                      
                      <FormControl fullWidth>
                        <InputLabel>Assignee</InputLabel>
                        <Select 
                          value={form.assignee} 
                          label="Assignee" 
                          onChange={(e) => setForm({ ...form, assignee: e.target.value })}
                          sx={{ 
                            bgcolor: 'white',
                            borderRadius: 2 
                          }}
                        >
                      <MenuItem value=""><em>Chưa gán</em></MenuItem>
                      {teamMembers.map((member, idx) => {
                        const userId = member.user_id?._id || member._id;
                        const userName = member.user_id?.full_name || member.full_name || member.user_id?.email || member.email || 'Unknown';
                        return (
                          <MenuItem key={userId || idx} value={userId}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                  <Avatar sx={{ 
                                    width: 28, 
                                    height: 28, 
                                    bgcolor: '#667eea', 
                                    fontSize: '12px',
                                    fontWeight: 600
                                  }}>
                                {userName.charAt(0).toUpperCase()}
                              </Avatar>
                                  <Typography fontSize="14px" fontWeight={500}>{userName}</Typography>
                            </Box>
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Stack>
                </Box>

                  {/* Section: Links */}
                <Box>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        mb: 2, 
                        fontWeight: 700, 
                        color: '#374151',
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <Box sx={{ width: 4, height: 16, bgcolor: '#8b5cf6', borderRadius: 1 }} />
                      Liên kết Project
                  </Typography>
                    <Stack spacing={2.5}>
                      <FormControl fullWidth required>
                        <InputLabel>Feature *</InputLabel>
                        <Select 
                          value={form.feature_id} 
                          label="Feature *" 
                          onChange={(e) => setForm({ ...form, feature_id: e.target.value })}
                          sx={{ 
                            bgcolor: 'white',
                            borderRadius: 2 
                          }}
                        >
                          <MenuItem value=""><em>Chọn feature</em></MenuItem>
                          {features.map((f) => (
                            <MenuItem key={f.id} value={f.id}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box sx={{ 
                                  width: 8, 
                                  height: 8, 
                                  borderRadius: '50%', 
                                  bgcolor: '#3b82f6' 
                                }} />
                                <Typography fontSize="14px" fontWeight={500}>{f.title}</Typography>
                              </Box>
                            </MenuItem>
                          ))}
                    </Select>
                  </FormControl>
                      
                      <FormControl fullWidth>
                        <InputLabel>Milestone</InputLabel>
                        <Select 
                          value={form.milestone_id} 
                          label="Milestone" 
                          onChange={(e) => setForm({ ...form, milestone_id: e.target.value })}
                          sx={{ 
                            bgcolor: 'white',
                            borderRadius: 2 
                          }}
                        >
                      <MenuItem value=""><em>Không chọn</em></MenuItem>
                          {milestones.map((m) => (
                            <MenuItem key={m.id} value={m.id}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box sx={{ 
                                  width: 8, 
                                  height: 8, 
                                  borderRadius: '50%', 
                                  bgcolor: '#f59e0b' 
                                }} />
                                <Typography fontSize="14px" fontWeight={500}>{m.title}</Typography>
                              </Box>
                            </MenuItem>
                          ))}
                    </Select>
                  </FormControl>
                      
                      <FormControl fullWidth>
                        <InputLabel>Function</InputLabel>
                  <Select 
                    value={form.function_id} 
                          label="Function" 
                    onChange={(e) => setForm({ ...form, function_id: e.target.value })}
                    disabled={!form.feature_id}
                          sx={{ 
                            bgcolor: form.feature_id ? 'white' : '#f9fafb',
                            borderRadius: 2 
                          }}
                  >
                    <MenuItem value=""><em>Không chọn</em></MenuItem>
                          {functions.map((fn) => (
                            <MenuItem key={fn._id} value={fn._id}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box sx={{ 
                                  width: 8, 
                                  height: 8, 
                                  borderRadius: '50%', 
                                  bgcolor: '#8b5cf6' 
                                }} />
                                <Typography fontSize="14px" fontWeight={500}>{fn.title}</Typography>
                              </Box>
                            </MenuItem>
                          ))}
                  </Select>
                  {!form.feature_id && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              mt: 1, 
                              ml: 1.5,
                              color: '#9ca3af',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5
                            }}
                          >
                            ⓘ Vui lòng chọn Feature trước
                    </Typography>
                  )}
                </FormControl>
                    </Stack>
                </Box>
              </Stack>
              </Box>
            </DialogContent>
            <DialogActions sx={{ 
              px: 4, 
              py: 3, 
              bgcolor: '#fafbfc',
              borderTop: '1px solid #e5e7eb',
              gap: 2,
              justifyContent: 'space-between'
            }}>
              <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '12px' }}>
                * Trường bắt buộc
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                onClick={() => setOpenDialog(false)}
                variant="outlined"
                  startIcon={<CloseIcon sx={{ fontSize: 18 }} />}
                sx={{ 
                    borderRadius: 2,
                  px: 3,
                    py: 1,
                  textTransform: 'none',
                  fontWeight: 600,
                    fontSize: '14px',
                    borderColor: '#e5e7eb',
                    color: '#6b7280',
                    '&:hover': {
                      borderColor: '#d1d5db',
                      bgcolor: '#f9fafb'
                    }
                }}
              >
                Hủy
              </Button>
              <Button 
                  disabled={!form.title || !form.feature_id} 
                variant="contained" 
                onClick={saveTask}
                  startIcon={editing ? <CheckCircleIcon sx={{ fontSize: 18 }} /> : <AddIcon sx={{ fontSize: 18 }} />}
                sx={{
                    borderRadius: 2,
                  px: 4,
                    py: 1,
                  textTransform: 'none',
                  fontWeight: 700,
                    fontSize: '14px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 4px 14px rgba(102, 126, 234, 0.4)',
                  '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                      boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                      transform: 'translateY(-1px)'
                    },
                    '&:disabled': {
                      background: '#e5e7eb',
                      color: '#9ca3af',
                      boxShadow: 'none'
                    },
                    transition: 'all 0.2s'
                  }}
                >
                  {editing ? 'Cập nhật Task' : 'Tạo Task'}
              </Button>
              </Box>
            </DialogActions>
          </Dialog>

          {/* Task Details Modal */}
          <TaskDetailsModal 
            open={openTaskDetails}
            taskId={selectedTaskId}
            projectId={projectId}
            onClose={() => {
              setOpenTaskDetails(false);
              setSelectedTaskId(null);
            }}
            onUpdate={loadAll}
            onTaskChange={(newTaskId) => {
              // Switch to view the selected subtask
              setSelectedTaskId(newTaskId);
            }}
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


