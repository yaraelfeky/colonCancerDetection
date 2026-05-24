import { axiosInstance } from "../api/axiosInstance";
import type { ApiResponse } from "../types/api";
import { parseServiceError, unwrapApiDataOrEmpty } from "../utils/apiResponse";

const BASE = "/api/medications";

export const medicationService = {
  async getByPatient(patientUserId: number): Promise<unknown[]> {
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
};
