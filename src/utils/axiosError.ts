import { AxiosError } from "axios";

/**
 * Extracts a user-friendly error message from an Axios error.
 * Handles common backend response shapes: message, errors array, or status text.
 */
export function getAxiosErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
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
