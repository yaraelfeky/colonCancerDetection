// /** Auth API response from POST /api/Auth/login (and register when same shape) */
// export interface AuthResponse {
//   /** Whether the operation was successful (if present) */
//   success?: boolean;
//   /** Human-readable status/message (if present) */
//   message?: string;
//   /** Primary JWT returned by the backend (preferred field) */
//   token?: string | null;
//   /** Optional legacy fields that may still be present */
//   accessToken?: string | null;
//   refreshToken?: string | null;
//   accessTokenExpiration?: string | null;
//   refreshTokenExpiration?: string | null;
// }

// export interface LoginCredentials {
//   userName: string;
//   password: string;
// }

// export interface RegisterCredentials {
//   /** Backend usually expects 'userName' in ASP.NET-style APIs */
//   userName: string;
//   email: string;
//   phoneNumber: string;
//   password: string;
//   /** Optional but sent when available to satisfy confirm-password validation */
//   confirmPassword?: string;
// }

export interface RegisterCredentials {
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  isDoctor: boolean;
  professionalPracticeLicense: string;
  issuingAuthority: string;
}

export interface LoginCredentials {
  usernameOrEmail: string;
  password: string;
}

export interface AuthResponse {
  success?: boolean;
  message?: string;
  token?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  accessTokenExpiration?: string | null;
  refreshTokenExpiration?: string | null;
}

