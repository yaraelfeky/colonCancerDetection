import { axiosInstance } from "../api/axiosInstance";
import { USE_MOCK } from "../config/mockFlags";
import { getMockPatients } from "../mocks/medicalRecordMockStore";
import type { ApiResponse } from "../types/api";
import { doctorRequestService } from "../services/doctorRequestService";
import { parseServiceError, unwrapApiDataOrEmpty, unwrapApiDataOptional } from "../utils/apiResponse";

export interface ListPatient {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  age?: number;
  gender?: string;
}

export interface PatientProfileDto {
  id?: number;
  name?: string;
  userName?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  age?: number;
  gender?: string;
  joinedAt?: string;
  [key: string]: unknown;
}

function normalizeDoctorRequest(r: any) {
  return {
    patientId: Number(r.patientId ?? r.PatientId),
    patientName: String(r.patientName ?? r.PatientName ?? ""),
  };
}

const BASE = "/api/Patient";
const DOCTOR_PATIENTS = "/api/Doctor/Patients";

async function fetchDoctorPatients(): Promise<ListPatient[]> {
  if (USE_MOCK) {
    const list = getMockPatients();
    console.log("API Response:", { success: true, data: list });
    return list;
  }
  try {
    const { data } = await axiosInstance.get<ApiResponse<ListPatient[]>>(DOCTOR_PATIENTS);
    const list = unwrapApiDataOrEmpty(data);
    if (list.length) return list.map(normalizeListPatient);
  } catch (error) {
    console.error(
      "API Error:",
      (error as { response?: { data?: unknown } })?.response?.data || (error as Error).message
    );
    console.warn("Doctor/Patients endpoint not ready yet:", error);
    return [];
  }

  try {
    const requests = await doctorRequestService.list();
    const map = new Map<number, ListPatient>();
    for (const r of requests) {
      const rawId = r.patientId ?? r.PatientId;
      const pid = Number(rawId);

      if (!rawId || Number.isNaN(pid)) continue;
      map.set(pid, {
        id: pid,
        name: String(r.patientName ?? r.PatientName ?? `Patient #${pid}`),
      });
    }
    return Array.from(map.values());
  } catch (error) {
    throw new Error(await parseServiceError(error));
  }
}

export const patientService = {
  async getProfile(): Promise<PatientProfileDto | null> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<PatientProfileDto>>(BASE);
      return unwrapApiDataOptional(data);
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },

  async updateProfile(form: FormData): Promise<void> {
    try {
      const { data } = await axiosInstance.put<ApiResponse>(BASE, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (!data.success) throw new Error(data.message || "Update failed");
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },

  async getDoctorPatients(): Promise<ListPatient[]> {
    return fetchDoctorPatients();
  },

  async getMyPatients(): Promise<ListPatient[]> {
    return fetchDoctorPatients();
  },
};

function normalizeListPatient(p: ListPatient & Record<string, unknown>): ListPatient {
  const id = Number(p.id ?? p.Id ?? p.patientId ?? p.PatientId);
  return {
    id,
    name: String(
      p.name ??
        p.Name ??
        p.userName ??
        p.UserName ??
        p.patientName ??
        p.PatientName ??
        `Patient #${id}`
    ),
    email: (p.email ?? p.Email) as string | undefined,
    phone: (p.phone ?? p.phoneNumber ?? p.Phone ?? p.PhoneNumber) as string | undefined,
    age: (p.age ?? p.Age) as number | undefined,
    gender: (p.gender ?? p.Gender) as string | undefined,
  };
}

export function normalizePatientProfile(
  p: PatientProfileDto & Record<string, unknown>,
  fallbackId?: number
): PatientProfileDto {
  return {
    ...p,
    id: Number(p.id ?? fallbackId ?? 0),
    name: String(p.name ?? p.userName ?? "Patient"),
    email: p.email as string | undefined,
    phone: (p.phone ?? p.phoneNumber) as string | undefined,
  };
}
