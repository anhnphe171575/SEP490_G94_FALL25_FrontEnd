"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "../../../ultis/axios";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";
import { getSocket } from "@/components/ResponsiveSidebar";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Alert,
  CircularProgress,
  TextField,
  Button,
  Avatar,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  IconButton,
  InputAdornment,
  Fade,
  Slide,
  Skeleton,
  Badge,
  Chip,
} from "@mui/material";
import {
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  Circle as CircleIcon,
} from "@mui/icons-material";

type Project = {
  _id: string;
  topic: string;
  code: string;
  description?: string;
};

type Message = {
  _id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  content: string;
  createdAt: string;
  read: boolean;
};

type Conversation = {
  _id: string;
  project_id: string;
  project?: Project;
  customerId?: string;
  staffId?: string;
  lastMessageAt?: string;
  lastMessage?: string;
  unreadCount?: number;
};

export default function MessagesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageContent, setMessageContent] = useState("");
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUserInfo();
    fetchProjects();
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchMessages(selectedProjectId);
      setupSocketListeners();
    }
    return () => {
      // Cleanup socket listeners
    };
  }, [selectedProjectId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchUserInfo = async () => {
    try {
      const res = await axiosInstance.get('/api/users/me');
      if (res.data?._id || res.data?.id) {
        setCurrentUserId(res.data._id || res.data.id);
      }
    } catch {
      // ignore
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await axiosInstance.get('/api/projects');
      const data = res.data;
      const projectsList = Array.isArray(data) ? data : (data?.projects || []);
      setProjects(projectsList);
    } catch (err: any) {
      console.error("Error fetching projects:", err);
      setError(err?.response?.data?.message || "Không thể tải danh sách dự án");
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      const res = await axiosInstance.get('/api/conversations');
      const convs = Array.isArray(res.data) ? res.data : (res.data?.conversations || []);
      setConversations(convs);
    } catch {
      // ignore - conversations might not exist yet
    }
  };

  const fetchMessages = async (projectId: string) => {
    try {
      setLoadingMessages(true);
      // Find or create conversation
      let conversation = conversations.find(c => c.project_id === projectId);
      if (!conversation) {
        // Try to find conversation by project
        try {
          const res = await axiosInstance.get(`/api/conversations/project/${projectId}`);
          conversation = res.data;
        } catch {
          // Create new conversation if not exists
          try {
            const createRes = await axiosInstance.post('/api/conversations', {
              project_id: projectId
            });
            conversation = createRes.data;
            setConversations(prev => [...prev, conversation!]);
          } catch (createErr) {
            console.error("Error creating conversation:", createErr);
            return;
          }
        }
      }

      if (conversation?._id) {
        const msgRes = await axiosInstance.get(`/api/messages/conversation/${conversation._id}`);
        const msgs = Array.isArray(msgRes.data) ? msgRes.data : (msgRes.data?.messages || []);
        setMessages(msgs);
      }
    } catch (err: any) {
      console.error("Error fetching messages:", err);
      setError(err?.response?.data?.message || "Không thể tải tin nhắn");
    } finally {
      setLoadingMessages(false);
    }
  };

  const setupSocketListeners = () => {
    const socket = getSocket();
    
    socket.on('newMessage', (data: { message: Message; conversationId: string }) => {
      if (data.conversationId && selectedProjectId) {
        // Check if this message belongs to current conversation
        const currentConv = conversations.find(c => c.project_id === selectedProjectId);
        if (currentConv?._id === data.conversationId) {
          setMessages(prev => [...prev, data.message]);
        }
      }
    });

    socket.on('messagesRead', (data: { conversationId: string; userId: string }) => {
      // Update read status if needed
    });

    return () => {
      socket.off('newMessage');
      socket.off('messagesRead');
    };
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !selectedProjectId || sending) return;

    try {
      setSending(true);
      
      // Find or get conversation
      let conversation = conversations.find(c => c.project_id === selectedProjectId);
      if (!conversation) {
        const createRes = await axiosInstance.post('/api/conversations', {
          project_id: selectedProjectId
        });
        conversation = createRes.data;
        setConversations(prev => [...prev, conversation!]);
      }

      if (!conversation?._id) {
        throw new Error('Không thể tạo cuộc trò chuyện');
      }

      const socket = getSocket();
      socket.emit('sendMessage', {
        conversationId: conversation._id,
        content: messageContent.trim()
      });

      setMessageContent("");
    } catch (err: any) {
      console.error("Error sending message:", err);
      setError(err?.response?.data?.message || "Không thể gửi tin nhắn");
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const getProjectForConversation = (conv: Conversation) => {
    return projects.find(p => p._id === conv.project_id) || conv.project;
  };

  const getAvatarColor = (str: string) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
      '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#6C5CE7'
    ];
    const index = str.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <ResponsiveSidebar />
        <main className="p-4 md:p-6 md:ml-64">
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <Stack spacing={2} alignItems="center">
              <CircularProgress size={40} sx={{ color: '#FF6B6B' }} />
              <Typography variant="body2" color="text.secondary">
                Đang tải...
              </Typography>
            </Stack>
          </Box>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <ResponsiveSidebar />
      <main className="p-4 md:p-6 md:ml-64 transition-all duration-300">
        <div className="mx-auto w-full max-w-7xl">
          {/* Header with animation */}
          <Fade in timeout={600}>
            <div className="mb-6 md:mb-8">
              <div className="text-[10px] md:text-xs uppercase tracking-wider text-slate-600 mb-1 font-medium">
                Tin nhắn
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Tin nhắn nhóm
              </h1>
            </div>
          </Fade>

          {error && (
            <Fade in timeout={300}>
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3,
                  borderRadius: 2,
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }} 
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            </Fade>
          )}

          <Box 
            sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: selectedProjectId ? '350px 1fr' : '1fr' }, 
              gap: 3,
              height: 'calc(100vh - 180px)',
              transition: 'all 0.3s ease-in-out'
            }}
          >
            {/* Projects/Conversations Window */}
            <Slide direction="right" in={!selectedProjectId || window.innerWidth >= 900} timeout={400}>
              <Card 
                sx={{ 
                  display: { xs: selectedProjectId ? 'none' : 'flex', md: 'flex' }, 
                  overflow: 'hidden', 
                  flexDirection: 'column',
                  borderRadius: 3,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.9)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    boxShadow: '0 15px 40px rgba(0,0,0,0.15)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <Box 
                  sx={{ 
                    p: 2.5, 
                    borderBottom: '2px solid',
                    borderColor: 'divider',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white'
                  }}
                >
                  <Typography variant="h6" fontWeight={700}>
                    Dự án
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    {projects.length} dự án
                  </Typography>
                </Box>
                <CardContent sx={{ flex: 1, overflow: 'auto', p: 0 }}>
                  <List sx={{ p: 0 }}>
                    {projects.map((project, index) => {
                      const conv = conversations.find(c => c.project_id === project._id);
                      const unreadCount = conv?.unreadCount || 0;
                      const isSelected = selectedProjectId === project._id;
                      return (
                        <Fade in timeout={300} key={project._id} style={{ transitionDelay: `${index * 50}ms` }}>
                          <ListItem
                            component="button"
                            onClick={() => setSelectedProjectId(project._id)}
                            sx={{
                              backgroundColor: isSelected 
                                ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                                : 'transparent',
                              borderLeft: isSelected ? '4px solid' : '4px solid transparent',
                              borderColor: isSelected ? 'primary.main' : 'transparent',
                              '&:hover': { 
                                backgroundColor: 'rgba(102, 126, 234, 0.05)',
                                transform: 'translateX(4px)',
                              },
                              width: '100%',
                              textAlign: 'left',
                              border: 'none',
                              cursor: 'pointer',
                              py: 1.5,
                              px: 2,
                              transition: 'all 0.2s ease-in-out',
                              position: 'relative',
                              overflow: 'hidden',
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: isSelected ? '4px' : '0px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                transition: 'width 0.3s ease-in-out'
                              }
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar 
                                sx={{ 
                                  bgcolor: getAvatarColor(project.code || project.topic),
                                  width: 42,
                                  height: 42,
                                  fontWeight: 700,
                                  fontSize: '1rem',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                  transition: 'transform 0.2s ease-in-out',
                                  '&:hover': {
                                    transform: 'scale(1.08) rotate(5deg)'
                                  }
                                }}
                              >
                                {project.code?.[0]?.toUpperCase() || project.topic?.[0]?.toUpperCase() || 'P'}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography variant="subtitle1" fontWeight={600}>
                                  {project.topic || project.code}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="caption" color="text.secondary">
                                  {project.code}
                                </Typography>
                              }
                            />
                            {unreadCount > 0 && (
                              <Badge
                                badgeContent={unreadCount > 99 ? '99+' : unreadCount}
                                color="error"
                                sx={{
                                  '& .MuiBadge-badge': {
                                    animation: 'pulse 2s infinite',
                                    boxShadow: '0 0 0 4px rgba(244, 67, 54, 0.2)'
                                  }
                                }}
                              />
                            )}
                          </ListItem>
                        </Fade>
                      );
                    })}
                    {projects.length === 0 && (
                      <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Chưa có dự án nào
                        </Typography>
                      </Box>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Slide>

            {/* Chat Interface */}
            {selectedProjectId ? (
              <Slide direction="left" in timeout={400}>
                <Card 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: '100%',
                    borderRadius: 3,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(10px)',
                    overflow: 'hidden'
                  }}
                >
                  {/* Chat Header */}
                  <Box 
                    sx={{ 
                      p: 2.5, 
                      borderBottom: '2px solid',
                      borderColor: 'divider',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  >
                    <IconButton
                      onClick={() => setSelectedProjectId(null)}
                      sx={{ 
                        display: { md: 'none' },
                        color: 'white',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
                      }}
                    >
                      <ArrowBackIcon />
                    </IconButton>
                    {(() => {
                      const project = projects.find(p => p._id === selectedProjectId);
                      return (
                        <>
                          <Avatar 
                            sx={{ 
                              bgcolor: getAvatarColor(project?.code || project?.topic || ''),
                              width: 40,
                              height: 40,
                              fontWeight: 700,
                              fontSize: '0.95rem',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            }}
                          >
                            {project?.code?.[0]?.toUpperCase() || project?.topic?.[0]?.toUpperCase() || 'P'}
                          </Avatar>
                          <Box flex={1}>
                            <Typography variant="subtitle1" fontWeight={700}>
                              {project?.topic || project?.code || 'Dự án'}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <CircleIcon sx={{ fontSize: 10, color: '#4ade80' }} />
                              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                Đang hoạt động
                              </Typography>
                            </Stack>
                          </Box>
                        </>
                      );
                    })()}
                  </Box>

                  {/* Messages Area */}
                  <Box
                    ref={messagesContainerRef}
                    sx={{
                      flex: 1,
                      overflow: 'auto',
                      p: 3,
                      background: 'linear-gradient(to bottom, #f8fafc 0%, #f1f5f9 100%)',
                      position: 'relative',
                      '&::-webkit-scrollbar': {
                        width: '8px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: 'transparent',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '4px',
                        '&:hover': {
                          background: 'rgba(0,0,0,0.3)',
                        },
                      },
                    }}
                  >
                    {loadingMessages ? (
                      <Stack spacing={2}>
                        {[1, 2, 3].map((i) => (
                          <Box key={i} sx={{ display: 'flex', gap: 1 }}>
                            <Skeleton variant="circular" width={40} height={40} />
                            <Skeleton variant="rectangular" width="60%" height={60} sx={{ borderRadius: 2 }} />
                          </Box>
                        ))}
                      </Stack>
                    ) : messages.length === 0 ? (
                      <Fade in timeout={500}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          height: '100%',
                          flexDirection: 'column',
                          gap: 2
                        }}>
                          <Box
                            sx={{
                              width: 64,
                              height: 64,
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
                            }}
                          >
                            <SendIcon sx={{ fontSize: 32, color: 'white' }} />
                          </Box>
                          <Typography variant="h6" color="text.secondary" fontWeight={600}>
                            Chưa có tin nhắn nào
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Hãy bắt đầu cuộc trò chuyện!
                          </Typography>
                        </Box>
                      </Fade>
                    ) : (
                      <Stack spacing={2.5}>
                        {messages.map((msg, index) => {
                          const isOwnMessage = msg.senderId === currentUserId || msg.senderId === (currentUserId as any)?._id;
                          return (
                            <Fade 
                              in 
                              timeout={400} 
                              key={msg._id}
                              style={{ transitionDelay: `${index * 50}ms` }}
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                                  animation: 'slideIn 0.3s ease-out'
                                }}
                              >
                                <Paper
                                  elevation={3}
                                  sx={{
                                    p: 2,
                                    maxWidth: '75%',
                                    borderRadius: isOwnMessage 
                                      ? '20px 20px 4px 20px' 
                                      : '20px 20px 20px 4px',
                                    background: isOwnMessage
                                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                      : 'white',
                                    color: isOwnMessage ? 'white' : 'text.primary',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    transition: 'all 0.2s ease-in-out',
                                    '&:hover': {
                                      transform: 'translateY(-2px)',
                                      boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                                    },
                                    position: 'relative',
                                  }}
                                >
                                  {!isOwnMessage && (
                                    <Typography 
                                      variant="caption" 
                                      sx={{ 
                                        display: 'block', 
                                        mb: 0.5, 
                                        opacity: 0.9,
                                        fontWeight: 600
                                      }}
                                    >
                                      {msg.senderName || 'Người dùng'}
                                    </Typography>
                                  )}
                                  <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                                    {msg.content}
                                  </Typography>
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      display: 'block', 
                                      mt: 1, 
                                      opacity: 0.7,
                                      fontSize: '0.7rem'
                                    }}
                                  >
                                    {formatTime(msg.createdAt)}
                                  </Typography>
                                </Paper>
                              </Box>
                            </Fade>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </Stack>
                    )}
                  </Box>

                  {/* Message Input */}
                  <Box 
                    sx={{ 
                      p: 2.5, 
                      borderTop: '2px solid',
                      borderColor: 'divider',
                      background: 'white',
                      boxShadow: '0 -2px 8px rgba(0,0,0,0.05)'
                    }}
                  >
                    <TextField
                      fullWidth
                      placeholder="Nhập tin nhắn..."
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      disabled={sending}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                          backgroundColor: '#f8fafc',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            backgroundColor: '#f1f5f9',
                          },
                          '&.Mui-focused': {
                            backgroundColor: 'white',
                            boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                          },
                        },
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={handleSendMessage}
                              disabled={!messageContent.trim() || sending}
                              sx={{
                                background: messageContent.trim() 
                                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                  : 'transparent',
                                color: 'white',
                                '&:hover': {
                                  background: messageContent.trim()
                                    ? 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)'
                                    : 'rgba(0,0,0,0.05)',
                                  transform: 'scale(1.1)',
                                },
                                transition: 'all 0.2s ease-in-out',
                                boxShadow: messageContent.trim() 
                                  ? '0 4px 12px rgba(102, 126, 234, 0.3)'
                                  : 'none',
                              }}
                            >
                              {sending ? (
                                <CircularProgress size={20} sx={{ color: 'white' }} />
                              ) : (
                                <SendIcon />
                              )}
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />
                  </Box>
                </Card>
              </Slide>
            ) : (
              <Fade in timeout={600}>
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    background: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <CardContent>
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        height: '100%', 
                        minHeight: 400,
                        flexDirection: 'column',
                        gap: 2
                      }}
                    >
                      <Box
                        sx={{
                          width: 96,
                          height: 96,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
                          animation: 'float 3s ease-in-out infinite'
                        }}
                      >
                        <SendIcon sx={{ fontSize: 48, color: 'white' }} />
                      </Box>
                      <Typography variant="h5" color="text.secondary" fontWeight={600}>
                        Chọn một dự án để bắt đầu trò chuyện
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Chọn từ danh sách bên trái để xem và gửi tin nhắn
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Fade>
            )}
          </Box>
        </div>
      </main>

      <style jsx global>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}