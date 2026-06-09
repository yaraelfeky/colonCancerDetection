import React, { useMemo, useState, useEffect, useCallback } from "react";
import Navbar from "../../components/Layout/Navbar";
import Footer from "../../components/Layout/Footer";
import Container from "../../components/Layout/Container";
import { loadAllAiReports, aiService } from "../../services/aiService";
import { patientService } from "../../services/patientService";
import { getAxiosErrorMessage } from "../../utils/axiosError";
import ScrollReveal from "../../components/ScrollReveal";

interface Patient {
  id: string;
  name: string;
}

type ReportStatus = "Completed" | "Pending";
type ReportType = "Diagnosis" | "Lab Results" | "Follow-up" | "Colonoscopy";

interface Report {
  id: string;
  patient: Patient;
  date: string;
  type: ReportType;
  status: ReportStatus;
  summary: string;
  diagnosis: string;
  recommendations: string;
  doctorNotes: string;
  extraInfo?: string;
  imageId?: number;
}

type SortOrder = "Newest" | "Oldest";



const reportTypeOptions: Array<ReportType | "All Types"> = [
  "All Types",
  "Diagnosis",
  "Lab Results",
  "Follow-up",
  "Colonoscopy",
];

const statusOptions: Array<ReportStatus | "All Status"> = [
  "All Status",
  "Completed",
  "Pending",
];

const statusBadgeClasses: Record<ReportStatus, string> = {
  Completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Pending: "bg-amber-100 text-amber-700 border-amber-200",
};

const AuthenticatedImage = ({ imageId }: { imageId: number }) => {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    aiService.fetchImageBlobUrl(imageId)
      .then(url => {
        if (active) setSrc(url);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => { active = false; };
  }, [imageId]);

  if (error) return <p className="mt-2 text-sm text-red-500">Failed to load image</p>;
  if (!src) return <div className="mt-2 h-32 w-32 animate-pulse rounded bg-slate-200"></div>;

  return (
    <img 
      src={src} 
      alt="AI Scan" 
      className="mt-3 max-h-64 rounded-lg object-contain border border-slate-200 bg-white"
    />
  );
};

const ReportHistoryPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<ReportType | "All Types">(
    "All Types"
  );
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | "All Status">(
    "All Status"
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>("Newest");
  const [activeReport, setActiveReport] = useState<Report | null>(null);

  const [patients, setPatients] = useState<{ id: string | number; name: string }[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");

  const loadPatients = useCallback(async () => {
    try {
      const list = await patientService.getMyPatients();
      setPatients(list || []);
    } catch {
      setPatients([]);
    }
  }, []);

  useEffect(() => {
    void loadPatients();
  }, [loadPatients]);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      if (selectedPatientId) {
        const patient = patients.find(p => String(p.id) === selectedPatientId);
        if (patient) {
          const aiItems = await aiService.getPatientHistory(Number(selectedPatientId));
          const mapped: Report[] = aiItems.map((ai) => ({
            id: `AI-${ai.imageId}`,
            patient: { id: String(patient.id), name: patient.name },
            date: ai.analyzedAt?.split("T")[0] ?? new Date().toISOString().split("T")[0],
            type: "Diagnosis" as ReportType,
            status: "Completed",
            summary: ai.isCancerous
              ? `Suspicious finding (${Math.round((ai.probability ?? 0) * 100)}% confidence)`
              : `Normal tissue (${Math.round((ai.probability ?? 0) * 100)}% confidence)`,
            diagnosis: ai.label ?? (ai.isCancerous ? "cancerous" : "normal"),
            recommendations: ai.isCancerous
              ? "Review with patient and schedule follow-up as needed."
              : "Continue routine surveillance.",
            doctorNotes: ai.notes || ai.originalFileName || "",
            imageId: ai.imageId
          }));
          setReports(mapped);
        }
      } else {
        const patientList = patients.length > 0 ? patients : (await patientService.getMyPatients() || []);
        const aiItems = await loadAllAiReports(patientList);
        const mapped: Report[] = patientList.map((p) => {
          const ai = aiItems.find(a => String(a.patientId) === String(p.id));
          if (ai) {
            return {
              id: `AI-${ai.imageId}`,
              patient: { id: String(p.id), name: p.name },
              date: ai.analyzedAt?.split("T")[0] ?? new Date().toISOString().split("T")[0],
              type: "Diagnosis" as ReportType,
              status: "Completed",
              summary: ai.isCancerous
                ? `Suspicious finding (${Math.round((ai.probability ?? 0) * 100)}% confidence)`
                : `Normal tissue (${Math.round((ai.probability ?? 0) * 100)}% confidence)`,
              diagnosis: ai.label ?? (ai.isCancerous ? "cancerous" : "normal"),
              recommendations: ai.isCancerous
                ? "Review with patient and schedule follow-up as needed."
                : "Continue routine surveillance.",
              doctorNotes: ai.notes || ai.originalFileName || "",
              imageId: ai.imageId
            };
          } else {
            return {
              id: `PT-${p.id}`,
              patient: { id: String(p.id), name: p.name },
              date: new Date().toISOString().split("T")[0],
              type: "Follow-up" as ReportType,
              status: "Pending",
              summary: "No AI analysis available yet.",
              diagnosis: "Pending evaluation",
              recommendations: "Schedule initial screening or upload imaging.",
              doctorNotes: "",
              extraInfo: "Patient data loaded from doctor's list.",
            };
          }
        });
        setReports(mapped);
      }
    } catch (err) {
      setLoadError(getAxiosErrorMessage(err));
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [patients, selectedPatientId]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const downloadReportPdf = async (report: Report) => {
    const win = window.open('', '_blank');
    if (!win) { window.alert('Please allow pop-ups to download PDFs.'); return; }

    let imgHtml = '';
    if (report.imageId) {
      try {
        const blobUrl = await aiService.fetchImageBlobUrl(report.imageId);
        imgHtml = `<section><h2>Scanned Image</h2><img src="${blobUrl}" style="max-width: 100%; max-height: 400px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 8px;" /></section>`;
      } catch {
        imgHtml = `<section><h2>Scanned Image</h2><p>Failed to load image.</p></section>`;
      }
    }

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Report ${report.id}</title>
<style>
body{font-family:Arial,sans-serif;margin:32px;color:#1a202c;}
h1{font-size:22px;margin-bottom:4px;}
.meta{color:#718096;font-size:13px;margin-bottom:24px;}
.badge{display:inline-block;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:600;}
.completed{background:#d1fae5;color:#065f46;}
section{margin-bottom:18px;}
h2{font-size:14px;font-weight:700;color:#374151;margin-bottom:6px;border-bottom:1px solid #e2e8f0;padding-bottom:4px;}
p{font-size:13px;line-height:1.6;color:#4a5568;margin:0;}
@media print{body{margin:18px;}}
</style></head><body>
<h1>Medical Report — ${report.id}</h1>
<div class="meta">Patient: <strong>${report.patient.name}</strong> &nbsp;|&nbsp; Date: <strong>${report.date}</strong> &nbsp;|&nbsp; Type: <strong>${report.type}</strong> &nbsp;</div>
<section><h2>Summary</h2><p>${report.summary}</p></section>
<section><h2>Diagnosis</h2><p>${report.diagnosis}</p></section>
<section><h2>Recommendations</h2><p>${report.recommendations}</p></section>
<section><h2>Doctor Notes</h2><p>${report.doctorNotes || '—'}</p></section>
${report.extraInfo ? `<section><h2>Additional Medical Info</h2><p>${report.extraInfo}</p></section>` : ''}
${imgHtml}
</body></html>`;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 800);
  };

  const filteredReports = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    let results = [...reports];

    if (normalizedSearch) {
      results = results.filter((report) =>
        report.patient.name.toLowerCase().includes(normalizedSearch)
      );
    }

    if (selectedType !== "All Types") {
      results = results.filter((report) => report.type === selectedType);
    }

    if (selectedStatus !== "All Status") {
      results = results.filter((report) => report.status === selectedStatus);
    }

    results.sort((a, b) => {
      const first = new Date(a.date).getTime();
      const second = new Date(b.date).getTime();
      return sortOrder === "Newest" ? second - first : first - second;
    });

    return results;
  }, [reports, searchTerm, selectedType, selectedStatus, sortOrder]);

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "#002570" }}>
      <Navbar />

      <main className="flex-1" style={{ background: "#F5F7FA" }}>
        <section className="py-8 md:py-10">
          <Container>
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-slate-800 md:text-3xl">
                Report History
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Review and manage your patients' diagnostic and follow-up reports.
              </p>
              {loadError && (
                <p className="mt-2 text-sm text-red-700">{loadError}</p>
              )}
              {loading && (
                <p className="mt-2 text-sm text-slate-500">Loading reports from server…</p>
              )}
            </div>

            <div
              className="mb-6 rounded-2xl bg-white p-5"
              style={{ boxShadow: "0 6px 24px rgba(0,0,0,0.06)" }}
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-[#1E88E5]/20 transition focus:ring-2"
                >
                  <option value="">All Patients</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-[#1E88E5]/20 transition focus:ring-2"
                />

                <select
                  value={selectedType}
                  onChange={(e) =>
                    setSelectedType(e.target.value as ReportType | "All Types")
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-[#1E88E5]/20 transition focus:ring-2"
                >
                  {reportTypeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) =>
                    setSelectedStatus(e.target.value as ReportStatus | "All Status")
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-[#1E88E5]/20 transition focus:ring-2"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-[#1E88E5]/20 transition focus:ring-2"
                >
                  <option value="Newest">Newest</option>
                  <option value="Oldest">Oldest</option>
                </select>
              </div>
            </div>

            {filteredReports.length === 0 ? (
              <div
                className="rounded-2xl bg-white p-10 text-center"
                style={{ boxShadow: "0 6px 24px rgba(0,0,0,0.06)" }}
              >
                <h2 className="text-lg font-bold text-slate-800">No reports found</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Try changing your search or filters to find matching reports.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {filteredReports.map((report, index) => (
                  <ScrollReveal key={report.id} variant="fade-up" delay={index * 50}>
                  <article
                    className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-800">
                          {report.patient.name}
                        </h3>
                        <p className="text-xs text-slate-500">Report ID: {report.id}</p>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          statusBadgeClasses[report.status]
                        }`}
                      >
                        {report.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-1 text-sm text-slate-600 sm:grid-cols-2">
                      <p>
                        <span className="font-semibold text-slate-700">Date:</span>{" "}
                        {report.date}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-700">Type:</span>{" "}
                        {report.type}
                      </p>
                    </div>

                    <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                      {report.summary}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveReport(report)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        View Details
                      </button>

                      <button
                        type="button"
                        onClick={() => downloadReportPdf(report)}
                        className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                      >
                        Download PDF
                      </button>
                    </div>
                  </article>
                  </ScrollReveal>
                ))}
              </div>
            )}
          </Container>
        </section>
      </main>

      {activeReport && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 md:items-center">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-2xl md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Report Details</h3>
              <button
                type="button"
                onClick={() => setActiveReport(null)}
                className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm text-slate-600 md:grid-cols-2">
              <p>
                <span className="font-semibold text-slate-700">Patient:</span>{" "}
                {activeReport.patient.name}
              </p>
              <p>
                <span className="font-semibold text-slate-700">Date:</span>{" "}
                {activeReport.date}
              </p>
              <p>
                <span className="font-semibold text-slate-700">Type:</span>{" "}
                {activeReport.type}
              </p>
              <p>
                <span className="font-semibold text-slate-700">Status:</span>{" "}
                {activeReport.status}
              </p>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <h4 className="text-sm font-semibold text-slate-800">Diagnosis</h4>
                <p className="mt-1 text-sm text-slate-600">{activeReport.diagnosis}</p>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <h4 className="text-sm font-semibold text-slate-800">Recommendations</h4>
                <p className="mt-1 text-sm text-slate-600">
                  {activeReport.recommendations}
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <h4 className="text-sm font-semibold text-slate-800">Doctor Notes</h4>
                <p className="mt-1 text-sm text-slate-600">{activeReport.doctorNotes}</p>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <h4 className="text-sm font-semibold text-slate-800">Additional Medical Info</h4>
                <p className="mt-1 text-sm text-slate-600">
                  {activeReport.extraInfo || "No additional information provided."}
                </p>
              </div>

              {activeReport.imageId && (
                <div className="rounded-lg bg-slate-50 p-3 md:col-span-2">
                  <h4 className="text-sm font-semibold text-slate-800">Scanned Image</h4>
                  <AuthenticatedImage imageId={activeReport.imageId} />
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => downloadReportPdf(activeReport)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ReportHistoryPage;
