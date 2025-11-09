"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "../../../../../../ultis/axios";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";
import FeatureDetailsOverview from "@/components/FeatureDetails/FeatureDetailsOverview";
import FeatureDetailsFunctions from "@/components/FeatureDetails/FeatureDetailsFunctions";
import FeatureDetailsComments from "@/components/FeatureDetails/FeatureDetailsComments";
import FeatureDetailsActivity from "@/components/FeatureDetails/FeatureDetailsActivity";
import FeatureDetailsDevelopment from "@/components/FeatureDetails/FeatureDetailsDevelopment";
import {
  Box,
  Chip,
  CircularProgress,
  FormControl,
  MenuItem,
  Select,
  Stack,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Avatar,
  Tooltip,
  Breadcrumbs,
  Link,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FlagIcon from "@mui/icons-material/Flag";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ShareIcon from "@mui/icons-material/Share";
import NotificationsIcon from "@mui/icons-material/Notifications";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import InfoIcon from "@mui/icons-material/Info";
import FunctionsIcon from "@mui/icons-material/Functions";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import HistoryIcon from "@mui/icons-material/History";
import CodeIcon from "@mui/icons-material/Code";

type Feature = {
  _id: string;
  title: string;
  description?: string;
  project_id: string;
  status_id?: Setting | string;
  priority_id?: Setting | string;
  created_by?: any;
  last_updated_by?: any;
  start_date?: string;
  due_date?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
};

type Setting = {
  _id: string;
  name: string;
  value?: string;
};

type FunctionType = {
  _id: string;
  title: string;
  feature_id?: Feature | string;
  priority_id?: Setting | string;
  status?: Setting | string;
  description?: string;
};

export default function FeatureDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);
  const featureId = Array.isArray(params?.featureId) ? params?.featureId[0] : (params?.featureId as string);

  const [feature, setFeature] = useState<Feature | null>(null);
  const [functions, setFunctions] = useState<FunctionType[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [statusTypes, setStatusTypes] = useState<Setting[]>([]);
  const [priorityTypes, setPriorityTypes] = useState<Setting[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);

  useEffect(() => {
    if (!featureId) return;
    loadFeatureData();
  }, [featureId]);

  // Refresh data when switching tabs
  useEffect(() => {
    if (currentTab === 1 && functions.length === 0) {
      // Refresh functions when opening functions tab
      axiosInstance.get(`/api/projects/${projectId}/features/${featureId}/functions`)
        .then(res => setFunctions(Array.isArray(res.data) ? res.data : []))
        .catch(() => {});
    }
    if (currentTab === 3) {
      // Refresh comments when opening comments tab
      axiosInstance.get(`/api/features/${featureId}/comments`)
        .then(res => setComments(Array.isArray(res.data) ? res.data : []))
        .catch(() => {});
    }
    if (currentTab === 4) {
      // Refresh activity logs when opening activity tab
      axiosInstance.get(`/api/features/${featureId}/activity-logs`)
        .then(res => setActivityLogs(Array.isArray(res.data) ? res.data : []))
        .catch(() => {});
    }
  }, [currentTab, featureId, projectId]);

  const loadFeatureData = async () => {
    try {
      setLoading(true);
      
      const [featureRes, functionsRes, commentsRes, activityLogsRes, settingsRes, meRes] = await Promise.all([
        axiosInstance.get(`/api/features/${featureId}`).catch(() => ({ data: null })),
        axiosInstance.get(`/api/projects/${projectId}/features/${featureId}/functions`).catch(() => ({ data: [] })),
        axiosInstance.get(`/api/features/${featureId}/comments`).catch(() => ({ data: [] })),
        axiosInstance.get(`/api/features/${featureId}/activity-logs`).catch(() => ({ data: [] })),
        axiosInstance.get(`/api/settings`).catch(() => ({ data: [] })),
        axiosInstance.get(`/api/users/me`).catch(() => ({ data: null })),
      ]);

      if (featureRes.data) {
        setFeature(featureRes.data);
      }

      setFunctions(Array.isArray(functionsRes.data) ? functionsRes.data : []);
      setComments(Array.isArray(commentsRes.data) ? commentsRes.data : []);
      setActivityLogs(Array.isArray(activityLogsRes.data) ? activityLogsRes.data : []);

      const allSettings = settingsRes.data || [];
      setPriorityTypes(allSettings.filter((s: any) => s.type_id === 1));
      setStatusTypes(allSettings.filter((s: any) => s.type_id === 2));
      
      if (meRes.data) {
        setCurrentUser(meRes.data);
      }
    } catch (e: any) {
      console.error('Error loading feature data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureUpdate = async (updates: any) => {
    try {
      await axiosInstance.patch(`/api/features/${featureId}`, updates);
      // Reload feature and activity logs to reflect changes
      const [featureRes, activityLogsRes] = await Promise.all([
        axiosInstance.get(`/api/features/${featureId}`).catch(() => ({ data: null })),
        axiosInstance.get(`/api/features/${featureId}/activity-logs`).catch(() => ({ data: [] })),
      ]);
      if (featureRes.data) {
        setFeature(featureRes.data);
      }
      setActivityLogs(Array.isArray(activityLogsRes.data) ? activityLogsRes.data : []);
    } catch (error: any) {
      console.error("Error updating feature:", error);
      throw error;
    }
  };

  const resolveStatusName = (status: Setting | string | undefined) => {
    if (!status) return "-";
    if (typeof status === "object") return status?.name || "-";
    const match = statusTypes.find(s => String(s._id) === String(status));
    return match?.name || "-";
  };

  const resolvePriorityName = (priority: Setting | string | undefined) => {
    if (!priority) return "-";
    if (typeof priority === "object") return priority?.name || "-";
    const match = priorityTypes.find(p => String(p._id) === String(priority));
    return match?.name || "-";
  };

  const getStatusColor = (statusName: string) => {
    const statusLower = statusName.toLowerCase();
    if (statusLower.includes('completed') || statusLower.includes('done')) return '#16a34a';
    if (statusLower.includes('progress') || statusLower.includes('doing')) return '#f59e0b';
    if (statusLower.includes('overdue') || statusLower.includes('blocked')) return '#ef4444';
    return '#9ca3af';
  };

  const getPriorityColor = (priorityName: string) => {
    const priorityLower = priorityName.toLowerCase();
    if (priorityLower.includes('critical') || priorityLower.includes('high')) return '#ef4444';
    if (priorityLower.includes('medium')) return '#f59e0b';
    return '#3b82f6';
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#fafbfc' }}>
        <ResponsiveSidebar />
        <main className="md:ml-64" style={{ minHeight: '100vh' }}>
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
            <CircularProgress />
          </Box>
        </main>
      </div>
    );
  }

  if (!feature) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#fafbfc' }}>
        <ResponsiveSidebar />
        <main className="md:ml-64" style={{ minHeight: '100vh' }}>
          <Box sx={{ p: 4 }}>
            <Typography>Feature not found</Typography>
            <IconButton onClick={() => router.back()}>Back</IconButton>
          </Box>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafbfc' }}>
      <ResponsiveSidebar />
      <main className="md:ml-64" style={{ minHeight: '100vh' }}>
        {/* Header - Clean ClickUp style */}
        <Box sx={{ 
          bgcolor: 'white',
          borderBottom: '1px solid #e8e9eb',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          {/* Top Bar with Breadcrumb */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            px: 3,
            py: 1.5,
            borderBottom: '1px solid #f3f4f6'
          }}>
            {/* Breadcrumb */}
            <Breadcrumbs separator={<ChevronRightIcon sx={{ fontSize: 16, color: '#9ca3af' }} />}>
              <Link 
                component="button"
                onClick={() => router.push(`/projects/${projectId}/features`)}
                underline="hover" 
                color="text.secondary"
                fontSize="13px"
                sx={{ '&:hover': { color: '#7b68ee' }, border: 'none', background: 'none', cursor: 'pointer' }}
              >
                Features
              </Link>
              <Typography 
                fontSize="13px" 
                color="text.primary" 
                fontWeight={600}
                sx={{
                  maxWidth: '400px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {feature?.title || 'Feature Details'}
                </Typography>
            </Breadcrumbs>

            {/* Action Buttons */}
            <Stack direction="row" spacing={1}>
              <Tooltip title="Share">
                <IconButton size="small" sx={{ color: '#6b7280' }}>
                  <ShareIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Watch">
                <IconButton size="small" sx={{ color: '#6b7280' }}>
                  <NotificationsIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="More actions">
                <IconButton size="small" sx={{ color: '#6b7280' }}>
                  <MoreVertIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
              <IconButton size="small" onClick={() => router.back()} sx={{ color: '#6b7280' }}>
                <CloseIcon sx={{ fontSize: 20 }} />
              </IconButton>
              </Stack>
            </Box>

          {/* Feature Title & Quick Actions */}
          <Box sx={{ px: 3, py: 2.5 }}>
            <Box sx={{ flex: 1 }}>
                      <Typography 
                variant="h5" 
                fontWeight={700}
                        sx={{ 
                  mb: 1.5,
                  color: '#1f2937',
                  lineHeight: 1.3,
                        }}
                      >
                {feature?.title || 'Loading...'}
                      </Typography>

              {/* Meta Info Row */}
              <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
                {/* Status */}
                {feature?.status_id && (
                          <Chip
                    label={resolveStatusName(feature.status_id)} 
                            size="small"
                            sx={{
                      height: 24,
                      fontSize: '12px',
                              fontWeight: 600,
                      bgcolor: `${getStatusColor(resolveStatusName(feature.status_id))}15`,
                      color: getStatusColor(resolveStatusName(feature.status_id)),
                      border: `1px solid ${getStatusColor(resolveStatusName(feature.status_id))}40`,
                    }}
                  />
                )}

                {/* Priority */}
                {feature?.priority_id && (
                          <Chip
                    icon={<FlagIcon sx={{ fontSize: 14 }} />}
                    label={resolvePriorityName(feature.priority_id)} 
                            size="small"
                            sx={{
                      height: 24,
                      fontSize: '12px',
                              fontWeight: 600,
                      bgcolor: `${getPriorityColor(resolvePriorityName(feature.priority_id))}15`,
                      color: getPriorityColor(resolvePriorityName(feature.priority_id)),
                      border: `1px solid ${getPriorityColor(resolvePriorityName(feature.priority_id))}40`,
                    }}
                  />
                )}

                {/* Created By */}
                {feature?.created_by && (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Avatar 
                      sx={{ 
                        width: 24, 
                        height: 24, 
                        fontSize: '11px',
                        bgcolor: '#7b68ee',
                        fontWeight: 600
                      }}
                    >
                      {(typeof feature.created_by === 'object' ? feature.created_by?.full_name : 'U')[0]?.toUpperCase() || 'U'}
                    </Avatar>
                    <Typography fontSize="13px" color="text.secondary">
                      {typeof feature.created_by === 'object' ? feature.created_by?.full_name : 'Unknown'}
                      </Typography>
                  </Stack>
                )}

                {/* Due Date */}
                {feature?.due_date && (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <CalendarMonthIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                    <Typography fontSize="13px" color="text.secondary">
                      {new Date(feature.due_date).toLocaleDateString()}
                    </Typography>
              </Stack>
                )}
              </Stack>
            </Box>
                  </Box>

          {/* Tabs Navigation */}
          <Box sx={{ px: 2 }}>
            <Tabs 
              value={currentTab} 
              onChange={(_, v) => setCurrentTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                minHeight: 44,
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                  bgcolor: '#7b68ee',
                },
                '& .MuiTab-root': {
                  minHeight: 44,
                  fontSize: '13px',
                  fontWeight: 600,
                  textTransform: 'none',
                  color: '#6b7280',
                  px: 2,
                  '&.Mui-selected': {
                    color: '#7b68ee',
                  }
                }
              }}
            >
              <Tab icon={<InfoIcon />} iconPosition="start" label="Overview" />
              <Tab icon={<FunctionsIcon />} iconPosition="start" label={`Functions (${functions.length})`} />
              <Tab icon={<CodeIcon />} iconPosition="start" label="Development" />
              <Tab icon={<ChatBubbleOutlineIcon />} iconPosition="start" label={`Comments (${comments.length})`} />
              <Tab icon={<HistoryIcon />} iconPosition="start" label={`Activity (${activityLogs.length})`} />
            </Tabs>
          </Box>
                  </Box>

        {/* Content Area - 2 Column Layout */}
        <Box sx={{ 
          display: 'flex', 
          minHeight: 'calc(100vh - 220px)',
        }}>
          {/* Main Content - Left Column (scrollable) */}
          <Box sx={{ 
            flex: 1,
            overflow: 'auto',
            bgcolor: 'white',
            p: 3,
          }}>
            {currentTab === 0 && feature && (
              <FeatureDetailsOverview 
                feature={{
                  ...feature,
                  functions_count: functions.length,
                  comments_count: comments.length,
                  activities_count: activityLogs.length,
                }}
                onUpdate={async (updates) => {
                  await handleFeatureUpdate(updates);
                  // Refresh comments and activities count after update
                  const [commentsRes, activityLogsRes] = await Promise.all([
                    axiosInstance.get(`/api/features/${featureId}/comments`).catch(() => ({ data: [] })),
                    axiosInstance.get(`/api/features/${featureId}/activity-logs`).catch(() => ({ data: [] })),
                  ]);
                  setComments(Array.isArray(commentsRes.data) ? commentsRes.data : []);
                  setActivityLogs(Array.isArray(activityLogsRes.data) ? activityLogsRes.data : []);
                }}
              />
            )}

            {currentTab === 1 && (
              <FeatureDetailsFunctions
                featureId={featureId}
                projectId={projectId}
                functions={functions}
                statusTypes={statusTypes}
                priorityTypes={priorityTypes}
                onRefresh={async () => {
                  const [functionsRes, activityLogsRes] = await Promise.all([
                    axiosInstance.get(`/api/projects/${projectId}/features/${featureId}/functions`).catch(() => ({ data: [] })),
                    axiosInstance.get(`/api/features/${featureId}/activity-logs`).catch(() => ({ data: [] })),
                  ]);
                  setFunctions(Array.isArray(functionsRes.data) ? functionsRes.data : []);
                  setActivityLogs(Array.isArray(activityLogsRes.data) ? activityLogsRes.data : []);
                }}
                onNavigate={(path) => router.push(path)}
              />
            )}

            {currentTab === 2 && (
              <FeatureDetailsDevelopment
                featureId={featureId}
                projectId={projectId}
              />
            )}

            {currentTab === 3 && (
              <FeatureDetailsComments
                featureId={featureId}
                currentUser={currentUser}
                onUpdate={async () => {
                  const [commentsRes, activityLogsRes] = await Promise.all([
                    axiosInstance.get(`/api/features/${featureId}/comments`).catch(() => ({ data: [] })),
                    axiosInstance.get(`/api/features/${featureId}/activity-logs`).catch(() => ({ data: [] })),
                  ]);
                  setComments(Array.isArray(commentsRes.data) ? commentsRes.data : []);
                  setActivityLogs(Array.isArray(activityLogsRes.data) ? activityLogsRes.data : []);
                }}
              />
            )}

            {currentTab === 4 && (
              <FeatureDetailsActivity
                featureId={featureId}
                onUpdate={async () => {
                  const activityLogsRes = await axiosInstance.get(`/api/features/${featureId}/activity-logs`).catch(() => ({ data: [] }));
                  setActivityLogs(Array.isArray(activityLogsRes.data) ? activityLogsRes.data : []);
                }}
              />
            )}
                    </Box>

          {/* Sidebar - Right Column (fixed properties) */}
          <Box sx={{ 
            width: 280,
            borderLeft: '1px solid #e8e9eb',
            bgcolor: 'white',
            p: 2.5,
            overflow: 'auto',
            display: { xs: 'none', lg: 'block' }
          }}>
            <Typography 
              variant="subtitle2" 
              fontWeight={700} 
              sx={{ mb: 2, color: '#6b7280', fontSize: '11px', textTransform: 'uppercase' }}
            >
              Properties
                      </Typography>

            <Stack spacing={2.5}>
              {/* Status */}
              <Box>
                <Typography fontSize="12px" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                  Status
                      </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={typeof feature?.status_id === 'object' ? (feature.status_id as any)?._id : feature?.status_id || ''}
                    onChange={async (e) => {
                      try {
                        await handleFeatureUpdate({ status_id: e.target.value });
                      } catch (error) {
                        console.error('Error updating status:', error);
                      }
                    }}
                    displayEmpty
                    renderValue={(value) => {
                      const statusObj = statusTypes.find(s => s._id === value);
                      return statusObj?.name || 'Select status';
                    }}
                    sx={{ 
                      fontSize: '13px', 
                      fontWeight: 500,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#e8e9eb',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#7b68ee',
                      }
                    }}
                  >
                    {statusTypes.map((s) => (
                      <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                    </Box>

              {/* Priority */}
              <Box>
                <Typography fontSize="12px" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                  Priority
                      </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={typeof feature?.priority_id === 'object' ? (feature.priority_id as any)?._id : feature?.priority_id || ''}
                    onChange={async (e) => {
                      try {
                        await handleFeatureUpdate({ priority_id: e.target.value || null });
                      } catch (error) {
                        console.error('Error updating priority:', error);
                      }
                    }}
                    displayEmpty
                    renderValue={(value) => {
                      if (!value) return 'No priority';
                      const priorityObj = priorityTypes.find(p => p._id === value);
                      const name = priorityObj?.name || '';
                      const emoji = name.toLowerCase().includes('critical') ? '🔥'
                        : name.toLowerCase().includes('high') ? '🔴'
                        : name.toLowerCase().includes('medium') ? '🟡'
                        : '🟢';
                      return `${emoji} ${name}`;
                    }}
                    sx={{ 
                      fontSize: '13px', 
                      fontWeight: 500,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#e8e9eb',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#7b68ee',
                      }
                    }}
                  >
                    <MenuItem value="">No Priority</MenuItem>
                    {priorityTypes.map((p) => {
                      const emoji = p.name.toLowerCase().includes('critical') ? '🔥'
                        : p.name.toLowerCase().includes('high') ? '🔴'
                        : p.name.toLowerCase().includes('medium') ? '🟡'
                        : '🟢';
                      return (
                        <MenuItem key={p._id} value={p._id}>
                          {emoji} {p.name}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
                    </Box>

              <Divider />

              {/* Dates */}
              {feature?.start_date && (
                <Box>
                  <Typography fontSize="12px" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                        Start Date
                      </Typography>
                  <Typography fontSize="13px" fontWeight={500} color="text.primary">
                    {new Date(feature.start_date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                      </Typography>
                    </Box>
              )}

              {feature?.due_date && (
                <Box>
                  <Typography fontSize="12px" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                    Due Date
                      </Typography>
                  <Typography fontSize="13px" fontWeight={500} color="text.primary">
                    {new Date(feature.due_date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                      </Typography>
                    </Box>
              )}

              {/* Created By */}
              {feature?.created_by && (
                <Box>
                  <Typography fontSize="12px" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                    Created By
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ width: 24, height: 24, fontSize: '11px', bgcolor: '#7b68ee', fontWeight: 600 }}>
                      {(typeof feature.created_by === 'object' ? feature.created_by?.full_name : 'U')[0]?.toUpperCase() || 'U'}
                    </Avatar>
                    <Typography fontSize="13px" fontWeight={500} color="text.primary">
                      {typeof feature.created_by === 'object' ? feature.created_by?.full_name : 'Unknown'}
                    </Typography>
                  </Stack>
                </Box>
              )}

              {/* Created At */}
              {feature?.createdAt && (
                  <Box>
                  <Typography fontSize="12px" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                    Created
                    </Typography>
                  <Typography fontSize="13px" fontWeight={500} color="text.primary">
                    {new Date(feature.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                      </Typography>
                    </Box>
              )}
            </Stack>
                    </Box>
                  </Box>
      </main>
    </div>
  );
}
