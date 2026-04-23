import React from 'react';
import { Button } from '@/components/ui/button';
import { Video, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/auth-store';

interface StudentMeetingButtonProps {
  meetingNumber?: string;
  scheduleId?: string;
  className?: string;
  teacherName?: string;
  course?: string;
  time?: string;
}

export default function StudentMeetingButton({
  meetingNumber,
  scheduleId,
  className = "",
  teacherName,
  course,
  time
}: StudentMeetingButtonProps) {
  const { currentUser } = useAuthStore();

  const handleJoinClass = async () => {
    if (!meetingNumber || !currentUser) {
      toast.error('Meeting number or user not available');
      return;
    }

    try {
      // Open Zoom meeting for student
      window.open(`/zoom-join?meetingNumber=${meetingNumber}&role=0`, '_blank');
      toast.success('Joining class...');
    } catch (error) {
      console.error('Error joining class:', error);
      toast.error('Failed to join class');
    }
  };

  // Simple logic: If meeting number exists, show Join Class, otherwise show Waiting for Teacher
  if (meetingNumber) {
    return (
      <div className="flex flex-col items-center">
        <Button
          size="sm"
          variant="outline"
          className="bg-white text-green-600 hover:bg-green-50 border-green-600"
          onClick={handleJoinClass}
        >
          <Video className="h-4 w-4 mr-1" />
          Join Class
        </Button>
      </div>
    );
  } else {
    return (
      <div className="flex flex-col items-center">
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
      </div>
    );
  }
}
