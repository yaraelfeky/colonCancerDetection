/** Single JWT storage key used by login (`authService`) */

export const TOKEN_KEY = "token";

export function readAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/** Reusable auth headers for all API calls. */
export function getAuthHeaders(): HeadersInit {
  const token = readAuthToken();
  if (!token) {
    throw new Error(
      'Authentication required: JWT not found in storage (key: "token"). Please sign in again.'
    );
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export function redactAuthHeaders(headers: HeadersInit): Record<string, string> {
  const entries =
    headers instanceof Headers
      ? Array.from(headers.entries())
      : Object.entries(headers as Record<string, string>);
  const out: Record<string, string> = {};
  for (const [key, value] of entries) {
    out[key] =
      key.toLowerCase() === "authorization" ? "Bearer <redacted>" : String(value);
  }
  return out;
}
