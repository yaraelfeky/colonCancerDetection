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
} from "lucide-react";
import {
  buildPostPayload,
  doctorRequestService,
} from "../../services/doctorRequestService";
import { aiService } from "../../services/aiService";
import { medicalRecordService, type MedicalRecordSection } from "../../services/medicalRecordService";
import { medicationService } from "../../services/medicationService";
import {
  normalizePrescription,
  prescriptionService,
} from "../../services/prescriptionService";
import { patientService } from "../../services/patientService";

const USE_MOCK = false

const MOCK_PATIENT = {
  id: 3,
  name: "Ahmed Mohamed",
  age: 54,
  gender: "Male",
  email: "ahmed@email.com",
  phone: "01012345678",
  joinedAt: "2024-01-15",
};

const MOCK_AI_HISTORY = [
  {
    imageId: 1,
    originalFileName: "scan_jan.jpg",
    label: "cancerous" as const,
    probability: 0.947,
    isCancerous: true,
    analyzedAt: "2025-01-10T10:30:00Z",
  },
  {
    imageId: 2,
    originalFileName: "scan_mar.jpg",
    label: "normal" as const,
    probability: 0.821,
    isCancerous: false,
    analyzedAt: "2025-03-22T14:00:00Z",
  },
  {
    imageId: 3,
    originalFileName: "scan_may.jpg",
    label: "cancerous" as const,
    probability: 0.763,
    isCancerous: true,
    analyzedAt: "2025-05-01T09:15:00Z",
  },
];

const MOCK_MEDICAL_RECORD = {
  allergies: [
    {
      id: 1,
      name: "Penicillin",
      severity: "High",
      reaction: "Rash",
      isPending: true,
    },
    {
      id: 2,
      name: "Pollen",
      severity: "Low",
      reaction: "Sneezing",
      isPending: false,
    },
  ],
  visits: [
    {
      id: 1,
      date: "2025-01-10T10:00:00Z",
      doctorName: "Dr. Smith",
      reasonForVisit: "Routine check",
      diagnosis: "Healthy",
      treatmentPlan: "None",
      isPending: false,
    },
  ],
  surgeries: [
    {
      id: 1,
      name: "Appendectomy",
      date: "2020-06-15T08:00:00Z",
      outcome: "Successful",
      isPending: false,
    },
  ],
  tests: [
    {
      id: 1,
      name: "Colonoscopy",
      date: "2025-01-10T11:00:00Z",
      result: "Polyp detected",
      isPending: true,
    },
  ],
  medications: [
    {
      id: 1,
      name: "Aspirin",
      dosage: "100mg",
      frequency: "Daily",
      startDate: "2025-01-01T00:00:00Z",
      endDate: null as string | null,
      notes: "After meals",
      isPending: false,
    },
  ],
  familyConditions: [
    {
      id: 1,
      name: "Colon Cancer",
      relative: "Father",
      diagnosisDate: "2010-03-01T00:00:00Z",
      isPending: true,
    },
  ],
};

const MOCK_REQUESTS = [
  {
    id: 1,
    patientId: 3,
    subject: "Upload recent scan",
    message: "Please upload your latest colonoscopy image.",
    requestType: 1,
    importance: 2,
    createdAt: "2025-05-01T09:00:00Z",
    hasResponse: false,
  },
  {
    id: 2,
    patientId: 3,
    subject: "Medication confirmation",
    message: "Please confirm you are taking Aspirin daily.",
    requestType: 0,
    importance: 1,
    createdAt: "2025-04-15T10:00:00Z",
    hasResponse: true,
  },
];

type ListPatient = {
  id: number;
  name: string;
  age: number;
  gender: string;
  lastScan: { isCancerous: boolean; analyzedAt: string } | null;
  pendingReviews: number;
};

const MOCK_PATIENTS: ListPatient[] = [
  {
    id: 3,
    name: "Ahmed Mohamed",
    age: 54,
    gender: "Male",
    lastScan: { isCancerous: true, analyzedAt: "2025-05-01T09:15:00Z" },
    pendingReviews: 3,
  },
  {
    id: 2,
    name: "Sara Ali",
    age: 38,
    gender: "Female",
    lastScan: { isCancerous: false, analyzedAt: "2025-04-10T14:00:00Z" },
    pendingReviews: 0,
  },
  {
    id: 5,
    name: "Omar Hassan",
    age: 61,
    gender: "Male",
    lastScan: null,
    pendingReviews: 1,
  },
  {
    id: 4,
    name: "Fatima Nour",
    age: 45,
    gender: "Female",
    lastScan: { isCancerous: false, analyzedAt: "2025-03-15T11:00:00Z" },
    pendingReviews: 2,
  },
];

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

function importanceLabel(v: number): "Low" | "Medium" | "High" {
  if (v === 3) return "High";
  if (v === 2) return "Medium";
  return "Low";
}

function importanceBadgeClass(v: number): string {
  const lvl = importanceLabel(v);
  if (lvl === "High") return "bg-red-100 text-red-800 border-red-200";
  if (lvl === "Medium") return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
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

export interface PatientDetailPageProps {
  patientId: number;
  onBack?: () => void;
}

type TabId = "overview" | "medical" | "ai" | "requests" | "prescriptions";

type MedicalRecordState = typeof MOCK_MEDICAL_RECORD;

type AiHistoryItem = (typeof MOCK_AI_HISTORY)[number];

type DoctorRequestItem = (typeof MOCK_REQUESTS)[number];

type PatientProfile = typeof MOCK_PATIENT;

async function parseError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { message?: string; errors?: string[] };
    if (Array.isArray(j.errors) && j.errors.length) return j.errors.join(" ");
    if (typeof j.message === "string") return j.message;
  } catch {
    /* ignore */
  }
  return res.statusText || "Request failed";
}

function normalizeDoctorRequest(raw: unknown, fallbackPatientId: number): DoctorRequestItem {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const importance = r.importance ?? r.Importance;
  const requestType = r.requestType ?? r.RequestType;
 const imp = importance === 1 || importance === 2 || importance === 3 ? (importance as 1 | 2 | 3): 2;
  const type = requestType === 1 || requestType === 2 ? (requestType as 1 | 2) : 1;
  return {
    id: Number(r.id ?? r.Id ?? Date.now()),
    patientId: Number(r.patientId ?? r.PatientId ?? fallbackPatientId),
    subject: String(r.subject ?? r.Subject ?? ""),
    message: String(r.message ?? r.Message ?? ""),
    requestType: type,
    importance: imp,
    createdAt: String(r.createdAt ?? r.CreatedAt ?? new Date().toISOString()),
    hasResponse: Boolean(r.hasResponse ?? r.HasResponse ?? false),
  };
}

export const PatientDetailPage: React.FC<PatientDetailPageProps> = ({ patientId, onBack }) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>("overview");
  const goBack = useCallback(() => {
    if (onBack) onBack();
    else navigate(-1);
  }, [onBack, navigate]);
  const [loading, setLoading] = useState(!USE_MOCK);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [patient, setPatient] = useState<PatientProfile | null>(
    USE_MOCK ? { ...MOCK_PATIENT, id: patientId } : null
  );
  const [aiHistory, setAiHistory] = useState<AiHistoryItem[]>(USE_MOCK ? [...MOCK_AI_HISTORY] : []);
  const [medical, setMedical] = useState<MedicalRecordState | null>(
    USE_MOCK ? (JSON.parse(JSON.stringify(MOCK_MEDICAL_RECORD)) as MedicalRecordState) : null
  );
  const [requests, setRequests] = useState<DoctorRequestItem[]>(
    USE_MOCK ? MOCK_REQUESTS.filter((r) => r.patientId === patientId) : []
  );
  const [prescriptions, setPrescriptions] = useState<ReturnType<typeof normalizePrescription>[]>([]);

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
 const [reqImportance, setReqImportance] = useState<1 | 2 | 3>(1);
const [reqType, setReqType] = useState<1 | 2>(1);
  const [reqSending, setReqSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const sortedAi = useMemo(
    () => [...aiHistory].sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime()),
    [aiHistory]
  );

  const latestAi = sortedAi[0];

  const pendingMedicalCount = useMemo(() => {
    if (!medical) return 0;
    let n = 0;
    (Object.keys(medical) as MedicalSection[]).forEach((k) => {
      const arr = medical[k] as { isPending?: boolean }[];
      n += arr.filter((x) => x.isPending).length;
    });
    return n;
  }, [medical]);

  const totalAiScans = aiHistory.length;

  const lastScanLabel = useMemo(() => {
    if (!latestAi) return "—";
    return latestAi.isCancerous ? "Adenocarcinoma" : "Normal";
  }, [latestAi]);

  const loadData = useCallback(async () => {
    if (USE_MOCK) {
      setPatient({ ...MOCK_PATIENT, id: patientId });
      setAiHistory([...MOCK_AI_HISTORY]);
      setMedical(JSON.parse(JSON.stringify(MOCK_MEDICAL_RECORD)) as MedicalRecordState);
      setRequests(MOCK_REQUESTS.filter((r) => r.patientId === patientId));
      setLoading(false);
      setLoadError(null);
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      const [aiData, mrJson, meds, rxList, drList] = await Promise.all([
        aiService.getPatientHistory(patientId),
        medicalRecordService.getByPatient(patientId),
        medicationService.getByPatient(patientId),
        prescriptionService.getByPatient(patientId),
        doctorRequestService.list(),
      ]);

      setPatient({
        id: patientId,
        name: `Patient #${patientId}`,
        age: 0,
        gender: "—",
        email: "—",
        phone: "—",
        joinedAt: new Date().toISOString(),
      });
      setAiHistory(aiData);

      let medicalData = mrJson;
      if (Array.isArray(meds) && meds.length) {
        medicalData = { ...medicalData, medications: meds as MedicalRecordState["medications"] };
      }
      setMedical(medicalData);
      setPrescriptions(rxList.map(normalizePrescription));

      setRequests(
        drList
          .map((item) => normalizeDoctorRequest(item, patientId))
          .filter((r) => r.patientId === patientId)
      );
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load patient");
      setPatient(null);
      setMedical(null);
      setAiHistory([]);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

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
        const key = section;
        const list = [...(prev[key] as { id: number; isPending?: boolean }[])];
        const idx = list.findIndex((x) => x.id === entryId);
        if (idx === -1) return prev;
        list[idx] = { ...list[idx], isPending: false };
        return { ...prev, [key]: list };
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
        const arr = [...(prev[section] as { id: number; isPending?: boolean }[])];
        const i = arr.findIndex((x) => x.id === entryId);
        if (i === -1) return prev;
        arr[i] = { ...arr[i], isPending: false };
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
    
    const subject = reqSubject.trim();
    const message = reqMessage.trim();
    
    const body = buildPostPayload(
      patientId,
      subject,
      message,
      reqType,
      reqImportance
    );
  console.log(JSON.stringify(body, null, 2));
  console.log("reqImportance:", reqImportance);
  console.log("body:", body);
  console.log(typeof reqType, reqType);
  console.log(typeof reqImportance, reqImportance);

  try {
    const created = await doctorRequestService.create(body);
    const item = normalizeDoctorRequest(created ?? body, patientId);

    setRequests((prev) => [item, ...prev]);
    setReqSubject("");
    setReqMessage("");
    setReqImportance(1);
    setReqType(1);
    setRequestPanelOpen(false);
    setToast("Request sent.");
  } catch (e: any) {
      console.log("FULL ERROR:", e);
      console.log("RESPONSE:", e?.response?.data);

      setToast(
        e?.response?.data?.message ||
        JSON.stringify(e?.response?.data) ||
        "Send failed"
  );
}finally {
    setReqSending(false);
    console.log("CURRENT IMPORTANCE:", reqImportance);
  }
};

 

  const renderPendingActions = (section: MedicalSection, id: number, isPending: boolean) => {
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

  if (loading && !USE_MOCK) {
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
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-blue-200 bg-blue-50 text-lg font-bold text-blue-700">
                  {initials(patient.name)}
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-2xl font-extrabold text-slate-900 md:text-3xl">{patient.name}</h1>
                  <p className="mt-1 text-sm text-slate-500">
                    {patient.age} · {patient.gender} · Joined {formatDate(patient.joinedAt)}
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
          {loadError && !USE_MOCK && (
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
                      <span className="truncate text-sm">{patient.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-700">
                      <Phone className="h-5 w-5 shrink-0 text-blue-600" />
                      <span className="text-sm">{patient.phone}</span>
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
                    <span className="text-xs text-slate-500">{formatDate(latestAi.analyzedAt)}</span>
                  </div>
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs font-medium text-slate-600">
                      <span>Confidence</span>
                      <span>{(latestAi.probability * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all ${
                          latestAi.isCancerous ? "bg-red-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${latestAi.probability * 100}%` }}
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
                    {medical.allergies.map((a) => (
                      <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="font-semibold text-slate-900">{a.name}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          Severity: {a.severity} · Reaction: {a.reaction}
                        </p>
                        {renderPendingActions("allergies", a.id, a.isPending)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {sectionHeader("visits", "Visits", <Clock className="h-4 w-4" />, medical.visits.length)}
                {openSections.visits && (
                  <div className="space-y-2 md:pl-2">
                    {medical.visits.map((v) => (
                      <div key={v.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="font-semibold text-slate-900">{formatDateTime(v.date)}</p>
                        <p className="text-sm text-slate-600">{v.doctorName}</p>
                        <p className="mt-2 text-sm text-slate-700">{v.reasonForVisit}</p>
                        <p className="mt-1 text-sm text-slate-600">Dx: {v.diagnosis}</p>
                        <p className="text-sm text-slate-600">Plan: {v.treatmentPlan}</p>
                        {renderPendingActions("visits", v.id, v.isPending)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {sectionHeader("surgeries", "Surgeries", <Plus className="h-4 w-4" />, medical.surgeries.length)}
                {openSections.surgeries && (
                  <div className="space-y-2 md:pl-2">
                    {medical.surgeries.map((s) => (
                      <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="font-semibold text-slate-900">{s.name}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {formatDate(s.date)} · {s.outcome}
                        </p>
                        {renderPendingActions("surgeries", s.id, s.isPending)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {sectionHeader("tests", "Tests", <ScanLine className="h-4 w-4" />, medical.tests.length)}
                {openSections.tests && (
                  <div className="space-y-2 md:pl-2">
                    {medical.tests.map((t) => (
                      <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="font-semibold text-slate-900">{t.name}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {formatDateTime(t.date)} · {t.result}
                        </p>
                        {renderPendingActions("tests", t.id, t.isPending)}
                      </div>
                    ))}
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
                    {medical.medications.map((m) => (
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
                        {renderPendingActions("medications", m.id, m.isPending)}
                      </div>
                    ))}
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
                    {medical.familyConditions.map((f) => (
                      <div key={f.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="font-semibold text-slate-900">{f.name}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {f.relative} · {formatDate(f.diagnosisDate)}
                        </p>
                        {renderPendingActions("familyConditions", f.id, f.isPending)}
                      </div>
                    ))}
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
                        <p className="font-semibold text-slate-900">{row.originalFileName}</p>
                        <p className="text-xs text-slate-500">{formatDate(row.analyzedAt)}</p>
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
                      {(row.probability * 100).toFixed(1)}%
                    </p>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${row.isCancerous ? "bg-red-500" : "bg-emerald-500"}`}
                        style={{ width: `${row.probability * 100}%` }}
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
                  onClick={() => setRequestPanelOpen((o) => !o)}
                  className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Send new request
                </button>
              </div>

              {requestPanelOpen && (
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
                        {([1, 2,3] as const).map((v) => (
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
                            {importanceLabel(v)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold text-slate-600">Request type</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setReqType(1)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                            reqType === 1
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          General
                        </button>
                        <button
                          type="button"
                          onClick={() => setReqType(2)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                            reqType === 2
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          Image upload
                        </button>
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
                        Send
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRequestPanelOpen(false);
                          setReqSubject("");
                          setReqMessage("");
                        }}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {requests.map((r) => (
                  <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="font-bold text-slate-900">{r.subject}</h3>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${importanceBadgeClass(
                          r.importance
                        )}`}
                      >
                        {importanceLabel(r.importance)}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">{r.message}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDateTime(r.createdAt)}
                      </span>
                      <span
                        className={`font-semibold ${
                          r.hasResponse ? "text-emerald-700" : "text-amber-700"
                        }`}
                      >
                        {r.hasResponse ? "Responded" : "Awaiting response"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
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
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState<ListPatient[]>([]);
  const [listLoading, setListLoading] = useState(!USE_MOCK);
  const [listError, setListError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    if (USE_MOCK) {
      setPatients(MOCK_PATIENTS);
      setListLoading(false);
      setListError(null);
      return;
    }
    setListLoading(true);
    setListError(null);
    try {
      const list = await patientService.getMyPatients();
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

  const filtered = useMemo(
    () =>
      patients.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase())),
    [patients, search]
  );

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
                placeholder="Search by name..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            {listLoading && !USE_MOCK ? (
              <div className="mt-12 flex justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="mt-16 flex flex-col items-center justify-center text-center">
                <Users className="h-14 w-14 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-600">No patients found</p>
              </div>
            ) : (
              <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                {filtered.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPatientId(p.id)}
                    className="flex w-full flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-blue-200 bg-blue-50 text-sm font-bold text-blue-700">
                        {initials(p.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-slate-900">{p.name}</p>
                        <p className="mt-0.5 text-sm text-slate-500">
                          {p.age} · {p.gender}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                              p.lastScan === null
                                ? "border-slate-200 bg-slate-100 text-slate-600"
                                : p.lastScan.isCancerous
                                  ? "border-red-200 bg-red-50 text-red-800"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
                            }`}
                          >
                            {p.lastScan === null
                              ? "No scans yet"
                              : p.lastScan.isCancerous
                                ? "Adenocarcinoma"
                                : "Normal"}
                          </span>
                          {p.lastScan ? (
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
