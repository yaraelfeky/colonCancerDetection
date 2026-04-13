import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { authService } from "../services/authService";
import { doctorService } from "../services/doctorService";
import type { LoginRequestDto, RegisterRequestDto } from "../types/auth";
import type { DoctorProfileDto } from "../types/doctor";
import {
  clearStoredUserRole,
  parseRoleFromJwt,
  setStoredUserRole,
} from "../utils/userRole";
import { writeLocalProfile } from "../utils/localDoctorProfile";

export interface User {
  email: string;
  username?: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  doctorProfile: DoctorProfileDto | null;
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
      (payload[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
      ] as string | undefined) ??
      (payload.email as string | undefined) ??
      (payload.sub as string | undefined) ??
      "";

    const username =
      (payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] as
        | string
        | undefined) ??
      (payload.username as string | undefined) ??
      (payload.unique_name as string | undefined) ??
      "";

    const role =
      (payload[
        "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
      ] as string | undefined) ??
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
    doctorProfile: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const refreshAuth = useCallback(async () => {
    const isAuthenticated = authService.isAuthenticated();
    const user = isAuthenticated ? readStoredUser() : null;
    let doctorProfile: DoctorProfileDto | null = null;

    if (isAuthenticated && user?.role === "doctor") {
      try {
        doctorProfile = await doctorService.getProfile();
        if (doctorProfile) {
          writeLocalProfile(doctorProfile);
        }
      } catch (error) {
        console.warn("فشل في جلب ملف الطبيب:", error);
      }
    }

    const roleFromJwt = parseRoleFromJwt(authService.getToken());
    if (roleFromJwt) {
      setStoredUserRole(roleFromJwt);
    }

    setState({
      user,
      doctorProfile,
      isAuthenticated,
      isLoading: false,
    });
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const login = useCallback(
    async (dto: LoginRequestDto, remember: boolean) => {
      await authService.login(dto, remember);
      await refreshAuth();
    },
    [refreshAuth],
  );

  const register = useCallback(
    async (dto: RegisterRequestDto) => {
      await authService.register(dto);
      await refreshAuth();
    },
    [refreshAuth],
  );

  const logout = useCallback(async () => {
    authService.logout();
    clearStoredUserRole();
    localStorage.removeItem("colonai_doctor_profile_v1");
    localStorage.removeItem("colonai_doctor_avatar_dataurl");
    window.dispatchEvent(new Event("colonai-local-profile-changed"));
    setState({
      user: null,
      doctorProfile: null,
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

export function useDoctorProfile() {
  const { doctorProfile } = useAuth();
  return doctorProfile;
}
