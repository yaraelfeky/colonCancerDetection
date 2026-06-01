export type ScheduleSlotStatus =
  | "Available"
  | "Booked"
  | "Completed"
  | "Cancelled"
  | "Pending"
  | string;

export interface ScheduleSlot {
  id: number;
  startTime: string;
  endTime: string;
  status: ScheduleSlotStatus;
  doctorNotes?: string | null;
  completedAt?: string | null;
}

export interface GenerateSlotsRequest {
  blockStart: string;
  blockEnd: string;
  slotDurationMinutes: number;
}

export interface CreateSlotRequest {
  startTime: string;
  endTime: string;
}

export interface CompleteSlotRequest {
  slotId: number;
  doctorNotes: string | null;
}

export interface ScheduleStats {
  total: number;
  available: number;
  completed: number;
  today: number;
}

export type ScheduleSortOrder = "newest" | "oldest";

/** GET /api/schedule/my — `data` is an object with a `slots` array, not a bare array. */
export interface MyScheduleResponseData {
  scheduleId?: number;
  doctorId?: number;
  doctorName?: string;
  slots?: unknown[];
}
