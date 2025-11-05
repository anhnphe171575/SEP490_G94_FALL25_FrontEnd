"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { 
  Box, 
  Typography, 
  Tooltip, 
  Paper, 
  IconButton, 
  Stack,
  Button,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import { 
  ZoomIn, 
  ZoomOut, 
  Today,
  ViewWeek,
  ViewDay,
  CalendarMonth,
  Add,
  ExpandMore,
  ChevronRight,
  Circle,
  Menu as MenuIcon
} from "@mui/icons-material";

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

interface Dependency {
  _id: string;
  task_id: string;
  depends_on_task_id: any;
  dependency_type: 'FS' | 'FF' | 'SS' | 'SF';
}

interface ClickUpStyleGanttChartProps {
  tasks: Task[];
  dependencies: Record<string, { dependencies: Dependency[]; dependents: Dependency[] }>;
  onTaskClick?: (taskId: string) => void;
}

type TimeScale = 'day' | 'week' | 'month';

export default function ClickUpStyleGanttChart({ 
  tasks, 
  dependencies,
  onTaskClick 
}: ClickUpStyleGanttChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [timeScale, setTimeScale] = useState<TimeScale>('day');
  const [zoom, setZoom] = useState(1);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const ROW_HEIGHT = 40;
  const HEADER_HEIGHT = 72;
  const LEFT_PANEL_WIDTH = 300;

  // ClickUp Colors
  const TASK_COLORS = ['#7b68ee', '#00c875', '#49ccf9', '#fdab3d', '#e2445c', '#9d8df1'];
  
  const getTaskColor = (task: Task, index: number) => {
    const statusStr = typeof task.status === 'object' ? task.status?.name : task.status;
    const status = (statusStr || '').toLowerCase();
    if (status.includes('done') || status.includes('completed')) return '#00c875';
    if (status.includes('progress')) return '#49ccf9';
    if (status.includes('review')) return '#9d8df1';
    return TASK_COLORS[index % TASK_COLORS.length];
  };

  // Calculate date range
  const dateRange = useMemo(() => {
    if (tasks.length === 0) {
      const today = new Date();
      return { 
        start: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7), 
        end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30) 
      };
    }
    
    const dates = tasks
      .filter(t => t.start_date || t.deadline)
      .flatMap(t => [
        t.start_date ? new Date(t.start_date) : null,
        t.deadline ? new Date(t.deadline) : null
      ])
      .filter(Boolean) as Date[];
    
    if (dates.length === 0) {
      const today = new Date();
      return { 
        start: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7), 
        end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30) 
      };
    }
    
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 14);
    
    return { start: minDate, end: maxDate };
  }, [tasks]);

  const totalDays = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
  
  const dayWidth = useMemo(() => {
    return 60 * zoom;
  }, [zoom]);

  const chartWidth = totalDays * dayWidth;

  // Organize tasks with hierarchy
  const organizedTasks = useMemo(() => {
    const parentTasks = tasks.filter(t => !t.parent_task_id);
    const subtasksByParent: Record<string, Task[]> = {};
    
    tasks.filter(t => t.parent_task_id).forEach(subtask => {
      if (!subtasksByParent[subtask.parent_task_id!]) {
        subtasksByParent[subtask.parent_task_id!] = [];
      }
      subtasksByParent[subtask.parent_task_id!].push(subtask);
    });
    
    return { parentTasks, subtasksByParent };
  }, [tasks]);

  // Get task bar style - show all tasks even without dates
  const getTaskBarStyle = (task: Task) => {
    // If no dates, show placeholder bar starting today for 3 days
    if (!task.start_date && !task.deadline) {
      const today = new Date();
      const startOffset = Math.ceil((today.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        left: startOffset * dayWidth,
        width: dayWidth * 3, // 3 days default
        isPlaceholder: true
      };
    }
    
    // If only deadline, show 3 days before deadline
    if (!task.start_date && task.deadline) {
      const taskEnd = new Date(task.deadline);
      const taskStart = new Date(taskEnd);
      taskStart.setDate(taskStart.getDate() - 3);
      
      const startOffset = Math.ceil((taskStart.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
      const duration = 3;
      
      return {
        left: startOffset * dayWidth,
        width: duration * dayWidth,
        isPlaceholder: false
      };
    }
    
    // If only start_date, show 3 days from start
    if (task.start_date && !task.deadline) {
      const taskStart = new Date(task.start_date);
      const startOffset = Math.ceil((taskStart.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        left: startOffset * dayWidth,
        width: dayWidth * 3,
        isPlaceholder: false
      };
    }
    
    // Both dates available
    const taskStart = new Date(task.start_date!);
    const taskEnd = new Date(task.deadline!);
    
    const startOffset = Math.ceil((taskStart.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      left: startOffset * dayWidth,
      width: Math.max(duration * dayWidth, dayWidth),
      isPlaceholder: false
    };
  };

  // Generate timeline
  const generateTimelineColumns = () => {
    const columns: { date: Date; isWeekend: boolean; isToday: boolean }[] = [];
    const current = new Date(dateRange.start);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    while (current <= dateRange.end) {
      const isWeekend = current.getDay() === 0 || current.getDay() === 6;
      const isToday = current.getTime() === today.getTime();
      
      columns.push({ date: new Date(current), isWeekend, isToday });
      current.setDate(current.getDate() + 1);
    }
    
    return columns;
  };

  const timelineColumns = generateTimelineColumns();

  // Get week number
  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  // Generate week headers
  const generateWeekHeaders = () => {
    const headers: { weekNum: number; label: string; startCol: number; span: number }[] = [];
    let currentWeek = getWeekNumber(timelineColumns[0]?.date);
    let startCol = 0;
    let span = 0;
    
    timelineColumns.forEach((col, idx) => {
      const weekNum = getWeekNumber(col.date);
      if (weekNum !== currentWeek) {
        headers.push({
          weekNum: currentWeek,
          label: `W${currentWeek}`,
          startCol,
          span
        });
        currentWeek = weekNum;
        startCol = idx;
        span = 0;
      }
      span++;
    });
    
    if (span > 0) {
      headers.push({
        weekNum: currentWeek,
        label: `W${currentWeek}`,
        startCol,
        span
      });
    }
    
    return headers;
  };

  const weekHeaders = generateWeekHeaders();

  // Draw dependencies
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const taskYPositions: Record<string, number> = {};
    let yOffset = 0;
    
    organizedTasks.parentTasks.forEach(parentTask => {
      taskYPositions[parentTask._id] = yOffset + ROW_HEIGHT / 2;
      yOffset += ROW_HEIGHT;
      
      if (expandedTasks.has(parentTask._id)) {
        const subtasks = organizedTasks.subtasksByParent[parentTask._id] || [];
        subtasks.forEach(subtask => {
          taskYPositions[subtask._id] = yOffset + ROW_HEIGHT / 2;
          yOffset += ROW_HEIGHT;
        });
      }
    });
    
    tasks.forEach(task => {
      const taskDeps = dependencies[task._id];
      if (!taskDeps?.dependencies) return;
      
      taskDeps.dependencies.forEach(dep => {
        const dependsOnTaskId = dep.depends_on_task_id?._id;
        if (!dependsOnTaskId) return;
        
        const fromTask = tasks.find(t => t._id === dependsOnTaskId);
        if (!fromTask) return;
        
        const fromStyle = getTaskBarStyle(fromTask);
        const toStyle = getTaskBarStyle(task);
        
        if (!fromStyle || !toStyle) return;
        
        const fromY = taskYPositions[fromTask._id];
        const toY = taskYPositions[task._id];
        
        if (fromY === undefined || toY === undefined) return;
        
        const fromX = LEFT_PANEL_WIDTH + fromStyle.left + fromStyle.width - container.scrollLeft;
        const toX = LEFT_PANEL_WIDTH + toStyle.left - container.scrollLeft;
        
        if (fromX < -100 && toX < -100) return;
        if (fromX > canvas.width + 100 && toX > canvas.width + 100) return;
        
        const isHighlighted = hoveredTask === task._id || hoveredTask === fromTask._id;
        
        // Dependency type colors (ClickUp style)
        const depColors: Record<string, string> = {
          'FS': '#3b82f6',  // Blue - Finish to Start
          'SS': '#10b981',  // Green - Start to Start
          'FF': '#8b5cf6',  // Purple - Finish to Finish
          'SF': '#f59e0b'   // Orange - Start to Finish
        };
        const lineColor = isHighlighted ? '#7b68ee' : (depColors[dep.dependency_type] || '#d0d4da');
        
        // Draw S-curve line
        ctx.beginPath();
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = isHighlighted ? 3 : 2;
        
        const midX = (fromX + toX) / 2;
        const controlOffset = Math.min(Math.abs(toX - fromX) / 3, 50);
        
        ctx.moveTo(fromX, fromY);
        ctx.bezierCurveTo(
          fromX + controlOffset, fromY,
          toX - controlOffset, toY,
          toX, toY
        );
        ctx.stroke();
        
        // Arrow head
        const arrowSize = isHighlighted ? 10 : 8;
        const angle = Math.atan2(toY - fromY, toX - fromX);
        
        ctx.beginPath();
        ctx.fillStyle = lineColor;
        ctx.moveTo(toX, toY);
        ctx.lineTo(
          toX - arrowSize * Math.cos(angle - Math.PI / 6),
          toY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          toX - arrowSize * Math.cos(angle + Math.PI / 6),
          toY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
        
        // Dependency type label badge (on hover)
        if (isHighlighted) {
          const labelX = midX;
          const labelY = (fromY + toY) / 2 - 12;
          
          // Badge background
          ctx.fillStyle = lineColor;
          ctx.beginPath();
          ctx.roundRect(labelX - 15, labelY - 8, 30, 16, 4);
          ctx.fill();
          
          // Badge text
          ctx.font = 'bold 10px Inter, sans-serif';
          ctx.fillStyle = 'white';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(dep.dependency_type, labelX, labelY);
        }
      });
    });
  }, [tasks, dependencies, hoveredTask, dateRange, dayWidth, expandedTasks, organizedTasks]);

  const scrollToToday = () => {
    const container = containerRef.current;
    if (!container) return;
    
    const today = new Date();
    const daysFromStart = Math.ceil((today.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const scrollPosition = Math.max(0, daysFromStart * dayWidth - container.offsetWidth / 2);
    
    container.scrollLeft = scrollPosition;
  };

  const toggleTaskExpand = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (expandedTasks.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  return (
    <Paper sx={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden',
      bgcolor: '#ffffff',
      boxShadow: 'none',
      border: '1px solid #e5e7eb'
    }}>
      {/* ClickUp Toolbar */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        px: 2,
        py: 1.5,
        borderBottom: '1px solid #e5e7eb',
        bgcolor: '#fafbfc'
      }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          {/* Zoom */}
          <Stack direction="row" spacing={0.5}>
            <IconButton 
              size="small" 
              onClick={() => setZoom(Math.max(zoom - 0.2, 0.5))}
              sx={{ 
                width: 32,
                height: 32,
                bgcolor: 'white',
                border: '1px solid #e5e7eb',
                '&:hover': { bgcolor: '#f9fafb' }
              }}
            >
              <ZoomOut sx={{ fontSize: 16 }} />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={() => setZoom(Math.min(zoom + 0.2, 2))}
              sx={{ 
                width: 32,
                height: 32,
                bgcolor: 'white',
                border: '1px solid #e5e7eb',
                '&:hover': { bgcolor: '#f9fafb' }
              }}
            >
              <ZoomIn sx={{ fontSize: 16 }} />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={scrollToToday}
              sx={{ 
                width: 32,
                height: 32,
                bgcolor: '#7b68ee',
                color: 'white',
                border: '1px solid #7b68ee',
                '&:hover': { bgcolor: '#6952d6' }
              }}
            >
              <Today sx={{ fontSize: 16 }} />
            </IconButton>
          </Stack>

          {/* Time Scale */}
          <ToggleButtonGroup
            value={timeScale}
            exclusive
            onChange={(_, value) => value && setTimeScale(value)}
            size="small"
            sx={{ 
              '& .MuiToggleButton-root': {
                px: 1.5,
                py: 0.5,
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'none',
                border: '1px solid #e5e7eb',
                color: '#6b7280',
                '&.Mui-selected': {
                  bgcolor: '#7b68ee',
                  color: 'white',
                  '&:hover': { bgcolor: '#6952d6' }
                }
              }
            }}
          >
            <ToggleButton value="day">Day</ToggleButton>
            <ToggleButton value="week">Week</ToggleButton>
            <ToggleButton value="month">Month</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Box>

      {/* Gantt Container */}
      <Box 
        ref={containerRef}
        sx={{ 
          flex: 1, 
          display: 'flex',
          overflow: 'auto',
          position: 'relative',
          bgcolor: '#ffffff'
        }}
      >
        {/* Canvas for dependency arrows */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: HEADER_HEIGHT,
            left: 0,
            pointerEvents: 'none',
            zIndex: 1
          }}
        />

        {/* Left Panel */}
        <Box sx={{ 
          width: LEFT_PANEL_WIDTH,
          flexShrink: 0,
          borderRight: '1px solid #e5e7eb',
          bgcolor: '#fafbfc',
          position: 'sticky',
          left: 0,
          zIndex: 3
        }}>
          {/* Header */}
          <Box sx={{ 
            height: HEADER_HEIGHT,
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            px: 2,
            bgcolor: '#f5f6f8'
          }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton size="small" sx={{ p: 0.5 }}>
                <Add sx={{ fontSize: 16, color: '#6b7280' }} />
              </IconButton>
              <Typography sx={{ 
                fontSize: '12px', 
                fontWeight: 600, 
                color: '#6b7280',
                textTransform: 'none'
              }}>
                Name
              </Typography>
            </Stack>
          </Box>

          {/* Task List */}
          <Box>
            {organizedTasks.parentTasks.map((task, taskIndex) => {
              const hasSubtasks = (organizedTasks.subtasksByParent[task._id]?.length || 0) > 0;
              const isExpanded = expandedTasks.has(task._id);
              const taskColor = getTaskColor(task, taskIndex);
              
              return (
                <Box key={task._id}>
                  {/* Parent Task Row */}
                  <Box
                    sx={{
                      height: ROW_HEIGHT,
                      px: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      borderBottom: '1px solid #f0f1f3',
                      bgcolor: hoveredTask === task._id ? '#f9fafb' : 'white',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: '#f9fafb'
                      }
                    }}
                    onMouseEnter={() => setHoveredTask(task._id)}
                    onMouseLeave={() => setHoveredTask(null)}
                    onClick={() => onTaskClick?.(task._id)}
                  >
                    {/* Expand/Collapse */}
                    {hasSubtasks ? (
                      <IconButton 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTaskExpand(task._id);
                        }}
                        sx={{ p: 0, width: 20, height: 20 }}
                      >
                        {isExpanded ? (
                          <ExpandMore sx={{ fontSize: 16, color: '#6b7280' }} />
                        ) : (
                          <ChevronRight sx={{ fontSize: 16, color: '#6b7280' }} />
                        )}
                      </IconButton>
                    ) : (
                      <Box sx={{ width: 20 }} />
                    )}

                    {/* Hierarchy Icon */}
                    <MenuIcon sx={{ fontSize: 14, color: '#d1d5db' }} />

                    {/* Color Dot */}
                    <Circle sx={{ fontSize: 12, color: taskColor }} />

                        {/* Task Title */}
                        <Typography sx={{
                          flex: 1,
                          fontSize: '13px',
                          fontWeight: 400,
                          color: '#292d34',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {task.title}
                        </Typography>
                        
                        {/* Subtask Count Badge */}
                        {hasSubtasks && (
                          <Tooltip title={`${organizedTasks.subtasksByParent[task._id].length} subtasks`}>
                            <Box sx={{
                              px: 0.75,
                              py: 0.25,
                              borderRadius: 1,
                              bgcolor: '#f3f4f6',
                              fontSize: '10px',
                              fontWeight: 600,
                              color: '#6b7280',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5
                            }}>
                              <MenuIcon sx={{ fontSize: 10 }} />
                              {organizedTasks.subtasksByParent[task._id].length}
                            </Box>
                          </Tooltip>
                        )}
                      </Box>

                  {/* Subtasks with visual connection */}
                  {isExpanded && organizedTasks.subtasksByParent[task._id]?.map((subtask, subIndex) => {
                    const subtaskColor = getTaskColor(subtask, taskIndex + subIndex + 1);
                    const isLastSubtask = subIndex === organizedTasks.subtasksByParent[task._id].length - 1;
                    
                    return (
                      <Box
                        key={subtask._id}
                        sx={{
                          height: ROW_HEIGHT,
                          px: 2,
                          pl: 5,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          borderBottom: '1px solid #f0f1f3',
                          bgcolor: hoveredTask === subtask._id ? '#f5f3ff' : '#fafbfc',
                          cursor: 'pointer',
                          position: 'relative',
                          '&:hover': {
                            bgcolor: '#f5f3ff'
                          },
                          // Tree connection line
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            left: '28px',
                            top: 0,
                            bottom: isLastSubtask ? '50%' : 0,
                            width: '2px',
                            bgcolor: '#e5e7eb'
                          },
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            left: '28px',
                            top: '50%',
                            width: '12px',
                            height: '2px',
                            bgcolor: '#e5e7eb'
                          }
                        }}
                        onMouseEnter={() => setHoveredTask(subtask._id)}
                        onMouseLeave={() => setHoveredTask(null)}
                        onClick={() => onTaskClick?.(subtask._id)}
                      >
                        <Box sx={{ width: 20 }} />
                        <MenuIcon sx={{ fontSize: 14, color: '#d1d5db' }} />
                        <Circle sx={{ fontSize: 12, color: subtaskColor }} />
                        
                        <Typography sx={{
                          flex: 1,
                          fontSize: '12px',
                          fontWeight: 400,
                          color: '#6b7280',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {subtask.title}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              );
            })}

            {/* Add Task Button */}
            <Box sx={{
              height: 40,
              px: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              borderBottom: '1px solid #f0f1f3',
              bgcolor: 'white',
              cursor: 'pointer',
              '&:hover': {
                bgcolor: '#f9fafb'
              }
            }}>
              <Add sx={{ fontSize: 16, color: '#9ca3af' }} />
              <Typography sx={{ fontSize: '13px', color: '#9ca3af', fontWeight: 400 }}>
                Add Task
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Right Panel - Timeline */}
        <Box sx={{ flex: 1, position: 'relative', bgcolor: 'white' }}>
          {/* Timeline Header */}
          <Box sx={{ 
            height: HEADER_HEIGHT,
            borderBottom: '1px solid #e5e7eb',
            position: 'sticky',
            top: 0,
            bgcolor: '#f5f6f8',
            zIndex: 2
          }}>
            {/* Week Headers */}
            <Box sx={{ 
              height: 32,
              display: 'flex',
              borderBottom: '1px solid #e5e7eb'
            }}>
              {weekHeaders.map((header, idx) => (
                <Box
                  key={idx}
                  sx={{
                    width: header.span * dayWidth,
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: 2,
                    borderRight: idx < weekHeaders.length - 1 ? '1px solid #e5e7eb' : 'none',
                    bgcolor: '#f5f6f8'
                  }}
                >
                  <Typography sx={{ 
                    fontSize: '11px', 
                    fontWeight: 600, 
                    color: '#6b7280'
                  }}>
                    {header.label}
                  </Typography>
                  <Typography sx={{ 
                    fontSize: '11px', 
                    fontWeight: 400, 
                    color: '#9ca3af',
                    ml: 1
                  }}>
                    {timelineColumns[header.startCol]?.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' - '}
                    {timelineColumns[header.startCol + header.span - 1]?.date.toLocaleDateString('en-US', { day: 'numeric' })}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Day Headers */}
            <Box sx={{ height: 40, display: 'flex' }}>
              {timelineColumns.map((col, idx) => (
                <Box
                  key={idx}
                  sx={{
                    width: dayWidth,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRight: '1px solid #e5e7eb',
                    bgcolor: col.isToday 
                      ? '#ffffff' 
                      : col.isWeekend 
                      ? '#f9fafb' 
                      : '#ffffff',
                    position: 'relative'
                  }}
                >
                  <Typography sx={{ 
                    fontSize: '10px', 
                    fontWeight: 500,
                    color: '#9ca3af',
                    mb: 0.25
                  }}>
                    {col.date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </Typography>
                  
                  {/* Date with circle for today */}
                  {col.isToday ? (
                    <Box sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: '#ff4757',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Typography sx={{ 
                        fontSize: '12px', 
                        fontWeight: 700,
                        color: 'white'
                      }}>
                        {col.date.getDate()}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography sx={{ 
                      fontSize: '13px', 
                      fontWeight: 500,
                      color: col.isWeekend ? '#9ca3af' : '#292d34'
                    }}>
                      {col.date.getDate()}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </Box>

          {/* Task Bars Area */}
          <Box sx={{ position: 'relative', minWidth: chartWidth, minHeight: '100%' }}>
            {/* Today Line */}
            {(() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const daysFromStart = Math.ceil((today.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
              const todayX = daysFromStart * dayWidth;
              
              return (
                <Box sx={{
                  position: 'absolute',
                  left: todayX,
                  top: 0,
                  bottom: 0,
                  width: 2,
                  bgcolor: '#ff4757',
                  zIndex: 2,
                  pointerEvents: 'none'
                }} />
              );
            })()}

            {/* Weekend Columns with diagonal stripes */}
            <svg 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0
              }}
            >
              <defs>
                <pattern id="diagonal-stripe" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                  <rect width="4" height="8" fill="#f3f4f6" />
                  <rect x="4" width="4" height="8" fill="transparent" />
                </pattern>
              </defs>
              {timelineColumns.map((col, idx) => 
                col.isWeekend ? (
                  <rect
                    key={`weekend-${idx}`}
                    x={idx * dayWidth}
                    y={0}
                    width={dayWidth}
                    height="100%"
                    fill="url(#diagonal-stripe)"
                  />
                ) : null
              )}
            </svg>

            {/* Grid Lines */}
            {timelineColumns.map((col, idx) => (
              <Box
                key={`grid-${idx}`}
                sx={{
                  position: 'absolute',
                  left: idx * dayWidth,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  bgcolor: '#f0f1f3',
                  pointerEvents: 'none'
                }}
              />
            ))}

            {/* Task Bars */}
            {organizedTasks.parentTasks.map((task, taskIndex) => {
              const barStyle = getTaskBarStyle(task);
              const hasSubtasks = (organizedTasks.subtasksByParent[task._id]?.length || 0) > 0;
              const isExpanded = expandedTasks.has(task._id);
              
              return (
                <Box key={task._id}>
                  {/* Parent Task Bar - Always render */}
                  <Box
                    sx={{
                      height: ROW_HEIGHT,
                      position: 'relative',
                      borderBottom: '1px solid #f0f1f3'
                    }}
                    onMouseEnter={() => setHoveredTask(task._id)}
                    onMouseLeave={() => setHoveredTask(null)}
                  >
                    {barStyle && (
                      <ClickUpTaskBar 
                        task={task}
                        barStyle={barStyle}
                        taskColor={getTaskColor(task, taskIndex)}
                        isHovered={hoveredTask === task._id}
                        isPlaceholder={barStyle.isPlaceholder}
                        isSubtask={false}
                        onClick={() => onTaskClick?.(task._id)}
                      />
                    )}
                  </Box>

                  {/* Subtask Bars - Always render */}
                  {isExpanded && organizedTasks.subtasksByParent[task._id]?.map((subtask, subIndex) => {
                    const subBarStyle = getTaskBarStyle(subtask);
                    
                    return (
                      <Box
                        key={subtask._id}
                        sx={{
                          height: ROW_HEIGHT,
                          position: 'relative',
                          borderBottom: '1px solid #f0f1f3'
                        }}
                        onMouseEnter={() => setHoveredTask(subtask._id)}
                        onMouseLeave={() => setHoveredTask(null)}
                      >
                        {subBarStyle && (
                          <ClickUpTaskBar 
                            task={subtask}
                            barStyle={subBarStyle}
                            taskColor={getTaskColor(subtask, taskIndex + subIndex + 1)}
                            isHovered={hoveredTask === subtask._id}
                            isPlaceholder={subBarStyle.isPlaceholder}
                            isSubtask={true}
                            onClick={() => onTaskClick?.(subtask._id)}
                          />
                        )}
                      </Box>
                    );
                  })}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* Legend - ClickUp Style */}
      <Box sx={{ 
        display: 'flex', 
        gap: 3, 
        p: 2, 
        borderTop: '1px solid #e5e7eb',
        bgcolor: '#fafbfc',
        fontSize: '11px',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Stack direction="row" spacing={3} flexWrap="wrap">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 2, height: 14, bgcolor: '#ff4757', borderRadius: 1 }} />
            <Typography fontSize="11px" fontWeight={500}>Today</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 16, height: 8, bgcolor: '#f3f4f6' }}>
              <svg width="16" height="8">
                <pattern id="legend-stripe" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
                  <rect width="2" height="4" fill="#e5e7eb" />
                </pattern>
                <rect width="16" height="8" fill="url(#legend-stripe)" />
              </svg>
            </Box>
            <Typography fontSize="11px" fontWeight={500}>Weekend</Typography>
          </Box>
        </Stack>

        {/* Dependency Types Legend */}
        <Stack direction="row" spacing={3} flexWrap="wrap">
          <Typography fontSize="11px" fontWeight={700} color="#6b7280">Dependencies:</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 20, height: 2, bgcolor: '#3b82f6' }} />
            <Typography fontSize="11px" fontWeight={500}>FS</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 20, height: 2, bgcolor: '#10b981' }} />
            <Typography fontSize="11px" fontWeight={500}>SS</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 20, height: 2, bgcolor: '#8b5cf6' }} />
            <Typography fontSize="11px" fontWeight={500}>FF</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 20, height: 2, bgcolor: '#f59e0b' }} />
            <Typography fontSize="11px" fontWeight={500}>SF</Typography>
          </Box>
        </Stack>
      </Box>
    </Paper>
  );
}

// ClickUp Task Bar Component
function ClickUpTaskBar({ 
  task, 
  barStyle, 
  taskColor, 
  isHovered,
  isPlaceholder = false,
  isSubtask = false,
  onClick 
}: { 
  task: Task; 
  barStyle: { left: number; width: number; isPlaceholder?: boolean };
  taskColor: string;
  isHovered: boolean;
  isPlaceholder?: boolean;
  isSubtask?: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip
      title={
        <Box sx={{ p: 0.5 }}>
          <Typography fontSize="12px" fontWeight={600} sx={{ mb: 0.5 }}>
            {isSubtask && '└ '}{task.title}
          </Typography>
          {isPlaceholder ? (
            <Typography fontSize="10px" color="rgba(255,255,255,0.8)">
              ⚠️ No dates set - Click to add start/end dates
            </Typography>
          ) : (
            <Typography fontSize="10px" color="rgba(255,255,255,0.8)">
              {task.start_date && new Date(task.start_date).toLocaleDateString('en-US', { 
                month: 'short', day: 'numeric' 
              })} - {task.deadline && new Date(task.deadline).toLocaleDateString('en-US', { 
                month: 'short', day: 'numeric', year: 'numeric' 
              })}
            </Typography>
          )}
          {task.progress !== undefined && (
            <Typography fontSize="10px" sx={{ mt: 0.5 }}>
              Progress: {task.progress}%
            </Typography>
          )}
          {isSubtask && (
            <Typography fontSize="10px" sx={{ mt: 0.5, color: '#a78bfa' }}>
              📎 Subtask
            </Typography>
          )}
        </Box>
      }
      placement="top"
      arrow
    >
      <Box
        sx={{
          position: 'absolute',
          left: barStyle.left,
          width: barStyle.width,
          height: isSubtask ? 24 : 28,
          top: isSubtask ? 8 : 6,
          bgcolor: taskColor,
          borderRadius: 1.5,
          cursor: 'pointer',
          boxShadow: isHovered
            ? `0 4px 12px ${taskColor}60`
            : '0 1px 3px rgba(0,0,0,0.1)',
          transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          zIndex: isHovered ? 10 : 1,
          opacity: isPlaceholder ? 0.5 : isSubtask ? 0.85 : 1,
          border: isPlaceholder 
            ? '2px dashed rgba(123, 104, 238, 0.5)' 
            : isSubtask 
            ? `2px solid ${taskColor}` 
            : 'none'
        }}
        onClick={onClick}
      >
        {/* Progress Bar */}
        {task.progress !== undefined && task.progress > 0 && (
          <Box sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${task.progress}%`,
            bgcolor: 'rgba(255,255,255,0.25)',
            borderRight: task.progress < 100 ? '1px solid rgba(255,255,255,0.5)' : 'none'
          }} />
        )}
        
        {/* Task Label */}
        <Box sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          px: 1.5
        }}>
          <Typography sx={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'white',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {barStyle.width > 60 ? task.title : ''}
          </Typography>
        </Box>

        {/* Dependency Start/End Indicators */}
        {!isSubtask && !isPlaceholder && barStyle.width > 30 && (
          <>
            {/* Start circle (for SS dependencies) */}
            <Box sx={{
              position: 'absolute',
              left: -5,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 10,
              height: 10,
              bgcolor: 'white',
              border: `2px solid ${taskColor}`,
              borderRadius: '50%',
              zIndex: 2
            }} />
            
            {/* End diamond (for FS, FF dependencies) */}
            <Box sx={{
              position: 'absolute',
              right: -6,
              top: '50%',
              transform: 'translateY(-50%) rotate(45deg)',
              width: 10,
              height: 10,
              bgcolor: taskColor,
              border: '2px solid white',
              borderRadius: 0.5,
              zIndex: 2
            }} />
          </>
        )}
      </Box>
    </Tooltip>
  );
}

