import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Video, Users, Calendar, Clock, Play, BookOpen, User, Edit, Settings } from 'lucide-react';
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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

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

  const handleEditSchedule = (schedule: Schedule) => {
    console.log('StudentZoomJoiner - Editing schedule:', schedule);
    setEditingSchedule(schedule);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingSchedule) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`https://quran-acadamy-crm-production.up.railway.app/api/schedules/${editingSchedule._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editingSchedule)
      });

      if (response.ok) {
        toast.success("Schedule updated successfully");
        setEditDialogOpen(false);
        setEditingSchedule(null);
        fetchStudentSchedules(); // Refresh the schedules
      } else {
        throw new Error('Failed to update schedule');
      }
    } catch (err) {
      console.error('Error updating schedule:', err);
      toast.error("Failed to update schedule");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Only Scheduled Classes with Hover Join Button */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">My Classes</h2>
          <p className="text-sm text-gray-600 mt-1">Hover over classes to join</p>
        </div>
        
        <div className="p-6">
          {mySchedules.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-700">No scheduled classes</p>
              <p className="text-sm mt-2 text-gray-500">Your scheduled classes will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mySchedules.map((schedule) => (
                <div
                  key={schedule._id}
                  className="group relative bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-lg transition-all duration-200 relative overflow-hidden"
                >
                  {/* Class Info */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900">{schedule.className}</h3>
                    <p className="text-sm text-gray-600">{schedule.course}</p>
                    <p className="text-sm text-gray-500">Teacher: {schedule.teacherName}</p>
                    <p className="text-xs text-gray-400">{schedule.day} at {schedule.time}</p>
                    <Badge className="bg-blue-100 text-blue-700 text-xs">
                      {schedule.status}
                    </Badge>
                  </div>
                  
                  {/* Perfect Right-Side Hover Panel */}
                  <div className="absolute top-0 right-0 h-full w-80 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 shadow-2xl transform translate-x-full group-hover:translate-x-0 transition-all duration-500 ease-out pointer-events-none rounded-r-lg">
                    <div className="p-6 h-full flex flex-col justify-between">
                      {/* Header Section */}
                      <div className="space-y-4">
                        <div className="text-center pb-4 border-b border-white/20">
                          <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                            <Video className="w-8 h-8 text-white" />
                          </div>
                          <h4 className="text-white font-bold text-xl mb-1">{schedule.className}</h4>
                          <p className="text-blue-200 text-sm font-medium">{schedule.course}</p>
                          <Badge className="bg-blue-500 text-white text-xs px-3 py-1 mt-2 shadow-lg">
                            SCHEDULED
                          </Badge>
                        </div>

                        {/* Class Details */}
                        <div className="space-y-3 bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                          <div className="flex items-center justify-between text-white/90 text-sm">
                            <span className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-green-300" />
                              Day
                            </span>
                            <span className="font-bold text-white">{schedule.day}</span>
                          </div>
                          <div className="flex items-center justify-between text-white/90 text-sm">
                            <span className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-orange-300" />
                              Time
                            </span>
                            <span className="font-bold text-white">{schedule.time}</span>
                          </div>
                          <div className="flex items-center justify-between text-white/90 text-sm">
                            <span className="flex items-center gap-2">
                              <User className="w-4 h-4 text-purple-300" />
                              Teacher
                            </span>
                            <span className="font-bold text-white">{schedule.teacherName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-3">
                        <Button
                          type="button"
                          size="lg"
                          disabled={isLoading}
                          className="pointer-events-auto w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold shadow-xl hover:shadow-green-500/30 transform hover:scale-105 transition-all duration-300 border-0"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleJoinClass(schedule._id);
                          }}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Joining...
                            </>
                          ) : (
                            <>
                              <Video className="w-5 h-5 mr-2" />
                              Join Class
                            </>
                          )}
                        </Button>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            type="button"
                            size="lg"
                            variant="outline"
                            disabled={isLoading}
                            className="pointer-events-auto bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50 font-medium shadow-lg hover:shadow-white/20 transform hover:scale-105 transition-all duration-300 backdrop-blur-sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleEditSchedule(schedule);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="lg"
                            variant="outline"
                            disabled={isLoading}
                            className="pointer-events-auto bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/30 hover:border-blue-500/50 font-medium shadow-lg hover:shadow-blue-500/20 transform hover:scale-105 transition-all duration-300 backdrop-blur-sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // Add view details functionality here
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
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

      {/* Enhanced Edit Schedule Dialog */}
      {editingSchedule && (
        <Dialog 
          open={editDialogOpen}
          modal={true}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) {
              setTimeout(() => {
                document.body.style.pointerEvents = "auto";
              }, 0);
              setEditingSchedule(null);
            }
          }}
        >
          <DialogContent
            className="sm:max-w-[600px] z-[9999] bg-gradient-to-br from-white to-blue-50 border-blue-200"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <DialogHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg -m-6 mb-6 p-6">
              <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Edit Class Schedule
              </DialogTitle>
              <DialogDescription className="text-blue-100">
                Update the details for your {editingSchedule.course} class
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    Class Name
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    value={editingSchedule.className}
                    onChange={(e) => setEditingSchedule({...editingSchedule, className: e.target.value})}
                    placeholder="Enter class name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-600" />
                    Course
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    value={editingSchedule.course}
                    onChange={(e) => setEditingSchedule({...editingSchedule, course: e.target.value})}
                    placeholder="Enter course name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-green-600" />
                    Day
                  </label>
                  <select
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    value={editingSchedule.day}
                    onChange={(e) => setEditingSchedule({...editingSchedule, day: e.target.value})}
                  >
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    Time
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    value={editingSchedule.time}
                    onChange={(e) => setEditingSchedule({...editingSchedule, time: e.target.value})}
                    placeholder="e.g., 2:00 PM"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-700">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">Teacher: {editingSchedule.teacherName}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditDialogOpen(false);
                    setEditingSchedule(null);
                  }}
                  className="flex-1 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
