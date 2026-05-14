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
}

/** POST /api/Auth/google-register */
export interface GoogleRegisterRequestDto {
  idToken: string;
  isDoctor: boolean;
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

/** PUT /api/Auth/updatePassword */
export interface UpdatePasswordDto {
  password: string;
  newPassword: string;
  confirmNewPassword: string;
}

