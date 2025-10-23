"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "../../../../../ultis/axios";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";
import DocumentUpload from "@/components/DocumentUpload";
import DocumentPreview from "@/components/DocumentPreview";
import FolderManager from "@/components/FolderManager";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Stack,
  Grid,
  Alert,
  Tooltip,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  Breadcrumbs,
  Link
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  CloudUpload as UploadIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Description as DescriptionIcon,
  Image as ImageIcon,
  Code as CodeIcon,
  PictureAsPdf as PdfIcon,
  TableChart as SpreadsheetIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon
} from "@mui/icons-material";
import { toast } from "sonner";

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

type DocumentCategory = {
  _id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
};

export default function DocumentsPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);
  
  // State management
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy] = useState<"name" | "date" | "size" | "type">("date");
  const [sortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Dialog states
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [folderManagerOpen, setFolderManagerOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  
  // Current folder navigation
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath] = useState<Folder[]>([]);
  
  // Preview state
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/documents/project/${projectId}`, {
        params: {
          type: selectedCategory !== "all" ? selectedCategory : undefined,
          page: 1,
          limit: 100
        }
      });
      setDocuments(response.data.documents || []);
    } catch (e: unknown) {
      const error = e as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || 'Không thể tải tài liệu');
      toast.error(`Lỗi tải tài liệu: ${error?.response?.data?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedCategory]);

  const loadFolders = useCallback(async () => {
    try {
      // Tạm thời để trống vì API backend chưa có folder management
      setFolders([]);
    } catch (e: unknown) {
      console.error('Error loading folders:', e);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      // Sử dụng các loại tài liệu từ API backend
      const categories = [
        { _id: 'design', name: 'Thiết kế', description: 'Tài liệu thiết kế', color: '#1976d2', icon: 'design' },
        { _id: 'documentation', name: 'Tài liệu', description: 'Tài liệu hướng dẫn', color: '#388e3c', icon: 'documentation' },
        { _id: 'code', name: 'Mã nguồn', description: 'Source code', color: '#f57c00', icon: 'code' },
        { _id: 'presentation', name: 'Thuyết trình', description: 'Slide thuyết trình', color: '#7b1fa2', icon: 'presentation' },
        { _id: 'report', name: 'Báo cáo', description: 'Báo cáo dự án', color: '#d32f2f', icon: 'report' }
      ];
      setCategories(categories);
    } catch (e: unknown) {
      console.error('Error loading categories:', e);
    }
  }, []);

  useEffect(() => {
    if (!projectId) return;
    loadDocuments();
    loadFolders();
    loadCategories();
  }, [projectId, currentFolderId, loadDocuments, loadFolders, loadCategories]);

  // Search and filter handlers
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadDocuments();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedCategory, sortBy, sortOrder, loadDocuments]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  // Upload handlers
  const handleUploadComplete = () => {
    loadDocuments();
    setUploadDialogOpen(false);
  };

  // Folder navigation
  const navigateToFolder = (folderId: string | null) => {
    setCurrentFolderId(folderId);
  };


  // Document actions
  const handleDownload = async (document: Document) => {
    try {
      // Redirect to Firebase Storage URL
      window.open(document.file_url, '_blank');
      toast.success(`Đang tải xuống ${document.title}`);
    } catch (e: unknown) {
      const error = e as { response?: { data?: { message?: string } } };
      toast.error(`Lỗi tải xuống: ${error?.response?.data?.message || 'Unknown error'}`);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa tài liệu này?')) return;
    
    try {
      await axiosInstance.delete(`/api/documents/${documentId}`);
      toast.success('Đã xóa tài liệu');
      loadDocuments();
    } catch (e: unknown) {
      const error = e as { response?: { data?: { message?: string } } };
      toast.error(`Lỗi xóa: ${error?.response?.data?.message || 'Unknown error'}`);
    }
  };

  const handlePreview = (document: Document) => {
    setPreviewDocument(document);
    setPreviewDialogOpen(true);
  };

  // Folder actions
  const handleFolderCreated = () => {
    loadFolders();
  };

  const handleFolderUpdated = () => {
    loadFolders();
  };

  const handleFolderDeleted = () => {
    loadFolders();
  };

  // Utility functions

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

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c._id === categoryId);
    return category?.color || '#1976d2';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  if (loading && documents.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <ResponsiveSidebar />
        <main className="p-4 md:p-6 md:ml-64">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải tài liệu...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <ResponsiveSidebar />
      <main className="p-4 md:p-6 md:ml-64">
        <div className="mx-auto w-full max-w-7xl">
          {/* Header */}
          <div className="mb-6 md:mb-8 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-[10px] md:text-xs uppercase tracking-wider text-foreground/60">Dự án</div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">Quản lý tài liệu</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outlined"
                size="medium"
                startIcon={<AddIcon />}
                onClick={() => setFolderManagerOpen(true)}
              >
                Quản lý thư mục
              </Button>
              <Button
                variant="contained"
                size="medium"
                startIcon={<UploadIcon />}
                onClick={() => setUploadDialogOpen(true)}
              >
                Tải lên
              </Button>
              <Button
                variant="outlined"
                size="medium"
                onClick={() => router.back()}
              >
                Quay lại
              </Button>
            </div>
          </div>

          {/* Breadcrumbs */}
          <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} className="mb-4">
            <Link
              color="inherit"
              href="#"
              onClick={() => navigateToFolder(null)}
              className="flex items-center gap-1"
            >
              <HomeIcon fontSize="small" />
              Tài liệu
            </Link>
            {folderPath.map((folder) => (
              <Link
                key={folder._id}
                color="inherit"
                href="#"
                onClick={() => navigateToFolder(folder._id)}
                className="flex items-center gap-1"
              >
                <FolderIcon fontSize="small" />
                {folder.name}
              </Link>
            ))}
          </Breadcrumbs>

          {/* Search and Filter Bar */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                  <TextField
                    fullWidth
                    placeholder="Tìm kiếm tài liệu..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                    size="small"
                  />
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Danh mục</InputLabel>
                    <Select
                      value={selectedCategory}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      label="Danh mục"
                    >
                      <MenuItem value="all">Tất cả</MenuItem>
                      {categories.map((category) => (
                        <MenuItem key={category._id} value={category._id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<FilterIcon />}
                  >
                    Bộ lọc
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {/* Content */}
          {error ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          ) : (
            <>
              {/* Folders */}
              {folders.length > 0 && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Thư mục ({folders.length})
                    </Typography>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: '1fr',
                          sm: 'repeat(2, 1fr)',
                          md: 'repeat(3, 1fr)',
                          lg: 'repeat(4, 1fr)'
                        },
                        gap: 2
                      }}
                    >
                      {folders.map((folder) => (
                        <Box key={folder._id}>
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 2,
                              cursor: 'pointer',
                              '&:hover': { bgcolor: 'action.hover' }
                            }}
                            onClick={() => navigateToFolder(folder._id)}
                          >
                            <Stack direction="row" alignItems="center" spacing={2}>
                              <FolderIcon color="primary" />
                              <Box>
                                <Typography variant="subtitle2" noWrap>
                                  {folder.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {folder.documentCount} tài liệu
                                </Typography>
                              </Box>
                            </Stack>
                          </Paper>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Documents */}
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                      Tài liệu ({documents.length})
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant={viewMode === 'grid' ? 'contained' : 'outlined'}
                        onClick={() => setViewMode('grid')}
                      >
                        Lưới
                      </Button>
                      <Button
                        size="small"
                        variant={viewMode === 'list' ? 'contained' : 'outlined'}
                        onClick={() => setViewMode('list')}
                      >
                        Danh sách
                      </Button>
                    </Stack>
                  </Box>

                  {documents.length === 0 ? (
                    <Box textAlign="center" py={6}>
                      <DescriptionIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Chưa có tài liệu nào
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Tải lên tài liệu đầu tiên của bạn
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<UploadIcon />}
                        onClick={() => setUploadDialogOpen(true)}
                      >
                        Tải lên tài liệu
                      </Button>
                    </Box>
                  ) : viewMode === 'grid' ? (
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: '1fr',
                          sm: 'repeat(2, 1fr)',
                          md: 'repeat(3, 1fr)',
                          lg: 'repeat(4, 1fr)'
                        },
                        gap: 2
                      }}
                    >
                      {documents.map((document) => (
                        <Box key={document._id}>
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 2,
                              '&:hover': { boxShadow: 2 }
                            }}
                          >
                            <Stack spacing={2}>
                              <Box display="flex" alignItems="center" justifyContent="space-between">
                                {getFileIcon(document.type)}
                                <IconButton size="small">
                                  <MoreVertIcon />
                                </IconButton>
                              </Box>
                              <Box>
                                <Typography variant="subtitle2" noWrap title={document.title}>
                                  {document.title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  v{document.version} • {document.type}
                                </Typography>
                              </Box>
                              <Stack direction="row" spacing={1}>
                                <Button
                                  size="small"
                                  startIcon={<ViewIcon />}
                                  onClick={() => handlePreview(document)}
                                >
                                  Xem
                                </Button>
                                <Button
                                  size="small"
                                  startIcon={<DownloadIcon />}
                                  onClick={() => handleDownload(document)}
                                >
                                  Tải
                                </Button>
                              </Stack>
                            </Stack>
                          </Paper>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell padding="checkbox">
                              <Checkbox />
                            </TableCell>
                            <TableCell>Tên</TableCell>
                            <TableCell>Loại</TableCell>
                            <TableCell>Trạng thái</TableCell>
                            <TableCell>Ngày tạo</TableCell>
                            <TableCell>Người tạo</TableCell>
                            <TableCell align="right">Thao tác</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {documents.map((document) => (
                            <TableRow key={document._id} hover>
                              <TableCell padding="checkbox">
                                <Checkbox />
                              </TableCell>
                              <TableCell>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  {getFileIcon(document.type)}
                                  <Box>
                                    <Typography variant="body2" noWrap>
                                      {document.title}
                                    </Typography>
                                    {document.description && (
                                      <Typography variant="caption" color="text.secondary">
                                        {document.description}
                                      </Typography>
                                    )}
                                  </Box>
                                </Stack>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={document.type}
                                  size="small"
                                  sx={{ bgcolor: getCategoryColor(document.type) + '20', color: getCategoryColor(document.type) }}
                                />
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={document.status}
                                  size="small"
                                  color={getStatusColor(document.status)}
                                />
                              </TableCell>
                              <TableCell>
                                {new Date(document.createdAt).toLocaleDateString('vi-VN')}
                              </TableCell>
                              <TableCell>{document.created_by.full_name}</TableCell>
                              <TableCell align="right">
                                <Stack direction="row" spacing={1}>
                                  <Tooltip title="Xem trước">
                                    <IconButton size="small" onClick={() => handlePreview(document)}>
                                      <ViewIcon />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Tải xuống">
                                    <IconButton size="small" onClick={() => handleDownload(document)}>
                                      <DownloadIcon />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Thao tác khác">
                                    <IconButton size="small">
                                      <MoreVertIcon />
                                    </IconButton>
                                  </Tooltip>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>

      {/* Document Upload Component */}
      <DocumentUpload
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        projectId={projectId}
        folderId={currentFolderId || undefined}
        onUploadComplete={handleUploadComplete}
      />

      {/* Folder Manager Component */}
      <FolderManager
        open={folderManagerOpen}
        onClose={() => setFolderManagerOpen(false)}
        projectId={projectId}
        folders={folders}
        currentFolderId={currentFolderId || undefined}
        onFolderCreated={handleFolderCreated}
        onFolderUpdated={handleFolderUpdated}
        onFolderDeleted={handleFolderDeleted}
      />

      {/* Document Preview Component */}
      <DocumentPreview
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        document={previewDocument}
        onDownload={handleDownload}
        onEdit={(doc) => {
          // Handle edit document
          console.log('Edit document:', doc);
        }}
        onDelete={(doc) => handleDelete(doc._id)}
        onShare={(doc) => {
          // Handle share document
          console.log('Share document:', doc);
        }}
      />
    </div>
  );
}
