import type { DoctorProfileDto } from "../types/doctor";
import { readAuthToken } from "./authToken";
import { readLocalProfile } from "./localDoctorProfile";

function readUserIdFromJwt(token: string | null): string {
  if (!token) return "";
  try {
    const payload = JSON.parse(atob(token.split(".")[1] ?? "{}")) as Record<
      string,
      unknown
    >;
    const id =
      payload.sub ??
      payload.userId ??
      payload.UserId ??
      payload.nameid ??
      payload[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ];
    return id != null ? String(id).trim() : "";
  } catch {
    return "";
  }
}

/** Resolve logged-in doctor id from profile cache or JWT. */
export function resolveDoctorId(profile?: DoctorProfileDto | null): string {
  const fromProfile =
    profile?.userId?.trim() || readLocalProfile()?.userId?.trim() || "";
  if (fromProfile) return fromProfile;
  return readUserIdFromJwt(readAuthToken());
}
