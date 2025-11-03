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

  const ROW_HEIGHT = 40;
  const GROUP_HEIGHT = 44;
  const HEADER_HEIGHT = 66;
  const LEFT_WIDTH = 250;

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
  const dayWidth = 42 * zoom;

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
    if (s.includes('progress')) return '#00d4ff';
    if (s.includes('review')) return '#a25ddc';
    if (s.includes('blocked')) return '#e44258';
    return '#579bfc';
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
      
      // Debug: log dependencies
      if (deps.dependencies.length > 0) {
        console.log(`Task "${task.title}" has ${deps.dependencies.length} dependencies:`, deps.dependencies);
      }
      
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
        
        const highlight = hoveredTask === task._id || hoveredTask === toId;
        const color = highlight ? '#7b68ee' : '#9ca3af';
        
        ctx.strokeStyle = color;
        ctx.lineWidth = highlight ? 2.5 : 1.5;
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
        const r = 3.5;
        ctx.beginPath();
        ctx.fillStyle = '#ffffff';
        ctx.arc(x1, y1, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Target circle (hollow) so arrow touches exactly the start/finish point
        ctx.beginPath();
        ctx.fillStyle = '#ffffff';
        ctx.arc(x2, y2, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
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

        // Draw dependency type label (FS/SS/FF/SF)
        const midX = (x1 + hOffset + x2) / 2;
        const midY = y1 === y2 ? y1 - 8 : (y1 + y2) / 2 - 8;
        
        ctx.font = 'bold 10px Inter, system-ui, sans-serif';
        const label = dep.dependency_type;
        const metrics = ctx.measureText(label);
        const padding = 4;
        const bgWidth = metrics.width + padding * 2;
        const bgHeight = 14;
        
        // Background for label
        ctx.fillStyle = highlight ? '#7b68ee' : '#ffffff';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(midX - bgWidth / 2, midY - bgHeight / 2, bgWidth, bgHeight, 3);
        ctx.fill();
        ctx.stroke();
        
        // Text
        ctx.fillStyle = highlight ? '#ffffff' : color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, midX, midY);
      });
    });
  }, [tasks, dependencies, hoveredTask, expandedGroups, groupedTasks, dateRange, dayWidth]);

  return (
    <Paper sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'none', border: '1px solid #e5e7eb' }}>
      {/* Toolbar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1, borderBottom: '1px solid #e5e7eb', bgcolor: 'white' }}>
        <IconButton size="small" onClick={() => setZoom(Math.max(0.5, zoom - 0.2))} sx={{ width: 28, height: 28 }}>
          <ZoomOut sx={{ fontSize: 14 }} />
        </IconButton>
        <IconButton size="small" onClick={() => setZoom(Math.min(2, zoom + 0.2))} sx={{ width: 28, height: 28 }}>
          <ZoomIn sx={{ fontSize: 14 }} />
        </IconButton>
        <IconButton size="small" sx={{ width: 28, height: 28, bgcolor: '#7b68ee', color: 'white', '&:hover': { bgcolor: '#6952d6' } }}>
          <Today sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>

      {/* Main */}
      <Box ref={containerRef} sx={{ flex: 1, display: 'flex', overflow: 'auto', position: 'relative', bgcolor: 'white' }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', top: HEADER_HEIGHT, left: 0, pointerEvents: 'none', zIndex: 4 }} />

        {/* Left Panel */}
        <Box sx={{ width: LEFT_WIDTH, flexShrink: 0, borderRight: '1px solid #e5e7eb', bgcolor: '#fafbfc', position: 'sticky', left: 0, zIndex: 3 }}>
          {/* Header */}
          <Box sx={{ height: HEADER_HEIGHT, borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', px: 1.5, bgcolor: '#f5f6f8' }}>
            <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Name
            </Typography>
          </Box>

          {/* Tasks */}
          <Box>
            {Object.entries(groupedTasks).map(([groupName, groupTasks]) => {
              const isExpanded = expandedGroups.has(groupName);
              
              return (
                <Box key={groupName}>
                  {/* Group */}
                  <Box sx={{
                    height: GROUP_HEIGHT,
                    px: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    borderBottom: '1px solid #e5e7eb',
                    bgcolor: 'white',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: '#f9fafb' }
                  }}
                  onClick={() => {
                    const newExp = new Set(expandedGroups);
                    isExpanded ? newExp.delete(groupName) : newExp.add(groupName);
                    setExpandedGroups(newExp);
                  }}
                  >
                    <IconButton size="small" sx={{ p: 0, width: 18, height: 18 }}>
                      {isExpanded ? <ExpandMore sx={{ fontSize: 14 }} /> : <ChevronRight sx={{ fontSize: 14 }} />}
                    </IconButton>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box component="span" sx={{ fontSize: '12px', color: '#9ca3af' }}>≡</Box>
                    </Box>
                    <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1f2937' }}>
                      {groupName}
                    </Typography>
                  </Box>

                  {/* Tasks */}
                  {isExpanded && groupTasks.map((task) => {
                    const subs = getSubtasks(task._id);
                    const color = getColor(task.status);
                    
                    return (
                      <Box key={task._id}>
                        {/* Parent */}
                        <Box sx={{
                          height: ROW_HEIGHT,
                          px: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.75,
                          borderBottom: '1px solid #f3f4f6',
                          bgcolor: hoveredTask === task._id ? '#f9fafb' : 'white',
                          cursor: 'pointer',
                          '&:hover': { bgcolor: '#f9fafb' }
                        }}
                        onMouseEnter={() => setHoveredTask(task._id)}
                        onMouseLeave={() => setHoveredTask(null)}
                        onClick={() => onTaskClick?.(task._id)}
                        >
                          <Box sx={{ width: 18 }}>
                            {subs.length > 0 && <ExpandMore sx={{ fontSize: 12, color: '#9ca3af' }} />}
                          </Box>
                          <FiberManualRecord sx={{ fontSize: 8, color }} />
                          <Typography sx={{ flex: 1, fontSize: '13px', color: '#292d34', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                              px: 1,
                              pl: 3,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.75,
                              borderBottom: '1px solid #f3f4f6',
                              bgcolor: '#fafbfc',
                              cursor: 'pointer',
                              position: 'relative',
                              '&:hover': { bgcolor: '#f5f3ff' },
                              '&::before': { content: '""', position: 'absolute', left: '15px', top: 0, bottom: isLast ? '50%' : 0, width: '1px', bgcolor: '#d1d5db' },
                              '&::after': { content: '""', position: 'absolute', left: '15px', top: '50%', width: '8px', height: '1px', bgcolor: '#d1d5db' }
                            }}
                            onMouseEnter={() => setHoveredTask(sub._id)}
                            onMouseLeave={() => setHoveredTask(null)}
                            onClick={() => onTaskClick?.(sub._id)}
                            >
                              <Box sx={{ width: 18 }} />
                              <FiberManualRecord sx={{ fontSize: 8, color: subColor }} />
                              <Typography sx={{ flex: 1, fontSize: '12px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
          {/* Header */}
          <Box sx={{ height: HEADER_HEIGHT, borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, bgcolor: 'white', zIndex: 2 }}>
            {/* Weeks */}
            <Box sx={{ height: 33, display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
              {weeks.map((w, i) => (
                <Box key={i} sx={{ width: w.span * dayWidth, px: 1, display: 'flex', alignItems: 'center', borderRight: '1px solid #e5e7eb', bgcolor: '#fafbfc' }}>
                  <Typography sx={{ fontSize: '10px', fontWeight: 600, color: '#6b7280' }}>
                    W{w.num}
                  </Typography>
                  <Typography sx={{ fontSize: '9px', color: '#9ca3af', ml: 0.5 }}>
                    {timeline[w.startIdx].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {timeline[w.startIdx + w.span - 1].date.getDate()}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Days */}
            <Box sx={{ height: 33, display: 'flex' }}>
              {timeline.map((col, i) => (
                <Box key={i} sx={{
                  width: dayWidth,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRight: '1px solid #e5e7eb',
                  bgcolor: col.isToday ? '#e0f2fe' : col.isWeekend ? '#fafbfc' : 'white',
                  gap: 0.25
                }}>
                  <Typography sx={{ fontSize: '8px', fontWeight: 600, color: col.isToday ? '#0369a1' : '#9ca3af', textTransform: 'uppercase' }}>
                    {col.date.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 1)}
                  </Typography>
                  
                  {col.isToday ? (
                    <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography sx={{ fontSize: '11px', fontWeight: 700, color: 'white' }}>
                        {col.date.getDate()}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography sx={{ fontSize: '12px', fontWeight: 500, color: col.isWeekend ? '#9ca3af' : '#374151' }}>
                      {col.date.getDate()}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </Box>

          {/* Grid */}
          <Box sx={{ position: 'relative', minWidth: totalDays * dayWidth, minHeight: 400 }}>
            {/* Today column */}
            {timeline.findIndex(c => c.isToday) >= 0 && (
              <Box sx={{ position: 'absolute', left: timeline.findIndex(c => c.isToday) * dayWidth, top: 0, bottom: 0, width: dayWidth, bgcolor: '#e0f2fe', zIndex: 0 }} />
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

            {/* Grid lines */}
            {timeline.map((_, i) => <Box key={i} sx={{ position: 'absolute', left: i * dayWidth, top: 0, bottom: 0, width: 1, bgcolor: '#f0f1f3', zIndex: 0 }} />)}

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
                        {/* Parent Bar */}
                        <Box sx={{ height: ROW_HEIGHT, position: 'relative' }}>
                          <Tooltip title={task.title} arrow>
                            <Box sx={{
                              position: 'absolute',
                              left: bar.left,
                              width: bar.width,
                              height: 26,
                              top: 7,
                              bgcolor: color,
                              borderRadius: 1,
                              cursor: 'pointer',
                              boxShadow: hoveredTask === task._id ? `0 4px 10px ${color}60` : '0 1px 3px rgba(0,0,0,0.12)',
                              transform: hoveredTask === task._id ? 'scale(1.02)' : 'none',
                              transition: 'all 0.2s',
                              zIndex: hoveredTask === task._id ? 10 : 1,
                              overflow: 'hidden',
                              opacity: (!task.start_date || !task.deadline) ? 0.4 : 1,
                              border: (!task.start_date || !task.deadline) ? '2px dashed rgba(0,0,0,0.3)' : 'none'
                            }}
                            onClick={() => onTaskClick?.(task._id)}
                            >
                                {task.progress && task.progress > 0 && (
                                  <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${task.progress}%`, bgcolor: 'rgba(255,255,255,0.2)' }} />
                                )}
                                
                                <Typography sx={{
                                  position: 'absolute',
                                  inset: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  px: 1,
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: 'white',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {task.title}
                                </Typography>

                                {(dependencies[task._id]?.dependencies?.length > 0 || dependencies[task._id]?.dependents?.length > 0) && (
                                  <>
                                    <Box sx={{ position: 'absolute', left: -4, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, bgcolor: 'white', border: `2px solid ${color}`, borderRadius: '50%' }} />
                                    <Box sx={{ position: 'absolute', right: -5, top: '50%', transform: 'translateY(-50%) rotate(45deg)', width: 8, height: 8, bgcolor: '#fbbf24', border: '2px solid white', borderRadius: 0.5 }} />
                                  </>
                                )}
                              </Box>
                            </Tooltip>
                        </Box>

                        {/* Subtasks */}
                        {subs.map((sub) => {
                          const subBar = getBar(sub);
                          const subColor = getColor(sub.status);
                          
                          return (
                            <Box key={sub._id} sx={{ height: ROW_HEIGHT, position: 'relative' }}>
                              <Tooltip title={sub.title} arrow>
                                <Box sx={{
                                  position: 'absolute',
                                  left: subBar.left,
                                  width: subBar.width,
                                  height: 22,
                                  top: 9,
                                  bgcolor: subColor,
                                  borderRadius: 0.75,
                                  cursor: 'pointer',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                  opacity: (!sub.start_date || !sub.deadline) ? 0.3 : 0.85,
                                  overflow: 'hidden',
                                  border: (!sub.start_date || !sub.deadline) ? '2px dashed rgba(0,0,0,0.3)' : `1px solid ${subColor}cc`
                                }}
                                onClick={() => onTaskClick?.(sub._id)}
                                >
                                  {sub.progress && sub.progress > 0 && (
                                    <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${sub.progress}%`, bgcolor: 'rgba(255,255,255,0.2)' }} />
                                  )}
                                  
                                  <Typography sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    px: 0.75,
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    color: 'white',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {subBar.width > 60 ? sub.title : ''}
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
