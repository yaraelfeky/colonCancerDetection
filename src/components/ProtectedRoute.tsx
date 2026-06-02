import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="auth-page-wrap w-full flex-col gap-5">
        <div className="relative w-24 h-24 flex items-center justify-center">
            {/* Outer spinning ring */}
            <div className="absolute inset-0 rounded-full border-[5px] border-white/20 border-t-white animate-spin shadow-[0_0_20px_rgba(255,255,255,0.4)]"></div>
            {/* Inner medical cross */}
            <div className="w-10 h-10 animate-pulse text-white flex items-center justify-center drop-shadow-md">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-6 15h-2v-5H6v-2h5V6h2v5h5v2h-5v5z" />
              </svg>
            </div>
          </div>
        <p className="text-white font-bold tracking-widest text-lg animate-pulse uppercase mt-5">
          Loading...
        </p>
      </div>
    );
  }

  const role = user?.role?.toLowerCase();
  if (!isAuthenticated || (role !== "doctor" && role !== "admin")) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
