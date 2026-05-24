import { axiosInstance } from "../api/axiosInstance";
import type { ApiResponse } from "../types/api";
import { parseServiceError, unwrapApiData, unwrapApiDataOptional } from "../utils/apiResponse";

export interface MedicalRecordState {
  allergies?: unknown[];
  visits?: unknown[];
  surgeries?: unknown[];
  tests?: unknown[];
  medications?: unknown[];
  familyConditions?: unknown[];
  [key: string]: unknown;
}

export interface SaveAiResultDto {
  imageId: number;
  label: string;
  probability: number;
  isCancerous: boolean;
  originalFileName?: string;
  doctorNotes?: string;
  analyzedAt?: string;
}

export type MedicalRecordSection =
  | "allergies"
  | "visits"
  | "surgeries"
  | "tests"
  | "medications"
  | "family-conditions";

const BASE = "/api/medical-records";

export const medicalRecordService = {
  async getByPatient(patientId: number): Promise<MedicalRecordState> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<MedicalRecordState>>(
        `${BASE}/${patientId}`
      );
      return unwrapApiDataOptional(data) ?? {
        allergies: [],
        visits: [],
        surgeries: [],
        tests: [],
        medications: [],
        familyConditions: [],
      };
    } catch (error) {
      console.warn("medicalRecordService.getByPatient failed, returning fallback empty structure:", error);
      return {
        allergies: [],
        visits: [],
        surgeries: [],
        tests: [],
        medications: [],
        familyConditions: [],
      };
    }
  },

  async getPending(patientId: number): Promise<MedicalRecordState> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<MedicalRecordState>>(
        `${BASE}/${patientId}/pending`
      );
      return unwrapApiDataOptional(data) ?? {
        allergies: [],
        visits: [],
        surgeries: [],
        tests: [],
        medications: [],
        familyConditions: [],
      };
    } catch (error) {
      console.warn("medicalRecordService.getPending failed, returning fallback empty structure:", error);
      return {
        allergies: [],
        visits: [],
        surgeries: [],
        tests: [],
        medications: [],
        familyConditions: [],
      };
    }
  },

  /**
   * No-op: AI analysis results are automatically persisted by the backend
   * when POST /api/AI/analyze/{imageId} is called.
   * Kept here to avoid breaking call-sites in DiagnosisPage.
   */
  async saveAiResult(_patientId: number, _payload: SaveAiResultDto): Promise<void> {
    // The backend stores the result during the analyze step — nothing extra to do.
    return Promise.resolve();
  },

  async reviewEntry(
    section: MedicalRecordSection,
    entryId: number,
    body: { approve: boolean; note: string }
  ): Promise<void> {
    try {
      const { data } = await axiosInstance.patch<ApiResponse>(
        `${BASE}/${section}/${entryId}/review`,
        body
      );
      if (!data.success) {
        throw new Error(data.message || "Review failed");
      }
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },
};
