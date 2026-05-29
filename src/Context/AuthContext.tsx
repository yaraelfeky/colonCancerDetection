import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { authService } from "../services/authService";
import { doctorService } from "../services/doctorService";
import type {
  GoogleLoginRequestDto,
  GoogleLoginResultDto,
  GoogleRegisterRequestDto,
  LoginRequestDto,
  RegisterRequestDto,
} from "../types/auth";
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
  logout: () => Promise<void>;
  register: (dto: RegisterRequestDto) => Promise<void>;
  googleLogin: (dto: GoogleLoginRequestDto, remember: boolean) => Promise<GoogleLoginResultDto>;
  googleRegister: (dto: GoogleRegisterRequestDto) => Promise<void>;
  updateMail: (newEmail: string) => Promise<void>;
  updateUsername: (newUsername: string) => Promise<void>;
  requestPasswordChange: (currentPassword: string) => Promise<void>;
  confirmPasswordChange: (
    otpCode: string,
    newPassword: string,
    confirmNewPassword: string
  ) => Promise<void>;
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

    const role = parseRoleFromJwt(token) ?? "";

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

    if (isAuthenticated && user?.role?.toLowerCase() === "doctor") {
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
      // Do NOT call refreshAuth — user is pending admin approval
    },
    [],
  );

  const googleRegister = useCallback(
    async (dto: GoogleRegisterRequestDto) => {
      await authService.googleRegister(dto);
      // Do NOT call refreshAuth — user is pending admin approval
    },
    [],
  );

  const googleLogin = useCallback(
    async (dto: GoogleLoginRequestDto, remember: boolean) => {
      const result = await authService.googleLogin(dto, remember);
      if (
        result.success &&
        !result.requiresRegistration &&
        !result.isPendingApproval
      ) {
        await refreshAuth();
      }
      return result;
    },
    [refreshAuth],
  );

  const logout = useCallback(async () => {
    await authService.logout();
    clearStoredUserRole();
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("colonai-local-profile-changed"));
    setState({
      user: null,
      doctorProfile: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const updateMail = useCallback(
    async (newEmail: string) => {
      await authService.updateMail({ newEmail });
      await refreshAuth();
    },
    [refreshAuth],
  );

  const updateUsername = useCallback(
    async (newUserName: string) => {
      await authService.updateUsername({ newUserName });
      await refreshAuth();
    },
    [refreshAuth],
  );

  const requestPasswordChange = useCallback(
    async (currentPassword: string) => {
      await authService.requestPasswordChange({ currentPassword });
    },
    [],
  );

  const confirmPasswordChange = useCallback(
    async (otpCode: string, newPassword: string, confirmNewPassword: string) => {
      await authService.confirmPasswordChange({
        otpCode,
        newPassword,
        confirmNewPassword,
      });
    },
    [],
  );

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    register,
    googleLogin,
    googleRegister,
    updateMail,
    updateUsername,
    requestPasswordChange,
    confirmPasswordChange,
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
