import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Video, Users, Calendar, Clock, Play, BookOpen, User } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'sonner';

interface StudentZoomJoinerProps {
  scheduleId?: string;
  className?: string;
  course?: string;
  time?: string;
  disabled?: boolean;
}

interface Meeting {
  _id: string;
  meetingNumber: string;
  className: string;
  course: string;
  teacherId: string;
  teacherName: string;
  status: 'scheduled' | 'live' | 'ended';
  zoomMeetingId?: string;
  zoomPassword?: string;
  zoomJoinUrl?: string;
  participants: Array<{
    userId: string;
    name: string;
    role: number;
    joinedAt?: string;
  }>;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
}

interface Schedule {
  _id: string;
  className: string;
  course: string;
  teacherName: string;
  time: string;
  day: string;
  status: string;
}

export default function StudentZoomJoiner({ 
  scheduleId, 
  className: buttonClassName = "",
  course = "",
  time = "",
  disabled = false
}: StudentZoomJoinerProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [availableMeetings, setAvailableMeetings] = useState<Meeting[]>([]);
  const [mySchedules, setMySchedules] = useState<Schedule[]>([]);
  const [error, setError] = useState('');
  const { currentUser } = useAuthStore();

  // Fetch student's schedules and available meetings on component mount
  useEffect(() => {
    if (currentUser?.role === 'student') {
      fetchStudentSchedules();
      fetchAvailableMeetings();
    }
  }, [currentUser]);

  const fetchStudentSchedules = async () => {
    try {
      const response = await fetch(`https://quran-acadamy-crm-production.up.railway.app/api/schedules/student/${currentUser?.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMySchedules(data.schedules || []);
        }
      }
    } catch (err) {
      console.error('Error fetching student schedules:', err);
    }
  };

  const fetchAvailableMeetings = async () => {
    try {
      const response = await fetch('https://quran-acadamy-crm-production.up.railway.app/api/meetings/student/available');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAvailableMeetings(data.meetings || []);
        }
      }
    } catch (err) {
      console.error('Error fetching available meetings:', err);
    }
  };

  const handleJoinClass = async (scheduleId?: string, meetingId?: string) => {
    if (!currentUser) {
      toast.error("Please login to join class");
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // If joining a specific meeting, use meeting endpoint
      if (meetingId) {
        const response = await fetch(`https://quran-acadamy-crm-production.up.railway.app/api/meetings/${meetingId}/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: currentUser.id,
            userName: currentUser.name,
          })
        });

        const data = await response.json();
        if (data.success) {
          setMeeting(data.meeting);
          toast.success('Joined class successfully');
          
          // Navigate to Zoom meeting with student role (0 = participant)
          navigate(`/zoom-join?meetingNumber=${data.meeting.meetingNumber}&role=0`);
        } else {
          setError(data.message || 'Failed to join class');
          toast.error(data.message || 'Failed to join class');
        }
      } 
      // If starting from schedule, use start-class endpoint
      else if (scheduleId) {
        const payload = {
          scheduleId: scheduleId,
          className: course || 'Class',
          course: course,
          teacherId: '',
          teacherName: '',
          studentId: currentUser.id,
          studentName: currentUser.name,
          time: time || new Date().toISOString()
        };

        console.log('Student joining class with payload:', payload);

        const response = await fetch('https://quran-acadamy-crm-production.up.railway.app/api/meetings/start-class', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('Student class join response:', data);

        if (data.success) {
          setMeeting(data.meeting);
          toast.success(data.rejoin ? "Rejoined existing class" : "Joined class successfully");
          
          // Navigate to Zoom meeting with student role (0 = participant)
          navigate(`/zoom-join?meetingNumber=${data.meeting.meetingNumber}&role=0`);
        } else {
          setError(data.message || 'Failed to join class');
          toast.error(data.message || 'Failed to join class');
        }
      }
    } catch (err) {
      console.error('Error joining class:', err);
      setError('Network error. Please try again.');
      toast.error('Failed to join class');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-green-500';
      case 'scheduled': return 'bg-blue-500';
      case 'ended': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const canJoinMeeting = (meeting: Meeting) => {
    return meeting.status === 'live' || meeting.status === 'scheduled';
  };

  return (
    <div className="space-y-4">
      {/* Join Class Button */}
      <Button
        onClick={() => handleJoinClass(scheduleId)}
        disabled={disabled || isLoading}
        className={`${buttonClassName}`}
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Joining Class...
          </>
        ) : (
          <>
            <Play className="w-4 h-4 mr-2" />
            Join Class
          </>
        )}
      </Button>

      {/* Student Dashboard */}
      {currentUser?.role === 'student' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Scheduled Classes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                My Scheduled Classes
                <Badge variant="secondary">{mySchedules.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mySchedules.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No scheduled classes</p>
              ) : (
                mySchedules.map((schedule) => (
                  <div key={schedule._id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{schedule.className}</h4>
                        <p className="text-sm text-gray-600">{schedule.course}</p>
                        <p className="text-sm text-gray-600">Teacher: {schedule.teacherName}</p>
                        <p className="text-xs text-gray-500">
                          {schedule.day} at {schedule.time}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {schedule.status}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleJoinClass(schedule._id)}
                      disabled={isLoading}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Join
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Available Live Classes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5 text-green-500" />
                Available Classes
                <Badge variant="secondary">{availableMeetings.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {availableMeetings.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No available classes</p>
              ) : (
                availableMeetings.map((meeting) => (
                  <div key={meeting._id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{meeting.className}</h4>
                        <p className="text-sm text-gray-600">{meeting.course}</p>
                        <p className="text-sm text-gray-600">Teacher: {meeting.teacherName}</p>
                        <p className="text-xs text-gray-500">
                          {meeting.startedAt ? `Started: ${formatTime(meeting.startedAt)}` : `Created: ${formatTime(meeting.createdAt)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(meeting.status)}>
                          {meeting.status}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span className="text-sm">{meeting.participants.length}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleJoinClass(undefined, meeting._id)}
                      disabled={!canJoinMeeting(meeting) || isLoading}
                    >
                      {meeting.status === 'live' ? (
                        <>
                          <Video className="w-4 h-4 mr-1" />
                          Join Live
                        </>
                      ) : (
                        <>
                          <Calendar className="w-4 h-4 mr-1" />
                          Join Scheduled
                        </>
                      )}
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Dialog */}
      {error && (
        <Dialog open={!!error} onOpenChange={() => setError('')}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Error</DialogTitle>
            </DialogHeader>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
