import { medicalRecordMockStore } from "./medicalRecordMockStore";
import type { EntryStatus } from "../types/medicalRecord";
import { toMedicalEntryBase } from "../types/medicalRecord";

export type HistoryEventType =
  | "visit"
  | "test"
  | "surgery"
  | "medication"
  | "allergy"
  | "family"
  | "ai_scan";

export interface PatientHistoryEvent {
  id: string;
  date: string;
  type: HistoryEventType;
  title: string;
  summary: string;
  status?: EntryStatus;
}

const AI_SCANS_BY_PATIENT: Record<
  number,
  Array<{ imageId: number; fileName: string; isCancerous: boolean; analyzedAt: string; probability: number }>
> = {
  1: [
    { imageId: 11, fileName: "scan_jan.jpg", isCancerous: true, analyzedAt: "2025-05-01T09:15:00Z", probability: 0.91 },
    { imageId: 12, fileName: "scan_mar.jpg", isCancerous: false, analyzedAt: "2025-03-22T14:00:00Z", probability: 0.18 },
  ],
  2: [
    { imageId: 21, fileName: "scan_apr.jpg", isCancerous: false, analyzedAt: "2025-04-10T14:00:00Z", probability: 0.12 },
  ],
  3: [
    { imageId: 31, fileName: "scan_feb.jpg", isCancerous: true, analyzedAt: "2025-02-18T08:00:00Z", probability: 0.76 },
  ],
  4: [
    { imageId: 41, fileName: "scan_may.jpg", isCancerous: false, analyzedAt: "2025-05-01T10:30:00Z", probability: 0.22 },
  ],
  5: [{ imageId: 51, fileName: "scan_dec.jpg", isCancerous: false, analyzedAt: "2024-12-02T09:00:00Z", probability: 0.09 }],
  6: [
    { imageId: 61, fileName: "scan_feb.jpg", isCancerous: false, analyzedAt: "2025-02-14T11:30:00Z", probability: 0.15 },
  ],
  7: [],
};

function pushVisit(events: PatientHistoryEvent[], row: Record<string, unknown>, idx: number): void {
  const base = toMedicalEntryBase(row);
  events.push({
    id: `visit-${row.id ?? idx}`,
    date: String(row.date ?? new Date().toISOString()),
    type: "visit",
    title: `Visit — ${String(row.doctorName ?? "Doctor")}`,
    summary: `${String(row.reasonForVisit ?? "")} · Dx: ${String(row.diagnosis ?? "")}`,
    status: base?.status,
  });
}

function buildFromRecord(patientId: number): PatientHistoryEvent[] {
  const record = medicalRecordMockStore.getByPatient(patientId);
  const events: PatientHistoryEvent[] = [];

  (record.allergies as Record<string, unknown>[] | undefined)?.forEach((row, i) => {
    const base = toMedicalEntryBase(row);
    events.push({
      id: `allergy-${row.id ?? i}`,
      date: new Date().toISOString(),
      type: "allergy",
      title: `Allergy — ${String(row.name ?? "")}`,
      summary: `${String(row.severity ?? "")} · ${String(row.reaction ?? "")}`,
      status: base?.status,
    });
  });

  (record.visits as Record<string, unknown>[] | undefined)?.forEach((row, i) =>
    pushVisit(events, row, i)
  );

  (record.surgeries as Record<string, unknown>[] | undefined)?.forEach((row, i) => {
    const base = toMedicalEntryBase(row);
    events.push({
      id: `surgery-${row.id ?? i}`,
      date: String(row.date ?? new Date().toISOString()),
      type: "surgery",
      title: `Surgery — ${String(row.name ?? "")}`,
      summary: String(row.outcome ?? ""),
      status: base?.status,
    });
  });

  (record.tests as Record<string, unknown>[] | undefined)?.forEach((row, i) => {
    const base = toMedicalEntryBase(row);
    events.push({
      id: `test-${row.id ?? i}`,
      date: String(row.date ?? new Date().toISOString()),
      type: "test",
      title: `Test — ${String(row.name ?? "")}`,
      summary: String(row.result ?? ""),
      status: base?.status,
    });
  });

  (record.medications as Record<string, unknown>[] | undefined)?.forEach((row, i) => {
    const base = toMedicalEntryBase(row);
    events.push({
      id: `med-${row.id ?? i}`,
      date: String(row.startDate ?? new Date().toISOString()),
      type: "medication",
      title: `Medication — ${String(row.name ?? "")}`,
      summary: `${String(row.dosage ?? "")} · ${String(row.frequency ?? "")}`,
      status: base?.status,
    });
  });

  (record.familyConditions as Record<string, unknown>[] | undefined)?.forEach((row, i) => {
    const base = toMedicalEntryBase(row);
    events.push({
      id: `family-${row.id ?? i}`,
      date: String(row.diagnosisDate ?? new Date().toISOString()),
      type: "family",
      title: `Family — ${String(row.name ?? "")}`,
      summary: `Relative: ${String(row.relative ?? "")}`,
      status: base?.status,
    });
  });

  const scans = AI_SCANS_BY_PATIENT[patientId] ?? [];
  scans.forEach((scan) => {
    events.push({
      id: `ai-${scan.imageId}`,
      date: scan.analyzedAt,
      type: "ai_scan",
      title: `AI Scan — ${scan.fileName}`,
      summary: scan.isCancerous
        ? `Adenocarcinoma (${(scan.probability * 100).toFixed(1)}%)`
        : `Normal (${(scan.probability * 100).toFixed(1)}%)`,
      status: 1,
    });
  });

  return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getMockPatientHistory(patientId: number): PatientHistoryEvent[] {
  return buildFromRecord(patientId);
}

export function getMockAiHistoryForPatient(patientId: number) {
  return (AI_SCANS_BY_PATIENT[patientId] ?? []).map((s) => ({
    imageId: s.imageId,
    originalFileName: s.fileName,
    label: s.isCancerous ? "cancerous" : "normal",
    probability: s.probability,
    isCancerous: s.isCancerous,
    analyzedAt: s.analyzedAt,
  }));
}
