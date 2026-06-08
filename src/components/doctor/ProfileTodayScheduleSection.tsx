import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";
import { scheduleService } from "../../services/scheduleService";
import type { ScheduleSlot } from "../../types/schedule";
import {
  formatSlotTime,
  statusBadgeClass,
  toDateInputValue,
} from "../../utils/scheduleUtils";

const PRIMARY = "#1E88E5";
const TEXT = "#0D1B2A";

const ProfileTodayScheduleSection: React.FC = () => {
  const navigate = useNavigate();
  const todayDate = useMemo(() => toDateInputValue(new Date()), []);
  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    []
  );

  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTodaySchedule = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await scheduleService.getDaily(todayDate);
      const sorted = [...data].sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
      setSlots(sorted);
    } catch (e) {
      setSlots([]);
      setError(
        e instanceof Error ? e.message : "Failed to load today's schedule."
      );
    } finally {
      setLoading(false);
    }
  }, [todayDate]);

  useEffect(() => {
    void loadTodaySchedule();
  }, [loadTodaySchedule]);

  return (
    <div
      className="rounded-3xl bg-white p-6 md:p-8 border border-gray-100"
      style={{ boxShadow: "0 4px 24px rgba(15,23,42,0.05)" }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h2 className="text-xl font-extrabold m-0 flex items-center gap-2" style={{ color: TEXT }}>
            <span
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(30,136,229,0.12)", color: PRIMARY }}
            >
              <Calendar className="w-5 h-5" aria-hidden />
            </span>
            Today&apos;s schedule
          </h2>
          <p className="text-sm text-gray-500 m-0 mt-2">{todayLabel}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/schedule")}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-95 shadow-md shrink-0"
          style={{
            background: `linear-gradient(135deg, ${PRIMARY}, #1565C0)`,
            boxShadow: "0 8px 24px rgba(30,136,229,0.3)",
          }}
        >
          <Calendar className="w-4 h-4" aria-hidden />
          View Full Schedule
        </button>
      </div>

      {loading && (
        <div className="space-y-3" aria-busy="true" aria-label="Loading schedule">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-14 rounded-2xl bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      )}

      {!loading && error && (
        <div
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800"
          role="alert"
        >
          <p className="font-semibold m-0">Could not load today&apos;s schedule</p>
          <p className="m-0 mt-1 text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => void loadTodaySchedule()}
            className="mt-3 text-sm font-bold underline"
            style={{ color: PRIMARY }}
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && slots.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
          <Calendar className="w-10 h-10 mx-auto text-gray-300 mb-3" aria-hidden />
          <p className="text-gray-600 font-semibold m-0">
            No appointments scheduled for today.
          </p>
        </div>
      )}

      {!loading && !error && slots.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 font-bold text-gray-700">Start</th>
                <th className="px-4 py-3 font-bold text-gray-700">End</th>
                <th className="px-4 py-3 font-bold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => (
                <tr key={slot.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                    {formatSlotTime(slot.startTime)}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                    {formatSlotTime(slot.endTime)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(slot.status)}`}
                    >
                      {slot.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProfileTodayScheduleSection;
