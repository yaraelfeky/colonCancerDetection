import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../../components/Layout/Navbar";
import Footer from "../../components/Layout/Footer";
import Container from "../../components/Layout/Container";
import {
  Upload,
  AlertTriangle,
  CheckCircle,
  FileText,
  Save,
  RefreshCw,
  X,
} from "lucide-react";

/** Set to `false` to call the real upload + analyze API chain. */
const USE_MOCK = false;

const DIAGNOSIS_CASE_STORAGE_KEY = "colonai-diagnosis-last-case";
const DIAGNOSIS_SAVED_RECORDS_KEY = "colonai-diagnosis-saved-records";

export interface AiAnalysisResponseDto {
  imageId: number;
  originalFileName: string;
  patientId: number | null;
  label: "cancerous" | "normal";
  probability: number;
  isCancerous: boolean;
  analyzedAt: string;
}

interface ImageUploadResponseDto {
  success: boolean;
  message: string;
  data: {
    id: number;
    filePath: string;
    fileName: string;
    fileSizeBytes: number;
    uploadedAt: string;
    status: string;
  };
}

type Stage = "CASE_INFO" | "IMAGE_UPLOAD" | "ANALYZING" | "RESULTS";

interface StoredDiagnosisCase {
  patientName: string;
  caseDate: string;
}

function readStoredDiagnosisCase(): StoredDiagnosisCase | null {
  try {
    const raw = localStorage.getItem(DIAGNOSIS_CASE_STORAGE_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as unknown;
    if (!j || typeof j !== "object") return null;
    const rec = j as Record<string, unknown>;
    if (typeof rec.patientName !== "string" || typeof rec.caseDate !== "string") return null;
    return { patientName: rec.patientName, caseDate: rec.caseDate };
  } catch {
    return null;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getToken(): string {
  return localStorage.getItem("token") || "";
}

function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/tiff"]);
const ALLOWED_EXT = /\.(jpe?g|png|tiff?)$/i;

async function parseResponseError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { errors?: unknown; message?: string };
    if (Array.isArray(j.errors) && j.errors.length) {
      return j.errors.map(String).join(" ");
    }
    if (typeof j.message === "string" && j.message.trim()) {
      return j.message;
    }
  } catch {
    /* ignore */
  }
  return res.statusText || "Request failed";
}

/** Matches report / appointment status pills: rounded-full border px-3 py-1 text-xs font-semibold */
const diagnosisBadgeClasses: Record<"cancerous" | "normal", string> = {
  cancerous: "bg-red-50 text-[#DC2626] border-red-200",
  normal: "bg-green-50 text-[#16A34A] border-green-200",
};

const DiagnosisPage: React.FC = () => {
  const todayStr = useMemo(() => toDateInputValue(new Date()), []);

  const [stage, setStage] = useState<Stage>("CASE_INFO");
  const [patientName, setPatientName] = useState("");
  const [caseDate, setCaseDate] = useState<string>(todayStr);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImageId, setUploadedImageId] = useState<number | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AiAnalysisResponseDto | null>(null);
  const [overrideActive, setOverrideActive] = useState(false);
  const [overrideDiagnosis, setOverrideDiagnosis] = useState<"cancerous" | "normal" | null>(
    null
  );
  const [doctorNotes, setDoctorNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"error" | "success">("error");
  const [resultsVisible, setResultsVisible] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = readStoredDiagnosisCase();
    if (!stored) return;
    setPatientName(stored.patientName);
    setCaseDate(stored.caseDate);
  }, []);

  const showToast = useCallback((message: string, variant: "error" | "success" = "error") => {
    setToastVariant(variant);
    setToastMessage(message);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const t = window.setTimeout(() => setToastMessage(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMessage]);

  useEffect(() => {
    if (stage === "RESULTS") {
      setResultsVisible(false);
      const id = window.requestAnimationFrame(() => setResultsVisible(true));
      return () => window.cancelAnimationFrame(id);
    }
    setResultsVisible(false);
  }, [stage, analysisResult?.analyzedAt]);

  const clearImage = useCallback(() => {
    setImageFile(null);
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const validateAndSetFile = useCallback(
    (file: File | null | undefined) => {
      if (!file) return;
      setErrorMessage(null);
      if (file.size > MAX_BYTES) {
        showToast("File must be 10 MB or smaller.");
        return;
      }
      const extOk = ALLOWED_EXT.test(file.name);
      const typeOk = ALLOWED_MIME.has(file.type);
      if (!typeOk || !extOk) {
        showToast("Only JPG, PNG, or TIFF images are allowed.");
        return;
      }
      clearImage();
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    },
    [clearImage, showToast]
  );

  const resetAll = useCallback(() => {
    try {
      localStorage.removeItem(DIAGNOSIS_CASE_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setStage("CASE_INFO");
    setPatientName("");
    setCaseDate(todayStr);
    setImageFile(null);
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploadedImageId(null);
    setAnalysisResult(null);
    setOverrideActive(false);
    setOverrideDiagnosis(null);
    setDoctorNotes("");
    setIsLoading(false);
    setErrorMessage(null);
    setToastMessage(null);
    setToastVariant("error");
  }, [todayStr]);

  const handleCaseNext = () => {
    const trimmed = patientName.trim();
    if (!trimmed) return;
    try {
      localStorage.setItem(
        DIAGNOSIS_CASE_STORAGE_KEY,
        JSON.stringify({ patientName: trimmed, caseDate })
      );
    } catch {
      /* ignore */
    }
    setStage("IMAGE_UPLOAD");
  };

  const handleRunAnalysis = async () => {
    if (!imageFile || !patientName.trim()) return;
    setErrorMessage(null);
    setIsLoading(true);
    setStage("ANALYZING");

    try {
      if (USE_MOCK) {
        await new Promise<void>((resolve, reject) => {
          window.setTimeout(() => {
            if (Math.random() < 0.1) {
              reject(new Error("Simulated error (10% mock failure). Please try again."));
              return;
            }
            resolve();
          }, 2000);
        });
        const mock: AiAnalysisResponseDto = {
          imageId: 1,
          originalFileName: imageFile.name,
          patientId: null,
          label: "cancerous",
          probability: 0.947,
          isCancerous: true,
          analyzedAt: new Date().toISOString(),
        };
        setUploadedImageId(1);
        setAnalysisResult(mock);
        setOverrideActive(false);
        setOverrideDiagnosis(null);
        setStage("RESULTS");
        return;
      }

      const token = getToken();
      const fd = new FormData();
      fd.append("Image", imageFile);
      fd.append("patientId", "0");
      const notesParts = [`Patient: ${patientName.trim()}`, doctorNotes.trim()].filter(Boolean);
      if (notesParts.length) {
        fd.append("notes", notesParts.join("\n\n"));
      }

      const uploadRes = await fetch("https://clinical.runasp.net/api/AI/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      if (uploadRes.status === 401) {
        throw new Error("Session expired. Please log in again.");
      }
      if (!uploadRes.ok) {
        throw new Error(await parseResponseError(uploadRes));
      }

      const uploadJson = (await uploadRes.json()) as ImageUploadResponseDto;
      const imageId = uploadJson?.data?.id;
      setUploadedImageId(imageId);
      console.log(uploadJson);
      console.log("UPLOAD RESPONSE:", uploadJson);

      const analyzeRes = await fetch(`https://clinical.runasp.net/api/AI/analyze/${imageId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (analyzeRes.status === 401) {
        throw new Error("Session expired. Please log in again.");
      }
      if (analyzeRes.status === 404) {
        throw new Error("Image not found.");
      }
      if (analyzeRes.status === 502) {
        throw new Error("Failed to contact the AI model. Please try again.");
      }
      if (!analyzeRes.ok) {
        throw new Error(await parseResponseError(analyzeRes));
      }

      const analyzeJson = (await analyzeRes.json()) as {
        success?: boolean;
        message?: string;
        data?: AiAnalysisResponseDto;
      };

      if (analyzeJson.success === false) {
        throw new Error(analyzeJson.message || "Analysis failed.");
      }
      if (!analyzeJson.data) {
        throw new Error("Invalid analysis response.");
      }

      setAnalysisResult(analyzeJson.data);
      setOverrideActive(false);
      setOverrideDiagnosis(null);
      setStage("RESULTS");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setErrorMessage(msg);
      setStage("IMAGE_UPLOAD");
    } finally {
      setIsLoading(false);
    }
  };

  const effectiveDiagnosis: "cancerous" | "normal" | null = analysisResult
    ? overrideActive && overrideDiagnosis
      ? overrideDiagnosis
      : analysisResult.isCancerous
        ? "cancerous"
        : "normal"
    : null;

  const effectiveIsCancerous = effectiveDiagnosis === "cancerous";

  const displayLabel = analysisResult
    ? effectiveIsCancerous
      ? "Adenocarcinoma"
      : "Normal"
    : "";

  const confidencePct = analysisResult
    ? `${(analysisResult.probability * 100).toFixed(1)}%`
    : "";

  const recommendation = analysisResult
    ? analysisResult.isCancerous
      ? "Immediate biopsy and oncology referral recommended."
      : "No malignancy detected. Routine follow-up advised."
    : "";

  const toggleOverride = () => {
    if (!analysisResult) return;
    setOverrideActive((prev) => {
      const next = !prev;
      if (next) {
        setOverrideDiagnosis(analysisResult.isCancerous ? "normal" : "cancerous");
      } else {
        setOverrideDiagnosis(null);
      }
      return next;
    });
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const onFileInputChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    validateAndSetFile(f);
    e.target.value = "";
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0];
    validateAndSetFile(f);
  };

  const onDragEnter: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
  };

  const onDragLeave: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
  };

  const onDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
  };

  const savePayload = () => {
    if (!patientName.trim() || !analysisResult) return;
    const finalDiagnosis = effectiveDiagnosis;
    if (!finalDiagnosis) return;

    const record = {
      id: Date.now(),
      patient: { name: patientName.trim(), caseDate },
      imageId: uploadedImageId,
      aiResult: analysisResult,
      overrideActive,
      finalDiagnosis,
      doctorNotes,
      savedAt: new Date().toISOString(),
    };
    console.log(record);

    try {
      const raw = localStorage.getItem(DIAGNOSIS_SAVED_RECORDS_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(parsed) ? parsed : [];
      const next = [record, ...list].slice(0, 100);
      localStorage.setItem(DIAGNOSIS_SAVED_RECORDS_KEY, JSON.stringify(next));
    } catch {
      showToast("Could not save to browser storage.", "error");
      return;
    }
    showToast("Saved to patient record (this browser).", "success");
  };

  const exportPdf = () => {
    if (!patientName.trim() || !analysisResult || !effectiveDiagnosis) return;

    const pName = escapeHtml(patientName.trim());
    const cDate = escapeHtml(caseDate);
    const fileLabel = escapeHtml(analysisResult.originalFileName || "—");
    const label = escapeHtml(displayLabel);
    const conf = escapeHtml(confidencePct);
    const rec = escapeHtml(recommendation);
    const analyzed = escapeHtml(analysisResult.analyzedAt);
    const notesEscaped = escapeHtml(doctorNotes.trim() || "—").replace(/\n/g, "<br/>");
    const overrideText = overrideActive
      ? `Yes — effective: <strong>${label}</strong>`
      : "No";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Diagnosis Report — ${pName}</title>
<style>
  body { font-family: Segoe UI, system-ui, sans-serif; padding: 24px; max-width: 720px; margin: 0 auto; color: #1e293b; line-height: 1.5; }
  h1 { color: #0A6EBD; font-size: 1.35rem; margin-bottom: 0.5rem; }
  .muted { color: #64748b; font-size: 0.875rem; }
  .box { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-top: 16px; background: #f8fafc; }
  @media print { .no-print { display: none !important; } body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
</style>
</head>
<body>
  <h1>ColonAI — Diagnosis report</h1>
  <p class="muted">Use your browser’s print dialog and choose <strong>Save as PDF</strong>.</p>
  <p><strong>Patient:</strong> ${pName}</p>
  <p><strong>Case date:</strong> ${cDate}</p>
  <div class="box">
    <p><strong>Result:</strong> ${label}</p>
    <p><strong>Model confidence:</strong> ${conf}</p>
    <p><strong>Recommendation:</strong> ${rec}</p>
    <p><strong>Analyzed at:</strong> ${analyzed}</p>
    <p><strong>Image file:</strong> ${fileLabel}</p>
    <p><strong>Doctor override:</strong> ${overrideText}</p>
  </div>
  <p><strong>Doctor notes:</strong><br/>${notesEscaped}</p>
  <p class="no-print" style="margin-top:24px">
    <button type="button" onclick="window.print()" style="padding:10px 18px;border-radius:10px;border:0;background:#0A6EBD;color:white;font-weight:600;cursor:pointer;font-size:14px">Print / Save as PDF</button>
  </p>
  <script>
    window.addEventListener("load", function () {
      setTimeout(function () { window.focus(); window.print(); }, 350);
    });
  </script>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) {
      showToast("Allow pop-ups to export, then try again.", "error");
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    showToast("Report opened — use Print → Save as PDF.", "success");
  };

  const badgeKey: "cancerous" | "normal" =
    effectiveDiagnosis === "cancerous" ? "cancerous" : "normal";

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "#002570" }}>
      <Navbar />
      <main className="flex-1" style={{ background: "#F5F7FA" }}>
        <section className="py-8 md:py-10">
          <Container>
            <div className="mb-8">
              <h1 className="text-2xl font-extrabold text-slate-800 md:text-3xl">
                AI Colon Cancer Diagnosis
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Clinical decision support: enter patient details, upload imaging, and review
                AI-assisted findings.
              </p>
            </div>

            <div
              className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8"
              style={{ boxShadow: "0 6px 24px rgba(0,0,0,0.06)" }}
            >
              {stage === "CASE_INFO" && (
                <div className="mx-auto max-w-lg space-y-6">
                  <div>
                    <label
                      htmlFor="diagnosis-patient-name"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Patient name
                    </label>
                    <input
                      id="diagnosis-patient-name"
                      type="text"
                      autoComplete="name"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="Enter patient name"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-[#0A6EBD] focus:outline-none focus:ring-2 focus:ring-[#0A6EBD]/30"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="diagnosis-case-date"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Case date
                    </label>
                    <input
                      id="diagnosis-case-date"
                      type="date"
                      value={caseDate}
                      onChange={(e) => setCaseDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-[#0A6EBD] focus:outline-none focus:ring-2 focus:ring-[#0A6EBD]/30"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={!patientName.trim()}
                    onClick={handleCaseNext}
                    className="w-full rounded-xl px-4 py-3 text-sm font-bold text-white shadow-lg transition enabled:hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ background: "#0A6EBD", boxShadow: "0 8px 20px rgba(10,110,189,0.28)" }}
                  >
                    Next
                  </button>
                </div>
              )}

              {(stage === "IMAGE_UPLOAD" || stage === "ANALYZING") && (
                <div className="mx-auto max-w-2xl space-y-6">
                  <div className="rounded-xl border border-[#0A6EBD]/25 bg-[#0A6EBD]/[0.06] px-4 py-3 text-sm text-slate-700">
                    <p>
                      <span className="font-semibold text-slate-800">Patient:</span>{" "}
                      {patientName.trim()}
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold text-slate-800">Case date:</span>{" "}
                      {caseDate}
                    </p>
                  </div>
                  {stage === "IMAGE_UPLOAD" && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.tiff,.tif,image/jpeg,image/png,image/tiff"
                        className="hidden"
                        onChange={onFileInputChange}
                      />

                      <div
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openFilePicker();
                          }
                        }}
                        onClick={openFilePicker}
                        onDrop={onDrop}
                        onDragEnter={onDragEnter}
                        onDragLeave={onDragLeave}
                        onDragOver={onDragOver}
                        className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80 px-6 py-14 text-center transition hover:border-[#0A6EBD]/50 hover:bg-slate-50"
                      >
                        <Upload className="mb-3 h-10 w-10 text-[#0A6EBD]" aria-hidden />
                        <p className="text-sm font-semibold text-slate-800">
                          Drag & drop an image here, or click to browse
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          JPG, PNG, or TIFF · max 10 MB
                        </p>
                      </div>

                      {imagePreview && imageFile && (
                        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearImage();
                            }}
                            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-600 shadow-md ring-1 ring-slate-200 transition hover:bg-red-50 hover:text-red-600"
                            aria-label="Remove image"
                          >
                            <X className="h-5 w-5" />
                          </button>
                          <img
                            src={imagePreview}
                            alt="Selected upload preview"
                            className="mx-auto max-h-72 w-auto rounded-lg object-contain"
                          />
                          <p className="mt-2 truncate text-center text-xs text-slate-500">
                            {imageFile.name}
                          </p>
                        </div>
                      )}

                      {errorMessage && (
                        <div
                          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                          role="alert"
                        >
                          {errorMessage}
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={!imageFile || isLoading}
                        onClick={() => void handleRunAnalysis()}
                        className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-lg transition enabled:hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
                        style={{
                          background: "#0A6EBD",
                          boxShadow: "0 8px 20px rgba(10,110,189,0.28)",
                        }}
                      >
                        Run AI Analysis
                      </button>
                    </>
                  )}

                  {stage === "ANALYZING" && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div
                        className="h-12 w-12 animate-spin rounded-full border-4 border-[#0A6EBD] border-t-transparent"
                        aria-hidden
                      />
                      <p className="mt-6 text-sm font-semibold text-slate-700">
                        Analyzing image…
                      </p>
                    </div>
                  )}
                </div>
              )}

              {stage === "RESULTS" && analysisResult && effectiveDiagnosis && (
                <div
                  className={`mx-auto max-w-2xl space-y-8 transition-opacity duration-500 ease-out ${
                    resultsVisible ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <div className="rounded-xl border border-[#0A6EBD]/25 bg-[#0A6EBD]/[0.06] px-4 py-3 text-sm text-slate-700">
                    <p>
                      <span className="font-semibold text-slate-800">Patient:</span>{" "}
                      {patientName.trim()}
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold text-slate-800">Case date:</span>{" "}
                      {caseDate}
                    </p>
                  </div>
                  <div
                    className={`rounded-2xl border-2 p-6 md:p-8 ${
                      effectiveIsCancerous
                        ? "border-red-300 bg-red-50"
                        : "border-green-300 bg-green-50"
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        {effectiveIsCancerous ? (
                          <AlertTriangle
                            className="mt-0.5 h-9 w-9 shrink-0 text-[#DC2626]"
                            aria-hidden
                          />
                        ) : (
                          <CheckCircle
                            className="mt-0.5 h-9 w-9 shrink-0 text-[#16A34A]"
                            aria-hidden
                          />
                        )}
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2
                              className={`text-xl font-extrabold md:text-2xl ${
                                effectiveIsCancerous ? "text-[#DC2626]" : "text-[#16A34A]"
                              }`}
                            >
                              {effectiveIsCancerous
                                ? "Adenocarcinoma Detected"
                                : "Normal — No Malignancy"}
                            </h2>
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${diagnosisBadgeClasses[badgeKey]}`}
                            >
                              {displayLabel}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-600">
                            AI label:{" "}
                            <span className="font-medium">{analysisResult.label}</span>
                            {analysisResult.originalFileName ? (
                              <>
                                {" · "}
                                <span className="font-medium">
                                  {analysisResult.originalFileName}
                                </span>
                              </>
                            ) : null}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-700">Model confidence</span>
                        <span className="font-bold text-slate-800">{confidencePct}</span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-white/80 ring-1 ring-slate-200/80">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ease-out ${
                            effectiveIsCancerous ? "bg-[#DC2626]" : "bg-[#16A34A]"
                          }`}
                          style={{ width: `${analysisResult.probability * 100}%` }}
                        />
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-relaxed text-slate-700">{recommendation}</p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-5">
                    <p className="text-sm font-semibold text-slate-800">Doctor override</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={toggleOverride}
                        className={`relative inline-flex h-9 min-w-[3.5rem] items-center rounded-full border-2 px-1 transition ${
                          overrideActive
                            ? "border-[#0A6EBD] bg-[#0A6EBD]"
                            : "border-slate-200 bg-slate-200"
                        }`}
                        aria-pressed={overrideActive}
                      >
                        <span
                          className={`inline-block h-7 w-7 rounded-full bg-white shadow transition-transform ${
                            overrideActive ? "translate-x-6" : "translate-x-0"
                          }`}
                        />
                      </button>
                      <span className="text-sm text-slate-600">
                        {overrideActive ? "Override active" : "Use AI diagnosis only"}
                      </span>
                    </div>
                    {overrideActive && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setOverrideDiagnosis("cancerous")}
                          className={`rounded-full border px-4 py-2 text-xs font-bold transition ${
                            overrideDiagnosis === "cancerous"
                              ? "border-red-300 bg-red-100 text-[#DC2626]"
                              : "border-slate-200 bg-white text-slate-600 hover:border-red-200"
                          }`}
                        >
                          Adenocarcinoma
                        </button>
                        <button
                          type="button"
                          onClick={() => setOverrideDiagnosis("normal")}
                          className={`rounded-full border px-4 py-2 text-xs font-bold transition ${
                            overrideDiagnosis === "normal"
                              ? "border-green-300 bg-green-100 text-[#16A34A]"
                              : "border-slate-200 bg-white text-slate-600 hover:border-green-200"
                          }`}
                        >
                          Normal
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="diagnosis-notes-results"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Doctor notes
                    </label>
                    <textarea
                      id="diagnosis-notes-results"
                      maxLength={1000}
                      value={doctorNotes}
                      onChange={(e) => setDoctorNotes(e.target.value)}
                      placeholder="Add clinical notes (optional)..."
                      rows={4}
                      className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0A6EBD]"
                    />
                    <p className="mt-1 text-right text-xs text-slate-400">
                      {doctorNotes.length}/1000
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      onClick={savePayload}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50"
                    >
                      <Save className="h-4 w-4 text-[#0A6EBD]" />
                      Save to Patient Record
                    </button>
                    <button
                      type="button"
                      onClick={exportPdf}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50"
                    >
                      <FileText className="h-4 w-4 text-[#0A6EBD]" />
                      Export PDF
                    </button>
                    <button
                      type="button"
                      onClick={resetAll}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:opacity-95"
                      style={{ background: "#0A6EBD" }}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Start New Case
                    </button>
                  </div>

                  <p className="text-center text-xs italic text-slate-500">
                    This system is a clinical decision support tool and does not replace
                    professional medical judgment.
                  </p>
                </div>
              )}
            </div>
          </Container>
        </section>
      </main>

      {toastMessage && (
        <div
          className={`fixed bottom-6 left-1/2 z-[100] max-w-md -translate-x-1/2 rounded-xl border px-5 py-3 text-center text-sm font-medium shadow-lg ${
            toastVariant === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
          role="status"
        >
          {toastMessage}
        </div>
      )}

      <Footer />
    </div>
  );
};

export default DiagnosisPage;
