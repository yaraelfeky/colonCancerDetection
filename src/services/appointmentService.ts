import { axiosInstance } from "../api/axiosInstance";
import type { ApiResponse } from "../types/api";
import { parseServiceError, unwrapApiDataOrEmpty } from "../utils/apiResponse";

export interface AppointmentDto {
  id?: number;
  slotId?: number;
  patientId?: number;
  patientName?: string;
  patientUserName?: string;
  doctorId?: number;
  doctorName?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  time?: string;
  status?: string;
  patientNotes?: string;
  doctorNotes?: string;
  serviceType?: string;
}

export interface BookSlotDto {
  slotId: number;
  patientNotes?: string | null;
}

export interface CancelSlotDto {
  slotId: number;
  reason?: string | null;
}

export interface RescheduleDto {
  oldSlotId: number;
  newSlotId: number;
  patientNotes?: string | null;
}

const BASE = "/api/appointments";

export const appointmentService = {
  async getMyAppointments(): Promise<AppointmentDto[]> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<AppointmentDto[]>>(`${BASE}/my`);
      return unwrapApiDataOrEmpty(data);
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },

  async getAvailableSlots(doctorUserId: number): Promise<unknown[]> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<unknown[]>>(
        `${BASE}/available/${doctorUserId}`
      );
      return unwrapApiDataOrEmpty(data);
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },

  async book(dto: BookSlotDto): Promise<void> {
    try {
      const { data } = await axiosInstance.post<ApiResponse>(`${BASE}/book`, dto);
      if (!data.success) throw new Error(data.message || "Booking failed");
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },

  async cancel(dto: CancelSlotDto): Promise<void> {
    try {
      const { data } = await axiosInstance.patch<ApiResponse>(`${BASE}/cancel`, dto);
      if (!data.success) throw new Error(data.message || "Cancel failed");
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },

  async reschedule(dto: RescheduleDto): Promise<void> {
    try {
      const { data } = await axiosInstance.patch<ApiResponse>(`${BASE}/reschedule`, dto);
      if (!data.success) throw new Error(data.message || "Reschedule failed");
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },

  async getDoctorAppointments(): Promise<AppointmentDto[]> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<AppointmentDto[]>>(`${BASE}/doctor`);
      return unwrapApiDataOrEmpty(data);
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },

  async getPendingForDoctor(): Promise<AppointmentDto[]> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<AppointmentDto[]>>(`${BASE}/doctor/pending`);
      return unwrapApiDataOrEmpty(data);
    } catch (error) {
      // If endpoint doesn't exist, fall back to getting all and filtering
      try {
        const { data: allData } = await axiosInstance.get<ApiResponse<AppointmentDto[]>>(`${BASE}/doctor`);
        const all = unwrapApiDataOrEmpty(allData);
        return all.filter(a => (a.status ?? "").toLowerCase() === "pending");
      } catch {
        throw new Error(await parseServiceError(error));
      }
    }
  },

  async approveAppointment(appointmentId: number): Promise<void> {
    try {
      const { data } = await axiosInstance.patch<ApiResponse>(`${BASE}/${appointmentId}/approve`);
      if (!data.success) throw new Error(data.message || "Approve failed");
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },

  async rejectAppointment(appointmentId: number, reason?: string): Promise<void> {
    try {
      const { data } = await axiosInstance.patch<ApiResponse>(`${BASE}/${appointmentId}/reject`, { reason: reason ?? "" });
      if (!data.success) throw new Error(data.message || "Reject failed");
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },
};

export function normalizeAppointment(a: AppointmentDto) {
  const dateStr = a.date ?? "";
  const timeStr = a.startTime ?? a.time ?? "";
  return {
    id: String(a.id ?? a.slotId ?? ""),
    slotId: a.slotId ?? a.id ?? 0,
    patientName: a.patientName ?? a.patientUserName ?? "Patient",
    date: dateStr.includes("T") ? dateStr.split("T")[0] : dateStr,
    time: timeStr.includes("T")
      ? timeStr.split("T")[1]?.slice(0, 5) ?? timeStr
      : timeStr.slice(0, 5),
    status: (a.status ?? "Pending") as "Confirmed" | "Pending" | "Cancelled",
    serviceType: a.serviceType ?? "Appointment",
    notes: a.patientNotes ?? a.doctorNotes ?? "",
  };
}
