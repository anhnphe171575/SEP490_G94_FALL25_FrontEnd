"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RefreshIcon from "@mui/icons-material/Refresh";
import SettingsIcon from "@mui/icons-material/Settings";
import axiosInstance from "../../ultis/axios";

interface Repository {
  _id: string;
  repo_owner: string;
  repo_name: string;
  repo_full_name: string;
  webhook_url?: string;
  webhook_secret?: string;
  enabled: boolean;
  sync_settings: {
    auto_link_commits: boolean;
    auto_link_prs: boolean;
    auto_link_issues: boolean;
    auto_create_branches: boolean;
    branch_naming_pattern: string;
  };
  created_at?: string;
  last_synced?: string;
}

interface GithubRepositorySettingsProps {
  projectId: string;
}

export default function GithubRepositorySettings({ projectId }: GithubRepositorySettingsProps) {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog states
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    repo_owner: "",
    repo_name: "",
    access_token: "",
    sync_settings: {
      auto_link_commits: true,
      auto_link_prs: true,
      auto_link_issues: false,
      auto_create_branches: true,
      branch_naming_pattern: "feature/{task-key}-{task-title}",
    },
  });

  useEffect(() => {
    loadRepositories();
  }, [projectId]);

  const loadRepositories = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/projects/${projectId}/github/repositories`);
      setRepositories(response.data || []);
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

  const addRepository = async () => {
    try {
      await axiosInstance.post(`/api/projects/${projectId}/github/repositories`, formData);
      setSuccess("Repository added successfully!");
      setAddDialog(false);
      resetForm();
      await loadRepositories();
    } catch (error: any) {
      setError(error?.response?.data?.message || "Failed to add repository");
    }
  };

  const updateRepository = async () => {
    if (!selectedRepo) return;
    
    try {
      await axiosInstance.patch(
        `/api/projects/${projectId}/github/repositories/${selectedRepo._id}`,
        { sync_settings: formData.sync_settings, enabled: selectedRepo.enabled }
      );
      setSuccess("Repository updated successfully!");
      setEditDialog(false);
      setSelectedRepo(null);
      await loadRepositories();
    } catch (error: any) {
      setError(error?.response?.data?.message || "Failed to update repository");
    }
  };

  const deleteRepository = async (repoId: string) => {
    if (!confirm("Are you sure? This will remove all GitHub links associated with this repository.")) return;
    
    try {
      await axiosInstance.delete(`/api/projects/${projectId}/github/repositories/${repoId}`);
      setSuccess("Repository removed successfully!");
      await loadRepositories();
    } catch (error: any) {
      setError(error?.response?.data?.message || "Failed to remove repository");
    }
  };

  const toggleRepository = async (repoId: string, currentEnabled: boolean) => {
    try {
      await axiosInstance.patch(
        `/api/projects/${projectId}/github/repositories/${repoId}`,
        { enabled: !currentEnabled }
      );
      await loadRepositories();
    } catch (error: any) {
      setError(error?.response?.data?.message || "Failed to toggle repository");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess("Copied to clipboard!");
  };

  const resetForm = () => {
    setFormData({
      repo_owner: "",
      repo_name: "",
      access_token: "",
      sync_settings: {
        auto_link_commits: true,
        auto_link_prs: true,
        auto_link_issues: false,
        auto_create_branches: true,
        branch_naming_pattern: "feature/{task-key}-{task-title}",
      },
    });
  };

  const openEditDialog = (repo: Repository) => {
    setSelectedRepo(repo);
    setFormData({
      repo_owner: repo.repo_owner,
      repo_name: repo.repo_name,
      access_token: "",
      sync_settings: { ...repo.sync_settings },
    });
    setEditDialog(true);
  };

  if (loading && repositories.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress size={32} />
        <Typography sx={{ mt: 2 }}>Loading repositories...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <GitHubIcon sx={{ fontSize: 32, color: '#24292f' }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>
              GitHub Integration
            </Typography>
            <Typography fontSize="14px" color="text.secondary">
              Connect repositories to track development progress
            </Typography>
          </Box>
        </Stack>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddDialog(true)}
          sx={{
            textTransform: 'none',
            bgcolor: '#238636',
            '&:hover': { bgcolor: '#2ea043' }
          }}
        >
          Add Repository
        </Button>
      </Stack>

      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Repositories List */}
      {repositories.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', bgcolor: '#f6f8fa', border: '2px dashed #d0d7de' }}>
          <GitHubIcon sx={{ fontSize: 64, color: '#d0d7de', mb: 2 }} />
          <Typography fontSize="16px" fontWeight={600} sx={{ mb: 1 }}>
            No repositories connected
          </Typography>
          <Typography fontSize="14px" color="text.secondary" sx={{ mb: 3 }}>
            Add a GitHub repository to enable development tracking features
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddDialog(true)}
            sx={{
              textTransform: 'none',
              bgcolor: '#238636',
              '&:hover': { bgcolor: '#2ea043' }
            }}
          >
            Add Your First Repository
          </Button>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {repositories.map((repo) => (
            <Accordion key={repo._id} elevation={0} sx={{ border: '1px solid #d0d7de' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%', pr: 2 }}>
                  <GitHubIcon sx={{ fontSize: 24, color: '#24292f' }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography fontWeight={600}>{repo.repo_full_name}</Typography>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                      {repo.enabled ? (
                        <Chip 
                          icon={<CheckCircleIcon />}
                          label="Active" 
                          size="small" 
                          color="success"
                          sx={{ height: 20, fontSize: '11px' }}
                        />
                      ) : (
                        <Chip 
                          icon={<ErrorIcon />}
                          label="Disabled" 
                          size="small" 
                          color="error"
                          sx={{ height: 20, fontSize: '11px' }}
                        />
                      )}
                      {repo.sync_settings.auto_link_commits && (
                        <Chip label="Auto Commits" size="small" sx={{ height: 20, fontSize: '11px' }} />
                      )}
                      {repo.sync_settings.auto_link_prs && (
                        <Chip label="Auto PRs" size="small" sx={{ height: 20, fontSize: '11px' }} />
                      )}
                    </Stack>
                  </Box>
                  
                  <Stack direction="row" spacing={1} onClick={(e) => e.stopPropagation()}>
                    <Tooltip title={repo.enabled ? "Disable" : "Enable"}>
                      <Switch
                        checked={repo.enabled}
                        onChange={() => toggleRepository(repo._id, repo.enabled)}
                        size="small"
                      />
                    </Tooltip>
                    <Tooltip title="Edit Settings">
                      <IconButton size="small" onClick={() => openEditDialog(repo)}>
                        <SettingsIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => deleteRepository(repo._id)} sx={{ color: '#cf222e' }}>
                        <DeleteIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </AccordionSummary>
              
              <AccordionDetails sx={{ bgcolor: '#f6f8fa', borderTop: '1px solid #d0d7de' }}>
                <Stack spacing={2}>
                  {/* Webhook URL */}
                  {repo.webhook_url && (
                    <Box>
                      <Typography fontSize="12px" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                        Webhook URL (for GitHub webhook setup)
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <TextField
                          fullWidth
                          size="small"
                          value={repo.webhook_url}
                          InputProps={{ readOnly: true }}
                          sx={{ fontFamily: 'monospace', fontSize: '12px' }}
                        />
                        <Tooltip title="Copy">
                          <IconButton size="small" onClick={() => copyToClipboard(repo.webhook_url!)}>
                            <ContentCopyIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  )}

                  {/* Sync Settings */}
                  <Box>
                    <Typography fontSize="12px" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                      Sync Settings
                    </Typography>
                    <Stack spacing={0.5}>
                      <Typography fontSize="12px">
                        ✅ Auto-link commits: {repo.sync_settings.auto_link_commits ? 'Enabled' : 'Disabled'}
                      </Typography>
                      <Typography fontSize="12px">
                        ✅ Auto-link PRs: {repo.sync_settings.auto_link_prs ? 'Enabled' : 'Disabled'}
                      </Typography>
                      <Typography fontSize="12px">
                        ✅ Auto-link issues: {repo.sync_settings.auto_link_issues ? 'Enabled' : 'Disabled'}
                      </Typography>
                      <Typography fontSize="12px">
                        🌿 Branch pattern: <code style={{ padding: '2px 4px', background: '#fff', borderRadius: 3 }}>
                          {repo.sync_settings.branch_naming_pattern}
                        </code>
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      )}

      {/* Add Repository Dialog */}
      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <GitHubIcon />
            <Typography fontWeight={700}>Add GitHub Repository</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 2 }}>
            <TextField
              label="Repository Owner"
              fullWidth
              value={formData.repo_owner}
              onChange={(e) => setFormData({ ...formData, repo_owner: e.target.value })}
              placeholder="facebook"
              helperText="GitHub username or organization name"
            />
            
            <TextField
              label="Repository Name"
              fullWidth
              value={formData.repo_name}
              onChange={(e) => setFormData({ ...formData, repo_name: e.target.value })}
              placeholder="react"
              helperText="Repository name (not the full URL)"
            />
            
            <TextField
              label="Personal Access Token"
              fullWidth
              type="password"
              value={formData.access_token}
              onChange={(e) => setFormData({ ...formData, access_token: e.target.value })}
              placeholder="ghp_xxxxxxxxxxxx"
              helperText={
                <>
                  Create a token at{' '}
                  <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer">
                    GitHub Settings
                  </a>
                  {' '}with <code>repo</code> scope
                </>
              }
            />

            <Divider />

            <Typography fontWeight={600} fontSize="14px">Auto-linking Settings</Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.sync_settings.auto_link_commits}
                  onChange={(e) => setFormData({
                    ...formData,
                    sync_settings: { ...formData.sync_settings, auto_link_commits: e.target.checked }
                  })}
                />
              }
              label={
                <Box>
                  <Typography fontSize="14px">Auto-link commits</Typography>
                  <Typography fontSize="12px" color="text.secondary">
                    Automatically link commits that mention task IDs
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.sync_settings.auto_link_prs}
                  onChange={(e) => setFormData({
                    ...formData,
                    sync_settings: { ...formData.sync_settings, auto_link_prs: e.target.checked }
                  })}
                />
              }
              label={
                <Box>
                  <Typography fontSize="14px">Auto-link pull requests</Typography>
                  <Typography fontSize="12px" color="text.secondary">
                    Automatically link PRs that mention task IDs
                  </Typography>
                </Box>
              }
            />

            <TextField
              label="Branch Naming Pattern"
              fullWidth
              value={formData.sync_settings.branch_naming_pattern}
              onChange={(e) => setFormData({
                ...formData,
                sync_settings: { ...formData.sync_settings, branch_naming_pattern: e.target.value }
              })}
              helperText="Use {task-key}, {task-title}, {task-id} as placeholders"
            />

            <Alert severity="info" sx={{ fontSize: '12px' }}>
              After adding the repository, you can setup GitHub webhooks for real-time updates.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setAddDialog(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={addRepository}
            disabled={!formData.repo_owner || !formData.repo_name || !formData.access_token}
            sx={{
              textTransform: 'none',
              bgcolor: '#238636',
              '&:hover': { bgcolor: '#2ea043' }
            }}
          >
            Add Repository
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Repository Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <SettingsIcon />
            <Typography fontWeight={700}>Repository Settings</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 2 }}>
            <Alert severity="info" sx={{ fontSize: '12px' }}>
              Editing <strong>{selectedRepo?.repo_full_name}</strong>
            </Alert>

            <Typography fontWeight={600} fontSize="14px">Auto-linking Settings</Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.sync_settings.auto_link_commits}
                  onChange={(e) => setFormData({
                    ...formData,
                    sync_settings: { ...formData.sync_settings, auto_link_commits: e.target.checked }
                  })}
                />
              }
              label={
                <Box>
                  <Typography fontSize="14px">Auto-link commits</Typography>
                  <Typography fontSize="12px" color="text.secondary">
                    Automatically link commits that mention task IDs
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.sync_settings.auto_link_prs}
                  onChange={(e) => setFormData({
                    ...formData,
                    sync_settings: { ...formData.sync_settings, auto_link_prs: e.target.checked }
                  })}
                />
              }
              label={
                <Box>
                  <Typography fontSize="14px">Auto-link pull requests</Typography>
                  <Typography fontSize="12px" color="text.secondary">
                    Automatically link PRs that mention task IDs
                  </Typography>
                </Box>
              }
            />

            <TextField
              label="Branch Naming Pattern"
              fullWidth
              value={formData.sync_settings.branch_naming_pattern}
              onChange={(e) => setFormData({
                ...formData,
                sync_settings: { ...formData.sync_settings, branch_naming_pattern: e.target.value }
              })}
              helperText="Use {task-key}, {task-title}, {task-id} as placeholders"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setEditDialog(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={updateRepository}
            sx={{
              textTransform: 'none',
              bgcolor: '#238636',
              '&:hover': { bgcolor: '#2ea043' }
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

