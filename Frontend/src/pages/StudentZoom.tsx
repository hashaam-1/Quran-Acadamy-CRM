import React from 'react';
import { MainLayout } from "@/components/layout/MainLayout";
import StudentZoomJoiner from "@/components/zoom/StudentZoomJoiner";
import { useAuthStore } from "@/lib/auth-store";

export default function StudentZoom() {
  const { currentUser } = useAuthStore();

  // Only allow students to access this page
  if (currentUser?.role !== 'student') {
    return (
      <MainLayout title="Access Denied">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600">This page is only available for students.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Student Zoom Classroom">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Student Zoom Classroom</h1>
          <p className="text-gray-600 mt-2">Join your scheduled classes and access live meetings</p>
        </div>
        
        <StudentZoomJoiner />
      </div>
    </MainLayout>
  );
}
