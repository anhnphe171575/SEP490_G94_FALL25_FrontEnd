"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Typography, Paper, Chip, IconButton, Tooltip } from "@mui/material";
import { 
  ZoomIn, 
  ZoomOut, 
  CenterFocusStrong,
  FilterList 
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

interface DependencyNetworkGraphProps {
  tasks: Task[];
  dependencies: Record<string, { dependencies: Dependency[]; dependents: Dependency[] }>;
  onTaskClick?: (taskId: string) => void;
}

export default function DependencyNetworkGraph({
  tasks,
  dependencies,
  onTaskClick
}: DependencyNetworkGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});

  const NODE_RADIUS = 40;
  const CANVAS_WIDTH = 1200;
  const CANVAS_HEIGHT = 800;

  // Calculate node positions using force-directed layout
  useEffect(() => {
    if (tasks.length === 0) return;

    const positions: Record<string, { x: number; y: number; vx: number; vy: number }> = {};
    
    // Initialize random positions
    tasks.forEach((task, index) => {
      const angle = (index / tasks.length) * 2 * Math.PI;
      const radius = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) * 0.3;
      positions[task._id] = {
        x: CANVAS_WIDTH / 2 + Math.cos(angle) * radius,
        y: CANVAS_HEIGHT / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0
      };
    });

    // Force-directed layout simulation
    const iterations = 100;
    const repulsion = 5000;
    const attraction = 0.01;
    const damping = 0.9;

    for (let iter = 0; iter < iterations; iter++) {
      // Apply repulsion between all nodes
      tasks.forEach(task1 => {
        tasks.forEach(task2 => {
          if (task1._id === task2._id) return;
          
          const dx = positions[task1._id].x - positions[task2._id].x;
          const dy = positions[task1._id].y - positions[task2._id].y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          
          const force = repulsion / (distance * distance);
          positions[task1._id].vx += (dx / distance) * force;
          positions[task1._id].vy += (dy / distance) * force;
        });
      });

      // Apply attraction along dependency edges
      tasks.forEach(task => {
        const deps = dependencies[task._id];
        if (!deps) return;
        
        deps.dependencies.forEach(dep => {
          const targetId = dep.depends_on_task_id?._id;
          if (!targetId || !positions[targetId]) return;
          
          const dx = positions[targetId].x - positions[task._id].x;
          const dy = positions[targetId].y - positions[task._id].y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          
          const force = distance * attraction;
          positions[task._id].vx += (dx / distance) * force;
          positions[task._id].vy += (dy / distance) * force;
          positions[targetId].vx -= (dx / distance) * force;
          positions[targetId].vy -= (dy / distance) * force;
        });
      });

      // Update positions
      tasks.forEach(task => {
        positions[task._id].x += positions[task._id].vx;
        positions[task._id].y += positions[task._id].vy;
        positions[task._id].vx *= damping;
        positions[task._id].vy *= damping;
        
        // Keep within bounds
        const margin = NODE_RADIUS * 2;
        positions[task._id].x = Math.max(margin, Math.min(CANVAS_WIDTH - margin, positions[task._id].x));
        positions[task._id].y = Math.max(margin, Math.min(CANVAS_HEIGHT - margin, positions[task._id].y));
      });
    }

    // Convert to final positions
    const finalPositions: Record<string, { x: number; y: number }> = {};
    Object.keys(positions).forEach(id => {
      finalPositions[id] = { x: positions[id].x, y: positions[id].y };
    });
    
    setNodePositions(finalPositions);
  }, [tasks, dependencies]);

  // Draw network graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply zoom and offset
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);
    
    // Draw grid
    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 1;
    const gridSize = 50;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // Draw edges (dependencies)
    tasks.forEach(task => {
      const deps = dependencies[task._id];
      if (!deps || !deps.dependencies) return;
      
      const fromPos = nodePositions[task._id];
      if (!fromPos) return;
      
      deps.dependencies.forEach(dep => {
        const targetId = dep.depends_on_task_id?._id;
        if (!targetId) return;
        
        const toPos = nodePositions[targetId];
        if (!toPos) return;
        
        const isHighlighted = hoveredNode === task._id || 
                             hoveredNode === targetId ||
                             selectedNode === task._id ||
                             selectedNode === targetId;
        
        // Calculate edge points (from circle edge to circle edge)
        const dx = toPos.x - fromPos.x;
        const dy = toPos.y - fromPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const unitX = dx / distance;
        const unitY = dy / distance;
        
        const startX = fromPos.x + unitX * NODE_RADIUS;
        const startY = fromPos.y + unitY * NODE_RADIUS;
        const endX = toPos.x - unitX * NODE_RADIUS;
        const endY = toPos.y - unitY * NODE_RADIUS;
        
        // Draw curved line
        ctx.beginPath();
        ctx.strokeStyle = isHighlighted ? '#7b68ee' : '#cbd5e1';
        ctx.lineWidth = isHighlighted ? 3 : 2;
        
        // Curve control point
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        const perpX = -unitY;
        const perpY = unitX;
        const curvature = 20;
        const controlX = midX + perpX * curvature;
        const controlY = midY + perpY * curvature;
        
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(controlX, controlY, endX, endY);
        ctx.stroke();
        
        // Draw arrowhead
        const arrowSize = 10;
        const angle = Math.atan2(endY - controlY, endX - controlX);
        
        ctx.beginPath();
        ctx.fillStyle = isHighlighted ? '#7b68ee' : '#cbd5e1';
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - arrowSize * Math.cos(angle - Math.PI / 6),
          endY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          endX - arrowSize * Math.cos(angle + Math.PI / 6),
          endY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
        
        // Draw dependency type label
        if (isHighlighted) {
          ctx.font = 'bold 11px Inter, sans-serif';
          ctx.fillStyle = '#7b68ee';
          ctx.textAlign = 'center';
          ctx.fillText(dep.dependency_type, midX, midY - 8);
        }
      });
    });
    
    // Draw nodes
    tasks.forEach(task => {
      const pos = nodePositions[task._id];
      if (!pos) return;
      
      const isHovered = hoveredNode === task._id;
      const isSelected = selectedNode === task._id;
      
      // Node shadow
      if (isHovered || isSelected) {
        ctx.shadowColor = 'rgba(123, 104, 238, 0.4)';
        ctx.shadowBlur = 15;
      }
      
      // Node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, NODE_RADIUS, 0, 2 * Math.PI);
      ctx.fillStyle = getNodeColor(task.status);
      ctx.fill();
      
      // Node border
      ctx.strokeStyle = isSelected ? '#7b68ee' : 'white';
      ctx.lineWidth = isSelected ? 4 : 3;
      ctx.stroke();
      
      ctx.shadowBlur = 0;
      
      // Task title
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const maxWidth = NODE_RADIUS * 1.6;
      const text = task.title;
      let displayText = text;
      
      if (ctx.measureText(text).width > maxWidth) {
        let truncated = text;
        while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
          truncated = truncated.slice(0, -1);
        }
        displayText = truncated + '...';
      }
      
      ctx.fillText(displayText, pos.x, pos.y);
      
      // Dependency count badges
      const deps = dependencies[task._id];
      if (deps) {
        if (deps.dependencies?.length > 0) {
          ctx.beginPath();
          ctx.arc(pos.x - NODE_RADIUS * 0.7, pos.y - NODE_RADIUS * 0.7, 12, 0, 2 * Math.PI);
          ctx.fillStyle = '#dc2626';
          ctx.fill();
          ctx.font = 'bold 10px Inter, sans-serif';
          ctx.fillStyle = 'white';
          ctx.fillText(deps.dependencies.length.toString(), pos.x - NODE_RADIUS * 0.7, pos.y - NODE_RADIUS * 0.7);
        }
        
        if (deps.dependents?.length > 0) {
          ctx.beginPath();
          ctx.arc(pos.x + NODE_RADIUS * 0.7, pos.y - NODE_RADIUS * 0.7, 12, 0, 2 * Math.PI);
          ctx.fillStyle = '#2563eb';
          ctx.fill();
          ctx.font = 'bold 10px Inter, sans-serif';
          ctx.fillStyle = 'white';
          ctx.fillText(deps.dependents.length.toString(), pos.x + NODE_RADIUS * 0.7, pos.y - NODE_RADIUS * 0.7);
        }
      }
    });
    
    ctx.restore();
  }, [tasks, dependencies, nodePositions, zoom, offset, hoveredNode, selectedNode]);

  const getNodeColor = (status?: string | { _id: string; name: string }) => {
    const statusStr = typeof status === 'object' ? status?.name : status;
    const s = (statusStr || '').toLowerCase();
    if (s.includes('done') || s.includes('completed')) return '#22c55e';
    if (s.includes('progress') || s.includes('doing')) return '#3b82f6';
    if (s.includes('review') || s.includes('testing')) return '#f59e0b';
    if (s.includes('blocked')) return '#ef4444';
    return '#94a3b8';
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x) / zoom;
    const y = (e.clientY - rect.top - offset.y) / zoom;
    
    // Find clicked node
    let clickedTask: Task | null = null;
    tasks.forEach(task => {
      const pos = nodePositions[task._id];
      if (!pos) return;
      
      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (distance <= NODE_RADIUS) {
        clickedTask = task;
      }
    });
    
    if (clickedTask) {
      setSelectedNode((clickedTask as Task)._id);
      onTaskClick?.((clickedTask as Task)._id);
    } else {
      setSelectedNode(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    if (dragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
      return;
    }
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x) / zoom;
    const y = (e.clientY - rect.top - offset.y) / zoom;
    
    // Find hovered node
    let foundHover = false;
    tasks.forEach(task => {
      const pos = nodePositions[task._id];
      if (!pos) return;
      
      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (distance <= NODE_RADIUS) {
        setHoveredNode(task._id);
        foundHover = true;
      }
    });
    
    if (!foundHover) {
      setHoveredNode(null);
    }
  };

  return (
    <Paper sx={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* Controls */}
      <Box sx={{ 
        position: 'absolute', 
        top: 16, 
        right: 16, 
        zIndex: 10,
        display: 'flex',
        gap: 1,
        bgcolor: 'white',
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        p: 0.5
      }}>
        <Tooltip title="Zoom In">
          <IconButton size="small" onClick={() => setZoom(Math.min(zoom + 0.2, 3))}>
            <ZoomIn />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zoom Out">
          <IconButton size="small" onClick={() => setZoom(Math.max(zoom - 0.2, 0.5))}>
            <ZoomOut />
          </IconButton>
        </Tooltip>
        <Tooltip title="Reset View">
          <IconButton size="small" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}>
            <CenterFocusStrong />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Legend */}
      <Box sx={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 10,
        bgcolor: 'white',
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        p: 2,
        maxWidth: 200
      }}>
        <Typography fontSize="12px" fontWeight={700} sx={{ mb: 1 }}>Legend</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#dc2626' }} />
            <Typography fontSize="10px">Depends on (incoming)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#2563eb' }} />
            <Typography fontSize="10px">Depended by (outgoing)</Typography>
          </Box>
        </Box>
      </Box>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        onMouseDown={(e) => {
          setDragging(true);
          setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
        }}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
        style={{
          cursor: dragging ? 'grabbing' : hoveredNode ? 'pointer' : 'grab',
          display: 'block'
        }}
      />
    </Paper>
  );
}

