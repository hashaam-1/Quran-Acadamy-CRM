import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Video, Users, Calendar, Clock } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'sonner';

interface StartClassButtonProps {
  scheduleId?: string;
  className?: string;
  meetingClassName?: string;
  studentId?: string;
  studentName?: string;
  course?: string;
  time?: string;
  disabled?: boolean;
}

export default function StartClassButton({ 
  scheduleId, 
  className: buttonClassName = "",
  meetingClassName = "",
  studentId,
  studentName = "",
  course = "",
  time = "",
  disabled = false
}: StartClassButtonProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [meeting, setMeeting] = useState<any>(null);
  const [error, setError] = useState('');
  const { currentUser } = useAuthStore();

  const handleStartClass = async () => {
    if (!currentUser) {
      toast.error("Please login to start class");
      return;
    }

    if (!course?.trim()) {
      toast.error("Course is missing");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const payload = {
        scheduleId: scheduleId || null,
        className: meetingClassName?.trim() || `${course} Class`,
        course: course.trim()
      };

      console.log("Sending payload:", payload);

      const response = await fetch(
        "https://quran-acadamy-crm-production.up.railway.app/api/meetings/start-class",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}` 
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();
      console.log("Response:", data);

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to start class");
      }

      setMeeting(data.meeting);
      toast.success("Class started successfully!");

      if (data.meeting?.meetingNumber) {
        navigate(`/zoom-join?meetingNumber=${data.meeting.meetingNumber}&role=1`);
      }
    } catch (err: any) {
      console.error("Error starting class:", err);
      setError(err.message || "Failed to start class");
      toast.error(err.message || "Failed to start class");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndClass = async () => {
    if (!meeting?.meetingNumber) return;

    try {
      const response = await fetch(`https://quran-acadamy-crm-production.up.railway.app/api/meetings/end-class/${meeting.meetingNumber}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast.success('Class ended successfully');
        setIsOpen(false);
        setMeeting(null);
      } else {
        throw new Error('Failed to end class');
      }
    } catch (err) {
      console.error('Error ending class:', err);
      toast.error('Failed to end class');
    }
  };

  // Only teachers can start classes
  if (currentUser?.role !== 'teacher' && currentUser?.role !== 'admin') {
    return null;
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        disabled={disabled || isLoading}
        className={buttonClassName || "w-full"}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Starting...
          </>
        ) : (
          <>
            <Video className="w-4 h-4 mr-2" />
            Start Class
          </>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Start Live Class</DialogTitle>
            <DialogDescription>
              Begin your {course} class for {studentName || 'students'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!meeting ? (
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
                    <span className="text-sm text-muted-foreground">Student:</span>
                    <span className="text-sm font-medium">{studentName || 'Multiple Students'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Time:</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{time || 'Now'}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Instructor:</span>
                    <span className="text-sm font-medium">{currentUser?.name}</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Video className="w-5 h-5" />
                      Class in Progress
                    </span>
                    <Badge variant="default" className="bg-green-500">
                      Live
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Meeting ID:</span>
                    <span className="text-sm font-mono">{meeting.meetingNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant="default">{meeting.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Participants:</span>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{meeting.participants?.length || 1}</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-sm text-green-600 font-medium">
                      Class is live! Students can now join.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2">
              {!meeting ? (
                <Button
                  onClick={handleStartClass}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Starting Class...
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4 mr-2" />
                      Start Class Now
                    </>
                  )}
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => navigate(`/zoom-join?meetingNumber=${meeting.meetingNumber}&role=1`)}
                    variant="outline"
                    className="flex-1"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Rejoin Class
                  </Button>
                  <Button
                    onClick={handleEndClass}
                    variant="destructive"
                  >
                    End Class
                  </Button>
                </>
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
