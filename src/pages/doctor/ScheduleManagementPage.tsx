import React, { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Layout/Navbar";
import Footer from "../../components/Layout/Footer";
import Container from "../../components/Layout/Container";
import ScrollReveal from "../../components/ScrollReveal";
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { scheduleService } from "../../services/scheduleService";
import { useScheduleManager } from "../../hooks/useScheduleManager";
import type { ScheduleSlot, ScheduleSlotStatus } from "../../types/schedule";
import {
  datetimeLocalToIso,
  formatSlotDate,
  formatSlotDateTime,
  formatSlotTime,
  getWeekDates,
  groupSlotsByDate,
  statusBadgeClass,
  toDateInputValue,
  toWeekStartInputValue,
  validateDateTimeRange,
} from "../../utils/scheduleUtils";
import { SCHEDULE_REFRESH_EVENT } from "../../utils/doctorRequestEvents";

const PRIMARY = "#0A6EBD";
const PAGE_SIZE = 10;

type MainTab = "generate" | "add" | "schedule";
type ScheduleView = "all" | "daily" | "weekly";
type ToastVariant = "success" | "error";

interface ToastState {
  message: string;
  variant: ToastVariant;
}

const INPUT_CLASS =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-[#0A6EBD] focus:outline-none focus:ring-2 focus:ring-[#0A6EBD]/30";

const CARD_CLASS =
  "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md md:p-8";

function ScheduleSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-16 animate-pulse rounded-xl bg-slate-100"
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className={`${CARD_CLASS} flex items-center gap-4`}>
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-md"
        style={{ background: accent }}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-2xl font-extrabold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function SlotActions({
  slot,
  onDelete,
  onComplete,
  disabled,
}: {
  slot: ScheduleSlot;
  onDelete: (slot: ScheduleSlot) => void;
  onComplete: (slot: ScheduleSlot) => void;
  disabled?: boolean;
}) {
  const isCompleted = String(slot.status).toLowerCase() === "completed";
  return (
    <div className="flex flex-wrap gap-2">
      {!isCompleted ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onComplete(slot)}
          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Mark as Completed
        </button>
      ) : null}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onDelete(slot)}
        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </button>
    </div>
  );
}

function SlotMobileCard({
  slot,
  onDelete,
  onComplete,
  actionBusy,
}: {
  slot: ScheduleSlot;
  onDelete: (slot: ScheduleSlot) => void;
  onComplete: (slot: ScheduleSlot) => void;
  actionBusy: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900">{formatSlotDate(slot.startTime)}</p>
          <p className="mt-1 text-sm text-slate-600">
            {formatSlotTime(slot.startTime)} – {formatSlotTime(slot.endTime)}
          </p>
        </div>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(slot.status)}`}
        >
          {slot.status}
        </span>
      </div>
      {slot.completedAt ? (
        <p className="mt-2 text-xs text-slate-500">Completed {formatSlotDateTime(slot.completedAt)}</p>
      ) : null}
      <div className="mt-3">
        <SlotActions slot={slot} onDelete={onDelete} onComplete={onComplete} disabled={actionBusy} />
      </div>
    </div>
  );
}

const ScheduleManagementPage: React.FC = () => {
  const {
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
  } = useScheduleManager();

  const [mainTab, setMainTab] = useState<MainTab>("schedule");
  const [scheduleView, setScheduleView] = useState<ScheduleView>("all");
  const [toast, setToast] = useState<ToastState | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ScheduleSlotStatus>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);

  const [dailyDate, setDailyDate] = useState(() => toDateInputValue(new Date()));
  const [weekStart, setWeekStart] = useState(() => toWeekStartInputValue(new Date()));

  const [generateForm, setGenerateForm] = useState({
    blockStart: "",
    blockEnd: "",
    slotDurationMinutes: "30",
  });
  const [generateErrors, setGenerateErrors] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);

  const [addForm, setAddForm] = useState({ startTime: "", endTime: "" });
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ScheduleSlot | null>(null);
  const [completeTarget, setCompleteTarget] = useState<ScheduleSlot | null>(null);
  const [completeNotes, setCompleteNotes] = useState("");

  const showToast = useCallback((message: string, variant: ToastVariant = "success") => {
    setToast({ message, variant });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (scheduleView === "daily") void loadDaily(dailyDate);
  }, [scheduleView, dailyDate, loadDaily]);

  useEffect(() => {
    if (scheduleView === "weekly") void loadWeekly(weekStart);
  }, [scheduleView, weekStart, loadWeekly]);

  useEffect(() => {
    const onRefresh = () => {
      void refreshAllViews(dailyDate, weekStart);
    };
    window.addEventListener(SCHEDULE_REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(SCHEDULE_REFRESH_EVENT, onRefresh);
  }, [refreshAllViews, dailyDate, weekStart]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshAllViews(dailyDate, weekStart);
      showToast("Schedule refreshed.");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Refresh failed", "error");
    } finally {
      setRefreshing(false);
    }
  }, [refreshAllViews, dailyDate, weekStart, showToast]);

  const filteredAllSlots = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = [...allSlots];
    if (q) {
      list = list.filter(
        (s) =>
          formatSlotDate(s.startTime).toLowerCase().includes(q) ||
          formatSlotTime(s.startTime).toLowerCase().includes(q) ||
          String(s.status).toLowerCase().includes(q) ||
          String(s.id).includes(q)
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((s) => String(s.status).toLowerCase() === String(statusFilter).toLowerCase());
    }
    list.sort((a, b) => {
      const ta = new Date(a.startTime).getTime();
      const tb = new Date(b.startTime).getTime();
      return sortOrder === "newest" ? tb - ta : ta - tb;
    });
    return list;
  }, [allSlots, search, statusFilter, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredAllSlots.length / PAGE_SIZE));
  const paginatedSlots = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredAllSlots.slice(start, start + PAGE_SIZE);
  }, [filteredAllSlots, page]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sortOrder]);

  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    allSlots.forEach((s) => set.add(String(s.status)));
    return Array.from(set).sort();
  }, [allSlots]);

  const validateGenerate = (): boolean => {
    const errors: Record<string, string> = {};
    const rangeErr = validateDateTimeRange(generateForm.blockStart, generateForm.blockEnd);
    if (rangeErr) errors.blockEnd = rangeErr;
    const duration = Number(generateForm.slotDurationMinutes);
    if (!generateForm.slotDurationMinutes || Number.isNaN(duration) || duration <= 0) {
      errors.slotDurationMinutes = "Duration must be greater than 0.";
    }
    setGenerateErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateGenerate()) return;
    setGenerating(true);
    try {
      await scheduleService.generateSlots({
        blockStart: datetimeLocalToIso(generateForm.blockStart),
        blockEnd: datetimeLocalToIso(generateForm.blockEnd),
        slotDurationMinutes: Number(generateForm.slotDurationMinutes),
      });
      showToast("Time slots generated successfully.");
      setGenerateForm({ blockStart: "", blockEnd: "", slotDurationMinutes: "30" });
      setMainTab("schedule");
      await refreshAllViews(dailyDate, weekStart);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Generation failed", "error");
    } finally {
      setGenerating(false);
    }
  };

  const validateAdd = (): boolean => {
    const errors: Record<string, string> = {};
    const rangeErr = validateDateTimeRange(addForm.startTime, addForm.endTime);
    if (rangeErr) errors.endTime = rangeErr;
    if (!addForm.startTime) errors.startTime = "Start time is required.";
    if (!addForm.endTime) errors.endTime = errors.endTime ?? "End time is required.";
    setAddErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAdd()) return;
    setAdding(true);
    try {
      await scheduleService.createSlot({
        startTime: datetimeLocalToIso(addForm.startTime),
        endTime: datetimeLocalToIso(addForm.endTime),
      });
      showToast("Slot added successfully.");
      setAddForm({ startTime: "", endTime: "" });
      setMainTab("schedule");
      await refreshAllViews(dailyDate, weekStart);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to add slot", "error");
    } finally {
      setAdding(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setActionBusy(true);
    try {
      await deleteSlot(deleteTarget.id);
      showToast("Slot deleted.");
      setDeleteTarget(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Delete failed", "error");
    } finally {
      setActionBusy(false);
    }
  };

  const confirmComplete = async () => {
    if (!completeTarget) return;
    setActionBusy(true);
    try {
      await completeSlot(completeTarget.id, completeNotes.trim() || null);
      showToast("Slot marked as completed.");
      setCompleteTarget(null);
      setCompleteNotes("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Complete failed", "error");
    } finally {
      setActionBusy(false);
    }
  };

  const weeklyGrouped = useMemo(() => groupSlotsByDate(weeklySlots), [weeklySlots]);
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <Navbar />

      {toast ? (
        <div
          className={`fixed bottom-6 right-6 z-[100] max-w-sm rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${
            toast.variant === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
          role="status"
        >
          {toast.message}
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Delete slot?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete this slot?
            </p>
            <p className="mt-2 text-sm font-medium text-slate-800">
              {formatSlotDateTime(deleteTarget.startTime)} – {formatSlotTime(deleteTarget.endTime)}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionBusy}
                onClick={() => void confirmDelete()}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {actionBusy ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {completeTarget ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Complete slot</h3>
            <p className="mt-1 text-sm text-slate-600">
              {formatSlotDateTime(completeTarget.startTime)} – {formatSlotTime(completeTarget.endTime)}
            </p>
            <label className="mt-4 block text-sm font-semibold text-slate-700" htmlFor="doctor-notes">
              Doctor Notes <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id="doctor-notes"
              rows={4}
              value={completeNotes}
              onChange={(e) => setCompleteNotes(e.target.value)}
              className={`${INPUT_CLASS} mt-2 resize-none`}
              placeholder="Add clinical notes about this visit…"
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setCompleteTarget(null);
                  setCompleteNotes("");
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionBusy}
                onClick={() => void confirmComplete()}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-50"
                style={{ background: PRIMARY }}
              >
                {actionBusy ? "Saving…" : "Complete Slot"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <main className="flex-1 pb-12">
        <section className="border-b border-slate-200 bg-white shadow-sm">
          <Container>
            <ScrollReveal variant="fade-up" delay={50}>
              <div className="flex flex-col gap-4 py-8 md:flex-row md:items-end md:justify-between">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 md:text-3xl">Schedule</h1>
                  <p className="mt-1 max-w-2xl text-sm text-slate-500">
                    Manage your clinical availability — generate time blocks, add manual slots, and
                    track completed visits.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleRefresh()}
                  disabled={refreshing}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#0A6EBD]/30 hover:text-[#0A6EBD] disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
            </ScrollReveal>
          </Container>
        </section>

        <Container>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Slots" value={stats.total} icon={<Calendar className="h-5 w-5" />} accent={PRIMARY} />
            <StatCard label="Available Slots" value={stats.available} icon={<Clock className="h-5 w-5" />} accent="#26A69A" />
            <StatCard label="Completed Slots" value={stats.completed} icon={<CheckCircle2 className="h-5 w-5" />} accent="#6366F1" />
            <StatCard label="Today's Slots" value={stats.today} icon={<CalendarDays className="h-5 w-5" />} accent="#F59E0B" />
          </div>

          <div className="mt-8 flex flex-wrap gap-2 border-b border-slate-200 pb-1">
            {(
              [
                ["generate", "Generate Schedule", Sparkles],
                ["add", "Add Single Schedule", Plus],
                ["schedule", "My Schedule", CalendarRange],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => setMainTab(id)}
                className={`inline-flex items-center gap-2 rounded-t-xl px-4 py-3 text-sm font-semibold transition ${
                  mainTab === id
                    ? "border border-b-white border-slate-200 bg-white text-[#0A6EBD] shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
              <button
                type="button"
                onClick={() => setError(null)}
                className="ml-3 font-semibold underline"
              >
                Dismiss
              </button>
            </div>
          ) : null}

          {mainTab === "generate" && (
            <ScrollReveal variant="fade-up" delay={80}>
              <div className={`${CARD_CLASS} mt-6`}>
                <h2 className="text-lg font-bold text-slate-900">Generate Time Schedule</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Create multiple appointment within a time block.
                </p>
                <form onSubmit={(e) => void handleGenerate(e)} className="mt-6 grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="block-start">
                      Block Start
                    </label>
                    <input
                      id="block-start"
                      type="datetime-local"
                      value={generateForm.blockStart}
                      onChange={(e) => setGenerateForm((f) => ({ ...f, blockStart: e.target.value }))}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="block-end">
                      Block End
                    </label>
                    <input
                      id="block-end"
                      type="datetime-local"
                      value={generateForm.blockEnd}
                      onChange={(e) => setGenerateForm((f) => ({ ...f, blockEnd: e.target.value }))}
                      className={INPUT_CLASS}
                    />
                    {generateErrors.blockEnd ? (
                      <p className="mt-1 text-xs text-red-600">{generateErrors.blockEnd}</p>
                    ) : null}
                  </div>
                  <div className="md:col-span-2 md:max-w-xs">
                    <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="slot-duration">
                      Slot Duration Minutes
                    </label>
                    <input
                      id="slot-duration"
                      type="number"
                      min={1}
                      value={generateForm.slotDurationMinutes}
                      onChange={(e) =>
                        setGenerateForm((f) => ({ ...f, slotDurationMinutes: e.target.value }))
                      }
                      className={INPUT_CLASS}
                    />
                    {generateErrors.slotDurationMinutes ? (
                      <p className="mt-1 text-xs text-red-600">{generateErrors.slotDurationMinutes}</p>
                    ) : null}
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={generating}
                      className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:opacity-95 disabled:opacity-50"
                      style={{ background: PRIMARY, boxShadow: "0 8px 20px rgba(10,110,189,0.28)" }}
                    >
                      {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      Generate Schedule
                    </button>
                  </div>
                </form>
              </div>
            </ScrollReveal>
          )}

          {mainTab === "add" && (
            <ScrollReveal variant="fade-up" delay={80}>
              <div className={`${CARD_CLASS} mt-6`}>
                <h2 className="text-lg font-bold text-slate-900">Create Manual Schedule</h2>
                <p className="mt-1 text-sm text-slate-500">Add a single availability window manually.</p>
                <form onSubmit={(e) => void handleAddSlot(e)} className="mt-6 grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="slot-start">
                      Start Time
                    </label>
                    <input
                      id="slot-start"
                      type="datetime-local"
                      value={addForm.startTime}
                      onChange={(e) => setAddForm((f) => ({ ...f, startTime: e.target.value }))}
                      className={INPUT_CLASS}
                    />
                    {addErrors.startTime ? (
                      <p className="mt-1 text-xs text-red-600">{addErrors.startTime}</p>
                    ) : null}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="slot-end">
                      End Time
                    </label>
                    <input
                      id="slot-end"
                      type="datetime-local"
                      value={addForm.endTime}
                      onChange={(e) => setAddForm((f) => ({ ...f, endTime: e.target.value }))}
                      className={INPUT_CLASS}
                    />
                    {addErrors.endTime ? (
                      <p className="mt-1 text-xs text-red-600">{addErrors.endTime}</p>
                    ) : null}
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={adding}
                      className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:opacity-95 disabled:opacity-50"
                      style={{ background: PRIMARY, boxShadow: "0 8px 20px rgba(10,110,189,0.28)" }}
                    >
                      {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Add Slot
                    </button>
                  </div>
                </form>
              </div>
            </ScrollReveal>
          )}

          {mainTab === "schedule" && (
            <div className="mt-6">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["all", "All Schedule"],
                    ["daily", "Daily View"],
                    ["weekly", "Weekly View"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setScheduleView(id)}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                      scheduleView === id
                        ? "border-[#0A6EBD] bg-[#0A6EBD]/10 text-[#0A6EBD]"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {scheduleView === "all" && (
                <div className={`${CARD_CLASS} mt-6`}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="relative max-w-md flex-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by date, time, status, or ID…"
                        className={`${INPUT_CLASS} pl-10`}
                      />
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800"
                      >
                        <option value="all">All statuses</option>
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800"
                      >
                        <option value="newest">Newest first</option>
                        <option value="oldest">Oldest first</option>
                      </select>
                    </div>
                  </div>

                  {loadingAll ? (
                    <div className="mt-6">
                      <ScheduleSkeleton />
                    </div>
                  ) : filteredAllSlots.length === 0 ? (
                    <div className="mt-10 flex flex-col items-center justify-center py-12 text-center">
                      <Calendar className="h-14 w-14 text-slate-300" />
                      <p className="mt-3 text-sm font-medium text-slate-600">No schedule slots found</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Generate Schedule or add a manual Schedule to get started.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="mt-6 hidden overflow-x-auto md:block">
                        <table className="w-full min-w-[640px] text-left text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              <th className="px-3 py-3">Date</th>
                              <th className="px-3 py-3">Start Time</th>
                              <th className="px-3 py-3">End Time</th>
                              <th className="px-3 py-3">Status</th>
                              <th className="px-3 py-3">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedSlots.map((slot) => (
                              <tr key={slot.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                                <td className="px-3 py-3 font-medium text-slate-900">
                                  {formatSlotDate(slot.startTime)}
                                </td>
                                <td className="px-3 py-3 text-slate-700">{formatSlotTime(slot.startTime)}</td>
                                <td className="px-3 py-3 text-slate-700">{formatSlotTime(slot.endTime)}</td>
                                <td className="px-3 py-3">
                                  <span
                                    className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(slot.status)}`}
                                  >
                                    {slot.status}
                                  </span>
                                  {slot.completedAt ? (
                                    <p className="mt-1 text-xs text-slate-500">
                                      {formatSlotDateTime(slot.completedAt)}
                                    </p>
                                  ) : null}
                                </td>
                                <td className="px-3 py-3">
                                  <SlotActions
                                    slot={slot}
                                    onDelete={setDeleteTarget}
                                    onComplete={setCompleteTarget}
                                    disabled={actionBusy}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-6 space-y-3 md:hidden">
                        {paginatedSlots.map((slot) => (
                          <SlotMobileCard
                            key={slot.id}
                            slot={slot}
                            onDelete={setDeleteTarget}
                            onComplete={setCompleteTarget}
                            actionBusy={actionBusy}
                          />
                        ))}
                      </div>

                      {totalPages > 1 ? (
                        <div className="mt-6 flex items-center justify-between text-sm">
                          <p className="text-slate-500">
                            Page {page} of {totalPages} · {filteredAllSlots.length} slots
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={page <= 1}
                              onClick={() => setPage((p) => Math.max(1, p - 1))}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40"
                            >
                              Previous
                            </button>
                            <button
                              type="button"
                              disabled={page >= totalPages}
                              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              )}

              {scheduleView === "daily" && (
                <div className={`${CARD_CLASS} mt-6`}>
                  <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="daily-date">
                    Select date
                  </label>
                  <input
                    id="daily-date"
                    type="date"
                    value={dailyDate}
                    onChange={(e) => setDailyDate(e.target.value)}
                    className={`${INPUT_CLASS} max-w-xs`}
                  />

                  {loadingDaily ? (
                    <div className="mt-6">
                      <ScheduleSkeleton rows={4} />
                    </div>
                  ) : dailySlots.length === 0 ? (
                    <div className="mt-10 flex flex-col items-center py-12 text-center">
                      <Clock className="h-12 w-12 text-slate-300" />
                      <p className="mt-3 text-sm font-medium text-slate-600">No slots for this day</p>
                    </div>
                  ) : (
                    <div className="relative mt-8 space-y-0 pl-8 before:absolute before:left-3 before:top-2 before:h-[calc(100%-1rem)] before:w-0.5 before:bg-slate-200">
                      {[...dailySlots]
                        .sort(
                          (a, b) =>
                            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
                        )
                        .map((slot, index) => (
                          <div key={slot.id} className="relative pb-8">
                            <span className="absolute -left-8 top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#0A6EBD] text-[10px] font-bold text-white shadow">
                              {index + 1}
                            </span>
                            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                  <p className="font-semibold text-slate-900">
                                    {formatSlotTime(slot.startTime)} – {formatSlotTime(slot.endTime)}
                                  </p>
                                  <span
                                    className={`mt-2 inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(slot.status)}`}
                                  >
                                    {slot.status}
                                  </span>
                                </div>
                                <SlotActions
                                  slot={slot}
                                  onDelete={setDeleteTarget}
                                  onComplete={setCompleteTarget}
                                  disabled={actionBusy}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {scheduleView === "weekly" && (
                <div className={`${CARD_CLASS} mt-6`}>
                  <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="week-start">
                    Week starting
                  </label>
                  <input
                    id="week-start"
                    type="date"
                    value={weekStart}
                    onChange={(e) => setWeekStart(toWeekStartInputValue(new Date(e.target.value)))}
                    className={`${INPUT_CLASS} max-w-xs`}
                  />

                  {loadingWeekly ? (
                    <div className="mt-6">
                      <ScheduleSkeleton rows={7} />
                    </div>
                  ) : (
                    <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-7">
                      {weekDates.map((dateKey) => {
                        const daySlots = weeklyGrouped.get(dateKey) ?? [];
                        const dayLabel = new Date(dateKey).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        });
                        const isToday = dateKey === toDateInputValue(new Date());
                        return (
                          <div
                            key={dateKey}
                            className={`min-h-[140px] rounded-xl border p-3 ${
                              isToday
                                ? "border-[#0A6EBD]/40 bg-[#0A6EBD]/[0.04]"
                                : "border-slate-200 bg-slate-50/50"
                            }`}
                          >
                            <div className="mb-2 flex items-center justify-between gap-1">
                              <p className="text-xs font-bold text-slate-800">{dayLabel}</p>
                              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 shadow-sm">
                                {daySlots.length}
                              </span>
                            </div>
                            {daySlots.length === 0 ? (
                              <p className="text-[11px] text-slate-400">No slots</p>
                            ) : (
                              <ul className="space-y-2">
                                {daySlots.slice(0, 4).map((slot) => (
                                  <li
                                    key={slot.id}
                                    className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px]"
                                  >
                                    <p className="font-semibold text-slate-800">
                                      {formatSlotTime(slot.startTime)}
                                    </p>
                                    <p className={`mt-0.5 truncate ${statusBadgeClass(slot.status)} rounded px-1 py-0.5 text-[10px]`}>
                                      {slot.status}
                                    </p>
                                  </li>
                                ))}
                                {daySlots.length > 4 ? (
                                  <li className="text-[10px] font-medium text-slate-500">
                                    +{daySlots.length - 4} more
                                  </li>
                                ) : null}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
};

export default ScheduleManagementPage;
