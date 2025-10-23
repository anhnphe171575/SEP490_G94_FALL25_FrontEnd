"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Box,
  Typography,
  IconButton,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert
} from '@mui/material';
import {
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  CreateNewFolder as CreateFolderIcon,
  DriveFileMove as MoveIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { toast } from 'sonner';

type Folder = {
  _id: string;
  name: string;
  description?: string;
  parentId?: string;
  createdAt: string;
  createdBy: {
    _id: string;
    full_name: string;
  };
  documentCount: number;
  subfolderCount: number;
};

type FolderManagerProps = {
  open: boolean;
  onClose: () => void;
  projectId: string;
  folders: Folder[];
  currentFolderId?: string;
  onFolderCreated?: (folder: Folder) => void;
  onFolderUpdated?: (folder: Folder) => void;
  onFolderDeleted?: (folderId: string) => void;
};

export default function FolderManager({
  open,
  onClose,
  projectId,
  folders,
  currentFolderId,
  onFolderCreated,
  onFolderUpdated,
  onFolderDeleted
}: FolderManagerProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
  
  // Create folder form
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [newFolderParent, setNewFolderParent] = useState('');
  
  // Edit folder form
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [editFolderDescription, setEditFolderDescription] = useState('');
  const [editFolderParent, setEditFolderParent] = useState('');
  
  // Bulk operations
  const [bulkAction, setBulkAction] = useState<'move' | 'delete' | 'copy'>('move');
  const [targetFolder, setTargetFolder] = useState('');

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('Vui lòng nhập tên thư mục');
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: newFolderName,
          description: newFolderDescription,
          parentId: newFolderParent || currentFolderId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create folder');
      }

      const folder = await response.json();
      toast.success('Đã tạo thư mục thành công');
      
      if (onFolderCreated) {
        onFolderCreated(folder);
      }
      
      // Reset form
      setNewFolderName('');
      setNewFolderDescription('');
      setNewFolderParent('');
      
    } catch (error) {
      console.error('Create folder error:', error);
      toast.error('Lỗi tạo thư mục');
    }
  };

  const handleEditFolder = async () => {
    if (!editingFolder || !editFolderName.trim()) {
      toast.error('Vui lòng nhập tên thư mục');
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/folders/${editingFolder._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: editFolderName,
          description: editFolderDescription,
          parentId: editFolderParent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update folder');
      }

      const folder = await response.json();
      toast.success('Đã cập nhật thư mục');
      
      if (onFolderUpdated) {
        onFolderUpdated(folder);
      }
      
      setEditingFolder(null);
      setEditFolderName('');
      setEditFolderDescription('');
      setEditFolderParent('');
      
    } catch (error) {
      console.error('Update folder error:', error);
      toast.error('Lỗi cập nhật thư mục');
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa thư mục này? Tất cả tài liệu bên trong sẽ bị xóa.')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/folders/${folderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete folder');
      }

      toast.success('Đã xóa thư mục');
      
      if (onFolderDeleted) {
        onFolderDeleted(folderId);
      }
      
    } catch (error) {
      console.error('Delete folder error:', error);
      toast.error('Lỗi xóa thư mục');
    }
  };

  const handleBulkAction = async () => {
    if (selectedFolders.size === 0) {
      toast.error('Vui lòng chọn thư mục');
      return;
    }

    try {
      const folderIds = Array.from(selectedFolders);
      
      if (bulkAction === 'delete') {
        if (!window.confirm(`Bạn có chắc muốn xóa ${folderIds.length} thư mục?`)) {
          return;
        }
        
        for (const folderId of folderIds) {
          await handleDeleteFolder(folderId);
        }
      } else if (bulkAction === 'move' && targetFolder) {
        const response = await fetch(`/api/projects/${projectId}/folders/bulk-move`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
          },
          body: JSON.stringify({
            folderIds,
            targetFolderId: targetFolder
          })
        });

        if (!response.ok) {
          throw new Error('Failed to move folders');
        }

        toast.success(`Đã di chuyển ${folderIds.length} thư mục`);
      }
      
      setSelectedFolders(new Set());
      
    } catch (error) {
      console.error('Bulk action error:', error);
      toast.error('Lỗi thực hiện thao tác');
    }
  };

  const handleFolderSelect = (folderId: string) => {
    const newSelected = new Set(selectedFolders);
    if (newSelected.has(folderId)) {
      newSelected.delete(folderId);
    } else {
      newSelected.add(folderId);
    }
    setSelectedFolders(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedFolders.size === folders.length) {
      setSelectedFolders(new Set());
    } else {
      setSelectedFolders(new Set(folders.map(f => f._id)));
    }
  };

  const startEditFolder = (folder: Folder) => {
    setEditingFolder(folder);
    setEditFolderName(folder.name);
    setEditFolderDescription(folder.description || '');
    setEditFolderParent(folder.parentId || '');
  };

  const getFolderPath = (folder: Folder): string => {
    // This would need to be implemented based on your folder structure
    return folder.name;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Quản lý thư mục</Typography>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant={activeTab === 'create' ? 'contained' : 'outlined'}
              onClick={() => setActiveTab('create')}
              startIcon={<CreateFolderIcon />}
            >
              Tạo mới
            </Button>
            <Button
              size="small"
              variant={activeTab === 'manage' ? 'contained' : 'outlined'}
              onClick={() => setActiveTab('manage')}
              startIcon={<EditIcon />}
            >
              Quản lý
            </Button>
          </Stack>
        </Stack>
      </DialogTitle>

      <DialogContent>
        {activeTab === 'create' ? (
          <Stack spacing={3}>
            <Typography variant="subtitle1">Tạo thư mục mới</Typography>
            
            <TextField
              label="Tên thư mục"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              fullWidth
              required
            />
            
            <TextField
              label="Mô tả"
              value={newFolderDescription}
              onChange={(e) => setNewFolderDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
            
            <FormControl fullWidth>
              <InputLabel>Thư mục cha</InputLabel>
              <Select
                value={newFolderParent}
                onChange={(e) => setNewFolderParent(e.target.value)}
                label="Thư mục cha"
              >
                <MenuItem value="">Thư mục gốc</MenuItem>
                {folders.map((folder) => (
                  <MenuItem key={folder._id} value={folder._id}>
                    {getFolderPath(folder)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        ) : (
          <Stack spacing={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1">
                Quản lý thư mục ({folders.length})
              </Typography>
              <Button
                size="small"
                onClick={handleSelectAll}
              >
                {selectedFolders.size === folders.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </Button>
            </Box>

            {selectedFolders.size > 0 && (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                <Stack spacing={2}>
                  <Typography variant="subtitle2">
                    Thao tác hàng loạt ({selectedFolders.size} thư mục)
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Thao tác</InputLabel>
                      <Select
                        value={bulkAction}
                        onChange={(e) => setBulkAction(e.target.value as any)}
                        label="Thao tác"
                      >
                        <MenuItem value="move">Di chuyển</MenuItem>
                        <MenuItem value="copy">Sao chép</MenuItem>
                        <MenuItem value="delete">Xóa</MenuItem>
                      </Select>
                    </FormControl>
                    
                    {bulkAction === 'move' && (
                      <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Thư mục đích</InputLabel>
                        <Select
                          value={targetFolder}
                          onChange={(e) => setTargetFolder(e.target.value)}
                          label="Thư mục đích"
                        >
                          {folders
                            .filter(f => !selectedFolders.has(f._id))
                            .map((folder) => (
                              <MenuItem key={folder._id} value={folder._id}>
                                {getFolderPath(folder)}
                              </MenuItem>
                            ))}
                        </Select>
                      </FormControl>
                    )}
                    
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleBulkAction}
                      disabled={bulkAction === 'move' && !targetFolder}
                    >
                      Thực hiện
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            )}

            <List>
              {folders.map((folder) => (
                <ListItem
                  key={folder._id}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: selectedFolders.has(folder._id) ? 'action.selected' : 'transparent'
                  }}
                >
                  <ListItemIcon>
                    <FolderIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={folder.name}
                    secondary={
                      <Stack spacing={1}>
                        <Typography variant="caption" color="text.secondary">
                          {folder.description}
                        </Typography>
                        <Stack direction="row" spacing={2}>
                          <Typography variant="caption">
                            {folder.documentCount} tài liệu
                          </Typography>
                          <Typography variant="caption">
                            {folder.subfolderCount} thư mục con
                          </Typography>
                          <Typography variant="caption">
                            Tạo bởi: {folder.createdBy.full_name}
                          </Typography>
                        </Stack>
                      </Stack>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        size="small"
                        onClick={() => startEditFolder(folder)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteFolder(folder._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Stack>
        )}

        {/* Edit Folder Dialog */}
        {editingFolder && (
          <Box sx={{ mt: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Chỉnh sửa thư mục: {editingFolder.name}
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Tên thư mục"
                value={editFolderName}
                onChange={(e) => setEditFolderName(e.target.value)}
                fullWidth
                size="small"
              />
              <TextField
                label="Mô tả"
                value={editFolderDescription}
                onChange={(e) => setEditFolderDescription(e.target.value)}
                fullWidth
                multiline
                rows={2}
                size="small"
              />
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleEditFolder}
                >
                  Lưu
                </Button>
                <Button
                  size="small"
                  onClick={() => setEditingFolder(null)}
                >
                  Hủy
                </Button>
              </Stack>
            </Stack>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Đóng
        </Button>
        {activeTab === 'create' && (
          <Button
            variant="contained"
            onClick={handleCreateFolder}
            disabled={!newFolderName.trim()}
          >
            Tạo thư mục
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
