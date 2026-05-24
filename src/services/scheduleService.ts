import { axiosInstance } from "../api/axiosInstance";
import type { ApiResponse } from "../types/api";
import { parseServiceError, unwrapApiDataOrEmpty } from "../utils/apiResponse";

const BASE = "/api/schedule";

export interface GenerateSlotsDto {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  daysOfWeek?: number[];
}

export interface CreateSlotDto {
  date: string;
  startTime: string;
  endTime: string;
}

export interface CompleteSlotDto {
  slotId: number;
  notes?: string;
}

export const scheduleService = {
  async getMySchedule(): Promise<unknown[]> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<unknown[]>>(`${BASE}/my`);
      return unwrapApiDataOrEmpty(data);
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },

  async getDaily(date: string): Promise<unknown[]> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<unknown[]>>(
        `${BASE}/my/daily/${date}`
      );
      return unwrapApiDataOrEmpty(data);
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },

  async getWeekly(weekStart: string): Promise<unknown[]> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<unknown[]>>(
        `${BASE}/my/weekly/${weekStart}`
      );
      return unwrapApiDataOrEmpty(data);
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },

  /** POST /api/schedule/slots/generate — bulk-generate time slots */
  async generateSlots(dto: GenerateSlotsDto): Promise<void> {
    try {
      const { data } = await axiosInstance.post<ApiResponse>(`${BASE}/slots/generate`, dto);
      if (!data.success) throw new Error(data.message || "Failed to generate slots");
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },

  /** POST /api/schedule/slots — create a single slot */
  async createSlot(dto: CreateSlotDto): Promise<void> {
    try {
      const { data } = await axiosInstance.post<ApiResponse>(`${BASE}/slots`, dto);
      if (!data.success) throw new Error(data.message || "Failed to create slot");
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },

  /** DELETE /api/schedule/slots/{slotId} */
  async deleteSlot(slotId: number): Promise<void> {
    try {
      const { data } = await axiosInstance.delete<ApiResponse>(`${BASE}/slots/${slotId}`);
      if (!data.success) throw new Error(data.message || "Failed to delete slot");
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },

  /** PATCH /api/schedule/slots/complete */
  async completeSlot(dto: CompleteSlotDto): Promise<void> {
    try {
      const { data } = await axiosInstance.patch<ApiResponse>(`${BASE}/slots/complete`, dto);
      if (!data.success) throw new Error(data.message || "Failed to complete slot");
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },
};
