import { AxiosError } from "axios";

/**
 * Extracts a user-friendly error message from an Axios error.
 * Handles common backend response shapes: message, errors array, or status text.
 */
export function getAxiosErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    // Check for network error (no response)
    if (!err.response) {
      if (err.code === "ERR_NETWORK" || err.message.includes("Network Error")) {
        return "Unable to connect to server. Please check your internet connection or try again later.";
      }
      if (err.code === "ECONNABORTED") {
        return "Request timed out. Please try again.";
      }
      return "Network error. Please check your connection and try again.";
    }

    const data = err.response?.data;
    if (data && typeof data === "object") {
      if (typeof data.message === "string" && data.message) {
        return data.message;
      }
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        const first = data.errors[0];
        return typeof first === "string" ? first : String(first);
      }
      if (typeof data.error === "string" && data.error) {
        return data.error;
      }
    }
    if (err.response?.status) {
      const status = err.response.status;
      if (status === 400) return "Invalid request. Please check your input.";
      if (status === 401) return "Invalid username or password.";
      if (status === 403) return "Access denied.";
      if (status >= 500) return "Server error. Please try again later.";
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "An unexpected error occurred.";
}
