import { useCallback, useMemo, useState } from "react";
import { scheduleService } from "../services/scheduleService";
import type { ScheduleSlot, ScheduleSlotStatus } from "../types/schedule";
import { computeScheduleStats, normalizeSlotStatus } from "../utils/scheduleUtils";

export function useScheduleManager() {
  const [allSlots, setAllSlots] = useState<ScheduleSlot[]>([]);
  const [dailySlots, setDailySlots] = useState<ScheduleSlot[]>([]);
  const [weeklySlots, setWeeklySlots] = useState<ScheduleSlot[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [loadingWeekly, setLoadingWeekly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(() => computeScheduleStats(allSlots), [allSlots]);

  const loadAll = useCallback(async () => {
    setLoadingAll(true);
    setError(null);
    try {
      const data = await scheduleService.getMySchedule();
      setAllSlots(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load schedule");
      setAllSlots([]);
    } finally {
      setLoadingAll(false);
    }
  }, []);

  const loadDaily = useCallback(async (date: string) => {
    setLoadingDaily(true);
    setError(null);
    try {
      const data = await scheduleService.getDaily(date);
      setDailySlots(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load daily schedule");
      setDailySlots([]);
    } finally {
      setLoadingDaily(false);
    }
  }, []);

  const loadWeekly = useCallback(async (weekStart: string) => {
    setLoadingWeekly(true);
    setError(null);
    try {
      const data = await scheduleService.getWeekly(weekStart);
      setWeeklySlots(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load weekly schedule");
      setWeeklySlots([]);
    } finally {
      setLoadingWeekly(false);
    }
  }, []);

  const refreshAllViews = useCallback(
    async (dailyDate: string, weekStart: string) => {
      await Promise.all([loadAll(), loadDaily(dailyDate), loadWeekly(weekStart)]);
    },
    [loadAll, loadDaily, loadWeekly]
  );

  const removeSlotLocally = useCallback((slotId: number) => {
    const filter = (list: ScheduleSlot[]) => list.filter((s) => s.id !== slotId);
    setAllSlots(filter);
    setDailySlots(filter);
    setWeeklySlots(filter);
  }, []);

  const updateSlotLocally = useCallback((slotId: number, patch: Partial<ScheduleSlot>) => {
    const map = (list: ScheduleSlot[]) =>
      list.map((s) => (s.id === slotId ? { ...s, ...patch } : s));
    setAllSlots(map);
    setDailySlots(map);
    setWeeklySlots(map);
  }, []);

  const markCompletedLocally = useCallback((slotId: number, doctorNotes: string | null) => {
    updateSlotLocally(slotId, {
      status: "Completed" as ScheduleSlotStatus,
      doctorNotes,
      completedAt: new Date().toISOString(),
    });
  }, [updateSlotLocally]);

  const deleteSlot = useCallback(
    async (slotId: number): Promise<void> => {
      const snapshot = { all: allSlots, daily: dailySlots, weekly: weeklySlots };
      removeSlotLocally(slotId);
      try {
        await scheduleService.deleteSlot(slotId);
      } catch (e) {
        setAllSlots(snapshot.all);
        setDailySlots(snapshot.daily);
        setWeeklySlots(snapshot.weekly);
        throw e;
      }
    },
    [allSlots, dailySlots, weeklySlots, removeSlotLocally]
  );

  const completeSlot = useCallback(
    async (slotId: number, doctorNotes: string | null): Promise<void> => {
      const snapshot = { all: allSlots, daily: dailySlots, weekly: weeklySlots };
      markCompletedLocally(slotId, doctorNotes);
      try {
        await scheduleService.completeSlot({ slotId, doctorNotes });
      } catch (e) {
        setAllSlots(snapshot.all);
        setDailySlots(snapshot.daily);
        setWeeklySlots(snapshot.weekly);
        throw e;
      }
    },
    [allSlots, dailySlots, weeklySlots, markCompletedLocally]
  );

  return {
    allSlots,
    dailySlots,
    weeklySlots,
    loadingAll,
    loadingDaily,
    loadingWeekly,
    error,
    setError,
    stats,
    loadAll,
    loadDaily,
    loadWeekly,
    refreshAllViews,
    deleteSlot,
    completeSlot,
    normalizeSlotStatus,
  };
}

export type UseScheduleManagerReturn = ReturnType<typeof useScheduleManager>;
