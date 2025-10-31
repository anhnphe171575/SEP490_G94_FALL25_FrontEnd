"use client";

import { useEffect, useRef, useState } from "react";
import { gantt } from "dhtmlx-gantt";
import "dhtmlx-gantt/codebase/dhtmlxgantt.css";
import { Box, IconButton, ButtonGroup, Tooltip, Divider } from "@mui/material";
import { ZoomIn, ZoomOut, CalendarMonth, CalendarToday, CalendarViewWeek, CalendarViewMonth, FitScreen } from "@mui/icons-material";

type Task = {
  _id: string;
  title: string;
  start_date?: string;
  deadline?: string;
  status?: string | { _id: string; name: string };
  assignee_id?: any;
  progress?: number;
  priority?: string | { _id: string; name: string };
  parent_task_id?: string;
  feature_id?: any;
  [key: string]: any;
};

interface Dependency {
  _id: string;
  task_id: string;
  depends_on_task_id: any;
  dependency_type: 'FS' | 'FF' | 'SS' | 'SF';
}

interface DHtmlxGanttChartProps {
  tasks: Task[];
  dependencies: Record<string, { dependencies: Dependency[]; dependents: Dependency[] }>;
  onTaskClick?: (taskId: string) => void;
}

// Helper function for status colors
function getStatusColor(status?: string): string {
  const s = (status || '').toLowerCase();
  if (s.includes('done') || s.includes('completed')) return '#00c875';
  if (s.includes('progress')) return '#00d4ff';
  if (s.includes('review')) return '#a25ddc';
  if (s.includes('blocked')) return '#e44258';
  return '#579bfc';
}

export default function DHtmlxGanttChart({ 
  tasks, 
  dependencies,
  onTaskClick 
}: DHtmlxGanttChartProps) {
  const ganttContainer = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState<'day' | 'week' | 'month' | 'year'>('week');

  useEffect(() => {
    if (!ganttContainer.current) return;

    // Configure Gantt
    gantt.config.date_format = "%Y-%m-%d";

    const getAssigneeInitial = (assignee: string) => {
      if (!assignee) return "";
      return assignee.trim().charAt(0).toUpperCase();
    };
    const getAssigneeName = (assignee: string) => {
      if (!assignee) return "";
      const parts = assignee.trim().split(/\s+/);
      return parts[0];
    };

    // Beautiful columns with icons
    gantt.config.columns = [
      {
        name: "text",
        label: "TASK NAME",
        tree: true,
        width: 320,
        template: function (task: any) {
          if (task.type === "project") {
            return `
              <div class="gantt-grid-cell gantt-grid-cell--project">
                <span class="gantt-grid-cell__icon">📁</span>
                <span class="gantt-grid-cell__title gantt-grid-cell__title--project">${task.text}</span>
              </div>
            `;
          }
          const color = getStatusColor(task.status_name);
          return `
            <div class="gantt-grid-cell">
              <span class="gantt-grid-status" style="background:${color}; box-shadow:0 0 0 3px ${color}22;"></span>
              <span class="gantt-grid-cell__title">${task.text}</span>
            </div>
          `;
        }
      },
      {
        name: "duration",
        label: "DURATION",
        align: "center",
        width: 110,
        template: function (task: any) {
          const duration = task.duration || 0;
          return `
            <div class="gantt-grid-tag">
              <span class="gantt-grid-tag__value">${duration}</span>
              <span class="gantt-grid-tag__unit">days</span>
            </div>
          `;
        }
      },
      {
        name: "assignee",
        label: "ASSIGNEE",
        align: "center",
        width: 140,
        template: function (task: any) {
          if (!task.assignee) {
            return `<span class="gantt-grid-empty">Unassigned</span>`;
          }
          const name = getAssigneeName(task.assignee);
          const initial = getAssigneeInitial(task.assignee);
          const palette = ['#00c875', '#00d4ff', '#a25ddc', '#579bfc', '#fdab3d'];
          const color = palette[(task.assignee.length || 0) % palette.length];
          return `
            <div class="gantt-grid-assignee" style="background:${color}12;">
              <span class="gantt-grid-assignee__avatar" style="background:${color}; box-shadow:0 2px 4px ${color}40;">${initial}</span>
              <span class="gantt-grid-assignee__name">${name}</span>
            </div>
          `;
        }
      },
      {
        name: "progress",
        label: "PROGRESS",
        align: "center",
        width: 120,
        template: function (task: any) {
          const percent = Math.round((task.progress || 0) * 100);
          const color = percent === 100 ? '#00c875' : percent >= 50 ? '#00d4ff' : '#6b7280';
          return `
            <div class="gantt-grid-progress">
              <div class="gantt-grid-progress__bar">
                <div class="gantt-grid-progress__fill" style="width:${percent}%; background:${color};"></div>
              </div>
              <span class="gantt-grid-progress__value" style="color:${color};">${percent}%</span>
            </div>
          `;
        }
      }
    ];

    // Zoom config - Dynamic based on zoom level
    const applyZoomLevel = (level: 'day' | 'week' | 'month' | 'year') => {
      switch (level) {
        case 'day':
          gantt.config.scale_unit = "day";
          gantt.config.date_scale = "%d %M";
          gantt.config.subscales = [
            { unit: "hour", step: 4, date: "%H:%i" }
          ];
          gantt.config.scale_height = 60;
          break;
        case 'week':
          gantt.config.scale_unit = "week";
          gantt.config.date_scale = "Week %W";
          gantt.config.subscales = [
            { unit: "day", step: 1, date: "%d %D" }
          ];
          gantt.config.scale_height = 60;
          break;
        case 'month':
          gantt.config.scale_unit = "month";
          gantt.config.date_scale = "%F %Y";
          gantt.config.subscales = [
            { unit: "week", step: 1, date: "W%W" }
          ];
          gantt.config.scale_height = 60;
          break;
        case 'year':
          gantt.config.scale_unit = "year";
          gantt.config.date_scale = "%Y";
          gantt.config.subscales = [
            { unit: "month", step: 1, date: "%M" }
          ];
          gantt.config.scale_height = 60;
          break;
      }
    };

    applyZoomLevel(zoomLevel);

    // Enable features
    gantt.config.auto_scheduling = false; // Disable to prevent auto-moves
    gantt.config.details_on_dblclick = false; // Disable double click
    gantt.config.show_progress = true;
    gantt.config.order_branch = true;
    gantt.config.open_tree_initially = true;
    gantt.config.row_height = 50;
    gantt.config.bar_height = 32;
    gantt.config.drag_links = false; // Disable link creation
    gantt.config.drag_progress = false; // Disable progress drag
    gantt.config.drag_resize = false; // Disable resize
    gantt.config.drag_move = false; // Disable task drag

    // Highlight weekends
    gantt.templates.scale_cell_class = function(date) {
      if (date.getDay() === 0 || date.getDay() === 6) {
        return "weekend";
      }
      return "";
    };

    gantt.templates.timeline_cell_class = function(task, date) {
      if (date.getDay() === 0 || date.getDay() === 6) {
        return "weekend";
      }
      return "";
    };

    // Custom task styling
    gantt.templates.task_class = function(start, end, task) {
      const status = (task.status_name || '').toLowerCase();
      if (status.includes('done') || status.includes('completed')) return "gantt-task-completed";
      if (status.includes('progress')) return "gantt-task-progress";
      if (status.includes('review')) return "gantt-task-review";
      if (status.includes('blocked')) return "gantt-task-blocked";
      return "gantt-task-default";
    };

    // Task text - always show full text
    gantt.templates.task_text = function(start, end, task) {
      if (task.type === "project") {
        return `<strong>${task.text}</strong>`;
      }
      const percent = Math.round((task.progress || 0) * 100);
      return `<span style="display: inline-block;">${task.text}</span> <span style="opacity: 0.85; font-size: 11px; margin-left: 4px;">${percent}%</span>`;
    };
    
    // Tooltip
    gantt.templates.tooltip_text = function(start, end, task) {
      const status = task.status_name || 'No status';
      const assignee = task.assignee || 'Unassigned';
      const progress = Math.round((task.progress || 0) * 100);
      
      return `<div style="padding: 8px; min-width: 200px;">
        <div style="font-weight: 700; font-size: 14px; margin-bottom: 8px; color: #1f2937;">${task.text}</div>
        <div style="font-size: 12px; color: #6b7280; line-height: 1.8;">
          <div><strong>Status:</strong> <span style="color: ${getStatusColor(status)};">●</span> ${status}</div>
          <div><strong>Assignee:</strong> ${assignee}</div>
          <div><strong>Duration:</strong> ${task.duration || 0} days</div>
          <div><strong>Progress:</strong> ${progress}%</div>
          <div><strong>Start:</strong> ${gantt.date.date_to_str("%d %M %Y")(start)}</div>
          <div><strong>End:</strong> ${gantt.date.date_to_str("%d %M %Y")(end)}</div>
        </div>
      </div>`;
    };
    
    // Today marker
    gantt.templates.timeline_cell_class = function(task, date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const cellDate = new Date(date);
      cellDate.setHours(0, 0, 0, 0);
      
      if (cellDate.getTime() === today.getTime()) {
        return "today";
      }
      if (date.getDay() === 0 || date.getDay() === 6) {
        return "weekend";
      }
      return "";
    };

    // Initialize Gantt
    gantt.init(ganttContainer.current);

    // Transform data
    const ganttData = transformToGanttData(tasks, dependencies);
    gantt.parse(ganttData);

    // Event handlers
    gantt.attachEvent("onTaskClick", function(id) {
      onTaskClick?.(String(id));
      return true;
    });

    // Cleanup
    return () => {
      gantt.clearAll();
    };
  }, [tasks, dependencies, onTaskClick, zoomLevel]);

  // Zoom handlers
  const handleZoomIn = () => {
    const levels: ('day' | 'week' | 'month' | 'year')[] = ['year', 'month', 'week', 'day'];
    const currentIndex = levels.indexOf(zoomLevel);
    if (currentIndex < levels.length - 1) {
      setZoomLevel(levels[currentIndex + 1]);
    }
  };

  const handleZoomOut = () => {
    const levels: ('day' | 'week' | 'month' | 'year')[] = ['day', 'week', 'month', 'year'];
    const currentIndex = levels.indexOf(zoomLevel);
    if (currentIndex < levels.length - 1) {
      setZoomLevel(levels[currentIndex + 1]);
    }
  };

  const handleFitScreen = () => {
    if (ganttContainer.current) {
      gantt.render();
    }
  };

  return (
    <>
      {/* Toolbar */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2, 
        p: 2, 
        bgcolor: 'white', 
        borderBottom: '1px solid #e5e7eb',
        borderRadius: '12px 12px 0 0'
      }}>
        <ButtonGroup variant="outlined" size="small">
          <Tooltip title="Zoom In">
            <IconButton 
              onClick={handleZoomIn} 
              disabled={zoomLevel === 'day'}
              sx={{ borderRadius: '8px 0 0 8px' }}
            >
              <ZoomIn fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom Out">
            <IconButton 
              onClick={handleZoomOut} 
              disabled={zoomLevel === 'year'}
              sx={{ borderRadius: '0 8px 8px 0' }}
            >
              <ZoomOut fontSize="small" />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        <Divider orientation="vertical" flexItem />

        <ButtonGroup variant="outlined" size="small">
          <Tooltip title="Day View">
            <IconButton 
              onClick={() => setZoomLevel('day')}
              color={zoomLevel === 'day' ? 'primary' : 'default'}
            >
              <CalendarToday fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Week View">
            <IconButton 
              onClick={() => setZoomLevel('week')}
              color={zoomLevel === 'week' ? 'primary' : 'default'}
            >
              <CalendarViewWeek fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Month View">
            <IconButton 
              onClick={() => setZoomLevel('month')}
              color={zoomLevel === 'month' ? 'primary' : 'default'}
            >
              <CalendarViewMonth fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Year View">
            <IconButton 
              onClick={() => setZoomLevel('year')}
              color={zoomLevel === 'year' ? 'primary' : 'default'}
            >
              <CalendarMonth fontSize="small" />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        <Divider orientation="vertical" flexItem />

        <Tooltip title="Fit to Screen">
          <IconButton onClick={handleFitScreen} size="small">
            <FitScreen fontSize="small" />
          </IconButton>
        </Tooltip>

        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ 
            px: 2, 
            py: 0.5, 
            bgcolor: '#f3f4f6', 
            borderRadius: 1,
            fontSize: '12px',
            fontWeight: 600,
            color: '#6b7280',
            textTransform: 'uppercase'
          }}>
            {zoomLevel} View
          </Box>
        </Box>
      </Box>

      <style jsx global>{`
        .gantt_container {
          width: 100%;
          height: 100%;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        }

        /* Header Styling */
        .gantt_grid_scale,
        .gantt_task_scale {
          background: linear-gradient(180deg, #ffffff 0%, #f9fafb 100%);
          border-bottom: 2px solid #e5e7eb;
        }

        .gantt_grid_head_cell {
          background: transparent;
          color: #6b7280;
          font-weight: 700;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          border-right: 1px solid #e5e7eb;
          padding: 14px 12px;
        }

        .gantt_scale_line {
          border-top: none;
        }

        .gantt_scale_cell {
          color: #374151;
          font-weight: 600;
          font-size: 12px;
          border-right: 1px solid #e5e7eb;
        }

        /* Row Styling */
        .gantt_row {
          background-color: white;
          border-bottom: 1px solid #f3f4f6;
        }

        .gantt_row.odd {
          background-color: #fafbfc;
        }

        .gantt_row:hover,
        .gantt_row.odd:hover {
          background-color: #f0f9ff !important;
        }

        .gantt_cell {
          border-right: 1px solid #f3f4f6;
        }

        /* Grid cell content styling */
        .gantt-grid-cell,
        .gantt-grid-cell--project {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .gantt-grid-cell__title {
          color: #111827;
          font-weight: 600;
          font-size: 13px;
        }

        .gantt-grid-cell__title--project {
          font-size: 14px;
          font-weight: 700;
        }

        .gantt-grid-cell__icon {
          font-size: 16px;
        }

        .gantt-grid-status {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .gantt-grid-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 12px;
          background-color: #f3f4f6;
          border-radius: 8px;
        }

        .gantt-grid-tag__value {
          color: #1f2937;
          font-weight: 700;
          font-size: 13px;
        }

        .gantt-grid-tag__unit {
          color: #6b7280;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }

        .gantt-grid-assignee {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 10px;
          font-weight: 600;
          color: #1f2937;
        }

        .gantt-grid-assignee__avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          font-weight: 700;
        }

        .gantt-grid-assignee__name {
          font-size: 13px;
        }

        .gantt-grid-progress {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .gantt-grid-progress__bar {
          width: 64px;
          height: 6px;
          border-radius: 4px;
          background-color: #e5e7eb;
          overflow: hidden;
        }

        .gantt-grid-progress__fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .gantt-grid-progress__value {
          font-weight: 700;
          font-size: 13px;
        }

        .gantt-grid-empty {
          color: #9ca3af;
          font-weight: 500;
        }

        /* Grid Data */
        .gantt_grid_data .gantt_cell {
          padding: 14px 12px;
          vertical-align: middle;
          display: flex;
          align-items: center;
        }

        .gantt_tree_content {
          padding-left: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
        }

        .gantt_tree_indent {
          width: 20px;
          flex: 0 0 20px;
        }

        .gantt_tree_icon {
          flex: 0 0 auto;
        }

        /* Timeline Styling */
        .weekend {
          background-color: #f9fafb !important;
          background-image: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(0, 0, 0, 0.02) 10px,
            rgba(0, 0, 0, 0.02) 20px
          );
        }

        .today {
          background-color: #dbeafe !important;
          position: relative;
        }

        .today::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          width: 2px;
          height: 100%;
          background: linear-gradient(180deg, #3b82f6 0%, #60a5fa 100%);
          transform: translateX(-50%);
          z-index: 1;
        }

        /* Task Bars - Completed */
        .gantt-task-completed .gantt_task_progress {
          background: linear-gradient(135deg, #00c875 0%, #00a560 100%);
          box-shadow: 0 2px 6px rgba(0, 200, 117, 0.3);
        }

        .gantt-task-completed .gantt_task_content {
          background: linear-gradient(135deg, #00c875 0%, #00a560 100%);
        }

        /* Task Bars - In Progress */
        .gantt-task-progress .gantt_task_progress {
          background: linear-gradient(135deg, #00d4ff 0%, #00a6cc 100%);
          box-shadow: 0 2px 6px rgba(0, 212, 255, 0.3);
        }

        .gantt-task-progress .gantt_task_content {
          background: linear-gradient(135deg, #00d4ff 0%, #00a6cc 100%);
        }

        /* Task Bars - Review */
        .gantt-task-review .gantt_task_progress {
          background: linear-gradient(135deg, #a25ddc 0%, #8b4ec3 100%);
          box-shadow: 0 2px 6px rgba(162, 93, 220, 0.3);
        }

        .gantt-task-review .gantt_task_content {
          background: linear-gradient(135deg, #a25ddc 0%, #8b4ec3 100%);
        }

        /* Task Bars - Blocked */
        .gantt-task-blocked .gantt_task_progress {
          background: linear-gradient(135deg, #e44258 0%, #c9374a 100%);
          box-shadow: 0 2px 6px rgba(228, 66, 88, 0.3);
        }

        .gantt-task-blocked .gantt_task_content {
          background: linear-gradient(135deg, #e44258 0%, #c9374a 100%);
        }

        /* Task Bars - Default */
        .gantt-task-default .gantt_task_progress {
          background: linear-gradient(135deg, #579bfc 0%, #4179d6 100%);
          box-shadow: 0 2px 6px rgba(87, 155, 252, 0.3);
        }

        .gantt-task-default .gantt_task_content {
          background: linear-gradient(135deg, #579bfc 0%, #4179d6 100%);
        }

        /* Task Bar General */
        .gantt_task_line {
          border-radius: 6px;
          border: none;
          overflow: visible !important;
          display: flex !important;
          align-items: center !important;
        }

        .gantt_task_content {
          color: white;
          font-weight: 600;
          font-size: 13px;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          line-height: 32px;
          padding: 0 12px;
          white-space: nowrap;
          overflow: visible;
          display: flex !important;
          align-items: center !important;
          height: 100% !important;
        }

        .gantt_task_line:hover {
          opacity: 0.95;
          transform: translateY(-1px);
          transition: all 0.2s ease;
          z-index: 10 !important;
        }

        .gantt_task_cell {
          overflow: visible !important;
        }

        .gantt_bars_area {
          overflow: visible !important;
        }

        /* Progress Bar */
        .gantt_task_progress {
          opacity: 0.3;
          border-radius: 6px;
        }

        /* Project Tasks */
        .gantt_project .gantt_task_content {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        }

        /* Dependencies */
        .gantt_link_arrow {
          border-color: #6b7280;
        }

        .gantt_line_wrapper div {
          background-color: #6b7280;
        }

        .gantt_link_arrow_right {
          border-left-color: #6b7280;
        }

        .gantt_link_arrow_left {
          border-right-color: #6b7280;
        }

        .gantt_task_link:hover .gantt_line_wrapper div {
          background-color: #7b68ee;
          box-shadow: 0 0 8px rgba(123, 104, 238, 0.5);
        }

        .gantt_task_link:hover .gantt_link_arrow {
          border-color: #7b68ee;
        }

        .gantt_link_control {
          background-color: white;
          border: 2px solid #579bfc;
          border-radius: 50%;
        }

        /* Tooltip */
        .gantt_tooltip {
          background-color: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          padding: 0;
          font-family: 'Inter', sans-serif;
        }

        /* Scrollbar */
        .gantt_layout_cell::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .gantt_layout_cell::-webkit-scrollbar-track {
          background: #f3f4f6;
        }

        .gantt_layout_cell::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }

        .gantt_layout_cell::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }

        /* Tree Icons */
        .gantt_tree_icon.gantt_folder_open,
        .gantt_tree_icon.gantt_folder_closed {
          background: none;
          color: #6b7280;
          font-size: 14px;
        }

        .gantt_tree_icon.gantt_folder_open::before {
          content: '📂';
        }

        .gantt_tree_icon.gantt_folder_closed::before {
          content: '📁';
        }

        /* Responsive */
        @media (max-width: 768px) {
          .gantt_grid_scale .gantt_grid_head_cell {
            font-size: 10px;
          }
          
          .gantt_task_content {
            font-size: 11px;
          }
        }
      `}</style>
      <div 
        ref={ganttContainer} 
        className="gantt_container"
        style={{ width: '100%', height: '600px', borderRadius: '0 0 12px 12px' }}
      />
    </>
  );
}

function transformToGanttData(
  tasks: Task[], 
  dependencies: Record<string, { dependencies: Dependency[]; dependents: Dependency[] }>
) {
  const ganttTasks: any[] = [];
  const ganttLinks: any[] = [];
  let linkId = 1;

  // Group tasks by feature
  const groups: Record<string, Task[]> = {};
  tasks.filter(t => !t.parent_task_id).forEach(task => {
    const groupKey = typeof task.feature_id === 'object' 
      ? (task.feature_id as any)?.title || 'No Group'
      : task.feature_id || 'No Group';
    
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(task);
  });

  // Add groups and tasks
  Object.entries(groups).forEach(([groupName, groupTasks]) => {
    const groupId = `group_${groupName}`;
    
    // Add group
    ganttTasks.push({
      id: groupId,
      text: groupName,
      type: "project",
      open: true,
      start_date: null,
      duration: 0
    });

    // Add tasks in group
    groupTasks.forEach(task => {
      const today = new Date();
      const hasDate = task.start_date && task.deadline;
      
      ganttTasks.push({
        id: task._id,
        text: task.title,
        start_date: hasDate ? formatDate(new Date(task.start_date!)) : formatDate(today),
        duration: hasDate 
          ? Math.max(1, Math.ceil((new Date(task.deadline!).getTime() - new Date(task.start_date!).getTime()) / 86400000))
          : 2,
        progress: (task.progress || 0) / 100,
        parent: groupId,
        assignee: task.assignee_id?.full_name || task.assignee_id?.email || '',
        status_name: typeof task.status === 'object' ? task.status?.name : task.status,
        type: "task"
      });

      // Add subtasks
      const subtasks = tasks.filter(t => t.parent_task_id === task._id);
      subtasks.forEach(subtask => {
        const subHasDate = subtask.start_date && subtask.deadline;
        
        ganttTasks.push({
          id: subtask._id,
          text: subtask.title,
          start_date: subHasDate ? formatDate(new Date(subtask.start_date!)) : formatDate(today),
          duration: subHasDate
            ? Math.max(1, Math.ceil((new Date(subtask.deadline!).getTime() - new Date(subtask.start_date!).getTime()) / 86400000))
            : 2,
          progress: (subtask.progress || 0) / 100,
          parent: task._id,
          assignee: subtask.assignee_id?.full_name || subtask.assignee_id?.email || '',
          status_name: typeof subtask.status === 'object' ? subtask.status?.name : subtask.status,
          type: "task"
        });
      });
    });
  });

  // Add dependencies
  tasks.forEach(task => {
    const deps = dependencies[task._id];
    if (!deps?.dependencies) return;

    deps.dependencies.forEach(dep => {
      const targetId = dep.depends_on_task_id?._id;
      if (!targetId) return;

      // Map dependency types to dhtmlx-gantt format
      const typeMap: Record<string, string> = {
        'FS': '0', // Finish-to-Start (default)
        'SS': '1', // Start-to-Start
        'FF': '2', // Finish-to-Finish
        'SF': '3'  // Start-to-Finish
      };

      ganttLinks.push({
        id: linkId++,
        source: task._id,
        target: targetId,
        type: typeMap[dep.dependency_type] || '0'
      });
    });
  });

  return {
    data: ganttTasks,
    links: ganttLinks
  };
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

