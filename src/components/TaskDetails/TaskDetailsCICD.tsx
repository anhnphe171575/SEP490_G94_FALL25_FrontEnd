"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Stack,
  Chip,
  IconButton,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  LinearProgress,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CancelIcon from "@mui/icons-material/Cancel";
import ReplayIcon from "@mui/icons-material/Replay";
import DownloadIcon from "@mui/icons-material/Download";
import SettingsIcon from "@mui/icons-material/Settings";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import axiosInstance from "../../../ultis/axios";

interface TaskDetailsCICDProps {
  taskId: string | null;
  projectId?: string;
}

interface WorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  head_branch: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  workflow_id: number;
  run_number: number;
}

interface Repository {
  _id: string;
  repo_full_name: string;
  repo_owner: string;
  repo_name: string;
}

export default function TaskDetailsCICD({ taskId, projectId }: TaskDetailsCICDProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRun[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadRepositories();
    }
  }, [projectId]);

  useEffect(() => {
    if (selectedRepo) {
      loadWorkflowRuns();
    }
  }, [selectedRepo]);

  const loadRepositories = async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/projects/${projectId}/github/repositories`);
      const repos = response.data || [];
      setRepositories(repos);
      
      if (repos.length > 0) {
        setSelectedRepo(repos[0]._id);
      }
    } catch (error: any) {
      console.error("Error loading repositories:", error);
      setError(error?.response?.data?.message || "Failed to load repositories");
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflowRuns = async () => {
    if (!projectId || !selectedRepo) return;
    
    try {
      setRefreshing(true);
      const response = await axiosInstance.get(
        `/api/projects/${projectId}/github/${selectedRepo}/workflow-runs?per_page=10`
      );
      setWorkflowRuns(response.data.workflow_runs || []);
    } catch (error: any) {
      console.error("Error loading workflow runs:", error);
      setError(error?.response?.data?.message || "Failed to load workflow runs");
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusIcon = (status: string, conclusion: string | null) => {
    if (status === "completed") {
      if (conclusion === "success") {
        return <CheckCircleIcon sx={{ fontSize: 20, color: "#00875a" }} />;
      } else if (conclusion === "failure") {
        return <ErrorIcon sx={{ fontSize: 20, color: "#de350b" }} />;
      } else if (conclusion === "cancelled") {
        return <CancelIcon sx={{ fontSize: 20, color: "#6b778c" }} />;
      }
    } else if (status === "in_progress" || status === "queued") {
      return <HourglassEmptyIcon sx={{ fontSize: 20, color: "#0052cc" }} />;
    }
    return <SettingsIcon sx={{ fontSize: 20, color: "#6b778c" }} />;
  };

  const getStatusColor = (status: string, conclusion: string | null) => {
    if (status === "completed") {
      if (conclusion === "success") return { bg: "#e3fcef", color: "#00875a" };
      if (conclusion === "failure") return { bg: "#ffebe6", color: "#de350b" };
      if (conclusion === "cancelled") return { bg: "#dfe1e6", color: "#6b778c" };
    }
    return { bg: "#deebff", color: "#0052cc" };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  const rerunWorkflow = async (runId: number) => {
    if (!projectId || !selectedRepo) return;
    
    try {
      await axiosInstance.post(
        `/api/projects/${projectId}/github/${selectedRepo}/workflow-runs/${runId}/rerun`
      );
      alert("✅ Workflow rerun triggered!");
      setTimeout(() => loadWorkflowRuns(), 2000);
    } catch (error: any) {
      alert(`❌ Error: ${error?.response?.data?.message || "Failed to rerun workflow"}`);
    }
  };

  const cancelWorkflow = async (runId: number) => {
    if (!projectId || !selectedRepo) return;
    
    if (!confirm("Cancel this workflow run?")) return;
    
    try {
      await axiosInstance.post(
        `/api/projects/${projectId}/github/${selectedRepo}/workflow-runs/${runId}/cancel`
      );
      alert("✅ Workflow cancelled!");
      loadWorkflowRuns();
    } catch (error: any) {
      alert(`❌ Error: ${error?.response?.data?.message || "Failed to cancel workflow"}`);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress size={24} />
        <Typography sx={{ mt: 2 }}>Loading CI/CD...</Typography>
      </Box>
    );
  }

  if (repositories.length === 0) {
    return (
      <Box sx={{ p: 6, textAlign: "center", bgcolor: "#f4f5f7" }}>
        <Typography fontSize="14px" color="#6b778c">
          No GitHub repository connected. Connect a repository to see CI/CD workflows.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "#ffffff" }}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ 
        p: 2,
        bgcolor: "#f4f5f7",
        borderBottom: "2px solid #dfe1e6",
      }}>
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <SettingsIcon sx={{ fontSize: 20, color: "#42526e" }} />
            <Typography fontSize="14px" fontWeight={600} color="#172b4d">
              CI/CD Workflows
            </Typography>
            <Chip 
              label={`${workflowRuns.length} runs`}
              size="small"
              sx={{ 
                bgcolor: "#ffffff",
                fontWeight: 500,
                fontSize: "11px",
                height: 20
              }}
            />
          </Stack>
          
          <IconButton size="small" onClick={loadWorkflowRuns} disabled={refreshing} sx={{ bgcolor: "#ffffff" }}>
            <RefreshIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
      </Box>

      {/* Workflow Runs List */}
      {refreshing ? (
        <LinearProgress />
      ) : workflowRuns.length === 0 ? (
        <Box sx={{ p: 6, textAlign: "center" }}>
          <Typography fontSize="14px" color="#6b778c">
            No workflow runs found
          </Typography>
        </Box>
      ) : (
        <Box sx={{ bgcolor: "#ffffff" }}>
          {workflowRuns.map((run, index) => {
            const statusColors = getStatusColor(run.status, run.conclusion);
            
            return (
              <Box
                key={run.id}
                sx={{
                  p: 2,
                  borderBottom: index < workflowRuns.length - 1 ? "1px solid #dfe1e6" : "none",
                  "&:hover": { bgcolor: "#f4f5f7" },
                  transition: "background-color 0.2s"
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  {/* Status Icon */}
                  {getStatusIcon(run.status, run.conclusion)}

                  {/* Workflow Info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography 
                        fontSize="14px" 
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
                      <Chip 
                        label={`#${run.run_number}`}
                        size="small"
                        sx={{ 
                          height: 18,
                          fontSize: "10px",
                          fontWeight: 600,
                          fontFamily: "monospace"
                        }}
                      />
                    </Stack>
                    
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Chip 
                        label={run.status === "completed" ? (run.conclusion || "completed") : run.status}
                        size="small"
                        sx={{ 
                          height: 18,
                          fontSize: "10px",
                          fontWeight: 700,
                          bgcolor: statusColors.bg,
                          color: statusColors.color,
                          textTransform: "uppercase"
                        }}
                      />
                      
                      <Typography fontSize="11px" color="#6b778c" fontFamily="monospace">
                        {run.head_branch}
                      </Typography>
                      
                      <Typography fontSize="11px" color="#6b778c">
                        · {formatDate(run.updated_at)}
                      </Typography>
                    </Stack>
                  </Box>

                  {/* Actions */}
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="View on GitHub">
                      <IconButton 
                        size="small"
                        component="a"
                        href={run.html_url}
                        target="_blank"
                        sx={{ color: "#42526e" }}
                      >
                        <OpenInNewIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                    
                    {run.status === "completed" && (
                      <Tooltip title="Re-run">
                        <IconButton 
                          size="small"
                          onClick={() => rerunWorkflow(run.id)}
                          sx={{ color: "#42526e", "&:hover": { color: "#0052cc" } }}
                        >
                          <ReplayIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    {(run.status === "in_progress" || run.status === "queued") && (
                      <Tooltip title="Cancel">
                        <IconButton 
                          size="small"
                          onClick={() => cancelWorkflow(run.id)}
                          sx={{ color: "#42526e", "&:hover": { color: "#de350b" } }}
                        >
                          <CancelIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </Stack>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

