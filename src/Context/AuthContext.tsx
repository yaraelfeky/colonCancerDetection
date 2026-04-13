import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authService } from "../services/authService";
import type { LoginRequestDto, RegisterRequestDto } from "../types/auth";
import { clearStoredUserRole, parseRoleFromJwt, setStoredUserRole } from "../utils/userRole";

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
      (payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] as string | undefined) ??
      (payload.email as string | undefined) ??
      (payload.sub as string | undefined) ??
      "";

    const username =
      (payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] as string | undefined) ??
      (payload.username as string | undefined) ??
      (payload.unique_name as string | undefined) ??
      "";

    const role =
      (payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] as string | undefined) ??
      (payload.role as string | undefined) ??
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
    const roleFromJwt = parseRoleFromJwt(authService.getToken());
    if (roleFromJwt) {
      setStoredUserRole(roleFromJwt);
    }
    setState({
      user: isAuthenticated ? readStoredUser() : null,
      isAuthenticated,
      isLoading: false,
    });
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const login = useCallback(async (dto: LoginRequestDto, remember: boolean) => {
    await authService.login(dto, remember);
    const token = authService.getToken();
    const roleFromJwt = parseRoleFromJwt(token);
    if (roleFromJwt) {
      setStoredUserRole(roleFromJwt);
    }
    const user =
      readStoredUser() ?? {
        email: dto.usernameOrEmail,
        username: dto.usernameOrEmail,
      };
    setState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const register = useCallback(async (dto: RegisterRequestDto) => {
    await authService.register(dto);
    setStoredUserRole(dto.isDoctor ? "doctor" : "patient");
    const user =
      readStoredUser() ?? {
        email: dto.email,
        username: dto.username,
      };
    setState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    clearStoredUserRole();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

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
