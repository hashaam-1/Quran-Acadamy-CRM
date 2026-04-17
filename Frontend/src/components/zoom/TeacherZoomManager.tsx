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
    // Navigate to Zoom meeting with teacher role (1 = host)
    navigate(`/zoom-join?meetingNumber=${meeting.meetingNumber}&role=1`);
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
      {/* Start Class Button */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <Button
          onClick={handleStartClass}
          disabled={disabled || isLoading}
          className={`${buttonClassName} bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 w-full sm:w-auto`}
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Starting Class...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Start Class
            </>
          )}
        </Button>
      </div>

      {/* Teacher Dashboard */}
      {currentUser?.role === 'teacher' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Live Classes</p>
                    <p className="text-2xl font-bold text-green-600">{liveMeetings.length}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <Video className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Scheduled</p>
                    <p className="text-2xl font-bold text-blue-600">{scheduledMeetings.length}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {liveMeetings.reduce((sum, m) => sum + m.participants.length, 0)}
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Today's Classes</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {liveMeetings.length + scheduledMeetings.length}
                    </p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-full">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Meetings Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Meetings */}
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-white to-green-50 border-green-200">
              <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Video className="w-5 h-5 text-white" />
                  Live Classes
                  <Badge variant="secondary" className="bg-white text-green-600 font-semibold">
                    {liveMeetings.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {liveMeetings.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Video className="w-16 h-16 mx-auto mb-4 text-green-300" />
                    <p className="text-lg font-medium text-gray-700">No live classes</p>
                    <p className="text-sm mt-2 text-gray-500">Start a class to see it here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {liveMeetings.map((meeting) => (
                      <div key={meeting._id} className="bg-white rounded-xl border border-green-200 p-4 hover:shadow-lg transition-all duration-300 hover:border-green-300">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="font-bold text-lg text-gray-900 mb-2">{meeting.className}</h4>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-600 flex items-center gap-2">
                                <span className="font-medium">Course:</span> {meeting.course}
                              </p>
                              <p className="text-xs text-gray-500 flex items-center gap-2 mt-2">
                                <Video className="w-3 h-3" />
                                Started: {meeting.startedAt ? formatTime(meeting.startedAt) : 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Badge className={`${getStatusColor(meeting.status)} text-white font-medium px-3 py-1`}>
                              {meeting.status}
                            </Badge>
                            <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                              <Users className="w-4 h-4 text-gray-600" />
                              <span className="text-sm font-medium">{meeting.participants.length}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleJoinMeeting(meeting)}
                            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-6 py-2"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Join Live
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleEndClass(meeting._id)}
                            disabled={isLoading}
                            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-6 py-2"
                          >
                            <Square className="w-4 h-4 mr-2" />
                            End Class
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Scheduled Meetings */}
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-white to-blue-50 border-blue-200">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Calendar className="w-5 h-5 text-white" />
                  Scheduled Classes
                  <Badge variant="secondary" className="bg-white text-blue-600 font-semibold">
                    {scheduledMeetings.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {scheduledMeetings.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-blue-300" />
                    <p className="text-lg font-medium text-gray-700">No scheduled classes</p>
                    <p className="text-sm mt-2 text-gray-500">Create schedules to see them here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {scheduledMeetings.map((meeting) => (
                      <div key={meeting._id} className="bg-white rounded-xl border border-blue-200 p-4 hover:shadow-lg transition-all duration-300 hover:border-blue-300">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="font-bold text-lg text-gray-900 mb-2">{meeting.className}</h4>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-600 flex items-center gap-2">
                                <span className="font-medium">Course:</span> {meeting.course}
                              </p>
                              <p className="text-xs text-gray-500 flex items-center gap-2 mt-2">
                                <Calendar className="w-3 h-3" />
                                Created: {formatTime(meeting.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Badge className={`${getStatusColor(meeting.status)} text-white font-medium px-3 py-1`}>
                              {meeting.status}
                            </Badge>
                            <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                              <Users className="w-4 h-4 text-gray-600" />
                              <span className="text-sm font-medium">{meeting.participants.length}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleJoinMeeting(meeting)}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-6 py-2"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Start Class
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleEndClass(meeting._id)}
                            disabled={isLoading}
                            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-6 py-2"
                          >
                            <Square className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
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
