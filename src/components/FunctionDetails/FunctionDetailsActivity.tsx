"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Avatar,
  Stack,
  Chip,
  CircularProgress,
  Button,
} from "@mui/material";
import {
  AddCircleOutline,
  Edit,
  Delete,
  PersonAdd,
  Flag,
  Schedule,
  Comment,
  CheckCircle,
  TrendingUp,
  SwapHoriz,
} from "@mui/icons-material";
import axiosInstance from "../../../ultis/axios";

interface ActivityLog {
  _id: string;
  action: string;
  metadata: any;
  created_by: {
    _id: string;
    full_name: string;
    email: string;
    avatar?: string;
  };
  createdAt: string;
}

interface FunctionDetailsActivityProps {
  functionId: string | null;
}

export default function FunctionDetailsActivity({ functionId }: FunctionDetailsActivityProps) {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const LIMIT = 20;

  useEffect(() => {
    if (functionId) {
      loadActivityLogs(true);
    }
  }, [functionId]);

  const loadActivityLogs = async (reset = false) => {
    if (!functionId) return;
    
    try {
      setLoading(true);
      const currentSkip = reset ? 0 : skip;
      const response = await axiosInstance.get(`/api/functions/${functionId}/activity-logs`, {
        params: { limit: LIMIT, skip: currentSkip }
      });
      
      const newLogs = response.data.activity_logs || [];
      
      if (reset) {
        setActivityLogs(newLogs);
      } else {
        setActivityLogs([...activityLogs, ...newLogs]);
      }
      
      setHasMore(response.data.has_more || false);
      setSkip(currentSkip + newLogs.length);
    } catch (error: any) {
      console.error("Error loading activity logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    loadActivityLogs(false);
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'CREATE_FUNCTION':
        return <AddCircleOutline sx={{ fontSize: 20, color: '#10b981' }} />;
      case 'UPDATE_FUNCTION':
        return <Edit sx={{ fontSize: 20, color: '#3b82f6' }} />;
      case 'DELETE_FUNCTION':
        return <Delete sx={{ fontSize: 20, color: '#ef4444' }} />;
      case 'ADD_COMMENT':
        return <Comment sx={{ fontSize: 20, color: '#6366f1' }} />;
      default:
        return <SwapHoriz sx={{ fontSize: 20, color: '#6b7280' }} />;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'CREATE_FUNCTION':
        return '#10b981';
      case 'DELETE_FUNCTION':
        return '#ef4444';
      case 'ADD_COMMENT':
        return '#6366f1';
      default:
        return '#3b82f6';
    }
  };

  const formatActivityMessage = (log: ActivityLog) => {
    const { action, metadata } = log;
    const userName = log.created_by?.full_name || log.created_by?.email || 'Someone';

    switch (action) {
      case 'CREATE_FUNCTION':
        return (
          <Typography fontSize="14px" color="text.primary">
            <strong>{userName}</strong> created this function
          </Typography>
        );
      
      case 'DELETE_FUNCTION':
        return (
          <Typography fontSize="14px" color="text.primary">
            <strong>{userName}</strong> deleted this function
          </Typography>
        );
      
      case 'ADD_COMMENT':
        return (
          <Typography fontSize="14px" color="text.primary">
            <strong>{userName}</strong> added a comment
          </Typography>
        );
      
      case 'UPDATE_FUNCTION':
        const changes = metadata?.changed ? metadata.changed.join(', ') : 'fields';
        return (
          <Typography fontSize="14px" color="text.primary">
            <strong>{userName}</strong> updated {changes}
          </Typography>
        );
      
      default:
        return (
          <Typography fontSize="14px" color="text.primary">
            <strong>{userName}</strong> performed an action
          </Typography>
        );
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  if (loading && activityLogs.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (activityLogs.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
          No activity yet
        </Typography>
        <Typography variant="body2" color="text.secondary" fontSize="13px">
          All changes and updates to this function will appear here
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
          Activity Log
        </Typography>
        <Typography variant="body2" color="text.secondary" fontSize="13px">
          {activityLogs.length} {activityLogs.length === 1 ? 'activity' : 'activities'}
        </Typography>
      </Box>

      {/* Timeline */}
      <Box sx={{ position: 'relative', pl: 1 }}>
        {/* Timeline Line */}
        <Box 
          sx={{ 
            position: 'absolute',
            left: '20px',
            top: '20px',
            bottom: '20px',
            width: '2px',
            bgcolor: '#e8e9eb',
            zIndex: 0
          }} 
        />

        {/* Activity Items */}
        <Stack spacing={3}>
          {activityLogs.map((log, index) => (
            <Box 
              key={log._id} 
              sx={{ 
                position: 'relative',
                display: 'flex',
                gap: 2,
              }}
            >
              {/* Timeline Dot */}
              <Box 
                sx={{ 
                  position: 'relative',
                  zIndex: 1,
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: `${getActivityColor(log.action)}15`,
                  borderRadius: '50%',
                  border: `2px solid ${getActivityColor(log.action)}`,
                }}
              >
                {getActivityIcon(log.action)}
              </Box>

              {/* Activity Content */}
              <Box sx={{ flex: 1, pt: 0.5 }}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 0.5 }}>
                  <Avatar 
                    src={log.created_by?.avatar}
                    sx={{ 
                      width: 24, 
                      height: 24,
                      fontSize: '11px',
                      bgcolor: '#7b68ee',
                      fontWeight: 600
                    }}
                  >
                    {(log.created_by?.full_name || log.created_by?.email || 'U')[0].toUpperCase()}
                  </Avatar>
                  
                  <Box sx={{ flex: 1 }}>
                    {formatActivityMessage(log)}
                    
                    <Typography 
                      fontSize="12px" 
                      color="text.secondary" 
                      sx={{ mt: 0.5 }}
                    >
                      {getRelativeTime(log.createdAt)}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Load More Button */}
      {hasMore && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button 
            variant="outlined" 
            size="small"
            onClick={loadMore}
            disabled={loading}
            sx={{
              fontSize: '13px',
              textTransform: 'none',
              borderColor: '#e8e9eb',
              color: '#6b7280',
              '&:hover': {
                borderColor: '#7b68ee',
                bgcolor: '#7b68ee05'
              }
            }}
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </Box>
      )}
    </Box>
  );
}

