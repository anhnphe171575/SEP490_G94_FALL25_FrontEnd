"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axiosInstance from "../../../../../ultis/axios";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Divider,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Select as MUISelect,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ClearIcon from "@mui/icons-material/Clear";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";

type User = {
  _id: string;
  full_name?: string;
  email?: string;
};

type Defect = {
  _id: string;
  code?: string;
  title: string;
  status?: "Open" | "In Progress" | "Resolved" | "Closed";
  severity?: "Low" | "Medium" | "High" | "Critical";
  priority?: "Low" | "Medium" | "High";
  assignee_id?: User | null;
  assigner_id?: User | null;
  deadline?: string;
  createAt?:string;
  updateAt?:string;
  project_id?: string;
  function?: {
    _id: string;
    title: string;
  };
  
};

type PagedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

export default function DefectsListPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const projectId = params?.id;
  const [allDefects, setAllDefects] = useState<Defect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [severity, setSeverity] = useState<string>("all");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // total is derived from filtered results

  // UI
  const [showFilters, setShowFilters] = useState(false);

  // Detail dialog state
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selectedDefect, setSelectedDefect] = useState<Defect | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserRole, setCurrentUserRole] = useState<number | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignAssigneeId, setAssignAssigneeId] = useState<string>("");
  const [assignMembers, setAssignMembers] = useState<Array<User>>([]);
  const [assignDefect, setAssignDefect] = useState<Defect | null>(null);
  const [assignDeadline, setAssignDeadline] = useState<string>("");

  // Fetch all defects once from backend
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        // gate by token and redirect to login if missing
        const token = typeof window !== 'undefined' ? (sessionStorage.getItem('token') || localStorage.getItem('token')) : null;
        if (!token) {
          setLoading(false);
          return router.replace('/login');
        }
        if (!projectId) {
          // wait for projectId from route
          return;
        }
        setLoading(true);
        setError(null);
        const [listRes, meRes] = await Promise.all([
          axiosInstance.get<Defect[] | PagedResponse<Defect> | { defects: Defect[] }>(
            "/api/defects",
            { params: { project_id: projectId } }
          ),
          axiosInstance.get<any>("/api/users/me"),
        ]);
        const res = listRes;
        const meData: any = meRes?.data;
        const extractedId = meData?._id || meData?.id || meData?.user?._id || meData?.data?._id || "";
        setCurrentUserId(extractedId || "");
        const roleVal = meData?.role ?? meData?.user?.role ?? meData?.data?.role ?? null;
        
        setCurrentUserRole(typeof roleVal === 'string' ? Number(roleVal) : roleVal);
        console.log(currentUserId);
        console.log(currentUserRole);
        const body: any = res.data;
        let list: Defect[] = [];
        if (Array.isArray(body)) list = body;
        else if (body?.defects) list = body.defects as Defect[];
        else if (body?.data) list = body.data as Defect[];
        setAllDefects(list);
      } catch (e: any) {
        setError(e?.response?.data?.message || "Không thể tải danh sách defects");
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  // Derived filtered and paginated data (client-side)
  const filteredDefects = useMemo(() => {
    let data = allDefects;
    if (search) {
      const term = search.toLowerCase();
      data = data.filter(d =>
        d.title.toLowerCase().includes(term) ||
        (d.code || "").toLowerCase().includes(term) ||
        (d.assignee_id?.full_name || d.assignee_id?.email || "").toLowerCase().includes(term)
      );    
    }
    if (status !== "all") {
      data = data.filter(d => (d.status || "").toLowerCase() === status.toLowerCase());
    }
    if (severity !== "all") {
      data = data.filter(d => (d.severity || "").toLowerCase() === severity.toLowerCase());
    }
    return data;
  }, [allDefects, search, status, severity]);

  const total = filteredDefects.length;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  // Clamp page if filters reduce total pages
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const defects = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredDefects.slice(start, end);
  }, [filteredDefects, page, pageSize]);

  const openDefectDetail = async (id: string, seed?: Defect) => {
    setDetailOpen(true);
    setDetailError(null);
    if (seed) setSelectedDefect(seed);
    try {
      setDetailLoading(true);
      const res = await axiosInstance.get<any>(`/api/defects/${id}`);
      const body: any = res.data;
      let item: Defect | null = null;
      if (body?.defect && body.defect._id) item = body.defect as Defect;
      else if (body?.data && body.data._id) item = body.data as Defect;
      else if (body?._id) item = body as Defect;
      if (item) setSelectedDefect(item);
    } catch (e: any) {
      setDetailError(e?.response?.data?.message || 'Không thể tải chi tiết defect');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDefectDetail = () => {
    setDetailOpen(false);
    setDetailError(null);
    setSelectedDefect(null);
  };

  const deleteDefect = async (id: string) => {
    if (!id) return;
    const confirmDelete = window.confirm('Bạn có chắc muốn xóa defect này?');
    if (!confirmDelete) return;
    try {
      await axiosInstance.delete(`/api/defects/${id}`);
      setAllDefects(prev => prev.filter(d => d._id !== id));
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Xóa defect thất bại');
    }
  };

  const openAssignDialog = async (defect: Defect) => {
    setAssignDefect(defect);
    setAssignOpen(true);
    setAssignError(null);
    setAssignLoading(true);
    setAssignAssigneeId("");
    setAssignDeadline(defect?.deadline ? new Date(defect.deadline).toISOString().slice(0,16) : "");
    try {
      const res = await axiosInstance.get(`/api/projects/${projectId}/members`);
      const data: any = res.data;
      const membersArray: any[] = Array.isArray(data?.members) ? data.members : (Array.isArray(data) ? data : []);
      const users: User[] = membersArray.map((m: any) => m.user || m).filter(Boolean);
      setAssignMembers(users);
    } catch (e: any) {
      setAssignError(e?.response?.data?.message || 'Không thể tải danh sách thành viên');
    } finally {
      setAssignLoading(false);
    }
  };

  const closeAssignDialog = () => {
    setAssignOpen(false);
    setAssignError(null);
    setAssignMembers([]);
    setAssignAssigneeId("");
    setAssignDefect(null);
  };

  const submitAssign = async () => {
    if (!assignDefect?._id || !assignAssigneeId) return;
    try {
      setAssignLoading(true);
      setAssignError(null);
      await axiosInstance.put(`/api/defects/${assignDefect._id}`, { assignee_id: assignAssigneeId, deadline: assignDeadline || undefined });
      const assignedUser = assignMembers.find(u => u._id === assignAssigneeId) || null;
      setAllDefects(prev => prev.map(d => d._id === assignDefect._id ? { ...d, assignee_id: assignedUser as any, deadline: assignDeadline ? new Date(assignDeadline).toISOString() : d.deadline } : d));
      closeAssignDialog();
    } catch (e: any) {
      setAssignError(e?.response?.data?.message || 'Phân công thất bại');
    } finally {
      setAssignLoading(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setSeverity("all");
    setPage(1);
  };

  const statusColor = (s?: string) => {
    switch (s) {
      case "Open":
        return "error";
      case "In Progress":
        return "warning";
      case "Resolved":
        return "info";
      case "Closed":
        return "success";
      default:
        return "default";
    }
  };

  const severityColor = (s?: string) => {
    switch (s) {
      case "Critical":
        return "error";
      case "High":
        return "warning";
      case "Medium":
        return "info";
      case "Low":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <ResponsiveSidebar />
      <main className="p-4 md:p-6 md:ml-64">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-6 md:mb-8 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-[10px] md:text-xs uppercase tracking-wider text-foreground/60">Chất lượng</div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">Defects</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="contained"
                size="medium"
                onClick={() => router.push(`/projects/${projectId}/defect/new`)}
              >
                + Thêm Defect
              </Button>
              <Button variant="outlined" size="medium" onClick={() => setShowFilters((v) => !v)} startIcon={<FilterListIcon />} endIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}>Bộ lọc</Button>
            </div>
          </div>

          {/* Filters */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                  <TextField
                    fullWidth
                    placeholder="Tìm kiếm defect..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                      endAdornment: search && (
                        <InputAdornment position="end">
                          <Button size="small" onClick={() => setSearch("")} sx={{ minWidth: 'auto', p: 0.5 }}>
                            <ClearIcon fontSize="small" />
                          </Button>
                        </InputAdornment>
                      ),
                    }}
                    size="small"
                  />

                  <MUISelect size="small" value={status} onChange={(e) => { setStatus(e.target.value as string); setPage(1); }} sx={{ minWidth: 180 }}>
                    <MenuItem value="all">Tất cả trạng thái</MenuItem>
                    <MenuItem value="Open">Open</MenuItem>
                    <MenuItem value="In Progress">In Progress</MenuItem>
                    <MenuItem value="Resolved">Resolved</MenuItem>
                    <MenuItem value="Closed">Closed</MenuItem>
                  </MUISelect>

                  <MUISelect size="small" value={severity} onChange={(e) => { setSeverity(e.target.value as string); setPage(1); }} sx={{ minWidth: 180 }}>
                    <MenuItem value="all">Tất cả mức độ</MenuItem>
                    <MenuItem value="Critical">Critical</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="Low">Low</MenuItem>
                  </MUISelect>

                  <MUISelect size="small" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} sx={{ minWidth: 120, ml: 'auto' }}>
                    <MenuItem value={10}>10 / trang</MenuItem>
                    <MenuItem value={20}>20 / trang</MenuItem>
                    <MenuItem value={50}>50 / trang</MenuItem>
                  </MUISelect>
                </Stack>

                <Collapse in={showFilters}>
                  <Box sx={{ pt: 2 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                      <Button variant="outlined" size="small" onClick={resetFilters}>Reset</Button>
                    </Stack>
                  </Box>
                </Collapse>
              </Stack>
            </CardContent>
          </Card>

          {/* Content */}
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
          ) : defects.length === 0 ? (
            <Card>
              <CardContent>
                <Box textAlign="center" py={6}>
                  <ErrorOutlineIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Không có defect nào
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Hãy thay đổi bộ lọc hoặc kiểm tra lại sau.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Tiêu đề</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">Trạng thái</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">Mức độ</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Function</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Assignee</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Hạn chót</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {defects.map((d) => (
                      <TableRow key={d._id} hover>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{d.code || d._id.slice(-6)}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>{d.title}</Typography>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                            {d.priority && (
                              <Chip size="small" variant="outlined" icon={<PriorityHighIcon fontSize="small" />} label={d.priority} />
                            )}
                           
                          </Stack>
                        </TableCell>
                        <TableCell align="center">
                          <Chip size="small" color={statusColor(d.status) as any} label={d.status || '—'} sx={{ fontWeight: 600 }} />
                        </TableCell>
                        <TableCell align="center">
                          <Chip size="small" color={severityColor(d.severity) as any} label={d.severity || '—'} />
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{d.function?.title || '—'}</TableCell>

                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{d.assignee_id?.full_name || d.assignee_id?.email || '—'}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{d.deadline ? new Date(d.deadline).toLocaleString('vi-VN') : '—'}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Xem chi tiết">
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<VisibilityIcon />}
                              onClick={() => openDefectDetail(d._id, d)}
                            >
                              Xem
                            </Button>
                          </Tooltip>
                          {currentUserRole === 2 && (
                            <Button
                              size="small"
                              variant="outlined"
                              sx={{ ml: 1 }}
                              onClick={() => openAssignDialog(d)}
                            >
                              Phân công
                            </Button>
                          )}
                          {currentUserRole === 1 && (
                            (typeof d.assignee_id === 'object' ? (d.assignee_id as any)?._id : (d.assignee_id as any)) === currentUserId
                          ) && !(
                            d.assigner_id && (typeof d.assigner_id === 'object' ? (d.assigner_id as any)?._id : d.assigner_id) === currentUserId
                          ) && (
                            <Button
                              size="small"
                              variant="outlined"
                              sx={{ ml: 1 }}
                              onClick={() => router.push(`/projects/${projectId}/defect/${d._id}/edit`)}
                            >
                              Sửa
                            </Button>
                          )}
                          {currentUserId && (d.assigner_id && (typeof d.assigner_id === 'object' ? (d.assigner_id as any)._id : d.assigner_id) === currentUserId) && (
                            <>
                              <Button
                                size="small"
                                variant="outlined"
                                sx={{ ml: 1 }}
                                onClick={() => router.push(`/projects/${projectId}/defect/${d._id}/edit`)}
                              >
                                Sửa
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                sx={{ ml: 1 }}
                                onClick={() => deleteDefect(d._id)}
                              >
                                Xóa
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Stack direction={{ xs: 'column', md: 'row' }} alignItems="center" justifyContent="space-between" spacing={2} sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Hiển thị {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} trên tổng {total}
                </Typography>
                <Pagination color="primary" page={page} count={totalPages} onChange={(_, p) => setPage(p)} />
              </Stack>
            </>
          )}

         

          {/* Defect Detail Dialog */}
          <Dialog open={detailOpen} onClose={closeDefectDetail} maxWidth="sm" fullWidth>
            <DialogTitle>Chi tiết Defect</DialogTitle>
            <DialogContent dividers>
              {detailLoading ? (
                <Box display="flex" alignItems="center" justifyContent="center" py={4}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" sx={{ ml: 2 }}>Đang tải...</Typography>
                </Box>
              ) : detailError ? (
                <Typography variant="body2" color="error">{detailError}</Typography>
              ) : selectedDefect ? (
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">ID</Typography>
                    <Typography variant="body2">{selectedDefect.code || selectedDefect._id}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Tiêu đề</Typography>
                    <Typography variant="body1" fontWeight={600}>{selectedDefect.title}</Typography>
                  </Box>
                  <Stack direction="row" spacing={2}>
                    <Chip size="small" label={selectedDefect.status || '—'} color={statusColor(selectedDefect.status) as any} />
                    <Chip size="small" label={selectedDefect.severity || '—'} color={severityColor(selectedDefect.severity) as any} />
                    {selectedDefect.priority && <Chip size="small" variant="outlined" label={selectedDefect.priority} />}
                  </Stack>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Chức năng</Typography>
                    <Typography variant="body2">{selectedDefect.function?.title || '—'}</Typography>
                  </Box>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <Box flex={1}>
                      <Typography variant="caption" color="text.secondary">Người phụ trách</Typography>
                      <Typography variant="body2">{selectedDefect.assignee_id?.full_name || selectedDefect.assignee_id?.email || '—'}</Typography>
                    </Box>
                    <Box flex={1}>
                      <Typography variant="caption" color="text.secondary">Người báo cáo</Typography>
                      <Typography variant="body2">{selectedDefect.assigner_id?.full_name || selectedDefect.assigner_id?.email || '—'}</Typography>
                    </Box>
                  </Stack>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <Box flex={1}>
                      <Typography variant="caption" color="text.secondary">Hạn chót</Typography>
                      <Typography variant="body2">{selectedDefect.deadline ? new Date(selectedDefect.deadline).toLocaleString('vi-VN') : '—'}</Typography>
                    </Box>
                    <Box flex={1}>
                      <Typography variant="caption" color="text.secondary">Tạo lúc</Typography>
                      <Typography variant="body2">{selectedDefect.createAt ? new Date(selectedDefect.createAt).toLocaleString('vi-VN') : '—'}</Typography>
                    </Box>
                    <Box flex={1}>
                      <Typography variant="caption" color="text.secondary">Cập nhật</Typography>
                      <Typography variant="body2">{selectedDefect.updateAt ? new Date(selectedDefect.updateAt).toLocaleString('vi-VN') : '—'}</Typography>
                    </Box>
                  </Stack>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">Không có dữ liệu</Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDefectDetail}>Đóng</Button>
            </DialogActions>
          </Dialog>

          {/* Assign Dialog */}
          <Dialog open={assignOpen} onClose={closeAssignDialog} maxWidth="sm" fullWidth>
            <DialogTitle>Phân công Defect</DialogTitle>
            <DialogContent dividers>
              {assignError ? (
                <Typography variant="body2" color="error" sx={{ mb: 2 }}>{assignError}</Typography>
              ) : null}
              {assignLoading ? (
                <Box display="flex" alignItems="center" justifyContent="center" py={4}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" sx={{ ml: 2 }}>Đang tải...</Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  <Typography variant="body2">Chọn người được giao</Typography>
                  <MUISelect
                    size="small"
                    value={assignAssigneeId}
                    onChange={(e) => setAssignAssigneeId(e.target.value as string)}
                  >
                    <MenuItem value="">— Chọn —</MenuItem>
                    {assignMembers.map((m) => (
                      <MenuItem key={m._id} value={m._id}>{m.full_name || m.email || m._id}</MenuItem>
                    ))}
                  </MUISelect>
                  <Typography variant="body2">Hạn chót</Typography>
                  <input
                    type="datetime-local"
                    value={assignDeadline}
                    onChange={(e) => setAssignDeadline(e.target.value)}
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                  />
                </Stack>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={closeAssignDialog}>Hủy</Button>
              <Button onClick={submitAssign} disabled={!assignAssigneeId || assignLoading} variant="contained">Lưu</Button>
            </DialogActions>
          </Dialog>
        </div>
      </main>
    </div>
  );
}

