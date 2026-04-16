import React from 'react';
import { useAuthStore } from '@/lib/auth-store';
import TeacherZoomManager from './TeacherZoomManager';
import StudentZoomJoiner from './StudentZoomJoiner';

interface StartClassButtonProps {
  scheduleId?: string;
  className?: string;
  meetingClassName?: string;
  studentId?: string;
  studentName?: string;
  course?: string;
  time?: string;
  disabled?: boolean;
}

export default function StartClassButton({ 
  scheduleId, 
  className: buttonClassName = "",
  meetingClassName = "",
  studentId,
  studentName = "",
  course = "",
  time = "",
  disabled = false
}: StartClassButtonProps) {
  const { currentUser } = useAuthStore();

  // Render different components based on user role
  if (currentUser?.role === 'teacher' || currentUser?.role === 'admin') {
    return (
      <TeacherZoomManager
        scheduleId={scheduleId}
        className={buttonClassName}
        meetingClassName={meetingClassName}
        course={course}
        time={time}
        disabled={disabled}
      />
    );
  }

  if (currentUser?.role === 'student') {
    return (
      <StudentZoomJoiner
        scheduleId={scheduleId}
        className={buttonClassName}
        course={course}
        time={time}
        disabled={disabled}
      />
    );
  }

  // Fallback for users without proper roles
  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <p className="text-gray-600 text-center">
        Please login as a teacher, student, or admin to access Zoom meetings.
      </p>
    </div>
  );
}
