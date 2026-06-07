import { axiosInstance } from "../api/axiosInstance";
import { USE_MOCK } from "../config/mockFlags";
import { medicalRecordMockStore } from "../mocks/medicalRecordMockStore";
import type { ApiResponse } from "../types/api";
import { parseServiceError, unwrapApiDataOrEmpty } from "../utils/apiResponse";

const BASE = "/api/medications";

export const medicationService = {
  async getByPatient(patientUserId: number): Promise<unknown[]> {
    if (USE_MOCK) {
      const record = medicalRecordMockStore.getByPatient(patientUserId);
      return Array.isArray(record.medications) ? record.medications : [];
    }
    try {
      const { data } = await axiosInstance.get<ApiResponse<unknown[]>>(
        `${BASE}/patient/${patientUserId}`
      );
      return unwrapApiDataOrEmpty(data);
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },

  async list(): Promise<unknown[]> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<unknown[]>>(BASE);
      return unwrapApiDataOrEmpty(data);
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },

  async deleteMedication(medicationId: number): Promise<void> {
    try {
      await axiosInstance.delete(`${BASE}/${medicationId}`);
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },
};
