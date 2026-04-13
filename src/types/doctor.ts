/**
 * Doctor profile DTOs — align field names with your backend when integrating.
 * All optional fields allow a minimal profile from registration until completed.
 */

export interface DoctorEducationDto {
  id?: string;
  degree?: string;
  university?: string;
  year?: number;
}

export interface DoctorExperienceDto {
  id?: string;
  hospitalOrClinic?: string;
  years?: number;
  role?: string;
}

/** Certificates, licenses, awards, achievements (optional section) */
export interface DoctorAchievementDto {
  id?: string;
  title?: string;
  issuer?: string;
  year?: number;
  description?: string;
}

export interface DoctorScheduleSlotDto {
  id?: string;
  dayOfWeek: number;
  /** Display label e.g. "السبت" — optional if only dayOfWeek is used */
  dayName?: string;
  startTime: string;
  endTime: string;
  isAvailable?: boolean;
}

export interface DoctorReviewDto {
  id?: string;
  patientName?: string;
  rating: number;
  comment?: string;
  createdAt?: string;
  /** Shown when backend marks verified visits */
  verified?: boolean;
  /** e.g. "Follow-up", "Consultation" */
  visitType?: string;
  helpfulCount?: number;
}

export interface DoctorStatsDto {
  patientsCount?: number;
  bookingsCount?: number;
  casesCount?: number;
  /** Labels e.g. ["يناير","فبراير",...] */
  chartLabels?: string[];
  /** Values for bar/line chart */
  chartValues?: number[];
}

/** Main profile payload — GET/PATCH /api/Doctor/profile (adjust path in service) */
export interface DoctorProfileDto {
  id?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  specialty?: string;
  yearsOfExperience?: number;
  averageRating?: number;
  reviewsCount?: number;
  /** e.g. "MBBS, MD, Cardiology" */
  degrees?: string;
  clinicName?: string;
  consultationFee?: string;
  bio?: string;
  /** True when doctor filled extended profile */
  isProfileComplete?: boolean;
  education?: DoctorEducationDto[];
  experience?: DoctorExperienceDto[];
  achievements?: DoctorAchievementDto[];
  schedule?: DoctorScheduleSlotDto[];
  stats?: DoctorStatsDto;
  reviews?: DoctorReviewDto[];
}
