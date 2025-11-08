"use client";

import Link from "next/link";
import { Box, Button, Card, CardContent, Chip, Container, Typography } from "@mui/material";
import { keyframes } from "@mui/system";

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  100% { background-position: 100% 50%; }
`;

const shimmerMove = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

const subtlePulse = keyframes`
  0%, 100% { opacity: .9; }
  50% { opacity: 1; }
`;

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
          <Card elevation={0} variant="outlined" sx={{ transition: "transform .25s ease, box-shadow .25s ease", "&:hover": { transform: "translateY(-2px)", boxShadow: 6 } }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Preview
              </Typography>
              <Box sx={{
                width: "100%",
                borderRadius: 3,
                overflow: "hidden",
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                backgroundImage: "linear-gradient(120deg, rgba(255,138,61,.12), rgba(33,150,243,.10))",
                backgroundSize: "200% 200%",
                animation: `${gradientShift} 10s ease-in-out infinite`
              }}>
                {/* Window top bar */}
                <Box sx={{ height: 40, display: "flex", alignItems: "center", gap: 1, px: 1.5, bgcolor: "grey.100", borderBottom: "1px solid", borderColor: "divider" }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "error.light", animation: `${subtlePulse} 3s ease-in-out infinite` }} />
                  <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "warning.light", animation: `${subtlePulse} 3.6s ease-in-out infinite` }} />
                  <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "success.light", animation: `${subtlePulse} 4.2s ease-in-out infinite` }} />
                  <Box sx={{ ml: 2, flex: 1, height: 24, borderRadius: 2, bgcolor: "common.white", border: "1px solid", borderColor: "divider" }} />
                </Box>

                {/* Main area: sidebar + content */}
                <Box sx={{ display: "grid", gridTemplateColumns: "200px 1fr", minHeight: 260 }}>
                  {/* Sidebar */}
                  <Box sx={{ p: 1.5, bgcolor: "grey.50", borderRight: "1px solid", borderColor: "divider", display: "grid", gap: 1 }}>
                    <Box sx={{ height: 32, borderRadius: 1.5, bgcolor: "action.hover" }} />
                    <Box sx={{ height: 32, borderRadius: 1.5, bgcolor: "action.hover" }} />
                    <Box sx={{ height: 32, borderRadius: 1.5, bgcolor: "action.hover" }} />
                    <Box sx={{ mt: 0.5, height: 1, bgcolor: "divider" }} />
                    <Box sx={{ height: 28, borderRadius: 1.5, bgcolor: "action.hover" }} />
                    <Box sx={{ height: 28, borderRadius: 1.5, bgcolor: "action.hover" }} />
                  </Box>

                  {/* Content */}
                  <Box sx={{ p: 1.5, display: "grid", gap: 1.5 }}>
                    {/* KPI cards row */}
                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1.5 }}>
                      <Box sx={{ position: "relative", overflow: "hidden", height: 72, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.default" }}>
                        <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,.5), transparent)", transform: "translateX(-100%)", animation: `${shimmerMove} 2.2s ease-in-out infinite` }} />
                      </Box>
                      <Box sx={{ position: "relative", overflow: "hidden", height: 72, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.default" }}>
                        <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,.5), transparent)", transform: "translateX(-100%)", animation: `${shimmerMove} 2.4s ease-in-out infinite` }} />
                      </Box>
                      <Box sx={{ position: "relative", overflow: "hidden", height: 72, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.default" }}>
                        <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,.5), transparent)", transform: "translateX(-100%)", animation: `${shimmerMove} 2.6s ease-in-out infinite` }} />
                      </Box>
                    </Box>

                    {/* Chart + list grid */}
                    <Box sx={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 1.5 }}>
                      <Box sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", p: 1.5 }}>
                        <Box sx={{
                          height: 160,
                          borderRadius: 1.5,
                          bgcolor: "action.hover",
                          background: "repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(0,0,0,0.04) 10px, rgba(0,0,0,0.04) 11px)",
                          backgroundSize: "200% 100%",
                          animation: `${gradientShift} 12s linear infinite`
                        }} />
                      </Box>
                      <Box sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", p: 1, display: "grid", gap: 1 }}>
                        <Box sx={{ position: "relative", overflow: "hidden", height: 36, borderRadius: 1.5, bgcolor: "action.hover" }}>
                          <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,.6), transparent)", transform: "translateX(-100%)", animation: `${shimmerMove} 2.8s ease-in-out infinite` }} />
                        </Box>
                        <Box sx={{ position: "relative", overflow: "hidden", height: 36, borderRadius: 1.5, bgcolor: "action.hover" }}>
                          <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,.6), transparent)", transform: "translateX(-100%)", animation: `${shimmerMove} 3s ease-in-out infinite` }} />
                        </Box>
                        <Box sx={{ position: "relative", overflow: "hidden", height: 36, borderRadius: 1.5, bgcolor: "action.hover" }}>
                          <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,.6), transparent)", transform: "translateX(-100%)", animation: `${shimmerMove} 3.2s ease-in-out infinite` }} />
                        </Box>
                        <Box sx={{ position: "relative", overflow: "hidden", height: 36, borderRadius: 1.5, bgcolor: "action.hover" }}>
                          <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,.6), transparent)", transform: "translateX(-100%)", animation: `${shimmerMove} 3.4s ease-in-out infinite` }} />
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Container>
  );
}
