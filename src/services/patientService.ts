import { axiosInstance } from "../api/axiosInstance";
import type { ApiResponse } from "../types/api";
import { parseServiceError, unwrapApiDataOrEmpty, unwrapApiDataOptional } from "../utils/apiResponse";
import { doctorRequestService } from "./doctorRequestService";

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

const BASE = "/api/Patient";

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

  async getMyPatients(): Promise<ListPatient[]> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<ListPatient[]>>(
        "/api/Doctor/my-patients"
      );
      const list = unwrapApiDataOrEmpty(data);
      if (list.length) return list.map(normalizeListPatient);
    } catch {
      /* fall through to DoctorRequest fallback */
    }

    try {
      const requests = await doctorRequestService.list();
      const map = new Map<number, ListPatient>();
      for (const r of requests) {
        const pid = Number(r.patientId ?? r.PatientId);
        if (!pid || map.has(pid)) continue;
        map.set(pid, {
          id: pid,
          name: String(r.patientName ?? r.PatientName ?? `Patient #${pid}`),
        });
      }
      return Array.from(map.values());
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },
};

function normalizeListPatient(p: ListPatient & Record<string, unknown>): ListPatient {
  return {
    id: Number(p.id),
    name: String(p.name ?? p.userName ?? `Patient #${p.id}`),
    email: p.email as string | undefined,
    phone: (p.phone ?? p.phoneNumber) as string | undefined,
    age: p.age as number | undefined,
    gender: p.gender as string | undefined,
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
