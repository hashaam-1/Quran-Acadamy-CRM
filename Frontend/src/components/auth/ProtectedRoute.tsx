import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/lib/auth-store";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, currentUser } = useAuthStore();
  
  // Show loading spinner while auth state is being rehydrated
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // 🔐 Strict role enforcement
  if (allowedRoles && currentUser?.role && !allowedRoles.includes(currentUser.role)) {
    console.log('❌ Access denied - role not allowed:', currentUser.role, 'allowed:', allowedRoles);
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
}
