"use client";

import { useState, useEffect } from "react";
import {
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import CallSplitIcon from "@mui/icons-material/CallSplit";
import GitHubIcon from "@mui/icons-material/GitHub";
import axiosInstance from "../../ultis/axios";

interface CreateGithubBranchButtonProps {
  taskId: string;
  projectId: string;
  onSuccess?: (branchUrl: string) => void;
  size?: "small" | "medium" | "large";
  variant?: "icon" | "button";
}

interface Repository {
  _id: string;
  repo_full_name: string;
  enabled: boolean;
}

/**
 * Quick action button to create GitHub branch for a task
 * Can be used in task cards, lists, detail view, etc.
 * 
 * Usage:
 * // Icon button (default)
 * <CreateGithubBranchButton taskId={task._id} projectId={projectId} />
 * 
 * // Full button
 * <CreateGithubBranchButton 
 *   taskId={task._id} 
 *   projectId={projectId}
 *   variant="button"
 * />
 */
export default function CreateGithubBranchButton({
  taskId,
  projectId,
  onSuccess,
  size = "small",
  variant = "icon",
}: CreateGithubBranchButtonProps) {
  const [open, setOpen] = useState(false);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadRepositories();
    }
  }, [open]);

  const loadRepositories = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/projects/${projectId}/github/repositories`);
      const repos = (response.data || []).filter((r: Repository) => r.enabled);
      setRepositories(repos);
      
      // Auto-select if only one repo
      if (repos.length === 1) {
        setSelectedRepo(repos[0]._id);
      }
      
      setError(null);
    } catch (error: any) {
      console.error("Error loading repositories:", error);
      if (error?.response?.status !== 404) {
        setError("Failed to load repositories");
      }
    } finally {
      setLoading(false);
    }
  };

  const createBranch = async () => {
    if (!selectedRepo) return;

    try {
      setCreating(true);
      const response = await axiosInstance.post(`/api/tasks/${taskId}/github/create-branch`, {
        repo_id: selectedRepo,
        from_branch: "main",
      });

      // Success
      if (onSuccess) {
        onSuccess(response.data.branch_url);
      }

      setOpen(false);
      setSelectedRepo("");
    } catch (error: any) {
      setError(error?.response?.data?.message || "Failed to create branch");
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    if (!creating) {
      setOpen(false);
      setError(null);
      setSelectedRepo("");
    }
  };

  // Don't render if no project ID
  if (!projectId) {
    return null;
  }

  const buttonContent = variant === "button" ? (
    <Button
      size={size}
      variant="outlined"
      startIcon={<CallSplitIcon />}
      onClick={() => setOpen(true)}
      sx={{
        textTransform: "none",
        borderColor: "#d0d7de",
        color: "#24292f",
        "&:hover": {
          borderColor: "#0969da",
          bgcolor: "#f6f8fa",
        },
      }}
    >
      Create Branch
    </Button>
  ) : (
    <Tooltip title="Create GitHub Branch">
      <IconButton
        size={size}
        onClick={() => setOpen(true)}
        sx={{
          color: "#57606a",
          "&:hover": {
            color: "#0969da",
            bgcolor: "#f6f8fa",
          },
        }}
      >
        <CallSplitIcon fontSize={size} />
      </IconButton>
    </Tooltip>
  );

  return (
    <>
      {buttonContent}

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <CallSplitIcon />
            <Typography fontWeight={700}>Create GitHub Branch</Typography>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ pt: 2 }}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {loading ? (
              <Stack alignItems="center" sx={{ py: 4 }}>
                <CircularProgress size={32} />
                <Typography sx={{ mt: 2 }} fontSize="14px" color="text.secondary">
                  Loading repositories...
                </Typography>
              </Stack>
            ) : repositories.length === 0 ? (
              <Alert severity="warning">
                <Typography fontSize="13px">
                  No GitHub repositories found for this project.
                  <br />
                  Ask your project admin to add a repository first.
                </Typography>
              </Alert>
            ) : (
              <>
                <FormControl fullWidth>
                  <InputLabel>Repository</InputLabel>
                  <Select
                    value={selectedRepo}
                    label="Repository"
                    onChange={(e) => setSelectedRepo(e.target.value)}
                    disabled={creating}
                  >
                    {repositories.map((repo) => (
                      <MenuItem key={repo._id} value={repo._id}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <GitHubIcon sx={{ fontSize: 16 }} />
                          <Typography fontSize="14px">{repo.repo_full_name}</Typography>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Alert severity="info">
                  <Typography fontSize="12px">
                    A new branch will be created from <strong>main</strong> with a name based on this
                    task's title.
                  </Typography>
                </Alert>
              </>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleClose} disabled={creating} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={createBranch}
            disabled={!selectedRepo || creating || repositories.length === 0}
            sx={{
              textTransform: "none",
              bgcolor: "#238636",
              "&:hover": { bgcolor: "#2ea043" },
            }}
          >
            {creating ? <CircularProgress size={20} color="inherit" /> : "Create Branch"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

