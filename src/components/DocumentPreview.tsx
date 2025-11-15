"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  IconButton,
  LinearProgress,
  Alert,
  Paper,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Description as DescriptionIcon,
  Code as CodeIcon,
  TableChart as SpreadsheetIcon
} from '@mui/icons-material';

type Document = {
  _id: string;
  title: string;
  type: string;
  version: string;
  file_url: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  created_by: {
    _id: string;
    full_name: string;
    email: string;
  };
  approve_by: {
    _id: string;
    full_name: string;
    email: string;
  };
  project_id: {
    _id: string;
    topic: string;
    code: string;
  };
  milestone_id: {
    _id: string;
    title: string;
  };
  createdAt: string;
  updatedAt: string;
};

type DocumentPreviewProps = {
  open: boolean;
  onClose: () => void;
  document: Document | null;
  onDownload?: (document: Document) => void;
  onEdit?: (document: Document) => void;
  onDelete?: (document: Document) => void;
  onShare?: (document: Document) => void;
};

export default function DocumentPreview({
  open,
  onClose,
  document,
  onDownload,
  onEdit,
  onDelete,
  onShare
}: DocumentPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadPreview = useCallback(async () => {
    if (!document) return;
    setLoading(true);
    setPreviewError(null);
    try {
      if (canPreview(document.file_url)) {
        setPreviewUrl(document.file_url);
      } else {
        setPreviewError('Loại tài liệu này không hỗ trợ preview');
      }
    } catch (error) {
      console.error('Preview error:', error);
      setPreviewError('Lỗi tải preview');
    } finally {
      setLoading(false);
    }
  }, [document]);

  useEffect(() => {
    if (document && open) {
      loadPreview();
    }
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [document, open, loadPreview, previewUrl]);

  

  const canPreview = (fileUrl: string): boolean => {
    const extension = fileUrl.split('.').pop()?.toLowerCase();
    return (
      extension === 'jpg' || extension === 'jpeg' || extension === 'png' ||
      extension === 'pdf' || extension === 'txt' || extension === 'json'
    );
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'design': return <ImageIcon />;
      case 'code': return <CodeIcon />;
      case 'documentation': return <DescriptionIcon />;
      case 'presentation': return <PdfIcon />;
      case 'report': return <SpreadsheetIcon />;
      default: return <FileIcon />;
    }
  };


  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const handleDownload = () => {
    if (document && onDownload) {
      onDownload(document);
    }
  };

  const handleEdit = () => {
    if (document && onEdit) {
      onEdit(document);
    }
  };

  // const handleDelete = () => {
  //   if (document && onDelete) {
  //     onDelete(document);
  //   }
  // };

  const handleShare = () => {
    if (document && onShare) {
      onShare(document);
    }
  };

  if (!document) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            {getFileIcon(document.type)}
            <Box>
              <Typography variant="h6" noWrap>
                {document.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                v{document.version} • {document.type}
              </Typography>
            </Box>
          </Stack>
        
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* Document Info */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tạo bởi
                  </Typography>
                  <Typography variant="body2">
                    {document.created_by.full_name}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Ngày tạo
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(document.createdAt)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Trạng thái
                  </Typography>
                  <Typography variant="body2">
                    {document.status}
                  </Typography>
                </Box>
              </Stack>

              {document.description && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Mô tả
                  </Typography>
                  <Typography variant="body2">
                    {document.description}
                  </Typography>
                </Box>
              )}

              {document.comments && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Ghi chú
                  </Typography>
                  <Typography variant="body2">
                    {document.comments}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Paper>

          {/* Preview Content */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Nội dung
            </Typography>
            
            {loading && (
              <Box textAlign="center" py={4}>
                <LinearProgress sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Đang tải preview...
                </Typography>
              </Box>
            )}

            {previewError && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {previewError}
              </Alert>
            )}

            {previewUrl && !loading && (
              <Box>
                {(document.file_url.includes('.jpg') || document.file_url.includes('.jpeg') || document.file_url.includes('.png')) && (
                  <Box textAlign="center">
                    <img
                      src={previewUrl}
                      alt={document.title}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '500px',
                        objectFit: 'contain'
                      }}
                    />
                  </Box>
                )}
                
                {document.file_url.includes('.pdf') && (
                  <Box>
                    <iframe
                      src={previewUrl}
                      width="100%"
                      height="600px"
                      style={{ border: 'none' }}
                      title={document.title}
                    />
                  </Box>
                )}
                
                {(document.file_url.includes('.txt') || document.file_url.includes('.json')) && (
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <pre style={{ 
                      whiteSpace: 'pre-wrap', 
                      wordBreak: 'break-word',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      margin: 0
                    }}>
                      {/* Text content would be loaded here */}
                      Nội dung văn bản sẽ được hiển thị ở đây...
                    </pre>
                  </Paper>
                )}
              </Box>
            )}

            {!previewUrl && !loading && !previewError && (
              <Box textAlign="center" py={6}>
                <DescriptionIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Không thể xem trước
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Loại tài liệu này không hỗ trợ xem trước
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownload}
                >
                  Tải xuống để xem
                </Button>
              </Box>
            )}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Đóng
        </Button>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
        >
          Tải xuống
        </Button>
      </DialogActions>
    </Dialog>
  );
}
