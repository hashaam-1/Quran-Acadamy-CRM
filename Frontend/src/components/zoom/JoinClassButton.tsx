import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Video, Users, Calendar, Clock, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'sonner';

interface JoinClassButtonProps {
  meetingNumber?: string;
  className?: string;
  teacherName?: string;
  course?: string;
  time?: string;
  disabled?: boolean;
}

export default function JoinClassButton({ 
  meetingNumber, 
  className: customClassName = "",
  teacherName = "",
  course = "",
  time = "",
  disabled = false
}: JoinClassButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [meeting, setMeeting] = useState<any>(null);
  const [error, setError] = useState('');
  const { currentUser } = useAuthStore();

  const handleJoinClass = async () => {
    if (!currentUser) {
      toast.error('Please login to join class');
      return;
    }

    if (!meetingNumber) {
      toast.error('Meeting number is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // First, register the student as joining the meeting
      const response = await fetch(`https://quran-acadamy-crm-production.up.railway.app/api/meetings/join/${meetingNumber}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setMeeting(data.meeting);
        toast.success('Joined class successfully!');
        
        // Open Zoom meeting for student (role: 0)
        window.open(`/zoom-join?meetingNumber=${meetingNumber}&role=0`, '_blank');
      } else {
        throw new Error(data.error || 'Failed to join class');
      }
    } catch (err) {
      console.error('Error joining class:', err);
      setError(err instanceof Error ? err.message : 'Failed to join class');
      toast.error('Failed to join class');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetMeetingDetails = async () => {
    if (!meetingNumber) return;

    try {
      const response = await fetch(`https://quran-acadamy-crm-production.up.railway.app/api/meetings/${meetingNumber}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setMeeting(data.meeting);
      } else {
        throw new Error(data.error || 'Meeting not found');
      }
    } catch (err) {
      console.error('Error getting meeting details:', err);
      setError(err instanceof Error ? err.message : 'Meeting not found');
    }
  };

  // Only students can join classes (but admins can too for testing)
  if (currentUser?.role !== 'student' && currentUser?.role !== 'admin') {
    return null;
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        disabled={disabled || isLoading}
        className={`${customClassName}`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Joining...
          </>
        ) : (
          <>
            <Video className="w-4 h-4 mr-2" />
            Join Class
          </>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Join Live Class</DialogTitle>
            <DialogDescription>
              Join your {course} class with {teacherName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Class Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Course:</span>
                  <Badge variant="outline">{course}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Instructor:</span>
                  <span className="text-sm font-medium">{teacherName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Time:</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{time || 'Now'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Meeting ID:</span>
                  <span className="text-sm font-mono">{meetingNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Your Name:</span>
                  <span className="text-sm font-medium">{currentUser?.name}</span>
                </div>
              </CardContent>
            </Card>

            {meeting && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Meeting Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant={meeting.status === 'live' ? 'default' : 'outline'}>
                      {meeting.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Participants:</span>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{meeting.participants?.length || 0}</span>
                    </div>
                  </div>
                  {meeting.status === 'live' && (
                    <div className="pt-2">
                      <p className="text-sm text-green-600 font-medium">
                        Class is live! You can join now.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleJoinClass}
                disabled={isLoading || !meetingNumber}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4 mr-2" />
                    Join Class Now
                  </>
                )}
              </Button>
              
              {!meeting && meetingNumber && (
                <Button
                  onClick={handleGetMeetingDetails}
                  variant="outline"
                  disabled={isLoading}
                >
                  Check Status
                </Button>
              )}
              
              <Button
                onClick={() => setIsOpen(false)}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
