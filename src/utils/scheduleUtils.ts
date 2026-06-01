import type { ScheduleSlot, ScheduleSlotStatus, ScheduleStats } from "../types/schedule";

const STATUS_AVAILABLE = new Set(["available", "open", "free"]);
const STATUS_COMPLETED = new Set(["completed", "done", "finished"]);
const STATUS_BOOKED = new Set(["booked", "confirmed", "scheduled"]);

export function normalizeSlotStatus(raw: unknown): ScheduleSlotStatus {
  const value = String(raw ?? "Available").trim();
  if (!value) return "Available";
  const lower = value.toLowerCase();
  if (STATUS_COMPLETED.has(lower)) return "Completed";
  if (STATUS_BOOKED.has(lower)) return "Booked";
  if (STATUS_AVAILABLE.has(lower)) return "Available";
  if (lower === "cancelled" || lower === "canceled") return "Cancelled";
  if (lower === "pending") return "Pending";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function normalizeScheduleSlot(raw: Record<string, unknown>): ScheduleSlot | null {
  const id = Number(raw.id ?? raw.Id ?? raw.slotId ?? raw.SlotId);
  const startTime = String(raw.startTime ?? raw.StartTime ?? raw.start ?? raw.Start ?? "");
  const endTime = String(raw.endTime ?? raw.EndTime ?? raw.end ?? raw.End ?? "");
  if (!id || Number.isNaN(id) || !startTime || !endTime) return null;

  return {
    id,
    startTime,
    endTime,
    status: normalizeSlotStatus(raw.status ?? raw.Status),
    doctorNotes: (raw.doctorNotes ?? raw.DoctorNotes ?? null) as string | null,
    completedAt: (raw.completedAt ?? raw.CompletedAt ?? null) as string | null,
  };
}

export function normalizeScheduleSlots(raw: unknown): ScheduleSlot[] {
  const list = Array.isArray(raw) ? raw : [];
  return list
    .map((item) =>
      normalizeScheduleSlot(item && typeof item === "object" ? (item as Record<string, unknown>) : {})
    )
    .filter((slot): slot is ScheduleSlot => slot !== null);
}

export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function toWeekStartInputValue(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return toDateInputValue(d);
}

export function datetimeLocalToIso(value: string): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString();
}

export function slotDateKey(iso: string): string {
  try {
    return toDateInputValue(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export function formatSlotDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function formatSlotTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function formatSlotDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function computeScheduleStats(slots: ScheduleSlot[]): ScheduleStats {
  const today = toDateInputValue(new Date());
  let available = 0;
  let completed = 0;
  let todayCount = 0;

  for (const slot of slots) {
    const status = String(slot.status).toLowerCase();
    if (STATUS_AVAILABLE.has(status) || status === "available") available += 1;
    if (STATUS_COMPLETED.has(status) || status === "completed") completed += 1;
    if (slotDateKey(slot.startTime) === today) todayCount += 1;
  }

  return {
    total: slots.length,
    available,
    completed,
    today: todayCount,
  };
}

export function groupSlotsByDate(slots: ScheduleSlot[]): Map<string, ScheduleSlot[]> {
  const map = new Map<string, ScheduleSlot[]>();
  for (const slot of slots) {
    const key = slotDateKey(slot.startTime);
    const group = map.get(key) ?? [];
    group.push(slot);
    map.set(key, group);
  }
  for (const [, group] of map) {
    group.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }
  return map;
}

export function getWeekDates(weekStart: string): string[] {
  const start = new Date(weekStart);
  if (Number.isNaN(start.getTime())) return [];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return toDateInputValue(d);
  });
}

export function statusBadgeClass(status: ScheduleSlotStatus): string {
  const lower = String(status).toLowerCase();
  if (lower === "completed") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (lower === "booked" || lower === "confirmed") return "border-blue-200 bg-blue-50 text-blue-800";
  if (lower === "cancelled" || lower === "canceled") return "border-red-200 bg-red-50 text-red-800";
  if (lower === "pending") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

export function validateDateTimeRange(start: string, end: string): string | null {
  if (!start || !end) return "Start and end times are required.";
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return "Invalid date or time.";
  if (endMs <= startMs) return "End time must be after start time.";
  return null;
}
