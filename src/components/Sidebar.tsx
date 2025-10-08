"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Avatar,
  Box,
  Button,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";

const navItems = [
  { href: "/dashboard", label: "Bảng điều khiển", icon: DashboardRoundedIcon },
  { href: "/projects", label: "Dự án", icon: FolderRoundedIcon },
  { href: "/myprofile", label: "Hồ sơ", icon: PersonRoundedIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const onLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('token');
      localStorage.removeItem('token');
    }
    router.replace('/login');
  };

  return (
    <Paper
      component="aside"
      elevation={0}
      square
      sx={{
        width: 260,
        height: "100%",
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        borderRight: `1px solid #ffffff`,
        bgcolor: "common.white",
      }}
    >
      <Box px={2} py={2.5} display="flex" alignItems="center" gap={1.5}>
        <Avatar
          variant="rounded"
          sx={{ width: 32, height: 32, bgcolor: "common.white", color: "primary.main", fontWeight: 700 }}
        >
          S
        </Avatar>
        <Typography fontWeight={600} color="primary.main">
          SEP Workspace
        </Typography>
      </Box>

      <Box component="nav" sx={{ flex: 1, px: 1.5, py: 1 }}>
        <Typography variant="caption" sx={{ px: 1, py: 1.25, display: "block", color: "text.secondary" }}>
          Điều hướng
        </Typography>
        <List disablePadding>
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <ListItemButton
                key={item.href}
                component={Link}
                href={item.href}
                selected={active}
                sx={{
                  mb: 0.5,
                  borderRadius: 1.5,
                  bgcolor: "common.white",
                  "&:hover": { bgcolor: "common.white" },
                  "&.Mui-selected": { bgcolor: "common.white" },
                  "&.Mui-selected:hover": { bgcolor: "common.white" },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: active ? "primary.main" : "text.secondary" }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ noWrap: true }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      <Divider sx={{ borderColor: "#ffffff" }} />
      <Box p={1.5}>
        <Button
          onClick={onLogout}
          variant="text"
          color="inherit"
          fullWidth
          startIcon={<LogoutRoundedIcon />}
          sx={{ bgcolor: "common.white", "&:hover": { bgcolor: "common.white" } }}
        >
          Đăng xuất
        </Button>
      </Box>
    </Paper>
  );
}


