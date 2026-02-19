import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authService } from "../services/authService";
import type { LoginCredentials, RegisterCredentials } from "../types/auth";

export interface User {
  email: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  register: (credentials: RegisterCredentials) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): User | null {
  const token = authService.getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1] ?? "{}"));
    const email = payload.email ?? payload.sub ?? "";
    return email ? { email } : null;
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

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      await authService.login(credentials);
      // const user = readStoredUser() ?? { email: credentials.userName };
      const user = readStoredUser() ?? { email: credentials.usernameOrEmail };
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    },
    []
  );


  const register = useCallback(
    async (credentials: RegisterCredentials) => {
      await authService.register(credentials);
      const user = readStoredUser() ?? { email: credentials.email };
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    },
    []
  );

  const logout = useCallback(() => {
    authService.logout();
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
