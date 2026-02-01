import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Send,
  MessageSquare,
  CheckCheck,
  Check,
  ArrowLeft,
  AlertCircle,
  Shield,
  Users,
  Briefcase,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import { useChats, useChatById, useSendMessage, useMarkAsRead, useCreateChat } from "@/hooks/useChats";
import { useStudents } from "@/hooks/useStudents";
import { useTeachers } from "@/hooks/useTeachers";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { CreateChatDialog } from "@/components/chat/CreateChatDialog";
import { toast } from "sonner";

export default function Messages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, users } = useAuthStore();
  const userId = currentUser?.id || '';
  const userRole = currentUser?.role || 'student';
  const userName = currentUser?.name || 'User';
  
  const { data: chats = [], isLoading, refetch } = useChats(userId, userRole);
  const { data: students = [] } = useStudents();
  const { data: teachers = [] } = useTeachers();
  const { data: teamMembers = [] } = useTeamMembers();
  const createChatMutation = useCreateChat();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const { data: selectedChat, isLoading: chatLoading } = useChatById(
    selectedChatId || '',
    userId,
    userRole
  );
  const sendMessageMutation = useSendMessage();
  const markAsReadMutation = useMarkAsRead();
  
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [isChatDialogOpen, setIsChatDialogOpen] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Create combined contacts list with all available people
  const allContacts = [
    ...students.map((s: any) => ({
      id: (s as any)._id || s.id,
      name: s.name,
      role: 'student' as const,
      userModel: 'Student',
    })),
    ...teachers.map((t: any) => ({
      id: (t as any)._id || t.id,
      name: t.name,
      role: 'teacher' as const,
      userModel: 'Teacher',
    })),
    ...teamMembers.map((m: any) => ({
      id: (m as any)._id || m.id,
      name: m.name,
      role: m.role || 'sales_team' as const,
      userModel: 'TeamMember',
    })),
    ...users.filter((u: any) => u.role === 'admin' || u.role === 'sales_team' || u.role === 'team_leader').map((u: any) => ({
      id: u.id,
      name: u.name,
      role: u.role,
      userModel: 'User',
    })),
  ].filter((contact) => contact.id !== userId); // Exclude current user

  // Create list that combines existing chats and available contacts
  const contactsWithChats = allContacts.map((contact) => {
    const existingChat = chats.find(chat => 
      chat.participants.some(p => p.userId === contact.id)
    );
    
    return {
      ...contact,
      chat: existingChat,
      hasChat: !!existingChat,
    };
  });

  const filteredContacts = contactsWithChats.filter((contact) => {
    if (!searchQuery) return true;
    return contact.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  useEffect(() => {
    const targetUserId = searchParams.get('userId');
    const targetUserName = searchParams.get('userName');
    const targetUserRole = searchParams.get('userRole');

    if (targetUserId && targetUserName && targetUserRole && !isCreatingChat && chats.length >= 0) {
      setIsCreatingChat(true);
      const existingChat = chats.find(chat => chat.participants.some(p => p.userId === targetUserId));

      if (existingChat) {
        setSelectedChatId(existingChat._id);
        setShowMobileChat(true);
        setSearchParams({});
        setIsCreatingChat(false);
      } else {
        const determineChatType = (role1: string, role2: string) => {
          const roles = [role1, role2].sort();
          if (roles.includes('sales_team') && roles.includes('team_leader')) return 'sales_to_team_lead';
          if (roles.includes('team_leader') && roles.includes('teacher')) return 'team_lead_to_teacher';
          if (roles.includes('teacher') && roles.includes('student')) return 'teacher_to_student';
          return 'admin_view';
        };

        createChatMutation.mutate({
          participants: [
            { userId, userModel: 'User', name: userName, role: userRole as any },
            { userId: targetUserId, userModel: 'User', name: targetUserName, role: targetUserRole as any },
          ],
          chatType: determineChatType(userRole, targetUserRole),
        }, {
          onSuccess: (newChat) => {
            refetch();
            setTimeout(() => {
              setSelectedChatId(newChat._id);
              setShowMobileChat(true);
              setSearchParams({});
              setIsCreatingChat(false);
            }, 500);
          },
          onError: () => {
            setIsCreatingChat(false);
            setSearchParams({});
          }
        });
      }
    }
  }, [searchParams, chats, userId, userName, userRole, isCreatingChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (selectedChat) {
      scrollToBottom();
      markAsReadMutation.mutate({ chatId: selectedChat._id, userId });
    }
  }, [selectedChat?.messages?.length]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChatId) return;

    sendMessageMutation.mutate({
      chatId: selectedChatId,
      senderId: userId,
      senderModel: 'User',
      senderName: userName,
      senderRole: userRole,
      content: newMessage,
    }, {
      onSuccess: () => {
        setNewMessage("");
      }
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    setShowMobileChat(true);
  };

  const getOtherParticipant = (chat: any) => {
    return chat.participants.find((p: any) => p.userId !== userId);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/10 text-red-500';
      case 'sales_team': return 'bg-blue-500/10 text-blue-500';
      case 'team_leader': return 'bg-purple-500/10 text-purple-500';
      case 'teacher': return 'bg-emerald-500/10 text-emerald-500';
      case 'student': return 'bg-orange-500/10 text-orange-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'sales_team': return 'Sales Manager';
      case 'team_leader': return 'Team Leader';
      case 'teacher': return 'Teacher';
      case 'student': return 'Student';
      default: return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Shield;
      case 'sales_team': return Briefcase;
      case 'team_leader': return Shield;
      case 'teacher': return Users;
      case 'student': return Users;
      default: return Users;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  if (isLoading) {
    return (
      <MainLayout title="Messages" subtitle="Real-time chat system">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading chats...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Messages" subtitle="Real-time chat system with role-based access">
      {/* Admin Notice */}
      {userRole === 'admin' && (
        <Card className="mb-4 border-red-500/20 bg-red-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Shield className="h-5 w-5 text-red-500" />
            <div>
              <p className="font-semibold text-sm">Admin View</p>
              <p className="text-xs text-muted-foreground">You can see all chats across the system</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)] min-h-[500px]">
        {/* Conversations List */}
        <Card className={cn("lg:col-span-1 flex flex-col animate-slide-up overflow-hidden", showMobileChat && "hidden lg:flex")}>
          <CardHeader className="pb-3 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Contacts ({filteredContacts.length})
              </CardTitle>
              <Badge variant="default" className="gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Online
              </Badge>
            </div>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search conversations..." 
                className="pl-9 bg-muted/50" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 h-full">
              {filteredContacts.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No contacts found</p>
                  <p className="text-xs mt-1">Try a different search</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredContacts.map((contact) => {
                    const RoleIcon = getRoleIcon(contact.role);
                    const unreadCount = contact.chat?.messages.filter(m => 
                      m.senderId !== userId && 
                      !m.readBy.some(r => r.userId === userId)
                    ).length || 0;

                    const handleContactClick = () => {
                      if (contact.hasChat && contact.chat) {
                        setSelectedChatId(contact.chat._id);
                        setShowMobileChat(true);
                      } else {
                        const determineChatType = (role1: string, role2: string) => {
                          const roles = [role1, role2].sort();
                          if (roles.includes('sales_team') && roles.includes('team_leader')) return 'sales_to_team_lead';
                          if (roles.includes('team_leader') && roles.includes('teacher')) return 'team_lead_to_teacher';
                          if (roles.includes('teacher') && roles.includes('student')) return 'teacher_to_student';
                          return 'admin_view';
                        };

                        createChatMutation.mutate({
                          participants: [
                            { userId, userModel: 'User', name: userName, role: userRole as any },
                            { userId: contact.id, userModel: contact.userModel, name: contact.name, role: contact.role as any },
                          ],
                          chatType: determineChatType(userRole, contact.role),
                        }, {
                          onSuccess: (newChat) => {
                            refetch();
                            setTimeout(() => {
                              setSelectedChatId(newChat._id);
                              setShowMobileChat(true);
                            }, 300);
                          },
                        });
                      }
                    };

                    return (
                      <div
                        key={contact.id}
                        onClick={handleContactClick}
                        className={cn(
                          "p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                          selectedChatId === contact.chat?._id && "bg-muted"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-primary">
                              {contact.name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "??"}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm truncate">{contact.name}</span>
                                <Badge className={cn("text-xs", getRoleBadgeColor(contact.role))}>
                                  <RoleIcon className="h-3 w-3 mr-1" />
                                  {getRoleLabel(contact.role)}
                                </Badge>
                              </div>
                              {unreadCount > 0 && (
                                <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                                  {unreadCount}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {contact.chat?.lastMessage?.content || "Click to start chat"}
                            </p>
                            {contact.chat?.lastMessage?.timestamp && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(contact.chat.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className={cn("lg:col-span-2 flex flex-col animate-slide-up overflow-hidden", !showMobileChat && "hidden lg:flex")}>
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <CardHeader className="border-b p-4 bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="lg:hidden h-8 w-8"
                      onClick={() => setShowMobileChat(false)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    {(() => {
                      const otherParticipant = getOtherParticipant(selectedChat);
                      const RoleIcon = getRoleIcon(otherParticipant?.role || '');
                      return (
                        <>
                          <div className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold",
                            getRoleBadgeColor(otherParticipant?.role || '')
                          )}>
                            {otherParticipant?.name.split(" ").map(n => n[0]).slice(0, 2).join("") || "?"}
                          </div>
                          <div>
                            <p className="font-semibold">{otherParticipant?.name || 'Unknown'}</p>
                            <Badge className={cn("text-[10px] px-1.5 py-0", getRoleBadgeColor(otherParticipant?.role || ''))}>
                              <RoleIcon className="h-2.5 w-2.5 mr-0.5" />
                              {getRoleLabel(otherParticipant?.role || '')}
                            </Badge>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 p-0 overflow-hidden bg-gradient-to-b from-muted/30 to-background">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-3 min-h-full">
                    {selectedChat.messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">No messages yet</p>
                          <p className="text-xs mt-1">Start the conversation</p>
                        </div>
                      </div>
                    ) : (
                      selectedChat.messages.map((message, index) => {
                        const isMe = message.senderId === userId;
                        return (
                          <div
                            key={message._id || index}
                            className={cn(
                              "flex animate-fade-in",
                              isMe ? "justify-end" : "justify-start"
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm",
                                isMe
                                  ? "bg-primary text-primary-foreground rounded-br-md"
                                  : "bg-card border rounded-bl-md"
                              )}
                            >
                              {!isMe && (
                                <p className="text-xs font-semibold mb-1 opacity-70">{message.senderName}</p>
                              )}
                              <p className="text-sm leading-relaxed">{message.content}</p>
                              {message.isBlocked && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
                                  <AlertCircle className="h-3 w-3" />
                                  <span>Blocked: {message.blockedReason}</span>
                                </div>
                              )}
                              <div className={cn(
                                "flex items-center justify-end gap-1 mt-1",
                                isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                              )}>
                                <span className="text-[10px]">{formatTime(message.timestamp)}</span>
                                {isMe && (
                                  <>
                                    {message.readBy && message.readBy.length > 0 && message.readBy.some(r => r.userId !== userId) ? (
                                      // Blue double tick - Message read/opened
                                      <CheckCheck className="h-3 w-3 text-blue-500" />
                                    ) : (
                                      // Double tick - Message delivered/online
                                      <CheckCheck className="h-3 w-3" />
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Message Input */}
              <div className="p-4 border-t bg-card flex-shrink-0">
                <div className="flex items-end gap-2">
                  <Textarea
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="min-h-[48px] max-h-32 resize-none bg-muted/50 border-0 focus-visible:ring-1"
                    rows={1}
                  />
                  <Button 
                    size="icon" 
                    className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-shadow"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
                {userRole !== 'admin' && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Phone numbers and emails are not allowed in messages
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-muted/30 to-background">
              <div className="text-center space-y-4">
                <div className="h-24 w-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-12 w-12 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Select a conversation</h3>
                  <p className="text-sm text-muted-foreground">Choose a chat from the list to start messaging</p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}
