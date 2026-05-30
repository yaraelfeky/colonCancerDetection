import { readAuthToken } from "./authToken";
import {
  mergeAuthIdentityWithStored,
  readStoredAuthIdentity,
} from "./authIdentityStore";
import { parseRoleFromJwt } from "./userRole";

/** Authenticated user identity — `userName` is the source of truth for username UI. */
export interface AuthUser {
  email: string;
  userName: string;
  role?: string;
}

export function parseUserNameFromJwtPayload(
  payload: Record<string, unknown>
): string {
  return (
    (payload.userName as string | undefined)?.trim() ||
    (payload[
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
    ] as string | undefined)?.trim() ||
    (payload.unique_name as string | undefined)?.trim() ||
    (payload.username as string | undefined)?.trim() ||
    ""
  );
}

export function parseEmailFromJwtPayload(
  payload: Record<string, unknown>
): string {
  return (
    (payload[
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
    ] as string | undefined) ??
    (payload.email as string | undefined) ??
    (payload.sub as string | undefined) ??
    ""
  );
}

export function parseUserFromToken(token: string | null): AuthUser | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1] ?? "{}")) as Record<
      string,
      unknown
    >;
    const email = parseEmailFromJwtPayload(payload);
    const userName = parseUserNameFromJwtPayload(payload);
    const role = parseRoleFromJwt(token) ?? "";
    if (!email) return null;
    return { email, userName, role };
  } catch {
    return null;
  }
}

/** JWT merged with `colonai_auth_identity_v1` (stored values win). */
export function readAuthUser(): AuthUser | null {
  const fromToken = parseUserFromToken(readAuthToken());
  if (!fromToken) return null;
  return mergeAuthIdentityWithStored(fromToken);
}

/** Username for UI — never use fullName here. */
export function resolveDisplayUserName(
  user: AuthUser | null | undefined,
  profileUserName?: string | null
): string {
  const stored = readStoredAuthIdentity();
  return (
    user?.userName?.trim() ||
    stored.userName?.trim() ||
    profileUserName?.trim() ||
    user?.email?.split("@")[0] ||
    ""
  );
}

export function resolveDisplayEmail(
  user: AuthUser | null | undefined,
  profileEmail?: string | null
): string {
  const stored = readStoredAuthIdentity();
  return user?.email?.trim() || stored.email?.trim() || profileEmail?.trim() || "";
}

export function initialsFromUserName(userName: string): string {
  const trimmed = userName.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
