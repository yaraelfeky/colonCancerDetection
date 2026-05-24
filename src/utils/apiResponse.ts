import { AxiosError } from "axios";
import type { ApiResponse } from "../types/api";

export function unwrapApiData<T>(response: ApiResponse<T>, fallbackMessage = "Request failed"): T {
  if (!response.success) {
    throw new Error(response.message || fallbackMessage);
  }
  if (response.data === undefined || response.data === null) {
    throw new Error(response.message || "No data returned");
  }
  return response.data;
}

export function unwrapApiDataOrEmpty<T>(response: ApiResponse<T[]>): T[] {
  if (!response.success) {
    throw new Error(response.message || "Request failed");
  }
  const data = response.data;
  return Array.isArray(data) ? data : [];
}

export function unwrapApiDataOptional<T>(response: ApiResponse<T>): T | null {
  if (!response.success) {
    throw new Error(response.message || "Request failed");
  }
  return response.data ?? null;
}

export async function parseServiceError(error: unknown): Promise<string> {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiResponse | undefined;
    if (data?.message) return data.message;
    if (typeof data === "object" && data && "title" in data) {
      return String((data as { title?: string }).title);
    }
    return error.message || "Request failed";
  }
  if (error instanceof Error) return error.message;
  return "Request failed";
}
