import type { MedicalRecordSection, MedicalRecordState } from "../services/medicalRecordService";
import {
  MOCK_PATIENTS,
  buildSeedMedicalRecords,
  type MockListPatient,
} from "./medicalRecordMockData";

type RecordTabKey =
  | "allergies"
  | "visits"
  | "surgeries"
  | "tests"
  | "medications"
  | "familyConditions";

const SECTION_TO_KEY: Record<MedicalRecordSection, RecordTabKey> = {
  allergies: "allergies",
  visits: "visits",
  surgeries: "surgeries",
  tests: "tests",
  medications: "medications",
  "family-conditions": "familyConditions",
};

const EMPTY_RECORD: Required<MedicalRecordState> = {
  allergies: [],
  visits: [],
  surgeries: [],
  tests: [],
  medications: [],
  familyConditions: [],
};

let store: Record<number, MedicalRecordState> = {};
let nextId = 10000;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function ensurePatient(patientId: number): Required<MedicalRecordState> {
  if (!store[patientId]) {
    store[patientId] = clone(EMPTY_RECORD);
  }
  const r = store[patientId];
  return {
    allergies: Array.isArray(r.allergies) ? [...r.allergies] : [],
    visits: Array.isArray(r.visits) ? [...r.visits] : [],
    surgeries: Array.isArray(r.surgeries) ? [...r.surgeries] : [],
    tests: Array.isArray(r.tests) ? [...r.tests] : [],
    medications: Array.isArray(r.medications) ? [...r.medications] : [],
    familyConditions: Array.isArray(r.familyConditions) ? [...r.familyConditions] : [],
  };
}

function persist(patientId: number, record: Required<MedicalRecordState>): void {
  store[patientId] = clone(record);
}

function allocId(): number {
  nextId += 1;
  return nextId;
}

export function initMedicalRecordMockStore(): void {
  store = clone(buildSeedMedicalRecords());
  nextId = 10000;
}

initMedicalRecordMockStore();

export function getMockPatients(): MockListPatient[] {
  return clone(MOCK_PATIENTS);
}

export function getMockRecordByPatient(patientId: number): MedicalRecordState {
  return clone(ensurePatient(patientId));
}

export function getMockPendingByPatient(patientId: number): MedicalRecordState {
  const record = ensurePatient(patientId);
  const pendingOnly = (arr: unknown[]) =>
    (arr as { status?: number; isPending?: boolean }[]).filter(
      (e) => e.status === 0 || e.isPending === true
    );
  return clone({
    allergies: pendingOnly(record.allergies),
    visits: pendingOnly(record.visits),
    surgeries: pendingOnly(record.surgeries),
    tests: pendingOnly(record.tests),
    medications: pendingOnly(record.medications),
    familyConditions: pendingOnly(record.familyConditions),
  });
}

function addEntry(
  patientId: number,
  key: RecordTabKey,
  payload: Record<string, unknown>
): unknown {
  const record = ensurePatient(patientId);
  const entry = {
    id: allocId(),
    status: 0,
    isPending: true,
    ...payload,
  };
  (record[key] as unknown[]).unshift(entry);
  persist(patientId, record);
  console.log("Request Payload:", payload);
  console.log("API Response:", { success: true, data: entry });
  return entry;
}

function updateEntry(
  patientId: number,
  key: RecordTabKey,
  entryId: number,
  payload: Record<string, unknown>
): unknown {
  const record = ensurePatient(patientId);
  const list = record[key] as Record<string, unknown>[];
  const idx = list.findIndex((e) => Number(e.id) === entryId);
  if (idx === -1) throw new Error("Entry not found");
  const updated = { ...list[idx], ...payload, id: entryId };
  list[idx] = updated;
  persist(patientId, record);
  console.log("Request Payload:", payload);
  console.log("API Response:", { success: true, data: updated });
  return updated;
}

function deleteEntry(patientId: number, key: RecordTabKey, entryId: number): void {
  const record = ensurePatient(patientId);
  const list = record[key] as Record<string, unknown>[];
  const next = list.filter((e) => Number(e.id) !== entryId);
  if (next.length === list.length) throw new Error("Entry not found");
  record[key] = next as never;
  persist(patientId, record);
  console.log("Request Payload:", { entryId });
  console.log("API Response:", { success: true, data: null });
}

function reviewEntry(
  section: MedicalRecordSection,
  entryId: number,
  body: { approve: boolean; note: string }
): void {
  const key = SECTION_TO_KEY[section];
  let found = false;
  for (const patientId of Object.keys(store).map(Number)) {
    const record = ensurePatient(patientId);
    const list = record[key] as Record<string, unknown>[];
    const idx = list.findIndex((e) => Number(e.id) === entryId);
    if (idx === -1) continue;
    found = true;
    list[idx] = {
      ...list[idx],
      status: body.approve ? 1 : 2,
      isPending: false,
      reviewNote: body.note || null,
    };
    persist(patientId, record);
    break;
  }
  if (!found) throw new Error("Entry not found");
  console.log("Request Payload:", body);
  console.log("API Response:", { success: true, data: null });
}

export const medicalRecordMockStore = {
  getByPatient: getMockRecordByPatient,
  getPending: getMockPendingByPatient,
  reset: initMedicalRecordMockStore,

  addAllergy: (patientId: number, payload: Record<string, unknown>) =>
    addEntry(patientId, "allergies", payload),
  addVisit: (patientId: number, payload: Record<string, unknown>) =>
    addEntry(patientId, "visits", payload),
  addSurgery: (patientId: number, payload: Record<string, unknown>) =>
    addEntry(patientId, "surgeries", payload),
  addTest: (patientId: number, payload: Record<string, unknown>) =>
    addEntry(patientId, "tests", payload),
  addMedication: (patientId: number, payload: Record<string, unknown>) =>
    addEntry(patientId, "medications", payload),
  addFamilyCondition: (patientId: number, payload: Record<string, unknown>) =>
    addEntry(patientId, "familyConditions", payload),

  updateAllergy: (entryId: number, payload: Record<string, unknown>) =>
    updateEntryById("allergies", entryId, payload),
  updateVisit: (entryId: number, payload: Record<string, unknown>) =>
    updateEntryById("visits", entryId, payload),
  updateSurgery: (entryId: number, payload: Record<string, unknown>) =>
    updateEntryById("surgeries", entryId, payload),
  updateTest: (entryId: number, payload: Record<string, unknown>) =>
    updateEntryById("tests", entryId, payload),
  updateMedication: (entryId: number, payload: Record<string, unknown>) =>
    updateEntryById("medications", entryId, payload),
  updateFamilyCondition: (entryId: number, payload: Record<string, unknown>) =>
    updateEntryById("familyConditions", entryId, payload),

  deleteAllergy: (entryId: number) => deleteEntryById("allergies", entryId),
  deleteVisit: (entryId: number) => deleteEntryById("visits", entryId),
  deleteSurgery: (entryId: number) => deleteEntryById("surgeries", entryId),
  deleteTest: (entryId: number) => deleteEntryById("tests", entryId),
  deleteMedication: (entryId: number) => deleteEntryById("medications", entryId),
  deleteFamilyCondition: (entryId: number) => deleteEntryById("familyConditions", entryId),

  reviewEntry,
};

function updateEntryById(
  key: RecordTabKey,
  entryId: number,
  payload: Record<string, unknown>
): unknown {
  for (const patientId of Object.keys(store).map(Number)) {
    const record = ensurePatient(patientId);
    const list = record[key] as Record<string, unknown>[];
    if (list.some((e) => Number(e.id) === entryId)) {
      return updateEntry(patientId, key, entryId, payload);
    }
  }
  throw new Error("Entry not found");
}

function deleteEntryById(key: RecordTabKey, entryId: number): void {
  for (const patientId of Object.keys(store).map(Number)) {
    const record = ensurePatient(patientId);
    const list = record[key] as Record<string, unknown>[];
    if (list.some((e) => Number(e.id) === entryId)) {
      deleteEntry(patientId, key, entryId);
      return;
    }
  }
  throw new Error("Entry not found");
}
