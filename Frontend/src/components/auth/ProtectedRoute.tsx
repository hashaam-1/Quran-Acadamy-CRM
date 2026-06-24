import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/lib/auth-store";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, currentUser, token } = useAuthStore();
  const location = useLocation();
  
  console.log('🔒 ProtectedRoute check:', { 
    isAuthenticated, 
    isLoading, 
    hasToken: !!token,
    path: location.pathname,
    currentUser: currentUser?.email
  });
  
  // Show loading spinner while auth state is being rehydrated
  if (isLoading) {
    console.log('🔒 ProtectedRoute: Showing loading spinner');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // 🔒 CRITICAL: Check both isAuthenticated AND token presence
  if (!isAuthenticated || !token) {
    console.log('🔒 ProtectedRoute: Not authenticated, redirecting to auth');
    sessionStorage.setItem('redirectAfterLogin', location.pathname + location.search);
    return <Navigate to="/auth" replace />;
  }

  // 🔐 Strict role enforcement
  if (allowedRoles && currentUser?.role && !allowedRoles.includes(currentUser.role)) {
    console.log('❌ Access denied - role not allowed:', currentUser.role, 'allowed:', allowedRoles);
    return <Navigate to="/unauthorized" replace />;
  }
  
  console.log('🔒 ProtectedRoute: Access granted');
  return <>{children}</>;
}
