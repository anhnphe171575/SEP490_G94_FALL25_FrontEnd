"use client";

import Link from "next/link";
import { Box, Button, Card, CardContent, Chip, Container, Typography } from "@mui/material";

export default function Home() {
  return (
    <Container maxWidth="lg" sx={{ minHeight: "100vh", display: "flex", alignItems: "center", py: 6 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 4, alignItems: "center", width: "100%" }}>
        <Box>
          <Chip color="primary" label="SEP Workspace" variant="outlined" sx={{ borderRadius: 999 }} />
          <Typography variant="h2" component="h1" sx={{ mt: 2, letterSpacing: -0.5 }}>
            Quản lý dự án hiện đại, trực quan và nhanh chóng
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mt: 1.5 }}>
            Theo dõi milestone, tiến độ theo Gantt, cập nhật hoạt động và cộng tác cùng đội ngũ trong một giao diện gọn gàng.
          </Typography>
          <Box sx={{ mt: 3, display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            <Button LinkComponent={Link} href="/dashboard" size="large">
              Vào bảng điều khiển
            </Button>
            <Button LinkComponent={Link} href="/projects" size="large" variant="outlined">
              Xem dự án
            </Button>
          </Box>
        </Box>
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Preview
              </Typography>
              <Box sx={{ aspectRatio: "16 / 10", width: "100%", borderRadius: 3, border: "1px solid", borderColor: "divider", background: "linear-gradient(120deg, rgba(255,138,61,.15), transparent 40%), linear-gradient(0deg, rgba(0,0,0,.04), transparent 70%)" }} />
              <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1.5 }}>
                <Box sx={{ height: 32, borderRadius: 2, bgcolor: "action.hover" }} />
                <Box sx={{ height: 32, borderRadius: 2, bgcolor: "action.hover" }} />
                <Box sx={{ height: 32, borderRadius: 2, bgcolor: "action.hover" }} />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Container>
  );
}
