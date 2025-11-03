"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "../../../../../../ultis/axios";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Stack,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from "@mui/material";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import {
  Description as DocumentIcon,
  Folder as FolderIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  ArrowBack as ArrowBackIcon
} from "@mui/icons-material";

type DashboardData = {
  summary: {
    total_documents: number;
    total_folders?: number;
    total_contributors?: number;
    total_types?: number;
    by_type: Record<string, number>;
    by_version: Record<string, number>;
    by_folder: Record<string, number>;
    by_type_array?: Array<{ type: string; count: number }>;
    by_version_array?: Array<{ version: string; count: number }>;
    top_uploaders: Array<{
      user_id: string;
      user_name: string;
      count: number;
    }>;
  };
  upload_trend: Array<{
    date: string;
    count: number;
  }>;
  recent_uploads: Array<{
    _id: string;
    title: string;
    version: string;
    type: string;
    createdAt: string;
    created_by?: { full_name: string; email: string };
    folder_id?: { name?: string } | null;
  }>;
  charts?: {
    by_type?: { labels: string[]; data: number[] };
    by_version?: { labels: string[]; data: number[] };
    by_weekday?: { labels: string[]; data: number[] };
    by_hour?: { labels: string[]; data: number[] };
  };
  contributors_all?: Array<{
    user_id: string;
    user_name: string;
    user_email?: string;
    count: number;
  }>;
};

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF6B9D"
];

const TYPE_LABELS: Record<string, string> = {
  requirement: "Yêu cầu",
  design: "Thiết kế",
  documentation: "Tài liệu",
  code: "Mã nguồn",
  presentation: "Thuyết trình",
  report: "Báo cáo"
};

export default function DocumentDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axiosInstance.get(`/api/documents/dashboard/${projectId}`, {
          params: { days: 30 }
        });
        setDashboardData(response.data);
      } catch (err) {
        console.error("Error fetching dashboard:", err);
        setError("Không thể tải dữ liệu dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black">
        <ResponsiveSidebar />
        <main className="p-4 md:p-6 md:ml-64">
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        </main>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-white text-black">
        <ResponsiveSidebar />
        <main className="p-4 md:p-6 md:ml-64">
          <Alert severity="error">{error || "Không có dữ liệu"}</Alert>
        </main>
      </div>
    );
  }

  // Prepare chart data (ưu tiên charts từ backend nếu có)
  const typeChartData = dashboardData.charts?.by_type
    ? dashboardData.charts.by_type.labels.map((label, idx) => ({
        name: TYPE_LABELS[label] || label,
        value: dashboardData.charts!.by_type!.data[idx] || 0,
        type: label
      }))
    : Object.entries(dashboardData.summary.by_type).map(([type, count]) => ({
        name: TYPE_LABELS[type] || type,
        value: count,
        type: type
      }));

  const versionChartData = dashboardData.charts?.by_version
    ? dashboardData.charts.by_version.labels.map((v, idx) => ({
        version: v,
        count: dashboardData.charts!.by_version!.data[idx] || 0
      }))
    : Object.entries(dashboardData.summary.by_version).map(([version, count]) => ({
        version,
        count
      }));

  const folderChartData = Object.entries(dashboardData.summary.by_folder).map(([folder, count]) => ({
    folder: folder === "no_folder" ? "Không có thư mục" : folder,
    count
  }));

  const topContributors = (dashboardData.contributors_all && dashboardData.contributors_all.length > 0)
    ? dashboardData.contributors_all
    : dashboardData.summary.top_uploaders.map(u => ({
        user_id: u.user_id,
        user_name: u.user_name,
        user_email: undefined,
        count: u.count
      }));

  return (
    <div className="min-h-screen bg-white text-black">
      <ResponsiveSidebar />
      <main className="p-4 md:p-6 md:ml-64">
        <div className="mx-auto w-full max-w-7xl">
          {/* Header */}
          <div className="mb-6 md:mb-8 flex items-end justify-between">
            <div className="space-y-1">
              <div className="text-[10px] md:text-xs uppercase tracking-wider text-black">
                Dashboard
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-black">
                Thống kê tài liệu
              </h1>
            </div>
            <Button
              variant="outlined"
              size="medium"
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push(`/projects/${projectId}/documents`)}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                px: 2
              }}
            >
              Quay lại
            </Button>
          </div>

          {/* Summary Cards */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" },
              gap: 3,
              mb: 4
            }}
          >
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: "#1976d2" }}>
                    <DocumentIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {dashboardData.summary.total_documents}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tổng tài liệu
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: "#2e7d32" }}>
                    <FolderIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {dashboardData.summary.total_folders ?? Object.keys(dashboardData.summary.by_folder).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Thư mục
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: "#ed6c02" }}>
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {dashboardData.summary.total_contributors ?? dashboardData.summary.top_uploaders.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Người đóng góp
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: "#9c27b0" }}>
                    <TrendingUpIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {dashboardData.summary.total_types ?? Object.keys(dashboardData.summary.by_type).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Loại tài liệu
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Box>

          {/* Charts */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Row 1: Type and Version Charts */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 3
              }}
            >
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Tài liệu theo loại
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={typeChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {typeChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Tài liệu theo phiên bản
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={versionChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="version" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Box>

            {/* Upload Trend - Line Chart */}
            <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Xu hướng tải lên (30 ngày gần nhất)
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dashboardData.upload_trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(date) => {
                          const d = new Date(date);
                          return `${d.getDate()}/${d.getMonth() + 1}`;
                        }}
                      />
                      <YAxis />
                      <Tooltip
                        labelFormatter={(date) => new Date(date).toLocaleDateString("vi-VN")}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#8884d8"
                        strokeWidth={2}
                        name="Số tài liệu"
                      />
                    </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Row 2: Folder and Top Uploaders */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 3
              }}
            >
              {folderChartData.length > 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Tài liệu theo thư mục
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={folderChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="folder" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#00C49F" />
                      </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              )}

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top người đóng góp
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell width={80}>STT</TableCell>
                          <TableCell>Họ và Tên</TableCell>
                          <TableCell align="right">Số lần đóng góp</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {topContributors.map((uploader, index) => (
                          <TableRow key={uploader.user_id || index}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Avatar sx={{ width: 28, height: 28, bgcolor: COLORS[index % COLORS.length] }}>
                                  {uploader.user_name?.charAt(0)?.toUpperCase() || '?'}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight={600}>{uploader.user_name}</Typography>
                                  {uploader.user_email && (
                                    <Typography variant="caption" color="text.secondary">{uploader.user_email}</Typography>
                                  )}
                                </Box>
                              </Stack>
                            </TableCell>
                            <TableCell align="right">{uploader.count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
              </CardContent>
            </Card>
            </Box>

            {/* Distribution Charts: By Weekday and By Hour */}
            {(dashboardData.charts?.by_weekday || dashboardData.charts?.by_hour) && (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                  gap: 3
                }}
              >
                {dashboardData.charts?.by_weekday && (
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Phân bố theo thứ trong tuần
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={dashboardData.charts.by_weekday.labels.map((label, idx) => ({
                            label,
                            count: dashboardData.charts!.by_weekday!.data[idx] || 0
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#82CA9D" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
                {dashboardData.charts?.by_hour && (
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Phân bố theo giờ trong ngày
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={dashboardData.charts.by_hour.labels.map((label, idx) => ({
                            label,
                            count: dashboardData.charts!.by_hour!.data[idx] || 0
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#FFBB28" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </Box>
            )}

            {/* Recent Uploads */}
            <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Tài liệu tải lên gần đây
                  </Typography>
                  <Stack spacing={1} sx={{ mt: 2 }}>
                    {dashboardData.recent_uploads.map((doc) => (
                      <Paper key={doc._id} variant="outlined" sx={{ p: 2 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <DocumentIcon color="primary" />
                          <Box flex={1}>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {doc.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {TYPE_LABELS[doc.type] || doc.type} • v{doc.version} •{" "}
                              {doc.created_by?.full_name || "Unknown"} •{" "}
                              {new Date(doc.createdAt).toLocaleDateString("vi-VN")}
                            </Typography>
                          </Box>
                          {doc.folder_id && (doc.folder_id as any)?.name && (
                            <Chip
                              icon={<FolderIcon />}
                              label={(doc.folder_id as any).name}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
          </Box>
        </div>
      </main>
    </div>
  );
}

