import { axiosInstance } from "../api/axiosInstance";
import type { ApiResponse } from "../types/api";
import { parseServiceError, unwrapApiDataOrEmpty } from "../utils/apiResponse";

export interface NotificationDto {
  id: number;
  title?: string;
  message?: string;
  body?: string;
  isRead?: boolean;
  read?: boolean;
  createdAt?: string;
  type?: string;
}

export interface UnreadCountDto {
  count: number;
}

const BASE = "/api/notifications";

export const notificationService = {
  async list(): Promise<NotificationDto[]> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<NotificationDto[]>>(BASE);
      return unwrapApiDataOrEmpty(data);
    } catch (error) {
      console.warn("notificationService.list failed (likely REST notifications API not implemented on backend):", error);
      return [];
    }
  },

  async getUnreadCount(): Promise<number> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<number | UnreadCountDto>>(
        `${BASE}/unread-count`
      );
      if (!data.success) return 0;
      const payload = data.data;
      if (typeof payload === "number") return payload;
      if (payload && typeof payload === "object" && "count" in payload) {
        return Number((payload as UnreadCountDto).count) || 0;
      }
      return 0;
    } catch (error) {
      console.warn("notificationService.getUnreadCount failed:", error);
      return 0;
    }
  },

  async markAsRead(id: number): Promise<void> {
    try {
      const { data } = await axiosInstance.patch<ApiResponse>(`${BASE}/${id}/read`);
      if (!data.success) {
        throw new Error(data.message || "Failed to mark notification as read");
      }
    } catch (error) {
      console.warn(`Failed to mark notification ${id} as read (REST endpoint likely not implemented):`, error);
    }
  },

  async markAllAsRead(notifications: NotificationDto[]): Promise<void> {
    const unread = notifications.filter((n) => !(n.isRead ?? n.read));
    await Promise.all(unread.map((n) => this.markAsRead(n.id)));
  },
};
