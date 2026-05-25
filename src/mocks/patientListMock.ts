import { countPendingInMedicalRecord } from "../types/medicalRecord";
import { medicalRecordMockStore } from "./medicalRecordMockStore";
import { getMockAiHistoryForPatient } from "./patientHistoryMockData";
import { getMockPatients } from "./medicalRecordMockStore";

export interface MockListPatientCard {
  id: number;
  name: string;
  age: number;
  gender: string;
  lastScan: { isCancerous: boolean; analyzedAt: string } | null;
  pendingReviews: number;
}

export const DEMO_META: Record<number, { age: number; gender: string }> = {
  1: { age: 54, gender: "Male" },
  2: { age: 38, gender: "Female" },
  3: { age: 61, gender: "Male" },
  4: { age: 45, gender: "Female" },
  5: { age: 52, gender: "Female" },
  6: { age: 29, gender: "Female" },
  7: { age: 41, gender: "Male" },
};

export function buildMockPatientList(): MockListPatientCard[] {
  return getMockPatients().map((p) => {
    const record = medicalRecordMockStore.getByPatient(p.id);
    const scans = getMockAiHistoryForPatient(p.id);
    const latest = scans.length
      ? [...scans].sort(
          (a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime()
        )[0]
      : null;
    const meta = DEMO_META[p.id] ?? { age: 0, gender: "—" };
    return {
      id: p.id,
      name: p.name,
      age: meta.age,
      gender: meta.gender,
      lastScan: latest
        ? {
            isCancerous: latest.isCancerous,
            analyzedAt: latest.analyzedAt,
          }
        : null,
      pendingReviews: countPendingInMedicalRecord(record),
    };
  });
}
