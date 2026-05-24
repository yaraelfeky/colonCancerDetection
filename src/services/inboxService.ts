import { axiosInstance } from "../api/axiosInstance";
import type { ApiResponse } from "../types/api";
import { parseServiceError, unwrapApiDataOrEmpty } from "../utils/apiResponse";

export interface InboxItemDto {
  id: number;
  subject?: string;
  message?: string;
  body?: string;
  senderName?: string;
  recipientName?: string;
  fromUserName?: string;
  toUserName?: string;
  createdAt?: string;
  sentAt?: string;
  isRead?: boolean;
  type?: string;
  direction?: string;
  requestType?: string | number;
  status?: string;
}

const BASE = "/api/inbox";

export const inboxService = {
  async list(): Promise<InboxItemDto[]> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<InboxItemDto[]>>(BASE);
      return unwrapApiDataOrEmpty(data);
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },
};
