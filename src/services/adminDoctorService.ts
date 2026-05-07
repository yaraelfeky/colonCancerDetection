import { axiosInstance } from "../api/axiosInstance";

export interface AdminDoctorListItem {
  doctorUserId: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  specialty?: string;
  createdAt?: string;
  status?: "Pending" | "Approved" | "Rejected";
}

function unwrapArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object" && "data" in (raw as object)) {
    const v = (raw as { data: unknown }).data;
    return Array.isArray(v) ? (v as T[]) : [];
  }
  return [];
}

export const adminDoctorService = {
  async getPending(): Promise<AdminDoctorListItem[]> {
    const { data } = await axiosInstance.get("/api/admin/doctors/pending");
    return unwrapArray<AdminDoctorListItem>(data);
  },

  async getApproved(): Promise<AdminDoctorListItem[]> {
    const { data } = await axiosInstance.get("/api/admin/doctors/approved");
    return unwrapArray<AdminDoctorListItem>(data);
  },

  async approve(doctorUserId: string): Promise<void> {
    await axiosInstance.post(`/api/admin/doctors/${doctorUserId}/approve`);
  },

  async reject(doctorUserId: string): Promise<void> {
    await axiosInstance.post(`/api/admin/doctors/${doctorUserId}/reject`);
  },
};

