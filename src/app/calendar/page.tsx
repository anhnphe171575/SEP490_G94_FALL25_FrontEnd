"use client";

import { useState, useEffect } from "react";
import {
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Button,
  Chip,
  Paper,
  Box,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  CalendarToday as CalendarIcon,
  VideoCall as VideoCallIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Group as GroupIcon,
  AccessTime as AccessTimeIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import axiosInstance from "../../../ultis/axios";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";
import CreateMeetingModal from "@/components/CreateMeetingModal";

interface Meeting {
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
  project_id: {
    _id: string;
    topic: string;
    code: string;
  };
  created_by: {
      _id: string;
      full_name: string;
      email: string;
    avatar: string;
  };
  createAt: string;
  updateAt: string;
}

interface MeetingsData {
  allMeetings: Meeting[];
  meetingsByRole: {
    asMentor: Meeting[];
    asLeader: Meeting[];
    asMember: Meeting[];
    asCreator: Meeting[];
  };
  statistics: {
  total: number;
    asMentor: number;
    asLeader: number;
    asMember: number;
    asCreator: number;
  };
}

export default function CalendarPage() {
  const [meetingsData, setMeetingsData] = useState<MeetingsData | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createMeetingOpen, setCreateMeetingOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load user info from API
        const userResponse = await axiosInstance.get('/api/users/me');
        const user = userResponse.data;
        setCurrentUserId(user._id);
        setUserRole(user.role.toString());

        // Load all meetings for user
        const response = await axiosInstance.get('/api/meetings/user/all', {
          params: {
            month: currentMonth.getMonth() + 1,
            year: currentMonth.getFullYear(),
          },
        });
        
        setMeetingsData(response.data.data);
        
      } catch (error: any) {
        console.error('Error loading data:', error);
        setError(error?.response?.data?.message || "Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

      loadData();
  }, [currentMonth]);

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
      default: return status;
    }
  };

  // Get meeting type text
  const getMeetingTypeText = (type: string) => {
    switch (type) {
      case "regular": return "Thường";
      case "urgent": return "Khẩn cấp";
      case "review": return "Báo cáo tiến độ";
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


  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <ResponsiveSidebar />
        <main className="p-4 md:p-6 md:ml-64">
          <div className="flex justify-center items-center min-h-screen">
            <CircularProgress />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <ResponsiveSidebar />
        <main className="p-4 md:p-6 md:ml-64">
          <Alert severity="error">{error}</Alert>
        </main>
      </div>
    );
  }

  // Handle meeting status update
  const handleMeetingStatusUpdate = async (meetingId: string, status: 'approved' | 'rejected', rejectReason?: string) => {
    try {
      const response = await axiosInstance.put(`/api/meetings/${meetingId}/status`, {
        status,
        reject_reason: rejectReason
      });
      
      if (response.data.success) {
        // Reload data to reflect changes
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Error updating meeting status:', error);
      setError(error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  // Check if user can manage meeting (mentor for their projects)
  const canManageMeeting = (meeting: Meeting) => {
    return userRole === "4" && meeting.mentor_id?._id === currentUserId;
  };
  const meetingsToDisplay = (meetingsData?.allMeetings || []).filter(meeting => {
    const matchesSearch = meeting.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         meeting.project_id?.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         meeting.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || meeting.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <ResponsiveSidebar />
      <main className="p-4 md:p-6 md:ml-64">
        <div className="mx-auto w-full max-w-7xl">
          {/* Header */}
          <div className="mb-6 md:mb-8 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-[10px] md:text-xs uppercase tracking-wider text-gray-500 font-medium">📅 Lịch họp</div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Tất cả lịch họp của tôi
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outlined"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                sx={{
                  borderColor: '#d1d5db',
                  color: '#6b7280',
                  '&:hover': {
                    borderColor: '#9ca3af',
                    backgroundColor: '#f9fafb',
                    color: '#374151'
                  }
                }}
              >
                ← Tháng trước
              </Button>
              <Button
                variant="outlined"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                sx={{
                  borderColor: '#d1d5db',
                  color: '#6b7280',
                  '&:hover': {
                    borderColor: '#9ca3af',
                    backgroundColor: '#f9fafb',
                    color: '#374151'
                  }
                }}
              >
                Tháng sau →
              </Button>
            </div>
          </div>

          {/* Month Navigation */}
          <Card className="mb-6" sx={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            borderRadius: 3
          }}>
            <CardContent sx={{ py: 3 }}>
              <Typography 
                variant="h4" 
                className="text-center font-bold"
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 'bold',
                  fontSize: '2rem',
                  letterSpacing: '0.025em'
                }}
              >
                {currentMonth.toLocaleDateString('vi-VN', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </Typography>
            </CardContent>
          </Card>

          {/* Navigation Bar */}
          <Card className="mb-6" sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Left side - Actions */}
            <div className="flex flex-wrap gap-2">
              {/* Show create meeting button for role 1 (Student/Student Leader) and role 4 (Mentor) */}
              {(userRole === "1" || userRole === "4") && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateMeetingOpen(true)}
                  sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.3)',
                    }
                  }}
                >
                  Tạo lịch họp
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => {
                  window.location.reload();
                }}
                sx={{ 
                  borderColor: 'rgba(255,255,255,0.5)',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  }
                }}
              >
                Làm mới
              </Button>
            </div>

                {/* Right side - Search and Filter */}
                <div className="flex flex-wrap gap-2 items-center">
                  {/* Search */}
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm lịch họp..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-56 bg-white text-gray-900 placeholder-gray-500"
                      style={{ color: '#1f2937', height: '36px', fontSize: '14px' }}
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                    style={{ color: '#1f2937', height: '36px', fontSize: '14px' }}
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="pending">Chờ xác nhận</option>
                    <option value="approved">Đã xác nhận</option>
                    <option value="rejected">Đã từ chối</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>



          {/* Results Summary */}
          {meetingsToDisplay.length > 0 && (
            <div className="mb-4 flex items-center justify-between">
              <Typography variant="body2" color="text.secondary">
                Hiển thị {meetingsToDisplay.length} lịch họp
                {searchTerm && ` cho "${searchTerm}"`}
                {statusFilter !== "all" && ` với trạng thái "${getStatusText(statusFilter)}"`}
              </Typography>
              <div className="flex gap-2">
              </div>
            </div>
          )}

          {/* Meetings List */}
          {meetingsToDisplay.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <Typography variant="h6" className="mb-2 text-gray-600">
                  Không có lịch họp nào
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Chưa có lịch họp nào trong tháng này
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {meetingsToDisplay.map((meeting) => (
                <Paper 
                  key={meeting._id} 
                  className="p-6 hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500"
                  sx={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                    borderRadius: 3,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    }
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <Typography variant="h5" className="font-bold text-gray-800 mb-2">
                            {meeting.topic || 'Chưa có tiêu đề'}
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
                            <Chip
                              label={meeting.project_id?.topic || 'Dự án không xác định'}
                              variant="outlined"
                              size="small"
                              color="secondary"
                            />
                          </div>
                        </div>
                        
                        {/* Time */}
                        <div className="text-right bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 shadow-sm">
                          <div className="text-sm text-blue-600 font-medium mb-1">📅 Ngày họp</div>
                          <div className="text-lg font-bold text-blue-800 mb-2">
                            {meeting.meeting_date ? formatDate(meeting.meeting_date) : 'Chưa xác định'}
                          </div>
                          <div className="text-sm text-blue-600 font-medium bg-white px-2 py-1 rounded-lg shadow-sm">
                            ⏰ {meeting.start_time ? formatTime(meeting.start_time) : '--:--'} - {meeting.end_time ? formatTime(meeting.end_time) : '--:--'}
                          </div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-700">
                            <LocationIcon className="w-5 h-5 text-green-600" />
                            <span className="font-medium">{meeting.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <PersonIcon className="w-5 h-5 text-purple-600" />
                            <span><strong>Mentor:</strong> {meeting.mentor_id?.full_name || 'Chưa xác định'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <PersonIcon className="w-5 h-5 text-orange-600" />
                            <span><strong>Yêu cầu bởi:</strong> {meeting.requested_by?.full_name || 'Chưa xác định'}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-700">
                            <AccessTimeIcon className="w-5 h-5 text-red-600" />
                            <span><strong>Thời lượng:</strong> {meeting.duration} phút</span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {meeting.description && (
                        <div className="bg-gray-50 p-3 rounded-lg mb-4">
                          <Typography variant="body2" className="text-gray-700 italic">
                            "{meeting.description}"
                          </Typography>
                        </div>
                      )}

                      {/* Mentor Actions - Accept/Reject */}
                      {canManageMeeting(meeting) && meeting.status === 'pending' && (
                        <Box sx={{ mb: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
                          <Tooltip title="Chấp nhận cuộc họp">
                            <Button
                              variant="contained"
                              startIcon={<CheckIcon />}
                              onClick={() => handleMeetingStatusUpdate(meeting._id, 'approved')}
                              sx={{
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white',
                                fontWeight: 'bold',
                                borderRadius: 2,
                                px: 3,
                                py: 1.5,
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                '&:hover': {
                                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                                  transform: 'translateY(-1px)',
                                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                }
                              }}
                            >
                              ✅ Chấp nhận
                            </Button>
                          </Tooltip>
                          
                          <Tooltip title="Từ chối cuộc họp">
                            <Button
                              variant="contained"
                              startIcon={<CancelIcon />}
                              onClick={() => {
                                const reason = prompt('Nhập lý do từ chối (tùy chọn):');
                                handleMeetingStatusUpdate(meeting._id, 'rejected', reason || 'Không có lý do cụ thể');
                              }}
                              sx={{
                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                color: 'white',
                                fontWeight: 'bold',
                                borderRadius: 2,
                                px: 3,
                                py: 1.5,
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                '&:hover': {
                                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                                  transform: 'translateY(-1px)',
                                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                }
                              }}
                            >
                              ❌ Từ chối
                            </Button>
                          </Tooltip>
                        </Box>
                      )}

                      {/* Google Meet Link */}
                      {meeting.google_meet_link && (
                        <div className="mb-4">
                          <Button
                            variant="contained"
                            startIcon={<VideoCallIcon />}
                            href={meeting.google_meet_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              fontWeight: 'bold',
                              borderRadius: 2,
                              px: 3,
                              py: 1.5,
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                                transform: 'translateY(-1px)',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                              }
                            }}
                          >
                            🎥 Tham gia Google Meet
                          </Button>
                        </div>
                      )}

                      {/* Reject Reason */}
                      {meeting.reject_reason && (
                        <Alert severity="error" className="mt-2">
                          <strong>Lý do từ chối:</strong> {meeting.reject_reason}
                        </Alert>
                      )}
                    </div>
                  </div>
                </Paper>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Meeting Modal */}
      <CreateMeetingModal
        open={createMeetingOpen}
        onClose={() => setCreateMeetingOpen(false)}
        onSuccess={() => {
          // Reload data after successful creation
          window.location.reload();
        }}
      />
    </div>
  );
}
