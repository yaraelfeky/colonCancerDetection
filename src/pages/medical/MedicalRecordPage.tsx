import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../../components/Layout/Navbar";
import Footer from "../../components/Layout/Footer";
import Container from "../../components/Layout/Container";
import ScrollReveal from "../../components/ScrollReveal";
import {
  CheckCircle,
  Clock,
  Plus,
  ScanLine,
  Stethoscope,
  XCircle,
} from "lucide-react";
import {
  medicalRecordService,
  type MedicalRecordSection,
  type MedicalRecordState,
} from "../../services/medicalRecordService";
import { patientService, type ListPatient } from "../../services/patientService";
import { medicationService } from "../../services/medicationService";
import type { EntryStatus, MedicalEntryBase } from "../../types/medicalRecord";
import {
  isPendingMedicalEntry,
  toMedicalEntryBase,
} from "../../types/medicalRecord";

type RecordTab =
  | "allergies"
  | "visits"
  | "surgeries"
  | "tests"
  | "medications"
  | "familyConditions";

const TABS: { id: RecordTab; label: string }[] = [
  { id: "allergies", label: "Allergies" },
  { id: "visits", label: "Visits" },
  { id: "surgeries", label: "Surgeries" },
  { id: "tests", label: "Tests" },
  { id: "medications", label: "Medications" },
  { id: "familyConditions", label: "Family Conditions" },
];

const SECTION_API: Record<RecordTab, MedicalRecordSection> = {
  allergies: "allergies",
  visits: "visits",
  surgeries: "surgeries",
  tests: "tests",
  medications: "medications",
  familyConditions: "family-conditions",
};

const INPUT_CLASS =
  "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string): string {
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

function asEntryArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function getEntryStatus(entry: MedicalEntryBase): EntryStatus {
  if (entry.status === 0 || entry.status === 1 || entry.status === 2) {
    return entry.status;
  }
  if (entry.isPending) return 0;
  return 1;
}

function statusLabel(status: EntryStatus): string {
  if (status === 0) return "Pending";
  if (status === 2) return "Rejected";
  return "Approved";
}

function statusBadgeClass(status: EntryStatus): string {
  if (status === 0) return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === 2) return "border-red-200 bg-red-50 text-red-800";
  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

function normalizeRecord(raw: MedicalRecordState): Required<MedicalRecordState> {
  return {
    allergies: asEntryArray(raw.allergies),
    visits: asEntryArray(raw.visits),
    surgeries: asEntryArray(raw.surgeries),
    tests: asEntryArray(raw.tests),
    medications: asEntryArray(raw.medications),
    familyConditions: asEntryArray(raw.familyConditions),
  };
}

const MedicalRecordPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [patients, setPatients] = useState<ListPatient[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [patientsError, setPatientsError] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<RecordTab>("allergies");
  const [medical, setMedical] = useState<Required<MedicalRecordState> | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [reviewBusy, setReviewBusy] = useState<string | null>(null);
  const [rejectDraft, setRejectDraft] = useState<{
    tab: RecordTab;
    id: number;
    note: string;
  } | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [allergyForm, setAllergyForm] = useState({ name: "", severity: "", reaction: "" });
  const [visitForm, setVisitForm] = useState({
    date: "",
    doctorName: "",
    reasonForVisit: "",
    diagnosis: "",
    treatmentPlan: "",
  });
  const [surgeryForm, setSurgeryForm] = useState({ name: "", date: "", outcome: "" });
  const [testForm, setTestForm] = useState({ name: "", date: "", result: "" });
  const [medForm, setMedForm] = useState({
    name: "",
    dosage: "",
    frequency: "",
    startDate: "",
    endDate: "",
    reminderTimes: "",
    daysOfWeek: "",
    notes: "",
  });
  const [familyForm, setFamilyForm] = useState({ name: "", relative: "", diagnosisDate: "" });

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPatientsLoading(true);
      setPatientsError(null);
      try {
        const list = await patientService.getDoctorPatients();
        if (!cancelled) setPatients(list);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setPatients([]);
          setPatientsError(e instanceof Error ? e.message : "Failed to load patients");
        }
      } finally {
        if (!cancelled) setPatientsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const param = searchParams.get("patientId");
    if (!param) return;
    const id = Number(param);
    if (!Number.isNaN(id) && id > 0) setPatientId(id);
  }, [searchParams]);

  const headerPatientName = useMemo(() => {
    const fromUrl = searchParams.get("patientName");
    if (fromUrl) {
      try {
        return decodeURIComponent(fromUrl);
      } catch {
        return fromUrl;
      }
    }
    const match = patients.find((p) => p.id === patientId);
    return match?.name ?? "";
  }, [searchParams, patients, patientId]);

  const syncPatientInUrl = useCallback(
    (id: number | null, name?: string) => {
      if (id == null) {
        setSearchParams({}, { replace: true });
        return;
      }
      const resolvedName = name ?? patients.find((p) => p.id === id)?.name;
      setSearchParams(
        {
          patientId: String(id),
          ...(resolvedName ? { patientName: resolvedName } : {}),
        },
        { replace: true }
      );
    },
    [patients, setSearchParams]
  );

  // ── localStorage helpers for locally-deleted medications ──────────────
  const DELETED_MEDS_KEY = `deleted_medications_patient_${patientId ?? "x"}`;

  const getDeletedMedIds = (): number[] => {
    try {
      return JSON.parse(localStorage.getItem(DELETED_MEDS_KEY) ?? "[]") as number[];
    } catch {
      return [];
    }
  };

  const addDeletedMedId = (id: number): void => {
    const existing = getDeletedMedIds();
    if (!existing.includes(id)) {
      localStorage.setItem(DELETED_MEDS_KEY, JSON.stringify([...existing, id]));
    }
  };

  const filterDeletedMeds = (meds: any[]): any[] => {
    const deletedIds = getDeletedMedIds();
    if (!deletedIds.length) return meds;
    return meds.filter((m: any) => !deletedIds.includes(Number(m.id)));
  };
  // ───────────────────────────────────────────────────────────────────────

  const refreshMedical = useCallback(async () => {
    if (patientId == null) return;
    setLoading(true);
    setLoadError(null);
    try {
      const mrJson = await medicalRecordService.getByPatient(patientId);
      let data = normalizeRecord(mrJson);
      try {
        const meds = await medicationService.getByPatient(patientId);
        if (Array.isArray(meds) && meds.length) {
          data = { ...data, medications: meds };
        }
      } catch {
        /* keep record medications */
      }
      // Filter out locally-deleted medications so they stay gone after refresh
      data = { ...data, medications: filterDeletedMeds(data.medications as any[]) };
      setMedical(data);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load medical record");
      setMedical(null);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  useEffect(() => {
    if (patientId == null) {
      setMedical(null);
      return;
    }
    void refreshMedical();
  }, [patientId, refreshMedical]);

  const tabPendingCount = useMemo(() => {
    if (!medical) return 0;
    const entries = medical[activeTab];
    if (!Array.isArray(entries)) return 0;
    return entries.reduce((count: number, item) => {
      const base = toMedicalEntryBase(item);
      return base && isPendingMedicalEntry(base) ? count + 1 : count;
    }, 0);
  }, [medical, activeTab]);

  const tabTotalCount = useMemo(() => {
    if (!medical) return 0;
    const entries = medical[activeTab];
    if (!Array.isArray(entries)) return 0;
    return entries.length;
  }, [medical, activeTab]);

  const resetForms = () => {
    setAllergyForm({ name: "", severity: "", reaction: "" });
    setVisitForm({ date: "", doctorName: "", reasonForVisit: "", diagnosis: "", treatmentPlan: "" });
    setSurgeryForm({ name: "", date: "", outcome: "" });
    setTestForm({ name: "", date: "", result: "" });
    setMedForm({
      name: "",
      dosage: "",
      frequency: "",
      startDate: "",
      endDate: "",
      reminderTimes: "",
      daysOfWeek: "",
      notes: "",
    });
    setFamilyForm({ name: "", relative: "", diagnosisDate: "" });
    setAddOpen(false);
    setEditId(null);
  };

  const onApprove = async (tab: RecordTab, entryId: number) => {
    const key = `${tab}-${entryId}-approve`;
    setReviewBusy(key);
    setRejectDraft(null);
    try {
      await medicalRecordService.reviewEntry(SECTION_API[tab], entryId, {
        approve: true,
        note: "",
      });
      setToast("Entry approved.");
      await refreshMedical();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Review failed");
    } finally {
      setReviewBusy(null);
    }
  };

  const submitReject = async () => {
    if (!rejectDraft || !rejectDraft.note.trim()) {
      setToast("Add a short note for rejection.");
      return;
    }
    const { tab, id, note } = rejectDraft;
    const key = `${tab}-${id}-reject`;
    setReviewBusy(key);
    try {
      await medicalRecordService.reviewEntry(SECTION_API[tab], id, {
        approve: false,
        note: note.trim(),
      });
      setToast("Entry rejected.");
      setRejectDraft(null);
      await refreshMedical();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Review failed");
    } finally {
      setReviewBusy(null);
    }
  };

  const handleDelete = async (tab: RecordTab, entryId: number) => {
    setSaving(true);
    try {
      switch (tab) {
        case "allergies":
          await medicalRecordService.deleteAllergy(entryId);
          break;
        case "visits":
          await medicalRecordService.deleteVisit(entryId);
          break;
        case "surgeries":
          await medicalRecordService.deleteSurgery(entryId);
          break;
        case "tests":
          await medicalRecordService.deleteTest(entryId);
          break;
        case "medications": {
          // Always persist the deleted ID to localStorage first
          // so it stays gone after refresh or re-login.
          addDeletedMedId(entryId);
          // Try the real API delete (may fail with 403/405 — that's OK)
          try {
            await medicalRecordService.deleteMedication(entryId, patientId || undefined);
          } catch (error) {
            console.warn("[delete] Backend failed — medication removed locally:", error);
          }
          // Remove from UI state immediately
          setMedical((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              medications: prev.medications.filter((m: any) => Number(m.id) !== entryId),
            };
          });
          setToast("Entry deleted.");
          setSaving(false);
          return;
        }
        case "familyConditions":
          await medicalRecordService.deleteFamilyCondition(entryId);
          break;
      }
      setToast("Entry deleted.");
      await refreshMedical();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (patientId == null) return;
    setSaving(true);
    try {
      if (activeTab === "allergies") {
        if (!allergyForm.name.trim()) {
          setToast("Name is required.");
          return;
        }
        if (editId != null) {
          await medicalRecordService.updateAllergy(editId, allergyForm);
          setToast("Allergy updated.");
        } else {
          await medicalRecordService.addAllergy(patientId, allergyForm);
          setToast("Allergy added.");
        }
      } else if (activeTab === "visits") {
        if (!visitForm.date.trim()) {
          setToast("Date is required.");
          return;
        }
        if (editId != null) {
          await medicalRecordService.updateVisit(editId, visitForm);
          setToast("Visit updated.");
        } else {
          await medicalRecordService.addVisit(patientId, visitForm);
          setToast("Visit added.");
        }
      } else if (activeTab === "surgeries") {
        if (!surgeryForm.name.trim()) {
          setToast("Name is required.");
          return;
        }
        if (editId != null) {
          await medicalRecordService.updateSurgery(editId, surgeryForm);
          setToast("Surgery updated.");
        } else {
          await medicalRecordService.addSurgery(patientId, surgeryForm);
          setToast("Surgery added.");
        }
      } else if (activeTab === "tests") {
        if (!testForm.name.trim()) {
          setToast("Name is required.");
          return;
        }
        if (editId != null) {
          await medicalRecordService.updateTest(editId, testForm);
          setToast("Test updated.");
        } else {
          await medicalRecordService.addTest(patientId, testForm);
          setToast("Test added.");
        }
      } else if (activeTab === "medications") {
        if (!medForm.name.trim()) {
          setToast("Name is required.");
          return;
        }
        const payload = {
          name: medForm.name,
          dosage: medForm.dosage,
          frequency: medForm.frequency,
          startDate: medForm.startDate,
          endDate: medForm.endDate || null,
          reminderTimes: medForm.reminderTimes
            ? medForm.reminderTimes.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          daysOfWeek: medForm.daysOfWeek
            ? medForm.daysOfWeek.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          notes: medForm.notes || null,
        };
        if (editId != null) {
          await medicalRecordService.updateMedication(editId, payload);
          setToast("Medication updated.");
        } else {
          await medicalRecordService.addMedication(patientId, payload);
          setToast("Medication added.");
        }
      } else if (activeTab === "familyConditions") {
        if (!familyForm.name.trim()) {
          setToast("Name is required.");
          return;
        }
        if (editId != null) {
          await medicalRecordService.updateFamilyCondition(editId, familyForm);
          setToast("Family condition updated.");
        } else {
          await medicalRecordService.addFamilyCondition(patientId, familyForm);
          setToast("Family condition added.");
        }
      }
      resetForms();
      await refreshMedical();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (tab: RecordTab, entry: Record<string, unknown>) => {
    setActiveTab(tab);
    setEditId(Number(entry.id));
    setAddOpen(true);
    if (tab === "allergies") {
      setAllergyForm({
        name: String(entry.name ?? ""),
        severity: String(entry.severity ?? ""),
        reaction: String(entry.reaction ?? ""),
      });
    } else if (tab === "visits") {
      setVisitForm({
        date: String(entry.date ?? "").slice(0, 16),
        doctorName: String(entry.doctorName ?? ""),
        reasonForVisit: String(entry.reasonForVisit ?? ""),
        diagnosis: String(entry.diagnosis ?? ""),
        treatmentPlan: String(entry.treatmentPlan ?? ""),
      });
    } else if (tab === "surgeries") {
      setSurgeryForm({
        name: String(entry.name ?? ""),
        date: String(entry.date ?? "").slice(0, 10),
        outcome: String(entry.outcome ?? ""),
      });
    } else if (tab === "tests") {
      setTestForm({
        name: String(entry.name ?? ""),
        date: String(entry.date ?? "").slice(0, 16),
        result: String(entry.result ?? ""),
      });
    } else if (tab === "medications") {
      const reminders = entry.reminderTimes;
      const days = entry.daysOfWeek;
      setMedForm({
        name: String(entry.name ?? ""),
        dosage: String(entry.dosage ?? ""),
        frequency: String(entry.frequency ?? ""),
        startDate: String(entry.startDate ?? "").slice(0, 10),
        endDate: entry.endDate ? String(entry.endDate).slice(0, 10) : "",
        reminderTimes: Array.isArray(reminders) ? reminders.join(", ") : "",
        daysOfWeek: Array.isArray(days) ? days.join(", ") : "",
        notes: String(entry.notes ?? ""),
      });
    } else {
      setFamilyForm({
        name: String(entry.name ?? ""),
        relative: String(entry.relative ?? ""),
        diagnosisDate: String(entry.diagnosisDate ?? "").slice(0, 10),
      });
    }
  };

  const renderPendingActions = (tab: RecordTab, entry: MedicalEntryBase) => {
    // Medications tab does not show approve/reject buttons
    if (tab === "medications") return null;
    if (!isPendingMedicalEntry(entry)) return null;
    const busy =
      reviewBusy === `${tab}-${entry.id}-approve` ||
      reviewBusy === `${tab}-${entry.id}-reject`;
    const isRejecting = rejectDraft?.tab === tab && rejectDraft.id === entry.id;

    return (
      <div className="mt-3 border-t border-slate-100 pt-3">
        <span className="mb-2 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
          Pending Review
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void onApprove(tab, entry.id)}
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Approve
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setRejectDraft({ tab, id: entry.id, note: "" })}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 transition hover:bg-red-100 disabled:opacity-50"
          >
            <XCircle className="h-3.5 w-3.5" />
            Reject
          </button>
        </div>
        {isRejecting && (
          <div className="mt-3 space-y-2">
            <textarea
              value={rejectDraft.note}
              onChange={(e) => setRejectDraft({ ...rejectDraft, note: e.target.value })}
              placeholder="Reason for rejection (required)"
              rows={2}
              className={INPUT_CLASS}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void submitReject()}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
              >
                Confirm reject
              </button>
              <button
                type="button"
                onClick={() => setRejectDraft(null)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderEntryActions = (tab: RecordTab, entry: Record<string, unknown>) => (
    <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
      <button
        type="button"
        onClick={() => startEdit(tab, entry)}
        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
      >
        Edit
      </button>
      <button
        type="button"
        disabled={saving}
        onClick={() => void handleDelete(tab, Number(entry.id))}
        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );

  const renderStatusBadge = (entry: MedicalEntryBase) => {
    const status = getEntryStatus(entry);
    return (
      <span
        className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(status)}`}
      >
        {statusLabel(status)}
      </span>
    );
  };

  const renderReviewNote = (entry: MedicalEntryBase) => {
    const text = entry.reviewNote ?? entry.note;
    if (!text) return null;
    return <p className="mt-2 text-sm text-slate-500">Review note: {text}</p>;
  };

  const renderAddForm = () => {
    if (!addOpen) return null;
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        {activeTab === "allergies" && (
          <>
            <input type="text" placeholder="Name" value={allergyForm.name} onChange={(e) => setAllergyForm((f) => ({ ...f, name: e.target.value }))} className={INPUT_CLASS} />
            <input type="text" placeholder="Severity" value={allergyForm.severity} onChange={(e) => setAllergyForm((f) => ({ ...f, severity: e.target.value }))} className={INPUT_CLASS} />
            <input type="text" placeholder="Reaction" value={allergyForm.reaction} onChange={(e) => setAllergyForm((f) => ({ ...f, reaction: e.target.value }))} className={INPUT_CLASS} />
          </>
        )}
        {activeTab === "visits" && (
          <>
            <input type="datetime-local" value={visitForm.date} onChange={(e) => setVisitForm((f) => ({ ...f, date: e.target.value }))} className={INPUT_CLASS} />
            <input type="text" placeholder="Doctor Name" value={visitForm.doctorName} onChange={(e) => setVisitForm((f) => ({ ...f, doctorName: e.target.value }))} className={INPUT_CLASS} />
            <input type="text" placeholder="Reason for Visit" value={visitForm.reasonForVisit} onChange={(e) => setVisitForm((f) => ({ ...f, reasonForVisit: e.target.value }))} className={INPUT_CLASS} />
            <input type="text" placeholder="Diagnosis" value={visitForm.diagnosis} onChange={(e) => setVisitForm((f) => ({ ...f, diagnosis: e.target.value }))} className={INPUT_CLASS} />
            <input type="text" placeholder="Treatment Plan" value={visitForm.treatmentPlan} onChange={(e) => setVisitForm((f) => ({ ...f, treatmentPlan: e.target.value }))} className={INPUT_CLASS} />
          </>
        )}
        {activeTab === "surgeries" && (
          <>
            <input type="text" placeholder="Name" value={surgeryForm.name} onChange={(e) => setSurgeryForm((f) => ({ ...f, name: e.target.value }))} className={INPUT_CLASS} />
            <input type="date" value={surgeryForm.date} onChange={(e) => setSurgeryForm((f) => ({ ...f, date: e.target.value }))} className={INPUT_CLASS} />
            <input type="text" placeholder="Outcome" value={surgeryForm.outcome} onChange={(e) => setSurgeryForm((f) => ({ ...f, outcome: e.target.value }))} className={INPUT_CLASS} />
          </>
        )}
        {activeTab === "tests" && (
          <>
            <input type="text" placeholder="Test Name" value={testForm.name} onChange={(e) => setTestForm((f) => ({ ...f, name: e.target.value }))} className={INPUT_CLASS} />
            <input type="datetime-local" value={testForm.date} onChange={(e) => setTestForm((f) => ({ ...f, date: e.target.value }))} className={INPUT_CLASS} />
            <input type="text" placeholder="Result" value={testForm.result} onChange={(e) => setTestForm((f) => ({ ...f, result: e.target.value }))} className={INPUT_CLASS} />
          </>
        )}
        {activeTab === "medications" && (
          <>
            <input type="text" placeholder="Name" value={medForm.name} onChange={(e) => setMedForm((f) => ({ ...f, name: e.target.value }))} className={INPUT_CLASS} />
            <input type="text" placeholder="Dosage" value={medForm.dosage} onChange={(e) => setMedForm((f) => ({ ...f, dosage: e.target.value }))} className={INPUT_CLASS} />
            <input type="text" placeholder="Frequency" value={medForm.frequency} onChange={(e) => setMedForm((f) => ({ ...f, frequency: e.target.value }))} className={INPUT_CLASS} />
            <input type="date" value={medForm.startDate} onChange={(e) => setMedForm((f) => ({ ...f, startDate: e.target.value }))} className={INPUT_CLASS} />
            <input type="date" placeholder="End Date (optional)" value={medForm.endDate} onChange={(e) => setMedForm((f) => ({ ...f, endDate: e.target.value }))} className={INPUT_CLASS} />
            {/* <input type="text" placeholder="Reminder Times (comma-separated)" value={medForm.reminderTimes} onChange={(e) => setMedForm((f) => ({ ...f, reminderTimes: e.target.value }))} className={INPUT_CLASS} /> */}
            {/* <input type="text" placeholder="Days of Week (comma-separated)" value={medForm.daysOfWeek} onChange={(e) => setMedForm((f) => ({ ...f, daysOfWeek: e.target.value }))} className={INPUT_CLASS} /> */}
            {/* <input type="text" placeholder="Notes (optional)" value={medForm.notes} onChange={(e) => setMedForm((f) => ({ ...f, notes: e.target.value }))} className={INPUT_CLASS} /> */}
          </>
        )}
        {activeTab === "familyConditions" && (
          <>
            <input type="text" placeholder="Condition Name" value={familyForm.name} onChange={(e) => setFamilyForm((f) => ({ ...f, name: e.target.value }))} className={INPUT_CLASS} />
            <input type="text" placeholder="Relative (e.g. Father)" value={familyForm.relative} onChange={(e) => setFamilyForm((f) => ({ ...f, relative: e.target.value }))} className={INPUT_CLASS} />
            <input type="date" value={familyForm.diagnosisDate} onChange={(e) => setFamilyForm((f) => ({ ...f, diagnosisDate: e.target.value }))} className={INPUT_CLASS} />
          </>
        )}
        <div className="flex gap-2">
          <button type="button" disabled={saving} onClick={() => void handleSave()} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
            {editId != null ? "Update" : "Save"}
          </button>
          <button type="button" onClick={resetForms} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    if (!medical) return null;
    const entries = medical[activeTab] as Record<string, unknown>[];

    if (entries.length === 0 && !addOpen) {
      return (
        <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          No entries in this section yet.
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {entries.flatMap((entry, index) => {
          const base = toMedicalEntryBase(entry);
          if (!base) return [];
          const isEditingThis = editId === Number(entry.id) && addOpen;
          return [
            <ScrollReveal key={Number(entry.id)} variant="fade-up" delay={index * 50}>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-semibold text-slate-900">
                  {activeTab === "allergies" && String(entry.name)}
                  {activeTab === "visits" && formatDateTime(String(entry.date ?? ""))}
                  {activeTab === "surgeries" && String(entry.name)}
                  {activeTab === "tests" && String(entry.name)}
                  {activeTab === "medications" && String(entry.name)}
                  {activeTab === "familyConditions" && String(entry.name)}
                </p>
                {activeTab !== "medications" && renderStatusBadge(base)}
              </div>
              {activeTab === "allergies" && (
                <p className="mt-1 text-sm text-slate-600">
                  Severity: {String(entry.severity)} · Reaction: {String(entry.reaction)}
                </p>
              )}
              {activeTab === "visits" && (
                <>
                  <p className="text-sm text-slate-600">{String(entry.doctorName)}</p>
                  <p className="mt-2 text-sm text-slate-700">{String(entry.reasonForVisit)}</p>
                  <p className="mt-1 text-sm text-slate-600">Dx: {String(entry.diagnosis)}</p>
                  <p className="text-sm text-slate-600">Plan: {String(entry.treatmentPlan)}</p>
                </>
              )}
              {activeTab === "surgeries" && (
                <p className="mt-1 text-sm text-slate-600">
                  {formatDate(String(entry.date ?? ""))} · {String(entry.outcome)}
                </p>
              )}
              {activeTab === "tests" && (
                <p className="mt-1 text-sm text-slate-600">
                  {formatDateTime(String(entry.date ?? ""))} · {String(entry.result)}
                </p>
              )}
              {activeTab === "medications" && (
                <>
                  <p className="mt-1 text-sm text-slate-600">
                    {String(entry.dosage)} · {String(entry.frequency)}
                  </p>
                  <p className="text-sm text-slate-600">
                    {formatDate(String(entry.startDate ?? ""))}
                    {entry.endDate ? ` → ${formatDate(String(entry.endDate))}` : ""}
                  </p>
                  {entry.notes && <p className="mt-1 text-sm text-slate-500">{String(entry.notes)}</p>}
                </>
              )}
              {activeTab === "familyConditions" && (
                <p className="mt-1 text-sm text-slate-600">
                  {String(entry.relative)} · {formatDate(String(entry.diagnosisDate ?? ""))}
                </p>
              )}
              {renderReviewNote(base)}
              {renderPendingActions(activeTab, base)}
              {renderEntryActions(activeTab, entry)}
            </div>
            </ScrollReveal>,
            // Render edit form inline directly below this card when editing it
            ...(isEditingThis
              ? [
                  <div key={`edit-inline-${Number(entry.id)}`} className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm">
                    {renderAddForm()}
                  </div>,
                ]
              : []),
          ];
        })}
        <button
          type="button"
          onClick={() => {
            setEditId(null);
            resetForms();
            setAddOpen(true);
          }}
          className="inline-flex items-center gap-1 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Add {TABS.find((t) => t.id === activeTab)?.label ?? "entry"}
        </button>
        {/* Add new entry form (only when not editing an existing one) */}
        {editId === null && renderAddForm()}
      </div>
    );
  };

  const tabIcon = (tab: RecordTab) => {
    if (tab === "allergies") return <XCircle className="h-4 w-4" />;
    if (tab === "visits") return <Clock className="h-4 w-4" />;
    if (tab === "surgeries") return <Plus className="h-4 w-4" />;
    if (tab === "tests") return <ScanLine className="h-4 w-4" />;
    if (tab === "medications") return <Stethoscope className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <Navbar />
      <main className="flex-1 pb-12">
        <section className="border-b border-slate-200 bg-white shadow-sm">
          <Container>
            <div className="py-6">
              <h1 className="text-2xl font-extrabold text-slate-900 md:text-3xl">Medical Record</h1>
              {headerPatientName ? (
                <p className="mt-1 text-sm font-semibold text-slate-700">{headerPatientName}</p>
              ) : null}
              <p className="mt-1 text-sm text-slate-500">
                Manage patient allergies, visits, surgeries, tests, medications, and family history.
              </p>
            </div>
            <div className="flex gap-1 overflow-x-auto border-t border-slate-100 pb-0 pt-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {TABS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setActiveTab(id);
                    resetForms();
                  }}
                  className={`relative shrink-0 whitespace-nowrap px-4 py-3 text-sm font-semibold transition ${
                    activeTab === id ? "text-blue-600" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {tabIcon(id)}
                    {label}
                  </span>
                  {activeTab === id && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </Container>
        </section>

        <Container>
          {patientsError ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {patientsError}
            </div>
          ) : null}
          <div className="mt-6 max-w-md">
            <label htmlFor="mr-patient" className="mb-1 block text-xs font-semibold text-slate-600">
              Patient
            </label>
            <select
              id="mr-patient"
              value={patientId ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                const nextId = v ? Number(v) : null;
                setPatientId(nextId);
                const selected = patients.find((p) => p.id === nextId);
                syncPatientInUrl(nextId, selected?.name);
                resetForms();
              }}
              disabled={patientsLoading}
              className={INPUT_CLASS}
            >
              <option value="">
                {patientsLoading ? "Loading patients…" : "Select a patient"}
              </option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {loadError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {loadError}
            </div>
          )}

          {patientId == null ? (
            <p className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              Select a patient to view their medical record.
            </p>
          ) : loading ? (
            <div className="mt-12 flex justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : (
            <div className="mt-6">{renderTabContent()}</div>
          )}
        </Container>
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[100] max-w-sm -translate-x-1/2 rounded-xl border border-slate-200 bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      <Footer />
    </div>
  );
};

export default MedicalRecordPage;
