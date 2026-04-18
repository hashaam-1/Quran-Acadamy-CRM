import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Video, Users, Calendar, Clock, Play, Square, Eye, Settings, Edit, BookOpen } from 'lucide-react';
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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
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

  const handleEditMeeting = (meeting: Meeting) => {
    console.log('TeacherZoomManager - Editing meeting:', meeting);
    setEditingMeeting(meeting);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingMeeting) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`https://quran-acadamy-crm-production.up.railway.app/api/meetings/${editingMeeting._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editingMeeting)
      });

      if (response.ok) {
        toast.success("Meeting updated successfully");
        setEditDialogOpen(false);
        setEditingMeeting(null);
        fetchTeacherMeetings(); // Refresh the meetings
      } else {
        throw new Error('Failed to update meeting');
      }
    } catch (err) {
      console.error('Error updating meeting:', err);
      toast.error("Failed to update meeting");
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-visible">
              {scheduledMeetings.map((meeting) => (
                <div
                  key={meeting._id}
                  className="group relative bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl hover:border-blue-400 transition-all duration-300"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Video className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          {meeting.className}
                        </h3>
                        <p className="text-sm text-gray-600">{meeting.course}</p>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(meeting.status)} text-white`}>
                      {meeting.status}
                    </Badge>
                  </div>

                  {/* Content */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>Created: {formatTime(meeting.createdAt)}</span>
                    </div>
                  </div>

                  {/* Hover Buttons */}
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2 z-10">
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleJoinMeeting(meeting);
                      }}
                    >
                      {meeting.status === "live" ? "Join Live" : "Start Class"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white hover:bg-gray-50 shadow-lg"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleEditMeeting(meeting);
                      }}
                    >
                      Edit
                    </Button>
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

      {/* Edit Meeting Dialog */}
      {editingMeeting && (
        <Dialog 
          open={editDialogOpen}
          modal={true}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) {
              setTimeout(() => {
                document.body.style.pointerEvents = "auto";
              }, 0);
              setEditingMeeting(null);
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
                Edit Meeting
              </DialogTitle>
              <DialogDescription className="text-blue-100">
                Update the details for your {editingMeeting.course} meeting
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Video className="w-4 h-4 text-blue-600" />
                    Class Name
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    value={editingMeeting.className}
                    onChange={(e) => setEditingMeeting({...editingMeeting, className: e.target.value})}
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
                    value={editingMeeting.course}
                    onChange={(e) => setEditingMeeting({...editingMeeting, course: e.target.value})}
                    placeholder="Enter course name"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-700">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">Meeting ID: {editingMeeting.meetingNumber}</span>
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
                    setEditingMeeting(null);
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
