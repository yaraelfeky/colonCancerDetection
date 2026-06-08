// import { axiosInstance } from "../api/axiosInstance";
// import type { ApiResponse } from "../types/api";
// import type {
//   DoctorResponseCreatePayload,
//   DoctorResponseDto,
//   DoctorResponseUpdatePayload,
// } from "../types/doctorResponse";
// import { parseServiceError } from "../utils/apiResponse";

// const BASE = "/api/DoctorResponse";

// function assertSuccess(response: ApiResponse<unknown>, fallback: string): void {
//   if (!response.success) {
//     throw new Error(response.message || fallback);
//   }
// }

// export const doctorResponseService = {
//   /** POST /api/DoctorResponse — approve or reject a patient request */
//   async create(payload: DoctorResponseCreatePayload): Promise<DoctorResponseDto> {
//     try {
//       const { data } = await axiosInstance.post<ApiResponse<DoctorResponseDto>>(
//         BASE,
//         payload
//       );
//       assertSuccess(data, "Failed to submit response");
//       if (!data.data) {
//         throw new Error(data.message || "No data returned");
//       }
//       return data.data;
//     } catch (error) {
//       throw new Error(await parseServiceError(error));
//     }
//   },

//   /** PUT /api/DoctorResponse/{responseId} */
//   async update(
//     responseId: number,
//     payload: DoctorResponseUpdatePayload
//   ): Promise<DoctorResponseDto> {
//     try {
//       const { data } = await axiosInstance.put<ApiResponse<DoctorResponseDto>>(
//         `${BASE}/${responseId}`,
//         payload
//       );
//       assertSuccess(data, "Failed to update response");
//       return data.data ?? { id: responseId };
//     } catch (error) {
//       throw new Error(await parseServiceError(error));
//     }
//   },

//   /** DELETE /api/DoctorResponse/{responseId} */
//   async remove(responseId: number): Promise<void> {
//     try {
//       const { data } = await axiosInstance.delete<ApiResponse<null>>(
//         `${BASE}/${responseId}`
//       );
//       assertSuccess(data, "Failed to delete response");
//     } catch (error) {
//       throw new Error(await parseServiceError(error));
//     }
//   },
// };


import { AxiosError } from "axios";
import { axiosInstance } from "../api/axiosInstance";

const BASE = "/api/DoctorResponse";

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

export const doctorResponseService = {
  /** POST /api/DoctorResponse — Approve request and return the response data with ID */
  async approve(patientRequestId: number, appointmentSchedule: string[] = []): Promise<{ id: number; message: string; appointmentSchedule: string[] }> {
    try {
      const { data } = await axiosInstance.post(BASE, {
        patientRequestId,
        message: "Approved",
        appointmentSchedule,
      });
      // Return the response data including the ID for use in PUT/DELETE operations
      return data.data || { id: patientRequestId, message: "Approved", appointmentSchedule };
    } catch (error) {
      throw new Error(parseAxiosError(error));
    }
  },

  /** PUT /api/DoctorResponse/{responseId} — Update an existing response */
  async update(
    responseId: number,
    payload: { message: string; appointmentSchedule: string[] }
  ): Promise<void> {
    try {
      await axiosInstance.put(`${BASE}/${responseId}`, payload);
    } catch (error) {
      throw new Error(parseAxiosError(error));
    }
  },

  /** DELETE /api/DoctorResponse/{responseId} — Delete a response (used for reject) */
  async remove(responseId: number): Promise<void> {
    try {
      await axiosInstance.delete(`${BASE}/${responseId}`);
    } catch (error) {
      throw new Error(parseAxiosError(error));
    }
  },
};