import type { GoogleLoginResultDto } from "../types/auth";

export type GoogleLoginFlowAction =
  | { type: "AUTHENTICATED" }
  | { type: "REQUIRES_REGISTRATION"; idToken: string; message?: string }
  | { type: "PENDING_APPROVAL"; message: string };

export const GOOGLE_REGISTRATION_PENDING_MESSAGE =
  "Your account has been submitted for admin approval.";

const GOOGLE_ID_TOKEN_STORAGE_KEY = "colonai_google_registration_id_token";

export function storeGoogleRegistrationIdToken(idToken: string): void {
  sessionStorage.setItem(GOOGLE_ID_TOKEN_STORAGE_KEY, idToken);
}

export function readGoogleRegistrationIdToken(): string | null {
  return sessionStorage.getItem(GOOGLE_ID_TOKEN_STORAGE_KEY);
}

export function clearGoogleRegistrationIdToken(): void {
  sessionStorage.removeItem(GOOGLE_ID_TOKEN_STORAGE_KEY);
}

/** Normalize google-login JSON (camelCase or PascalCase). */
export function parseGoogleLoginResultDto(raw: unknown): GoogleLoginResultDto {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  return {
    success: Boolean(r.success ?? r.Success),
    message: String(r.message ?? r.Message ?? ""),
    requiresRegistration:
      r.requiresRegistration === true || r.RequiresRegistration === true,
    isPendingApproval:
      r.isPendingApproval === true || r.IsPendingApproval === true,
    accessToken: (r.accessToken ?? r.AccessToken ?? null) as string | null,
    refreshToken: (r.refreshToken ?? r.RefreshToken ?? null) as string | null,
    token: (r.token ?? r.Token ?? null) as string | null,
    accessTokenExpiration: (r.accessTokenExpiration ??
      r.AccessTokenExpiration ??
      null) as string | null,
    refreshTokenExpiration: (r.refreshTokenExpiration ??
      r.RefreshTokenExpiration ??
      null) as string | null,
  };
}

export function requiresGoogleDoctorRegistration(
  result: GoogleLoginResultDto
): boolean {
  return result.requiresRegistration === true;
}

/**
 * Maps backend google-login response to UI actions.
 * requiresRegistration + success:false is NOT an error — navigate to /verify.
 */
export function resolveGoogleLoginFlow(
  result: GoogleLoginResultDto,
  idToken: string
): GoogleLoginFlowAction {
  if (result.isPendingApproval) {
    return {
      type: "PENDING_APPROVAL",
      message:
        result.message || "Your account is pending admin approval.",
    };
  }

  if (requiresGoogleDoctorRegistration(result)) {
    storeGoogleRegistrationIdToken(idToken);
    return {
      type: "REQUIRES_REGISTRATION",
      idToken,
      message: result.message,
    };
  }

  if (!result.success) {
    throw new Error(
      result.message || "Google authentication failed. Please try again."
    );
  }

  clearGoogleRegistrationIdToken();
  return { type: "AUTHENTICATED" };
}
