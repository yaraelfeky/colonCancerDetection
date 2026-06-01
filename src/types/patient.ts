/** Raw item from GET /api/Doctor/Patients */
export interface DoctorPatientDto {
  userId: number;
  userName: string;
  email: string | null;
  imagePath: string | null;
  dateOfBirth: string | null;
  bloodType: string | null;
}

/** Normalized patient used across doctor-facing UI */
export interface ListPatient {
  id: number;
  name: string;
  email: string | null;
  imagePath: string | null;
  imageUrl: string | null;
  dateOfBirth: string | null;
  bloodType: string | null;
  age: number | null;
  /** Present in mock mode for list card display */
  gender?: string;
  lastScan: { isCancerous: boolean; analyzedAt: string } | null;
  pendingReviews: number;
}

export interface PatientDetailProfile {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  imagePath: string | null;
  imageUrl: string | null;
  dateOfBirth: string | null;
  bloodType: string | null;
  age: number | null;
  /** Present in mock mode */
  gender?: string;
  joinedAt?: string;
}
