import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Video, Users, Calendar, Clock, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface JoinClassButtonProps {
  meetingNumber?: string;
  className?: string;
  teacherName?: string;
  course?: string;
  time?: string;
  disabled?: boolean;
  scheduleId?: string;
  studentId?: string;
  studentName?: string;
}

export default function JoinClassButton({ 
  meetingNumber, 
  className: customClassName = "",
  teacherName = "",
  course = "",
  time = "",
  disabled = false,
  scheduleId,
  studentId,
  studentName
}: JoinClassButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [meeting, setMeeting] = useState<any>(null);
  const [error, setError] = useState('');
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();

  const handleJoinClass = async () => {
    if (!currentUser) {
      toast.error('Please login to join class');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      let currentMeetingNumber = meetingNumber;
      let meetingData = null;

      // If no meetingNumber provided, create a new meeting first
      if (!currentMeetingNumber && scheduleId) {
        console.log('No meeting number provided, creating new meeting for schedule:', scheduleId);
        
        const createResponse = await fetch(`${API_BASE_URL}/meetings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            scheduleId: scheduleId,
            teacherName: teacherName || currentUser.name,
            course: course || 'General',
            time: time || new Date().toISOString(),
            studentName: studentName || 'Student',
            studentId: studentId
          })
        });

        const createData = await createResponse.json();
        
        if (createResponse.ok && createData.success) {
          currentMeetingNumber = createData.meeting.meetingNumber;
          meetingData = createData.meeting;
          toast.success('Meeting created successfully!');
        } else {
          throw new Error(createData.error || 'Failed to create meeting');
        }
      }

      if (!currentMeetingNumber) {
        throw new Error('Meeting number is required and could not be created');
      }

      // Register the user as joining the meeting
      const joinResponse = await fetch(`${API_BASE_URL}/meetings/join/${currentMeetingNumber}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.name,
        })
      });

      const joinData = await joinResponse.json();

      if (joinResponse.ok) {
        setMeeting(joinData.meeting || meetingData);
        toast.success('Joined class successfully!');
        
        // Open Zoom meeting with appropriate role based on user type
        const userRole = currentUser.role;
        const role = (userRole === 'teacher') ? 1 : 0; // teacher=1 (host), others=0 (participant)
        window.open(`/zoom-join?meetingNumber=${currentMeetingNumber}&role=${role}`, '_blank');
      } else {
        throw new Error(joinData.error || 'Failed to join class');
      }
    } catch (err) {
      console.error('Error joining class:', err);
      setError(err instanceof Error ? err.message : 'Failed to join class');
      toast.error('Failed to join class');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetMeetingDetails = async () => {
    if (!meetingNumber) return;

    try {
      const response = await fetch(`${API_BASE_URL}/meetings/${meetingNumber}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setMeeting(data.meeting);
      } else {
        throw new Error(data.error || 'Meeting not found');
      }
    } catch (err) {
      console.error('Error getting meeting details:', err);
      setError(err instanceof Error ? err.message : 'Meeting not found');
    }
  };

  // Only students can join classes (but admins can too for testing)
  if (currentUser?.role !== 'student' && currentUser?.role !== 'admin') {
    return null;
  }

  return (
    <Button
      type="button"
      disabled={disabled || isLoading}
      className={`${customClassName} bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200`}
      size="sm"
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('JoinClassButton clicked', { meetingNumber, scheduleId, currentUser: currentUser?.name, role: currentUser?.role });
        
        if (!currentUser) {
          toast.error('Please login to join class');
          return;
        }

        setIsLoading(true);
        setError('');

        try {
          let meetingToJoin = meetingNumber;

          // If no meeting number exists, create one first
          if (!meetingNumber && scheduleId) {
            console.log('No meeting number, creating meeting for schedule:', scheduleId);
            
            const createResponse = await fetch('https://quran-acadamy-crm-production.up.railway.app/api/meetings/start-class', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                scheduleId,
                className: course,
                course,
                teacherId: studentId, // For students, this is their own ID
                teacherName: currentUser.name,
                studentId,
                studentName,
                time
              })
            });

            const createData = await createResponse.json();
            console.log('Create meeting response:', createData);

            if (createData.success) {
              meetingToJoin = createData.meeting.meetingNumber;
              toast.success('Meeting created successfully!');
            } else {
              throw new Error(createData.error || createData.message || 'Failed to create meeting');
            }
          }

          if (!meetingToJoin) {
            throw new Error('No meeting number available');
          }

          // Join the meeting
          const joinResponse = await fetch(`https://quran-acadamy-crm-production.up.railway.app/api/meetings/join/${meetingToJoin}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          const joinData = await joinResponse.json();
          console.log('Join meeting response:', joinData);

          if (joinResponse.ok) {
            toast.success('Joined class successfully!');
            
            // Open Zoom meeting directly with student role (0 = participant)
            const zoomUrl = `/zoom-join?meetingNumber=${meetingToJoin}&role=0`;
            console.log('Opening Zoom in same tab:', zoomUrl);
            navigate(zoomUrl);
          } else {
            throw new Error(joinData.error || joinData.message || 'Failed to join class');
          }
        } catch (err) {
          console.error('Error joining class:', err);
          const errorMessage = err instanceof Error ? err.message : 'Failed to join class';
          setError(errorMessage);
          toast.error(errorMessage);
        } finally {
          setIsLoading(false);
        }
      }}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Joining...
        </>
      ) : (
        <>
          <Video className="w-3 h-3 mr-1" />
          Join Class
        </>
      )}
    </Button>
  );
}
