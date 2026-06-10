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
      // If the API returns the array directly, data is the array. 
      // If it returns a wrapped response { success: true, data: [...] }, data.data is the array.
      if (Array.isArray(data)) return data;
      return (data?.data ?? []) as DoctorRequestDto[];
    } catch (error) {
      throw new Error(parseAxiosError(error));
    }
  },
  
  async listIncoming(): Promise<DoctorRequestDto[]> {
  try {
    const { data } = await axiosInstance.get("/api/PatientRequest/incoming");
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
      const formData = new FormData();
      formData.append("patientId", payload.patientId);
      formData.append("doctorId", payload.doctorId);
      formData.append("subject", payload.subject);
      formData.append("message", payload.message);
      formData.append("requestType", String(payload.requestType));
      formData.append("importance", String(payload.importance));

      const { data } = await axiosInstance.post(BASE, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
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
      const formData = new FormData();
      formData.append("patientId", payload.patientId);
      formData.append("subject", payload.subject);
      formData.append("message", payload.message);
      formData.append("requestType", String(payload.requestType));
      formData.append("importance", String(payload.importance));

      const { data } = await axiosInstance.put(`${BASE}/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
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

  /** DELETE /api/PatientRequest/{requestId} — delete a patient request (used for reject) */
  async removePatientRequest(requestId: number): Promise<void> {
    try {
      await axiosInstance.delete(`/api/PatientRequest/${requestId}`);
    } catch (error) {
      throw new Error(parseAxiosError(error));
    }
  },

  /** PATCH /api/DoctorRequest/{id}/complete — mark doctor request as completed */
  async complete(id: number): Promise<{ success: boolean; message: string; data: null }> {
    try {
      const { data } = await axiosInstance.patch(`/api/DoctorRequest/${id}/complete`, {});
      return data;
    } catch (error) {
      throw new Error(parseAxiosError(error));
    }
  },

  /** PATCH /api/PatientRequest/{id}/complete — mark patient request as completed */
  async completePatientRequest(id: number): Promise<{ success: boolean; message: string; data: null }> {
    try {
      console.log("Completing patient request with ID:", id);
      const { data } = await axiosInstance.patch(`/api/PatientRequest/${id}/complete`, {});
      return data;
    } catch (error) {
      throw new Error(parseAxiosError(error));
    }
  },
};

// import { AxiosError } from "axios";
// import { axiosInstance } from "../api/axiosInstance";
// import type {
//   DoctorRequestDto,
//   DoctorRequestDetailData,
//   DoctorRequestCreatePayload,
//   DoctorRequestUpdatePayload,
// } from "../types/doctorRequest";

// const BASE = "/api/DoctorRequest";

// function parseAxiosError(error: unknown): string {
//   if (error instanceof AxiosError) {
//     const data = error.response?.data as
//       | { message?: string; title?: string; errors?: Record<string, string[]> }
//       | undefined;
//     if (data?.errors) {
//       const msgs = Object.values(data.errors).flat();
//       if (msgs.length) return msgs.join(" ");
//     }
//     if (data?.message) return data.message;
//     if (data?.title) return data.title;
//     return error.message;
//   }
//   if (error instanceof Error) return error.message;
//   return "Request failed";
// }

// export const doctorRequestService = {
//   async list(): Promise<DoctorRequestDto[]> {
//     try {
//       const { data } = await axiosInstance.get(BASE);
//       return (data?.data ?? []) as DoctorRequestDto[];
//     } catch (error) {
//       throw new Error(parseAxiosError(error));
//     }
//   },

//   /** GET /api/PatientRequest/incoming */
//   async listIncoming(): Promise<DoctorRequestDto[]> {
//     try {
//       const { data } = await axiosInstance.get("/api/PatientRequest/incoming");
//       return (data?.data ?? []) as DoctorRequestDto[];
//     } catch (error) {
//       throw new Error(parseAxiosError(error));
//     }
//   },

//   async getById(id: number): Promise<DoctorRequestDetailData> {
//     try {
//       const { data } = await axiosInstance.get(`${BASE}/${id}`);
//       return data?.data as DoctorRequestDetailData;
//     } catch (error) {
//       throw new Error(parseAxiosError(error));
//     }
//   },

//   async create(payload: DoctorRequestCreatePayload): Promise<DoctorRequestDto> {
//     try {
//       const { data } = await axiosInstance.post(BASE, payload);
//       return (data?.data ?? data) as DoctorRequestDto;
//     } catch (error) {
//       throw new Error(parseAxiosError(error));
//     }
//   },

//   async update(id: number, payload: DoctorRequestUpdatePayload): Promise<DoctorRequestDto> {
//     try {
//       const { data } = await axiosInstance.put(`${BASE}/${id}`, payload);
//       return (data?.data ?? data) as DoctorRequestDto;
//     } catch (error) {
//       throw new Error(parseAxiosError(error));
//     }
//   },

//   async remove(id: number): Promise<void> {
//     try {
//       await axiosInstance.delete(`${BASE}/${id}`);
//     } catch (error) {
//       throw new Error(parseAxiosError(error));
//     }
//   },
// };