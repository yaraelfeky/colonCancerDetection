import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authService } from "../services/authService";
import type { LoginRequestDto, RegisterRequestDto } from "../types/auth";

export interface User {
  email: string;
  username?: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (dto: LoginRequestDto, remember: boolean) => Promise<void>;
  logout: () => void;
  register: (dto: RegisterRequestDto) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);


function readStoredUser(): User | null {
  const token = authService.getToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1] ?? "{}"));

    const email =
      payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] ??
      "";

    const username =
      payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ??
      "";

    const role =
      payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ??
      "";

    if (!email) return null;

    return {
      email,
      username,
      role,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const refreshAuth = useCallback(() => {
    const isAuthenticated = authService.isAuthenticated();
    setState({
      user: isAuthenticated ? readStoredUser() : null,
      isAuthenticated,
      isLoading: false,
    });
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const logout = useCallback(() => {
    authService.logout();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

const login = useCallback(
  async (dto: LoginRequestDto, remember: boolean) => {
    const response = await authService.login(dto);

    const token = response.accessToken;

    if (!token) {
      throw new Error("No access token received.");
    }

    if (remember) {
      localStorage.setItem("token", token);
    } else {
      sessionStorage.setItem("token", token);
    }

    const user = readStoredUser();
    if (!user) throw new Error("Invalid token.");

    if (user.role !== "Doctor") {
      logout();
      throw new Error("You are not authorized. Doctors only.");
    }

    setState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  },
  [logout]
);

  const register = useCallback(
  async (dto: RegisterRequestDto) => {
    await authService.register(dto);
  },
  []
);


  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
