import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Video, Clock, Users, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface StudentZoomManagerProps {
  meetingNumber?: string;
  scheduleId?: string;
  className?: string;
  teacherName?: string;
  course?: string;
  time?: string;
}

interface Meeting {
  _id: string;
  meetingNumber: string;
  className: string;
  course: string;
  teacherId: string;
  teacherName: string;
  studentId?: string;
  studentName?: string;
  status: 'scheduled' | 'live' | 'ended';
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

type MeetingState = 'no-meeting' | 'teacher-not-joined' | 'teacher-joined' | 'student-joined';

export default function StudentZoomManager({
  meetingNumber,
  scheduleId,
  className = "",
  teacherName,
  course,
  time
}: StudentZoomManagerProps) {
  const { currentUser } = useAuthStore();
  const [meetingState, setMeetingState] = useState<MeetingState>('no-meeting');
  const [isLoading, setIsLoading] = useState(false);
  const [meetingDetails, setMeetingDetails] = useState<Meeting | null>(null);

  useEffect(() => {
    if (meetingNumber) {
      checkMeetingStatus();
      // Set up polling to check teacher presence every 5 seconds
      const interval = setInterval(checkMeetingStatus, 5000);
      return () => clearInterval(interval);
    } else {
      setMeetingState('no-meeting');
    }
  }, [meetingNumber, teacherName]);

  const checkMeetingStatus = async () => {
    if (!meetingNumber) {
      setMeetingState('no-meeting');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/meetings/${meetingNumber}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMeetingDetails(data.meeting);
        
        // Check if teacher has joined
        const teacherJoined = data.meeting.participants?.some((p: any) => 
          p.role === 1 || p.role === 'host' || p.name === teacherName
        );
        
        // Check if student has already joined
        const studentJoined = data.meeting.participants?.some((p: any) => 
          p.userId === currentUser?.id || p.email === currentUser?.email
        );

        // Check meeting status
        const meetingLive = data.meeting.status === 'live';

        console.log('StudentZoomManager - Meeting check:', {
          meetingNumber,
          teacherName,
          teacherJoined,
          studentJoined,
          meetingLive,
          participants: data.meeting.participants
        });

        if (studentJoined) {
          setMeetingState('student-joined');
        } else if (teacherJoined || meetingLive) {
          setMeetingState('teacher-joined');
        } else {
          setMeetingState('teacher-not-joined');
        }
      } else {
        setMeetingState('no-meeting');
      }
    } catch (error) {
      console.error('StudentZoomManager - Error checking meeting status:', error);
      setMeetingState('no-meeting');
    }
  };

  const handleJoinClass = async () => {
    if (!meetingNumber || !currentUser) {
      toast.error('Meeting number or user not available');
      return;
    }

    setIsLoading(true);

    try {
      // Join existing meeting
      const response = await fetch(`${API_BASE_URL}/meetings/${meetingNumber}/join`, {
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
      console.log('StudentZoomManager - Join response:', data);

      if (data.success) {
        toast.success('Joined class successfully');
        setMeetingState('student-joined');
        
        // Navigate to Zoom meeting - student role (0)
        window.open(`/zoom-join?meetingNumber=${meetingNumber}&role=0`, '_blank');
      } else {
        toast.error(data.message || 'Failed to join class');
      }
    } catch (error) {
      console.error('StudentZoomManager - Error joining class:', error);
      toast.error('Failed to join class');
    } finally {
      setIsLoading(false);
    }
  };

  const renderButton = () => {
    console.log('StudentZoomManager - Rendering button for state:', meetingState);
    
    switch (meetingState) {
      case 'no-meeting':
        return (
          <Button
            size="sm"
            variant="outline"
            className="bg-white text-orange-600 hover:bg-orange-50 border-orange-600"
            onClick={() => {
              toast.info('Meeting not started yet. Your teacher will start the class soon.');
            }}
          >
            <Clock className="h-4 w-4 mr-1" />
            Waiting for Teacher
          </Button>
        );

      case 'teacher-not-joined':
        return (
          <Button
            size="sm"
            variant="outline"
            className="bg-white text-yellow-600 hover:bg-yellow-50 border-yellow-600"
            onClick={() => {
              toast.info('Teacher has not joined the class yet. Please wait for your teacher to start the class.');
            }}
          >
            <Users className="h-4 w-4 mr-1" />
            Teacher not Joined
          </Button>
        );

      case 'teacher-joined':
        return (
          <Button
            size="sm"
            variant="outline"
            className="bg-white text-green-600 hover:bg-green-50 border-green-600"
            onClick={handleJoinClass}
            disabled={isLoading}
          >
            <Video className="h-4 w-4 mr-1" />
            {isLoading ? 'Joining...' : 'Join Class'}
          </Button>
        );

      case 'student-joined':
        return (
          <Button
            size="sm"
            variant="outline"
            className="bg-white text-blue-600 hover:bg-blue-50 border-blue-600"
            onClick={() => {
              window.open(`/zoom-join?meetingNumber=${meetingNumber}&role=0`, '_blank');
            }}
          >
            <Video className="h-4 w-4 mr-1" />
            Joined Class
          </Button>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center">
      {renderButton()}
    </div>
  );
}
