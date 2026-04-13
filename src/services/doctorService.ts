import { axiosInstance } from "../api/axiosInstance";
import type { DoctorProfileDto } from "../types/doctor";
import {
  mergeDoctorProfile,
  readLocalProfile,
  writeLocalProfile,
} from "../utils/localDoctorProfile";

/** Change to match your backend (e.g. /api/doctors/me) */
const DOCTOR_PROFILE = "/api/Doctor/profile";

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
      const { data } = await axiosInstance.get<DoctorProfileDto | { data: DoctorProfileDto }>(
        DOCTOR_PROFILE
      );
      api = unwrap<DoctorProfileDto>(data) ?? null;
    } catch {
      api = null;
    }
    const local = readLocalProfile();
    return mergeDoctorProfile(api, local);
  },

  async updateProfile(body: Partial<DoctorProfileDto>): Promise<DoctorProfileDto | null> {
    writeLocalProfile(body);

    try {
      const { data } = await axiosInstance.patch<DoctorProfileDto | { data: DoctorProfileDto }>(
        DOCTOR_PROFILE,
        body
      );
      const server = unwrap<DoctorProfileDto>(data);
      if (server && typeof server === "object") {
        writeLocalProfile(server);
      }
    } catch {
      /* keep merged local copy */
    }

    return mergeDoctorProfile(null, readLocalProfile());
  },
};
