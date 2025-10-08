"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "../../../../ultis/axios";
import { getStartOfWeekUTC, addDays } from "@/lib/timeline";  
import ResponsiveSidebar from "@/components/ResponsiveSidebar"; 
import GanttChart from "@/components/GanttChart";
import ModalMilestone from "@/components/ModalMilestone";
import { Button, Popover, FormGroup, FormControlLabel, Checkbox as MUICheckbox, Select as MUISelect, MenuItem, Typography, Box } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";

type Milestone = {
  _id: string;
  title: string;
  start_date?: string;
  deadline?: string;
  status?: string;
  description?: string;
  createdAt?: string;
};

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);
  const [milestones, setMilestones] = useState<Milestone[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    (async () => {
      try {
        const res = await axiosInstance.get(`/api/projects/${projectId}/milestones`);
        console.log(res.data);
        setMilestones(Array.isArray(res.data) ? res.data : []);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Không thể tải milestone');
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <ResponsiveSidebar />
      <main className="p-4 md:p-6 md:ml-64">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-6 md:mb-8 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-[10px] md:text-xs uppercase tracking-wider text-foreground/60">Dự án</div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">Milestones</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="contained" size="medium" startIcon={<AddIcon />} onClick={() => router.push(`/projects/${projectId}/milestones/new`)}>
                Thêm Milestone
              </Button>
              <Button variant="outlined" size="medium" onClick={() => router.push(`/projects/${projectId}/features`)}>
                Features
              </Button>
              <Button variant="outlined" size="medium" startIcon={<ArrowBackIcon />} onClick={() => router.back()}>
                Quay lại
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="rounded-xl border border-[var(--border)] p-6 bg-[color-mix(in_olab,_var(--accent)_10%,_var(--background))] animate-pulse">
              <div className="h-6 w-32 rounded bg-foreground/10 mb-4"></div>
              <div className="h-4 w-48 rounded bg-foreground/10 mb-2"></div>
              <div className="h-72 w-full rounded bg-foreground/10"></div>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/40 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 p-4">
              {error}
            </div>
          ) : (
            <Timeline milestones={milestones || []} projectId={projectId} onLocalUpdate={setMilestones as any} />
          )}
        </div>
      </main>
    </div>
  );
}

function Timeline({ milestones, projectId, onLocalUpdate }: { milestones: Milestone[]; projectId: string; onLocalUpdate: any }) {
  const [weekStart, setWeekStart] = useState<Date>(getStartOfWeekUTC(new Date()));
  const [viewMode, setViewMode] = useState<'Days' | 'Weeks' | 'Months' | 'Quarters'>('Days');
  const [autoFit, setAutoFit] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<Record<string, boolean>>({
    Planned: true,
    'In Progress': true,
    Completed: true,
    Overdue: true,
  });
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null);
  const [openModal, setOpenModal] = useState<{open: boolean; milestoneId?: string}>({open:false});
  if (!milestones || milestones.length === 0) {
    return <div className="opacity-70">Chưa có milestone nào.</div>;
  }

  return (
    <div className="w-full">
      <div className="sticky top-0 z-10 -mx-4 md:-mx-6 mb-4 bg-[color-mix(in_olab,_var(--background)_80%,_transparent)]/80 backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_olab,_var(--background)_70%,_transparent)] px-4 md:px-6 py-3 border-b border-[var(--border)]">
        <div className="flex flex-wrap items-center gap-3">
          <MUISelect
            value={viewMode}
            onChange={(e: any) => setViewMode(e.target.value as any)}
            size="small"
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="Days">Days</MenuItem>
            <MenuItem value="Weeks">Weeks</MenuItem>
            <MenuItem value="Months">Months</MenuItem>
            <MenuItem value="Quarters">Quarters</MenuItem>
          </MUISelect>
          <FormControlLabel
            className="ml-2"
            control={<MUICheckbox size="small" checked={autoFit} onChange={(e: any) =>setAutoFit(e.target.checked)} />}
            label={<Typography variant="body2">Auto Fit</Typography>}
          />
          <div className="md:ml-2">
            <Button
              variant="outlined"
              size="small"
              onClick={(e: any)=>{ setFilterAnchor(e.currentTarget); setFilterOpen(true); }}
            >
              Bộ lọc
            </Button>
            <Popover
              open={filterOpen}
              anchorEl={filterAnchor}
              onClose={()=>setFilterOpen(false)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{ paper: { sx: { p: 2, width: 280 } } }}
            >
              <Typography variant="overline" sx={{ opacity: 0.7 }}>Trạng thái</Typography>
              <FormGroup sx={{ mt: 1 }}>
                {['Planned','In Progress','Completed','Overdue'].map(s => (
                  <FormControlLabel
                    key={s}
                    control={<MUICheckbox checked={!!statusFilter[s]} onChange={(e: any)=> setStatusFilter(prev => ({...prev, [s]: e.target.checked}))} />}
                    label={s}
                  />
                ))}
              </FormGroup>
              <Box sx={{ display:'flex', justifyContent:'flex-end', gap:1, mt:2 }}>
                <Button size="small" variant="outlined" onClick={()=>setStatusFilter({Planned:true,'In Progress':true,Completed:true,Overdue:true})}>Chọn hết</Button>
                <Button size="small" variant="outlined" onClick={()=>setStatusFilter({Planned:false,'In Progress':false,Completed:false,Overdue:false})}>Bỏ hết</Button>
                <Button size="small" variant="contained" onClick={()=>setFilterOpen(false)}>Áp dụng</Button>
              </Box>
            </Popover>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[color-mix(in_olab,_var(--accent)_8%,_var(--background))] shadow-sm">
        <div>
          <GanttChart
            milestones={(milestones || []).filter(m => m.status ? statusFilter[m.status] : true)}
            viewMode={viewMode as any}
            startDate={weekStart}
            autoFit={autoFit}
            pagingStepDays={viewMode === 'Quarters' ? 90 : viewMode === 'Months' ? 30 : viewMode === 'Weeks' ? 7 : 7}
            onRequestShift={(days) => setWeekStart(prev => addDays(prev, days))}
            onMilestoneShift={(id, deltaDays) => {
              // Local optimistic update: shift start_date and deadline by deltaDays
              onLocalUpdate((prev: Milestone[]) => {
                const shiftDate = (iso?: string) => {
                  if (!iso) return iso;
                  const d = new Date(iso);
                  d.setUTCDate(d.getUTCDate() + deltaDays);
                  return d.toISOString();
                };
                return (prev || []).map((m) => m._id === id ? ({
                  ...m,
                  start_date: shiftDate(m.start_date),
                  deadline: shiftDate(m.deadline),
                }) : m);
              });
            }}
            onMilestoneClick={(id) => setOpenModal({open:true, milestoneId: id})}
          />
        </div>
      </div>

      {openModal.open && openModal.milestoneId && (
        <ModalMilestone
          open={openModal.open}
          onClose={() => setOpenModal({open:false})}
          projectId={projectId}
          milestoneId={openModal.milestoneId}
        />
      )}
    </div>
  );
}

