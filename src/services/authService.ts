import { axiosInstance } from "../api/axiosInstance";
import type {
  AuthResponseDto,
  LoginRequestDto,
  RegisterRequestDto,
} from "../types/auth";

const AUTH_LOGIN = "/api/Auth/login";
const AUTH_REGISTER = "/api/Auth/register";
const TOKEN_KEY = "token";

function persistToken(token: string | null | undefined): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
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

export const authService = {
  async login(dto: LoginRequestDto): Promise<AuthResponseDto> {
    const { data } = await axiosInstance.post<AuthResponseDto>(AUTH_LOGIN, dto);
    handleAuthResponse(data);
    return data;
  },

  async register(dto: RegisterRequestDto): Promise<AuthResponseDto> {
    const { data } = await axiosInstance.post<AuthResponseDto>(AUTH_REGISTER, dto);
    handleAuthResponse(data);
    return data;
  },

  logout(): void {
    clearToken();
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  },
};
