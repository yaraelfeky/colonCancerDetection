import { USE_MOCK } from "../config/mockFlags";
import { getMockPatientHistory } from "../mocks/patientHistoryMockData";
import type { PatientHistoryEvent, HistoryEventType } from "../types/patientHistory";
import { toMedicalEntryBase } from "../types/medicalRecord";
import { aiService } from "./aiService";
import { medicalRecordService, type MedicalRecordState } from "./medicalRecordService";

export type { PatientHistoryEvent, HistoryEventType } from "../types/patientHistory";

function asRecordArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
}

function pushVisit(events: PatientHistoryEvent[], row: Record<string, unknown>, idx: number): void {
  const base = toMedicalEntryBase(row);
  events.push({
    id: `visit-${String(row.id ?? idx)}`,
    date: String(row.date ?? new Date().toISOString()),
    type: "visit",
    title: `Visit — ${String(row.doctorName ?? "Doctor")}`,
    summary: `${String(row.reasonForVisit ?? "")} · Dx: ${String(row.diagnosis ?? "")}`,
    status: base?.status,
  });
}

function buildFromMedicalRecord(record: MedicalRecordState): PatientHistoryEvent[] {
  const events: PatientHistoryEvent[] = [];

  asRecordArray(record.allergies).forEach((row, i) => {
    const base = toMedicalEntryBase(row);
    events.push({
      id: `allergy-${String(row.id ?? i)}`,
      date: new Date().toISOString(),
      type: "allergy",
      title: `Allergy — ${String(row.name ?? "")}`,
      summary: `${String(row.severity ?? "")} · ${String(row.reaction ?? "")}`,
      status: base?.status,
    });
  });

  asRecordArray(record.visits).forEach((row, i) => pushVisit(events, row, i));

  asRecordArray(record.surgeries).forEach((row, i) => {
    const base = toMedicalEntryBase(row);
    events.push({
      id: `surgery-${String(row.id ?? i)}`,
      date: String(row.date ?? new Date().toISOString()),
      type: "surgery",
      title: `Surgery — ${String(row.name ?? "")}`,
      summary: String(row.outcome ?? ""),
      status: base?.status,
    });
  });

  asRecordArray(record.tests).forEach((row, i) => {
    const base = toMedicalEntryBase(row);
    events.push({
      id: `test-${String(row.id ?? i)}`,
      date: String(row.date ?? new Date().toISOString()),
      type: "test",
      title: `Test — ${String(row.name ?? "")}`,
      summary: String(row.result ?? ""),
      status: base?.status,
    });
  });

  asRecordArray(record.medications).forEach((row, i) => {
    const base = toMedicalEntryBase(row);
    events.push({
      id: `med-${String(row.id ?? i)}`,
      date: String(row.startDate ?? new Date().toISOString()),
      type: "medication",
      title: `Medication — ${String(row.name ?? "")}`,
      summary: `${String(row.dosage ?? "")} · ${String(row.frequency ?? "")}`,
      status: base?.status,
    });
  });

  asRecordArray(record.familyConditions).forEach((row, i) => {
    const base = toMedicalEntryBase(row);
    events.push({
      id: `family-${String(row.id ?? i)}`,
      date: String(row.diagnosisDate ?? new Date().toISOString()),
      type: "family",
      title: `Family — ${String(row.name ?? "")}`,
      summary: `Relative: ${String(row.relative ?? "")}`,
      status: base?.status,
    });
  });

  return events;
}

function buildFromAiHistory(
  aiItems: Awaited<ReturnType<typeof aiService.getPatientHistory>>
): PatientHistoryEvent[] {
  return aiItems
    .filter((scan) => scan.analyzedAt != null)
    .map((scan) => {
      const isCancerous = Boolean(scan.isCancerous);
      const probability = scan.probability ?? 0;
      return {
        id: `ai-${scan.imageId}`,
        date: scan.analyzedAt as string,
        type: "ai_scan" as HistoryEventType,
        title: `AI Scan — ${scan.originalFileName ?? "Image"}`,
        summary: isCancerous
          ? `Adenocarcinoma (${(probability * 100).toFixed(1)}%)`
          : `Normal (${(probability * 100).toFixed(1)}%)`,
        status: 1 as const,
      };
    });
}

export const patientHistoryService = {
  async getByPatient(patientId: number): Promise<PatientHistoryEvent[]> {
    if (USE_MOCK) {
      return getMockPatientHistory(patientId);
    }

    const [record, aiItems] = await Promise.all([
      medicalRecordService.getByPatient(patientId),
      aiService.getPatientHistory(patientId).catch(() => []),
    ]);

    const events = [...buildFromMedicalRecord(record), ...buildFromAiHistory(aiItems)];
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
};
