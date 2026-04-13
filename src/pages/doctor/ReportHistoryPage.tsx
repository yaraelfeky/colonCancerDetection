import React, { useMemo, useState } from "react";
import Navbar from "../../components/Layout/Navbar";
import Footer from "../../components/Layout/Footer";
import Container from "../../components/Layout/Container";

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
}

type SortOrder = "Newest" | "Oldest";

const MOCK_REPORTS: Report[] = [
  {
    id: "REP-1001",
    patient: { id: "PT-2001", name: "Hagar Ahmed" },
    date: "2026-02-15",
    type: "Diagnosis",
    status: "Completed",
    summary: "Suspicious polyp detected in sigmoid colon; histopathology advised.",
    diagnosis: "Likely adenomatous polyp with moderate dysplasia.",
    recommendations:
      "Schedule biopsy confirmation and follow-up colonoscopy in 6 months.",
    doctorNotes:
      "Patient informed about findings and agreed to biopsy procedure next week.",
    extraInfo: "Family history positive for colorectal cancer.",
  },
  {
    id: "REP-1002",
    patient: { id: "PT-2002", name: "Omar Adel" },
    date: "2026-02-12",
    type: "Lab Results",
    status: "Pending",
    summary: "Awaiting complete blood panel and CEA marker result validation.",
    diagnosis: "Preliminary findings inconclusive.",
    recommendations: "Review full lab panel once available.",
    doctorNotes: "Lab reported delay due to sample processing issues.",
  },
  {
    id: "REP-1003",
    patient: { id: "PT-2003", name: "Sara Youssef" },
    date: "2026-02-09",
    type: "Follow-up",
    status: "Completed",
    summary: "Post-treatment follow-up indicates stable condition and symptom relief.",
    diagnosis: "No progression signs observed in current imaging.",
    recommendations: "Continue current medication protocol and re-evaluate in 8 weeks.",
    doctorNotes: "Patient adherence improved significantly since previous visit.",
  },
  {
    id: "REP-1004",
    patient: { id: "PT-2004", name: "Mina Nabil" },
    date: "2026-01-28",
    type: "Colonoscopy",
    status: "Completed",
    summary: "Multiple benign polyps removed successfully during colonoscopy.",
    diagnosis: "Benign tubular adenomas, no malignant transformation detected.",
    recommendations: "Routine surveillance colonoscopy in 12 months.",
    doctorNotes: "Procedure tolerated well with no post-op complications.",
  },
];

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

const ReportHistoryPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<ReportType | "All Types">(
    "All Types"
  );
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | "All Status">(
    "All Status"
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>("Newest");
  const [activeReport, setActiveReport] = useState<Report | null>(null);

  const filteredReports = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    let results = [...MOCK_REPORTS];

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
  }, [searchTerm, selectedType, selectedStatus, sortOrder]);

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
            </div>

            <div
              className="mb-6 rounded-2xl bg-white p-5"
              style={{ boxShadow: "0 6px 24px rgba(0,0,0,0.06)" }}
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <input
                  type="text"
                  placeholder="Search by patient name..."
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
                {filteredReports.map((report) => (
                  <article
                    key={report.id}
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
                        onClick={() =>
                          window.alert(`Mock download for report ${report.id} (PDF).`)
                        }
                        className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                      >
                        Download PDF
                      </button>
                    </div>
                  </article>
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
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ReportHistoryPage;
