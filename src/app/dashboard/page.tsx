"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "../../../ultis/axios";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";
import { Box, Button, Card, CardActions, CardContent, CardHeader, Chip, Container, Grid, Typography } from "@mui/material";

type Project = {
  _id: string;
  title: string;
  code: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? (sessionStorage.getItem('token') || localStorage.getItem('token')) : null;
    if (!token) {
      router.replace('/login');
      return;
    }
    (async () => {
      try {
        // Assuming endpoint exists: /api/projects (adjust if different)
        const res = await axiosInstance.get('/api/projects');
        const list = Array.isArray(res.data) ? res.data : (res.data?.items || []);
        if (!list || list.length === 0) {
          router.replace('/no-project');
          return;
        }
        setProjects(list);
      } catch (e: any) {
        if (e?.response?.status === 404) {
          router.replace('/no-project');
          return;
        }
        setError(e?.response?.data?.message || 'Không thể tải danh sách dự án');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) return <main className="p-6">Đang tải...</main>;
  if (error) return <main className="p-6 text-red-600">{error}</main>;
  if (!projects) return null;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <ResponsiveSidebar />
      <main className="p-4 md:p-6 md:ml-64">
        <Container maxWidth="lg">
          <Box sx={{ mb: { xs: 3, md: 4 }, display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2, alignItems: { md: "center" }, justifyContent: { md: "space-between" } }}>
            <Box>
              <Typography variant="h4" sx={{ color: "primary.main", fontWeight: 700 }}>Dự án</Typography>
              <Typography variant="body2" color="text.secondary">Quản lý và truy cập nhanh các dự án của bạn</Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button variant="outlined">Lọc</Button>
              <Button onClick={() => router.push('/projects/new')}>+ Tạo dự án</Button>
            </Box>
          </Box>
          <Grid container spacing={2}>
            {projects.map((p) => (
              <Grid item xs={12} sm={6} xl={4} key={p._id}>
                <Card variant="outlined" sx={{ borderRadius: 3, transition: 'box-shadow .2s', '&:hover': { boxShadow: 2 } }}>
                  <CardHeader
                    title={<Typography variant="h6" fontWeight={700}>{p.title}</Typography>}
                    subheader={<Typography variant="caption" color="text.secondary">Mã: {p.code}</Typography>}
                    action={<Chip label="📁" variant="outlined" />}
                  />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">Theo dõi tiến độ, quản lý milestone và tài liệu.</Typography>
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Button size="small" variant="outlined" onClick={() => router.push(`/projects/${p._id}`)}>Mở</Button>
                    <Button size="small" variant="text" onClick={() => router.push(`/projects/${p._id}`)}>Chi tiết</Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </main>
    </div>
  );
}


