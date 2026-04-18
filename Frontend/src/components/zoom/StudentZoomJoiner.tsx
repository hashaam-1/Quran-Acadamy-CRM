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
                  className="group relative bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-lg transition-all duration-200 cursor-pointer"
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
                  
                  {/* Hover Action Buttons */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg"
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
                            Join
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isLoading}
                        className="bg-white hover:bg-gray-100 text-gray-700 border-white shadow-lg"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEditSchedule(schedule);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" />
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

      {/* Edit Schedule Dialog */}
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
            className="sm:max-w-[500px] z-[9999]"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>Edit Class Schedule</DialogTitle>
              <DialogDescription>
                Update the details for your {editingSchedule.course} class
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Class Name</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  value={editingSchedule.className}
                  onChange={(e) => setEditingSchedule({...editingSchedule, className: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Course</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  value={editingSchedule.course}
                  onChange={(e) => setEditingSchedule({...editingSchedule, course: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Day</label>
                <select
                  className="w-full p-2 border rounded-md"
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
                <label className="text-sm font-medium">Time</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  value={editingSchedule.time}
                  onChange={(e) => setEditingSchedule({...editingSchedule, time: e.target.value})}
                  placeholder="e.g., 2:00 PM"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditDialogOpen(false);
                    setEditingSchedule(null);
                  }}
                  className="flex-1"
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
