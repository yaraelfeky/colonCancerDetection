/** Backend login request DTO - POST /api/Auth/login */
export interface LoginRequestDto {
  usernameOrEmail: string;
  password: string;
}

/** Backend register request DTO - POST /api/Auth/register */
export interface RegisterRequestDto {
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  isDoctor: boolean;
  /** Required when isDoctor is true; omit when false */
  professionalPracticeLicense?: string;
  /** Required when isDoctor is true; omit when false */
  issuingAuthority?: string;
}

/** Backend auth response - login and register */
export interface AuthResponseDto {
  success: boolean;
  message: string;
  accessToken?: string | null;
  token?: string | null;
  refreshToken?: string | null;
  accessTokenExpiration?: string | null;
  refreshTokenExpiration?: string | null;
}

/** POST /api/Auth/google-login */
export interface GoogleLoginRequestDto {
  idToken: string;
  isDoctor: boolean;
}

/** Response from POST /api/Auth/google-login */
export interface GoogleLoginResultDto extends AuthResponseDto {
  requiresRegistration?: boolean;
  isPendingApproval?: boolean;
}

/** POST /api/Auth/google-register-doctor */
export interface GoogleRegisterRequestDto {
  idToken: string;
  professionalPracticeLicense: string;
  issuingAuthority: string;
}

/** POST /api/Auth/refresh-token */
export interface RefreshTokenRequestDto {
  refreshToken: string;
}

/** PUT /api/Auth/updateMail */
export interface UpdateMailDto {
  newEmail: string;
}

/** PUT /api/Auth/updateUsername — note: capital N in UserName */
export interface UpdateUsernameDto {
  newUserName: string | null;
}

/** POST /api/auth/password/change/request */
export interface RequestPasswordChangeOtpDto {
  currentPassword: string;
}

/** POST /api/auth/password/change/confirm */
export interface ConfirmPasswordChangeDto {
  otpCode: string;
  newPassword: string;
  confirmNewPassword: string;
}

/** Generic backend result wrapper */
export interface ApiResultDto {
  success: boolean;
  message?: string | null;
}

/** POST /api/auth/password/forgot */
export interface ForgotPasswordRequestDto {
  email: string;
}

/** POST /api/auth/password/reset */
export interface ForgotPasswordResetDto {
  email: string;
  otpCode: string;
  newPassword: string;
  confirmNewPassword: string;
}

