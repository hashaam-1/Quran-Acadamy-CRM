import { useState, useRef, useEffect } from "react";
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
  ArrowLeft,
  AlertCircle,
  Shield,
  Users,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import { useChats, useChatById, useSendMessage, useMarkAsRead } from "@/hooks/useChats";
import { toast } from "sonner";

export default function Messages() {
  const { currentUser } = useAuthStore();
  const userId = currentUser?.id || '';
  const userRole = currentUser?.role || 'student';
  const userName = currentUser?.name || 'User';
  
  const { data: chats = [], isLoading } = useChats(userId, userRole);
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredChats = chats.filter((chat) => {
    const otherParticipant = chat.participants.find(p => p.userId !== userId);
    return otherParticipant?.name.toLowerCase().includes(searchQuery.toLowerCase()) || false;
  });

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
        {/* Conversations List */}
        <Card className={cn("lg:col-span-1 flex flex-col animate-slide-up", showMobileChat && "hidden lg:flex")}>
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Chats ({filteredChats.length})
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
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              {filteredChats.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No chats yet</p>
                  <p className="text-xs mt-1">Start a conversation from Leads or other modules</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredChats.map((chat) => {
                    const otherParticipant = getOtherParticipant(chat);
                    const RoleIcon = getRoleIcon(otherParticipant?.role || '');
                    const unreadCount = chat.messages.filter(m => 
                      m.senderId !== userId && 
                      !m.readBy.some(r => r.userId === userId)
                    ).length;

                    return (
                      <div
                        key={chat._id}
                        onClick={() => selectChat(chat._id)}
                        className={cn(
                          "flex items-center gap-3 p-4 cursor-pointer transition-all hover:bg-muted/50",
                          selectedChatId === chat._id && "bg-primary/5 border-l-4 border-l-primary"
                        )}
                      >
                        <div className="relative">
                          <div className={cn(
                            "h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold",
                            getRoleBadgeColor(otherParticipant?.role || '')
                          )}>
                            {otherParticipant?.name.split(" ").map(n => n[0]).slice(0, 2).join("") || "?"}
                          </div>
                          {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[10px] text-primary-foreground font-bold flex items-center justify-center">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold truncate">{otherParticipant?.name || 'Unknown'}</p>
                            {chat.lastMessage && (
                              <span className="text-xs text-muted-foreground">
                                {formatTime(chat.lastMessage.timestamp)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={cn("text-[10px] px-1.5 py-0", getRoleBadgeColor(otherParticipant?.role || ''))}>
                              <RoleIcon className="h-2.5 w-2.5 mr-0.5" />
                              {getRoleLabel(otherParticipant?.role || '')}
                            </Badge>
                            <p className="text-sm text-muted-foreground truncate flex-1">
                              {chat.lastMessage?.content || 'No messages yet'}
                            </p>
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
                                {isMe && <CheckCheck className="h-3 w-3" />}
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
              <div className="p-4 border-t bg-card">
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
