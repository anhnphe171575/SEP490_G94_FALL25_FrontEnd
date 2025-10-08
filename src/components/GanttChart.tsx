"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { getPeriodStart } from "@/lib/timeline";
import type { CSSProperties } from "react";

// dhtmlx-gantt is pure JS; import lazily inside effects to avoid SSR issues

export type GanttMilestone = {
  _id: string;
  title: string;
  start_date?: string;
  deadline?: string;
  status?: string;
  description?: string;
  createdAt?: string;
};

type ViewMode = "Days" | "Weeks" | "Months" | "Quarters";

export default function GanttChart({
  milestones,
  viewMode,
  startDate,
  autoFit,
  pagingStepDays,
  onRequestShift,
  onMilestoneShift,
  onMilestoneClick,
}: {
  milestones: GanttMilestone[];
  viewMode: ViewMode;
  startDate: Date;
  autoFit?: boolean;
  pagingStepDays?: number;
  onRequestShift?: (days: number) => void;
  onMilestoneShift?: (id: string, deltaDays: number) => void;
  onMilestoneClick?: (id: string) => void;
}) {
  const ganttContainerRef = useRef<HTMLDivElement | null>(null);
  const periodStart = useMemo(() => getPeriodStart(viewMode, startDate), [viewMode, startDate]);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      const gantt = (await import("dhtmlx-gantt")).gantt;

      if (!isMounted || !ganttContainerRef.current) return;

      gantt.clearAll();

      // Configure scale per view mode
      if (viewMode === "Days") {
        gantt.config.scales = [
          { unit: "week", step: 1, format: (date: Date) => formatWeekLabelRange(date) },
          { unit: "day", step: 1, format: "%D %d" },
        ];
        gantt.config.scale_height = 50;
      } else if (viewMode === "Weeks") {
        gantt.config.scales = [
          { unit: "month", step: 1, format: "%M %Y" },
          { unit: "week", step: 1, format: (date: Date) => `W${getISOWeek(date)}` },
        ];
        gantt.config.scale_height = 50;
      } else if (viewMode === "Months") {
        gantt.config.scales = [
          { unit: "year", step: 1, format: "%Y" },
          { unit: "month", step: 1, format: "%M" },
        ];
        gantt.config.scale_height = 45;
      } else {
        // Quarters
        gantt.config.scales = [
          { unit: "year", step: 1, format: "%Y" },
          { unit: "quarter", step: 1, format: (date: Date) => `Q${Math.floor(date.getUTCMonth() / 3) + 1}` },
        ];
        gantt.config.scale_height = 40;
      }

      gantt.config.readonly = false;
      gantt.config.drag_move = true;
      gantt.config.drag_resize = true;
      gantt.config.drag_progress = false;
      gantt.config.fit_tasks = !!autoFit;
      gantt.config.row_height = 32;
      gantt.config.bar_height = 20;
      // Hide the grid (Title/Start/End columns)
      gantt.config.columns = [];
      gantt.config.grid_width = 0;

      // Color by status via templates
      gantt.templates.task_class = (start: Date, end: Date, task: any) => {
        const status = task.status as string | undefined;
        if (status === "Planned") return "gantt-task-planned";
        if (status === "In Progress") return "gantt-task-inprogress";
        if (status === "Completed") return "gantt-task-completed";
        if (status === "Overdue") return "gantt-task-overdue";
        return "gantt-task-default";
      };

      // Change listener to fire delta days
      gantt.attachEvent("onAfterTaskDrag", (id: string, mode: string, e: any) => {
        if (mode !== "move") return true;
        const task = gantt.getTask(id);
        const original = task._original_start as Date | undefined;
        if (!original || !task.start_date) return true;
        const msPerDay = 24 * 60 * 60 * 1000;
        const deltaDays = Math.round((stripUTC(asDate(task.start_date)).getTime() - stripUTC(original).getTime()) / msPerDay);
        if (deltaDays !== 0) onMilestoneShift?.(id, deltaDays);
        return true;
      });

      // Keep original start for delta calc
      gantt.attachEvent("onBeforeTaskDrag", (id: string, mode: string, e: any) => {
        const task = gantt.getTask(id);
        if (task.start_date) task._original_start = asDate(task.start_date);
        return true;
      });

      // Click to open details
      gantt.attachEvent("onTaskClick", function(id: string){
        onMilestoneClick?.(id as any);
        return true;
      });

      // Init and set data
      gantt.init(ganttContainerRef.current);
      const data = mapMilestonesToGantt(milestones, periodStart);
      gantt.parse({ data });

      // Scroll to periodStart
      gantt.showDate(periodStart);
    };
    init();
    return () => {
      isMounted = false;
      // dhtmlx-gantt has no explicit destroy; clearing is enough on unmount
      // container will be removed by React
    };
  }, [milestones, periodStart, viewMode, autoFit, onMilestoneShift]);

  const containerStyle: CSSProperties = {
    height: 380,
    width: "100%",
    border: "1px solid var(--border)",
    background: "color-mix(in oklab, var(--accent) 6%, var(--background))",
    borderRadius: 14,
    boxShadow: "var(--shadow-soft)",
  };

  return (
    <div className={`w-full ${viewMode === "Days" ? "gantt-split-half" : ""}`}>
      <div ref={ganttContainerRef} style={containerStyle} />
      <style>{`
        /* Container */
        .gantt_container { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color: var(--foreground); }

        /* Scales */
        .gantt_scale_line { background: color-mix(in oklab, var(--accent) 18%, var(--background)); border-color: var(--border); }
        .gantt_scale_cell { color: color-mix(in oklab, var(--foreground) 82%, transparent); font-weight: 600; letter-spacing: .2px; }
        .gantt_task .gantt_task_scale { background: color-mix(in oklab, var(--accent) 18%, var(--background)); }

        /* Rows */
        .gantt_row, .gantt_task_row { background: var(--background); }
        .gantt_row.odd, .gantt_task_row.odd { background: color-mix(in oklab, var(--accent) 10%, var(--background)); }
        .gantt_row, .gantt_task_row { border-bottom: 1px solid var(--border); }

        /* Half-day horizontal split for Days view */
        .gantt-split-half .gantt_task_row, .gantt-split-half .gantt_row {
          background-image: repeating-linear-gradient(
            to bottom,
            transparent 0 16px,
            var(--border) 16px 17px,
            transparent 17px 32px
          );
          background-blend-mode: normal;
        }

        /* Tasks */
        .gantt_task_line { border-radius: 8px; border: 1px solid transparent; box-shadow: 0 2px 8px rgba(0,0,0,.06); background: color-mix(in oklab, var(--foreground) 24%, transparent); }
        .gantt_task_content { padding: 2px 10px; font-weight: 600; text-shadow: none; }

        /* Status colors */
        .gantt-task-planned .gantt_task_content { background: #3b82f6 !important; color: #ffffff; } /* blue-500 */
        .gantt-task-inprogress .gantt_task_content { background: var(--primary-600) !important; color: #ffffff; }
        .gantt-task-completed .gantt_task_content { background: #22c55e !important; color: #ffffff; } /* green-500 */
        .gantt-task-overdue .gantt_task_content { background: #ef4444 !important; color: #ffffff; } /* red-500 */
        .gantt-task-default .gantt_task_content { background: #6b7280 !important; color: #ffffff; } /* slate-500 */

        /* Selection/focus */
        .gantt_selected .gantt_task_line { outline: 2px solid var(--ring); outline-offset: 0; box-shadow: none; }

        /* Grid hidden state smoothing */
        .gantt_layout_cell.gantt_grid { border-right: none; }

        /* Today marker */
        .today .gantt_marker { background: var(--primary-600); opacity: .9; width: 2px; }
        .today .gantt_marker_content { background: var(--primary-600); color: #fff; border-radius: 8px; padding: 2px 8px; font-size: 12px; box-shadow: 0 4px 12px color-mix(in oklab, var(--primary) 40%, transparent); }

        /* Links (if ever enabled) */
        .gantt_link_line { stroke: color-mix(in oklab, var(--primary) 80%, #000 20%); }
        .gantt_link_arrow { fill: color-mix(in oklab, var(--primary) 80%, #000 20%); }

        /* Scrollbars */
        .gantt_container ::-webkit-scrollbar { height: 8px; width: 8px; }
        .gantt_container ::-webkit-scrollbar-thumb { background: color-mix(in oklab, var(--foreground) 30%, transparent); border-radius: 10px; }
        .gantt_container ::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}

function mapMilestonesToGantt(items: GanttMilestone[], fallbackStart: Date) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return items.map((m) => {
    const startCandidate = m.start_date || m.createdAt || m.deadline;
    const endCandidate = m.deadline || m.start_date || startCandidate;
    const start = startCandidate ? new Date(startCandidate) : fallbackStart;
    const end = endCandidate ? new Date(endCandidate) : new Date(start.getTime() + msPerDay);
    const durationDays = Math.max(1, Math.ceil((stripUTC(end).getTime() - stripUTC(start).getTime()) / msPerDay));
    return {
      id: m._id,
      text: m.title,
      start_date: toGanttDate(start),
      duration: durationDays,
      status: m.status,
    };
  });
}

function toGanttDate(d: Date) {
  // dhtmlx-gantt default format is "%d-%m-%Y" if not configured; use Date directly as it accepts Date objects too
  return new Date(d);
}

function stripUTC(date: Date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function asDate(value: string | number | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

function getISOWeek(d: Date) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return weekNo;
}

function startOfISOWeekUTC(d: Date) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7; // 1..7 Mon..Sun
  if (day !== 1) date.setUTCDate(date.getUTCDate() - (day - 1));
  return date;
}

function addDaysUTC(d: Date, num: number) {
  const nd = new Date(d);
  nd.setUTCDate(nd.getUTCDate() + num);
  return nd;
}

function formatShortMonthEn(d: Date) {
  return d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
}

function formatWeekLabelRange(date: Date) {
  const week = getISOWeek(date);
  const start = startOfISOWeekUTC(date);
  const end = addDaysUTC(start, 6);
  const s = `${formatShortMonthEn(start)} ${start.getUTCDate()}`;
  const e = `${formatShortMonthEn(end)} ${end.getUTCDate()}`;
  return `Week ${week} ${s} - ${e}`;
}
