// ── Doctor Request Types ─────────────────────────────────────────────────────
// Aligned with the confirmed backend API contract.
// Frontend sends numeric enum values; backend returns string enum names.

/** Numeric values sent in POST / PUT payloads. */
export enum RequestType {
  Prescription = 1,
  MedicalAdvice = 2,
  TestResultsInquiry = 3,
  GeneralQuestion = 4,
}

/** Numeric values sent in POST / PUT payloads. */
export enum Importance {
  Low = 1,
  Medium = 2,
  High = 3,
}

/** Map numeric → display label (matches backend string names). */
export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  [RequestType.Prescription]: "Prescription",
  [RequestType.MedicalAdvice]: "Medical Advice",
  [RequestType.TestResultsInquiry]: "Test Results Inquiry",
  [RequestType.GeneralQuestion]: "General Question",
};

export const IMPORTANCE_LABELS: Record<Importance, string> = {
  [Importance.Low]: "Low",
  [Importance.Medium]: "Medium",
  [Importance.High]: "High",
};

// ── Response DTOs ────────────────────────────────────────────────────────────

/** Shape returned by GET /api/DoctorRequest and GET /api/DoctorRequest/{id} */
export interface DoctorRequestDto {
  id: number;
  patientId: string;
  doctorId: string;
  requestType: string;   // e.g. "Prescription", "MedicalAdvice"
  importance: string;     // e.g. "Low", "Medium", "High"
  isCompleted: boolean;
  message: string;
  subject: string;
  doctorReqestImages: unknown[];
  createdAt: string;
  updatedAt: string;
  rowVersion: number;
  isDeleted: boolean;
  // Appointment-related fields (may be present in patient requests)
  appointmentDate?: string;
  appointmentTime?: string;
  appointmentSchedule?: string[];
}

/** GET /api/DoctorRequest/{id} response wrapper */
export interface DoctorRequestDetailData {
  request: DoctorRequestDto;
  responses: DoctorRequestResponseDto[];
}

export interface DoctorRequestDetailResponse {
  success: boolean;
  data: DoctorRequestDetailData;
}

/** Individual response item inside data.responses */
export interface DoctorRequestResponseDto {
  id: number;
  message: string;
  createdAt: string;
  appointmentSchedule?: string[];
  [key: string]: unknown;
}

// ── Request Payloads ─────────────────────────────────────────────────────────

/** POST /api/DoctorRequest */
export interface DoctorRequestCreatePayload {
  patientId: string;
  doctorId: string; 
  subject: string;
  message: string;
  requestType: number;
  importance: number;
}

/** PUT /api/DoctorRequest/{id} */
export interface DoctorRequestUpdatePayload {
  patientId: string;
  subject: string;
  message: string;
  requestType: number;
  importance: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a backend string enum name to a display-friendly label. */
export function requestTypeDisplay(val: string): string {
  const map: Record<string, string> = {
    Prescription: "Prescription",
    MedicalAdvice: "Medical Advice",
    TestResultsInquiry: "Test Results Inquiry",
    GeneralQuestion: "General Question",
  };
  return map[val] ?? val;
}

export function importanceDisplay(val: string): string {
  const map: Record<string, string> = {
    Low: "Low",
    Medium: "Medium",
    High: "High",
  };
  return map[val] ?? val;
}

/** Map a backend string enum name back to the numeric value (for edit forms). */
export function requestTypeToNumeric(val: string): RequestType {
  const map: Record<string, RequestType> = {
    MedicalAdvice: RequestType.MedicalAdvice,
    Prescription: RequestType.Prescription,
    TestResultsInquiry: RequestType.TestResultsInquiry,
    GeneralQuestion: RequestType.GeneralQuestion,
  };
  return map[val] ?? RequestType.GeneralQuestion;
}

export function importanceToNumeric(val: string): Importance {
  const map: Record<string, Importance> = {
    Low: Importance.Low,
    Medium: Importance.Medium,
    High: Importance.High,
  };
  return map[val] ?? Importance.Low;
}

/** Importance badge CSS classes based on the string value from API. */
export function importanceBadgeClasses(val: string): string {
  switch (val) {
    case "High":
      return "bg-red-100 text-red-800 border-red-200";
    case "Medium":
      return "bg-amber-100 text-amber-800 border-amber-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}
