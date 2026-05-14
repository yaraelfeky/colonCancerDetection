import { axiosInstance } from "../api/axiosInstance";
import type {
  AuthResponseDto,
  GoogleLoginRequestDto,
  GoogleRegisterRequestDto,
  LoginRequestDto,
  RegisterRequestDto,
  UpdateMailDto,
  UpdatePasswordDto,
  UpdateUsernameDto,
} from "../types/auth";

const AUTH_LOGIN = "/api/Auth/login";
const AUTH_REGISTER = "/api/Auth/register";
const AUTH_GOOGLE_LOGIN = "/api/Auth/google-login";
const AUTH_GOOGLE_REGISTER = "/api/Auth/google-register";
const AUTH_REFRESH = "/api/Auth/refresh-token";
const AUTH_LOGOUT = "/api/Auth/logout";
const AUTH_UPDATE_MAIL = "/api/Auth/updateMail";
const AUTH_UPDATE_USERNAME = "/api/Auth/updateUsername";
const AUTH_UPDATE_PASSWORD = "/api/Auth/updatePassword";

const TOKEN_KEY = "token";
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

/** remember: true → localStorage; false → sessionStorage only */
// function persistTokenForLogin(
//   token: string,
//   refreshToken: string | null,
//   remember: boolean
// ): void {
//   clearToken();
//   localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
//   if (remember) {
//     localStorage.setItem(TOKEN_KEY, token);
//     if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
//   } else {
//     sessionStorage.setItem(TOKEN_KEY, token);
//     if (refreshToken) sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
//   }
// }
function persistTokenForLogin(
  token: string,
  refreshToken: string | null
): void {
  clearToken();

  localStorage.setItem(TOKEN_KEY, token);

  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
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
    persistTokenForLogin(token, data.refreshToken ?? null);
    return data;
  },

  async register(dto: RegisterRequestDto): Promise<AuthResponseDto> {
    const { data } = await axiosInstance.post<AuthResponseDto>(AUTH_REGISTER, dto);
    if (!data.success) {
      throw new Error(data.message || "Registration failed");
    }
    // Do NOT persist token — user is pending approval
    return data;
  },

  async googleLogin(
    dto: GoogleLoginRequestDto,
    remember = true
  ): Promise<AuthResponseDto> {
    const { data } = await axiosInstance.post<AuthResponseDto>(
      AUTH_GOOGLE_LOGIN,
      dto
    );
    if (!data.success) {
      clearToken();
      throw new Error(data.message || "Google authentication failed");
    }
    const token = extractToken(data);
    if (!token) {
      clearToken();
      throw new Error(data.message || "No token received");
    }
    persistTokenForLogin(token, data.refreshToken ?? null);;
    return data;
  },

  async googleRegister(dto: GoogleRegisterRequestDto): Promise<AuthResponseDto> {
    const { data } = await axiosInstance.post<AuthResponseDto>(
      AUTH_GOOGLE_REGISTER,
      dto
    );
    if (!data.success) {
      throw new Error(data.message || "Google registration failed");
    }
    // Do NOT persist token — user is pending approval
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

    // Persist using same storage preference

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

  async updateMail(dto: UpdateMailDto): Promise<void> {
    await axiosInstance.put(AUTH_UPDATE_MAIL, dto);
  },

  async updateUsername(dto: UpdateUsernameDto): Promise<void> {
    await axiosInstance.put(AUTH_UPDATE_USERNAME, dto);
  },

  async updatePassword(dto: UpdatePasswordDto): Promise<void> {
    await axiosInstance.put(AUTH_UPDATE_PASSWORD, dto);
  },

  getToken(): string | null {
    return (
      localStorage.getItem(TOKEN_KEY) ||
      sessionStorage.getItem(TOKEN_KEY)
    );
  },

  getRefreshToken(): string | null {
    return (
      localStorage.getItem(REFRESH_TOKEN_KEY) ||
      sessionStorage.getItem(REFRESH_TOKEN_KEY)
    );
  },

  isAuthenticated(): boolean {
    return !!(localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY));
  },
};
