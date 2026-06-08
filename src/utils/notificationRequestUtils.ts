import type { NotificationDto } from "../services/notificationService";

/** Patient booking / appointment request notifications require approve/reject actions. */
export function isAppointmentRequestNotification(n: NotificationDto): boolean {
  const type = (n.type ?? "").toLowerCase();
  const title = (n.title ?? "").toLowerCase();
  const message = (n.message ?? n.body ?? "").toLowerCase();

  if (n.patientRequestId != null || n.requestId != null) {
    return (
      type.includes("appointment") ||
      type.includes("booking") ||
      title.includes("appointment") ||
      title.includes("booking") ||
      message.includes("appointment") ||
      message.includes("booking")
    );
  }

  return (
    type.includes("appointment") ||
    type.includes("booking") ||
    title.includes("appointment") ||
    title.includes("booking") ||
    message.includes("appointment request") ||
    message.includes("booked") ||
    n.appointmentId != null ||
    n.slotId != null
  );
}

/** 
 * Matches ALL patient requests, including appointments, general questions, 
 * prescriptions, and medical advice.
 */
export function isPatientRequestNotification(n: NotificationDto): boolean {
  if (isAppointmentRequestNotification(n)) return true;

  const type = (n.type ?? "").toLowerCase();
  const title = (n.title ?? "").toLowerCase();
  const message = (n.message ?? n.body ?? "").toLowerCase();

  return (
    n.patientRequestId != null ||
    n.requestId != null ||
    type.includes("request") ||
    title.includes("request") ||
    message.includes("request")
  );
}

export function extractPatientRequestId(n: NotificationDto): string | null {
  if (n.patientRequestId != null && String(n.patientRequestId).trim()) {
    return String(n.patientRequestId).trim();
  }
  if (n.requestId != null) {
    return String(n.requestId);
  }
  const text = n.message ?? n.body ?? n.title ?? "";
  const match = text.match(
    /(?:patient\s*request|request|patientRequest)\s*(?:id|#)?\s*:?\s*(\d+)/i
  );
  if (match) return match[1];
  if (n.appointmentId != null) return String(n.appointmentId);
  return null;
}

/** Build ISO schedule strings for POST /api/DoctorResponse. */
export function buildAppointmentSchedule(n: NotificationDto): string[] {
  if (Array.isArray(n.appointmentSchedule) && n.appointmentSchedule.length > 0) {
    return n.appointmentSchedule.filter(Boolean);
  }

  if (n.appointmentDate) {
    const date = n.appointmentDate.trim();
    const time = (n.appointmentTime ?? "").trim();
    if (date.includes("T")) return [date];
    if (time) {
      const normalizedTime = time.length === 5 ? `${time}:00` : time;
      return [`${date}T${normalizedTime}`];
    }
    return [date];
  }

  if (n.slotId != null) {
    return [String(n.slotId)];
  }

  return [];
}
