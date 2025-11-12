"use client";

import { useState, useEffect, useRef } from "react";
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
  Menu,
  MenuItem,
  Avatar,
  LinearProgress,
  Alert,
  Snackbar,
  CircularProgress,
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
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import VisibilityIcon from "@mui/icons-material/Visibility";
import axiosInstance from "../../../ultis/axios";

interface TaskDetailsAttachmentsProps {
  taskId: string | null;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export default function TaskDetailsAttachments({ taskId }: TaskDetailsAttachmentsProps) {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({});
  const [openLinkDialog, setOpenLinkDialog] = useState(false);
  const [linkForm, setLinkForm] = useState({ url: '', description: '', file_name: '' });
  const [dragActive, setDragActive] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [imagePreview, setImagePreview] = useState<{ open: boolean; url: string; fileName: string }>({
    open: false,
    url: '',
    fileName: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

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

  // Validate file
  const validateFile = (file: File): string | null => {
    const maxSize = 20 * 1024 * 1024; // 20MB
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    if (file.size > maxSize) {
      return `File size exceeds 20MB limit. Your file is ${formatFileSize(file.size)}`;
    }

    if (!allowedTypes.includes(file.type)) {
      return 'Invalid file type. Only images and office/pdf documents are allowed.';
    }

    return null;
  };

  // Handle file upload (single or multiple)
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !taskId) return;

    const filesArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Validate all files first
    filesArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      setSnackbar({
        open: true,
        message: errors.join('\n'),
        severity: 'error'
      });
    }

    if (validFiles.length === 0) return;

    setUploading(true);

    // Upload files sequentially with progress tracking
    for (const file of validFiles) {
      const fileId = `${Date.now()}_${file.name}`;
      
      setUploadProgress(prev => ({
        ...prev,
        [fileId]: {
          fileName: file.name,
          progress: 0,
          status: 'uploading'
        }
      }));

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

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  // Add link attachment
  const addLink = async () => {
    if (!taskId || !linkForm.url) return;
    
    try {
      await axiosInstance.post(`/api/tasks/${taskId}/attachments`, {
        file_url: linkForm.url,
        file_name: linkForm.file_name || linkForm.url,
        description: linkForm.description || linkForm.file_name || 'Link',
        is_link: true
      });
      setLinkForm({ url: '', description: '', file_name: '' });
      setOpenLinkDialog(false);
      await loadAttachments();
      setSnackbar({
        open: true,
        message: 'Link added successfully',
        severity: 'success'
      });
    } catch (error: any) {
      console.error("Error adding link:", error);
      setSnackbar({
        open: true,
        message: error?.response?.data?.message || 'Failed to add link',
        severity: 'error'
      });
    }
  };

  // Delete attachment
  const deleteAttachment = async (attachmentId: string) => {
    if (!confirm('Xóa tệp đính kèm này?')) return;
    
    try {
      await axiosInstance.delete(`/api/tasks/${taskId}/attachments/${attachmentId}`);
      await loadAttachments();
      setSnackbar({
        open: true,
        message: 'Attachment deleted successfully',
        severity: 'success'
      });
    } catch (error: any) {
      console.error("Error deleting attachment:", error);
      setSnackbar({
        open: true,
        message: error?.response?.data?.message || 'Failed to delete attachment',
        severity: 'error'
      });
    }
  };

  // Open image preview modal
  const openImagePreview = (url: string, fileName: string) => {
    setImagePreview({
      open: true,
      url,
      fileName
    });
  };

  // Close image preview modal
  const closeImagePreview = () => {
    setImagePreview({
      open: false,
      url: '',
      fileName: ''
    });
  };

  // Download image/file
  const downloadImage = async (url: string, fileName: string) => {
    try {
      // Fetch file từ URL (hỗ trợ Firebase Storage URLs với token)
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }

      // Convert response sang blob
      const blob = await response.blob();
      
      // Tạo object URL từ blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Tạo download link
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.style.display = 'none';
      
      // Append link vào body và trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup: remove link và revoke object URL
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      setSnackbar({
        open: true,
        message: `Đã tải về: ${fileName}`,
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Error downloading file:', error);
      
      // Fallback: thử download trực tiếp nếu fetch thất bại
      try {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setSnackbar({
          open: true,
          message: `Đang tải về: ${fileName}`,
          severity: 'success'
        });
      } catch (fallbackError) {
        setSnackbar({
          open: true,
          message: `Không thể tải về: ${fileName}. Vui lòng thử lại.`,
          severity: 'error'
        });
      }
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
            disabled={uploading}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderColor: '#7b68ee',
              color: '#7b68ee',
              '&:disabled': {
                borderColor: '#e5e7eb',
                color: '#9ca3af'
              }
            }}
          >
            Tải lên tệp
            <input
              ref={fileInputRef}
              type="file"
              hidden
              multiple
              onChange={handleInputChange}
            />
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<LinkIcon />}
            onClick={() => setOpenLinkDialog(true)}
            disabled={uploading}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderColor: '#7b68ee',
              color: '#7b68ee',
              '&:hover': {
                borderColor: '#6952d6',
                bgcolor: '#f5f3ff'
              },
              '&:disabled': {
                borderColor: '#e5e7eb',
                color: '#9ca3af'
              }
            }}
          >
            Thêm liên kết
          </Button>
        </Stack>
      </Box>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <Box sx={{ mb: 3 }}>
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <Paper
              key={fileId}
              elevation={0}
              sx={{
                p: 2,
                mb: 1,
                border: '1px solid #e8e9eb',
                borderRadius: 2,
                bgcolor: progress.status === 'error' ? '#fef2f2' : progress.status === 'success' ? '#f0fdf4' : '#fafbfc'
              }}
            >
              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
                    {progress.status === 'success' ? (
                      <CheckCircleIcon sx={{ fontSize: 18, color: '#22c55e' }} />
                    ) : progress.status === 'error' ? (
                      <ErrorIcon sx={{ fontSize: 18, color: '#ef4444' }} />
                    ) : (
                      <CircularProgress size={16} sx={{ color: '#7b68ee' }} />
                    )}
                    <Typography
                      fontSize="13px"
                      fontWeight={600}
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        color: progress.status === 'error' ? '#ef4444' : progress.status === 'success' ? '#22c55e' : '#1f2937'
                      }}
                    >
                      {progress.fileName}
                    </Typography>
                  </Stack>
                  {progress.status === 'uploading' && (
                    <Typography fontSize="12px" sx={{ color: '#666', ml: 2 }}>
                      {progress.progress}%
                    </Typography>
                  )}
                </Stack>
                {progress.status === 'uploading' && (
                  <LinearProgress
                    variant="determinate"
                    value={progress.progress}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: '#e5e7eb',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#7b68ee',
                        borderRadius: 3
                      }
                    }}
                  />
                )}
                {progress.status === 'error' && progress.error && (
                  <Typography fontSize="11px" sx={{ color: '#ef4444', mt: 0.5 }}>
                    {progress.error}
                  </Typography>
                )}
              </Stack>
            </Paper>
          ))}
        </Box>
      )}

      {/* Drag & Drop Zone */}
      <Box
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        sx={{
          p: 4,
          mb: 3,
          textAlign: 'center',
          bgcolor: dragActive ? '#f0f5ff' : '#fafbfc',
          borderRadius: 2,
          border: `2px dashed ${dragActive ? '#7b68ee' : '#e8e9eb'}`,
          transition: 'all 0.2s',
          cursor: 'pointer',
          '&:hover': {
            borderColor: '#7b68ee',
            bgcolor: '#f0f5ff'
          }
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <CloudUploadIcon sx={{ fontSize: 48, color: dragActive ? '#7b68ee' : '#d1d5db', mb: 2 }} />
        <Typography fontSize="14px" fontWeight={600} sx={{ color: dragActive ? '#7b68ee' : '#666', mb: 0.5 }}>
          {dragActive ? 'Drop files here' : 'Drag & drop files here or click to browse'}
        </Typography>
        <Typography fontSize="12px" sx={{ color: '#666', mb: 2 }}>
          Supports images, PDFs, and office documents (max 20MB per file)
        </Typography>
        <input
          ref={fileInputRef}
          type="file"
          hidden
          multiple
          onChange={handleInputChange}
        />
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
          border: '1px solid #e8e9eb'
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
          {attachments.map((attachment) => {
            const isImage = attachment.file_name && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(
              attachment.file_name.split('.').pop()?.toLowerCase() || ''
            );
            
            return (
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
                    boxShadow: '0 2px 8px rgba(123,104,238,0.12)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  {/* File Icon or Image Preview */}
                  <Box sx={{ 
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: attachment.is_link ? '#eff6ff' : '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: attachment.is_link ? '#3b82f6' : '#6b7280',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    {attachment.is_link ? (
                      <LinkIcon sx={{ fontSize: 24 }} />
                    ) : isImage && attachment.file_url ? (
                      <Box
                        component="img"
                        src={attachment.file_url}
                        alt={attachment.file_name}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          cursor: 'pointer'
                        }}
                        onClick={() => openImagePreview(attachment.file_url, attachment.file_name)}
                      />
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
                        whiteSpace: 'nowrap',
                        color: '#1f2937',
                        cursor: attachment.file_url ? 'pointer' : 'default'
                      }}
                      onClick={() => {
                        if (attachment.file_url) {
                          if (isImage) {
                            openImagePreview(attachment.file_url, attachment.file_name);
                          } else {
                            window.open(attachment.file_url, '_blank');
                          }
                        }
                      }}
                    >
                      {attachment.file_name || attachment.description}
                    </Typography>
                    
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={0.5} sx={{ mb: 1 }}>
                      {attachment.is_link ? (
                        <Chip 
                          label="Link" 
                          size="small" 
                          sx={{ 
                            height: 20, 
                            fontSize: '10px', 
                            bgcolor: '#eff6ff', 
                            color: '#3b82f6',
                            fontWeight: 600
                          }} 
                        />
                      ) : (
                        <>
                          <Chip 
                            label={formatFileSize(attachment.file_size)} 
                            size="small" 
                            sx={{ 
                              height: 20, 
                              fontSize: '10px',
                              fontWeight: 500
                            }}
                          />
                          {attachment.file_type && (
                            <Chip 
                              label={attachment.file_type.split('/').pop()?.toUpperCase() || attachment.file_type} 
                              size="small" 
                              sx={{ 
                                height: 20, 
                                fontSize: '10px',
                                fontWeight: 500
                              }}
                            />
                          )}
                        </>
                      )}
                    </Stack>

                    {attachment.uploaded_by && (
                      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 1 }}>
                        <Avatar sx={{ width: 18, height: 18, fontSize: '9px', bgcolor: '#7b68ee', fontWeight: 600 }}>
                          {(attachment.uploaded_by?.full_name || attachment.uploaded_by?.email || 'U')[0].toUpperCase()}
                        </Avatar>
                        <Typography fontSize="11px" sx={{ color: '#666' }}>
                          {attachment.uploaded_by?.full_name || attachment.uploaded_by?.email}
                        </Typography>
                        <Typography fontSize="11px" sx={{ color: '#999' }}>
                          · {new Date(attachment.createdAt).toLocaleDateString('vi-VN')}
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
                        onClick={() => {
                          if (isImage) {
                            openImagePreview(attachment.file_url, attachment.file_name);
                          } else {
                            window.open(attachment.file_url, '_blank', 'noopener,noreferrer');
                          }
                        }}
                        sx={{ 
                          color: '#6b7280'
                        }}
                      >
                        {attachment.is_link ? (
                          <LinkIcon sx={{ fontSize: 18 }} />
                        ) : isImage ? (
                          <VisibilityIcon sx={{ fontSize: 18 }} />
                        ) : (
                          <DownloadIcon sx={{ fontSize: 18 }} />
                        )}
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => deleteAttachment(attachment._id)}
                      sx={{ 
                        color: '#9ca3af'
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Stack>
                </Stack>
              </Paper>
            );
          })}
        </Box>
      )}

      {/* Add Link Dialog */}
      <Dialog
        open={openLinkDialog}
        onClose={() => {
          setOpenLinkDialog(false);
          setLinkForm({ url: '', description: '', file_name: '' });
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Thêm liên kết</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="URL *"
              fullWidth
              required
              value={linkForm.url}
              onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
              placeholder="https://..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
              helperText="Enter a valid URL to link"
            />
            <TextField
              label="File Name"
              fullWidth
              value={linkForm.file_name}
              onChange={(e) => setLinkForm({ ...linkForm, file_name: e.target.value })}
              placeholder="Optional file name (defaults to URL)"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
              helperText="Optional: Custom name for this link"
            />
            <TextField
              label="Mô tả"
              fullWidth
              multiline
              rows={3}
              value={linkForm.description}
              onChange={(e) => setLinkForm({ ...linkForm, description: e.target.value })}
              placeholder="Mô tả tùy chọn"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button
            onClick={() => {
              setOpenLinkDialog(false);
              setLinkForm({ url: '', description: '', file_name: '' });
            }}
            sx={{ 
              textTransform: 'none', 
              fontWeight: 600, 
              color: '#6b7280',
              borderRadius: 2,
              px: 2
            }}
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

      {/* Image Preview Modal */}
      <Dialog
        open={imagePreview.open}
        onClose={closeImagePreview}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: '#000',
            maxHeight: '90vh',
            m: 2
          }
        }}
      >
        <DialogTitle 
          component="div"
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            pb: 1,
            bgcolor: 'rgba(0,0,0,0.8)',
            color: 'white'
          }}
        >
          <Typography variant="h6" fontWeight={600} sx={{ color: 'white', flex: 1 }}>
            {imagePreview.fileName}
          </Typography>
          <Stack direction="row" spacing={1}>
            <IconButton
              size="small"
              onClick={() => {
                window.open(imagePreview.url, '_blank', 'noopener,noreferrer');
              }}
              sx={{
                color: 'white'
              }}
            >
              <LinkIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={closeImagePreview}
              sx={{
                color: 'white'
              }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ 
          p: 0, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: '#000',
          minHeight: '60vh',
          position: 'relative'
        }}>
          {imagePreview.url ? (
            <Box
              component="img"
              src={imagePreview.url}
              alt={imagePreview.fileName}
              sx={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          ) : (
            <CircularProgress sx={{ color: 'white' }} />
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ 
            width: '100%',
            borderRadius: 2,
            '& .MuiAlert-message': {
              whiteSpace: 'pre-line'
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

