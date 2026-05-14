import React from "react";
import { Navigate } from "react-router-dom";
import { authService } from "../services/authService";
import { getEffectiveUserRole } from "../utils/userRole";

interface DoctorRouteProps {
  children: React.ReactNode;
}

/** Allows access only when the user is a doctor or admin (JWT claim or stored role after register).
 *  Admins are treated as doctors and can access all doctor pages (patients, diagnosis, reports). */
export function DoctorRoute({ children }: DoctorRouteProps) {
  const role = getEffectiveUserRole(authService.getToken());
  if (role !== "Doctor" && role !== "Admin") {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
