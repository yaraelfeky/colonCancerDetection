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
const PASSWORD_CHANGE_REQUEST = "/api/auth/password/change/request";
const PASSWORD_CHANGE_CONFIRM = "/api/auth/password/change/confirm";
const PASSWORD_FORGOT = "/api/auth/password/forgot";
const PASSWORD_RESET = "/api/auth/password/reset";

export { TOKEN_KEY };
const REFRESH_TOKEN_KEY = "refreshToken";
const REMEMBER_KEY = "rememberMe";

function persistToken(token: string | null | undefined): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(REMEMBER_KEY);
}

function handleAuthResponse(data: AuthResponseDto): void {
  if (!data.success) {
    clearToken();
    throw new Error(data.message || "Authentication failed");
  }

  const token = data.accessToken ?? data.token ?? null;
  if (!token) {
    clearToken();
    throw new Error(data.message || "No token received");
  }

  persistToken(token);
}

function persistTokenForLogin(
  token: string,
  refreshToken: string | null,
  remember = true
): void {
  clearToken();

  if (remember) {
    localStorage.setItem(TOKEN_KEY, token);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    localStorage.setItem(REMEMBER_KEY, "1");
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
    if (refreshToken) {
      sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    localStorage.removeItem(REMEMBER_KEY);
  }
}

function extractToken(data: AuthResponseDto): string | null {
  return data.accessToken ?? data.token ?? null;
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

    const remember =
      localStorage.getItem(REMEMBER_KEY) === "1" ||
      !!localStorage.getItem(REFRESH_TOKEN_KEY);
    persistTokenForLogin(newToken, data.refreshToken ?? refreshToken, remember);
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

  async updateMail(dto: UpdateMailDto): Promise<void> {
    await axiosInstance.put(AUTH_UPDATE_MAIL, dto);
  },

  async updateUsername(dto: UpdateUsernameDto): Promise<void> {
    await axiosInstance.put(AUTH_UPDATE_USERNAME, dto);
  },

  async requestPasswordChange(dto: RequestPasswordChangeOtpDto): Promise<void> {
    const { data } = await axiosInstance.post<ApiResultDto>(
      PASSWORD_CHANGE_REQUEST,
      dto
    );
    if (!data.success) {
      throw new Error(data.message || "Failed to send verification code");
    }
  },

  async confirmPasswordChange(dto: ConfirmPasswordChangeDto): Promise<void> {
    const { data } = await axiosInstance.post<ApiResultDto>(
      PASSWORD_CHANGE_CONFIRM,
      dto
    );
    if (!data.success) {
      throw new Error(data.message || "Failed to change password");
    }
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
    return (
      localStorage.getItem(REFRESH_TOKEN_KEY) ||
      sessionStorage.getItem(REFRESH_TOKEN_KEY)
    );
  },

  isAuthenticated(): boolean {
    return !!readAuthToken();
  },
};
