import type { EntryStatus } from "./medicalRecord";

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
