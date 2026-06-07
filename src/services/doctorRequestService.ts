import { AxiosError } from "axios";
import { axiosInstance } from "../api/axiosInstance";
import type {
  DoctorRequestDto,
  DoctorRequestDetailData,
  DoctorRequestCreatePayload,
  DoctorRequestUpdatePayload,
} from "../types/doctorRequest";

const BASE = "/api/DoctorRequest";

// ── Error helper ─────────────────────────────────────────────────────────────

function parseAxiosError(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as
      | { message?: string; title?: string; errors?: Record<string, string[]> }
      | undefined;

    if (data?.errors) {
      const msgs = Object.values(data.errors).flat();
      if (msgs.length) return msgs.join(" ");
    }
    if (data?.message) return data.message;
    if (data?.title) return data.title;
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Request failed";
}

// ── Service ──────────────────────────────────────────────────────────────────

export const doctorRequestService = {
  /** GET /api/DoctorRequest — list all requests */
  async list(): Promise<DoctorRequestDto[]> {
    try {
      const { data } = await axiosInstance.get(BASE);
      return (data?.data ?? []) as DoctorRequestDto[];
    } catch (error) {
      throw new Error(parseAxiosError(error));
    }
  },

  /** GET /api/DoctorRequest/{id} — get a single request + responses */
  async getById(id: number): Promise<DoctorRequestDetailData> {
    try {
      const { data } = await axiosInstance.get(`${BASE}/${id}`);
      return data?.data as DoctorRequestDetailData;
    } catch (error) {
      throw new Error(parseAxiosError(error));
    }
  },

  /** POST /api/DoctorRequest — create a new request */
  async create(payload: DoctorRequestCreatePayload): Promise<DoctorRequestDto> {
    try {
      console.log("CREATE PAYLOAD", payload);
      const { data } = await axiosInstance.post(BASE, payload);
      return (data?.data ?? data) as DoctorRequestDto;
    } catch (error) {
      throw new Error(parseAxiosError(error));
    }
  },

  /** PUT /api/DoctorRequest/{id} — update an existing request */
  async update(
    id: number,
    payload: DoctorRequestUpdatePayload
  ): Promise<DoctorRequestDto> {
    try {
      const { data } = await axiosInstance.put(`${BASE}/${id}`, payload);
      return (data?.data ?? data) as DoctorRequestDto;
    } catch (error) {
      throw new Error(parseAxiosError(error));
    }
  },

  /** DELETE /api/DoctorRequest/{id} — soft-delete a request */
  async remove(id: number): Promise<void> {
    try {
      await axiosInstance.delete(`${BASE}/${id}`);
    } catch (error) {
      throw new Error(parseAxiosError(error));
    }
  },
};