import React from "react";
import { Navigate } from "react-router-dom";
import { authService } from "../services/authService";
import { getEffectiveUserRole } from "../utils/userRole";

interface DoctorRouteProps {
  children: React.ReactNode;
}

/** Allows access only when the user is a doctor (JWT claim or stored role after register). */
export function DoctorRoute({ children }: DoctorRouteProps) {
  const role = getEffectiveUserRole(authService.getToken());
  if (role !== "doctor") {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
