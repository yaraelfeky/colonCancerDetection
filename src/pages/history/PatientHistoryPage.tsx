import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../../components/Layout/Navbar";
import Footer from "../../components/Layout/Footer";
import Container from "../../components/Layout/Container";
import { Clock, History, ScanLine, Stethoscope } from "lucide-react";
import { patientService } from "../../services/patientService";
import {
  patientHistoryService,
  type PatientHistoryEvent,
} from "../../services/patientHistoryService";
import type { EntryStatus } from "../../types/medicalRecord";

interface ListPatient {
  id: number;
  name: string;
}

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

function parsePatients(raw: unknown): ListPatient[] {
  if (Array.isArray(raw)) {
    return raw
      .map((p) => {
        const row = p as Record<string, unknown>;
        const id = Number(row.id);
        if (!id) return null;
        return { id, name: String(row.name ?? `Patient #${id}`) };
      })
      .filter((x): x is ListPatient => x !== null);
  }
  return [];
}

function statusLabel(status: EntryStatus | undefined): string {
  if (status === 0) return "Pending";
  if (status === 2) return "Rejected";
  if (status === 1) return "Approved";
  return "Recorded";
}

function statusBadgeClass(status: EntryStatus | undefined): string {
  if (status === 0) return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === 2) return "border-red-200 bg-red-50 text-red-800";
  if (status === 1) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function eventIcon(type: PatientHistoryEvent["type"]) {
  if (type === "ai_scan") return <ScanLine className="h-4 w-4" />;
  if (type === "visit") return <Clock className="h-4 w-4" />;
  if (type === "medication") return <Stethoscope className="h-4 w-4" />;
  return <History className="h-4 w-4" />;
}

const PatientHistoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [patients, setPatients] = useState<ListPatient[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [patientId, setPatientId] = useState<number | null>(null);
  const [events, setEvents] = useState<PatientHistoryEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPatientsLoading(true);
      try {
        const raw = await patientService.getMyPatients();
        if (!cancelled) setPatients(parsePatients(raw));
      } catch {
        if (!cancelled) setPatients([]);
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
    return patients.find((p) => p.id === patientId)?.name ?? "";
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

  const loadHistory = useCallback(async () => {
    if (patientId == null) return;
    setLoading(true);
    setLoadError(null);
    try {
      const list = await patientHistoryService.getByPatient(patientId);
      setEvents(list);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load history");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (patientId == null) {
      setEvents([]);
      return;
    }
    void loadHistory();
  }, [patientId, loadHistory]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <Navbar />
      <main className="flex-1 pb-12">
        <section className="border-b border-slate-200 bg-white shadow-sm">
          <Container>
            <div className="py-6">
              <h1 className="text-2xl font-extrabold text-slate-900 md:text-3xl">Patient History</h1>
              {headerPatientName ? (
                <p className="mt-1 text-sm font-semibold text-slate-700">{headerPatientName}</p>
              ) : null}
              <p className="mt-1 text-sm text-slate-500">
                Visits, tests, medications, and AI scans in chronological order.
              </p>
            </div>
          </Container>
        </section>

        <Container>
          <div className="mt-6 max-w-md">
            <label htmlFor="hist-patient" className="mb-1 block text-xs font-semibold text-slate-600">
              Patient
            </label>
            <select
              id="hist-patient"
              value={patientId ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                const nextId = v ? Number(v) : null;
                setPatientId(nextId);
                const selected = patients.find((p) => p.id === nextId);
                syncPatientInUrl(nextId, selected?.name);
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
              Select a patient to view their history.
            </p>
          ) : loading ? (
            <div className="mt-12 flex justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : events.length === 0 ? (
            <p className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              No history entries for this patient yet.
            </p>
          ) : (
            <div className="mt-6 space-y-3">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                        {eventIcon(ev.type)}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900">{ev.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDateTime(ev.date)} · {formatDate(ev.date)}
                        </p>
                      </div>
                    </div>
                    {ev.status !== undefined ? (
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(ev.status)}`}
                      >
                        {statusLabel(ev.status)}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{ev.summary}</p>
                </div>
              ))}
            </div>
          )}
        </Container>
      </main>
      <Footer />
    </div>
  );
};

export default PatientHistoryPage;
