import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Video, User, Clock, BookOpen } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useSchedules } from '@/hooks/useSchedules';

interface StudentClassManagerProps {
  className?: string;
}

interface ScheduledClass {
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
  createdAt?: string;
}

export default function StudentClassManager({ 
  className: buttonClassName = ""
}: StudentClassManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [myClasses, setMyClasses] = useState<ScheduledClass[]>([]);
  const { currentUser } = useAuthStore();
  const { data: schedules = [] } = useSchedules();
  
  // Filter schedules for current student
  useEffect(() => {
    if (currentUser && schedules.length > 0) {
      const studentClasses = schedules
        .filter(schedule => schedule.studentId === currentUser?.id)
        .map(schedule => ({
          _id: schedule._id,
          className: schedule.className || `${schedule.course} Class`,
          course: schedule.course,
          teacherId: schedule.teacherId,
          teacherName: schedule.teacherName || 'Assigned Teacher',
          studentId: schedule.studentId,
          studentName: schedule.studentName || currentUser.name,
          time: schedule.time,
          day: schedule.day,
          duration: schedule.duration || '1 hour',
          status: schedule.status || 'scheduled',
          createdAt: schedule.createdAt
        }));
      
      setMyClasses(studentClasses);
    }
  }, [currentUser, schedules]);


  const formatTime = (timeString: string) => {
    return timeString;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Student's Scheduled Classes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">My Scheduled Classes</h2>
          <p className="text-sm text-gray-600 mt-1">Your upcoming class schedule</p>
        </div>

        <div className="p-6">
          {myClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myClasses.map((classItem) => (
                <div
                  key={classItem._id}
                  className="overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300"
                >
                  {/* Card Content */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
                          <Video className="w-6 h-6 text-white" />
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {classItem.className}
                          </h3>
                          <p className="text-sm text-gray-500">{classItem.course}</p>
                        </div>
                      </div>

                      <Badge className={getStatusColor(classItem.status) + " text-white capitalize"}>
                        {classItem.status}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {classItem.teacherName && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="w-4 h-4 text-gray-400" />
                          Teacher: {classItem.teacherName}
                        </div>
                      )}

                      {classItem.day && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <BookOpen className="w-4 h-4 text-gray-400" />
                          {classItem.day}
                        </div>
                      )}

                      {classItem.time && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {formatTime(classItem.time)}
                          {classItem.duration && ` (${classItem.duration})`}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Scheduled Class
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled classes</h3>
              <p className="text-gray-500">You don't have any classes scheduled yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
