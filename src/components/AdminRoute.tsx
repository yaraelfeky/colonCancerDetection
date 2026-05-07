import React from "react";
import { Navigate } from "react-router-dom";
import { authService } from "../services/authService";

interface AdminRouteProps {
  children: React.ReactNode;
}

function isAdminFromJwt(token: string | null): boolean {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1] ?? "{}")) as Record<string, unknown>;
    const roleClaim =
      (payload[
        "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
      ] as string | string[] | undefined) ??
      (payload.role as string | undefined) ??
      (payload.Role as string | undefined);

    const roles = Array.isArray(roleClaim)
      ? roleClaim.map((r) => String(r).toLowerCase())
      : typeof roleClaim === "string"
      ? [roleClaim.toLowerCase()]
      : [];

    return roles.some((r) => r.includes("admin"));
  } catch {
    return false;
  }
}

/** Allows access only when the user is an admin (JWT role claim contains 'admin'). */
export function AdminRoute({ children }: AdminRouteProps) {
  const token = authService.getToken();
  if (!isAdminFromJwt(token)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

