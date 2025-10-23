"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Avatar,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Paper,
  LinearProgress,
  Badge,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Person as PersonIcon,
  Work as WorkIcon,
  BugReport as BugIcon,
  Comment as CommentIcon,
  Timeline as TimelineIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  School as SchoolIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Close as CloseIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  SupervisorAccount as SupervisorAccountIcon,
} from "@mui/icons-material";
import axiosInstance from "../../ultis/axios";

interface MemberDetailProps {
  open: boolean;
  onClose: () => void;
  memberId: string;
  projectId: string;
  memberName: string;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  deadline: string;
  assigner_id: {
    _id: string;
    full_name: string;
    email: string;
  };
  assignee_id: {
    _id: string;
    full_name: string;
    email: string;
  };
  feature_id: {
    _id: string;
    title: string;
    description: string;
  };
  type_id: {
    _id: string;
    name: string;
    description: string;
  };
}

interface Defect {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  deadline: string;
  assigner_id: {
    _id: string;
    full_name: string;
    email: string;
  };
  function: {
    _id: string;
    name: string;
    description: string;
  };
  severity_id: {
    _id: string;
    name: string;
    description: string;
  };
}

interface Comment {
  _id: string;
  content: string;
  createdAt: string;
  task_id?: {
    _id: string;
    title: string;
  };
  feature_id?: {
    _id: string;
    title: string;
  };
  milestone_id?: {
    _id: string;
    title: string;
  };
  defect_id?: {
    _id: string;
    title: string;
  };
}

interface Activity {
  _id: string;
  action: string;
  metadata: any;
  createdAt: string;
  milestone_id?: {
    _id: string;
    title: string;
  };
}

interface MemberDetailData {
  member: {
    _id: string;
    user_id: {
      _id: string;
      full_name: string;
      email: string;
      phone: string;
      major: string;
      avatar: string;
      dob: string;
      address: Array<{
        street: string;
        city: string;
        postalCode: string;
        contry: string;
      }>;
      role: {
        _id: string;
        name: string;
        description: string;
      };
    };
    team_leader: number;
    user_details: any;
  };
  statistics: {
    tasks: {
      total: number;
      pending: number;
      inProgress: number;
      completed: number;
      overdue: number;
    };
    defects: {
      total: number;
      open: number;
      inProgress: number;
      resolved: number;
      closed: number;
    };
    avgDelay: number;
    totalComments: number;
    totalActivities: number;
  };
  assignedTasks: Task[];
  assignedByUser: Task[];
  assignedDefects: Defect[];
  assignedDefectsByUser: Defect[];
  recentComments: Comment[];
  recentActivities: Activity[];
}

export default function MemberDetail({
  open,
  onClose,
  memberId,
  projectId,
  memberName,
}: MemberDetailProps) {
  const [data, setData] = useState<MemberDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (open && memberId && projectId) {
      fetchMemberDetail();
    }
  }, [open, memberId, projectId]);

  const fetchMemberDetail = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance.get(
        `/api/team/${projectId}/members/${memberId}`
      );
      setData(response.data.data);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Không thể tải thông tin thành viên");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
      case "Resolved":
      case "Closed":
        return "success";
      case "In Progress":
        return "warning";
      case "Pending":
      case "Open":
        return "info";
      case "Overdue":
        return "error";
      default:
        return "default";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
      case "High":
        return "error";
      case "Medium":
        return "warning";
      case "Low":
        return "success";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const calculateAge = (dob: string) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PersonIcon className="text-blue-500" />
          <Typography variant="h6">
            Chi tiết thành viên: {memberName}
          </Typography>
        </div>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent className="p-0">
        {loading && <LinearProgress />}
        
        {error && (
          <Alert severity="error" className="m-4">
            {error}
          </Alert>
        )}

        {data && (
          <div className="p-6">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-6">
                <Avatar
                  src={data.member.user_id.avatar}
                  className="w-24 h-24 border-4 border-white shadow-lg"
                >
                  {getInitials(data.member.user_id.full_name)}
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Typography variant="h4" className="font-bold text-gray-900 dark:text-white">
                      {data.member.user_id.full_name}
                    </Typography>
                    {data.member.team_leader === 1 && (
                      <Chip
                        label="Trưởng nhóm"
                        color="primary"
                        icon={<SupervisorAccountIcon />}
                        className="shadow-sm"
                      />
                    )}
                  </div>
                  <Typography variant="h6" className="text-gray-600 dark:text-gray-300 mb-2">
                    {data.member.user_id.role?.name || "Thành viên"}
                  </Typography>
                  <Typography variant="body1" className="text-gray-500 dark:text-gray-400">
                    {data.member.user_id.major || "Chưa cập nhật chuyên ngành"}
                  </Typography>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <Card className="mb-6 shadow-sm">
              <CardContent className="p-6">
                <Typography variant="h6" className="mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-200">
                  <EmailIcon className="text-blue-500" />
                  Thông tin liên hệ
                </Typography>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <EmailIcon className="w-5 h-5 text-blue-500" />
                    <div>
                      <Typography variant="body2" className="text-gray-500 dark:text-gray-400">
                        Email
                      </Typography>
                      <Typography variant="body1" className="font-medium">
                        {data.member.user_id.email}
                      </Typography>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <PhoneIcon className="w-5 h-5 text-green-500" />
                    <div>
                      <Typography variant="body2" className="text-gray-500 dark:text-gray-400">
                        Điện thoại
                      </Typography>
                      <Typography variant="body1" className="font-medium">
                        {data.member.user_id.phone}
                      </Typography>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <CalendarIcon className="w-5 h-5 text-purple-500" />
                    <div>
                      <Typography variant="body2" className="text-gray-500 dark:text-gray-400">
                        Tuổi
                      </Typography>
                      <Typography variant="body1" className="font-medium">
                        {calculateAge(data.member.user_id.dob)} tuổi
                      </Typography>
                    </div>
                  </div>
                  {data.member.user_id.address && data.member.user_id.address.length > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg md:col-span-2 lg:col-span-1">
                      <LocationIcon className="w-5 h-5 text-orange-500" />
                      <div>
                        <Typography variant="body2" className="text-gray-500 dark:text-gray-400">
                          Địa chỉ
                        </Typography>
                        <Typography variant="body1" className="font-medium">
                          {data.member.user_id.address[0].city}, {data.member.user_id.address[0].contry}
                        </Typography>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Statistics Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Task Statistics */}
              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <Typography variant="h6" className="mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-200">
                    <AssignmentIcon className="text-blue-500" />
                    Thống kê Task
                  </Typography>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Typography variant="h3" className="text-blue-600 font-bold">
                        {data.statistics.tasks.total}
                      </Typography>
                      <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
                        Tổng cộng
                      </Typography>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <Typography variant="h3" className="text-green-600 font-bold">
                        {data.statistics.tasks.completed}
                      </Typography>
                      <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
                        Hoàn thành
                      </Typography>
                    </div>
                    <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <Typography variant="h3" className="text-orange-600 font-bold">
                        {data.statistics.tasks.inProgress}
                      </Typography>
                      <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
                        Đang làm
                      </Typography>
                    </div>
                    <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <Typography variant="h3" className="text-red-600 font-bold">
                        {data.statistics.tasks.overdue}
                      </Typography>
                      <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
                        Trễ hạn
                      </Typography>
                    </div>
                  </div>

                  {data.statistics.avgDelay > 0 && (
                    <Alert severity="warning" className="border-l-4 border-orange-400">
                      <Typography variant="body2" className="font-medium">
                        ⚠️ Độ trễ trung bình: {data.statistics.avgDelay} ngày
                      </Typography>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Activity Summary */}
              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <Typography variant="h6" className="mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-200">
                    <TrendingUpIcon className="text-green-500" />
                    Hoạt động
                  </Typography>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CommentIcon className="w-5 h-5 text-blue-500" />
                        <Typography variant="body1">Comments</Typography>
                      </div>
                      <Typography variant="h6" className="font-bold text-blue-600">
                        {data.statistics.totalComments}
                      </Typography>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <TimelineIcon className="w-5 h-5 text-green-500" />
                        <Typography variant="body1">Hoạt động</Typography>
                      </div>
                      <Typography variant="h6" className="font-bold text-green-600">
                        {data.statistics.totalActivities}
                      </Typography>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <BugIcon className="w-5 h-5 text-red-500" />
                        <Typography variant="body1">Defects</Typography>
                      </div>
                      <Typography variant="h6" className="font-bold text-red-600">
                        {data.statistics.defects.total}
                      </Typography>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Card className="shadow-sm">
              <Box className="border-b">
                <Tabs 
                  value={activeTab} 
                  onChange={(e, newValue) => setActiveTab(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                  className="px-4"
                >
                  <Tab 
                    label="Tasks được giao" 
                    icon={<AssignmentIcon />} 
                    iconPosition="start"
                    className="min-w-0"
                  />
                  <Tab 
                    label="Tasks đã giao" 
                    icon={<AssignmentIcon />} 
                    iconPosition="start"
                    className="min-w-0"
                  />
                  <Tab 
                    label="Defects" 
                    icon={<BugIcon />} 
                    iconPosition="start"
                    className="min-w-0"
                  />
                  <Tab 
                    label="Comments gần đây" 
                    icon={<CommentIcon />} 
                    iconPosition="start"
                    className="min-w-0"
                  />
                  <Tab 
                    label="Hoạt động" 
                    icon={<TimelineIcon />} 
                    iconPosition="start"
                    className="min-w-0"
                  />
                </Tabs>
              </Box>

              {/* Tab Content */}
              <Box className="p-6">
                {/* Assigned Tasks Tab */}
                {activeTab === 0 && (
                  <div className="space-y-3">
                    {data.assignedTasks.length === 0 ? (
                      <div className="text-center py-12">
                        <AssignmentIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <Typography variant="h6" className="text-gray-600 mb-2">
                          Chưa có task nào được giao
                        </Typography>
                        <Typography variant="body2" className="text-gray-500">
                          Thành viên này chưa được giao task nào trong dự án
                        </Typography>
                      </div>
                    ) : (
                      <>
                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <Typography variant="body2" className="font-semibold text-blue-700 dark:text-blue-300">
                            📋 Tổng số: {data.assignedTasks.length} tasks
                          </Typography>
                        </div>
                        {data.assignedTasks.map((task) => (
                          <Card key={task._id} className="hover:shadow-lg transition-all border-l-4 border-blue-500">
                            <CardContent className="p-4">
                              {/* Header */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <Typography variant="h6" className="mb-1 font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <AssignmentIcon className="w-5 h-5 text-blue-500" />
                                    {task.title}
                                  </Typography>
                                </div>
                                <div className="flex gap-2 ml-4">
                                  <Chip
                                    label={task.status}
                                    color={getStatusColor(task.status) as any}
                                    size="small"
                                    className="font-semibold"
                                  />
                                  {new Date(task.deadline) < new Date() && task.status !== 'Completed' && (
                                    <Chip
                                      label="Trễ"
                                      color="error"
                                      size="small"
                                      icon={<WarningIcon />}
                                      className="font-semibold animate-pulse"
                                    />
                                  )}
                                </div>
                              </div>

                              {/* Description */}
                              {task.description && (
                                <Typography variant="body2" className="mb-3 text-gray-600 dark:text-gray-400 pl-7">
                                  {task.description}
                                </Typography>
                              )}

                              {/* Info Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pl-7">
                                <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <div>
                                    <Typography variant="caption" className="text-gray-500 block">
                                      Feature
                                    </Typography>
                                    <Typography variant="body2" className="font-semibold">
                                      {task.feature_id?.title || 'N/A'}
                                    </Typography>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                  <CalendarIcon className="w-4 h-4 text-orange-500" />
                                  <div>
                                    <Typography variant="caption" className="text-gray-500 block">
                                      Deadline
                                    </Typography>
                                    <Typography variant="body2" className="font-semibold">
                                      {formatDate(task.deadline)}
                                    </Typography>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                  <div>
                                    <Typography variant="caption" className="text-gray-500 block">
                                      Loại task
                                    </Typography>
                                    <Typography variant="body2" className="font-semibold">
                                      {task.type_id?.name || 'N/A'}
                                    </Typography>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </>
                    )}
                  </div>
                )}

                {/* Assigned By User Tab */}
                {activeTab === 1 && (
                  <div className="space-y-3">
                    {data.assignedByUser.length === 0 ? (
                      <div className="text-center py-12">
                        <AssignmentIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <Typography variant="h6" className="text-gray-600 mb-2">
                          Chưa giao task nào
                        </Typography>
                        <Typography variant="body2" className="text-gray-500">
                          Thành viên này chưa giao task nào cho ai
                        </Typography>
                      </div>
                    ) : (
                      <>
                        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <Typography variant="body2" className="font-semibold text-green-700 dark:text-green-300">
                            📤 Đã giao: {data.assignedByUser.length} tasks
                          </Typography>
                        </div>
                        {data.assignedByUser.map((task) => (
                          <Card key={task._id} className="hover:shadow-lg transition-all border-l-4 border-green-500">
                            <CardContent className="p-4">
                              {/* Header */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <Typography variant="h6" className="mb-1 font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <AssignmentIcon className="w-5 h-5 text-green-500" />
                                    {task.title}
                                  </Typography>
                                </div>
                                <Chip
                                  label={task.status}
                                  color={getStatusColor(task.status) as any}
                                  size="small"
                                  className="font-semibold ml-4"
                                />
                              </div>

                              {/* Description */}
                              {task.description && (
                                <Typography variant="body2" className="mb-3 text-gray-600 dark:text-gray-400 pl-7">
                                  {task.description}
                                </Typography>
                              )}

                              {/* Info Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pl-7">
                                <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <div>
                                    <Typography variant="caption" className="text-gray-500 block">
                                      Feature
                                    </Typography>
                                    <Typography variant="body2" className="font-semibold">
                                      {task.feature_id?.title || 'N/A'}
                                    </Typography>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                  <PersonIcon className="w-4 h-4 text-purple-500" />
                                  <div>
                                    <Typography variant="caption" className="text-gray-500 block">
                                      Người thực hiện
                                    </Typography>
                                    <Typography variant="body2" className="font-semibold">
                                      {task.assignee_id?.full_name || 'N/A'}
                                    </Typography>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                  <CalendarIcon className="w-4 h-4 text-orange-500" />
                                  <div>
                                    <Typography variant="caption" className="text-gray-500 block">
                                      Deadline
                                    </Typography>
                                    <Typography variant="body2" className="font-semibold">
                                      {formatDate(task.deadline)}
                                    </Typography>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </>
                    )}
                  </div>
                )}

                {/* Defects Tab */}
                {activeTab === 2 && (
                  <div className="space-y-4">
                    {data.assignedDefects.length === 0 ? (
                      <div className="text-center py-12">
                        <BugIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <Typography variant="h6" className="text-gray-600 mb-2">
                          Chưa có defect nào
                        </Typography>
                        <Typography variant="body2" className="text-gray-500">
                          Thành viên này chưa được giao defect nào
                        </Typography>
                      </div>
                    ) : (
                      data.assignedDefects.map((defect) => (
                        <Card key={defect._id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <Typography variant="h6" className="mb-2 font-semibold text-gray-900 dark:text-white">
                                  {defect.title}
                                </Typography>
                                {defect.description && (
                                  <Typography variant="body2" className="mb-3 text-gray-600 dark:text-gray-400">
                                    {defect.description}
                                  </Typography>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-500">Function:</span>
                                    <span className="font-medium">{defect.function?.name || 'N/A'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-500">Mức độ:</span>
                                    <span className="font-medium">{defect.severity_id?.name || 'N/A'}</span>
                                  </div>
                                  {defect.deadline && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-gray-500">Deadline:</span>
                                      <span className="font-medium">{formatDate(defect.deadline)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2 ml-4">
                                <Chip
                                  label={defect.status}
                                  color={getStatusColor(defect.status) as any}
                                  size="small"
                                  className="font-medium"
                                />
                                <Chip
                                  label={defect.priority}
                                  color={getPriorityColor(defect.priority) as any}
                                  size="small"
                                  className="font-medium"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                )}

                {/* Recent Comments Tab */}
                {activeTab === 3 && (
                  <div className="space-y-4">
                    {data.recentComments.length === 0 ? (
                      <div className="text-center py-12">
                        <CommentIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <Typography variant="h6" className="text-gray-600 mb-2">
                          Chưa có comment nào
                        </Typography>
                        <Typography variant="body2" className="text-gray-500">
                          Thành viên này chưa có comment nào trong dự án
                        </Typography>
                      </div>
                    ) : (
                      data.recentComments.map((comment) => (
                        <Card key={comment._id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <Typography variant="body1" className="mb-3 text-gray-900 dark:text-white">
                              {comment.content}
                            </Typography>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="w-4 h-4" />
                                {formatDateTime(comment.createdAt)}
                              </span>
                              {comment.task_id && (
                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                                  Task: {comment.task_id?.title || 'N/A'}
                                </span>
                              )}
                              {comment.feature_id && (
                                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs">
                                  Feature: {comment.feature_id?.title || 'N/A'}
                                </span>
                              )}
                              {comment.defect_id && (
                                <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs">
                                  Defect: {comment.defect_id?.title || 'N/A'}
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                )}

                {/* Recent Activities Tab */}
                {activeTab === 4 && (
                  <div className="space-y-4">
                    {data.recentActivities.length === 0 ? (
                      <div className="text-center py-12">
                        <TimelineIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <Typography variant="h6" className="text-gray-600 mb-2">
                          Chưa có hoạt động nào
                        </Typography>
                        <Typography variant="body2" className="text-gray-500">
                          Thành viên này chưa có hoạt động nào trong dự án
                        </Typography>
                      </div>
                    ) : (
                      data.recentActivities.map((activity) => (
                        <Card key={activity._id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <Typography variant="body1" className="mb-3 text-gray-900 dark:text-white">
                              {activity.action}
                            </Typography>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="w-4 h-4" />
                                {formatDateTime(activity.createdAt)}
                              </span>
                              {activity.milestone_id && (
                                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">
                                  Milestone: {activity.milestone_id?.title || 'N/A'}
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                )}
            </Box>
            </Card>
          </div>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
      </DialogActions>
    </Dialog>
  );
}
