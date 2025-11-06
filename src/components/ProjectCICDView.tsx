"use client";

import { useEffect, useMemo, useState, ReactElement } from "react";
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SettingsIcon from "@mui/icons-material/Settings";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ReplayIcon from "@mui/icons-material/Replay";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DownloadIcon from "@mui/icons-material/Download";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import axiosInstance from "../../ultis/axios";

interface ProjectCICDViewProps {
  projectId: string;
}

interface Repository {
  _id: string;
  repo_full_name: string;
  repo_owner: string;
  repo_name: string;
}

interface WorkflowSummary {
  id: number;
  name: string;
  state: string;
  path: string;
  html_url: string;
}

interface WorkflowRun {
  id: number;
  workflow_id: number;
  name: string;
  status: string;
  conclusion: string | null;
  event: string;
  head_branch: string;
  head_sha: string;
  html_url: string;
  run_number: number;
  created_at: string;
  updated_at: string;
  run_started_at?: string;
  run_attempt?: number;
  run_duration_ms?: number;
  actor?: {
    login: string;
    avatar_url?: string;
    html_url?: string;
  };
  triggering_actor?: {
    login: string;
    avatar_url?: string;
    html_url?: string;
  };
  head_commit?: {
    message?: string;
    timestamp?: string;
    author?: {
      name?: string;
      email?: string;
      username?: string;
    };
    committer?: {
      name?: string;
      email?: string;
    };
  };
  pull_requests?: Array<{
    id: number;
    number: number;
    title: string;
    html_url: string;
  }>;
  failure_message?: string;
}

interface WorkflowStepDetail {
  name: string;
  status: string;
  conclusion: string | null;
  number: number;
  started_at?: string;
  completed_at?: string;
}

interface WorkflowJobDetail {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  started_at?: string;
  completed_at?: string;
  steps?: WorkflowStepDetail[];
}

interface WorkflowRunDetails {
  run: WorkflowRun;
  jobs: WorkflowJobDetail[];
}

const STATUS_STYLES: Record<string, { bg: string; color: string; icon: ReactElement }> = {
  success: {
    bg: "#e3fcef",
    color: "#00875a",
    icon: <CheckCircleIcon sx={{ fontSize: 18 }} />,
  },
  failure: {
    bg: "#ffebe6",
    color: "#de350b",
    icon: <ErrorIcon sx={{ fontSize: 18 }} />,
  },
  cancelled: {
    bg: "#dfe1e6",
    color: "#6b778c",
    icon: <CancelIcon sx={{ fontSize: 18 }} />,
  },
  in_progress: {
    bg: "#deebff",
    color: "#0052cc",
    icon: <HourglassEmptyIcon sx={{ fontSize: 18 }} />,
  },
  queued: {
    bg: "#deebff",
    color: "#0052cc",
    icon: <HourglassEmptyIcon sx={{ fontSize: 18 }} />,
  },
  default: {
    bg: "#f4f5f7",
    color: "#42526e",
    icon: <SettingsIcon sx={{ fontSize: 18 }} />,
  },
};

const WORKFLOW_TEMPLATES = {
  production: {
    label: "Production deploy",
    filename: "deploy-production.yml",
    branch: "main",
    description: "Build & deploy production from the main branch",
  },
  staging: {
    label: "Staging deploy",
    filename: "deploy-staging.yml",
    branch: "staging",
    description: "Deploy staging environment on staging branch",
  },
  preview: {
    label: "Preview deploy",
    filename: "deploy-preview.yml",
    branch: "main",
    description: "Create preview environments for pull requests",
  },
  custom: {
    label: "Blank workflow",
    filename: "deployment.yml",
    branch: "main",
    description: "Start from an empty workflow and customise freely",
  },
} as const;

type WorkflowTemplateKey = keyof typeof WORKFLOW_TEMPLATES;

function buildWorkflowContent(template: WorkflowTemplateKey, branch: string) {
  switch (template) {
    case "production":
      return `name: Deploy Production\n\n` +
        `on:\n` +
        `  push:\n` +
        `    branches:\n` +
        `      - ${branch}\n` +
        `  workflow_dispatch:\n\n` +
        `jobs:\n` +
        `  deploy:\n` +
        `    runs-on: ubuntu-latest\n\n` +
        `    steps:\n` +
        `      - name: Checkout repository\n` +
        `        uses: actions/checkout@v4\n\n` +
        `      - name: Setup Node.js\n` +
        `        uses: actions/setup-node@v4\n` +
        `        with:\n` +
        `          node-version: 18\n\n` +
        `      - name: Install dependencies\n` +
        `        run: npm ci\n\n` +
        `      - name: Run tests\n` +
        `        run: npm test -- --watch=false\n\n` +
        `      - name: Build\n` +
        `        run: npm run build\n\n` +
        `      - name: Deploy\n` +
        `        run: |\n` +
        `          echo "Deploying to production"\n` +
        `          # TODO: replace with your production deploy command\n`;
    case "staging":
      return `name: Deploy Staging\n\n` +
        `on:\n` +
        `  push:\n` +
        `    branches:\n` +
        `      - ${branch}\n` +
        `  workflow_dispatch:\n\n` +
        `jobs:\n` +
        `  deploy:\n` +
        `    runs-on: ubuntu-latest\n\n` +
        `    steps:\n` +
        `      - uses: actions/checkout@v4\n\n` +
        `      - uses: actions/setup-node@v4\n` +
        `        with:\n` +
        `          node-version: 18\n\n` +
        `      - run: npm ci\n\n` +
        `      - run: npm test -- --watch=false\n\n` +
        `      - run: npm run build\n\n` +
        `      - name: Deploy to staging\n` +
        `        run: |\n` +
        `          echo "Deploying to staging"\n` +
        `          # TODO: replace with staging deploy command\n`;
    case "preview":
      return `name: Deploy Preview\n\n` +
        `on:\n` +
        `  pull_request:\n` +
        `    types: [opened, synchronize, reopened]\n\n` +
        `jobs:\n` +
        `  preview:\n` +
        `    runs-on: ubuntu-latest\n\n` +
        `    steps:\n` +
        `      - uses: actions/checkout@v4\n\n` +
        `      - uses: actions/setup-node@v4\n` +
        `        with:\n` +
        `          node-version: 18\n\n` +
        `      - run: npm ci\n\n` +
        `      - run: npm run build\n\n` +
        `      - name: Deploy preview\n` +
        `        run: |\n` +
        `          echo "Deploying preview for PR #\${{ github.event.number }}"\n` +
        `          # TODO: replace with preview deploy command (Vercel, Netlify, ...)\n\n` +
        `      - name: Comment preview URL\n` +
        `        uses: marocchino/sticky-pull-request-comment@v2\n` +
        `        with:\n` +
        `          message: |\n` +
        `            ✅ Preview deployed: https://preview.example.com/pr-\${{ github.event.number }}\n`;
    case "custom":
    default:
      return `name: Deployment Workflow\n\n` +
        `on:\n` +
        `  workflow_dispatch:\n\n` +
        `jobs:\n` +
        `  deploy:\n` +
        `    runs-on: ubuntu-latest\n` +
        `    steps:\n` +
        `      - name: Checkout\n` +
        `        uses: actions/checkout@v4\n\n` +
        `      - name: TODO - customise your workflow\n` +
        `        run: echo "Add your CI/CD steps here"\n`;
  }
}

  function formatRelativeTime(dateString: string) { 
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

function formatDateTime(dateString?: string) {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return dateString;
  }
}

function calculateDurationSeconds(start?: string, end?: string) {
  if (!start || !end) return null;
  const startDate = new Date(start).getTime();
  const endDate = new Date(end).getTime();
  if (Number.isNaN(startDate) || Number.isNaN(endDate)) return null;
  const diff = endDate - startDate;
  if (diff < 0) return null;
  return Math.round(diff / 1000);
}

function formatDuration(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined) return "—";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes < 60) {
    return secs ? `${minutes}m ${secs}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const parts: string[] = [];
  parts.push(`${hours}h`);
  if (remainingMinutes) parts.push(`${remainingMinutes}m`);
  if (secs) parts.push(`${secs}s`);
  return parts.join(" ");
}

function getFailureSummary(run: WorkflowRun, details?: WorkflowRunDetails) {
  if (run.conclusion !== "failure") return null;
  if (details?.run?.failure_message) return details.run.failure_message;
  if (run.failure_message) return run.failure_message;
  const failingJob = details?.jobs?.find((job) => job.conclusion === "failure");
  if (!failingJob) return "Workflow failed";
  const failingStep = failingJob.steps?.find((step) => {
    const status = (step.conclusion || step.status || "").toLowerCase();
    return status === "failure" || status === "failed";
  });
  if (failingStep) {
    return `${failingJob.name}: ${failingStep.name}`;
  }
  return `${failingJob.name} failed`;
}

export default function ProjectCICDView({ projectId }: ProjectCICDViewProps) {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("");
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRun[]>([]);

  const [availableBranches, setAvailableBranches] = useState<string[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const [expandedRuns, setExpandedRuns] = useState<number[]>([]);
  const [runDetails, setRunDetails] = useState<Record<number, WorkflowRunDetails>>({});
  const [runDetailsLoading, setRunDetailsLoading] = useState<Record<number, boolean>>({});
  const [runDetailsError, setRunDetailsError] = useState<Record<number, string | null>>({});

  const [loadingRepos, setLoadingRepos] = useState(false);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [loadingWorkflows, setLoadingWorkflows] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [triggerDialogOpen, setTriggerDialogOpen] = useState(false);
  const [triggerWorkflowId, setTriggerWorkflowId] = useState<string>("");
  const [triggerRef, setTriggerRef] = useState<string>("main");
  const [triggerSubmitting, setTriggerSubmitting] = useState(false);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [workflowTemplate, setWorkflowTemplate] = useState<WorkflowTemplateKey>("production");
  const [workflowFilename, setWorkflowFilename] = useState<string>(WORKFLOW_TEMPLATES.production.filename);
  const [workflowBranch, setWorkflowBranch] = useState<string>(WORKFLOW_TEMPLATES.production.branch);
  const [workflowContent, setWorkflowContent] = useState<string>(buildWorkflowContent("production", WORKFLOW_TEMPLATES.production.branch));
  const [workflowCommitMessage, setWorkflowCommitMessage] = useState<string>("Add production workflow via CI/CD view");
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [creatingWorkflow, setCreatingWorkflow] = useState(false);
  const [workflowContentEdited, setWorkflowContentEdited] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    loadRepositories();
  }, [projectId]);

  useEffect(() => {
    if (!selectedRepo) return;
    setSelectedWorkflow("all");
    setBranchFilter("");
    loadBranches();
    loadWorkflows();
    loadWorkflowRuns({ branch: "", workflowId: "all" });
  }, [selectedRepo]);

  useEffect(() => {
    if (!selectedRepo) return;
    loadWorkflowRuns();
  }, [selectedWorkflow]);

  const loadRepositories = async () => {
    try {
      setLoadingRepos(true);
      const response = await axiosInstance.get(`/api/projects/${projectId}/github/repositories`);
      const repos = response.data || [];
      setRepositories(repos);
      if (repos.length > 0) {
        setSelectedRepo(repos[0]._id);
      }
    } catch (err: any) {
      console.error("Error loading repositories:", err);
      setError(err?.response?.data?.message || "Không thể tải danh sách repository");
    } finally {
      setLoadingRepos(false);
    }
  };

  const loadWorkflows = async () => {
    if (!selectedRepo) return;
    try {
      setLoadingWorkflows(true);
      const response = await axiosInstance.get(
        `/api/projects/${projectId}/github/${selectedRepo}/workflows`
      );
      const list: WorkflowSummary[] = response.data?.workflows || [];
      setWorkflows(list);
      if (list.length > 0) {
        setSelectedWorkflow("all");
        setTriggerWorkflowId(String(list[0].id));
      }
    } catch (err: any) {
      console.error("Error loading workflows:", err);
      setError(err?.response?.data?.message || "Không thể tải workflow");
    } finally {
      setLoadingWorkflows(false);
    }
  };

  const loadBranches = async () => {
    if (!selectedRepo) return;
    try {
      setLoadingBranches(true);
      const response = await axiosInstance.get(
        `/api/projects/${projectId}/github/${selectedRepo}/branches`
      );
      const list: Array<{ name: string }> = response.data?.branches || [];
      const names = list
        .map((branch) => branch?.name)
        .filter((name): name is string => Boolean(name));
      setAvailableBranches(names);
    } catch (err: any) {
      console.error("Error loading branches:", err);
    } finally {
      setLoadingBranches(false);
    }
  };

  const loadWorkflowRuns = async (options?: { branch?: string; workflowId?: string }) => {
    if (!selectedRepo) return;
    try {
      setLoadingRuns(true);
      setRunDetails({});
      setRunDetailsError({});
      setRunDetailsLoading({});
      setExpandedRuns([]);

      const branchValue = options?.branch ?? branchFilter;
      const workflowValue = options?.workflowId ?? selectedWorkflow;

      const params: Record<string, string> = { per_page: "25" };
      if (workflowValue !== "all") {
        params.workflow_id = workflowValue;
      }
      if (branchValue.trim()) {
        params.branch = branchValue.trim();
      }

      const response = await axiosInstance.get(
        `/api/projects/${projectId}/github/${selectedRepo}/workflow-runs`,
        { params }
      );
      setWorkflowRuns(response.data?.workflow_runs || []);
    } catch (err: any) {
      console.error("Error loading workflow runs:", err);
      setError(err?.response?.data?.message || "Không thể tải workflow runs");
    } finally {
      setLoadingRuns(false);
    }
  };

  const rerunWorkflow = async (runId: number) => {
    if (!selectedRepo) return;
    try {
      await axiosInstance.post(
        `/api/projects/${projectId}/github/${selectedRepo}/workflow-runs/${runId}/rerun`
      );
      alert("✅ Workflow rerun triggered!");
      setTimeout(() => loadWorkflowRuns(), 2000);
    } catch (err: any) {
      alert(`❌ Error: ${err?.response?.data?.message || "Failed to rerun workflow"}`);
    }
  };

  const cancelWorkflow = async (runId: number) => {
    if (!selectedRepo) return;
    if (!confirm("Cancel this workflow run?")) return;
    try {
      await axiosInstance.post(
        `/api/projects/${projectId}/github/${selectedRepo}/workflow-runs/${runId}/cancel`
      );
      alert("✅ Workflow cancelled!");
      loadWorkflowRuns();
    } catch (err: any) {
      alert(`❌ Error: ${err?.response?.data?.message || "Failed to cancel workflow"}`);
    }
  };

  const downloadLogs = async (runId: number) => {
    if (!selectedRepo) return;
    try {
      const response = await axiosInstance.get(
        `/api/projects/${projectId}/github/${selectedRepo}/workflow-runs/${runId}/logs`
      );
      const downloadUrl = response.data?.download_url;
      if (downloadUrl) {
        window.open(downloadUrl, "_blank");
      }
    } catch (err: any) {
      alert(`❌ Error: ${err?.response?.data?.message || "Failed to fetch logs"}`);
    }
  };

  const resetCreateWorkflowForm = (template: WorkflowTemplateKey) => {
    const meta = WORKFLOW_TEMPLATES[template];
    setWorkflowTemplate(template);
    setWorkflowFilename(meta.filename);
    setWorkflowBranch(meta.branch);
    setWorkflowContent(buildWorkflowContent(template, meta.branch));
    setWorkflowCommitMessage(`Add ${meta.label.toLowerCase()} via CI/CD view`);
    setWorkflowContentEdited(false);
    setOverwriteExisting(false);
    setCreateError(null);
  };

  const openCreateWorkflowDialog = () => {
    const defaultTemplate: WorkflowTemplateKey = availableBranches.includes(WORKFLOW_TEMPLATES.production.branch)
      ? "production"
      : "custom";

    resetCreateWorkflowForm(defaultTemplate);

    if (availableBranches.length > 0) {
      const preferredBranch = defaultTemplate !== "custom"
        ? (availableBranches.includes(WORKFLOW_TEMPLATES[defaultTemplate].branch)
          ? WORKFLOW_TEMPLATES[defaultTemplate].branch
          : availableBranches[0])
        : availableBranches[0];
      handleBranchChange(preferredBranch, defaultTemplate);
    } else if (defaultTemplate === "custom") {
      handleBranchChange(WORKFLOW_TEMPLATES.custom.branch, defaultTemplate);
    }

    setCreateDialogOpen(true);
  };

  const handleTemplateChange = (value: WorkflowTemplateKey) => {
    const meta = WORKFLOW_TEMPLATES[value];
    setWorkflowTemplate(value);

    if (value !== "custom") {
      setWorkflowFilename(meta.filename);
      setWorkflowContentEdited(false);
      setWorkflowCommitMessage(`Add ${meta.label.toLowerCase()} via CI/CD view`);
      handleBranchChange(meta.branch, value);
      setWorkflowContent(buildWorkflowContent(value, meta.branch));
    } else {
      setWorkflowFilename(meta.filename);
      setWorkflowCommitMessage("Add workflow via CI/CD view");
      if (!workflowContentEdited) {
        const branch = workflowBranch || meta.branch;
        handleBranchChange(branch, value);
        setWorkflowContent(buildWorkflowContent("custom", branch));
        setWorkflowContentEdited(false);
      }
    }
  };

  const handleBranchChange = (value: string, templateOverride?: WorkflowTemplateKey) => {
    setWorkflowBranch(value);
    const template = templateOverride ?? workflowTemplate;
    if (template !== "custom" && !workflowContentEdited) {
      setWorkflowContent(buildWorkflowContent(template, value || "main"));
    } else if (template === "custom" && !workflowContentEdited) {
      setWorkflowContent(buildWorkflowContent("custom", value || "main"));
    }
  };

  const submitCreateWorkflow = async () => {
    if (!selectedRepo) {
      setCreateError("Vui lòng chọn repository");
      return;
    }

    if (!workflowFilename.trim()) {
      setCreateError("Tên file workflow không được để trống");
      return;
    }

    if (!workflowContent.trim()) {
      setCreateError("Nội dung workflow không được để trống");
      return;
    }

    try {
      setCreatingWorkflow(true);
      setCreateError(null);
      await axiosInstance.post(
        `/api/projects/${projectId}/github/${selectedRepo}/workflows`,
        {
          filename: workflowFilename.trim(),
          content: workflowContent,
          overwrite: overwriteExisting,
          message: workflowCommitMessage.trim() || "Add workflow via CI/CD view",
        }
      );

      alert(overwriteExisting ? "✅ Workflow updated!" : "✅ Workflow created!");
      setCreateDialogOpen(false);
      await loadWorkflows();
      setRunDetails({});
      setRunDetailsError({});
      setRunDetailsLoading({});
      setExpandedRuns([]);
      setTimeout(() => loadWorkflowRuns(), 1500);
    } catch (err: any) {
      console.error("Error creating workflow:", err);
      setCreateError(err?.response?.data?.message || err?.message || "Không thể tạo workflow");
    } finally {
      setCreatingWorkflow(false);
    }
  };

  const fetchRunDetails = async (runId: number) => {
    if (!selectedRepo || runDetailsLoading[runId]) return;
    try {
      setRunDetailsLoading((prev) => ({ ...prev, [runId]: true }));
      const response = await axiosInstance.get(
        `/api/projects/${projectId}/github/${selectedRepo}/workflow-runs/${runId}`
      );
      const data = response.data || {};
      const runInfo: WorkflowRun = {
        ...(workflowRuns.find((run) => run.id === runId) || ({} as WorkflowRun)),
        ...(data.run || {}),
      };
      const jobs: WorkflowJobDetail[] = Array.isArray(data.jobs) ? data.jobs : [];
      setRunDetails((prev) => ({ ...prev, [runId]: { run: runInfo, jobs } }));
      setRunDetailsError((prev) => ({ ...prev, [runId]: null }));
    } catch (err: any) {
      console.error("Error loading run details:", err);
      setRunDetailsError((prev) => ({
        ...prev,
        [runId]: err?.response?.data?.message || err?.message || "Không thể tải chi tiết run",
      }));
    } finally {
      setRunDetailsLoading((prev) => ({ ...prev, [runId]: false }));
    }
  };

  const toggleRunExpansion = (runId: number) => {
    const isExpanded = expandedRuns.includes(runId);
    if (isExpanded) {
      setExpandedRuns(expandedRuns.filter((id) => id !== runId));
      return;
    }
    setExpandedRuns([...expandedRuns, runId]);
    if (!runDetails[runId]) {
      fetchRunDetails(runId);
    }
  };

  const openTriggerDialog = () => {
    if (workflows.length === 0) return;
    if (!triggerWorkflowId) {
      setTriggerWorkflowId(String(workflows[0].id));
    }
    setTriggerDialogOpen(true);
  };

  const submitTriggerWorkflow = async () => {
    if (!selectedRepo || !triggerWorkflowId) return;
    try {
      setTriggerSubmitting(true);
      await axiosInstance.post(
        `/api/projects/${projectId}/github/${selectedRepo}/workflows/${triggerWorkflowId}/dispatches`,
        { ref: triggerRef || "main" }
      );
      alert("✅ Workflow dispatch triggered!");
      setTriggerDialogOpen(false);
      setTimeout(() => loadWorkflowRuns(), 3000);
    } catch (err: any) {
      alert(`❌ Error: ${err?.response?.data?.message || "Failed to trigger workflow"}`);
    } finally {
      setTriggerSubmitting(false);
    }
  };

  const runStats = useMemo(() => {
    const stats = {
      total: workflowRuns.length,
      success: 0,
      failure: 0,
      cancelled: 0,
      running: 0,
    };

    workflowRuns.forEach((run) => {
      if (run.status === "completed") {
        if (run.conclusion === "success") stats.success += 1;
        else if (run.conclusion === "failure") stats.failure += 1;
        else if (run.conclusion === "cancelled") stats.cancelled += 1;
      } else if (run.status === "in_progress" || run.status === "queued" || run.status === "waiting") {
        stats.running += 1;
      }
    });

    return stats;
  }, [workflowRuns]);

  if (loadingRepos) {
    return (
      <Box sx={{ p: 6, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Đang tải repositories…</Typography>
      </Box>
    );
  }

  if (!loadingRepos && repositories.length === 0) {
    return (
      <Box sx={{ p: 6, textAlign: "center" }}>
        <Typography fontSize="14px" color="#6b778c">
          Chưa có repository GitHub nào được kết nối. Vào tab Development của task để kết nối.
        </Typography>
      </Box>
    );
  }

  const renderStatus = (run: WorkflowRun) => {
    if (run.status === "completed" && run.conclusion) {
      const style = STATUS_STYLES[run.conclusion] || STATUS_STYLES.default;
      return (
        <Chip
          size="small"
          icon={style.icon}
          label={run.conclusion.toUpperCase()}
          sx={{
            bgcolor: style.bg,
            color: style.color,
            fontWeight: 700,
            fontSize: "11px",
            height: 24,
          }}
        />
      );
    }

    const style = STATUS_STYLES[run.status] || STATUS_STYLES.default;
    return (
      <Chip
        size="small"
        icon={style.icon}
        label={run.status.toUpperCase()}
        sx={{
          bgcolor: style.bg,
          color: style.color,
          fontWeight: 700,
          fontSize: "11px",
          height: 24,
        }}
      />
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            CI/CD Overview
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Repository</InputLabel>
            <Select
              label="Repository"
              value={selectedRepo}
              onChange={(event) => setSelectedRepo(event.target.value)}
            >
              {repositories.map((repo) => (
                <MenuItem key={repo._id} value={repo._id}>
                  {repo.repo_owner}/{repo.repo_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={<AddCircleOutlineIcon />}
            onClick={openCreateWorkflowDialog}
            disabled={!selectedRepo}
            sx={{ textTransform: "none" }}
          >
            Create workflow
          </Button>

          <Button
            variant="outlined"
            startIcon={<PlayArrowIcon />}
            disabled={workflows.length === 0}
            onClick={openTriggerDialog}
          >
            Trigger workflow
          </Button>

          <IconButton onClick={loadWorkflowRuns} disabled={loadingRuns}>
            <RefreshIcon />
          </IconButton>
        </Stack>
      </Stack>

      {/* Stats */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">
              Total runs
            </Typography>
            <Typography variant="h4" fontWeight={700}>{runStats.total}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">
              Success
            </Typography>
            <Typography variant="h4" fontWeight={700} color="#00875a">{runStats.success}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">
              Failed
            </Typography>
            <Typography variant="h4" fontWeight={700} color="#de350b">{runStats.failure}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">
              Running / queued
            </Typography>
            <Typography variant="h4" fontWeight={700} color="#0052cc">{runStats.running}</Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
            <FormControl size="small" sx={{ minWidth: 200 }} disabled={loadingWorkflows}>
              <InputLabel>Workflow</InputLabel>
              <Select
                label="Workflow"
                value={selectedWorkflow}
                onChange={(event) => setSelectedWorkflow(event.target.value)}
              >
                <MenuItem value="all">Tất cả workflows</MenuItem>
                {workflows.map((workflow) => (
                  <MenuItem key={workflow.id} value={String(workflow.id)}>
                    {workflow.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Autocomplete
              freeSolo
              options={availableBranches}
              loading={loadingBranches}
              value={branchFilter}
              inputValue={branchFilter}
              onChange={(_event, newValue) => setBranchFilter(newValue ?? "")}
              onInputChange={(_event, newInputValue) => setBranchFilter(newInputValue ?? "")}
              sx={{ width: { xs: "100%", md: 220 } }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  label="Branch"
                  placeholder="All branches"
                />
              )}
            />

            <Button
              variant="outlined"
              onClick={loadWorkflowRuns}
              disabled={loadingRuns}
            >
              Apply filters
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        {loadingRuns && <LinearProgress />}
        <CardContent sx={{ p: 0 }}>
          {workflowRuns.length === 0 && !loadingRuns ? (
            <Box sx={{ p: 6, textAlign: "center" }}>
              <Typography fontSize="14px" color="text.secondary">
                Chưa có workflow run nào khớp với tiêu chí lọc.
              </Typography>
            </Box>
          ) : (
            workflowRuns.map((run, index) => {
              const isExpanded = expandedRuns.includes(run.id);
              const details = runDetails[run.id];
              const detailLoading = runDetailsLoading[run.id];
              const detailError = runDetailsError[run.id];
              const actor = run.triggering_actor || run.actor;
              const commitAuthorName = run.head_commit?.author?.name || run.head_commit?.committer?.name;
              const commitAuthorEmail = run.head_commit?.author?.email || run.head_commit?.committer?.email;
              const commitMessage = run.head_commit?.message;
              const pullRequests = run.pull_requests || [];
              const overallDurationSeconds = calculateDurationSeconds(
                details?.run?.run_started_at || run.run_started_at || run.created_at,
                details?.run?.updated_at || run.updated_at
              );
              const overallDuration = formatDuration(overallDurationSeconds);
              const failureSummary = getFailureSummary(run, details);
              const avatarLetter = (actor?.login || commitAuthorName || "?").charAt(0).toUpperCase();

              return (
                <Box
                  key={run.id}
                  sx={{
                    px: 3,
                    py: 2,
                    borderBottom: index < workflowRuns.length - 1 ? "1px solid #eef0f2" : "none",
                    transition: "background-color 0.2s",
                    "&:hover": {
                      backgroundColor: "#f7f8fa",
                    },
                  }}
                >
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2}
                    alignItems={{ xs: "flex-start", md: "center" }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => toggleRunExpansion(run.id)}
                        sx={{
                          transition: "transform 0.2s ease",
                          transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                        }}
                        aria-label={isExpanded ? "Thu gọn chi tiết run" : "Mở rộng chi tiết run"}
                      >
                        {isExpanded ? (
                          <KeyboardArrowDownIcon fontSize="small" />
                        ) : (
                          <KeyboardArrowRightIcon fontSize="small" />
                        )}
                      </IconButton>

                      {renderStatus(run)}

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{ mb: 0.5, flexWrap: "wrap", rowGap: 0.5 }}
                        >
                          <Typography
                            fontSize="15px"
                            fontWeight={600}
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              color: "#172b4d",
                            }}
                          >
                            {run.name}
                          </Typography>
                          <Chip
                            size="small"
                            label={`#${run.run_number}`}
                            sx={{
                              fontFamily: "monospace",
                              fontSize: "11px",
                              height: 20,
                            }}
                          />
                          <Chip
                            size="small"
                            label={run.event.toUpperCase()}
                            sx={{
                              fontSize: "10px",
                              height: 20,
                              bgcolor: "#f0f5ff",
                              color: "#3451b2",
                              fontWeight: 600,
                            }}
                          />
                          {overallDuration !== "—" && (
                            <Chip
                              size="small"
                              label={overallDuration}
                              sx={{
                                fontSize: "10px",
                                height: 20,
                                bgcolor: "#f3f4f6",
                                color: "#49516f",
                              }}
                            />
                          )}
                        </Stack>

                        {commitMessage && (
                          <Typography fontSize="13px" color="text.secondary" sx={{ mb: 0.5 }}>
                            {commitMessage}
                          </Typography>
                        )}

                        <Typography fontSize="11px" color="text.secondary">
                          {commitAuthorName
                            ? `${commitAuthorName}${commitAuthorEmail ? ` • ${commitAuthorEmail}` : ""}`
                            : actor?.login || "Unknown actor"}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Tooltip title="View on GitHub">
                        <IconButton size="small" component="a" href={run.html_url} target="_blank">
                          <OpenInNewIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Download logs">
                        <IconButton size="small" onClick={() => downloadLogs(run.id)}>
                          <DownloadIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>

                      {run.status === "completed" && (
                        <Tooltip title="Rerun">
                          <IconButton size="small" onClick={() => rerunWorkflow(run.id)}>
                            <ReplayIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      )}

                      {(run.status === "in_progress" || run.status === "queued") && (
                        <Tooltip title="Cancel">
                          <IconButton size="small" onClick={() => cancelWorkflow(run.id)}>
                            <CancelIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </Stack>

                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <Box sx={{ mt: 2, bgcolor: "#f8f9fb", borderRadius: 2, p: 2 }}>
                      {detailLoading ? (
                        <LinearProgress sx={{ mb: 1 }} />
                      ) : detailError ? (
                        <Alert severity="error">{detailError}</Alert>
                      ) : details ? (
                        <Stack spacing={2}>
                          <Stack
                            direction={{ xs: "column", md: "row" }}
                            spacing={2}
                            alignItems={{ xs: "flex-start", md: "center" }}
                          >
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Avatar src={actor?.avatar_url} sx={{ width: 40, height: 40 }}>
                                {avatarLetter}
                              </Avatar>
                              <Box>
                                <Typography fontWeight={600}>
                                  {commitAuthorName || actor?.login || "Unknown actor"}
                                </Typography>
                                {commitAuthorEmail && (
                                  <Typography variant="caption" color="text.secondary">
                                    {commitAuthorEmail}
                                  </Typography>
                                )}
                                <Typography variant="caption" color="text.secondary">
                                  Triggered at {formatDateTime(details.run.run_started_at || run.run_started_at || run.created_at)}
                                </Typography>
                              </Box>
                            </Stack>

                            <Stack spacing={0.5} sx={{ flex: 1 }}>
                              <Typography variant="caption" fontWeight={600} color="text.secondary">
                                Branch
                              </Typography>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Chip
                                  size="small"
                                  label={run.head_branch}
                                  sx={{ fontFamily: "monospace", fontSize: "11px", height: 20 }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  SHA {run.head_sha.substring(0, 7)}
                                </Typography>
                              </Stack>
                              <Typography variant="caption" color="text.secondary">
                                Attempt #{details.run.run_attempt || run.run_attempt || 1}
                              </Typography>
                            </Stack>

                            <Stack spacing={0.5} sx={{ flex: 1 }}>
                              <Typography variant="caption" fontWeight={600} color="text.secondary">
                                Commit message
                              </Typography>
                              <Typography fontFamily="monospace" fontSize="13px">
                                {commitMessage || "—"}
                              </Typography>
                            </Stack>

                            {pullRequests.length > 0 && (
                              <Stack spacing={0.5} sx={{ flex: 1 }}>
                                <Typography variant="caption" fontWeight={600} color="text.secondary">
                                  Pull requests
                                </Typography>
                                <Stack spacing={0.5}>
                                  {pullRequests.map((pr) => (
                                    <Button
                                      key={pr.id}
                                      size="small"
                                      component="a"
                                      href={pr.html_url}
                                      target="_blank"
                                      sx={{ justifyContent: "flex-start", textTransform: "none" }}
                                      startIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                                    >
                                      #{pr.number} • {pr.title}
                                    </Button>
                                  ))}
                                </Stack>
                              </Stack>
                            )}
                          </Stack>

                          {failureSummary && (
                            <Alert severity="error">{failureSummary}</Alert>
                          )}

                          {details.jobs.length > 0 ? (
                            <Stack spacing={2}>
                              {details.jobs.map((job) => {
                                const jobDuration = formatDuration(
                                  calculateDurationSeconds(job.started_at, job.completed_at)
                                );
                                const jobStatusKey = (job.conclusion || job.status || "default").toLowerCase();
                                const jobStyle = STATUS_STYLES[jobStatusKey] || STATUS_STYLES.default;

                                return (
                                  <Paper key={job.id} variant="outlined" sx={{ p: 2 }}>
                                    <Stack
                                      direction={{ xs: "column", md: "row" }}
                                      spacing={1}
                                      justifyContent="space-between"
                                      alignItems={{ xs: "flex-start", md: "center" }}
                                    >
                                      <Typography fontWeight={600}>{job.name}</Typography>
                                      <Stack direction="row" spacing={1} alignItems="center">
                                        <Chip
                                          size="small"
                                          label={(job.conclusion || job.status || "Unknown").toUpperCase()}
                                          sx={{
                                            bgcolor: jobStyle.bg,
                                            color: jobStyle.color,
                                            fontWeight: 700,
                                            fontSize: "11px",
                                            height: 22,
                                          }}
                                        />
                                        <Typography variant="caption" color="text.secondary">
                                          Duration: {jobDuration}
                                        </Typography>
                                      </Stack>
                                    </Stack>

                                    {job.steps && job.steps.length > 0 && (
                                      <Stack spacing={1.2} sx={{ mt: 1.5 }}>
                                        {job.steps.map((step) => {
                                          const stepStatusKey = (step.conclusion || step.status || "default").toLowerCase();
                                          const stepStyle = STATUS_STYLES[stepStatusKey] || STATUS_STYLES.default;
                                          const stepDuration = formatDuration(
                                            calculateDurationSeconds(step.started_at, step.completed_at)
                                          );
                                          return (
                                            <Stack
                                              key={`${job.id}-${step.number}`}
                                              direction={{ xs: "column", md: "row" }}
                                              spacing={1}
                                              alignItems={{ xs: "flex-start", md: "center" }}
                                              justifyContent="space-between"
                                            >
                                              <Stack direction="row" spacing={1} alignItems="center">
                                                <Chip
                                                  size="small"
                                                  label={(step.conclusion || step.status || "").toUpperCase()}
                                                  sx={{
                                                    bgcolor: stepStyle.bg,
                                                    color: stepStyle.color,
                                                    fontWeight: 700,
                                                    fontSize: "10px",
                                                    height: 20,
                                                  }}
                                                />
                                                <Typography fontSize="13px">{step.name}</Typography>
                                              </Stack>
                                              <Typography variant="caption" color="text.secondary">
                                                {stepDuration}
                                              </Typography>
                                            </Stack>
                                          );
                                        })}
                                      </Stack>
                                    )}
                                  </Paper>
                                );
                              })}
                            </Stack>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Không có thông tin job chi tiết.
                            </Typography>
                          )}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Không có thông tin chi tiết cho run này.
                        </Typography>
                      )}
                    </Box>
                  </Collapse>
                </Box>
              );
            })
          )}
        </CardContent>
      </Card>

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Tạo workflow mới</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {createError && (
              <Alert severity="error" onClose={() => setCreateError(null)}>
                {createError}
              </Alert>
            )}

            <FormControl fullWidth>
              <InputLabel>Template</InputLabel>
              <Select
                label="Template"
                value={workflowTemplate}
                onChange={(event) => handleTemplateChange(event.target.value as WorkflowTemplateKey)}
              >
                {Object.entries(WORKFLOW_TEMPLATES).map(([key, meta]) => (
                  <MenuItem key={key} value={key}>
                    <Stack spacing={0.5}>
                      <Typography fontWeight={600}>{meta.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {meta.description}
                      </Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                fullWidth
                label="Filename"
                value={workflowFilename}
                onChange={(event) => setWorkflowFilename(event.target.value)}
                helperText="Ví dụ: deploy-production.yml"
              />
              <Autocomplete
                freeSolo
                options={availableBranches}
                loading={loadingBranches}
                value={workflowBranch}
                inputValue={workflowBranch}
                onChange={(_event, newValue) => handleBranchChange(newValue ?? "", workflowTemplate)}
                onInputChange={(_event, newInputValue) => handleBranchChange(newInputValue ?? "", workflowTemplate)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="Branch mặc định"
                    helperText="Nhánh áp dụng cho workflow"
                  />
                )}
              />
            </Stack>

            <TextField
              label="Commit message"
              value={workflowCommitMessage}
              onChange={(event) => setWorkflowCommitMessage(event.target.value)}
              fullWidth
            />

            <FormControlLabel
              control={(
                <Checkbox
                  checked={overwriteExisting}
                  onChange={(event) => setOverwriteExisting(event.target.checked)}
                />
              )}
              label="Ghi đè (overwrite) nếu file đã tồn tại"
            />

            <TextField
              label="Workflow content (YAML)"
              value={workflowContent}
              onChange={(event) => {
                setWorkflowContent(event.target.value);
                setWorkflowContentEdited(true);
              }}
              multiline
              minRows={12}
              InputProps={{ sx: { fontFamily: 'monospace', fontSize: 13 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={creatingWorkflow}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={submitCreateWorkflow}
            disabled={creatingWorkflow}
            startIcon={creatingWorkflow ? undefined : <AddCircleOutlineIcon />}
          >
            {creatingWorkflow ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={triggerDialogOpen} onClose={() => setTriggerDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Trigger workflow</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Workflow</InputLabel>
              <Select
                label="Workflow"
                value={triggerWorkflowId}
                onChange={(event) => setTriggerWorkflowId(event.target.value)}
              >
                {workflows.map((workflow) => (
                  <MenuItem key={workflow.id} value={String(workflow.id)}>
                    {workflow.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Branch / Ref"
              value={triggerRef}
              onChange={(event) => setTriggerRef(event.target.value)}
              helperText="Branch hoặc tag để trigger (vd: main, release/v1.2.0)"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTriggerDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={submitTriggerWorkflow}
            disabled={!triggerWorkflowId || triggerSubmitting}
            startIcon={<PlayArrowIcon />}
          >
            {triggerSubmitting ? "Triggering…" : "Trigger"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


