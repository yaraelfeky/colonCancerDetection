/** POST /api/DoctorResponse */
export interface DoctorResponseCreatePayload {
  patientRequestId: string;
  message: string;
  appointmentSchedule: string[];
}

/** PUT /api/DoctorResponse/{responseId} */
export interface DoctorResponseUpdatePayload {
  message: string | null;
  appointmentSchedule: string[];
}

/** Response item returned by DoctorResponse endpoints. */
export interface DoctorResponseDto {
  id: number;
  patientRequestId?: string;
  message?: string | null;
  appointmentSchedule?: string[];
  createdAt?: string;
  updatedAt?: string;
}
