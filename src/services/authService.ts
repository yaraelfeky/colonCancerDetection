import { axiosInstance } from "../api/axiosInstance";
import { TOKEN_KEY, readAuthToken } from "../utils/authToken";
import {
  parseGoogleLoginResultDto,
  requiresGoogleDoctorRegistration,
} from "../utils/googleLoginFlow";
import type {
  ApiResultDto,
  AuthResponseDto,
  ConfirmPasswordChangeDto,
  ForgotPasswordRequestDto,
  ForgotPasswordResetDto,
  GoogleLoginRequestDto,
  GoogleLoginResultDto,
  GoogleRegisterRequestDto,
  LoginRequestDto,
  RegisterRequestDto,
  RequestPasswordChangeOtpDto,
  DeleteAccountDto,
  UpdateMailDto,
  UpdateUsernameDto,
} from "../types/auth";

const AUTH_LOGIN = "/api/Auth/login";
const AUTH_REGISTER = "/api/Auth/register";
const AUTH_GOOGLE_LOGIN = "/api/Auth/google-login";
const AUTH_GOOGLE_REGISTER = "/api/Auth/google-register-doctor";
const AUTH_REFRESH = "/api/Auth/refresh-token";
const AUTH_LOGOUT = "/api/Auth/logout";
const AUTH_UPDATE_MAIL = "/api/Auth/updateMail";
const AUTH_UPDATE_USERNAME = "/api/Auth/updateUsername";
const AUTH_DELETE = "/api/Auth/delete";
const PASSWORD_CHANGE_REQUEST = "/api/auth/password/change/request";
const PASSWORD_CHANGE_CONFIRM = "/api/auth/password/change/confirm";
const PASSWORD_FORGOT = "/api/auth/password/forgot";
const PASSWORD_RESET = "/api/auth/password/reset";

export { TOKEN_KEY };
const REFRESH_TOKEN_KEY = "refreshToken";
const REMEMBER_KEY = "rememberMe";

function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(REMEMBER_KEY);
}

function extractToken(data: AuthResponseDto): string | null {
  return data.accessToken ?? data.token ?? null;
}

/** All auth tokens persist in localStorage only (existing keys: token, refreshToken). */
function persistAuthTokensToLocalStorage(
  accessToken: string,
  refreshToken: string | null
): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);

  localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
  localStorage.setItem(REMEMBER_KEY, "1");
}

function persistTokenForLogin(
  token: string,
  refreshToken: string | null,
  _remember = true
): void {
  clearToken();
  persistAuthTokensToLocalStorage(token, refreshToken);
}

function applyAuthTokensFromResponse(data: AuthResponseDto): void {
  const token = extractToken(data);
  if (!token) return;
  persistAuthTokensToLocalStorage(token, data.refreshToken ?? null);
}

export const authService = {
  async login(dto: LoginRequestDto, remember = true): Promise<AuthResponseDto> {
    const { data } = await axiosInstance.post<AuthResponseDto>(AUTH_LOGIN, dto);
    if (!data.success) {
      clearToken();
      throw new Error(data.message || "Authentication failed");
    }
    const token = extractToken(data);
    if (!token) {
      clearToken();
      throw new Error(data.message || "No token received");
    }
    persistTokenForLogin(token, data.refreshToken ?? null, remember);
    return data;
  },

  async register(dto: RegisterRequestDto): Promise<AuthResponseDto> {
    const { data } = await axiosInstance.post<AuthResponseDto>(AUTH_REGISTER, dto);
    if (!data.success) {
      throw new Error(data.message || "Registration failed");
    }
    return data;
  },

  /**
   * POST /api/Auth/google-login
   * Body: { idToken, isDoctor } — idToken must be credentialResponse.credential (JWT).
   */
  async googleLogin(
    dto: GoogleLoginRequestDto,
    remember = true
  ): Promise<GoogleLoginResultDto> {
    clearToken();

    const payload: GoogleLoginRequestDto = {
      idToken: dto.idToken,
      isDoctor: dto.isDoctor,
    };

    // Backend may return HTTP 400 with requiresRegistration — not a hard failure.
    const { data: raw } = await axiosInstance.post<unknown>(
      AUTH_GOOGLE_LOGIN,
      payload,
      { validateStatus: (status) => status >= 200 && status < 500 }
    );

    const data = parseGoogleLoginResultDto(raw);

    if (data.isPendingApproval) {
      clearToken();
      return data;
    }

    if (requiresGoogleDoctorRegistration(data)) {
      clearToken();
      return data;
    }

    if (!data.success) {
      clearToken();
      throw new Error(
        data.message || "Google authentication failed. Please try again."
      );
    }

    const token = extractToken(data);
    if (!token) {
      clearToken();
      throw new Error(data.message || "No token received");
    }

    persistTokenForLogin(token, data.refreshToken ?? null, remember);
    return data;
  },

  /**
   * POST /api/Auth/google-register-doctor
   * Body: { idToken, professionalPracticeLicense, issuingAuthority }
   */
  async googleRegister(dto: GoogleRegisterRequestDto): Promise<AuthResponseDto> {
    const payload: GoogleRegisterRequestDto = {
      idToken: dto.idToken,
      professionalPracticeLicense: dto.professionalPracticeLicense,
      issuingAuthority: dto.issuingAuthority,
    };

    const { data } = await axiosInstance.post<AuthResponseDto>(
      AUTH_GOOGLE_REGISTER,
      payload
    );

    clearToken();

    if (!data.success) {
      throw new Error(data.message || "Google registration failed");
    }

    return data;
  },

  async refreshAccessToken(): Promise<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const { data } = await axiosInstance.post<AuthResponseDto>(AUTH_REFRESH, {
      refreshToken,
    });

    const newToken = extractToken(data);
    if (!newToken) {
      clearToken();
      throw new Error("Token refresh failed");
    }

    persistTokenForLogin(newToken, data.refreshToken ?? refreshToken);
    return newToken;
  },

  async logout(): Promise<void> {
    try {
      await axiosInstance.post(AUTH_LOGOUT);
    } catch {
      /* ignore logout API errors — still clear tokens locally */
    }
    clearToken();
  },

  /** PUT /api/Auth/updateMail */
  async updateEmail(newEmail: string): Promise<AuthResponseDto> {
    const payload: UpdateMailDto = { newEmail: newEmail.trim() };
    const { data } = await axiosInstance.put<AuthResponseDto>(
      AUTH_UPDATE_MAIL,
      payload
    );
    if (!data.success) {
      throw new Error(data.message || "Failed to update email");
    }
    applyAuthTokensFromResponse(data);
    return data;
  },

  /** PUT /api/Auth/updateUsername */
  async updateUsername(newUserName: string): Promise<AuthResponseDto> {
    const payload: UpdateUsernameDto = { newUserName: newUserName.trim() };
    const { data } = await axiosInstance.put<AuthResponseDto>(
      AUTH_UPDATE_USERNAME,
      payload
    );
    if (!data.success) {
      throw new Error(data.message || "Failed to update username");
    }
    applyAuthTokensFromResponse(data);
    return data;
  },

  /** @deprecated Use updateEmail */
  async updateMail(dto: UpdateMailDto): Promise<AuthResponseDto> {
    return this.updateEmail(dto.newEmail);
  },

  async requestPasswordChange(currentPassword: string): Promise<ApiResultDto> {
    const dto: RequestPasswordChangeOtpDto = { currentPassword };
    const { data } = await axiosInstance.post<ApiResultDto>(
      PASSWORD_CHANGE_REQUEST,
      dto
    );
    if (!data.success) {
      throw new Error(data.message || "Failed to send verification code");
    }
    return data;
  },

  async confirmPasswordChange(
    payload: ConfirmPasswordChangeDto
  ): Promise<ApiResultDto> {
    const body: ConfirmPasswordChangeDto = {
      otpCode: payload.otpCode.trim(),
      newPassword: payload.newPassword,
      confirmNewPassword: payload.confirmNewPassword,
    };
    const { data } = await axiosInstance.post<ApiResultDto>(
      PASSWORD_CHANGE_CONFIRM,
      body
    );
    if (!data.success) {
      throw new Error(data.message || "Failed to change password");
    }
    return data;
  },

  /** DELETE /api/Auth/delete */
  async deleteAccount(password: string): Promise<AuthResponseDto> {
    const payload: DeleteAccountDto = { password };
    const response = await axiosInstance.delete<AuthResponseDto>(AUTH_DELETE, {
      data: payload,
    });
    const { data } = response;
    if (!data.success) {
      throw new Error(data.message || "Failed to delete account");
    }
    return data;
  },

  async forgotPassword(dto: ForgotPasswordRequestDto): Promise<ApiResultDto> {
    const payload: ForgotPasswordRequestDto = {
      emailOrPhone: dto.emailOrPhone.trim(),
    };
    const { data } = await axiosInstance.post<ApiResultDto>(
      PASSWORD_FORGOT,
      payload
    );
    if (!data.success) {
      throw new Error(data.message || "Failed to send reset code");
    }
    return data;
  },

  async resetPassword(dto: ForgotPasswordResetDto): Promise<ApiResultDto> {
    const payload: ForgotPasswordResetDto = {
      emailOrPhone: dto.emailOrPhone.trim(),
      otpCode: dto.otpCode.trim(),
      newPassword: dto.newPassword,
      confirmNewPassword: dto.confirmNewPassword,
    };
    const { data } = await axiosInstance.post<ApiResultDto>(
      PASSWORD_RESET,
      payload
    );
    if (!data.success) {
      throw new Error(data.message || "Failed to reset password");
    }
    return data;
  },

  getToken(): string | null {
    return readAuthToken();
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    return !!readAuthToken();
  },
};
