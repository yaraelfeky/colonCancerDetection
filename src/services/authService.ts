import { axiosInstance } from "../api/axiosInstance";
import type { AuthResponse, LoginCredentials, RegisterCredentials } from "../types/auth";

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

// function handleAuthResponse(data: AuthResponse): void {
//   // If backend explicitly says failure, respect it
//   if (data.success === false) {
//     clearToken();
//     throw new Error(data.message || "Authentication failed");
//   }

//   // Store token when backend returns it; do not fail purely because token is absent
//   const token = data.token ?? data.accessToken ?? null;
//   persistToken(token);
// }

function handleAuthResponse(data: AuthResponse): void {
  if (!data.success || !data.accessToken) {
    clearToken();
    throw new Error(data.message || "Authentication failed");
  }

  persistToken(data.accessToken);
}



export const authService = {
  // async login(credentials: LoginCredentials): Promise<AuthResponse> {
  //   const { data } = await axiosInstance.post<AuthResponse>(AUTH_LOGIN, credentials);
  //   handleAuthResponse(data);
  //   return data;
  // },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
  console.log("LOGIN SENDING:", credentials);

  const response = await axiosInstance.post(AUTH_LOGIN, credentials);

  console.log("LOGIN RESPONSE:", response.data);
  handleAuthResponse(response.data);
  return response.data;
  },

  // async register(credentials: RegisterCredentials): Promise<AuthResponse> {
  //   const { data } = await axiosInstance.post<AuthResponse>(AUTH_REGISTER, credentials);
  //   handleAuthResponse(data);
  //   return data;
  // },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
  console.log("SENDING DATA:", credentials);

  const response = await axiosInstance.post(AUTH_REGISTER, credentials);
  console.log("RESPONSE:", response.data);

  handleAuthResponse(response.data);
  return response.data;
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
