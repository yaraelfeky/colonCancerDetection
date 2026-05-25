export type EntryStatus = 0 | 1 | 2;

export interface MedicalEntryBase {
  id: number;
  status?: EntryStatus;
  isPending?: boolean;
  reviewNote?: string | null;
  note?: string | null;
}

export function isRecordEntry(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && "id" in value;
}

export function isEntryStatus(value: unknown): value is EntryStatus {
  return value === 0 || value === 1 || value === 2;
}

export function toMedicalEntryBase(entry: unknown): MedicalEntryBase | null {
  if (!isRecordEntry(entry)) return null;
  const statusRaw = entry.status;
  return {
    id: Number(entry.id),
    status: isEntryStatus(statusRaw) ? statusRaw : undefined,
    isPending: entry.isPending === true,
    reviewNote:
      typeof entry.reviewNote === "string"
        ? entry.reviewNote
        : typeof entry.note === "string"
          ? entry.note
          : null,
    note: typeof entry.note === "string" ? entry.note : null,
  };
}

export function isPendingMedicalEntry(entry: MedicalEntryBase): boolean {
  return entry.status === 0 || entry.isPending === true;
}

const RECORD_SECTION_KEYS = [
  "allergies",
  "visits",
  "surgeries",
  "tests",
  "medications",
  "familyConditions",
] as const;

export function countPendingInMedicalRecord(
  record: Record<string, unknown> | null | undefined
): number {
  if (!record) return 0;
  let total = 0;
  for (const key of RECORD_SECTION_KEYS) {
    const arr = record[key];
    if (!Array.isArray(arr)) continue;
    for (const item of arr) {
      const base = toMedicalEntryBase(item);
      if (base && isPendingMedicalEntry(base)) total += 1;
    }
  }
  return total;
}
