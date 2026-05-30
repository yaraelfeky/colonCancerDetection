/** Overrides JWT claims when profile email/username change before token claims refresh. */
const AUTH_IDENTITY_KEY = "colonai_auth_identity_v1";

export interface StoredAuthIdentity {
  userName?: string;
  email?: string;
}

export function readStoredAuthIdentity(): StoredAuthIdentity {
  try {
    const raw = localStorage.getItem(AUTH_IDENTITY_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StoredAuthIdentity;
  } catch {
    return {};
  }
}

export function writeStoredAuthIdentity(patch: StoredAuthIdentity): void {
  const prev = readStoredAuthIdentity();
  const next: StoredAuthIdentity = { ...prev, ...patch };
  if (patch.userName !== undefined) {
    next.userName = patch.userName.trim() || undefined;
  }
  if (patch.email !== undefined) {
    next.email = patch.email.trim() || undefined;
  }
  localStorage.setItem(AUTH_IDENTITY_KEY, JSON.stringify(next));
}

export function clearStoredAuthIdentity(): void {
  localStorage.removeItem(AUTH_IDENTITY_KEY);
}

/** Stored identity wins over JWT for display and refresh. */
export function mergeAuthIdentityWithStored(
  fromJwt: AuthUserFromJwt
): AuthUserFromJwt {
  const stored = readStoredAuthIdentity();
  return {
    ...fromJwt,
    userName: stored.userName?.trim() || fromJwt.userName,
    email: stored.email?.trim() || fromJwt.email,
  };
}

export interface AuthUserFromJwt {
  email: string;
  userName: string;
  role?: string;
}
