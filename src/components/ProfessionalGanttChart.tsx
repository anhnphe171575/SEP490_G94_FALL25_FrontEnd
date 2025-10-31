"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { 
  Box, 
  Typography, 
  Tooltip, 
  Chip, 
  Paper, 
  IconButton, 
  Avatar,
  Stack,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  ToggleButtonGroup,
  ToggleButton
} from "@mui/material";
import { 
  ZoomIn, 
  ZoomOut, 
  Today,
  ChevronLeft,
  ChevronRight,
  FilterList,
  ViewWeek,
  ViewDay,
  CalendarMonth
} from "@mui/icons-material";

interface Task {
  _id: string;
  title: string;
  start_date?: string;
  deadline?: string;
  status?: string;
  assignee_id?: any;
  progress?: number;
  priority?: string;
}

interface Dependency {
  _id: string;
  task_id: string;
  depends_on_task_id: any;
  dependency_type: 'FS' | 'FF' | 'SS' | 'SF';
}

interface ProfessionalGanttChartProps {
  tasks: Task[];
  dependencies: Record<string, { dependencies: Dependency[]; dependents: Dependency[] }>;
  onTaskClick?: (taskId: string) => void;
}

type TimeScale = 'day' | 'week' | 'month';
type GroupBy = 'none' | 'assignee' | 'status' | 'priority';

export default function ProfessionalGanttChart({ 
  tasks, 
  dependencies,
  onTaskClick 
}: ProfessionalGanttChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [timeScale, setTimeScale] = useState<TimeScale>('week');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [zoom, setZoom] = useState(1);
  const [scrollLeft, setScrollLeft] = useState(0);

  const ROW_HEIGHT = 48;
  const HEADER_HEIGHT = 80;
  const LEFT_PANEL_WIDTH = 280;

  // Calculate date range with padding
  const dateRange = useMemo(() => {
    if (tasks.length === 0) {
      const today = new Date();
      return { 
        start: new Date(today.getFullYear(), today.getMonth(), 1), 
        end: new Date(today.getFullYear(), today.getMonth() + 3, 0) 
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
        start: new Date(today.getFullYear(), today.getMonth(), 1), 
        end: new Date(today.getFullYear(), today.getMonth() + 3, 0) 
      };
    }
    
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Add padding
    const paddingDays = timeScale === 'day' ? 7 : timeScale === 'week' ? 14 : 30;
    minDate.setDate(minDate.getDate() - paddingDays);
    maxDate.setDate(maxDate.getDate() + paddingDays);
    
    return { start: minDate, end: maxDate };
  }, [tasks, timeScale]);

  const totalDays = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));

  // Group tasks
  const groupedTasks = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Tasks': tasks };
    }
    
    const groups: Record<string, Task[]> = {};
    
    tasks.forEach(task => {
      let key = 'Unassigned';
      
      switch (groupBy) {
        case 'assignee':
          key = task.assignee_id?.full_name || task.assignee_id?.email || 'Unassigned';
          break;
        case 'status':
          key = task.status || 'No Status';
          break;
        case 'priority':
          key = task.priority || 'No Priority';
          break;
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    });
    
    return groups;
  }, [tasks, groupBy]);

  // Calculate pixel width per day
  const dayWidth = useMemo(() => {
    const base = timeScale === 'day' ? 40 : timeScale === 'week' ? 20 : 8;
    return base * zoom;
  }, [timeScale, zoom]);

  const chartWidth = totalDays * dayWidth;

  // Get task bar position and width
  const getTaskBarStyle = (task: Task) => {
    if (!task.start_date || !task.deadline) return null;
    
    const taskStart = new Date(task.start_date);
    const taskEnd = new Date(task.deadline);
    
    const startOffset = Math.ceil((taskStart.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      left: startOffset * dayWidth,
      width: Math.max(duration * dayWidth, dayWidth), // Minimum 1 day width
    };
  };

  // Get task color
  const getTaskColor = (task: Task) => {
    const status = (task.status || '').toLowerCase();
    if (status.includes('done') || status.includes('completed')) return { bg: '#22c55e', border: '#16a34a', text: '#fff' };
    if (status.includes('progress') || status.includes('doing')) return { bg: '#3b82f6', border: '#2563eb', text: '#fff' };
    if (status.includes('review') || status.includes('testing')) return { bg: '#f59e0b', border: '#d97706', text: '#fff' };
    if (status.includes('blocked')) return { bg: '#ef4444', border: '#dc2626', text: '#fff' };
    return { bg: '#94a3b8', border: '#64748b', text: '#fff' };
  };

  // Get priority color
  const getPriorityColor = (priority?: string) => {
    const p = (priority || '').toLowerCase();
    if (p.includes('critical') || p.includes('high')) return '#ef4444';
    if (p.includes('medium')) return '#f59e0b';
    return '#3b82f6';
  };

  // Generate timeline header (weeks/months)
  const generateTimelineColumns = () => {
    const columns: { date: Date; isWeekend: boolean; isToday: boolean }[] = [];
    const current = new Date(dateRange.start);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    while (current <= dateRange.end) {
      const isWeekend = current.getDay() === 0 || current.getDay() === 6;
      const isToday = current.getTime() === today.getTime();
      
      columns.push({
        date: new Date(current),
        isWeekend,
        isToday
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return columns;
  };

  const timelineColumns = generateTimelineColumns();

  // Generate month headers
  const generateMonthHeaders = () => {
    const headers: { label: string; startCol: number; span: number }[] = [];
    let currentMonth = timelineColumns[0]?.date.getMonth();
    let currentYear = timelineColumns[0]?.date.getFullYear();
    let startCol = 0;
    let span = 0;
    
    timelineColumns.forEach((col, idx) => {
      if (col.date.getMonth() !== currentMonth || col.date.getFullYear() !== currentYear) {
        headers.push({
          label: new Date(currentYear, currentMonth).toLocaleDateString('en-US', { 
            month: 'short', 
            year: 'numeric' 
          }),
          startCol,
          span
        });
        currentMonth = col.date.getMonth();
        currentYear = col.date.getFullYear();
        startCol = idx;
        span = 0;
      }
      span++;
    });
    
    // Add last month
    if (span > 0) {
      headers.push({
        label: new Date(currentYear, currentMonth).toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric' 
        }),
        startCol,
        span
      });
    }
    
    return headers;
  };

  const monthHeaders = generateMonthHeaders();

  // Draw dependency lines on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Get all tasks in flat list
    const allTasks = Object.values(groupedTasks).flat();
    const taskYPositions: Record<string, number> = {};
    
    let yOffset = 0;
    Object.entries(groupedTasks).forEach(([groupName, groupTasks]) => {
      yOffset += 40; // Group header height
      groupTasks.forEach((task, idx) => {
        taskYPositions[task._id] = yOffset + idx * ROW_HEIGHT + ROW_HEIGHT / 2;
      });
      yOffset += groupTasks.length * ROW_HEIGHT;
    });
    
    // Draw dependency lines
    allTasks.forEach(task => {
      const taskDeps = dependencies[task._id];
      if (!taskDeps?.dependencies) return;
      
      taskDeps.dependencies.forEach(dep => {
        const dependsOnTaskId = dep.depends_on_task_id?._id;
        if (!dependsOnTaskId) return;
        
        const fromTask = allTasks.find(t => t._id === dependsOnTaskId);
        if (!fromTask) return;
        
        const fromStyle = getTaskBarStyle(fromTask);
        const toStyle = getTaskBarStyle(task);
        
        if (!fromStyle || !toStyle) return;
        
        const fromY = taskYPositions[fromTask._id];
        const toY = taskYPositions[task._id];
        
        if (fromY === undefined || toY === undefined) return;
        
        // Calculate connection points
        let fromX, toX;
        
        switch (dep.dependency_type) {
          case 'FS':
            fromX = LEFT_PANEL_WIDTH + fromStyle.left + fromStyle.width - container.scrollLeft;
            toX = LEFT_PANEL_WIDTH + toStyle.left - container.scrollLeft;
            break;
          case 'SS':
            fromX = LEFT_PANEL_WIDTH + fromStyle.left - container.scrollLeft;
            toX = LEFT_PANEL_WIDTH + toStyle.left - container.scrollLeft;
            break;
          case 'FF':
            fromX = LEFT_PANEL_WIDTH + fromStyle.left + fromStyle.width - container.scrollLeft;
            toX = LEFT_PANEL_WIDTH + toStyle.left + toStyle.width - container.scrollLeft;
            break;
          case 'SF':
            fromX = LEFT_PANEL_WIDTH + fromStyle.left - container.scrollLeft;
            toX = LEFT_PANEL_WIDTH + toStyle.left + toStyle.width - container.scrollLeft;
            break;
          default:
            return;
        }
        
        // Only draw if in viewport
        if (fromX < 0 && toX < 0) return;
        if (fromX > canvas.width && toX > canvas.width) return;
        
        const isHighlighted = hoveredTask === task._id || 
                             hoveredTask === fromTask._id ||
                             selectedTask === task._id ||
                             selectedTask === fromTask._id;
        
        // Draw path
        ctx.beginPath();
        ctx.strokeStyle = isHighlighted ? '#7b68ee' : '#cbd5e1';
        ctx.lineWidth = isHighlighted ? 3 : 2;
        
        // S-curve
        const midX = (fromX + toX) / 2;
        const controlOffset = Math.min(Math.abs(toX - fromX) / 3, 50);
        
        ctx.moveTo(fromX, fromY);
        ctx.bezierCurveTo(
          fromX + controlOffset, fromY,
          toX - controlOffset, toY,
          toX, toY
        );
        ctx.stroke();
        
        // Arrowhead
        const arrowSize = isHighlighted ? 10 : 8;
        const angle = Math.atan2(toY - fromY, toX - fromX);
        
        ctx.beginPath();
        ctx.fillStyle = isHighlighted ? '#7b68ee' : '#cbd5e1';
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
        
        // Dependency type label (on hover)
        if (isHighlighted) {
          ctx.font = 'bold 11px Inter, sans-serif';
          ctx.fillStyle = '#7b68ee';
          ctx.textAlign = 'center';
          ctx.fillText(dep.dependency_type, midX, (fromY + toY) / 2 - 8);
        }
      });
    });
  }, [groupedTasks, dependencies, hoveredTask, selectedTask, dateRange, dayWidth, scrollLeft]);

  const scrollToToday = () => {
    const container = containerRef.current;
    if (!container) return;
    
    const today = new Date();
    const daysFromStart = Math.ceil((today.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const scrollPosition = Math.max(0, daysFromStart * dayWidth - container.offsetWidth / 2);
    
    container.scrollLeft = scrollPosition;
  };

  return (
    <Paper sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Toolbar */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        p: 2,
        borderBottom: '1px solid #e5e7eb',
        bgcolor: '#fafbfc'
      }}>
        <Stack direction="row" spacing={2} alignItems="center">
          {/* Zoom Controls */}
          <Stack direction="row" spacing={0.5} sx={{ 
            bgcolor: 'white',
            borderRadius: 1,
            border: '1px solid #e5e7eb',
            p: 0.5
          }}>
            <Tooltip title="Zoom Out">
              <IconButton size="small" onClick={() => setZoom(Math.max(zoom - 0.2, 0.5))}>
                <ZoomOut sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem />
            <Tooltip title="Zoom In">
              <IconButton size="small" onClick={() => setZoom(Math.min(zoom + 0.2, 2))}>
                <ZoomIn sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem />
            <Tooltip title="Today">
              <IconButton size="small" onClick={scrollToToday}>
                <Today sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Stack>

          {/* Time Scale */}
          <ToggleButtonGroup
            value={timeScale}
            exclusive
            onChange={(_, value) => value && setTimeScale(value)}
            size="small"
            sx={{ 
              bgcolor: 'white',
              '& .MuiToggleButton-root': {
                px: 1.5,
                py: 0.5,
                fontSize: '12px',
                textTransform: 'none',
                border: '1px solid #e5e7eb',
                '&.Mui-selected': {
                  bgcolor: '#7b68ee',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#6952d6'
                  }
                }
              }
            }}
          >
            <ToggleButton value="day">
              <ViewDay sx={{ fontSize: 16, mr: 0.5 }} />
              Day
            </ToggleButton>
            <ToggleButton value="week">
              <ViewWeek sx={{ fontSize: 16, mr: 0.5 }} />
              Week
            </ToggleButton>
            <ToggleButton value="month">
              <CalendarMonth sx={{ fontSize: 16, mr: 0.5 }} />
              Month
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Group By */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              sx={{ 
                bgcolor: 'white',
                fontSize: '13px',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#e5e7eb'
                }
              }}
            >
              <MenuItem value="none">No Grouping</MenuItem>
              <MenuItem value="assignee">Group by Assignee</MenuItem>
              <MenuItem value="status">Group by Status</MenuItem>
              <MenuItem value="priority">Group by Priority</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {/* Task Count */}
        <Typography sx={{ fontSize: '13px', color: '#6b7280', fontWeight: 600 }}>
          {tasks.length} {tasks.length === 1 ? 'Task' : 'Tasks'}
        </Typography>
      </Box>

      {/* Gantt Chart Container */}
      <Box 
        ref={containerRef}
        sx={{ 
          flex: 1, 
          display: 'flex',
          overflow: 'auto',
          position: 'relative',
          bgcolor: 'white'
        }}
        onScroll={(e) => setScrollLeft(e.currentTarget.scrollLeft)}
      >
        {/* Canvas for dependency lines */}
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

        {/* Left Panel - Task Names */}
        <Box sx={{ 
          width: LEFT_PANEL_WIDTH,
          flexShrink: 0,
          borderRight: '2px solid #e5e7eb',
          bgcolor: '#fafbfc',
          position: 'sticky',
          left: 0,
          zIndex: 3
        }}>
          {/* Header */}
          <Box sx={{ 
            height: HEADER_HEIGHT,
            borderBottom: '2px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            px: 2,
            bgcolor: '#f8f9fb'
          }}>
            <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>
              Task Name
            </Typography>
          </Box>

          {/* Task Rows */}
          <Box>
            {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
              <Box key={groupName}>
                {/* Group Header */}
                {groupBy !== 'none' && (
                  <Box sx={{ 
                    height: 40,
                    px: 2,
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: '#f3f4f6',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>
                      {groupName} ({groupTasks.length})
                    </Typography>
                  </Box>
                )}

                {/* Group Tasks */}
                {groupTasks.map((task) => {
                  const colors = getTaskColor(task);
                  const hasDeps = dependencies[task._id]?.dependencies?.length > 0;
                  
                  return (
                    <Box
                      key={task._id}
                      sx={{
                        height: ROW_HEIGHT,
                        px: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        borderBottom: '1px solid #f3f4f6',
                        cursor: 'pointer',
                        bgcolor: hoveredTask === task._id || selectedTask === task._id ? '#f5f3ff' : 'transparent',
                        '&:hover': {
                          bgcolor: '#f5f3ff'
                        }
                      }}
                      onMouseEnter={() => setHoveredTask(task._id)}
                      onMouseLeave={() => setHoveredTask(null)}
                      onClick={() => {
                        setSelectedTask(task._id);
                        onTaskClick?.(task._id);
                      }}
                    >
                      {/* Priority Indicator */}
                      <Box sx={{ 
                        width: 3,
                        height: 24,
                        bgcolor: getPriorityColor(task.priority),
                        borderRadius: 1,
                        flexShrink: 0
                      }} />

                      {/* Task Title */}
                      <Tooltip title={task.title} placement="top">
                        <Typography sx={{
                          flex: 1,
                          fontSize: '13px',
                          fontWeight: 500,
                          color: '#1f2937',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {task.title}
                        </Typography>
                      </Tooltip>

                      {/* Dependency Indicator */}
                      {hasDeps && (
                        <Chip 
                          label={dependencies[task._id].dependencies.length}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '10px',
                            bgcolor: '#fee2e2',
                            color: '#dc2626',
                            fontWeight: 600
                          }}
                        />
                      )}

                      {/* Assignee Avatar */}
                      {task.assignee_id && (
                        <Avatar sx={{ 
                          width: 24, 
                          height: 24,
                          fontSize: '10px',
                          bgcolor: '#7b68ee'
                        }}>
                          {(task.assignee_id?.full_name || task.assignee_id?.email || 'U')[0].toUpperCase()}
                        </Avatar>
                      )}
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Right Panel - Timeline */}
        <Box sx={{ flex: 1, position: 'relative' }}>
          {/* Timeline Header */}
          <Box sx={{ 
            height: HEADER_HEIGHT,
            borderBottom: '2px solid #e5e7eb',
            position: 'sticky',
            top: 0,
            bgcolor: '#f8f9fb',
            zIndex: 2
          }}>
            {/* Month Headers */}
            <Box sx={{ 
              height: 32,
              display: 'flex',
              borderBottom: '1px solid #e5e7eb'
            }}>
              {monthHeaders.map((header, idx) => (
                <Box
                  key={idx}
                  sx={{
                    width: header.span * dayWidth,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRight: '1px solid #e5e7eb',
                    bgcolor: '#f3f4f6'
                  }}
                >
                  <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
                    {header.label}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Day Headers */}
            <Box sx={{ height: 48, display: 'flex' }}>
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
                    bgcolor: col.isToday ? '#fef3c7' : col.isWeekend ? '#fafbfc' : 'white',
                    borderTop: col.isToday ? '3px solid #f59e0b' : 'none'
                  }}
                >
                  <Typography sx={{ 
                    fontSize: '10px', 
                    fontWeight: 600,
                    color: col.isToday ? '#f59e0b' : col.isWeekend ? '#9ca3af' : '#6b7280'
                  }}>
                    {col.date.toLocaleDateString('en-US', { weekday: 'short' })[0]}
                  </Typography>
                  <Typography sx={{ 
                    fontSize: '11px', 
                    fontWeight: col.isToday ? 700 : 600,
                    color: col.isToday ? '#f59e0b' : col.isWeekend ? '#9ca3af' : '#374151'
                  }}>
                    {col.date.getDate()}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Task Bars */}
          <Box sx={{ position: 'relative', minWidth: chartWidth }}>
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
                  bgcolor: '#f59e0b',
                  zIndex: 2,
                  pointerEvents: 'none'
                }} />
              );
            })()}

            {/* Weekend Columns */}
            {timelineColumns.map((col, idx) => 
              col.isWeekend ? (
                <Box
                  key={`weekend-${idx}`}
                  sx={{
                    position: 'absolute',
                    left: idx * dayWidth,
                    top: 0,
                    bottom: 0,
                    width: dayWidth,
                    bgcolor: '#fafbfc',
                    pointerEvents: 'none'
                  }}
                />
              ) : null
            )}

            {/* Task Rows */}
            {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
              <Box key={groupName}>
                {/* Group Header Spacer */}
                {groupBy !== 'none' && (
                  <Box sx={{ height: 40, borderBottom: '1px solid #e5e7eb' }} />
                )}

                {/* Task Bars */}
                {groupTasks.map((task) => {
                  const barStyle = getTaskBarStyle(task);
                  if (!barStyle) return null;
                  
                  const colors = getTaskColor(task);
                  
                  return (
                    <Box
                      key={task._id}
                      sx={{
                        height: ROW_HEIGHT,
                        position: 'relative',
                        borderBottom: '1px solid #f3f4f6'
                      }}
                      onMouseEnter={() => setHoveredTask(task._id)}
                      onMouseLeave={() => setHoveredTask(null)}
                    >
                      {/* Task Bar */}
                      <Tooltip
                        title={
                          <Box>
                            <Typography fontSize="12px" fontWeight={600}>{task.title}</Typography>
                            <Typography fontSize="10px" sx={{ mt: 0.5 }}>
                              {task.start_date && new Date(task.start_date).toLocaleDateString()} - 
                              {task.deadline && new Date(task.deadline).toLocaleDateString()}
                            </Typography>
                            {task.progress !== undefined && (
                              <Typography fontSize="10px">Progress: {task.progress}%</Typography>
                            )}
                          </Box>
                        }
                        placement="top"
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            left: barStyle.left,
                            width: barStyle.width,
                            height: 32,
                            top: 8,
                            bgcolor: colors.bg,
                            border: `2px solid ${colors.border}`,
                            borderRadius: 1.5,
                            cursor: 'pointer',
                            boxShadow: hoveredTask === task._id || selectedTask === task._id
                              ? '0 4px 12px rgba(123, 104, 238, 0.4)'
                              : '0 1px 3px rgba(0,0,0,0.1)',
                            transform: hoveredTask === task._id || selectedTask === task._id
                              ? 'scale(1.02)'
                              : 'scale(1)',
                            transition: 'all 0.2s ease',
                            overflow: 'hidden',
                            zIndex: hoveredTask === task._id || selectedTask === task._id ? 10 : 1
                          }}
                          onClick={() => {
                            setSelectedTask(task._id);
                            onTaskClick?.(task._id);
                          }}
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
                              borderRight: task.progress < 100 ? '2px solid rgba(255,255,255,0.5)' : 'none'
                            }} />
                          )}
                          
                          {/* Task Label */}
                          <Typography sx={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: colors.text,
                            textAlign: 'center',
                            px: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {barStyle.width > 60 ? task.title : ''}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Legend */}
      <Box sx={{ 
        display: 'flex', 
        gap: 3, 
        p: 2, 
        borderTop: '1px solid #e5e7eb',
        bgcolor: '#fafbfc',
        fontSize: '11px',
        flexWrap: 'wrap'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 16, height: 8, bgcolor: '#22c55e', borderRadius: 0.5 }} />
          <Typography fontSize="11px">Completed</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 16, height: 8, bgcolor: '#3b82f6', borderRadius: 0.5 }} />
          <Typography fontSize="11px">In Progress</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 16, height: 8, bgcolor: '#f59e0b', borderRadius: 0.5 }} />
          <Typography fontSize="11px">Review/Testing</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 2, height: 12, bgcolor: '#f59e0b', borderRadius: 0.5 }} />
          <Typography fontSize="11px">Today</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 16, height: 8, bgcolor: '#fafbfc', border: '1px solid #e5e7eb', borderRadius: 0.5 }} />
          <Typography fontSize="11px">Weekend</Typography>
        </Box>
      </Box>
    </Paper>
  );
}

