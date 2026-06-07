import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/Layout/Navbar";
import Footer from "../../components/Layout/Footer";
import Container from "../../components/Layout/Container";
import {
  ChevronLeft,
  Mail,
  Phone,
  Stethoscope,
  ScanLine,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Send,
  Plus,
  Search,
  Users,
  FileText,
  History,
  Trash2,
  HeartPulse,
  User,
  PlusCircle,
  Activity,
  CalendarCheck,
  Calendar,
} from "lucide-react";
import ScrollReveal from "../../components/ScrollReveal";
import { doctorRequestService } from "../../services/doctorRequestService";
import type {
  DoctorRequestDto,
  DoctorRequestDetailData,
  DoctorRequestResponseDto,
} from "../../types/doctorRequest";
import {
  RequestType,
  Importance,
  REQUEST_TYPE_LABELS,
  IMPORTANCE_LABELS,
  requestTypeDisplay,
  importanceDisplay,
  importanceBadgeClasses,
  requestTypeToNumeric,
  importanceToNumeric,
} from "../../types/doctorRequest";
import {
  patientService,
  formatBloodType,
  type ListPatient,
  type PatientDetailProfile,
} from "../../services/patientService";
import { aiService, type AiHistoryItem } from "../../services/aiService";
import { medicalRecordService, type MedicalRecordSection, type MedicalRecordState } from "../../services/medicalRecordService";
import { medicationService } from "../../services/medicationService";
import {
  normalizePrescription,
  prescriptionService,
} from "../../services/prescriptionService";
import { countPendingInMedicalRecord,
  isPendingMedicalEntry,
  toMedicalEntryBase,
} from "../../types/medicalRecord";
import { USE_MOCK } from "../../config/mockFlags";
import { appointmentService, type AppointmentDto } from "../../services/appointmentService";



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

function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}



type MedicalSection =
  | "allergies"
  | "visits"
  | "surgeries"
  | "tests"
  | "medications"
  | "familyConditions";

const SECTION_API: Record<MedicalSection, string> = {
  allergies: "allergies",
  visits: "visits",
  surgeries: "surgeries",
  tests: "tests",
  medications: "medications",
  familyConditions: "family-conditions",
};

function entryShowsPending(entry: { isPending?: boolean; status?: number }): boolean {
  const base = toMedicalEntryBase(entry);
  return base ? isPendingMedicalEntry(base) : false;
}

function formatListScanDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function normalizeMedicalRecord(raw: MedicalRecordState): Required<MedicalRecordState> {
  return {
    allergies: Array.isArray(raw.allergies) ? raw.allergies : [],
    visits: Array.isArray(raw.visits) ? raw.visits : [],
    surgeries: Array.isArray(raw.surgeries) ? raw.surgeries : [],
    tests: Array.isArray(raw.tests) ? raw.tests : [],
    medications: Array.isArray(raw.medications) ? raw.medications : [],
    familyConditions: Array.isArray(raw.familyConditions) ? raw.familyConditions : [],
  };
}

export interface PatientDetailPageProps {
  patientId: number;
  onBack?: () => void;
}

type TabId = "overview" | "medical" | "ai" | "requests" | "prescriptions" | "appointments";



export const PatientDetailPage: React.FC<PatientDetailPageProps> = ({ patientId, onBack }) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>("overview");
  const goBack = useCallback(() => {
    if (onBack) onBack();
    else navigate(-1);
  }, [onBack, navigate]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [patient, setPatient] = useState<PatientDetailProfile | null>(null);
  const [aiHistory, setAiHistory] = useState<AiHistoryItem[]>([]);
  const [medical, setMedical] = useState<Required<MedicalRecordState> | null>(null);
  const [requests, setRequests] = useState<DoctorRequestDto[]>([]);
  const [prescriptions, setPrescriptions] = useState<ReturnType<typeof normalizePrescription>[]>([]);
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);

  // ── Doctor Request CRUD state ─────────────────────────────────────────
  const [requestDetailData, setRequestDetailData] = useState<DoctorRequestDetailData | null>(null);
  const [requestDetailLoading, setRequestDetailLoading] = useState(false);
  const [editingRequest, setEditingRequest] = useState<DoctorRequestDto | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [editImportance, setEditImportance] = useState<number>(Importance.Low);
  const [editType, setEditType] = useState<number>(RequestType.GeneralQuestion);
  const [editSaving, setEditSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  // ───────────────────────────────────────────────────────────────────────

  // ── localStorage helpers for locally-deleted medications ──────────────
  const DELETED_MEDS_KEY = `deleted_medications_patient_${patientId ?? "x"}`;

  const getDeletedMedIds = useCallback((): number[] => {
    try {
      return JSON.parse(localStorage.getItem(DELETED_MEDS_KEY) ?? "[]") as number[];
    } catch {
      return [];
    }
  }, [DELETED_MEDS_KEY]);

  const filterDeletedMeds = useCallback((meds: unknown[]): unknown[] => {
    const deletedIds = getDeletedMedIds();
    if (!deletedIds.length) return meds;
    return meds.filter((m) => !deletedIds.includes(Number((m as Record<string, unknown>).id)));
  }, [getDeletedMedIds]);
  // ───────────────────────────────────────────────────────────────────────

  const [openSections, setOpenSections] = useState<Record<MedicalSection, boolean>>({
    allergies: true,
    visits: false,
    surgeries: false,
    tests: false,
    medications: false,
    familyConditions: false,
  });

  const [reviewBusy, setReviewBusy] = useState<string | null>(null);
  const [rejectDraft, setRejectDraft] = useState<{
    section: MedicalSection;
    id: number;
    note: string;
  } | null>(null);

  const [requestPanelOpen, setRequestPanelOpen] = useState(false);
  const [reqSubject, setReqSubject] = useState("");
  const [reqMessage, setReqMessage] = useState("");
  const [reqImportance, setReqImportance] = useState<number>(Importance.Low);
  const [reqType, setReqType] = useState<number>(RequestType.GeneralQuestion);
  const [reqSending, setReqSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [addSaving, setAddSaving] = useState(false);
  const [addAllergyOpen, setAddAllergyOpen] = useState(false);
  const [addAllergyForm, setAddAllergyForm] = useState({ name: "", severity: "", reaction: "" });
  const [addVisitOpen, setAddVisitOpen] = useState(false);
  const [addVisitForm, setAddVisitForm] = useState({ date: "", doctorName: "", reasonForVisit: "", diagnosis: "", treatmentPlan: "" });
  const [addSurgeryOpen, setAddSurgeryOpen] = useState(false);
  const [addSurgeryForm, setAddSurgeryForm] = useState({ name: "", date: "", outcome: "" });
  const [addTestOpen, setAddTestOpen] = useState(false);
  const [addTestForm, setAddTestForm] = useState({ name: "", date: "", result: "" });
  const [addMedOpen, setAddMedOpen] = useState(false);
  const [addMedForm, setAddMedForm] = useState({ name: "", dosage: "", frequency: "", startDate: "", endDate: "", reminderTimes: "", daysOfWeek: "", notes: "" });
  const [addFamilyOpen, setAddFamilyOpen] = useState(false);
  const [addFamilyForm, setAddFamilyForm] = useState({ name: "", relative: "", diagnosisDate: "" });

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const sortedAi = useMemo(
    () =>
      [...aiHistory].sort(
        (a, b) =>
          new Date(b.analyzedAt ?? 0).getTime() - new Date(a.analyzedAt ?? 0).getTime()
      ),
    [aiHistory]
  );

  const latestAi = sortedAi[0];

  const pendingMedicalCount = useMemo(() => {
    return countPendingInMedicalRecord(medical as Record<string, unknown>);
  }, [medical]);

  const totalAiScans = aiHistory.length;

  const lastScanLabel = useMemo(() => {
    if (!latestAi) return "—";
    return latestAi.isCancerous ? "Adenocarcinoma" : "Normal";
  }, [latestAi]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const profilePromise = patientService.getPatientDetailProfile(patientId);
      const aiPromise = aiService.getPatientHistory(patientId).catch(() => [] as AiHistoryItem[]);
      const mrPromise = medicalRecordService.getByPatient(patientId).catch(() => ({} as MedicalRecordState));
      const medsPromise = medicationService.getByPatient(patientId).catch(() => [] as unknown[]);
      const rxPromise = prescriptionService.getByPatient(patientId).catch(() => [] as import("../../services/prescriptionService").PrescriptionDto[]);
      const requestsPromise = doctorRequestService.list().then((drList) =>
        drList.filter((r) => String(r.patientId) === String(patientId))
      ).catch(() => [] as DoctorRequestDto[]);

      const [profile, aiData, mrJson, meds, rxList, requestList] = await Promise.all([
        profilePromise,
        aiPromise,
        mrPromise,
        medsPromise,
        rxPromise,
        requestsPromise,
      ]);

      // Load doctor appointments for this patient
      const allAppts = await appointmentService.getDoctorAppointments().catch(() => [] as AppointmentDto[]);
      const patientAppts = allAppts.filter(a => a.patientId === patientId || a.patientName?.toLowerCase() === profile?.name?.toLowerCase());

      if (!profile) {
        setLoadError("Patient not found in your assigned list.");
        setPatient(null);
        setMedical(null);
        setAiHistory([]);
        setRequests([]);
        return;
      }

      setPatient(profile);
      setAiHistory(aiData);

      let medicalData = normalizeMedicalRecord(mrJson ?? {});
      if (Array.isArray(meds) && meds.length) {
        medicalData = { ...medicalData, medications: filterDeletedMeds(meds) };
      }
      setMedical(medicalData);
      setPrescriptions(rxList.map(normalizePrescription));
      setRequests(requestList);
      setAppointments(patientAppts);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load patient");
      setPatient(null);
      setMedical(null);
      setAiHistory([]);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [patientId, filterDeletedMeds]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const toggleSection = (s: MedicalSection) => {
    setOpenSections((prev) => ({ ...prev, [s]: !prev[s] }));
  };

  const patchReview = async (
    section: MedicalSection,
    entryId: number,
    body: { approve: boolean; note: string | null }
  ) => {
    if (USE_MOCK) {
      setMedical((prev) => {
        if (!prev) return prev;
        const list = [...(prev[section] as { id: number; isPending?: boolean; status?: number }[])];
        const idx = list.findIndex((x) => x.id === entryId);
        if (idx === -1) return prev;
        list[idx] = { ...list[idx], isPending: false, status: body.approve ? 1 : 2 };
        return { ...prev, [section]: list };
      });
      setToast(body.approve ? "Entry approved." : "Entry rejected.");
      return;
    }

    const path = SECTION_API[section];
    const key = `${section}-${entryId}-${body.approve}`;
    setReviewBusy(key);
    try {
      await medicalRecordService.reviewEntry(path as MedicalRecordSection, entryId, {
        approve: body.approve,
        note: body.note ?? "",
      });
      setMedical((prev) => {
        if (!prev) return prev;
        const arr = [...(prev[section] as any[])];
        const i = arr.findIndex((x) => x.id === entryId);
        if (i === -1) return prev;
        arr[i] = {
          ...arr[i],
          isPending: false,
          status: body.approve ? 1 : 2,
        };
        return { ...prev, [section]: arr };
      });
      setToast(body.approve ? "Entry approved." : "Entry rejected.");
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Review failed");
    } finally {
      setReviewBusy(null);
    }
  };

  const onApprove = (section: MedicalSection, entryId: number) => {
    void patchReview(section, entryId, { approve: true, note: null });
    setRejectDraft(null);
  };

  const startReject = (section: MedicalSection, id: number) => {
    setRejectDraft({ section, id, note: "" });
  };

  const cancelReject = () => setRejectDraft(null);

  const submitReject = () => {
    if (!rejectDraft || !rejectDraft.note.trim()) {
      setToast("Add a short note for rejection.");
      return;
    }
    void patchReview(rejectDraft.section, rejectDraft.id, {
      approve: false,
      note: rejectDraft.note.trim(),
    });
    setRejectDraft(null);
  };
  
  const sendDoctorRequest = async () => {
    if (!reqSubject.trim() || !reqMessage.trim()) {
      setToast("Subject and message are required.");
      return;
    }

    setReqSending(true);
    try {
      const created = await doctorRequestService.create({
        patientId: String(patientId),
        doctorId: "25",
        subject: reqSubject.trim(),
        message: reqMessage.trim(),
        requestType: reqType,
        importance: reqImportance,
      });

      setRequests((prev) => [created, ...prev]);
      setReqSubject("");
      setReqMessage("");
      setReqImportance(Importance.Low);
      setReqType(RequestType.GeneralQuestion);
      setRequestPanelOpen(false);
      setToast("Request sent.");
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Send failed");
    } finally {
      setReqSending(false);
    }
  };

  // ── Detail view ────────────────────────────────────────────────────────
  const viewRequestDetail = async (id: number) => {
    setRequestDetailLoading(true);
    setRequestDetailData(null);
    try {
      const detail = await doctorRequestService.getById(id);
      setRequestDetailData(detail);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to load request details");
    } finally {
      setRequestDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setRequestDetailData(null);
  };

  // ── Edit ────────────────────────────────────────────────────────────────
  const startEditRequest = (r: DoctorRequestDto) => {
    setEditingRequest(r);
    setEditSubject(r.subject);
    setEditMessage(r.message);
    setEditImportance(importanceToNumeric(r.importance));
    setEditType(requestTypeToNumeric(r.requestType));
  };

  const cancelEdit = () => {
    setEditingRequest(null);
  };

  const submitEditRequest = async () => {
    if (!editingRequest) return;
    if (!editSubject.trim() || !editMessage.trim()) {
      setToast("Subject and message are required.");
      return;
    }
    setEditSaving(true);
    try {
      const updated = await doctorRequestService.update(editingRequest.id, {
        patientId: String(patientId),
        subject: editSubject.trim(),
        message: editMessage.trim(),
        requestType: editType,
        importance: editImportance,
      });
      setRequests((prev) =>
        prev.map((r) => (r.id === editingRequest.id ? updated : r))
      );
      setEditingRequest(null);
      setToast("Request updated.");
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Update failed");
    } finally {
      setEditSaving(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────
  const confirmDeleteRequest = async () => {
    if (deleteConfirmId === null) return;
    setDeleteLoading(true);
    try {
      await doctorRequestService.remove(deleteConfirmId);
      setRequests((prev) => prev.filter((r) => r.id !== deleteConfirmId));
      setDeleteConfirmId(null);
      setToast("Request deleted.");
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  const refreshMedical = useCallback(async () => {
    try {
      const mrJson = await medicalRecordService.getByPatient(patientId);
      const meds = await medicationService.getByPatient(patientId).catch(() => [] as unknown[]);
      let medicalData = normalizeMedicalRecord(mrJson);
      if (Array.isArray(meds) && meds.length) {
        medicalData = { ...medicalData, medications: filterDeletedMeds(meds) };
      }
      setMedical(medicalData);
    } catch (e) {
      console.error("[refreshMedical] Error:", e);
    }
  }, [patientId, filterDeletedMeds]);

  const submitAddAllergy = async () => {
    if (!addAllergyForm.name.trim()) { setToast("Name is required."); return; }
    setAddSaving(true);
    try {
      await medicalRecordService.addAllergy(patientId, addAllergyForm);
      await refreshMedical();
      setAddAllergyForm({ name: "", severity: "", reaction: "" });
      setAddAllergyOpen(false);
      setToast("Allergy added.");
    } catch (e: any) { console.error(e); setToast(e?.message || "Failed to add allergy."); }
    finally { setAddSaving(false); }
  };

  const submitAddVisit = async () => {
    if (!addVisitForm.date.trim()) { setToast("Date is required."); return; }
    setAddSaving(true);
    try {
      await medicalRecordService.addVisit(patientId, addVisitForm);
      await refreshMedical();
      setAddVisitForm({ date: "", doctorName: "", reasonForVisit: "", diagnosis: "", treatmentPlan: "" });
      setAddVisitOpen(false);
      setToast("Visit added.");
    } catch (e: any) { console.error(e); setToast(e?.message || "Failed to add visit."); }
    finally { setAddSaving(false); }
  };

  const submitAddSurgery = async () => {
    if (!addSurgeryForm.name.trim()) { setToast("Name is required."); return; }
    setAddSaving(true);
    try {
      await medicalRecordService.addSurgery(patientId, addSurgeryForm);
      await refreshMedical();
      setAddSurgeryForm({ name: "", date: "", outcome: "" });
      setAddSurgeryOpen(false);
      setToast("Surgery added.");
    } catch (e: any) { console.error(e); setToast(e?.message || "Failed to add surgery."); }
    finally { setAddSaving(false); }
  };

  const submitAddTest = async () => {
    if (!addTestForm.name.trim()) { setToast("Name is required."); return; }
    setAddSaving(true);
    try {
      await medicalRecordService.addTest(patientId, addTestForm);
      await refreshMedical();
      setAddTestForm({ name: "", date: "", result: "" });
      setAddTestOpen(false);
      setToast("Test added.");
    } catch (e: any) { console.error(e); setToast(e?.message || "Failed to add test."); }
    finally { setAddSaving(false); }
  };

  const submitAddMedication = async () => {
    if (!addMedForm.name.trim()) { setToast("Name is required."); return; }
    setAddSaving(true);
    try {
      const payload = {
        name: addMedForm.name,
        dosage: addMedForm.dosage,
        frequency: addMedForm.frequency,
        startDate: addMedForm.startDate,
        endDate: addMedForm.endDate || null,
        reminderTimes: addMedForm.reminderTimes ? addMedForm.reminderTimes.split(",").map(s => s.trim()).filter(Boolean) : [],
        daysOfWeek: addMedForm.daysOfWeek ? addMedForm.daysOfWeek.split(",").map(s => s.trim()).filter(Boolean) : [],
        notes: addMedForm.notes || null,
      };
      await medicalRecordService.addMedication(patientId, payload);
      await refreshMedical();
      setAddMedForm({ name: "", dosage: "", frequency: "", startDate: "", endDate: "", reminderTimes: "", daysOfWeek: "", notes: "" });
      setAddMedOpen(false);
      setToast("Medication added.");
    } catch (e: any) { console.error(e); setToast(e?.message || "Failed to add medication."); }
    finally { setAddSaving(false); }
  };

  const submitAddFamily = async () => {
    if (!addFamilyForm.name.trim()) { setToast("Name is required."); return; }
    setAddSaving(true);
    try {
      await medicalRecordService.addFamilyCondition(patientId, addFamilyForm);
      await refreshMedical();
      setAddFamilyForm({ name: "", relative: "", diagnosisDate: "" });
      setAddFamilyOpen(false);
      setToast("Family condition added.");
    } catch (e: any) { console.error(e); setToast(e?.message || "Failed to add family condition."); }
    finally { setAddSaving(false); }
  };

  const renderPendingActions = (section: MedicalSection, id: number, isPending: boolean) => {
    // Medications section does not show approve/reject buttons
    if (section === "medications") return null;
    if (!isPending) return null;
    const busyKey = `${section}-${id}-`;
    const busy = reviewBusy === `${busyKey}true` || reviewBusy === `${busyKey}false`;
    const isRejecting = rejectDraft?.section === section && rejectDraft.id === id;

    return (
      <div className="mt-3 border-t border-slate-100 pt-3">
        <span className="mb-2 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
          Pending Review
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => onApprove(section, id)}
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Approve
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => startReject(section, id)}
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
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={submitReject}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
              >
                Confirm reject
              </button>
              <button
                type="button"
                onClick={cancelReject}
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

  const sectionHeader = (
    section: MedicalSection,
    title: string,
    icon: React.ReactNode,
    count: number
  ) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:bg-slate-50"
    >
      <span className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">{icon}</span>
        <span className="font-semibold text-slate-800">{title}</span>
        <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
          {count}
        </span>
      </span>
      {openSections[section] ? (
        <ChevronUp className="h-5 w-5 shrink-0 text-slate-400" />
      ) : (
        <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" />
      )}
    </button>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-100">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-100">
        <Navbar />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
          <p className="text-center text-slate-600">{loadError ?? "Patient not found."}</p>
          <button
            type="button"
            onClick={goBack}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Go back
          </button>
        </main>
        <Footer />
      </div>
    );
  }
  

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <Navbar />
      <main className="flex-1 pb-12">
        <section className="border-b border-slate-200 bg-white shadow-sm">
          <Container>
            <div className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <button
                  type="button"
                  onClick={goBack}
                  className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                  aria-label="Back"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-blue-200 bg-blue-50 text-lg font-bold text-blue-700 overflow-hidden">
                  {patient.imageUrl ? (
                    <img src={patient.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials(patient.name)
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-2xl font-extrabold text-slate-900 md:text-3xl">{patient.name}</h1>
                  <p className="mt-1 text-sm text-slate-500">
                    {patient.gender
                      ? `${patient.age ?? "—"} · ${patient.gender}${patient.joinedAt ? ` · Joined ${formatDate(patient.joinedAt)}` : ""}`
                      : `${patient.age != null ? `${patient.age} yrs` : "—"} · Blood type ${formatBloodType(patient.bloodType)}${patient.dateOfBirth ? ` · DOB ${formatDate(patient.dateOfBirth)}` : ""}`}
                  </p>
                </div>
              </div>
              <Link
                to="/diagnosis"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-blue-700 md:w-auto"
              >
                <Stethoscope className="h-4 w-4" />
                New Diagnosis
              </Link>
            </div>

            <div className="flex gap-1 overflow-x-auto border-t border-slate-100 pb-0 pt-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {(
                [
                  ["overview", "Overview"],
                  ["medical", "Medical Record"],
                  ["ai", "AI History"],
                  ["requests", "Requests"],
                  ["prescriptions", "Prescriptions"],
                  ["appointments", "Appointments"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`relative shrink-0 whitespace-nowrap px-4 py-3 text-sm font-semibold transition ${
                    tab === id ? "text-blue-600" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {label}
                    {id === "medical" && pendingMedicalCount > 0 && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                        {pendingMedicalCount}
                      </span>
                    )}
                  </span>
                  {tab === id && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </Container>
        </section>

        <Container>
          {loadError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</div>
          )}

          {tab === "overview" && (
            <div className="mt-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Contact</h2>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3 text-slate-700">
                      <Mail className="h-5 w-5 shrink-0 text-blue-600" />
                      <span className="truncate text-sm">{patient.email ?? "—"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-700">
                      <Phone className="h-5 w-5 shrink-0 text-blue-600" />
                      <span className="text-sm">{patient.phone ?? "—"}</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Quick stats</h2>
                  <ul className="mt-4 space-y-3 text-sm text-slate-700">
                    <li className="flex justify-between gap-2">
                      <span className="text-slate-500">Total AI scans</span>
                      <span className="font-bold text-slate-900">{totalAiScans}</span>
                    </li>
                    <li className="flex justify-between gap-2">
                      <span className="text-slate-500">Last scan result</span>
                      <span className="font-bold text-slate-900">{lastScanLabel}</span>
                    </li>
                    <li className="flex justify-between gap-2">
                      <span className="text-slate-500">Pending reviews</span>
                      <span className="font-bold text-amber-700">{pendingMedicalCount}</span>
                    </li>
                  </ul>
                </div>
              </div>

              {latestAi && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900">Latest AI scan</h2>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        latestAi.isCancerous
                          ? "border-red-200 bg-red-50 text-red-800"
                          : "border-emerald-200 bg-emerald-50 text-emerald-800"
                      }`}
                    >
                      {latestAi.isCancerous ? "Adenocarcinoma" : "Normal"}
                    </span>
                    <span className="text-xs text-slate-500">
                      {latestAi.analyzedAt ? formatDate(latestAi.analyzedAt) : "—"}
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs font-medium text-slate-600">
                      <span>Confidence</span>
                      <span>{((latestAi.probability ?? 0) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all ${
                          latestAi.isCancerous ? "bg-red-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${(latestAi.probability ?? 0) * 100}%` }}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTab("ai")}
                    className="mt-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                  >
                    View all scans
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === "medical" && medical && (
            <div className="mt-6 space-y-3">
              <div className="space-y-2">
                {sectionHeader("allergies", "Allergies", <XCircle className="h-4 w-4" />, medical.allergies.length)}
                {openSections.allergies && (
                  <div className="space-y-2 pl-0 md:pl-2">
                    {medical.allergies.map((a: any) => (
                      <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="font-semibold text-slate-900">{a.name}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          Severity: {a.severity} · Reaction: {a.reaction}
                        </p>
                        {renderPendingActions("allergies", a.id, entryShowsPending(a))}
                      </div>
                    ))}
                    <button type="button" onClick={() => setAddAllergyOpen(o => !o)} className="inline-flex items-center gap-1 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"><Plus className="h-3.5 w-3.5" />Add Allergy</button>
                    {addAllergyOpen && (
                      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                        <input type="text" placeholder="Name" value={addAllergyForm.name} onChange={e => setAddAllergyForm(f => ({...f, name: e.target.value}))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                        <input type="text" placeholder="Severity" value={addAllergyForm.severity} onChange={e => setAddAllergyForm(f => ({...f, severity: e.target.value}))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                        <input type="text" placeholder="Reaction" value={addAllergyForm.reaction} onChange={e => setAddAllergyForm(f => ({...f, reaction: e.target.value}))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                        <div className="flex gap-2"><button type="button" disabled={addSaving} onClick={() => void submitAddAllergy()} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">Save</button><button type="button" onClick={() => { setAddAllergyOpen(false); setAddAllergyForm({ name: '', severity: '', reaction: '' }); }} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button></div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {sectionHeader("visits", "Visits", <Clock className="h-4 w-4" />, medical.visits.length)}
                {openSections.visits && (
                  <div className="space-y-2 md:pl-2">
                    {medical.visits.map((v: any) => (
                      <div key={v.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="font-semibold text-slate-900">{formatDateTime(v.date)}</p>
                        <p className="text-sm text-slate-600">{v.doctorName}</p>
                        <p className="mt-2 text-sm text-slate-700">{v.reasonForVisit}</p>
                        <p className="mt-1 text-sm text-slate-600">Dx: {v.diagnosis}</p>
                        <p className="text-sm text-slate-600">Plan: {v.treatmentPlan}</p>
                        {renderPendingActions("visits", v.id, entryShowsPending(v))}
                      </div>
                    ))}
                    <button type="button" onClick={() => setAddVisitOpen(o => !o)} className="inline-flex items-center gap-1 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"><Plus className="h-3.5 w-3.5" />Add Visit</button>
                    {addVisitOpen && (
                      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                        <input type="datetime-local" placeholder="Date" value={addVisitForm.date} onChange={e => setAddVisitForm(f => ({...f, date: e.target.value}))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                        <input type="text" placeholder="Doctor Name" value={addVisitForm.doctorName} onChange={e => setAddVisitForm(f => ({...f, doctorName: e.target.value}))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                        <input type="text" placeholder="Reason for Visit" value={addVisitForm.reasonForVisit} onChange={e => setAddVisitForm(f => ({...f, reasonForVisit: e.target.value}))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                        <input type="text" placeholder="Diagnosis" value={addVisitForm.diagnosis} onChange={e => setAddVisitForm(f => ({...f, diagnosis: e.target.value}))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                        <input type="text" placeholder="Treatment Plan" value={addVisitForm.treatmentPlan} onChange={e => setAddVisitForm(f => ({...f, treatmentPlan: e.target.value}))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                        <div className="flex gap-2"><button type="button" disabled={addSaving} onClick={() => void submitAddVisit()} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">Save</button><button type="button" onClick={() => { setAddVisitOpen(false); setAddVisitForm({ date: '', doctorName: '', reasonForVisit: '', diagnosis: '', treatmentPlan: '' }); }} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button></div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {sectionHeader("surgeries", "Surgeries", <Plus className="h-4 w-4" />, medical.surgeries.length)}
                {openSections.surgeries && (
                  <div className="space-y-2 md:pl-2">
                    {medical.surgeries.map((s: any) => (
                      <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="font-semibold text-slate-900">{s.name}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {formatDate(s.date)} · {s.outcome}
                        </p>
                        {renderPendingActions("surgeries", s.id, entryShowsPending(s))}
                      </div>
                    ))}
                    <button type="button" onClick={() => setAddSurgeryOpen(o => !o)} className="inline-flex items-center gap-1 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"><Plus className="h-3.5 w-3.5" />Add Surgery</button>
                    {addSurgeryOpen && (
                      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                        <input type="text" placeholder="Name" value={addSurgeryForm.name} onChange={e => setAddSurgeryForm(f => ({...f, name: e.target.value}))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                        <input type="date" placeholder="Date" value={addSurgeryForm.date} onChange={e => setAddSurgeryForm(f => ({...f, date: e.target.value}))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                        <input type="text" placeholder="Outcome" value={addSurgeryForm.outcome} onChange={e => setAddSurgeryForm(f => ({...f, outcome: e.target.value}))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                        <div className="flex gap-2"><button type="button" disabled={addSaving} onClick={() => void submitAddSurgery()} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">Save</button><button type="button" onClick={() => { setAddSurgeryOpen(false); setAddSurgeryForm({ name: '', date: '', outcome: '' }); }} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button></div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {sectionHeader("tests", "Tests", <ScanLine className="h-4 w-4" />, medical.tests.length)}
                {openSections.tests && (
                  <div className="space-y-2 md:pl-2">
                    {medical.tests.map((t: any) => (
                      <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="font-semibold text-slate-900">{t.name}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {formatDateTime(t.date)} · {t.result}
                        </p>
                        {renderPendingActions("tests", t.id, entryShowsPending(t))}
                      </div>
                    ))}
                    <button type="button" onClick={() => setAddTestOpen(o => !o)} className="inline-flex items-center gap-1 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"><Plus className="h-3.5 w-3.5" />Add Test</button>
                    {addTestOpen && (
                      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                        <input type="text" placeholder="Test Name" value={addTestForm.name} onChange={e => setAddTestForm(f => ({...f, name: e.target.value}))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                        <input type="datetime-local" placeholder="Date" value={addTestForm.date} onChange={e => setAddTestForm(f => ({...f, date: e.target.value}))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                        <input type="text" placeholder="Result" value={addTestForm.result} onChange={e => setAddTestForm(f => ({...f, result: e.target.value}))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                        <div className="flex gap-2"><button type="button" disabled={addSaving} onClick={() => void submitAddTest()} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">Save</button><button type="button" onClick={() => { setAddTestOpen(false); setAddTestForm({ name: '', date: '', result: '' }); }} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button></div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {sectionHeader(
                  "medications",
                  "Medications",
                  <Stethoscope className="h-4 w-4" />,
                  medical.medications.length
                )}
                {openSections.medications && (
                  <div className="space-y-2 md:pl-2">
                    {medical.medications.map((m: any) => (
                      <div key={m.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="font-semibold text-slate-900">{m.name}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {m.dosage} · {m.frequency}
                        </p>
                        <p className="text-sm text-slate-600">
                          {formatDate(m.startDate)}
                          {m.endDate ? ` → ${formatDate(m.endDate)}` : ""}
                        </p>
                        {m.notes && <p className="mt-1 text-sm text-slate-500">{m.notes}</p>}
                        {renderPendingActions("medications", m.id, entryShowsPending(m))}
                      </div>
                    ))}
                    <button type="button" onClick={() => setAddMedOpen(o => !o)} className="inline-flex items-center gap-1 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"><Plus className="h-3.5 w-3.5" />Add Medication</button>
                    {addMedOpen && (
                      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                        <input type="text" placeholder="Name" value={addMedForm.name} onChange={e => setAddMedForm(f => ({...f, name: e.target.value}))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                        <input type="text" placeholder="Dosage" value={addMedForm.dosage} onChange={e => setAddMedForm(f => ({...f, dosage: e.target.value}))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                        <input type="text" placeholder="Frequency" value={addMedForm.frequency} onChange={e => setAddMedForm(f => ({...f, frequency: e.target.value}))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                        <input type="date" placeholder="Start Date" value={addMedForm.startDate} onChange={e => setAddMedForm(f => ({...f, startDate: e.target.value}))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                        <input type="date" placeholder="End Date (optional)" value={addMedForm.endDate} onChange={e => setAddMedForm(f => ({...f, endDate: e.target.value}))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                        <input type="text" placeholder="Reminder Times (comma-separated)" value={addMedForm.reminderTimes} onChange={e => setAddMedForm(f => ({...f, reminderTimes: e.target.value}))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                        <input type="text" placeholder="Days of Week (comma-separated)" value={addMedForm.daysOfWeek} onChange={e => setAddMedForm(f => ({...f, daysOfWeek: e.target.value}))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                        <input type="text" placeholder="Notes (optional)" value={addMedForm.notes} onChange={e => setAddMedForm(f => ({...f, notes: e.target.value}))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                        <div className="flex gap-2"><button type="button" disabled={addSaving} onClick={() => void submitAddMedication()} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">Save</button><button type="button" onClick={() => { setAddMedOpen(false); setAddMedForm({ name: '', dosage: '', frequency: '', startDate: '', endDate: '', reminderTimes: '', daysOfWeek: '', notes: '' }); }} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button></div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {sectionHeader(
                  "familyConditions",
                  "Family history",
                  <CheckCircle className="h-4 w-4" />,
                  medical.familyConditions.length
                )}
                {openSections.familyConditions && (
                  <div className="space-y-2 md:pl-2">
                    {medical.familyConditions.map((f: any) => (
                      <div key={f.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="font-semibold text-slate-900">{f.name}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {f.relative} · {formatDate(f.diagnosisDate)}
                        </p>
                        {renderPendingActions("familyConditions", f.id, entryShowsPending(f))}
                      </div>
                    ))}
                    <button type="button" onClick={() => setAddFamilyOpen(o => !o)} className="inline-flex items-center gap-1 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"><Plus className="h-3.5 w-3.5" />Add Family Condition</button>
                    {addFamilyOpen && (
                      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                        <input type="text" placeholder="Condition Name" value={addFamilyForm.name} onChange={e => setAddFamilyForm(f => ({...f, name: e.target.value}))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                        <input type="text" placeholder="Relative (e.g. Father)" value={addFamilyForm.relative} onChange={e => setAddFamilyForm(f => ({...f, relative: e.target.value}))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                        <input type="date" placeholder="Diagnosis Date" value={addFamilyForm.diagnosisDate} onChange={e => setAddFamilyForm(f => ({...f, diagnosisDate: e.target.value}))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                        <div className="flex gap-2"><button type="button" disabled={addSaving} onClick={() => void submitAddFamily()} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">Save</button><button type="button" onClick={() => { setAddFamilyOpen(false); setAddFamilyForm({ name: '', relative: '', diagnosisDate: '' }); }} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "ai" && (
            <div className="mt-6 space-y-3">
              {sortedAi.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
                  <ScanLine className="h-12 w-12 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-slate-600">No AI analyses yet</p>
                </div>
              ) : (
                sortedAi.map((row) => (
                  <div key={row.imageId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">{row.originalFileName ?? "Scan"}</p>
                        <p className="text-xs text-slate-500">
                          {row.analyzedAt ? formatDate(row.analyzedAt) : "—"}
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          row.isCancerous
                            ? "border-red-200 bg-red-50 text-red-800"
                            : "border-emerald-200 bg-emerald-50 text-emerald-800"
                        }`}
                      >
                        {row.isCancerous ? "Adenocarcinoma" : "Normal"}
                      </span>
                    </div>
                    <p className="mt-2 text-right text-sm font-bold text-slate-800">
                      {((row.probability ?? 0) * 100).toFixed(1)}%
                    </p>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${row.isCancerous ? "bg-red-500" : "bg-emerald-500"}`}
                        style={{ width: `${(row.probability ?? 0) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "requests" && (
            <div className="mt-6 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <h2 className="text-lg font-bold text-slate-900">Doctor requests</h2>
                <button
                  type="button"
                  onClick={() => { setRequestPanelOpen((o) => !o); setEditingRequest(null); }}
                  className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Send new request
                </button>
              </div>

              {/* ── Create form ─────────────────────────────────────────── */}
              {requestPanelOpen && !editingRequest && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="font-semibold text-slate-900">New request</h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="req-subject" className="mb-1 block text-xs font-semibold text-slate-600">
                        Subject
                      </label>
                      <input
                        id="req-subject"
                        type="text"
                        value={reqSubject}
                        onChange={(e) => setReqSubject(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        placeholder="Subject"
                      />
                    </div>
                    <div>
                      <label htmlFor="req-msg" className="mb-1 block text-xs font-semibold text-slate-600">
                        Message
                      </label>
                      <textarea
                        id="req-msg"
                        value={reqMessage}
                        onChange={(e) => setReqMessage(e.target.value)}
                        rows={4}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        placeholder="Message to patient"
                      />
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold text-slate-600">Importance</p>
                      <div className="flex flex-wrap gap-2">
                        {([Importance.Low, Importance.Medium, Importance.High] as const).map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setReqImportance(v)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                              reqImportance === v
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                            }`}
                          >
                            {IMPORTANCE_LABELS[v]}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold text-slate-600">Request type</p>
                      <div className="flex flex-wrap gap-2">
                        {([RequestType.Prescription, RequestType.MedicalAdvice, RequestType.TestResultsInquiry, RequestType.GeneralQuestion] as const).map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setReqType(v)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                              reqType === v
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                            }`}
                          >
                            {REQUEST_TYPE_LABELS[v]}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={reqSending}
                        onClick={() => void sendDoctorRequest()}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Send className="h-4 w-4" />
                        {reqSending ? "Sending…" : "Send"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRequestPanelOpen(false);
                          setReqSubject("");
                          setReqMessage("");
                          setReqImportance(Importance.Low);
                          setReqType(RequestType.GeneralQuestion);
                        }}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Edit form ──────────────────────────────────────────── */}
              {editingRequest && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50/30 p-5 shadow-sm">
                  <h3 className="font-semibold text-slate-900">Edit request #{editingRequest.id}</h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="edit-subject" className="mb-1 block text-xs font-semibold text-slate-600">Subject</label>
                      <input id="edit-subject" type="text" value={editSubject} onChange={(e) => setEditSubject(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                    </div>
                    <div>
                      <label htmlFor="edit-msg" className="mb-1 block text-xs font-semibold text-slate-600">Message</label>
                      <textarea id="edit-msg" value={editMessage} onChange={(e) => setEditMessage(e.target.value)} rows={4} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold text-slate-600">Importance</p>
                      <div className="flex flex-wrap gap-2">
                        {([Importance.Low, Importance.Medium, Importance.High] as const).map((v) => (
                          <button key={v} type="button" onClick={() => setEditImportance(v)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${editImportance === v ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}>{IMPORTANCE_LABELS[v]}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold text-slate-600">Request type</p>
                      <div className="flex flex-wrap gap-2">
                        {([RequestType.Prescription, RequestType.MedicalAdvice, RequestType.TestResultsInquiry, RequestType.GeneralQuestion] as const).map((v) => (
                          <button key={v} type="button" onClick={() => setEditType(v)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${editType === v ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}>{REQUEST_TYPE_LABELS[v]}</button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" disabled={editSaving} onClick={() => void submitEditRequest()} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
                        {editSaving ? "Saving…" : "Save changes"}
                      </button>
                      <button type="button" onClick={cancelEdit} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Delete confirmation dialog ─────────────────────────── */}
              {deleteConfirmId !== null && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
                  <h3 className="font-semibold text-red-900">Confirm deletion</h3>
                  <p className="mt-2 text-sm text-red-800">Are you sure you want to delete this request? This action cannot be undone.</p>
                  <div className="mt-4 flex gap-2">
                    <button type="button" disabled={deleteLoading} onClick={() => void confirmDeleteRequest()} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50">
                      <Trash2 className="h-4 w-4" />
                      {deleteLoading ? "Deleting…" : "Delete"}
                    </button>
                    <button type="button" onClick={() => setDeleteConfirmId(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
                  </div>
                </div>
              )}

              {/* ── Detail view ────────────────────────────────────────── */}
              {requestDetailLoading && (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                </div>
              )}
              {requestDetailData && !requestDetailLoading && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold text-slate-900">Request details</h3>
                    <button type="button" onClick={closeDetail} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">Close</button>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div><span className="font-semibold text-slate-500">Subject</span><p className="mt-0.5 text-slate-900">{requestDetailData.request.subject}</p></div>
                    <div><span className="font-semibold text-slate-500">Request Type</span><p className="mt-0.5 text-slate-900">{requestTypeDisplay(requestDetailData.request.requestType)}</p></div>
                    <div><span className="font-semibold text-slate-500">Importance</span><p className="mt-0.5"><span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${importanceBadgeClasses(requestDetailData.request.importance)}`}>{importanceDisplay(requestDetailData.request.importance)}</span></p></div>
                    <div><span className="font-semibold text-slate-500">Status</span><p className="mt-0.5"><span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${requestDetailData.request.isCompleted ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>{requestDetailData.request.isCompleted ? "Completed" : "Pending"}</span></p></div>
                    <div><span className="font-semibold text-slate-500">Patient Id</span><p className="mt-0.5 text-slate-900">{requestDetailData.request.patientId}</p></div>
                    <div><span className="font-semibold text-slate-500">Doctor Id</span><p className="mt-0.5 text-slate-900">{requestDetailData.request.doctorId}</p></div>
                    <div><span className="font-semibold text-slate-500">Created</span><p className="mt-0.5 text-slate-900">{formatDateTime(requestDetailData.request.createdAt)}</p></div>
                    <div><span className="font-semibold text-slate-500">Updated</span><p className="mt-0.5 text-slate-900">{formatDateTime(requestDetailData.request.updatedAt)}</p></div>
                  </div>
                  <div className="mt-4">
                    <span className="font-semibold text-slate-500 text-sm">Message</span>
                    <p className="mt-1 whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-800">{requestDetailData.request.message}</p>
                  </div>

                  {/* Responses section */}
                  <div className="mt-6 border-t border-slate-100 pt-4">
                    <h4 className="font-semibold text-slate-800">Responses ({requestDetailData.responses.length})</h4>
                    {requestDetailData.responses.length === 0 ? (
                      <p className="mt-2 text-sm text-slate-500">No responses yet.</p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        {requestDetailData.responses.map((resp, idx) => (
                          <div key={resp.id ?? idx} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-sm text-slate-800">{resp.message}</p>
                            <p className="mt-2 text-xs text-slate-500">{resp.createdAt ? formatDateTime(resp.createdAt) : ""}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Requests list ──────────────────────────────────────── */}
              {requests.length === 0 && !requestDetailData && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
                  <FileText className="h-12 w-12 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-slate-600">No requests yet</p>
                  <p className="mt-1 text-xs text-slate-400">Create a new request to get started</p>
                </div>
              )}

              {requests.length > 0 && (
                <div className="space-y-3">
                  {requests.map((r) => (
                    <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="font-bold text-slate-900">{r.subject}</h3>
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${importanceBadgeClasses(r.importance)}`}>
                          {importanceDisplay(r.importance)}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">{requestTypeDisplay(r.requestType)}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${r.isCompleted ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
                          {r.isCompleted ? "Completed" : "Pending"}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDateTime(r.createdAt)}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                        <button type="button" onClick={() => void viewRequestDetail(r.id)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                          <FileText className="h-3.5 w-3.5" /> View
                        </button>
                        <button type="button" onClick={() => startEditRequest(r)} className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100">
                          <PlusCircle className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button type="button" onClick={() => setDeleteConfirmId(r.id)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100">
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "prescriptions" && (
            <div className="mt-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Prescriptions</h2>
              {prescriptions.length === 0 ? (
                <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                  No prescriptions on record for this patient.
                </p>
              ) : (
                <div className="space-y-3">
                  {prescriptions.map((rx) => (
                    <div
                      key={rx.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <h3 className="font-bold text-slate-900">{rx.name}</h3>
                      {rx.subject && <p className="mt-1 text-sm text-slate-600">{rx.subject}</p>}
                      <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                        <span><strong>Dosage:</strong> {rx.dosage}</span>
                        <span><strong>Frequency:</strong> {rx.frequency}</span>
                        <span><strong>Start:</strong> {rx.startDate ? formatDate(rx.startDate) : "—"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "appointments" && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-900">Appointments</h2>
                <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  {appointments.length}
                </span>
              </div>
              {appointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
                  <Calendar className="h-12 w-12 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-slate-600">No appointments on record</p>
                  <p className="mt-1 text-xs text-slate-400">Appointments approved from booking requests will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {appointments
                    .slice()
                    .sort((a, b) => {
                      const da = new Date((a.date ?? a.startTime ?? "")).getTime();
                      const db = new Date((b.date ?? b.startTime ?? "")).getTime();
                      return db - da;
                    })
                    .map((appt) => {
                      const status = (appt.status ?? "").toLowerCase();
                      const statusBadge =
                        status === "confirmed" || status === "approved"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : status === "cancelled" || status === "rejected"
                          ? "border-red-200 bg-red-50 text-red-800"
                          : "border-amber-200 bg-amber-50 text-amber-800";
                      const dateStr = appt.date
                        ? appt.date.includes("T")
                          ? appt.date.split("T")[0]
                          : appt.date
                        : appt.startTime
                        ? appt.startTime.split("T")[0]
                        : "—";
                      const timeStr = appt.startTime
                        ? appt.startTime.includes("T")
                          ? appt.startTime.split("T")[1]?.slice(0, 5)
                          : appt.startTime.slice(0, 5)
                        : appt.time?.slice(0, 5) ?? "";

                      return (
                        <div
                          key={appt.id ?? appt.slotId}
                          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <CalendarCheck className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {dateStr !== "—"
                                    ? new Date(dateStr).toLocaleDateString(undefined, {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                      })
                                    : "—"}
                                </p>
                                {timeStr && (
                                  <p className="mt-0.5 text-sm text-slate-600 flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {timeStr}
                                    {appt.endTime && (
                                      <> — {appt.endTime.includes("T") ? appt.endTime.split("T")[1]?.slice(0, 5) : appt.endTime.slice(0, 5)}</>
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusBadge}`}>
                              {appt.status ?? "Pending"}
                            </span>
                          </div>
                          {(appt.serviceType || appt.patientNotes || appt.doctorNotes) && (
                            <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                              {appt.serviceType && (
                                <p className="text-sm text-slate-600">
                                  <strong>Service:</strong> {appt.serviceType}
                                </p>
                              )}
                              {appt.patientNotes && (
                                <p className="text-sm text-slate-600">
                                  <strong>Patient notes:</strong> {appt.patientNotes}
                                </p>
                              )}
                              {appt.doctorNotes && (
                                <p className="text-sm text-slate-600">
                                  <strong>Doctor notes:</strong> {appt.doctorNotes}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
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

export const PatientsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState<ListPatient[]>([]);
  const [listLoading, setListLoading] = useState(!USE_MOCK);
  const [listError, setListError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    setListError(null);
    if (!USE_MOCK) setListLoading(true);
    try {
      const list = await patientService.getDoctorPatientsWithSummaries();
      setPatients(list);
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Failed to load patients");
      setPatients([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(q);
      const emailMatch = p.email?.toLowerCase().includes(q) ?? false;
      const idMatch = String(p.id).includes(q);
      return nameMatch || emailMatch || idMatch;
    });
  }, [patients, search]);

  const viewKey = selectedPatientId === null ? "list" : `patient-${selectedPatientId}`;

  if (selectedPatientId !== null) {
    return (
      <div key={viewKey} className="min-h-screen animate-patientFadeIn">
        <PatientDetailPage
          patientId={selectedPatientId}
          onBack={() => setSelectedPatientId(null)}
        />
      </div>
    );
  }

  return (
    <div key={viewKey} className="flex min-h-screen animate-patientFadeIn flex-col bg-slate-100">
      <Navbar />
      <main className="flex-1 pb-12">
        <Container>
          <div className="py-8">
            <h1 className="text-2xl font-extrabold text-slate-900 md:text-3xl">My Patients</h1>
            <p className="mt-1 text-sm text-slate-500">{patients.length} patients</p>
            <div className="relative mt-6 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or ID..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            {listError ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {listError}
              </div>
            ) : null}

            {listLoading && !USE_MOCK ? (
              <div className="mt-12 flex justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="mt-16 flex flex-col items-center justify-center text-center">
                <Users className="h-14 w-14 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-600">
                  {patients.length === 0 ? "No patients assigned yet" : "No patients match your search"}
                </p>
              </div>
            ) : (
              <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                {filtered.map((p, index) => (
                  <ScrollReveal key={p.id} variant="fade-up" delay={index * 50}>
                  <div
                    className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md h-full"
                  >
                    <div className="absolute right-3 top-3 flex gap-1">
                      <button
                        type="button"
                        title="Medical Record"
                        aria-label="Medical Record"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(
                            `/medical-record?patientId=${p.id}&patientName=${encodeURIComponent(p.name)}`
                          );
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Patient History"
                        aria-label="Patient History"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(
                            `/history?patientId=${p.id}&patientName=${encodeURIComponent(p.name)}`
                          );
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <History className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPatientId(p.id)}
                      className="flex w-full flex-col pr-20 text-left"
                    >
                    <div className="flex items-start gap-3">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded-full border-2 border-blue-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-blue-200 bg-blue-50 text-sm font-bold text-blue-700">
                          {initials(p.name)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-slate-900">{p.name}</p>
                        <p className="mt-0.5 text-sm text-slate-500">
                          {p.gender
                            ? `${p.age ?? "—"} · ${p.gender}`
                            : `${p.age != null ? `${p.age} yrs` : "—"} · Blood type ${formatBloodType(p.bloodType)}`}
                        </p>
                        {!USE_MOCK && p.email ? (
                          <p className="mt-0.5 truncate text-xs text-slate-400">{p.email}</p>
                        ) : null}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                              !p.lastScan
                                ? "border-slate-200 bg-slate-100 text-slate-600"
                                : p.lastScan.isCancerous
                                  ? "border-red-200 bg-red-50 text-red-800"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
                            }`}
                          >
                            {!p.lastScan
                              ? "No scans yet"
                              : p.lastScan.isCancerous
                                ? "Adenocarcinoma"
                                : "Normal"}
                          </span>
                          {p.lastScan?.analyzedAt ? (
                            <span className="text-xs text-slate-500">
                              {formatListScanDate(p.lastScan.analyzedAt)}
                            </span>
                          ) : null}
                          {p.pendingReviews > 0 ? (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                              {p.pendingReviews} pending reviews
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    </button>
                  </div>
                  </ScrollReveal>
                ))}
              </div>
            )}
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
};

export default PatientsListPage;
