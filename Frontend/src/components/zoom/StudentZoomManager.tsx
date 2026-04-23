import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Video, Clock } from 'lucide-react';
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

export default function StudentZoomManager({
  meetingNumber,
  scheduleId,
  className = "",
  teacherName,
  course,
  time
}: StudentZoomManagerProps) {
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinClass = async () => {
    if (!currentUser) {
      toast.error('Please login to join class');
      return;
    }

    setIsLoading(true);

    try {
      let response;
      
      // Get auth token
      const token = localStorage.getItem('token');
      
      // If meeting number exists, join existing meeting
      if (meetingNumber) {
        console.log('StudentZoomManager - Joining existing meeting:', meetingNumber);
        response = await fetch(`${API_BASE_URL}/meetings/${meetingNumber}/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            userId: currentUser.id,
            userName: currentUser.name,
          })
        });
      } 
      // Otherwise, create/join from schedule
      else if (scheduleId) {
        console.log('StudentZoomManager - Creating/joining from schedule:', scheduleId);
        
        // Get teacherId from the schedule data - we need to fetch it first
        const scheduleResponse = await fetch(`${API_BASE_URL}/schedules/${scheduleId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const scheduleData = await scheduleResponse.json();
        const actualTeacherId = scheduleData.teacherId || '';
        
        const payload = {
          scheduleId: scheduleId,
          className: course || 'Class',
          course: course,
          teacherId: actualTeacherId, // ✅ Use actual teacher ID instead of empty string
          teacherName: teacherName || '',
          studentId: currentUser.id,
          studentName: currentUser.name,
          time: time || new Date().toISOString()
        };

        response = await fetch(`${API_BASE_URL}/meetings/start-class`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        throw new Error('No meeting number or schedule ID available');
      }

      const data = await response.json();
      console.log('StudentZoomManager - Join response:', data);

      if (data.success) {
        toast.success(data.rejoin ? "Rejoined existing class" : "Joined class successfully");
        
        // Navigate to Zoom meeting - student role (1 = participant)
        const meetingNum = data.meeting?.meetingNumber || meetingNumber;
        navigate(`/zoom-join?meetingNumber=${meetingNum}&role=1`);
      } else {
        throw new Error(data.message || 'Failed to join class');
      }
    } catch (error) {
      console.error('StudentZoomManager - Error joining class:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to join class');
    } finally {
      setIsLoading(false);
    }
  };

  // Always show Join Class button - backend will handle meeting creation/joining
  return (
    <div className="flex flex-col items-center">
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
    </div>
  );
}
