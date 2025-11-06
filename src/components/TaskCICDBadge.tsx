"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Chip,
  Stack,
  Tooltip,
  CircularProgress,
  IconButton,
  Popover,
  Typography,
  Divider,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import SettingsIcon from "@mui/icons-material/Settings";
import RefreshIcon from "@mui/icons-material/Refresh";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import axiosInstance from "../../ultis/axios";

interface TaskCICDBadgeProps {
  taskId: string;
  projectId: string;
}

interface WorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  html_url: string;
  updated_at: string;
}

export default function TaskCICDBadge({ taskId, projectId }: TaskCICDBadgeProps) {
  const [loading, setLoading] = useState(false);
  const [latestRun, setLatestRun] = useState<WorkflowRun | null>(null);
  const [allRuns, setAllRuns] = useState<WorkflowRun[]>([]);
  const [repositories, setRepositories] = useState<any[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    loadData();
  }, [taskId, projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get repositories
      const reposResponse = await axiosInstance.get(`/api/projects/${projectId}/github/repositories`);
      const repos = reposResponse.data || [];
      setRepositories(repos);
      
      if (repos.length === 0) {
        setLoading(false);
        return;
      }
      
      // Get workflow runs from first repo
      const repoId = repos[0]._id;
      const runsResponse = await axiosInstance.get(
        `/api/projects/${projectId}/github/${repoId}/workflow-runs?per_page=5`
      );
      
      const runs = runsResponse.data.workflow_runs || [];
      setAllRuns(runs);
      
      if (runs.length > 0) {
        setLatestRun(runs[0]);
      }
    } catch (error) {
      console.error("Error loading CI/CD data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getStatusIcon = (status: string, conclusion: string | null) => {
    if (status === "completed") {
      if (conclusion === "success") {
        return <CheckCircleIcon sx={{ fontSize: 14, color: "#00875a" }} />;
      } else if (conclusion === "failure") {
        return <ErrorIcon sx={{ fontSize: 14, color: "#de350b" }} />;
      }
    } else if (status === "in_progress" || status === "queued") {
      return <HourglassEmptyIcon sx={{ fontSize: 14, color: "#0052cc" }} />;
    }
    return <SettingsIcon sx={{ fontSize: 14, color: "#6b778c" }} />;
  };

  const getStatusColor = (status: string, conclusion: string | null) => {
    if (status === "completed") {
      if (conclusion === "success") return { bg: "#e3fcef", color: "#00875a" };
      if (conclusion === "failure") return { bg: "#ffebe6", color: "#de350b" };
    }
    if (status === "in_progress" || status === "queued") {
      return { bg: "#deebff", color: "#0052cc" };
    }
    return { bg: "#dfe1e6", color: "#6b778c" };
  };

  const getStatusText = (status: string, conclusion: string | null) => {
    if (status === "completed") {
      if (conclusion === "success") return "✓";
      if (conclusion === "failure") return "✗";
      return "·";
    }
    if (status === "in_progress") return "⏳";
    if (status === "queued") return "⋯";
    return "·";
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return "now";
  };

  if (loading) {
    return (
      <CircularProgress size={14} thickness={6} sx={{ color: "#6b778c" }} />
    );
  }

  if (!latestRun || repositories.length === 0) {
    return null; // Don't show badge if no CI/CD
  }

  const colors = getStatusColor(latestRun.status, latestRun.conclusion);
  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title="CI/CD Status - Click for details">
        <Chip
          icon={getStatusIcon(latestRun.status, latestRun.conclusion)}
          label={getStatusText(latestRun.status, latestRun.conclusion)}
          size="small"
          onClick={handleClick}
          sx={{
            height: 20,
            fontSize: "11px",
            fontWeight: 700,
            bgcolor: colors.bg,
            color: colors.color,
            cursor: "pointer",
            "& .MuiChip-icon": {
              ml: "4px",
              mr: "-4px"
            },
            "&:hover": {
              opacity: 0.8
            }
          }}
        />
      </Tooltip>

      {/* Popover with details */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        sx={{
          mt: 1
        }}
      >
        <Box sx={{ p: 2, minWidth: 280, maxWidth: 400 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
            <Typography fontSize="13px" fontWeight={600} color="#172b4d">
              CI/CD Workflow Runs
            </Typography>
            <IconButton size="small" onClick={loadData} sx={{ ml: 1 }}>
              <RefreshIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Stack>

          <Divider sx={{ mb: 1.5 }} />

          {allRuns.length === 0 ? (
            <Typography fontSize="12px" color="#6b778c">
              No recent runs
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {allRuns.slice(0, 3).map((run) => {
                const runColors = getStatusColor(run.status, run.conclusion);
                
                return (
                  <Box
                    key={run.id}
                    sx={{
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: "#f4f5f7",
                      "&:hover": { bgcolor: "#e8e9eb" },
                      transition: "background-color 0.2s"
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      {getStatusIcon(run.status, run.conclusion)}
                      
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography 
                          fontSize="12px" 
                          fontWeight={500}
                          color="#172b4d"
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {run.name}
                        </Typography>
                        
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                          <Chip
                            label={run.status === "completed" ? (run.conclusion || "done") : run.status}
                            size="small"
                            sx={{
                              height: 16,
                              fontSize: "9px",
                              fontWeight: 700,
                              bgcolor: runColors.bg,
                              color: runColors.color,
                              textTransform: "uppercase"
                            }}
                          />
                          <Typography fontSize="10px" color="#6b778c">
                            {formatTime(run.updated_at)} ago
                          </Typography>
                        </Stack>
                      </Box>

                      <IconButton
                        size="small"
                        component="a"
                        href={run.html_url}
                        target="_blank"
                        sx={{ p: 0.5 }}
                      >
                        <OpenInNewIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}

          {allRuns.length > 3 && (
            <Typography 
              fontSize="11px" 
              color="#6b778c" 
              textAlign="center"
              sx={{ mt: 1.5 }}
            >
              +{allRuns.length - 3} more runs
            </Typography>
          )}
        </Box>
      </Popover>
    </>
  );
}

