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
  const { currentUser } = useAuthStore();
  
  // Debug: Log user state
  console.log('StudentZoomJoiner - User state:', {
    currentUser: currentUser,
    isLoggedIn: !!currentUser,
    userRole: currentUser?.role,
    userName: currentUser?.name
  });
  
  // Debug: Log component props
  console.log('StudentZoomJoiner - Component props:', {
    scheduleId,
    className: buttonClassName,
    course,
    time,
    disabled
  });

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [availableMeetings, setAvailableMeetings] = useState<Meeting[]>([]);
  const [mySchedules, setMySchedules] = useState<Schedule[]>([]);
  const [error, setError] = useState('');

  // Fetch schedules and available meetings on component mount
  useEffect(() => {
    if (currentUser) {
      console.log('StudentZoomJoiner - Fetching data for user:', currentUser.name);
      fetchStudentSchedules();
      fetchAvailableMeetings();
    } else {
      console.log('StudentZoomJoiner - No currentUser available');
    }
  }, [currentUser]);

  const fetchStudentSchedules = async () => {
    try {
      // Use different endpoint based on user role
      let endpoint;
      if (currentUser?.role === 'student') {
        endpoint = `https://quran-acadamy-crm-production.up.railway.app/api/schedules/student/${currentUser?.id}`;
        console.log('Fetching schedules for student:', currentUser?.name);
      } else if (currentUser?.role === 'teacher') {
        endpoint = `https://quran-acadamy-crm-production.up.railway.app/api/schedules/teacher/${currentUser?.id}`;
        console.log('Fetching schedules for teacher:', currentUser?.name);
      } else if (currentUser?.role === 'admin') {
        endpoint = `https://quran-acadamy-crm-production.up.railway.app/api/schedules`;
        console.log('Fetching schedules for admin:', currentUser?.name);
      } else {
        endpoint = `https://quran-acadamy-crm-production.up.railway.app/api/schedules`;
        console.log('Fetching schedules for user:', currentUser?.role);
      }

      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        console.log('StudentZoomJoiner - Schedules response:', data);
        if (data.success) {
          setMySchedules(data.schedules || []);
          console.log(`Fetched ${data.schedules?.length || 0} schedules for ${currentUser?.role} (${currentUser?.name})`);
          console.log('StudentZoomJoiner - Schedules data:', data.schedules);
        } else {
          console.log('StudentZoomJoiner - Failed to fetch schedules:', data.message);
        }
      } else {
        console.log('StudentZoomJoiner - Failed to fetch schedules, status:', response.status);
      }
    } catch (err) {
      console.error('Error fetching schedules:', err);
    }
  };

  const fetchAvailableMeetings = async () => {
    try {
      // Use role-specific endpoint for available meetings
      let endpoint;
      if (currentUser?.role === 'student') {
        endpoint = 'https://quran-acadamy-crm-production.up.railway.app/api/meetings/student/available';
      } else if (currentUser?.role === 'teacher') {
        endpoint = 'https://quran-acadamy-crm-production.up.railway.app/api/meetings/teacher/available';
      } else if (currentUser?.role === 'admin') {
        endpoint = 'https://quran-acadamy-crm-production.up.railway.app/api/meetings/available';
      } else {
        endpoint = 'https://quran-acadamy-crm-production.up.railway.app/api/meetings/available';
      }

      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        console.log('StudentZoomJoiner - Available meetings response:', data);
        if (data.success) {
          setAvailableMeetings(data.meetings || []);
          console.log(`Fetched ${data.meetings?.length || 0} available meetings for ${currentUser?.role}`);
          console.log('StudentZoomJoiner - Available meetings data:', data.meetings);
        } else {
          console.log('StudentZoomJoiner - Failed to fetch available meetings:', data.message);
        }
      } else {
        console.log('StudentZoomJoiner - Failed to fetch available meetings, status:', response.status);
      }
    } catch (err) {
      console.error('Error fetching available meetings:', err);
    }
  };

  const handleJoinClass = async (scheduleId?: string, meetingId?: string) => {
    console.log('=== HANDLE JOIN CLASS CALLED ===');
    console.log('StudentZoomJoiner - handleJoinClass called with:', {
      scheduleId,
      meetingId
    });
    
    // Get current user state
    const { currentUser: freshUser } = useAuthStore.getState();
    
    console.log('StudentZoomJoiner - Fresh user state:', {
      freshUser,
      isLoggedIn: !!freshUser,
      userName: freshUser?.name,
      userRole: freshUser?.role
    });
    
    if (!freshUser) {
      console.log('StudentZoomJoiner - No user found, showing login error');
      toast.error("Please login to join class");
      return;
    }
    
    console.log('StudentZoomJoiner - User authenticated, proceeding with join');

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
            userId: freshUser.id,
            userName: freshUser.name,
          })
        });

        const data = await response.json();
        if (data.success) {
          setMeeting(data.meeting);
          toast.success('Joined class successfully');
          
          // Navigate to Zoom meeting - role will be determined by user type in ZoomMeetingClean component
          navigate(`/zoom-join?meetingNumber=${data.meeting.meetingNumber}`);
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
          studentId: freshUser.id,
          studentName: freshUser.name,
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
          
          // Navigate to Zoom meeting - role will be determined by user type in ZoomMeetingClean component
          navigate(`/zoom-join?meetingNumber=${data.meeting.meetingNumber}`);
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
      {/* TEST BUTTON - Remove after debugging */}
      <div className="bg-red-100 border border-red-300 rounded-lg p-4">
        <h4 className="text-red-800 font-bold mb-2">DEBUG TEST BUTTON</h4>
        <Button
          onClick={() => {
            console.log('TEST BUTTON CLICKED!');
            alert('Test button clicked successfully!');
          }}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          Click Me For Test
        </Button>
      </div>

      {/* Join Class Button */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-blue-200 p-6">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Ready to Join Your Class?</h3>
          <p className="text-sm text-gray-600">Click the button below to enter your Zoom classroom</p>
        </div>
        <Button
          onClick={() => {
            console.log('=== STUDENT JOIN BUTTON CLICKED ===');
            console.log('StudentZoomJoiner - Button state:', {
              scheduleId,
              availableMeetings: availableMeetings.length,
              mySchedules: mySchedules.length,
              currentUser: !!currentUser,
              isLoading,
              currentUserDetails: currentUser
            });
            
            alert('Join button clicked! Check console for details.');
            
            // If no specific scheduleId, try to join first available meeting
            if (scheduleId) {
              console.log('StudentZoomJoiner - Joining with scheduleId:', scheduleId);
              handleJoinClass(scheduleId);
            } else if (availableMeetings.length > 0) {
              console.log('StudentZoomJoiner - Joining first available meeting:', availableMeetings[0]);
              handleJoinClass(undefined, availableMeetings[0]._id);
            } else if (mySchedules.length > 0) {
              console.log('StudentZoomJoiner - Joining first schedule:', mySchedules[0]);
              handleJoinClass(mySchedules[0]._id);
            } else {
              console.log('StudentZoomJoiner - No classes available to join');
              toast.error("No available classes to join");
            }
          }}
          disabled={isLoading}
          title={isLoading ? "Joining..." : "Click to join class"}
          className={`${buttonClassName} bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto text-lg px-8 py-3`}
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
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-700">My Classes</p>
                    <p className="text-3xl font-bold text-blue-800">{mySchedules.length}</p>
                  </div>
                  <div className="bg-blue-200 p-3 rounded-full shadow-md">
                    <Calendar className="w-6 h-6 text-blue-800" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-green-700">Available</p>
                    <p className="text-3xl font-bold text-green-800">{availableMeetings.length}</p>
                  </div>
                  <div className="bg-green-200 p-3 rounded-full shadow-md">
                    <Video className="w-6 h-6 text-green-800" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-red-700">Live Now</p>
                    <p className="text-3xl font-bold text-red-800">
                      {availableMeetings.filter(m => m.status === 'live').length}
                    </p>
                  </div>
                  <div className="bg-red-200 p-3 rounded-full shadow-md">
                    <Users className="w-6 h-6 text-red-800" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-purple-700">Teachers</p>
                    <p className="text-3xl font-bold text-purple-800">
                      {new Set(availableMeetings.map(m => m.teacherName)).size}
                    </p>
                  </div>
                  <div className="bg-purple-200 p-3 rounded-full shadow-md">
                    <User className="w-6 h-6 text-purple-800" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Classes Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* My Scheduled Classes */}
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-white to-blue-50 border-blue-200">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Calendar className="w-5 h-5 text-white" />
                  My Scheduled Classes
                  <Badge variant="secondary" className="bg-white text-blue-600 font-semibold">
                    {mySchedules.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {mySchedules.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-blue-300" />
                    <p className="text-lg font-medium text-gray-700">No scheduled classes</p>
                    <p className="text-sm mt-2 text-gray-500">Your scheduled classes will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mySchedules.map((schedule) => (
                      <div key={schedule._id} className="bg-white rounded-xl border border-blue-200 p-4 hover:shadow-lg transition-all duration-300 hover:border-blue-300">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="font-bold text-lg text-gray-900 mb-2">{schedule.className}</h4>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-600 flex items-center gap-2">
                                <span className="font-medium">Course:</span> {schedule.course}
                              </p>
                              <p className="text-sm text-gray-600 flex items-center gap-2">
                                <span className="font-medium">Teacher:</span> {schedule.teacherName}
                              </p>
                              <p className="text-xs text-gray-500 flex items-center gap-2 mt-2">
                                <Calendar className="w-3 h-3" />
                                {schedule.day} at {schedule.time}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-blue-100 text-blue-700 font-medium px-3 py-1">
                            {schedule.status}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleJoinClass(schedule._id)}
                          disabled={isLoading}
                          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-6 py-2"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Join Class
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Available Live Classes */}
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-white to-green-50 border-green-200">
              <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Video className="w-5 h-5 text-white" />
                  Available Classes
                  <Badge variant="secondary" className="bg-white text-green-600 font-semibold">
                    {availableMeetings.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {availableMeetings.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Video className="w-16 h-16 mx-auto mb-4 text-green-300" />
                    <p className="text-lg font-medium text-gray-700">No available classes</p>
                    <p className="text-sm mt-2 text-gray-500">Check back later for available classes</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {availableMeetings.map((meeting) => (
                      <div key={meeting._id} className="bg-white rounded-xl border border-green-200 p-4 hover:shadow-lg transition-all duration-300 hover:border-green-300">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="font-bold text-lg text-gray-900 mb-2">{meeting.className}</h4>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-600 flex items-center gap-2">
                                <span className="font-medium">Course:</span> {meeting.course}
                              </p>
                              <p className="text-sm text-gray-600 flex items-center gap-2">
                                <span className="font-medium">Teacher:</span> {meeting.teacherName}
                              </p>
                              <p className="text-xs text-gray-500 flex items-center gap-2 mt-2">
                                <Video className="w-3 h-3" />
                                {meeting.startedAt ? `Started: ${formatTime(meeting.startedAt)}` : `Created: ${formatTime(meeting.createdAt)}`}
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
                        <Button
                          size="sm"
                          onClick={() => handleJoinClass(undefined, meeting._id)}
                          disabled={!canJoinMeeting(meeting) || isLoading}
                          className={meeting.status === 'live' ? 
                            "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-6 py-2" : 
                            "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-6 py-2"
                          }
                        >
                          {meeting.status === 'live' ? (
                            <>
                              <Video className="w-4 h-4 mr-2" />
                              Join Live Now
                            </>
                          ) : (
                            <>
                              <Calendar className="w-4 h-4 mr-2" />
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
