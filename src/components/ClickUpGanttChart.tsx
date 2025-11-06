"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Box, Typography, Tooltip, Paper, IconButton, Avatar, Chip } from "@mui/material";
import { ZoomIn, ZoomOut, Today, ExpandMore, ChevronRight, FiberManualRecord } from "@mui/icons-material";

type Task = {
  _id: string;
  title: string;
  start_date?: string;
  deadline?: string;
  status?: string | { _id: string; name: string };
  assignee_id?: any;
  progress?: number;
  parent_task_id?: string;
  [key: string]: any;
};

interface Dependency {
  _id: string;
  task_id: string;
  depends_on_task_id: any;
  dependency_type: 'FS' | 'FF' | 'SS' | 'SF';
}

interface ClickUpGanttChartProps {
  tasks: Task[];
  dependencies: Record<string, { dependencies: Dependency[]; dependents: Dependency[] }>;
  onTaskClick?: (taskId: string) => void;
}

export default function ClickUpGanttChart({ tasks, dependencies, onTaskClick }: ClickUpGanttChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [hoveredDependency, setHoveredDependency] = useState<{ taskId: string; depId: string } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  
  // Auto-expand all
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const groups = new Set<string>();
    tasks.filter(t => !t.parent_task_id).forEach(task => {
      const groupKey = typeof task.feature_id === 'object' ? (task.feature_id as any)?.title : task.feature_id || 'No Group';
      groups.add(groupKey);
    });
    return groups;
  });

  const ROW_HEIGHT = 44;
  const GROUP_HEIGHT = 48;
  const HEADER_HEIGHT = 80;
  const LEFT_WIDTH = 280;

  // Group tasks
  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    tasks.filter(t => !t.parent_task_id).forEach(task => {
      const key = typeof task.feature_id === 'object' ? (task.feature_id as any)?.title : task.feature_id || 'No Group';
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    });
    return groups;
  }, [tasks]);

  const getSubtasks = (taskId: string) => tasks.filter(t => t.parent_task_id === taskId);

  // Date range
  const dateRange = useMemo(() => {
    const today = new Date();
    const dates = tasks.filter(t => t.start_date || t.deadline).flatMap(t => [
      t.start_date ? new Date(t.start_date) : null,
      t.deadline ? new Date(t.deadline) : null
    ]).filter(Boolean) as Date[];
    
    if (dates.length === 0) return { start: new Date(today.getFullYear(), today.getMonth(), 1), end: new Date(today.getFullYear(), today.getMonth() + 2, 0) };
    
    const min = new Date(Math.min(...dates.map(d => d.getTime())));
    const max = new Date(Math.max(...dates.map(d => d.getTime())));
    min.setDate(min.getDate() - 3);
    max.setDate(max.getDate() + 10);
    return { start: min, end: max };
  }, [tasks]);

  const totalDays = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / 86400000);
  const dayWidth = Math.max(32, 48 * zoom);

  const getBar = (task: Task) => {
    // Always render a bar. If dates are missing, place a small placeholder around today.
    let start: Date;
    let end: Date;

    if (task.start_date && task.deadline) {
      start = new Date(task.start_date);
      end = new Date(task.deadline);
    } else {
      const today = new Date();
      // Clamp placeholder start within visible range
      const clampedStartTime = Math.min(
        Math.max(dateRange.start.getTime(), new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()),
        dateRange.end.getTime() - 2 * 86400000
      );
      start = new Date(clampedStartTime);
      end = new Date(clampedStartTime + 2 * 86400000); // default 2-day placeholder
    }

    const offset = Math.ceil((start.getTime() - dateRange.start.getTime()) / 86400000);
    const duration = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
    return { left: offset * dayWidth, width: duration * dayWidth };
  };

  const getColor = (status?: string | { _id: string; name: string }) => {
    const s = (typeof status === 'object' ? status?.name : status || '').toLowerCase();
    if (s.includes('done') || s.includes('completed')) return '#00c875';
    if (s.includes('progress')) return '#579bfc';
    if (s.includes('review')) return '#a25ddc';
    if (s.includes('blocked')) return '#e44258';
    return '#7b68ee';
  };

  const getGradient = (color: string, ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, color + 'dd');
    return gradient;
  };

  // Timeline columns
  const timeline = useMemo(() => {
    const cols: { date: Date; isWeekend: boolean; isToday: boolean }[] = [];
    const curr = new Date(dateRange.start);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    while (curr <= dateRange.end) {
      cols.push({
        date: new Date(curr),
        isWeekend: curr.getDay() === 0 || curr.getDay() === 6,
        isToday: curr.getTime() === today.getTime()
      });
      curr.setDate(curr.getDate() + 1);
    }
    return cols;
  }, [dateRange]);

  // Week headers
  const weeks = useMemo(() => {
    const wks: { num: number; span: number; startIdx: number }[] = [];
    let start = 0;
    let week = Math.ceil((timeline[0]?.date.getTime() - new Date(timeline[0]?.date.getFullYear(), 0, 1).getTime()) / 604800000);
    
    timeline.forEach((col, idx) => {
      const w = Math.ceil((col.date.getTime() - new Date(col.date.getFullYear(), 0, 1).getTime()) / 604800000);
      if (w !== week) {
        wks.push({ num: week, span: idx - start, startIdx: start });
        week = w;
        start = idx;
      }
    });
    wks.push({ num: week, span: timeline.length - start, startIdx: start });
    return wks;
  }, [timeline]);

  // Calculate dependency line paths for hover detection
  const dependencyPaths = useMemo(() => {
    const paths: Array<{
      taskId: string;
      depId: string;
      dependencyType: string;
      path: { x: number; y: number }[];
      bounds: { minX: number; maxX: number; minY: number; maxY: number };
    }> = [];

    const yPos: Record<string, number> = {};
    let y = 0;

    Object.entries(groupedTasks).forEach(([groupName, groupTasks]) => {
      y += GROUP_HEIGHT;
      if (!expandedGroups.has(groupName)) return;

      groupTasks.forEach(task => {
        yPos[task._id] = y + ROW_HEIGHT / 2;
        y += ROW_HEIGHT;
        getSubtasks(task._id).forEach(sub => {
          yPos[sub._id] = y + ROW_HEIGHT / 2;
          y += ROW_HEIGHT;
        });
      });
    });

    tasks.forEach(task => {
      const deps = dependencies[task._id];
      if (!deps?.dependencies) return;

      deps.dependencies.forEach(dep => {
        const toId = dep.depends_on_task_id?._id;
        if (!toId) return;

        const to = tasks.find(t => t._id === toId);
        if (!to) return;

        const fromBar = getBar(task);
        const toBar = getBar(to);
        if (!fromBar || !toBar) return;

        const y1 = yPos[task._id];
        const y2 = yPos[toId];
        if (y1 === undefined || y2 === undefined) return;

        const anchors: Record<'FS'|'SS'|'FF'|'SF', { from: 'start'|'finish'; to: 'start'|'finish' }> = {
          FS: { from: 'finish', to: 'start' },
          SS: { from: 'start',  to: 'start' },
          FF: { from: 'finish', to: 'finish' },
          SF: { from: 'start',  to: 'finish' }
        };
        const sides = anchors[dep.dependency_type];
        const fromEdge = sides.from === 'start' ? fromBar.left : fromBar.left + fromBar.width;
        const toEdge = sides.to === 'start' ? toBar.left : toBar.left + toBar.width;

        const x1 = LEFT_WIDTH + fromEdge;
        const x2 = LEFT_WIDTH + toEdge;
        const dir = x2 >= x1 ? 1 : -1;
        const hOffset = 15 * dir;

        const path = [
          { x: x1, y: y1 },
          { x: x1 + hOffset, y: y1 },
          { x: x1 + hOffset, y: y2 },
          { x: x2, y: y2 }
        ];

        const minX = Math.min(x1, x1 + hOffset, x2);
        const maxX = Math.max(x1, x1 + hOffset, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);

        paths.push({
          taskId: task._id,
          depId: dep._id,
          dependencyType: dep.dependency_type,
          path,
          bounds: { minX, maxX, minY, maxY }
        });
      });
    });

    return paths;
  }, [tasks, dependencies, expandedGroups, groupedTasks, dateRange, dayWidth]);

  // Check if mouse is near a dependency line
  const isNearLine = (mouseX: number, mouseY: number, path: { x: number; y: number }[], bounds: { minX: number; maxX: number; minY: number; maxY: number }, scrollLeft: number) => {
    const adjustedMouseX = mouseX + scrollLeft;
    
    // Quick bounds check
    if (adjustedMouseX < bounds.minX - 20 || adjustedMouseX > bounds.maxX + 20 ||
        mouseY < bounds.minY - 20 || mouseY > bounds.maxY + 20) {
      return false;
    }

    const threshold = 8; // pixels

    // Check distance to each segment
    for (let i = 0; i < path.length - 1; i++) {
      const p1 = path[i];
      const p2 = path[i + 1];
      
      // Check if point is near line segment
      const A = adjustedMouseX - p1.x;
      const B = mouseY - p1.y;
      const C = p2.x - p1.x;
      const D = p2.y - p1.y;

      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      let param = -1;
      if (lenSq !== 0) param = dot / lenSq;

      let xx, yy;

      if (param < 0) {
        xx = p1.x;
        yy = p1.y;
      } else if (param > 1) {
        xx = p2.x;
        yy = p2.y;
      } else {
        xx = p1.x + param * C;
        yy = p1.y + param * D;
      }

      const dx = adjustedMouseX - xx;
      const dy = mouseY - yy;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < threshold) {
        return true;
      }
    }

    return false;
  };

  // Handle mouse move on canvas
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const scrollLeft = container.scrollLeft;

    setMousePos({ x: mouseX, y: mouseY });

    // Check if mouse is near any dependency line
    let found = false;
    for (const depPath of dependencyPaths) {
      if (isNearLine(mouseX, mouseY, depPath.path, depPath.bounds, scrollLeft)) {
        setHoveredDependency({ taskId: depPath.taskId, depId: depPath.depId });
        found = true;
        break;
      }
    }

    if (!found) {
      setHoveredDependency(null);
    }
  };

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
    
    const yPos: Record<string, number> = {};
    let y = 0;
    
    Object.entries(groupedTasks).forEach(([groupName, groupTasks]) => {
      y += GROUP_HEIGHT;
      if (!expandedGroups.has(groupName)) return;
      
      groupTasks.forEach(task => {
        yPos[task._id] = y + ROW_HEIGHT / 2;
        y += ROW_HEIGHT;
        getSubtasks(task._id).forEach(sub => {
          yPos[sub._id] = y + ROW_HEIGHT / 2;
          y += ROW_HEIGHT;
        });
      });
    });
    
    tasks.forEach(task => {
      const deps = dependencies[task._id];
      if (!deps?.dependencies) return;
      
      deps.dependencies.forEach(dep => {
        const toId = dep.depends_on_task_id?._id;
        if (!toId) return;
        
        const to = tasks.find(t => t._id === toId);
        if (!to) return;
        
        const fromBar = getBar(task);
        const toBar = getBar(to);
        if (!fromBar || !toBar) return;
        
        const y1 = yPos[task._id];
        const y2 = yPos[toId];
        if (y1 === undefined || y2 === undefined) return;
        
        // Choose anchor sides based on dependency type
        const anchors: Record<'FS'|'SS'|'FF'|'SF', { from: 'start'|'finish'; to: 'start'|'finish' }> = {
          FS: { from: 'finish', to: 'start' },
          SS: { from: 'start',  to: 'start' },
          FF: { from: 'finish', to: 'finish' },
          SF: { from: 'start',  to: 'finish' }
        };
        const sides = anchors[dep.dependency_type];
        const fromEdge = sides.from === 'start' ? fromBar.left : fromBar.left + fromBar.width;
        const toEdge = sides.to === 'start' ? toBar.left : toBar.left + toBar.width;

        const x1 = LEFT_WIDTH + fromEdge - container.scrollLeft;
        const x2 = LEFT_WIDTH + toEdge - container.scrollLeft;
        
        if (x1 < -100 || x2 > canvas.width + 100) return;
        
        // Check if this dependency is hovered
        const isHovered = hoveredDependency?.taskId === task._id && hoveredDependency?.depId === dep._id;
        const isTaskHovered = hoveredTask === task._id || hoveredTask === toId;
        const highlight = isHovered || isTaskHovered;
        
        const color = isHovered ? '#7b68ee' : highlight ? '#a78bfa' : '#9ca3af';
        const lineWidth = isHovered ? 3.5 : highlight ? 2.5 : 1.5;
        
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        // Dashed when not highlighted to match reference style
        if (!highlight) ctx.setLineDash([5, 4]); else ctx.setLineDash([]);
        ctx.beginPath();
        // Horizontal out from source depending direction
        const dir = x2 >= x1 ? 1 : -1;
        const hOffset = 15 * dir;
        const endAdjust = 4; // pull line a bit inside target so arrowhead meets the target circle
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 + hOffset, y1);
        ctx.lineTo(x1 + hOffset, y2);
        ctx.lineTo(x2 - dir * endAdjust, y2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Small circles at connection points (like the reference)
        const r = isHovered ? 4.5 : 3.5;
        ctx.beginPath();
        ctx.fillStyle = '#ffffff';
        ctx.arc(x1, y1, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = isHovered ? 2 : 1.5;
        ctx.stroke();

        // Target circle (hollow) so arrow touches exactly the start/finish point
        ctx.beginPath();
        ctx.fillStyle = '#ffffff';
        ctx.arc(x2, y2, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = isHovered ? 2 : 1.5;
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.beginPath();
        if (dir === 1) {
          // Arrow pointing right
          ctx.moveTo(x2 - r, y2);
          ctx.lineTo(x2 - r - 7, y2 - 4);
          ctx.lineTo(x2 - r - 7, y2 + 4);
        } else {
          // Arrow pointing left
          ctx.moveTo(x2 + r, y2);
          ctx.lineTo(x2 + r + 7, y2 - 4);
          ctx.lineTo(x2 + r + 7, y2 + 4);
        }
        ctx.fill();

        // Draw dependency type label (FS/SS/FF/SF) - enhanced when hovered
        const midX = (x1 + hOffset + x2) / 2;
        const midY = y1 === y2 ? y1 - 8 : (y1 + y2) / 2 - 8;
        
        const label = dep.dependency_type;
        const labelText = isHovered ? `${label} (${getDependencyTypeName(dep.dependency_type)})` : label;
        
        ctx.font = isHovered ? 'bold 11px Inter, system-ui, sans-serif' : 'bold 10px Inter, system-ui, sans-serif';
        const metrics = ctx.measureText(labelText);
        const padding = isHovered ? 6 : 4;
        const bgWidth = metrics.width + padding * 2;
        const bgHeight = isHovered ? 18 : 14;
        
        // Background for label - enhanced when hovered
        ctx.fillStyle = isHovered ? '#7b68ee' : highlight ? '#a78bfa' : '#ffffff';
        ctx.strokeStyle = color;
        ctx.lineWidth = isHovered ? 2 : 1.5;
        ctx.beginPath();
        ctx.roundRect(midX - bgWidth / 2, midY - bgHeight / 2, bgWidth, bgHeight, 4);
        ctx.fill();
        ctx.stroke();
        
        // Text
        ctx.fillStyle = isHovered ? '#ffffff' : highlight ? '#ffffff' : color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText, midX, midY);
      });
    });
  }, [tasks, dependencies, hoveredTask, hoveredDependency, expandedGroups, groupedTasks, dateRange, dayWidth]);

  // Get dependency type name
  const getDependencyTypeName = (type: string) => {
    const names: Record<string, string> = {
      'FS': 'Finish-to-Start',
      'SS': 'Start-to-Start',
      'FF': 'Finish-to-Finish',
      'SF': 'Start-to-Finish'
    };
    return names[type] || type;
  };

  return (
    <Paper sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'none', border: '1px solid #e5e7eb' }}>
      {/* Toolbar - ClickUp Style */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        gap: 1, 
        px: 2, 
        py: 1.5, 
        borderBottom: '1px solid #e5e7eb', 
        bgcolor: '#fafbfc',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton 
            size="small" 
            onClick={() => setZoom(Math.max(0.5, zoom - 0.2))} 
            sx={{ 
              width: 32, 
              height: 32,
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              bgcolor: 'white',
              '&:hover': { bgcolor: '#f9fafb', borderColor: '#d1d5db' }
            }}
          >
            <ZoomOut sx={{ fontSize: 16, color: '#6b7280' }} />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => setZoom(Math.min(2, zoom + 0.2))} 
            sx={{ 
              width: 32, 
              height: 32,
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              bgcolor: 'white',
              '&:hover': { bgcolor: '#f9fafb', borderColor: '#d1d5db' }
            }}
          >
            <ZoomIn sx={{ fontSize: 16, color: '#6b7280' }} />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => {
              const todayIdx = timeline.findIndex(c => c.isToday);
              if (todayIdx >= 0 && containerRef.current) {
                containerRef.current.scrollLeft = todayIdx * dayWidth - LEFT_WIDTH;
              }
            }}
            sx={{ 
              width: 32, 
              height: 32,
              border: '1px solid #7b68ee',
              borderRadius: '6px',
              bgcolor: '#7b68ee', 
              color: 'white', 
              '&:hover': { bgcolor: '#6952d6', borderColor: '#6952d6' },
              ml: 1
            }}
          >
            <Today sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
        <Typography sx={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>
          {tasks.length} tasks
        </Typography>
      </Box>

      {/* Main */}
      <Box ref={containerRef} sx={{ flex: 1, display: 'flex', overflow: 'auto', position: 'relative', bgcolor: 'white' }}>
        <canvas 
          ref={canvasRef} 
          onMouseMove={handleMouseMove}
          onMouseLeave={() => {
            setHoveredDependency(null);
            setMousePos(null);
          }}
          style={{ position: 'absolute', top: HEADER_HEIGHT, left: 0, pointerEvents: 'auto', zIndex: 4, cursor: hoveredDependency ? 'pointer' : 'default' }} 
        />

        {/* Left Panel */}
        <Box sx={{ width: LEFT_WIDTH, flexShrink: 0, borderRight: '1px solid #e5e7eb', bgcolor: '#fafbfc', position: 'sticky', left: 0, zIndex: 3 }}>
          {/* Header - ClickUp Style */}
          <Box sx={{ 
            height: HEADER_HEIGHT, 
            borderBottom: '2px solid #e5e7eb', 
            display: 'flex', 
            alignItems: 'center', 
            px: 2, 
            bgcolor: '#fafbfc',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
          }}>
            <Typography sx={{ 
              fontSize: '11px', 
              fontWeight: 700, 
              color: '#374151', 
              textTransform: 'uppercase', 
              letterSpacing: '0.8px' 
            }}>
              Task Name
            </Typography>
          </Box>

          {/* Tasks */}
          <Box>
            {Object.entries(groupedTasks).map(([groupName, groupTasks]) => {
              const isExpanded = expandedGroups.has(groupName);
              
              return (
                <Box key={groupName}>
                  {/* Group - ClickUp Style */}
                  <Box sx={{
                    height: GROUP_HEIGHT,
                    px: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    borderBottom: '1px solid #e5e7eb',
                    bgcolor: '#f9fafb',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: '#f3f4f6' }
                  }}
                  onClick={() => {
                    const newExp = new Set(expandedGroups);
                    isExpanded ? newExp.delete(groupName) : newExp.add(groupName);
                    setExpandedGroups(newExp);
                  }}
                  >
                    <IconButton size="small" sx={{ p: 0, width: 20, height: 20, color: '#6b7280' }}>
                      {isExpanded ? <ExpandMore sx={{ fontSize: 16 }} /> : <ChevronRight sx={{ fontSize: 16 }} />}
                    </IconButton>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      width: 20,
                      height: 20,
                      borderRadius: '4px',
                      bgcolor: '#e5e7eb',
                      color: '#6b7280'
                    }}>
                      <Box component="span" sx={{ fontSize: '10px', fontWeight: 600 }}>≡</Box>
                    </Box>
                    <Typography sx={{ 
                      fontSize: '13px', 
                      fontWeight: 600, 
                      color: '#111827',
                      letterSpacing: '-0.01em'
                    }}>
                      {groupName}
                    </Typography>
                    <Typography sx={{ 
                      ml: 'auto',
                      fontSize: '11px', 
                      fontWeight: 500, 
                      color: '#6b7280',
                      bgcolor: '#e5e7eb',
                      px: 1,
                      py: 0.25,
                      borderRadius: '4px'
                    }}>
                      {groupTasks.length}
                    </Typography>
                  </Box>

                  {/* Tasks */}
                  {isExpanded && groupTasks.map((task) => {
                    const subs = getSubtasks(task._id);
                    const color = getColor(task.status);
                    
                    return (
                      <Box key={task._id}>
                        {/* Parent - ClickUp Style */}
                        <Box sx={{
                          height: ROW_HEIGHT,
                          px: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          borderBottom: '1px solid #f3f4f6',
                          bgcolor: hoveredTask === task._id ? '#f9fafb' : 'white',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          '&:hover': { bgcolor: '#f9fafb' }
                        }}
                        onMouseEnter={() => setHoveredTask(task._id)}
                        onMouseLeave={() => setHoveredTask(null)}
                        onClick={() => onTaskClick?.(task._id)}
                        >
                          <Box sx={{ width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {subs.length > 0 && <ExpandMore sx={{ fontSize: 14, color: '#9ca3af' }} />}
                          </Box>
                          <Box sx={{ 
                            width: 10, 
                            height: 10, 
                            borderRadius: '50%', 
                            bgcolor: color,
                            boxShadow: `0 0 0 2px ${color}33`,
                            flexShrink: 0
                          }} />
                          <Typography sx={{ 
                            flex: 1, 
                            fontSize: '13px', 
                            fontWeight: 500,
                            color: '#111827', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap',
                            letterSpacing: '-0.01em'
                          }}>
                            {task.title}
                          </Typography>
                        </Box>

                        {/* Subtasks */}
                        {subs.map((sub, idx) => {
                          const subColor = getColor(sub.status);
                          const isLast = idx === subs.length - 1;
                          
                          return (
                            <Box key={sub._id} sx={{
                              height: ROW_HEIGHT,
                              px: 2,
                              pl: 4,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              borderBottom: '1px solid #f3f4f6',
                              bgcolor: '#fafbfc',
                              cursor: 'pointer',
                              position: 'relative',
                              transition: 'all 0.15s',
                              '&:hover': { bgcolor: '#f5f3ff' },
                              '&::before': { 
                                content: '""', 
                                position: 'absolute', 
                                left: '24px', 
                                top: 0, 
                                bottom: isLast ? '50%' : 0, 
                                width: '2px', 
                                bgcolor: '#d1d5db' 
                              },
                              '&::after': { 
                                content: '""', 
                                position: 'absolute', 
                                left: '24px', 
                                top: '50%', 
                                width: '10px', 
                                height: '2px', 
                                bgcolor: '#d1d5db' 
                              }
                            }}
                            onMouseEnter={() => setHoveredTask(sub._id)}
                            onMouseLeave={() => setHoveredTask(null)}
                            onClick={() => onTaskClick?.(sub._id)}
                            >
                              <Box sx={{ width: 20 }} />
                              <Box sx={{ 
                                width: 8, 
                                height: 8, 
                                borderRadius: '50%', 
                                bgcolor: subColor,
                                boxShadow: `0 0 0 2px ${subColor}33`,
                                flexShrink: 0
                              }} />
                              <Typography sx={{ 
                                flex: 1, 
                                fontSize: '12px', 
                                fontWeight: 400,
                                color: '#6b7280', 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis', 
                                whiteSpace: 'nowrap' 
                              }}>
                                {sub.title}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    );
                  })}
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Timeline */}
        <Box sx={{ flex: 1, position: 'relative', bgcolor: 'white' }}>
          {/* Header - ClickUp Style */}
          <Box sx={{ 
            height: HEADER_HEIGHT, 
            borderBottom: '2px solid #e5e7eb', 
            position: 'sticky', 
            top: 0, 
            bgcolor: '#fafbfc', 
            zIndex: 2,
            boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
          }}>
            {/* Weeks */}
            <Box sx={{ 
              height: 40, 
              display: 'flex', 
              borderBottom: '1px solid #e5e7eb',
              bgcolor: '#f9fafb'
            }}>
              {weeks.map((w, i) => (
                <Box key={i} sx={{ 
                  width: w.span * dayWidth, 
                  px: 1.5, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  borderRight: '1px solid #e5e7eb', 
                  bgcolor: '#fafbfc' 
                }}>
                  <Typography sx={{ 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    color: '#374151',
                    letterSpacing: '-0.01em'
                  }}>
                    Week {w.num}
                  </Typography>
                  <Typography sx={{ 
                    fontSize: '10px', 
                    color: '#6b7280', 
                    fontWeight: 500
                  }}>
                    {timeline[w.startIdx].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {timeline[w.startIdx + w.span - 1].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Days */}
            <Box sx={{ height: 40, display: 'flex' }}>
              {timeline.map((col, i) => (
                <Box key={i} sx={{
                  width: dayWidth,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRight: '1px solid #e5e7eb',
                  bgcolor: col.isToday ? '#dbeafe' : col.isWeekend ? '#f9fafb' : 'white',
                  gap: 0.5,
                  position: 'relative'
                }}>
                  <Typography sx={{ 
                    fontSize: '9px', 
                    fontWeight: 600, 
                    color: col.isToday ? '#1e40af' : '#6b7280', 
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {col.date.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 3)}
                  </Typography>
                  
                  {col.isToday ? (
                    <Box sx={{ 
                      width: 24, 
                      height: 24, 
                      borderRadius: '6px', 
                      bgcolor: '#3b82f6', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
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
                      fontWeight: 600, 
                      color: col.isWeekend ? '#9ca3af' : '#374151' 
                    }}>
                      {col.date.getDate()}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </Box>

          {/* Grid */}
          <Box sx={{ position: 'relative', minWidth: totalDays * dayWidth, minHeight: 400 }}>
            {/* Today column - ClickUp Style */}
            {timeline.findIndex(c => c.isToday) >= 0 && (
              <Box sx={{ 
                position: 'absolute', 
                left: timeline.findIndex(c => c.isToday) * dayWidth, 
                top: 0, 
                bottom: 0, 
                width: dayWidth, 
                bgcolor: '#dbeafe', 
                zIndex: 0,
                borderLeft: '2px solid #3b82f6',
                borderRight: '2px solid #3b82f6'
              }} />
            )}

            {/* Weekend stripes */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
              <defs>
                <pattern id="stripes" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="3" height="6" fill="#f5f5f5" />
                </pattern>
              </defs>
              {timeline.map((col, i) => col.isWeekend && <rect key={i} x={i * dayWidth} width={dayWidth} height="100%" fill="url(#stripes)" />)}
            </svg>

            {/* Grid lines - ClickUp Style */}
            {timeline.map((col, i) => (
              <Box 
                key={i} 
                sx={{ 
                  position: 'absolute', 
                  left: i * dayWidth, 
                  top: 0, 
                  bottom: 0, 
                  width: col.isToday ? 2 : 1, 
                  bgcolor: col.isToday ? '#3b82f6' : '#f0f1f3', 
                  zIndex: 0,
                  opacity: col.isWeekend ? 0.5 : 1
                }} 
              />
            ))}

            {/* Bars */}
            {Object.entries(groupedTasks).map(([groupName, groupTasks]) => {
              if (!expandedGroups.has(groupName)) return null;
              
              return (
                <Box key={groupName}>
                  <Box sx={{ height: GROUP_HEIGHT }} />
                  
                  {groupTasks.map((task) => {
                    const bar = getBar(task);
                    const color = getColor(task.status);
                    const subs = getSubtasks(task._id);
                    
                    return (
                      <Box key={task._id}>
                        {/* Parent Bar - ClickUp Style */}
                        <Box sx={{ height: ROW_HEIGHT, position: 'relative' }}>
                          <Tooltip title={task.title} arrow>
                            <Box sx={{
                              position: 'absolute',
                              left: bar.left,
                              width: Math.max(bar.width, 40),
                              height: 28,
                              top: 8,
                              background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
                              borderRadius: '6px',
                              cursor: 'pointer',
                              boxShadow: hoveredTask === task._id 
                                ? `0 4px 12px ${color}66, 0 2px 4px rgba(0,0,0,0.1)` 
                                : '0 2px 6px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.1)',
                              transform: hoveredTask === task._id ? 'translateY(-1px) scale(1.01)' : 'none',
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              zIndex: hoveredTask === task._id ? 10 : 1,
                              overflow: 'hidden',
                              opacity: (!task.start_date || !task.deadline) ? 0.5 : 1,
                              border: (!task.start_date || !task.deadline) ? '2px dashed rgba(255,255,255,0.5)' : 'none',
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '30%',
                                background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)',
                                pointerEvents: 'none'
                              }
                            }}
                            onClick={() => onTaskClick?.(task._id)}
                            >
                                {task.progress && task.progress > 0 && (
                                  <Box sx={{ 
                                    position: 'absolute', 
                                    left: 0, 
                                    top: 0, 
                                    bottom: 0, 
                                    width: `${task.progress}%`, 
                                    bgcolor: 'rgba(255,255,255,0.25)',
                                    borderRadius: '6px 0 0 6px'
                                  }} />
                                )}
                                
                                <Typography sx={{
                                  position: 'absolute',
                                  inset: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  px: 1.5,
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color: 'white',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                  letterSpacing: '-0.01em'
                                }}>
                                  {task.title}
                                </Typography>

                                {(dependencies[task._id]?.dependencies?.length > 0 || dependencies[task._id]?.dependents?.length > 0) && (
                                  <>
                                    <Box sx={{ 
                                      position: 'absolute', 
                                      left: -5, 
                                      top: '50%', 
                                      transform: 'translateY(-50%)', 
                                      width: 10, 
                                      height: 10, 
                                      bgcolor: 'white', 
                                      border: `2px solid ${color}`, 
                                      borderRadius: '50%',
                                      boxShadow: `0 0 0 2px rgba(255,255,255,0.8)`
                                    }} />
                                    <Box sx={{ 
                                      position: 'absolute', 
                                      right: -6, 
                                      top: '50%', 
                                      transform: 'translateY(-50%) rotate(45deg)', 
                                      width: 10, 
                                      height: 10, 
                                      bgcolor: '#f59e0b', 
                                      border: '2px solid white', 
                                      borderRadius: '2px',
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                    }} />
                                  </>
                                )}
                              </Box>
                            </Tooltip>
                        </Box>

                        {/* Subtasks - ClickUp Style */}
                        {subs.map((sub) => {
                          const subBar = getBar(sub);
                          const subColor = getColor(sub.status);
                          
                          return (
                            <Box key={sub._id} sx={{ height: ROW_HEIGHT, position: 'relative' }}>
                              <Tooltip title={sub.title} arrow>
                                <Box sx={{
                                  position: 'absolute',
                                  left: subBar.left,
                                  width: Math.max(subBar.width, 32),
                                  height: 22,
                                  top: 11,
                                  background: `linear-gradient(135deg, ${subColor} 0%, ${subColor}dd 100%)`,
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  boxShadow: hoveredTask === sub._id
                                    ? `0 3px 8px ${subColor}55, 0 1px 3px rgba(0,0,0,0.1)`
                                    : '0 1px 4px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
                                  transform: hoveredTask === sub._id ? 'translateY(-1px)' : 'none',
                                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                  opacity: (!sub.start_date || !sub.deadline) ? 0.4 : 0.9,
                                  overflow: 'hidden',
                                  border: (!sub.start_date || !sub.deadline) ? '2px dashed rgba(255,255,255,0.4)' : 'none',
                                  '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '30%',
                                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)',
                                    pointerEvents: 'none'
                                  }
                                }}
                                onClick={() => onTaskClick?.(sub._id)}
                                onMouseEnter={() => setHoveredTask(sub._id)}
                                onMouseLeave={() => setHoveredTask(null)}
                                >
                                  {sub.progress && sub.progress > 0 && (
                                    <Box sx={{ 
                                      position: 'absolute', 
                                      left: 0, 
                                      top: 0, 
                                      bottom: 0, 
                                      width: `${sub.progress}%`, 
                                      bgcolor: 'rgba(255,255,255,0.2)',
                                      borderRadius: '4px 0 0 4px'
                                    }} />
                                  )}
                                  
                                  <Typography sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    px: 1,
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    color: 'white',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    textShadow: '0 1px 1px rgba(0,0,0,0.1)'
                                  }}>
                                    {subBar.width > 50 ? sub.title : ''}
                                  </Typography>
                                </Box>
                              </Tooltip>
                            </Box>
                          );
                        })}
                      </Box>
                    );
                  })}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
