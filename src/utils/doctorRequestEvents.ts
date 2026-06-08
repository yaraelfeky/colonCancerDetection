/** Fired after a patient request is approved via DoctorResponse. */
export const DOCTOR_REQUEST_APPROVED_EVENT = "colonai-doctor-request-approved";

/** Refresh doctor patient list. */
export const PATIENT_LIST_REFRESH_EVENT = "colonai-patient-list-refresh";

/** Refresh schedule views. */
export const SCHEDULE_REFRESH_EVENT = "colonai-schedule-refresh";

/** Fired after a patient request is rejected. */
export const DOCTOR_REQUEST_REJECTED_EVENT = "colonai-doctor-request-rejected";

export function dispatchDoctorRequestApproved(): void {
  window.dispatchEvent(new Event(DOCTOR_REQUEST_APPROVED_EVENT));
  window.dispatchEvent(new Event(PATIENT_LIST_REFRESH_EVENT));
  window.dispatchEvent(new Event(SCHEDULE_REFRESH_EVENT));
}

export function dispatchDoctorRequestRejected(): void {
  window.dispatchEvent(new Event(DOCTOR_REQUEST_REJECTED_EVENT));
  window.dispatchEvent(new Event(PATIENT_LIST_REFRESH_EVENT));
}
