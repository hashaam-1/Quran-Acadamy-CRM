import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Video, Users, Calendar, Clock, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'sonner';

interface JoinClassButtonProps {
  meetingNumber?: string;
  className?: string;
  teacherName?: string;
  course?: string;
  time?: string;
  disabled?: boolean;
}

export default function JoinClassButton({ 
  meetingNumber, 
  className: customClassName = "",
  teacherName = "",
  course = "",
  time = "",
  disabled = false
}: JoinClassButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [meeting, setMeeting] = useState<any>(null);
  const [error, setError] = useState('');
  const { currentUser } = useAuthStore();

  const handleJoinClass = async () => {
    if (!currentUser) {
      toast.error('Please login to join class');
      return;
    }

    if (!meetingNumber) {
      toast.error('Meeting number is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // First, register the student as joining the meeting
      const response = await fetch(`https://quran-acadamy-crm-production.up.railway.app/api/meetings/join/${meetingNumber}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setMeeting(data.meeting);
        toast.success('Joined class successfully!');
        
        // Open Zoom meeting for student (role: 0)
        window.open(`/zoom-join?meetingNumber=${meetingNumber}&role=0`, '_blank');
      } else {
        throw new Error(data.error || 'Failed to join class');
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
      const response = await fetch(`https://quran-acadamy-crm-production.up.railway.app/api/meetings/${meetingNumber}`, {
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
        
        if (!currentUser) {
          toast.error('Please login to join class');
          return;
        }

        if (!meetingNumber) {
          toast.error('Meeting number is required');
          return;
        }

        setIsLoading(true);
        setError('');

        try {
          // Register the student as joining the meeting
          const response = await fetch(`https://quran-acadamy-crm-production.up.railway.app/api/meetings/join/${meetingNumber}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          const data = await response.json();

          if (response.ok) {
            toast.success('Joined class successfully!');
            
            // Open Zoom meeting for student (role: 0)
            window.open(`/zoom-join?meetingNumber=${meetingNumber}&role=0`, '_blank');
          } else {
            throw new Error(data.error || 'Failed to join class');
          }
        } catch (err) {
          console.error('Error joining class:', err);
          setError(err instanceof Error ? err.message : 'Failed to join class');
          toast.error('Failed to join class');
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
