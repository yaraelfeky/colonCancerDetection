/** Single email contact on the doctor account. */
export interface ContactEmail {
  email: string;
  isVerified: boolean;
  isPrimary: boolean;
}

/** Single phone contact on the doctor account. */
export interface ContactPhone {
  phoneNumber: string;
  isVerified: boolean;
  isPrimary: boolean;
}

export interface ContactSummary {
  emails: ContactEmail[];
  phones: ContactPhone[];
}

export interface ContactStats {
  totalEmails: number;
  verifiedEmails: number;
  totalPhones: number;
  verifiedPhones: number;
}

export interface AddEmailRequest {
  email: string;
}

export interface VerifyEmailRequest {
  email: string;
  otpCode: string;
}

export interface EmailOnlyRequest {
  email: string;
}

export interface AddPhoneRequest {
  phoneNumber: string;
}

export interface VerifyPhoneRequest {
  phoneNumber: string;
  otpCode: string;
}

export interface PhoneOnlyRequest {
  phoneNumber: string;
}
