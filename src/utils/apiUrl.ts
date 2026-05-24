import { API_BASE_URL } from "../api/axiosInstance";

/** Build a full backend URL from an API path (e.g. `/api/Patient`). */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
