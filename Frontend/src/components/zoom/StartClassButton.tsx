import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";

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
  className = "",
  meetingClassName = "",
  studentId = "",
  studentName = "",
  course = "",
  time = "",
  disabled = false,
}: StartClassButtonProps) {
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleStartClass = async () => {
    if (!currentUser) {
      toast.error("Please login first");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        scheduleId,
        className: meetingClassName || course,
        course,
        teacherId: currentUser.id,
        teacherName: currentUser.name,
        studentId,
        studentName,
        time,
      };

      const response = await fetch(
        "https://quran-acadamy-crm-production.up.railway.app/api/meetings/start-class",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Class started successfully");
        navigate(`/zoom-join?meetingNumber=${data.meeting.meetingNumber}&role=1`);
      } else {
        toast.error(data.message || "Failed to start class");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      onClick={handleStartClass}
      disabled={disabled || loading}
      className={`bg-green-600 hover:bg-green-700 text-white h-8 px-3 text-xs rounded-md shadow-md ${className}`}
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <>
          <Play className="h-3 w-3 mr-1" />
          Join Class
        </>
      )}
    </Button>
  );
}
