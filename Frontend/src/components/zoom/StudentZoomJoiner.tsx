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

  // Fetch schedules and available meetings on component mount
  useEffect(() => {
    if (currentUser) {
      fetchStudentSchedules();
      fetchAvailableMeetings();
    }
  }, [currentUser]);

  const fetchStudentSchedules = async () => {
    try {
      // Use different endpoint based on user role
      let endpoint;
      if (currentUser?.role === 'student') {
        endpoint = `https://quran-acadamy-crm-production.up.railway.app/api/schedules/student/${currentUser?.id}`;
      } else if (currentUser?.role === 'teacher') {
        endpoint = `https://quran-acadamy-crm-production.up.railway.app/api/schedules/teacher/${currentUser?.id}`;
      } else {
        endpoint = `https://quran-acadamy-crm-production.up.railway.app/api/schedules`;
      }

      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMySchedules(data.schedules || []);
          console.log(`Fetched ${data.schedules?.length || 0} schedules for ${currentUser?.role}`);
        }
      }
    } catch (err) {
      console.error('Error fetching schedules:', err);
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
    <div className="space-y-6">
      {/* Join Class Button */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <Button
          onClick={() => handleJoinClass(scheduleId)}
          disabled={disabled || isLoading}
          className={`${buttonClassName} w-full sm:w-auto`}
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
      </div>

      {/* User Dashboard */}
      {currentUser && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">My Classes</p>
                    <p className="text-2xl font-bold text-blue-600">{mySchedules.length}</p>
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
                    <p className="text-sm font-medium text-gray-600">Available</p>
                    <p className="text-2xl font-bold text-green-600">{availableMeetings.length}</p>
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
                    <p className="text-sm font-medium text-gray-600">Live Now</p>
                    <p className="text-2xl font-bold text-red-600">
                      {availableMeetings.filter(m => m.status === 'live').length}
                    </p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-full">
                    <Users className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Teachers</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {new Set(availableMeetings.map(m => m.teacherName)).size}
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <User className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Classes Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* My Scheduled Classes */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  My Scheduled Classes
                  <Badge variant="secondary" className="bg-blue-200 text-blue-800">
                    {mySchedules.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {mySchedules.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No scheduled classes</p>
                    <p className="text-sm mt-2">Your scheduled classes will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mySchedules.map((schedule) => (
                      <div key={schedule._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{schedule.className}</h4>
                            <p className="text-sm text-gray-600">{schedule.course}</p>
                            <p className="text-sm text-gray-600">Teacher: {schedule.teacherName}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {schedule.day} at {schedule.time}
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {schedule.status}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleJoinClass(schedule._id)}
                          disabled={isLoading}
                          className="hover:bg-blue-600"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Join
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Available Live Classes */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-green-600" />
                  Available Classes
                  <Badge variant="secondary" className="bg-green-200 text-green-800">
                    {availableMeetings.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {availableMeetings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Video className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No available classes</p>
                    <p className="text-sm mt-2">Check back later for available classes</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableMeetings.map((meeting) => (
                      <div key={meeting._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{meeting.className}</h4>
                            <p className="text-sm text-gray-600">{meeting.course}</p>
                            <p className="text-sm text-gray-600">Teacher: {meeting.teacherName}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {meeting.startedAt ? `Started: ${formatTime(meeting.startedAt)}` : `Created: ${formatTime(meeting.createdAt)}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`${getStatusColor(meeting.status)} text-white`}>
                              {meeting.status}
                            </Badge>
                            <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                              <Users className="w-4 h-4 text-gray-600" />
                              <span className="text-sm font-medium">{meeting.participants.length}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleJoinClass(undefined, meeting._id)}
                          disabled={!canJoinMeeting(meeting) || isLoading}
                          className={meeting.status === 'live' ? "hover:bg-green-600" : "hover:bg-blue-600"}
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
