import { axiosInstance } from "../api/axiosInstance";
import type { DoctorProfileDto } from "../types/doctor";
import {
  mergeDoctorProfile,
  readLocalProfile,
  writeLocalProfile,
} from "../utils/localDoctorProfile";

/** Backend doctor profile endpoints */
const DOCTOR_PROFILE = "/api/Doctor";

function unwrap<T>(raw: unknown): T {
  if (raw && typeof raw === "object" && "data" in (raw as object)) {
    return (raw as { data: T }).data;
  }
  return raw as T;
}

export const doctorService = {
  async getProfile(): Promise<DoctorProfileDto | null> {
    let api: DoctorProfileDto | null = null;
    try {
      const { data } = await axiosInstance.get<
        DoctorProfileDto | { data: DoctorProfileDto }
      >(DOCTOR_PROFILE);
      api = unwrap<DoctorProfileDto>(data) ?? null;
    } catch {
      api = null;
    }
    const local = readLocalProfile();
    // Merge: local preferences override API (e.g. unsaved field edits),
    // but DON'T re-persist the merged result — that would make stale local data stick forever.
    const merged = mergeDoctorProfile(api, local);
    return merged;
  },

  async updateProfile(
    body: Partial<DoctorProfileDto>,
  ): Promise<DoctorProfileDto | null> {
    writeLocalProfile(body);

    try {
      const { data } = await axiosInstance.put<
        DoctorProfileDto | { data: DoctorProfileDto }
      >(DOCTOR_PROFILE, body);
      const server = unwrap<DoctorProfileDto>(data);
      if (server && typeof server === "object") {
        writeLocalProfile(server);
      }
    } catch {
      /* keep merged local copy */
    }

    return mergeDoctorProfile(null, readLocalProfile());
  },

  async updateDoctorFormData(formData: FormData): Promise<DoctorProfileDto | null> {
    try {
      const { data } = await axiosInstance.put<
        DoctorProfileDto | { data: DoctorProfileDto }
      >(DOCTOR_PROFILE, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const server = unwrap<DoctorProfileDto>(data);
      if (server && typeof server === "object") {
        writeLocalProfile(server);
      }
      return server;
    } catch (err) {
      throw err;
    }
  },

  /** GET /api/Doctor/DoctorSearch */
  async searchDoctors(params?: {
    search?: string;
    isLicenseVerified?: boolean;
    hasSchedule?: boolean;
    sortBy?: string;
    descending?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<unknown[]> {
    try {
      const { data } = await axiosInstance.get<{ data?: unknown[]; value?: unknown[] } | unknown[]>(
        "/api/Doctor/DoctorSearch",
        { params }
      );
      // Handle both wrapped and unwrapped responses
      if (Array.isArray(data)) return data;
      const wrapped = data as { data?: unknown[]; value?: unknown[] };
      return wrapped.data ?? wrapped.value ?? [];
    } catch {
      return [];
    }
  },
};
