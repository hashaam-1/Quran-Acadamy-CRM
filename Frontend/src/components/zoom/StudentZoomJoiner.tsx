import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Video, Users, Clock, Play, BookOpen, User, Edit, Settings, Eye, Pencil } from 'lucide-react';
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
  teacherId?: string;
  teacherName: string;
  studentId?: string;
  studentName?: string;
  time: string;
  day: string;
  duration?: string;
  status: string;
  meetingNumber?: string;
  createdAt?: string;
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
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingSchedule, setViewingSchedule] = useState<Schedule | null>(null);
  
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
          const schedules = data.schedules || [];
          console.log(`Fetched ${schedules.length} schedules for ${currentUser?.role} (${currentUser?.name})`);
          console.log('StudentZoomJoiner - Schedules data:', data.schedules);
          
          setMySchedules(schedules); // IMPORTANT FIX
        } else {
          console.log('StudentZoomJoiner - Failed to fetch schedules:', data.message);
        }
      } else {
        console.log('StudentZoomJoiner - Failed to fetch schedules, status:', response.status);
      }
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setMySchedules([]);
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

  const handleViewSchedule = (schedule: Schedule) => {
    console.log('StudentZoomJoiner - Viewing schedule:', schedule);
    setViewingSchedule(schedule);
    setViewDialogOpen(true);
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
          {/* Debug info */}
          <div className="mb-4 text-xs text-gray-500">
            Debug: Schedules: {mySchedules.length}
          </div>
          
          {mySchedules.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-lg font-medium text-gray-700">No scheduled classes</p>
              <p className="text-sm mt-2 text-gray-500">Your scheduled classes will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-visible">
              {mySchedules.map((schedule) => (
                <div
                  key={schedule._id}
                  className="group relative bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl hover:border-blue-400 transition-all duration-300 overflow-visible cursor-pointer"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Video className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          {schedule.className}
                        </h3>
                        <p className="text-sm text-gray-600">{schedule.course}</p>
                      </div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700">
                      {schedule.status}
                    </Badge>
                  </div>

                  {/* Content */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <User className="w-4 h-4" />
                      <span>Teacher: {schedule.teacherName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{schedule.day} at {schedule.time}</span>
                    </div>
                  </div>

                  {/* Hover Buttons - Improved */}
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out rounded-xl z-50 flex items-center justify-center pointer-events-none">
                    <div className="flex gap-3 p-4 bg-white/20 rounded-xl backdrop-blur-sm border border-white/30 pointer-events-auto">
                      
                      {/* Debug status */}
                      <div className="absolute top-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
                        {schedule.status || 'scheduled'}
                      </div>
                      
                      {/* Always show both buttons */}
                      <Button
                        className="bg-green-600 hover:bg-green-700 text-white shadow-2xl px-6 py-3 font-semibold rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-green-600/50"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleJoinClass(schedule._id);
                        }}
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

                      <Button
                        variant="outline"
                        className="bg-white hover:bg-gray-50 text-gray-800 shadow-2xl px-6 py-3 font-semibold rounded-xl border-2 border-gray-300 transition-all duration-200 hover:scale-105 hover:shadow-gray-400/50"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEditSchedule(schedule);
                        }}
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
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

      {/* View Schedule Dialog */}
      {viewingSchedule && (
        <Dialog 
          open={viewDialogOpen}
          modal={true}
          onOpenChange={(open) => {
            setViewDialogOpen(open);
            if (!open) {
              setTimeout(() => {
                document.body.style.pointerEvents = "auto";
              }, 0);
              setViewingSchedule(null);
            }
          }}
        >
          <DialogContent
            className="sm:max-w-[600px] z-[9999] bg-gradient-to-br from-white to-blue-50 border-blue-200"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <DialogHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg -m-6 mb-6 p-6">
              <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Class Details
              </DialogTitle>
              <DialogDescription className="text-blue-100">
                View detailed information for your {viewingSchedule.course} class
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="text-center pb-4 border-b border-gray-200">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <Video className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{viewingSchedule.className}</h3>
                <p className="text-lg text-gray-600 font-medium">{viewingSchedule.course}</p>
                <Badge className="bg-blue-500 text-white text-sm px-4 py-2 mt-3 shadow-lg">
                  {viewingSchedule.status.toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 text-blue-700">
                      <Calendar className="w-5 h-5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Day</p>
                        <p className="text-lg font-bold text-blue-700">{viewingSchedule.day}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 text-green-700">
                      <Clock className="w-5 h-5" />
                      <div>
                        <p className="text-sm font-medium text-green-900">Time</p>
                        <p className="text-lg font-bold text-green-700">{viewingSchedule.time}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 text-purple-700">
                      <User className="w-5 h-5" />
                      <div>
                        <p className="text-sm font-medium text-purple-900">Teacher</p>
                        <p className="text-lg font-bold text-purple-700">{viewingSchedule.teacherName}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 text-orange-700">
                      <BookOpen className="w-5 h-5" />
                      <div>
                        <p className="text-sm font-medium text-orange-900">Course Type</p>
                        <p className="text-lg font-bold text-orange-700">{viewingSchedule.course}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    handleJoinClass(viewingSchedule._id);
                    setViewDialogOpen(false);
                  }}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setViewDialogOpen(false);
                    setViewingSchedule(null);
                  }}
                  className="flex-1 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium"
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
