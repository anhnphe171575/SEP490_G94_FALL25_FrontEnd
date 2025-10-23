"use client";

import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Stack,
  Chip,
  IconButton,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Close as CloseIcon,
  InsertDriveFile as FileIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { toast } from 'sonner';
import axiosInstance from '../../ultis/axios';

type UploadFile = {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
};

type DocumentUploadProps = {
  open: boolean;
  onClose: () => void;
  projectId: string;
  folderId?: string;
  onUploadComplete?: (uploadedFiles: unknown[]) => void;
};

export default function DocumentUpload({ 
  open, 
  onClose, 
  projectId, 
  folderId, 
  onUploadComplete 
}: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFiles = (fileList: FileList) => {
    const newFiles: UploadFile[] = Array.from(fileList).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: 'pending'
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    
    try {
      // Upload từng file một (API backend chỉ hỗ trợ single file upload)
      const uploadPromises = files.map(async ({ id, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('project_id', projectId);
        formData.append('milestone_id', 'default'); // Có thể cần chọn milestone
        formData.append('type', category || 'documentation');
        formData.append('title', file.name.split('.')[0]); // Tên file không có extension
        formData.append('version', '1.0');
        if (description) formData.append('description', description);
        if (folderId) formData.append('folder_id', folderId);

        setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'uploading', progress: 0 } : f));

        const response = await axiosInstance.post('/api/documents/upload', formData, {
          onUploadProgress: (evt) => {
            const percent = Math.round((evt.loaded * 100) / Math.max(evt.total || 1, 1));
            setFiles(prev => prev.map(f => f.id === id ? { ...f, progress: percent } : f));
          }
        });

        setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'success', progress: 100 } : f));
        return response.data?.document || response.data;
      });

      const results = await Promise.all(uploadPromises);
      
      // Update file statuses
      setFiles(prev => prev.map(f => ({ ...f, status: 'success' as const })));
      
      toast.success(`Đã tải lên thành công ${results.length} tài liệu`);
      
      if (onUploadComplete) {
        onUploadComplete(results);
      }
      
      // Close dialog after a short delay
      setTimeout(() => {
        handleClose();
      }, 800);
      
    } catch (error) {
      console.error('Upload error:', error);
      setFiles(prev => prev.map(f => ({ 
        ...f, 
        status: 'error' as const, 
        error: 'Upload failed' 
      })));
      toast.error('Lỗi tải lên tài liệu');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFiles([]);
    setCategory('');
    setDescription('');
    setTags([]);
    setNewTag('');
    setUploading(false);
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = () => <FileIcon />;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <UploadIcon />
          <Typography variant="h6">Tải lên tài liệu</Typography>
        </Stack>
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={3}>
          {/* Upload Area */}
          <Paper
            variant="outlined"
            sx={{
              p: 4,
              textAlign: 'center',
              border: dragActive ? '2px dashed #1976d2' : '2px dashed #ccc',
              backgroundColor: dragActive ? '#f3f8ff' : 'transparent',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {dragActive ? 'Thả tài liệu vào đây' : 'Kéo thả tài liệu vào đây'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              hoặc
            </Typography>
            <Button variant="contained" component="span">
              Chọn tài liệu
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
          </Paper>

          {/* File List */}
          {files.length > 0 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Tài liệu đã chọn ({files.length})
              </Typography>
              <Stack spacing={1}>
                {files.map((file) => (
                  <Paper key={file.id} variant="outlined" sx={{ p: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      {getFileIcon(file.file.name)}
                      <Box flex={1}>
                        <Typography variant="body2" noWrap>
                          {file.file.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(file.file.size)}
                        </Typography>
                      </Box>
                      <Box sx={{ minWidth: 100 }}>
                        {file.status === 'uploading' && (
                          <LinearProgress variant="determinate" value={file.progress} />
                        )}
                        {file.status === 'success' && (
                          <CheckIcon color="success" />
                        )}
                        {file.status === 'error' && (
                          <Typography variant="caption" color="error">
                            {file.error}
                          </Typography>
                        )}
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => removeFile(file.id)}
                        disabled={file.status === 'uploading'}
                      >
                        <CloseIcon />
                      </IconButton>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Box>
          )}

          {/* Upload Options */}
          {files.length > 0 && (
            <>
              <Divider />
              <Typography variant="subtitle1" gutterBottom>
                Tùy chọn tải lên
              </Typography>
              
              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Danh mục</InputLabel>
                  <Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    label="Danh mục"
                  >
                    <MenuItem value="">Không chọn</MenuItem>
                    <MenuItem value="design">Thiết kế</MenuItem>
                    <MenuItem value="documentation">Tài liệu</MenuItem>
                    <MenuItem value="code">Mã nguồn</MenuItem>
                    <MenuItem value="presentation">Thuyết trình</MenuItem>
                    <MenuItem value="report">Báo cáo</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Mô tả chung"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Mô tả cho tất cả tài liệu..."
                />

                <Box>
                  <Typography variant="body2" gutterBottom>
                    Thẻ (tags)
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                    {tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        onDelete={() => removeTag(tag)}
                        size="small"
                      />
                    ))}
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      size="small"
                      placeholder="Thêm thẻ..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={handleKeyPress}
                    />
                    <Button size="small" onClick={addTag} disabled={!newTag.trim()}>
                      Thêm
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={uploading}>
          Hủy
        </Button>
        <Button
          variant="contained"
          onClick={uploadFiles}
          disabled={files.length === 0 || uploading}
          startIcon={uploading ? undefined : <UploadIcon />}
        >
          {uploading ? 'Đang tải lên...' : `Tải lên ${files.length} tài liệu`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
