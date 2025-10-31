"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Stack,
  IconButton,
  Divider,
  Tooltip,
  Paper,
  Menu,
  MenuItem,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import axiosInstance from "../../../ultis/axios";

interface TaskDetailsCommentsProps {
  taskId: string | null;
}

export default function TaskDetailsComments({ taskId }: TaskDetailsCommentsProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedComment, setSelectedComment] = useState<any>(null);

  useEffect(() => {
    if (taskId) {
      loadComments();
    }
  }, [taskId]);

  const loadComments = async () => {
    if (!taskId) return;
    
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/tasks/${taskId}/comments`);
      setComments(response.data || []);
    } catch (error: any) {
      console.error("Error loading comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    if (!taskId || !newComment.trim()) return;
    
    try {
      await axiosInstance.post(`/api/tasks/${taskId}/comments`, {
        content: newComment.trim()
      });
      setNewComment("");
      await loadComments();
    } catch (error: any) {
      console.error("Error adding comment:", error);
    }
  };

  const updateComment = async (commentId: string) => {
    if (!editText.trim()) return;
    
    try {
      await axiosInstance.patch(`/api/tasks/${taskId}/comments/${commentId}`, {
        content: editText.trim()
      });
      setEditingCommentId(null);
      setEditText("");
      await loadComments();
    } catch (error: any) {
      console.error("Error updating comment:", error);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    
    try {
      await axiosInstance.delete(`/api/tasks/${taskId}/comments/${commentId}`);
      await loadComments();
    } catch (error: any) {
      console.error("Error deleting comment:", error);
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffMs = now.getTime() - commentDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return commentDate.toLocaleDateString();
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ 
          width: 36,
          height: 36,
          borderRadius: '50%',
          bgcolor: '#eff6ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <ChatBubbleOutlineIcon sx={{ fontSize: 18, color: '#3b82f6' }} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Comments
          </Typography>
          <Typography fontSize="12px" color="text.secondary">
            {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
          </Typography>
        </Box>
      </Box>

      {/* Add Comment Form */}
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          p: 2.5,
          bgcolor: '#fafbfc',
          border: '1px solid #e8e9eb',
          borderRadius: 2
        }}
      >
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Avatar sx={{ width: 36, height: 36, bgcolor: '#7b68ee', fontSize: '14px', fontWeight: 600 }}>
            U
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Add a comment... (Use @ to mention someone)"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              sx={{
                mb: 1.5,
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'white',
                  fontSize: '14px',
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: '#7b68ee',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#7b68ee',
                  }
                }
              }}
            />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                size="small"
                onClick={() => setNewComment("")}
                sx={{ textTransform: 'none', fontWeight: 600, color: '#6b7280' }}
              >
                Clear
              </Button>
              <Button
                size="small"
                variant="contained"
                disabled={!newComment.trim()}
                startIcon={<SendIcon sx={{ fontSize: 16 }} />}
                onClick={addComment}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  bgcolor: '#7b68ee',
                  '&:hover': { bgcolor: '#6952d6' }
                }}
              >
                Comment
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Paper>

      {/* Comments List */}
      {loading ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">Loading comments...</Typography>
        </Box>
      ) : comments.length === 0 ? (
        <Box sx={{ 
          p: 6, 
          textAlign: 'center',
          bgcolor: '#fafbfc',
          borderRadius: 2,
          border: '1px dashed #e8e9eb'
        }}>
          <ChatBubbleOutlineIcon sx={{ fontSize: 48, color: '#d1d5db', mb: 2 }} />
          <Typography fontSize="14px" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
            No comments yet
          </Typography>
          <Typography fontSize="12px" color="text.secondary">
            Start the conversation by adding the first comment
          </Typography>
        </Box>
      ) : (
        <Stack spacing={3}>
          {comments.map((comment) => (
            <Paper
              key={comment._id}
              elevation={0}
              sx={{
                p: 2.5,
                bgcolor: 'white',
                border: '1px solid #e8e9eb',
                borderRadius: 2,
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: '#d1d5db',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                }
              }}
            >
              <Stack direction="row" spacing={2}>
                {/* Avatar */}
                <Avatar 
                  sx={{ 
                    width: 40, 
                    height: 40, 
                    bgcolor: '#7b68ee',
                    fontSize: '16px',
                    fontWeight: 600
                  }}
                >
                  {(comment.user_id?.full_name || comment.user_id?.email || 'U')[0].toUpperCase()}
                </Avatar>

                <Box sx={{ flex: 1 }}>
                  {/* Header */}
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Typography fontSize="14px" fontWeight={700} color="text.primary">
                        {comment.user_id?.full_name || comment.user_id?.email || 'Unknown User'}
                      </Typography>
                      <Typography fontSize="12px" color="text.secondary">
                        {formatTimeAgo(comment.createdAt)}
                      </Typography>
                      {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                        <Typography fontSize="11px" color="text.secondary" fontStyle="italic">
                          (edited)
                        </Typography>
                      )}
                    </Stack>

                    {/* Actions Menu */}
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setAnchorEl(e.currentTarget);
                        setSelectedComment(comment);
                      }}
                      sx={{ color: '#9ca3af' }}
                    >
                      <MoreVertIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Stack>

                  {/* Comment Content */}
                  {editingCommentId === comment._id ? (
                    <Box>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        autoFocus
                        sx={{
                          mb: 1.5,
                          '& .MuiOutlinedInput-root': {
                            fontSize: '14px',
                            '&:hover fieldset': {
                              borderColor: '#7b68ee',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#7b68ee',
                            }
                          }
                        }}
                      />
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditText("");
                          }}
                          sx={{ textTransform: 'none', fontWeight: 600, color: '#6b7280' }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => updateComment(comment._id)}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            bgcolor: '#7b68ee',
                            '&:hover': { bgcolor: '#6952d6' }
                          }}
                        >
                          Save
                        </Button>
                      </Stack>
                    </Box>
                  ) : (
                    <Typography
                      fontSize="14px"
                      color="text.primary"
                      sx={{
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {comment.content}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => {
          setAnchorEl(null);
          setSelectedComment(null);
        }}
        PaperProps={{
          sx: { borderRadius: 2, minWidth: 160 }
        }}
      >
        <MenuItem
          onClick={() => {
            setEditingCommentId(selectedComment?._id);
            setEditText(selectedComment?.content);
            setAnchorEl(null);
          }}
          sx={{ fontSize: '13px', gap: 1.5 }}
        >
          <EditIcon sx={{ fontSize: 16 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            deleteComment(selectedComment?._id);
            setAnchorEl(null);
            setSelectedComment(null);
          }}
          sx={{ fontSize: '13px', gap: 1.5, color: '#ef4444' }}
        >
          <DeleteIcon sx={{ fontSize: 16 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
}

