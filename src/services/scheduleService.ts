import { axiosInstance } from "../api/axiosInstance";
import type { ApiResponse } from "../types/api";
import type {
  CompleteSlotRequest,
  CreateSlotRequest,
  GenerateSlotsRequest,
  ScheduleSlot,
} from "../types/schedule";
import { normalizeScheduleSlots } from "../utils/scheduleUtils";
import { parseServiceError, unwrapApiDataOrEmpty } from "../utils/apiResponse";

const BASE = "/api/schedule";

export const scheduleService = {
  async getMySchedule(): Promise<ScheduleSlot[]> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<unknown[]>>(`${BASE}/my`);
      return normalizeScheduleSlots(unwrapApiDataOrEmpty(data));
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },

  async getDaily(date: string): Promise<ScheduleSlot[]> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<unknown[]>>(
        `${BASE}/my/daily/${date}`
      );
      return normalizeScheduleSlots(unwrapApiDataOrEmpty(data));
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },

  async getWeekly(weekStart: string): Promise<ScheduleSlot[]> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<unknown[]>>(
        `${BASE}/my/weekly/${weekStart}`
      );
      return normalizeScheduleSlots(unwrapApiDataOrEmpty(data));
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },

  async generateSlots(dto: GenerateSlotsRequest): Promise<void> {
    try {
      const { data } = await axiosInstance.post<ApiResponse>(`${BASE}/slots/generate`, dto);
      if (!data.success) throw new Error(data.message || "Failed to generate slots");
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },

  async createSlot(dto: CreateSlotRequest): Promise<void> {
    try {
      const { data } = await axiosInstance.post<ApiResponse>(`${BASE}/slots`, dto);
      if (!data.success) throw new Error(data.message || "Failed to create slot");
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },

  async deleteSlot(slotId: number): Promise<void> {
    try {
      const { data } = await axiosInstance.delete<ApiResponse>(`${BASE}/slots/${slotId}`);
      if (!data.success) throw new Error(data.message || "Failed to delete slot");
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },

  async completeSlot(dto: CompleteSlotRequest): Promise<void> {
    try {
      const { data } = await axiosInstance.patch<ApiResponse>(`${BASE}/slots/complete`, dto);
      if (!data.success) throw new Error(data.message || "Failed to complete slot");
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },
};
