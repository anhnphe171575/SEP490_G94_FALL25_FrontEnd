"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Fab,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  CalendarToday as CalendarIcon,
  VideoCall as VideoCallIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as AccessTimeIcon,
  Group as GroupIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { DatePicker, TimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { vi } from "date-fns/locale";
import axiosInstance from "../../ultis/axios";

type Meeting = {
  _id: string;
  topic: string;
  description?: string;
  meeting_date: string;
  start_time: string;
  end_time: string;
  duration: number;
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled";
  meeting_type: "regular" | "urgent" | "review" | "presentation";
  location: string;
  google_meet_link?: string;
  meeting_notes?: string;
  reject_reason?: string;
  mentor_id: {
    _id: string;
    full_name: string;
    email: string;
    avatar: string;
  };
  requested_by: {
    _id: string;
    full_name: string;
    email: string;
    avatar: string;
  };
  attendees: Array<{
    _id: string;
    user_id: {
      _id: string;
      full_name: string;
      email: string;
      avatar: string;
    } | null;
    status: "invited" | "accepted" | "declined" | "tentative";
    response_date?: string;
  }>;
  created_by: {
    _id: string;
    full_name: string;
    email: string;
    avatar: string;
  };
  createAt: string;
  updateAt: string;
};

interface MeetingCalendarProps {
  projectId: string;
  currentUserId: string;
  userRole: string;
  isTeamLeader: boolean;
  isMentor: boolean;
}

export default function MeetingCalendar({
  projectId,
  currentUserId,
  userRole,
  isTeamLeader,
  isMentor,
}: MeetingCalendarProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dialog states
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    topic: "",
    description: "",
    meeting_date: new Date(),
    start_time: "",
    end_time: "",
    meeting_type: "regular" as const,
    location: "Online",
    google_meet_link: "",
    attendees: [] as string[],
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Load meetings
  const loadMeetings = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/meetings/project/${projectId}`, {
        params: {
          month: currentMonth.getMonth() + 1,
          year: currentMonth.getFullYear(),
        },
      });
      setMeetings(response.data.data);
    } catch (error: any) {
      setError(error?.response?.data?.message || "Không thể tải danh sách lịch họp");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, [projectId, currentMonth]);

  // Create meeting
  const handleCreateMeeting = async () => {
    try {
      setSubmitting(true);
      const response = await axiosInstance.post(`/api/meetings/project/${projectId}`, {
        ...formData,
        meeting_date: formData.meeting_date.toISOString().split('T')[0],
      });
      
      setMeetings([...meetings, response.data.data]);
      setOpenCreateDialog(false);
      setSuccess(response.data.message || "Tạo lịch họp thành công!");
      setTimeout(() => setSuccess(null), 3000);
      resetForm();
    } catch (error: any) {
      setError(error?.response?.data?.message || "Không thể tạo lịch họp");
    } finally {
      setSubmitting(false);
    }
  };

  // Update meeting status
  const handleUpdateStatus = async (meetingId: string, status: string, rejectReason?: string) => {
    try {
      const response = await axiosInstance.put(`/api/meetings/${meetingId}/status`, {
        status,
        reject_reason: rejectReason,
      });
      
      setMeetings(meetings.map(m => 
        m._id === meetingId ? response.data.data : m
      ));
      setSuccess(`Lịch họp đã được ${status === 'approved' ? 'xác nhận' : 'từ chối'}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error?.response?.data?.message || "Không thể cập nhật trạng thái");
    }
  };

  // Delete meeting
  const handleDeleteMeeting = async (meetingId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa lịch họp này?")) return;
    
    try {
      await axiosInstance.delete(`/api/meetings/${meetingId}`);
      setMeetings(meetings.filter(m => m._id !== meetingId));
      setSuccess("Lịch họp đã được xóa");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error?.response?.data?.message || "Không thể xóa lịch họp");
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      topic: "",
      description: "",
      meeting_date: new Date(),
      start_time: "",
      end_time: "",
      meeting_type: "regular",
      location: "Online",
      google_meet_link: "",
      attendees: [],
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "warning";
      case "approved": return "success";
      case "rejected": return "error";
      case "completed": return "info";
      case "cancelled": return "default";
      default: return "default";
    }
  };

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "Chờ xác nhận";
      case "approved": return "Đã xác nhận";
      case "rejected": return "Đã từ chối";
      case "completed": return "Đã hoàn thành";
      case "cancelled": return "Đã hủy";
      default: return status;
    }
  };

  // Get meeting type text
  const getMeetingTypeText = (type: string) => {
    switch (type) {
      case "regular": return "Thường";
      case "urgent": return "Khẩn cấp";
      case "review": return "Review";
      default: return type;
    }
  };

  // Format time
  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Check if user can create meeting - Tất cả thành viên đều có thể tạo lịch họp
  const canCreateMeeting = true; // Tất cả thành viên đều có thể tạo lịch họp

  // Check if user can manage meeting
  const canManageMeeting = (meeting: Meeting) => {
    return isMentor || 
           meeting.created_by._id === currentUserId ||
           meeting.requested_by._id === currentUserId;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <Typography variant="h4" className="font-bold">
            Lịch họp dự án
          </Typography>
          <div className="flex gap-2">
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadMeetings}
              disabled={loading}
            >
              Làm mới
            </Button>
            {canCreateMeeting && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenCreateDialog(true)}
              >
                Tạo lịch họp
              </Button>
            )}
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Calendar Navigation */}
        <Card>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <Typography variant="h6">
                {currentMonth.toLocaleDateString('vi-VN', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </Typography>
              <div className="flex gap-2">
                <Button
                  variant="outlined"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                >
                  Tháng trước
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setCurrentMonth(new Date())}
                >
                  Hôm nay
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                >
                  Tháng sau
                </Button>
              </div>
            </div>

            {/* Meetings List */}
            {loading ? (
              <div className="flex justify-center py-8">
                <CircularProgress />
              </div>
            ) : meetings.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <Typography variant="h6" className="mb-2 text-gray-600">
                  Không có lịch họp nào
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {canCreateMeeting 
                    ? "Tạo lịch họp đầu tiên cho dự án này" 
                    : "Chưa có lịch họp nào được lên lịch"
                  }
                </Typography>
              </div>
            ) : (
              <div className="space-y-4">
                {meetings.map((meeting) => (
                  <Paper key={meeting._id} className="p-6 hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        {/* Header với thông tin quan trọng */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <Typography variant="h5" className="font-bold text-gray-800 mb-2">
                              {meeting.topic}
                            </Typography>
                            <div className="flex items-center gap-3 mb-3">
                              <Chip
                                label={getStatusText(meeting.status)}
                                color={getStatusColor(meeting.status) as any}
                                size="medium"
                                className="font-semibold"
                              />
                              <Chip
                                label={getMeetingTypeText(meeting.meeting_type)}
                                variant="outlined"
                                size="medium"
                                color="primary"
                              />
                            </div>
                          </div>
                          
                          {/* Thời gian nổi bật */}
                          <div className="text-right bg-blue-50 p-3 rounded-lg border">
                            <div className="text-sm text-blue-600 font-medium">Ngày họp</div>
                            <div className="text-lg font-bold text-blue-800">
                              {formatDate(meeting.meeting_date)}
                            </div>
                            <div className="text-sm text-blue-600 font-medium mt-1">
                              {formatTime(meeting.start_time)} - {formatTime(meeting.end_time)}
                            </div>
                          </div>
                        </div>

                        {/* Thông tin chi tiết */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-gray-700">
                              <LocationIcon className="w-5 h-5 text-green-600" />
                              <span className="font-medium">{meeting.location}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                              <PersonIcon className="w-5 h-5 text-purple-600" />
                              <span><strong>Mentor:</strong> {meeting.mentor_id.full_name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                              <PersonIcon className="w-5 h-5 text-orange-600" />
                              <span><strong>Yêu cầu bởi:</strong> {meeting.requested_by.full_name}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {meeting.attendees.length > 0 && (
                              <div className="flex items-center gap-2 text-gray-700">
                                <GroupIcon className="w-5 h-5 text-indigo-600" />
                                <span><strong>{meeting.attendees.length +1}</strong> người tham dự</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-gray-700">
                              <AccessTimeIcon className="w-5 h-5 text-red-600" />
                              <span><strong>Thời lượng:</strong> {meeting.duration} phút</span>
                            </div>
                          </div>
                        </div>

                        {/* Mô tả */}
                        {meeting.description && (
                          <div className="bg-gray-50 p-3 rounded-lg mb-4">
                            <Typography variant="body2" className="text-gray-700 italic">
                              "{meeting.description}"
                            </Typography>
                          </div>
                        )}

                        {/* Google Meet Link - nổi bật */}
                        {meeting.google_meet_link && (
                          <div className="mb-4">
                            <Button
                              variant="contained"
                              startIcon={<VideoCallIcon />}
                              href={meeting.google_meet_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                            >
                              🎥 Tham gia Google Meet
                            </Button>
                          </div>
                        )}

                        {/* Lý do từ chối */}
                        {meeting.reject_reason && (
                          <Alert severity="error" className="mt-2">
                            <strong>Lý do từ chối:</strong> {meeting.reject_reason}
                          </Alert>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-2 ml-6">
                        {canManageMeeting(meeting) && (
                          <>
                            {isMentor && meeting.status === 'pending' && (
                              <>
                                <Tooltip title="Xác nhận lịch họp">
                                  <IconButton
                                    onClick={() => handleUpdateStatus(meeting._id, 'approved')}
                                    color="success"
                                    className="bg-green-100 hover:bg-green-200"
                                  >
                                    <CheckCircleIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Từ chối lịch họp">
                                  <IconButton
                                    onClick={() => {
                                      const reason = prompt('Lý do từ chối:');
                                      if (reason) {
                                        handleUpdateStatus(meeting._id, 'rejected', reason);
                                      }
                                    }}
                                    color="error"
                                    className="bg-red-100 hover:bg-red-200"
                                  >
                                    <CancelIcon />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                            
                            <Tooltip title="Xóa lịch họp">
                              <IconButton
                                onClick={() => handleDeleteMeeting(meeting._id)}
                                color="error"
                                className="bg-red-100 hover:bg-red-200"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </div>
                    </div>
                  </Paper>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Meeting Dialog */}
        <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle className="text-center font-bold text-xl">
            Tạo lịch họp mới
          </DialogTitle>
          <DialogContent>
            <div className="space-y-6 pt-4">
              {/* Thông tin cơ bản */}
              <div className="space-y-4">
                <Typography variant="h6" className="font-semibold text-gray-700 border-b pb-2">
                  📋 Thông tin cuộc họp
                </Typography>
                
                <TextField
                  fullWidth
                  label="Chủ đề cuộc họp"
                  value={formData.topic}
                  onChange={(e) => setFormData({...formData, topic: e.target.value})}
                  required
                  placeholder="Ví dụ: Báo cáo tiến độ tuần 4"
                />
                
                <TextField
                  fullWidth
                  label="Mô tả chi tiết"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  multiline
                  rows={3}
                  placeholder="Mô tả nội dung và mục đích cuộc họp..."
                />
              </div>

              {/* Thời gian và địa điểm */}
              <div className="space-y-4">
                <Typography variant="h6" className="font-semibold text-gray-700 border-b pb-2">
                  📅 Thời gian & Địa điểm
                </Typography>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DatePicker
                    label="Ngày họp"
                    value={formData.meeting_date}
                    onChange={(date) => setFormData({...formData, meeting_date: date || new Date()})}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                  
                  <FormControl fullWidth>
                    <InputLabel>Loại cuộc họp</InputLabel>
                    <Select
                      value={formData.meeting_type}
                      onChange={(e) => setFormData({...formData, meeting_type: e.target.value as any})}
                    >
                      <MenuItem value="regular">Thường</MenuItem>
                      <MenuItem value="urgent">Khẩn cấp</MenuItem>
                      <MenuItem value="review">Báo cáo tiến độ</MenuItem>
                    </Select>
                  </FormControl>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextField
                    fullWidth
                    label="Thời gian bắt đầu"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Thời gian kết thúc"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                  />
                </div>

                <TextField
                  fullWidth
                  label="Địa điểm"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Online hoặc phòng họp cụ thể"
                />
              </div>

              {/* Thông tin bổ sung */}
              <div className="space-y-4">
                <Typography variant="h6" className="font-semibold text-gray-700 border-b pb-2">
                  🔗 Thông tin bổ sung
                </Typography>
                
                <TextField
                  fullWidth
                  label="Link Google Meet (tùy chọn)"
                  value={formData.google_meet_link}
                  onChange={(e) => setFormData({...formData, google_meet_link: e.target.value})}
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  helperText="Có thể để trống và thêm sau"
                />
              </div>
            </div>
          </DialogContent>
          <DialogActions className="px-6 py-4 bg-gray-50">
            <Button 
              onClick={() => setOpenCreateDialog(false)}
              variant="outlined"
              fullWidth
            >
              Hủy
            </Button>
            <Button
              onClick={handleCreateMeeting}
              variant="contained"
              disabled={submitting || !formData.topic || !formData.start_time || !formData.end_time}
              fullWidth
              className="ml-2"
            >
              {submitting ? <CircularProgress size={20} /> : "Tạo lịch họp"}
            </Button>
          </DialogActions>
        </Dialog>

      </div>
    </LocalizationProvider>
  );
}
