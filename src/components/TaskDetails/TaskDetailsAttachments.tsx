"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  IconButton,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Menu,
  MenuItem,
  Avatar,
} from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import LinkIcon from "@mui/icons-material/Link";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ImageIcon from "@mui/icons-material/Image";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import axiosInstance from "../../../ultis/axios";

interface TaskDetailsAttachmentsProps {
  taskId: string | null;
}

export default function TaskDetailsAttachments({ taskId }: TaskDetailsAttachmentsProps) {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openLinkDialog, setOpenLinkDialog] = useState(false);
  const [linkForm, setLinkForm] = useState({ url: '', description: '' });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAttachment, setSelectedAttachment] = useState<any>(null);

  useEffect(() => {
    if (taskId) {
      loadAttachments();
    }
  }, [taskId]);

  const loadAttachments = async () => {
    if (!taskId) return;
    
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/tasks/${taskId}/attachments`);
      setAttachments(response.data || []);
    } catch (error: any) {
      console.error("Error loading attachments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !taskId) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', file.name);

    try {
      await axiosInstance.post(`/api/tasks/${taskId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await loadAttachments();
    } catch (error: any) {
      console.error("Error uploading file:", error);
      alert("Không thể tải lên tệp. Đảm bảo backend hỗ trợ tải lên tệp.");
    }
  };

  const addLink = async () => {
    if (!taskId || !linkForm.url) return;
    
    try {
      await axiosInstance.post(`/api/tasks/${taskId}/attachments`, {
        file_url: linkForm.url,
        description: linkForm.description || 'Link',
        is_link: true
      });
      setLinkForm({ url: '', description: '' });
      setOpenLinkDialog(false);
      await loadAttachments();
    } catch (error: any) {
      console.error("Error adding link:", error);
    }
  };

  const deleteAttachment = async (attachmentId: string) => {
    if (!confirm('Xóa tệp đính kèm này?')) return;
    
    try {
      await axiosInstance.delete(`/api/tasks/${taskId}/attachments/${attachmentId}`);
      await loadAttachments();
    } catch (error: any) {
      console.error("Error deleting attachment:", error);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return <ImageIcon />;
    if (ext === 'pdf') return <PictureAsPdfIcon />;
    if (['doc', 'docx', 'txt'].includes(ext || '')) return <DescriptionIcon />;
    return <InsertDriveFileIcon />;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ 
            width: 36,
            height: 36,
            borderRadius: '50%',
            bgcolor: '#eff6ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AttachFileIcon sx={{ fontSize: 18, color: '#3b82f6' }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Tệp đính kèm
            </Typography>
            <Typography fontSize="12px" color="text.secondary">
              {attachments.length} {attachments.length === 1 ? 'tệp' : 'tệp'}
            </Typography>
          </Box>
        </Stack>

        {/* Action Buttons */}
        <Stack direction="row" spacing={1}>
          <Button
            component="label"
            size="small"
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderColor: '#7b68ee',
              color: '#7b68ee',
              '&:hover': {
                borderColor: '#6952d6',
                bgcolor: '#f5f3ff'
              }
            }}
          >
            Tải lên tệp
            <input
              type="file"
              hidden
              onChange={handleFileUpload}
            />
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<LinkIcon />}
            onClick={() => setOpenLinkDialog(true)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderColor: '#7b68ee',
              color: '#7b68ee',
              '&:hover': {
                borderColor: '#6952d6',
                bgcolor: '#f5f3ff'
              }
            }}
          >
            Thêm liên kết
          </Button>
        </Stack>
      </Box>

      {/* Attachments List */}
      {loading ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">Đang tải tệp đính kèm...</Typography>
        </Box>
      ) : attachments.length === 0 ? (
        <Box sx={{ 
          p: 6, 
          textAlign: 'center',
          bgcolor: '#fafbfc',
          borderRadius: 2,
          border: '2px dashed #e8e9eb'
        }}>
          <CloudUploadIcon sx={{ fontSize: 64, color: '#d1d5db', mb: 2 }} />
          <Typography fontSize="14px" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
            Chưa có tệp đính kèm nào
          </Typography>
          <Typography fontSize="12px" color="text.secondary" sx={{ mb: 3 }}>
            Tải lên tệp hoặc thêm liên kết để giữ mọi thứ được tổ chức
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="center">
            <Button
              component="label"
              size="small"
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Tải lên tệp
              <input type="file" hidden onChange={handleFileUpload} />
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<LinkIcon />}
              onClick={() => setOpenLinkDialog(true)}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Thêm liên kết
            </Button>
          </Stack>
        </Box>
      ) : (
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
          gap: 2
        }}>
          {attachments.map((attachment) => (
            <Paper
              key={attachment._id}
              elevation={0}
              sx={{
                p: 2.5,
                border: '1px solid #e8e9eb',
                borderRadius: 2,
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: '#7b68ee',
                  boxShadow: '0 2px 8px rgba(123,104,238,0.12)'
                }
              }}
            >
              <Stack direction="row" spacing={2} alignItems="flex-start">
                {/* File Icon */}
                <Box sx={{ 
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: attachment.is_link ? '#eff6ff' : '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: attachment.is_link ? '#3b82f6' : '#6b7280'
                }}>
                  {attachment.is_link ? (
                    <LinkIcon sx={{ fontSize: 24 }} />
                  ) : (
                    getFileIcon(attachment.file_name)
                  )}
                </Box>

                {/* File Info */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    fontSize="14px"
                    fontWeight={600}
                    sx={{
                      mb: 0.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {attachment.file_name || attachment.description}
                  </Typography>
                  
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={0.5}>
                    {attachment.is_link ? (
                      <Chip label="Link" size="small" sx={{ height: 18, fontSize: '10px', bgcolor: '#eff6ff', color: '#3b82f6' }} />
                    ) : (
                      <>
                        <Chip 
                          label={formatFileSize(attachment.file_size)} 
                          size="small" 
                          sx={{ height: 18, fontSize: '10px' }}
                        />
                        {attachment.file_type && (
                          <Chip 
                            label={attachment.file_type} 
                            size="small" 
                            sx={{ height: 18, fontSize: '10px' }}
                          />
                        )}
                      </>
                    )}
                  </Stack>

                  {attachment.uploaded_by && (
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 1 }}>
                      <Avatar sx={{ width: 16, height: 16, fontSize: '8px', bgcolor: '#6b7280' }}>
                        {(attachment.uploaded_by?.full_name || 'U')[0]}
                      </Avatar>
                      <Typography fontSize="11px" color="text.secondary">
                        {attachment.uploaded_by?.full_name || attachment.uploaded_by?.email}
                      </Typography>
                      <Typography fontSize="11px" color="text.secondary">
                        · {new Date(attachment.createdAt).toLocaleDateString()}
                      </Typography>
                    </Stack>
                  )}
                </Box>

                {/* Actions */}
                <Stack direction="row" spacing={0.5}>
                  {attachment.file_url && (
                    <Tooltip title="Tải xuống">
                      <IconButton
                        size="small"
                        component="a"
                        href={attachment.file_url}
                        target="_blank"
                        download
                        sx={{ color: '#6b7280' }}
                      >
                        <DownloadIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => deleteAttachment(attachment._id)}
                    sx={{ 
                      color: '#9ca3af',
                      '&:hover': { color: '#ef4444', bgcolor: '#fee2e2' }
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Box>
      )}

      {/* Add Link Dialog */}
      <Dialog
        open={openLinkDialog}
        onClose={() => setOpenLinkDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Thêm liên kết</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="URL *"
              fullWidth
              value={linkForm.url}
              onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
              placeholder="https://..."
            />
            <TextField
              label="Mô tả"
              fullWidth
              value={linkForm.description}
              onChange={(e) => setLinkForm({ ...linkForm, description: e.target.value })}
              placeholder="Mô tả tùy chọn"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => {
              setOpenLinkDialog(false);
              setLinkForm({ url: '', description: '' });
            }}
            sx={{ textTransform: 'none', fontWeight: 600, color: '#6b7280' }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            disabled={!linkForm.url}
            onClick={addLink}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#7b68ee',
              '&:hover': { bgcolor: '#6952d6' }
            }}
          >
            Thêm liên kết
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

