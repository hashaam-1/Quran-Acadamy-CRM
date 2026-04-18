import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Video, Users, Calendar, Clock, Play, Square, Eye, Settings } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'sonner';

interface TeacherZoomManagerProps {
  scheduleId?: string;
  className?: string;
  meetingClassName?: string;
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
  zoomStartUrl?: string;
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

export default function TeacherZoomManager({ 
  scheduleId, 
  className: buttonClassName = "",
  meetingClassName = "",
  course = "",
  time = "",
  disabled = false
}: TeacherZoomManagerProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [liveMeetings, setLiveMeetings] = useState<Meeting[]>([]);
  const [scheduledMeetings, setScheduledMeetings] = useState<Meeting[]>([]);
  const [error, setError] = useState('');
  const { currentUser } = useAuthStore();

  // Fetch teacher's meetings on component mount
  useEffect(() => {
    if (currentUser?.role === 'teacher') {
      fetchTeacherMeetings();
    }
  }, [currentUser]);

  const fetchTeacherMeetings = async () => {
    try {
      const response = await fetch(`https://quran-acadamy-crm-production.up.railway.app/api/meetings/teacher/${currentUser?.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const meetings = data.meetings || [];
          setLiveMeetings(meetings.filter((m: Meeting) => m.status === 'live'));
          setScheduledMeetings(meetings.filter((m: Meeting) => m.status === 'scheduled'));
        }
      }
    } catch (err) {
      console.error('Error fetching teacher meetings:', err);
    }
  };

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
    setError('');

    try {
      const payload = {
        scheduleId: scheduleId || '',
        className: meetingClassName || course,
        course: course,
        teacherId: currentUser.id,
        teacherName: currentUser.name,
        studentId: '',
        studentName: '',
        time: time || new Date().toISOString()
      };

      console.log('Teacher starting class with payload:', payload);

      const response = await fetch('https://quran-acadamy-crm-production.up.railway.app/api/meetings/start-class', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('Teacher class start response:', data);

      if (data.success) {
        setMeeting(data.meeting);
        toast.success(data.rejoin ? "Rejoined existing class" : "Class started successfully");
        
        // Navigate to Zoom meeting with teacher role (1 = host)
        const meetingNumber = data.meeting.meetingNumber;
        navigate(`/zoom-join?meetingNumber=${meetingNumber}&role=1`);
        
        // Refresh meetings list
        fetchTeacherMeetings();
      } else {
        setError(data.message || 'Failed to start class');
        toast.error(data.message || 'Failed to start class');
      }
    } catch (err) {
      console.error('Error starting class:', err);
      setError('Network error. Please try again.');
      toast.error('Failed to start class');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndClass = async (meetingId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`https://quran-acadamy-crm-production.up.railway.app/api/meetings/${meetingId}/end`, {
        method: 'POST'
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Class ended successfully');
        fetchTeacherMeetings();
      } else {
        toast.error(data.message || 'Failed to end class');
      }
    } catch (err) {
      console.error('Error ending class:', err);
      toast.error('Failed to end class');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinMeeting = (meeting: Meeting) => {
    // Navigate to Zoom meeting - role will be determined by user type in ZoomMeetingClean component
    navigate(`/zoom-join?meetingNumber=${meeting.meetingNumber}`);
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

  return (
    <div className="space-y-6">
      {/* Only Scheduled Classes with Hover Join Button */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">My Classes</h2>
          <p className="text-sm text-gray-600 mt-1">Hover over classes to join or manage</p>
        </div>
        
        <div className="p-6">
          {scheduledMeetings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-700">No scheduled classes</p>
              <p className="text-sm mt-2 text-gray-500">Your scheduled classes will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scheduledMeetings.map((meeting) => (
                <div
                  key={meeting._id}
                  className="group relative bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-lg transition-all duration-200 relative overflow-hidden"
                >
                  {/* Class Info */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900">{meeting.className}</h3>
                    <p className="text-sm text-gray-600">{meeting.course}</p>
                    <p className="text-sm text-gray-500">Created: {formatTime(meeting.createdAt)}</p>
                    <Badge className={`${getStatusColor(meeting.status)} text-white text-xs`}>
                      {meeting.status}
                    </Badge>
                  </div>
                  
                  {/* Enhanced Hover Action Buttons */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 to-purple-900/90 backdrop-blur-sm rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none transform group-hover:scale-105">
                    <div className="flex flex-col gap-3 p-4">
                      <div className="text-center mb-2">
                        <h4 className="text-white font-bold text-lg mb-1">{meeting.className}</h4>
                        <p className="text-blue-200 text-sm">{meeting.course}</p>
                      </div>
                      
                      <div className="flex gap-3">
                        {meeting.status === 'live' ? (
                          <Button
                            type="button"
                            size="lg"
                            disabled={isLoading}
                            className="pointer-events-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold shadow-2xl hover:shadow-green-500/25 transform hover:scale-105 transition-all duration-200 z-10 px-6"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleJoinMeeting(meeting);
                            }}
                          >
                            <Eye className="w-5 h-5 mr-2" />
                            Join Live
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="lg"
                            disabled={isLoading}
                            className="pointer-events-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-200 z-10 px-6"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleJoinMeeting(meeting);
                            }}
                          >
                            <Play className="w-5 h-5 mr-2" />
                            Start Class
                          </Button>
                        )}
                        
                        <Button
                          type="button"
                          size="lg"
                          variant="outline"
                          disabled={isLoading}
                          className="pointer-events-auto bg-white/90 hover:bg-white text-gray-800 border-white/50 shadow-2xl hover:shadow-white/25 transform hover:scale-105 transition-all duration-200 z-10 px-6"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEndClass(meeting._id);
                          }}
                        >
                          <Square className="w-5 h-5 mr-2" />
                          {meeting.status === 'live' ? 'End' : 'Cancel'}
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-center gap-4 text-white/80 text-xs">
                        <div className="flex items-center gap-1">
                          <Badge className={`${getStatusColor(meeting.status)} text-white text-xs px-2 py-1`}>
                            {meeting.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {meeting.participants.length} students
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatTime(meeting.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error Dialog */}
      {error && (
        <Dialog 
          open={!!error}
          modal={true}
          onOpenChange={(open) => {
            setError('');
            if (!open) {
              setTimeout(() => {
                document.body.style.pointerEvents = "auto";
              }, 0);
            }
          }}
        >
          <DialogContent
            className="sm:max-w-[500px] z-[9999]"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
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
