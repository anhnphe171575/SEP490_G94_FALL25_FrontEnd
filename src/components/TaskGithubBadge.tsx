"use client";

import { useState, useEffect } from "react";
import { Box, Chip, Stack, Tooltip } from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import CommitIcon from "@mui/icons-material/Commit";
import MergeTypeIcon from "@mui/icons-material/MergeType";
import CallSplitIcon from "@mui/icons-material/CallSplit";
import axiosInstance from "../../ultis/axios";

interface TaskGithubBadgeProps {
  taskId: string;
  compact?: boolean; // If true, show only total count
}

interface GithubSummary {
  total: number;
  commits: number;
  pull_requests: number;
  branches: number;
}

/**
 * Small badge component to show GitHub activity for a task
 * Can be used in task cards, lists, etc.
 * 
 * Usage:
 * <TaskGithubBadge taskId={task._id} />
 * <TaskGithubBadge taskId={task._id} compact />
 */
export default function TaskGithubBadge({ taskId, compact = false }: TaskGithubBadgeProps) {
  const [summary, setSummary] = useState<GithubSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (taskId) {
      loadSummary();
    }
  }, [taskId]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/tasks/${taskId}/github/links`);
      setSummary(response.data.summary || null);
    } catch (error) {
      // Silently fail - not critical
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  // Don't show anything if no GitHub activity
  if (!summary || summary.total === 0 || loading) {
    return null;
  }

  // Compact mode - show only total with GitHub icon
  if (compact) {
    return (
      <Tooltip 
        title={
          <Box sx={{ p: 0.5 }}>
            <div>Commits: {summary.commits}</div>
            <div>PRs: {summary.pull_requests}</div>
            <div>Branches: {summary.branches}</div>
          </Box>
        }
      >
        <Chip
          icon={<GitHubIcon />}
          label={summary.total}
          size="small"
          sx={{
            height: 22,
            fontSize: '11px',
            fontWeight: 600,
            bgcolor: '#f6f8fa',
            color: '#24292f',
            border: '1px solid #d0d7de',
            '&:hover': {
              bgcolor: '#ffffff',
              borderColor: '#0969da'
            }
          }}
        />
      </Tooltip>
    );
  }

  // Full mode - show breakdown
  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Tooltip title="GitHub Activity">
        <GitHubIcon sx={{ fontSize: 14, color: '#24292f' }} />
      </Tooltip>
      
      {summary.commits > 0 && (
        <Tooltip title={`${summary.commits} commit${summary.commits > 1 ? 's' : ''}`}>
          <Chip
            icon={<CommitIcon sx={{ fontSize: 12 }} />}
            label={summary.commits}
            size="small"
            sx={{
              height: 20,
              fontSize: '10px',
              fontWeight: 600,
              bgcolor: '#ddf4ff',
              color: '#0969da',
              '& .MuiChip-icon': { ml: 0.5 }
            }}
          />
        </Tooltip>
      )}
      
      {summary.pull_requests > 0 && (
        <Tooltip title={`${summary.pull_requests} pull request${summary.pull_requests > 1 ? 's' : ''}`}>
          <Chip
            icon={<MergeTypeIcon sx={{ fontSize: 12 }} />}
            label={summary.pull_requests}
            size="small"
            sx={{
              height: 20,
              fontSize: '10px',
              fontWeight: 600,
              bgcolor: '#dafbe1',
              color: '#1a7f37',
              '& .MuiChip-icon': { ml: 0.5 }
            }}
          />
        </Tooltip>
      )}
      
      {summary.branches > 0 && (
        <Tooltip title={`${summary.branches} branch${summary.branches > 1 ? 'es' : ''}`}>
          <Chip
            icon={<CallSplitIcon sx={{ fontSize: 12 }} />}
            label={summary.branches}
            size="small"
            sx={{
              height: 20,
              fontSize: '10px',
              fontWeight: 600,
              bgcolor: '#fff8c5',
              color: '#9a6700',
              '& .MuiChip-icon': { ml: 0.5 }
            }}
          />
        </Tooltip>
      )}
    </Stack>
  );
}

