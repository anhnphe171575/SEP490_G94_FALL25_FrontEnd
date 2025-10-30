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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
  Divider,
} from "@mui/material";
import {
  CalendarToday as CalendarIcon,
  VideoCall as VideoCallIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Group as GroupIcon,
  AccessTime as AccessTimeIcon,
  Add as AddIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
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
  const [createMeetingOpen, setCreateMeetingOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

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

  const meetingsToDisplay = meetingsData?.allMeetings || [];

  // Generate calendar grid
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
    
    const days = [];
    const currentDate = new Date(startDate);
    
    // Generate 6 weeks (42 days) to ensure full calendar view
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  // Get meetings for a specific day
  const getMeetingsForDay = (date: Date) => {
    return meetingsToDisplay.filter(meeting => {
      const meetingDate = new Date(meeting.meeting_date);
      return meetingDate.toDateString() === date.toDateString();
    });
  };

  // Handle meeting click
  const handleMeetingClick = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setDetailDialogOpen(true);
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if date is in current month
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  
  // Generate month and year options
  const months = [
    { value: 0, label: 'Tháng 1' },
    { value: 1, label: 'Tháng 2' },
    { value: 2, label: 'Tháng 3' },
    { value: 3, label: 'Tháng 4' },
    { value: 4, label: 'Tháng 5' },
    { value: 5, label: 'Tháng 6' },
    { value: 6, label: 'Tháng 7' },
    { value: 7, label: 'Tháng 8' },
    { value: 8, label: 'Tháng 9' },
    { value: 9, label: 'Tháng 10' },
    { value: 10, label: 'Tháng 11' },
    { value: 11, label: 'Tháng 12' },
  ];
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 3 + i); // 3 years before to 6 years after
  
  const handleMonthChange = (month: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), month, 1));
  };
  
  const handleYearChange = (year: number) => {
    setCurrentMonth(new Date(year, currentMonth.getMonth(), 1));
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <style>{`
        /* Custom scrollbar for calendar cells - Horizontal */
        .calendar-scroll::-webkit-scrollbar {
          height: 4px;
          width: 4px;
        }
        .calendar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .calendar-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 2px;
        }
        .calendar-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
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
                Lịch họp của tôi
              </h1>
            </div>
          </div>

          {/* Month Navigation & Controls */}
          <Card className="mb-6" sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                {/* Month & Year Selection */}
                <div className="flex items-center gap-2">
                  <select
                    value={currentMonth.getMonth()}
                    onChange={(e) => handleMonthChange(Number(e.target.value))}
                    className="px-2 py-1.5 rounded-md text-sm font-medium text-gray-900 bg-white border border-white focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer hover:bg-gray-50 transition-all"
                    style={{ minWidth: '100px' }}
                  >
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={currentMonth.getFullYear()}
                    onChange={(e) => handleYearChange(Number(e.target.value))}
                    className="px-2 py-1.5 rounded-md text-sm font-medium text-gray-900 bg-white border border-white focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer hover:bg-gray-50 transition-all"
                    style={{ minWidth: '80px' }}
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setCurrentMonth(new Date())}
                    sx={{ 
                      borderColor: 'rgba(255,255,255,0.5)',
                      color: 'white',
                      fontSize: '0.875rem',
                      py: 0.75,
                      px: 2,
                      '&:hover': {
                        borderColor: 'white',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                      }
                    }}
                  >
                    Hôm nay
                  </Button>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calendar Grid */}
          {loading ? (
            <Card>
              <CardContent className="flex justify-center items-center py-20">
                <CircularProgress />
              </CardContent>
            </Card>
          ) : (
            <Card sx={{ overflow: 'hidden', boxShadow: 3 }}>
              <CardContent sx={{ p: 0 }}>
                {/* Week Days Header */}
                <div className="grid grid-cols-7 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  {weekDays.map((day) => (
                    <div key={day} className="text-center py-2 font-semibold text-xs md:text-sm">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days Grid */}
                <div className="grid grid-cols-7 gap-px bg-gray-200">
                  {calendarDays.map((date, index) => {
                    const dayMeetings = getMeetingsForDay(date);
                    const isCurrentDay = isToday(date);
                    const isInCurrentMonth = isCurrentMonth(date);
                    
                    return (
                      <div
                        key={index}
                        className={`h-[110px] bg-white p-1.5 relative transition-all duration-200 hover:shadow-lg flex flex-col ${
                          !isInCurrentMonth ? 'bg-gray-50' : ''
                        } ${isCurrentDay ? 'ring-2 ring-blue-500' : ''}`}
                      >
                        {/* Date Number - Fixed */}
                        <div className="flex justify-between items-start mb-1 flex-shrink-0">
                          <span className={`text-xs font-semibold ${
                            isCurrentDay 
                              ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' 
                              : !isInCurrentMonth 
                                ? 'text-gray-400' 
                                : 'text-gray-700'
                          }`}>
                            {date.getDate()}
                          </span>
                          {dayMeetings.length > 0 && (
                            <Badge badgeContent={dayMeetings.length} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', height: '16px', minWidth: '16px', padding: '0 4px' } }} />
                          )}
                        </div>

                        {/* Meetings List - Horizontal Scroll */}
                        <div className="flex-1 overflow-x-auto overflow-y-hidden calendar-scroll pb-0.5" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}>
                          <div className="flex gap-1 h-full">
                            {dayMeetings.map((meeting, idx) => (
                              <div
                                key={meeting._id}
                                onClick={() => handleMeetingClick(meeting)}
                                className={`text-[10px] p-1 rounded cursor-pointer transition-all hover:scale-105 flex-shrink-0 w-full ${
                                  meeting.status === 'approved' 
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                    : meeting.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                      : meeting.status === 'rejected'
                                        ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                }`}
                              >
                                <div className="font-semibold truncate leading-tight mb-0.5">{meeting.topic}</div>
                                <div className="text-[9px] leading-tight space-y-0.5">
                                  <div className="flex items-center gap-0.5">
                                    <AccessTimeIcon sx={{ fontSize: '10px' }} />
                                    <span className="truncate">{formatTime(meeting.start_time)}-{formatTime(meeting.end_time)}</span>
                                  </div>
                                  {meeting.location && (
                                    <div className="flex items-center gap-0.5">
                                      <LocationIcon sx={{ fontSize: '10px' }} />
                                      <span className="truncate">{meeting.location}</span>
                                    </div>
                                  )}
                                  {meeting.google_meet_link && (
                                    <div className="flex items-center gap-0.5">
                                      <VideoCallIcon sx={{ fontSize: '10px' }} />
                                      <span className="text-blue-600">Meet</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
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

      {/* Meeting Detail Modal */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
                    borderRadius: 3,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }
        }}
      >
        {selectedMeeting && (
          <>
            <DialogTitle sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              p: 3,
              position: 'relative'
            }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={2}>
                  <CalendarIcon sx={{ fontSize: 32 }} />
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {selectedMeeting.topic}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {selectedMeeting.project_id?.topic || 'Dự án'}
                          </Typography>
                  </Box>
                </Box>
                <IconButton
                  onClick={() => setDetailDialogOpen(false)}
                  sx={{
                    color: 'white',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
              <div className="space-y-4 mt-2">
                {/* Status & Type */}
                <div className="flex gap-2">
                            <Chip
                    label={getStatusText(selectedMeeting.status)}
                    color={getStatusColor(selectedMeeting.status) as any}
                              size="medium"
                              className="font-semibold"
                            />
                            <Chip
                    label={getMeetingTypeText(selectedMeeting.meeting_type)}
                              variant="outlined"
                              size="medium"
                              color="primary"
                            />
                        </div>
                        
                <Divider />

                {/* Date & Time */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Typography variant="body2" color="primary" fontWeight="bold" className="mb-1">
                        📅 Ngày họp
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatDate(selectedMeeting.meeting_date)}
                      </Typography>
                          </div>
                    <div>
                      <Typography variant="body2" color="primary" fontWeight="bold" className="mb-1">
                        ⏰ Thời gian
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatTime(selectedMeeting.start_time)} - {formatTime(selectedMeeting.end_time)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({selectedMeeting.duration} phút)
                      </Typography>
                          </div>
                        </div>
                      </div>

                {/* Location */}
                <Paper elevation={1} sx={{ p: 2, backgroundColor: '#f8fafc' }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <LocationIcon color="success" />
                    <Typography variant="body2" fontWeight="bold" color="text.secondary">
                      Địa điểm
                    </Typography>
                  </Box>
                  <Typography variant="body1">{selectedMeeting.location}</Typography>
                </Paper>

                {/* People */}
                <Paper elevation={1} sx={{ p: 2, backgroundColor: '#f8fafc' }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <PersonIcon color="primary" />
                    <Typography variant="body2" fontWeight="bold" color="text.secondary">
                      Người tham gia
                    </Typography>
                  </Box>
                        <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Chip
                        icon={<PersonIcon />}
                        label={`Mentor: ${selectedMeeting.mentor_id?.full_name || 'N/A'}`}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                          </div>
                    <div className="flex items-center gap-2">
                      <Chip
                        icon={<PersonIcon />}
                        label={`Yêu cầu bởi: ${selectedMeeting.requested_by?.full_name || 'N/A'}`}
                        color="secondary"
                        variant="outlined"
                        size="small"
                      />
                        </div>
                      </div>
                </Paper>

                      {/* Description */}
                {selectedMeeting.description && (
                  <Paper elevation={1} sx={{ p: 2, backgroundColor: '#f8fafc' }}>
                    <Typography variant="body2" fontWeight="bold" color="text.secondary" className="mb-2">
                      📝 Mô tả
                    </Typography>
                    <Typography variant="body2" className="italic">
                      {selectedMeeting.description}
                          </Typography>
                  </Paper>
                      )}

                      {/* Google Meet Link */}
                {selectedMeeting.google_meet_link && (
                          <Button
                            variant="contained"
                    fullWidth
                            startIcon={<VideoCallIcon />}
                    href={selectedMeeting.google_meet_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              fontWeight: 'bold',
                              py: 1.5,
                              '&:hover': {
                                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                              }
                            }}
                          >
                            🎥 Tham gia Google Meet
                          </Button>
                      )}

                      {/* Reject Reason */}
                {selectedMeeting.reject_reason && (
                  <Alert severity="error">
                    <Typography variant="body2">
                      <strong>Lý do từ chối:</strong> {selectedMeeting.reject_reason}
                    </Typography>
                        </Alert>
                      )}
                    </div>
            </DialogContent>

            <DialogActions sx={{ p: 3, backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
              {/* Mentor Actions */}
              {canManageMeeting(selectedMeeting) && selectedMeeting.status === 'pending' && (
                <>
                  <Button
                    variant="contained"
                    startIcon={<CheckIcon />}
                    onClick={() => {
                      handleMeetingStatusUpdate(selectedMeeting._id, 'approved');
                      setDetailDialogOpen(false);
                    }}
                    sx={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      }
                    }}
                  >
                    Chấp nhận
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<CancelIcon />}
                    onClick={() => {
                      const reason = prompt('Nhập lý do từ chối (tùy chọn):');
                      handleMeetingStatusUpdate(selectedMeeting._id, 'rejected', reason || 'Không có lý do cụ thể');
                      setDetailDialogOpen(false);
                    }}
                    sx={{
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                      }
                    }}
                  >
                    Từ chối
                  </Button>
                </>
              )}
              <Button
                onClick={() => setDetailDialogOpen(false)}
                variant="outlined"
                sx={{ ml: 'auto' }}
              >
                Đóng
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </div>
  );
}
