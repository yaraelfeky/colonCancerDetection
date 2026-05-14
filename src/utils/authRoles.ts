import { authService } from "../services/authService";

export function isAdminFromJwt(token: string | null): boolean {
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1] ?? "{}"));

    const roleClaim =
      payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ??
      payload.role ??
      payload.Role;

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