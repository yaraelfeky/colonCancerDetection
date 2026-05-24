import { axiosInstance } from "../api/axiosInstance";
import type { ApiResponse } from "../types/api";
import { parseServiceError, unwrapApiDataOrEmpty } from "../utils/apiResponse";

export interface PrescriptionDto {
  id?: number;
  requestId?: number;
  name?: string;
  Name?: string;
  dosage?: string;
  Dosage?: string;
  frequency?: string;
  Frequency?: string;
  startDate?: string;
  StartDate?: string;
  endDate?: string;
  EndDate?: string;
  doctorName?: string;
  subject?: string;
  Subject?: string;
  message?: string;
  Message?: string;
  createdAt?: string;
}

const BASE = "/api/medications";

export const prescriptionService = {
  async getByPatient(patientUserId: number): Promise<PrescriptionDto[]> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<PrescriptionDto[]>>(
        `${BASE}/patient/${patientUserId}`
      );
      return unwrapApiDataOrEmpty(data);
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },
};

export function normalizePrescription(p: PrescriptionDto) {
  return {
    id: p.id ?? p.requestId ?? 0,
    name: p.name ?? p.Name ?? "—",
    dosage: p.dosage ?? p.Dosage ?? "—",
    frequency: p.frequency ?? p.Frequency ?? "—",
    startDate: p.startDate ?? p.StartDate ?? "",
    endDate: p.endDate ?? p.EndDate,
    doctorName: p.doctorName,
    subject: p.subject ?? p.Subject,
    message: p.message ?? p.Message,
    createdAt: p.createdAt,
  };
}
