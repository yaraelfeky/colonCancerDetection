import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { readAuthToken } from "../utils/authToken";

export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL?.trim() || "https://clinical.runasp.net";

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// --- Auto-refresh 401 interceptor ---
let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}[] = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only attempt refresh on 401, not on auth endpoints themselves
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes("/api/Auth/login") ||
      originalRequest.url?.includes("/api/Auth/register") ||
      originalRequest.url?.includes("/api/Auth/google-login") ||
      originalRequest.url?.includes("/api/Auth/google-register-doctor") ||
      originalRequest.url?.includes("/api/Auth/refresh-token") ||
      originalRequest.url?.includes("/api/auth/password/forgot") ||
      originalRequest.url?.includes("/api/auth/password/reset") ||
      originalRequest.url?.includes("/api/Auth/delete") ||
      originalRequest.url?.includes("/api/Auth/updateMail") ||
      originalRequest.url?.includes("/api/Auth/updateUsername")
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axiosInstance(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Lazy import to avoid circular dependency
      const { authService } = await import("../services/authService");
      const newToken = await authService.refreshAccessToken();
      processQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      // Clear tokens and redirect to login
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      sessionStorage.removeItem("refreshToken");
      localStorage.removeItem("rememberMe");
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);