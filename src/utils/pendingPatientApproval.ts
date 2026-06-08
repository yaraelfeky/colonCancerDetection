/**
 * Utility to track locally which patients have been explicitly approved or rejected
 * by the doctor. This is needed because the backend `GET /api/Doctor/Patients`
 * immediately returns all patients who have submitted a request, even if they 
 * haven't been approved yet.
 */

const APPROVED_PATIENTS_KEY = "colonai_approved_patients";
const REJECTED_PATIENTS_KEY = "colonai_rejected_patients";

function getSetFromStorage(key: string): Set<number> {
  try {
    const data = localStorage.getItem(key);
    if (!data) return new Set();
    const arr = JSON.parse(data);
    return new Set(Array.isArray(arr) ? arr.map(Number) : []);
  } catch {
    return new Set();
  }
}

function saveSetToStorage(key: string, set: Set<number>): void {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage`, e);
  }
}

export function approvePatientId(patientId: number | string): void {
  const id = Number(patientId);
  if (Number.isNaN(id)) return;

  const approved = getSetFromStorage(APPROVED_PATIENTS_KEY);
  approved.add(id);
  saveSetToStorage(APPROVED_PATIENTS_KEY, approved);

  // If they were previously rejected, remove them from rejected
  const rejected = getSetFromStorage(REJECTED_PATIENTS_KEY);
  if (rejected.has(id)) {
    rejected.delete(id);
    saveSetToStorage(REJECTED_PATIENTS_KEY, rejected);
  }
}

export function rejectPatientId(patientId: number | string): void {
  const id = Number(patientId);
  if (Number.isNaN(id)) return;

  const rejected = getSetFromStorage(REJECTED_PATIENTS_KEY);
  rejected.add(id);
  saveSetToStorage(REJECTED_PATIENTS_KEY, rejected);

  // If they were previously approved, remove them from approved
  const approved = getSetFromStorage(APPROVED_PATIENTS_KEY);
  if (approved.has(id)) {
    approved.delete(id);
    saveSetToStorage(APPROVED_PATIENTS_KEY, approved);
  }
}

export function isPatientApproved(patientId: number | string): boolean {
  const id = Number(patientId);
  if (Number.isNaN(id)) return false;
  return getSetFromStorage(APPROVED_PATIENTS_KEY).has(id);
}

export function isPatientRejected(patientId: number | string): boolean {
  const id = Number(patientId);
  if (Number.isNaN(id)) return false;
  return getSetFromStorage(REJECTED_PATIENTS_KEY).has(id);
}

export function clearRejectedPatientId(patientId: number | string): void {
  const id = Number(patientId);
  if (Number.isNaN(id)) return;
  const rejected = getSetFromStorage(REJECTED_PATIENTS_KEY);
  if (rejected.has(id)) {
    rejected.delete(id);
    saveSetToStorage(REJECTED_PATIENTS_KEY, rejected);
  }
}
