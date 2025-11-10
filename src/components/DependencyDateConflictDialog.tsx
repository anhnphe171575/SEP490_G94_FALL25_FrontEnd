import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Stack,
  Divider,
  Chip,
} from '@mui/material';
import { 
  WarningAmber as WarningIcon,
  AutoFixHigh as AutoFixIcon,
  Edit as EditIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface DependencyDateConflictDialogProps {
  open: boolean;
  onClose: () => void;
  onAutoFix: () => void;
  onManualEdit: () => void;
  violation: {
    message: string;
    suggestion?: string;
    current_start_date?: string;
    current_deadline?: string;
    required_start_date?: string;
    required_deadline?: string;
    predecessor_deadline?: string;
    predecessor_start_date?: string;
    lag_days?: number;
  };
  taskTitle?: string;
  predecessorTitle?: string;
}

export default function DependencyDateConflictDialog({
  open,
  onClose,
  onAutoFix,
  onManualEdit,
  violation,
  taskTitle = 'Current Task',
  predecessorTitle = 'Predecessor Task',
}: DependencyDateConflictDialogProps) {
  
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  const calculateNewEndDate = () => {
    if (!violation.current_start_date || !violation.current_deadline || !violation.required_start_date) {
      return 'N/A';
    }
    
    const currentStart = new Date(violation.current_start_date);
    const currentEnd = new Date(violation.current_deadline);
    const newStart = new Date(violation.required_start_date);
    
    const duration = Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24));
    const newEnd = new Date(newStart);
    newEnd.setDate(newEnd.getDate() + duration);
    
    return newEnd.toLocaleDateString('vi-VN');
  };

  const calculateDuration = () => {
    if (!violation.current_start_date || !violation.current_deadline) {
      return 0;
    }
    
    const currentStart = new Date(violation.current_start_date);
    const currentEnd = new Date(violation.current_deadline);
    return Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24));
  };

  const duration = calculateDuration();
  const newEndDate = calculateNewEndDate();

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 2, 
        pt: 3,
        px: 3,
      }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: '#fff3cd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <WarningIcon sx={{ fontSize: 24, color: '#ff9800' }} />
          </Box>
          <Box>
            <Typography fontSize="18px" fontWeight={700} color="text.primary">
              Xung Đột Ngày Tháng
            </Typography>
            <Typography fontSize="13px" color="text.secondary" sx={{ mt: 0.5 }}>
              Dependency Mandatory vi phạm quy tắc ngày tháng
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2 }}>
        <Stack spacing={2.5}>
          {/* Error Message */}
          <Alert 
            severity="warning" 
            icon={false}
            sx={{ 
              bgcolor: '#fff8e1',
              border: '1px solid #ffe082',
              borderRadius: 2,
            }}
          >
            <Typography fontSize="13px" fontWeight={600} color="#f57c00" sx={{ mb: 0.5 }}>
              ⚠️ Vấn Đề
            </Typography>
            <Typography fontSize="13px" color="text.primary">
              {violation.message}
            </Typography>
            {violation.suggestion && (
              <Typography fontSize="12px" color="text.secondary" sx={{ mt: 1 }}>
                💡 {violation.suggestion}
              </Typography>
            )}
          </Alert>

          {/* Current Dates */}
          <Box sx={{ 
            bgcolor: '#f5f5f5', 
            p: 2, 
            borderRadius: 2,
            border: '1px solid #e0e0e0',
          }}>
            <Typography fontSize="12px" fontWeight={700} color="text.secondary" sx={{ mb: 1.5 }}>
              📅 NGÀY HIỆN TẠI
            </Typography>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography fontSize="13px" color="text.secondary">
                  Bắt đầu:
                </Typography>
                <Typography fontSize="13px" fontWeight={600} color="text.primary">
                  {formatDate(violation.current_start_date)}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography fontSize="13px" color="text.secondary">
                  Kết thúc:
                </Typography>
                <Typography fontSize="13px" fontWeight={600} color="text.primary">
                  {formatDate(violation.current_deadline)}
                </Typography>
              </Stack>
              {duration > 0 && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography fontSize="13px" color="text.secondary">
                    Thời lượng:
                  </Typography>
                  <Chip
                    label={`${duration} ngày`}
                    size="small"
                    sx={{ 
                      height: 20,
                      fontSize: '11px',
                      fontWeight: 600,
                      bgcolor: '#e3f2fd',
                      color: '#1976d2',
                    }}
                  />
                </Stack>
              )}
            </Stack>
          </Box>

          {/* Required Dates */}
          <Box sx={{ 
            bgcolor: '#e8f5e9', 
            p: 2, 
            borderRadius: 2,
            border: '1px solid #a5d6a7',
          }}>
            <Typography fontSize="12px" fontWeight={700} color="#2e7d32" sx={{ mb: 1.5 }}>
              ✅ NGÀY SAU KHI ĐIỀU CHỈNH
            </Typography>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography fontSize="13px" color="text.secondary">
                  Bắt đầu:
                </Typography>
                <Typography fontSize="13px" fontWeight={600} color="#2e7d32">
                  {formatDate(violation.required_start_date)}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography fontSize="13px" color="text.secondary">
                  Kết thúc:
                </Typography>
                <Typography fontSize="13px" fontWeight={600} color="#2e7d32">
                  {newEndDate}
                </Typography>
              </Stack>
              {duration > 0 && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography fontSize="13px" color="text.secondary">
                    Thời lượng:
                  </Typography>
                  <Chip
                    label={`${duration} ngày (giữ nguyên)`}
                    size="small"
                    sx={{ 
                      height: 20,
                      fontSize: '11px',
                      fontWeight: 600,
                      bgcolor: '#c8e6c9',
                      color: '#2e7d32',
                    }}
                  />
                </Stack>
              )}
            </Stack>
          </Box>

          <Divider />

          {/* Action Options */}
          <Box>
            <Typography fontSize="12px" fontWeight={700} color="text.secondary" sx={{ mb: 1.5 }}>
              🎯 CHỌN HÀNH ĐỘNG
            </Typography>
            <Typography fontSize="13px" color="text.secondary">
              Bạn có thể tự động điều chỉnh ngày hoặc chỉnh sửa thủ công.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2.5, gap: 1 }}>
        <Button
          onClick={onClose}
          startIcon={<CloseIcon />}
          sx={{ 
            color: 'text.secondary',
            textTransform: 'none',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          Hủy Bỏ
        </Button>

        <Box sx={{ flex: 1 }} />

        <Button
          onClick={onManualEdit}
          variant="outlined"
          startIcon={<EditIcon />}
          sx={{ 
            textTransform: 'none',
            fontSize: '13px',
            fontWeight: 600,
            borderColor: '#7b68ee',
            color: '#7b68ee',
            '&:hover': {
              borderColor: '#6952d6',
              bgcolor: '#f5f3ff',
            }
          }}
        >
          Chỉnh Thủ Công
        </Button>

        <Button
          onClick={onAutoFix}
          variant="contained"
          startIcon={<AutoFixIcon />}
          sx={{ 
            textTransform: 'none',
            fontSize: '13px',
            fontWeight: 600,
            bgcolor: '#7b68ee',
            '&:hover': {
              bgcolor: '#6952d6',
            }
          }}
        >
          Tự Động Điều Chỉnh
        </Button>
      </DialogActions>
    </Dialog>
  );
}

