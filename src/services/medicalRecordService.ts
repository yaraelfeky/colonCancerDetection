import { AxiosError } from "axios";
import { axiosInstance } from "../api/axiosInstance";
import { USE_MOCK } from "../config/mockFlags";
import { medicalRecordMockStore } from "../mocks/medicalRecordMockStore";
import type { ApiResponse } from "../types/api";
import { parseServiceError, unwrapApiDataOptional } from "../utils/apiResponse";

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

const EMPTY_RECORD: MedicalRecordState = {
  allergies: [],
  visits: [],
  surgeries: [],
  tests: [],
  medications: [],
  familyConditions: [],
};

/**
 * Normalizes backend field name variants to the canonical frontend field names.
 * Handles both camelCase and PascalCase (C# backend convention), plus known aliases.
 */
function normalizeMedicalRecordFields(raw: Record<string, unknown>): MedicalRecordState {
  // Log all keys so we can see what the backend actually sends
  console.log("[normalizeMedicalRecordFields] raw keys:", Object.keys(raw));

  const pick = (...keys: string[]): unknown[] => {
    // First pass: prefer non-empty arrays
    for (const k of keys) {
      const v = raw[k];
      if (Array.isArray(v) && v.length > 0) return v as unknown[];
    }
    // Second pass: return any array (even empty) so we don't lose the field
    for (const k of keys) {
      const v = raw[k];
      if (Array.isArray(v)) return v as unknown[];
    }
    return [];
  };

  return {
    ...raw,
    // camelCase  |  PascalCase (C#)  |  known aliases
    allergies: pick(
      "allergies", "Allergies"
    ),
    visits: pick(
      "visits", "Visits",
      "medicalVisits", "MedicalVisits"
    ),
    surgeries: pick(
      "surgeries", "Surgeries"
    ),
    tests: pick(
      "tests", "Tests",
      "labTests", "LabTests",
      "labResults", "LabResults",
      "medicalTests", "MedicalTests"
    ),
    medications: pick(
      "medications", "Medications"
    ),
    familyConditions: pick(
      "familyConditions", "FamilyConditions",
      "familyHistory", "FamilyHistory",
      "familyMedicalHistory", "FamilyMedicalHistory"
    ),
  };
}

function logApiError(error: unknown): void {
  if (error instanceof AxiosError) {
    console.error("API Error:", error.response?.data || error.message);
    return;
  }
  if (error instanceof Error) {
    console.error("API Error:", error.message);
    return;
  }
  console.error("API Error:", error);
}

async function apiRequest<T>(
  payload: unknown | undefined,
  request: () => Promise<{ data: ApiResponse<T> }>
): Promise<ApiResponse<T>> {
  if (payload !== undefined) {
    console.log("Request Payload:", payload);
  }
  try {
    const response = await request();
    console.log("API Response:", response.data);
    return response.data;
  } catch (error) {
    logApiError(error);
    throw new Error(await parseServiceError(error));
  }
}

export const medicalRecordService = {
  async getByPatient(patientId: number): Promise<MedicalRecordState> {
    if (USE_MOCK) {
      return medicalRecordMockStore.getByPatient(patientId);
    }
    try {
      const data = await apiRequest<MedicalRecordState>(undefined, () =>
        axiosInstance.get<ApiResponse<MedicalRecordState>>(
          `${BASE}/patient/${patientId}`
        )
      );
      const unwrapped = unwrapApiDataOptional(data);
      console.log("[getByPatient] raw unwrapped:", unwrapped);
      if (!unwrapped) return { ...EMPTY_RECORD };
      return normalizeMedicalRecordFields(unwrapped as Record<string, unknown>);
    } catch (error) {
      console.warn("medicalRecordService.getByPatient failed:", error);
      return { ...EMPTY_RECORD };
    }
  },

  async getPending(patientId: number): Promise<MedicalRecordState> {
    if (USE_MOCK) {
      return medicalRecordMockStore.getPending(patientId);
    }
    try {
      const data = await apiRequest<MedicalRecordState>(undefined, () =>
        axiosInstance.get<ApiResponse<MedicalRecordState>>(
          `${BASE}/patient/${patientId}/pending`
        )
      );
      const unwrapped = unwrapApiDataOptional(data);
      if (!unwrapped) return { ...EMPTY_RECORD };
      return normalizeMedicalRecordFields(unwrapped as Record<string, unknown>);
    } catch (error: any) {
      // 404 means the /pending endpoint doesn't exist on this backend — silently ignore
      const status = error?.response?.status ?? error?.status;
      if (status !== 404) {
        console.warn("medicalRecordService.getPending failed:", error);
      }
      return { ...EMPTY_RECORD };
    }
  },

  async saveAiResult(_patientId: number, _payload: SaveAiResultDto): Promise<void> {
    return Promise.resolve();
  },

  async addAllergy(
    patientId: number,
    payload: { name: string; severity: string; reaction: string }
  ): Promise<unknown> {
    if (USE_MOCK) return medicalRecordMockStore.addAllergy(patientId, payload);
    const data = await apiRequest(payload, () =>
      axiosInstance.post<ApiResponse>(`${BASE}/${patientId}/allergies`, payload)
    );
    return data.data ?? data;
  },

  async addVisit(
    patientId: number,
    payload: {
      date: string;
      doctorName: string;
      reasonForVisit: string;
      diagnosis: string;
      treatmentPlan: string;
    }
  ): Promise<unknown> {
    if (USE_MOCK) return medicalRecordMockStore.addVisit(patientId, payload);
    const data = await apiRequest(payload, () =>
      axiosInstance.post<ApiResponse>(`${BASE}/${patientId}/visits`, payload)
    );
    return data.data ?? data;
  },

  async addSurgery(
    patientId: number,
    payload: { name: string; date: string; outcome: string }
  ): Promise<unknown> {
    if (USE_MOCK) return medicalRecordMockStore.addSurgery(patientId, payload);
    const data = await apiRequest(payload, () =>
      axiosInstance.post<ApiResponse>(`${BASE}/${patientId}/surgeries`, payload)
    );
    return data.data ?? data;
  },

  async addTest(
    patientId: number,
    payload: { name: string; date: string; result: string }
  ): Promise<unknown> {
    if (USE_MOCK) return medicalRecordMockStore.addTest(patientId, payload);
    const data = await apiRequest(payload, () =>
      axiosInstance.post<ApiResponse>(`${BASE}/${patientId}/tests`, payload)
    );
    return data.data ?? data;
  },

  async addMedication(
    patientId: number,
    payload: {
      name: string;
      dosage: string;
      frequency: string;
      startDate: string;
      endDate: string | null;
      reminderTimes: string[];
      daysOfWeek: string[];
      notes: string | null;
    }
  ): Promise<unknown> {
    if (USE_MOCK) return medicalRecordMockStore.addMedication(patientId, payload);
    const data = await apiRequest(payload, () =>
      axiosInstance.post<ApiResponse>(`${BASE}/${patientId}/medications`, payload)
    );
    return data.data ?? data;
  },

  async addFamilyCondition(
    patientId: number,
    payload: { name: string; relative: string; diagnosisDate: string }
  ): Promise<unknown> {
    if (USE_MOCK) return medicalRecordMockStore.addFamilyCondition(patientId, payload);
    const data = await apiRequest(payload, () =>
      axiosInstance.post<ApiResponse>(`${BASE}/${patientId}/family-conditions`, payload)
    );
    return data.data ?? data;
  },

  async updateAllergy(
    entryId: number,
    payload: { name: string; severity: string; reaction: string }
  ): Promise<unknown> {
    if (USE_MOCK) return medicalRecordMockStore.updateAllergy(entryId, payload);
    const data = await apiRequest(payload, () =>
      axiosInstance.put<ApiResponse>(`${BASE}/allergies/${entryId}`, payload)
    );
    return data.data ?? data;
  },

  async updateVisit(
    entryId: number,
    payload: {
      date: string;
      doctorName: string;
      reasonForVisit: string;
      diagnosis: string;
      treatmentPlan: string;
    }
  ): Promise<unknown> {
    if (USE_MOCK) return medicalRecordMockStore.updateVisit(entryId, payload);
    const data = await apiRequest(payload, () =>
      axiosInstance.put<ApiResponse>(`${BASE}/visits/${entryId}`, payload)
    );
    return data.data ?? data;
  },

  async updateSurgery(
    entryId: number,
    payload: { name: string; date: string; outcome: string }
  ): Promise<unknown> {
    if (USE_MOCK) return medicalRecordMockStore.updateSurgery(entryId, payload);
    const data = await apiRequest(payload, () =>
      axiosInstance.put<ApiResponse>(`${BASE}/surgeries/${entryId}`, payload)
    );
    return data.data ?? data;
  },

  async updateTest(
    entryId: number,
    payload: { name: string; date: string; result: string }
  ): Promise<unknown> {
    if (USE_MOCK) return medicalRecordMockStore.updateTest(entryId, payload);
    const data = await apiRequest(payload, () =>
      axiosInstance.put<ApiResponse>(`${BASE}/tests/${entryId}`, payload)
    );
    return data.data ?? data;
  },

  async updateMedication(
    entryId: number,
    payload: {
      name: string;
      dosage: string;
      frequency: string;
      startDate: string;
      endDate: string | null;
      reminderTimes: string[];
      daysOfWeek: string[];
      notes: string | null;
    }
  ): Promise<unknown> {
    if (USE_MOCK) return medicalRecordMockStore.updateMedication(entryId, payload);
    const data = await apiRequest(payload, () =>
      axiosInstance.put<ApiResponse>(`${BASE}/medications/${entryId}`, payload)
    );
    return data.data ?? data;
  },

  async updateFamilyCondition(
    entryId: number,
    payload: { name: string; relative: string; diagnosisDate: string }
  ): Promise<unknown> {
    if (USE_MOCK) return medicalRecordMockStore.updateFamilyCondition(entryId, payload);
    const data = await apiRequest(payload, () =>
      axiosInstance.put<ApiResponse>(`${BASE}/family-conditions/${entryId}`, payload)
    );
    return data.data ?? data;
  },

  async reviewEntry(
    section: MedicalRecordSection,
    entryId: number,
    body: { approve: boolean; note: string }
  ): Promise<void> {
    if (USE_MOCK) {
      medicalRecordMockStore.reviewEntry(section, entryId, body);
      return;
    }
    const data = await apiRequest(body, () =>
      axiosInstance.patch<ApiResponse>(`${BASE}/${section}/${entryId}/review`, body)
    );
    if (!data.success) {
      throw new Error(data.message || "Review failed");
    }
  },

  async deleteAllergy(entryId: number): Promise<void> {
    if (USE_MOCK) {
      medicalRecordMockStore.deleteAllergy(entryId);
      return;
    }
    await apiRequest(undefined, () =>
      axiosInstance.delete<ApiResponse>(`${BASE}/allergies/${entryId}`)
    );
  },

  async deleteVisit(entryId: number): Promise<void> {
    if (USE_MOCK) {
      medicalRecordMockStore.deleteVisit(entryId);
      return;
    }
    await apiRequest(undefined, () =>
      axiosInstance.delete<ApiResponse>(`${BASE}/visits/${entryId}`)
    );
  },

  async deleteSurgery(entryId: number): Promise<void> {
    if (USE_MOCK) {
      medicalRecordMockStore.deleteSurgery(entryId);
      return;
    }
    await apiRequest(undefined, () =>
      axiosInstance.delete<ApiResponse>(`${BASE}/surgeries/${entryId}`)
    );
  },

  async deleteTest(entryId: number): Promise<void> {
    if (USE_MOCK) {
      medicalRecordMockStore.deleteTest(entryId);
      return;
    }
    await apiRequest(undefined, () =>
      axiosInstance.delete<ApiResponse>(`${BASE}/tests/${entryId}`)
    );
  },

  async deleteMedication(entryId: number, patientId?: number): Promise<void> {
    if (USE_MOCK) {
      medicalRecordMockStore.deleteMedication(entryId);
      return;
    }

    const urls = [
      { method: "DELETE", url: `${BASE}/medications/${entryId}` },
      { method: "DELETE", url: `${BASE}/medication/${entryId}` },
      ...(patientId != null ? [{ method: "DELETE", url: `${BASE}/${patientId}/medications/${entryId}` }] : []),
      { method: "DELETE", url: `/api/medications/${entryId}` }
    ];

    let lastError: any = null;
    for (const item of urls) {
      try {
        console.log(`[deleteMedication] Probing: ${item.method} ${item.url}`);
        await axiosInstance.request({
          method: item.method,
          url: item.url
        });
        console.log(`[deleteMedication] Success: ${item.method} ${item.url}`);
        return;
      } catch (err: any) {
        lastError = err;
        const status = err?.response?.status;
        const msg = err?.response?.data?.message || err?.message;
        console.warn(`[deleteMedication] Failed: ${item.method} ${item.url} -> Status ${status}: ${msg}`);
      }
    }

    throw new Error(await parseServiceError(lastError));
  },

  async deleteFamilyCondition(entryId: number): Promise<void> {
    if (USE_MOCK) {
      medicalRecordMockStore.deleteFamilyCondition(entryId);
      return;
    }
    await apiRequest(undefined, () =>
      axiosInstance.delete<ApiResponse>(`${BASE}/family-conditions/${entryId}`)
    );
  },
};
