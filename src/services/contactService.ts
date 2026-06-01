import { axiosInstance } from "../api/axiosInstance";
import type { ApiResponse } from "../types/api";
import type {
  AddEmailRequest,
  AddPhoneRequest,
  EmailOnlyRequest,
  PhoneOnlyRequest,
  VerifyEmailRequest,
  VerifyPhoneRequest,
} from "../types/contact";
import { parseServiceError } from "../utils/apiResponse";

const BASE = "/api/auth/contacts";

function assertSuccess(response: ApiResponse<unknown>, fallback: string): void {
  if (!response.success) {
    throw new Error(response.message || fallback);
  }
}

export const contactService = {
  async addEmail(dto: AddEmailRequest): Promise<void> {
    try {
      const { data } = await axiosInstance.post<ApiResponse<unknown>>(
        `${BASE}/email`,
        dto
      );
      assertSuccess(data, "Failed to add email");
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },

  async verifyEmail(dto: VerifyEmailRequest): Promise<void> {
    try {
      const { data } = await axiosInstance.post<ApiResponse<unknown>>(
        `${BASE}/email/verify`,
        dto
      );
      assertSuccess(data, "Failed to verify email");
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },

  async resendEmailOtp(dto: EmailOnlyRequest): Promise<void> {
    try {
      const { data } = await axiosInstance.post<ApiResponse<unknown>>(
        `${BASE}/email/resend`,
        dto
      );
      assertSuccess(data, "Failed to resend verification code");
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },

  async deleteEmail(dto: EmailOnlyRequest): Promise<void> {
    try {
      const { data } = await axiosInstance.delete<ApiResponse<unknown>>(
        `${BASE}/email`,
        { data: dto }
      );
      assertSuccess(data, "Failed to delete email");
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },

  async setPrimaryEmail(dto: EmailOnlyRequest): Promise<void> {
    try {
      const { data } = await axiosInstance.patch<ApiResponse<unknown>>(
        `${BASE}/email/primary`,
        dto
      );
      assertSuccess(data, "Failed to set primary email");
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },

  async addPhone(dto: AddPhoneRequest): Promise<void> {
    try {
      const { data } = await axiosInstance.post<ApiResponse<unknown>>(
        `${BASE}/phone`,
        dto
      );
      assertSuccess(data, "Failed to add phone number");
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },

  async verifyPhone(dto: VerifyPhoneRequest): Promise<void> {
    try {
      const { data } = await axiosInstance.post<ApiResponse<unknown>>(
        `${BASE}/phone/verify`,
        dto
      );
      assertSuccess(data, "Failed to verify phone number");
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },

  async resendPhoneOtp(dto: PhoneOnlyRequest): Promise<void> {
    try {
      const { data } = await axiosInstance.post<ApiResponse<unknown>>(
        `${BASE}/phone/resend`,
        dto
      );
      assertSuccess(data, "Failed to resend verification code");
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },

  async deletePhone(dto: PhoneOnlyRequest): Promise<void> {
    try {
      const { data } = await axiosInstance.delete<ApiResponse<unknown>>(
        `${BASE}/phone`,
        { data: dto }
      );
      assertSuccess(data, "Failed to delete phone number");
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },

  async setPrimaryPhone(dto: PhoneOnlyRequest): Promise<void> {
    try {
      const { data } = await axiosInstance.patch<ApiResponse<unknown>>(
        `${BASE}/phone/primary`,
        dto
      );
      assertSuccess(data, "Failed to set primary phone number");
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },
};
