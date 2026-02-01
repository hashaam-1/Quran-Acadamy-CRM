import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStudents } from "@/hooks/useStudents";
import { useTeachers } from "@/hooks/useTeachers";
import { useSchedules } from "@/hooks/useSchedules";
import { useCreateChat, useSendMessage } from "@/hooks/useChats";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";
import { MessageSquare, Send } from "lucide-react";

interface WhatsAppFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const templates = [
  { id: '1', name: 'Class Reminder', message: 'Assalamu Alaikum! This is a reminder for your upcoming class today at {time}. Please be ready 5 minutes before.' },
  { id: '2', name: 'Fee Reminder', message: 'Assalamu Alaikum! This is a gentle reminder that your fee payment of ${amount} is due on {date}. Please make the payment at your earliest convenience.' },
  { id: '3', name: 'Progress Update', message: 'Assalamu Alaikum! We are pleased to share that {student} has made excellent progress this week. Keep up the good work!' },
  { id: '4', name: 'Welcome Message', message: 'Assalamu Alaikum! Welcome to our Quran Academy. We are excited to have {student} join our community. Classes will begin from {date}.' },
];

export function WhatsAppForm({ open, onOpenChange }: WhatsAppFormProps) {
  const { currentUser } = useAuthStore();
  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const { data: teachers = [], isLoading: teachersLoading } = useTeachers();
  const { data: schedules = [] } = useSchedules();
  const createChat = useCreateChat();
  const sendMessage = useSendMessage();
  const [recipient, setRecipient] = useState('');
  const [recipientType, setRecipientType] = useState<'student' | 'teacher'>('student');
  const [template, setTemplate] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const recipients = recipientType === 'student' ? students : teachers;
  const isLoading = recipientType === 'student' ? studentsLoading : teachersLoading;

  const handleTemplateChange = (templateId: string) => {
    setTemplate(templateId);
    const selectedTemplate = templates.find(t => t.id === templateId);
    if (selectedTemplate) {
      setMessage(selectedTemplate.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !message) {
      toast.error("Please select a recipient and enter a message");
      return;
    }
    
    if (!currentUser) {
      toast.error("User not authenticated");
      return;
    }
    
    const recipientData = recipients.find(r => (r.id || r._id) === recipient);
    if (!recipientData) {
      toast.error("Recipient not found");
      return;
    }
    
    // Get today's day
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const currentDay = daysOfWeek[today.getDay()];
    
    // Find recipient's scheduled class for today
    let todayClass = null;
    if (recipientType === 'student') {
      todayClass = schedules.find(s => 
        (s.studentId === recipient || s.studentId?._id === recipient || s.studentId === recipientData._id) &&
        s.day === currentDay &&
        s.status === 'scheduled'
      );
    } else {
      todayClass = schedules.find(s => 
        (s.teacherId === recipient || s.teacherId?._id === recipient || s.teacherId === recipientData._id) &&
        s.day === currentDay &&
        s.status === 'scheduled'
      );
    }
    
    // Replace placeholders in message
    let finalMessage = message;
    if (todayClass) {
      finalMessage = finalMessage.replace(/{time}/g, todayClass.time || 'scheduled time');
      finalMessage = finalMessage.replace(/{duration}/g, todayClass.duration || '45 min');
      finalMessage = finalMessage.replace(/{course}/g, todayClass.course || 'class');
    } else {
      // If no class today, use generic text
      finalMessage = finalMessage.replace(/{time}/g, 'your scheduled time');
      finalMessage = finalMessage.replace(/{duration}/g, 'the scheduled duration');
      finalMessage = finalMessage.replace(/{course}/g, 'your class');
    }
    
    // Replace other common placeholders
    finalMessage = finalMessage.replace(/{student}/g, recipientData.name);
    finalMessage = finalMessage.replace(/{teacher}/g, recipientData.name);
    finalMessage = finalMessage.replace(/{name}/g, recipientData.name);
    finalMessage = finalMessage.replace(/{date}/g, today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
    finalMessage = finalMessage.replace(/{amount}/g, recipientData.feeAmount?.toString() || '100');
    
    setIsSending(true);
    
    try {
      // Determine chat type based on recipient type and sender role
      let chatType = 'admin_view';
      if (currentUser.role === 'sales_team') {
        chatType = 'sales_to_team_lead';
      } else if (currentUser.role === 'team_leader') {
        chatType = recipientType === 'teacher' ? 'team_lead_to_teacher' : 'admin_view';
      } else if (currentUser.role === 'teacher') {
        chatType = 'teacher_to_student';
      }
      
      // Create or get existing chat
      const chatData = await createChat.mutateAsync({
        participants: [
          {
            userId: currentUser.id || currentUser._id,
            userModel: currentUser.role === 'student' ? 'Student' : currentUser.role === 'teacher' ? 'Teacher' : 'User',
            name: currentUser.name,
            role: currentUser.role as any,
          },
          {
            userId: recipientData.id || recipientData._id,
            userModel: recipientType === 'student' ? 'Student' : 'Teacher',
            name: recipientData.name,
            role: recipientType as any,
          },
        ],
        chatType,
      });
      
      // Send message to the chat with replaced placeholders
      await sendMessage.mutateAsync({
        chatId: chatData._id,
        senderId: currentUser.id || currentUser._id,
        senderModel: currentUser.role === 'student' ? 'Student' : currentUser.role === 'teacher' ? 'Teacher' : 'User',
        senderName: currentUser.name,
        senderRole: currentUser.role,
        content: finalMessage,
      });
      
      toast.success(`Message sent to ${recipientData.name}`, {
        description: "Your message has been delivered and will appear in the messaging module.",
      });
      
      onOpenChange(false);
      setRecipient('');
      setTemplate('');
      setMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-success" />
            Send Message / Reminder
          </DialogTitle>
          <DialogDescription>Send a message to students or teachers (appears in messaging module)</DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4 -mr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Recipient Type</Label>
              <Select value={recipientType} onValueChange={(value: 'student' | 'teacher') => { setRecipientType(value); setRecipient(''); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Select {recipientType}</Label>
              <Select value={recipient} onValueChange={setRecipient} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoading ? `Loading ${recipientType}s...` : `Choose ${recipientType}`} />
                </SelectTrigger>
                <SelectContent>
                  {recipients.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No {recipientType}s found
                    </div>
                  ) : (
                    recipients.map((r) => (
                      <SelectItem key={r.id || r._id} value={r.id || r._id}>
                        {r.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Message Template (Optional)</Label>
            <Select value={template} onValueChange={handleTemplateChange}>
              <SelectTrigger><SelectValue placeholder="Choose a template" /></SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message..." rows={4} className="resize-none" />
          </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>Cancel</Button>
              <Button type="submit" className="gap-2" disabled={isSending}>
                <Send className="h-4 w-4" />
                {isSending ? 'Sending...' : 'Send Message'}
              </Button>
            </DialogFooter>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
