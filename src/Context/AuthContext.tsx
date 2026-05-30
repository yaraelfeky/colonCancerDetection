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
  clearStoredAuthIdentity,
  readStoredAuthIdentity,
  writeStoredAuthIdentity,
} from "../utils/authIdentityStore";
import {
  clearStoredUserRole,
  parseRoleFromJwt,
  setStoredUserRole,
} from "../utils/userRole";
import {
  notifyDoctorProfileChanged,
  readLocalProfile,
  writeLocalProfile,
} from "../utils/localDoctorProfile";
import { type AuthUser, readAuthUser } from "../utils/authUser";

export type User = AuthUser;

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
  deleteAccount: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mergeDoctorProfileWithIdentity(
  profile: DoctorProfileDto | null,
  user: User | null
): DoctorProfileDto | null {
  if (!profile && !user) return null;
  const stored = readStoredAuthIdentity();
  const userName =
    stored.userName?.trim() || user?.userName?.trim() || profile?.userName;
  const email =
    stored.email?.trim() || user?.email?.trim() || profile?.email;

  return {
    ...(profile ?? {}),
    ...(userName ? { userName } : {}),
    ...(email ? { email } : {}),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    doctorProfile: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const applyIdentityUpdate = useCallback(
    (patch: { email?: string; userName?: string }) => {
      if (patch.userName !== undefined) {
        writeStoredAuthIdentity({ userName: patch.userName });
      }
      if (patch.email !== undefined) {
        writeStoredAuthIdentity({ email: patch.email });
      }

      const profilePatch: Partial<DoctorProfileDto> = {};
      if (patch.userName !== undefined) profilePatch.userName = patch.userName;
      if (patch.email !== undefined) profilePatch.email = patch.email;
      if (Object.keys(profilePatch).length > 0) {
        writeLocalProfile(profilePatch);
      }

      setState((prev) => {
        const nextUser = prev.user
          ? {
              ...prev.user,
              ...(patch.email !== undefined ? { email: patch.email } : {}),
              ...(patch.userName !== undefined
                ? { userName: patch.userName }
                : {}),
            }
          : readAuthUser();

        const nextDoctorProfile = mergeDoctorProfileWithIdentity(
          prev.doctorProfile
            ? { ...prev.doctorProfile, ...profilePatch }
            : { ...profilePatch },
          nextUser
        );

        return {
          ...prev,
          user: nextUser,
          doctorProfile: nextDoctorProfile,
        };
      });

      notifyDoctorProfileChanged();
    },
    []
  );

  const refreshAuth = useCallback(async () => {
    const isAuthenticated = authService.isAuthenticated();
    const user = isAuthenticated ? readAuthUser() : null;
    let doctorProfile: DoctorProfileDto | null = null;

    if (isAuthenticated && user?.role?.toLowerCase() === "doctor") {
      try {
        const apiProfile = await doctorService.getProfile();
        doctorProfile = mergeDoctorProfileWithIdentity(apiProfile, user);
        if (doctorProfile) {
          writeLocalProfile({
            userName: doctorProfile.userName,
            email: doctorProfile.email,
          });
        }
      } catch {
        const local = readLocalProfile();
        doctorProfile = mergeDoctorProfileWithIdentity(local, user);
      }
    }

    const roleFromJwt = parseRoleFromJwt(authService.getToken());
    if (roleFromJwt) {
      setStoredUserRole(roleFromJwt);
    }

    setState({
      user: isAuthenticated ? readAuthUser() : null,
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
      const user = readAuthUser();
      if (user) {
        writeStoredAuthIdentity({
          userName: user.userName,
          email: user.email,
        });
      }
      await refreshAuth();
    },
    [refreshAuth]
  );

  const register = useCallback(async (dto: RegisterRequestDto) => {
    await authService.register(dto);
  }, []);

  const googleRegister = useCallback(async (dto: GoogleRegisterRequestDto) => {
    await authService.googleRegister(dto);
  }, []);

  const googleLogin = useCallback(
    async (dto: GoogleLoginRequestDto, remember: boolean) => {
      const result = await authService.googleLogin(dto, remember);
      if (
        result.success &&
        !result.requiresRegistration &&
        !result.isPendingApproval
      ) {
        const user = readAuthUser();
        if (user) {
          writeStoredAuthIdentity({
            userName: user.userName,
            email: user.email,
          });
        }
        await refreshAuth();
      }
      return result;
    },
    [refreshAuth]
  );

  const logout = useCallback(async () => {
    await authService.logout();
    clearStoredUserRole();
    clearStoredAuthIdentity();
    localStorage.removeItem("token");
    notifyDoctorProfileChanged();
    setState({
      user: null,
      doctorProfile: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const updateMail = useCallback(
    async (newEmail: string) => {
      const trimmed = newEmail.trim();
      await authService.updateEmail(trimmed);
      applyIdentityUpdate({ email: trimmed });
    },
    [applyIdentityUpdate]
  );

  const updateUsername = useCallback(
    async (newUsername: string) => {
      const trimmed = newUsername.trim();
      await authService.updateUsername(trimmed);
      applyIdentityUpdate({ userName: trimmed });
    },
    [applyIdentityUpdate]
  );

  const requestPasswordChange = useCallback(
    async (currentPassword: string) => {
      await authService.requestPasswordChange(currentPassword);
    },
    []
  );

  const confirmPasswordChange = useCallback(
    async (otpCode: string, newPassword: string, confirmNewPassword: string) => {
      await authService.confirmPasswordChange({
        otpCode,
        newPassword,
        confirmNewPassword,
      });
    },
    []
  );

  const deleteAccount = useCallback(
    async (password: string) => {
      await authService.deleteAccount(password);
      await logout();
    },
    [logout]
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
    deleteAccount,
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
