const ROLE_KEY = "colonai_userRole";

export type UserRole = "doctor" | "patient";

export function setStoredUserRole(role: UserRole): void {
  localStorage.setItem(ROLE_KEY, role);
}

export function getStoredUserRole(): UserRole | null {
  const v = localStorage.getItem(ROLE_KEY);
  if (v === "doctor" || v === "patient") return v;
  return null;
}

export function clearStoredUserRole(): void {
  localStorage.removeItem(ROLE_KEY);
}

export function parseRoleFromJwt(token: string | null): UserRole | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1] ?? "{}")) as Record<string, unknown>;
    const roleClaim =
      (payload.role as string | undefined) ??
      (payload.Role as string | undefined) ??
      (payload[
        "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
      ] as string | string[] | undefined);

    if (Array.isArray(roleClaim)) {
      const joined = roleClaim.join(" ").toLowerCase();
      if (joined.includes("doctor")) return "doctor";
      if (joined.includes("patient")) return "patient";
    } else if (typeof roleClaim === "string") {
      const r = roleClaim.toLowerCase();
      if (r.includes("doctor")) return "doctor";
      if (r.includes("patient")) return "patient";
    }

    if (payload.isDoctor === true || payload.IsDoctor === true) return "doctor";
  } catch {
    /* ignore */
  }
  return null;
}

export function getEffectiveUserRole(token: string | null): UserRole | null {
  return parseRoleFromJwt(token) ?? getStoredUserRole();
}
