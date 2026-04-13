import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Layout/Navbar";
import Footer from "../../components/Layout/Footer";
import { useAuth } from "../../Context/AuthContext";
import { doctorService } from "../../services/doctorService";
import type {
  DoctorAchievementDto,
  DoctorEducationDto,
  DoctorExperienceDto,
  DoctorProfileDto,
  DoctorReviewDto,
  DoctorScheduleSlotDto,
} from "../../types/doctor";
import { readLocalAvatarDataUrl, writeLocalAvatarDataUrl } from "../../utils/localDoctorProfile";

const PRIMARY = "#1E88E5";
const SECONDARY = "#26A69A";
const TEXT = "#0D1B2A";
const BG = "#EEF2F7";

const EN_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatShortId(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  const n = Math.abs(h) % 9000 + 1000;
  return `DT${n}`;
}

function StarRow({ value, size = 18 }: { value: number; size?: number }) {
  const rounded = Math.round(Math.min(5, Math.max(0, value)));
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rounded} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i < rounded ? "#FBBF24" : "#E5E7EB"} aria-hidden>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

function LineChart({ labels, values }: { labels: string[]; values: number[] }) {
  const w = 640;
  const h = 220;
  const pad = 28;
  const max = Math.max(1, ...values);
  const min = 0;
  const n = values.length;
  const step = n > 1 ? (w - 2 * pad) / (n - 1) : 0;
  const pts = values.map((v, i) => {
    const x = pad + i * step;
    const y = h - pad - ((v - min) / (max - min)) * (h - 2 * pad);
    return [x, y] as const;
  });
  const d =
    pts.length === 0
      ? ""
      : pts.reduce((acc, p, i) => (i === 0 ? `M ${p[0]},${p[1]}` : `${acc} L ${p[0]},${p[1]}`), "");

  const areaD =
    pts.length === 0
      ? ""
      : `M ${pts[0][0]},${h - pad} ${pts.map((p) => `L ${p[0]},${p[1]}`).join(" ")} L ${pts[pts.length - 1][0]},${h - pad} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-h-64" role="img" aria-label="Activity trend chart">
        <defs>
          <linearGradient id="docLineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PRIMARY} stopOpacity="0.25" />
            <stop offset="100%" stopColor={PRIMARY} stopOpacity="0" />
          </linearGradient>
        </defs>
        {areaD && <path d={areaD} fill="url(#docLineGrad)" />}
        {d && (
          <path
            d={d}
            fill="none"
            stroke={PRIMARY}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={4} fill="#fff" stroke={PRIMARY} strokeWidth={2} />
        ))}
        {labels.map((lab, i) => (
          <text
            key={i}
            x={pad + i * step}
            y={h - 6}
            textAnchor="middle"
            className="fill-gray-500"
            style={{ fontSize: 10 }}
          >
            {lab}
          </text>
        ))}
      </svg>
    </div>
  );
}

function BarChartMini({ labels, values }: { labels: string[]; values: number[] }) {
  const max = Math.max(1, ...values);
  const barH = 140;
  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${Math.max(labels.length * 48, 240)} ${barH + 36}`}
        className="min-w-[240px] w-full max-h-52"
        role="img"
        aria-label="Bookings bar chart"
      >
        {values.map((v, i) => {
          const h = (v / max) * barH;
          const x = 12 + i * 48;
          const y = 8 + (barH - h);
          return (
            <g key={i}>
              <rect x={x} y={y} width={32} height={h} rx={6} fill={i % 2 === 0 ? PRIMARY : SECONDARY} opacity={0.9} />
              <text x={x + 16} y={barH + 22} textAnchor="middle" className="fill-gray-500" style={{ fontSize: 10 }}>
                {labels[i] ?? ""}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

type TabId = "overview" | "schedule" | "stats" | "reviews";

const defaultSchedule = (): DoctorScheduleSlotDto[] =>
  EN_DAYS.map((dayName, dayOfWeek) => ({
    dayOfWeek,
    dayName,
    startTime: "09:00",
    endTime: "14:00",
    isAvailable: dayOfWeek !== 5 && dayOfWeek !== 6,
  }));

const sidebarNav: { id: TabId; label: string; path: string }[] = [
  { id: "overview", label: "Overview", path: "M4 6h16M4 12h16M4 18h7" },
  { id: "schedule", label: "Schedule", path: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { id: "stats", label: "Statistics", path: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  {
    id: "reviews",
    label: "Reviews",
    path:
      "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  },
];

export default function DoctorProfileDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabId>("overview");
  const [loading, setLoading] = useState(true);
  const [apiProfile, setApiProfile] = useState<DoctorProfileDto | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [scheduleDraft, setScheduleDraft] = useState<DoctorScheduleSlotDto[]>(defaultSchedule);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const p = await doctorService.getProfile();
    setApiProfile(p);
    if (p?.schedule?.length) {
      setScheduleDraft(p.schedule);
    } else {
      setScheduleDraft(defaultSchedule());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const display = useMemo(() => {
    const name =
      apiProfile?.fullName?.trim() ||
      user?.username?.trim() ||
      user?.email?.split("@")[0] ||
      "Doctor";
    const email = apiProfile?.email ?? user?.email ?? "";
    const specialty = apiProfile?.specialty?.trim() || "";
    const years = apiProfile?.yearsOfExperience ?? 0;
    const rating = apiProfile?.averageRating ?? 0;
    const avatar = readLocalAvatarDataUrl() ?? apiProfile?.profileImageUrl;
    const bio =
      apiProfile?.bio?.trim() ||
      "No biography yet. Complete your profile so patients can understand your expertise.";
    const education: DoctorEducationDto[] = apiProfile?.education?.length ? apiProfile.education : [];
    const experience: DoctorExperienceDto[] = apiProfile?.experience?.length ? apiProfile.experience : [];
    const achievements: DoctorAchievementDto[] = apiProfile?.achievements?.length ? apiProfile.achievements : [];
    const hasSpecialty =
      !!specialty && specialty.trim().length >= 2 && specialty !== "—";
    const needsCompletion = !apiProfile?.isProfileComplete || !hasSpecialty;
    const degrees = apiProfile?.degrees?.trim() || "";
    const clinicName = apiProfile?.clinicName?.trim() || "";
    const consultationFee = apiProfile?.consultationFee?.trim() || "";
    const shortId = apiProfile?.id ? String(apiProfile.id).slice(0, 8).toUpperCase() : formatShortId(email || name);

    return {
      name,
      email,
      specialty: specialty || "—",
      years,
      rating,
      avatar,
      bio,
      education,
      experience,
      achievements,
      needsCompletion,
      phone: apiProfile?.phoneNumber ?? "",
      degrees,
      clinicName,
      consultationFee,
      shortId,
      reviewsCount: apiProfile?.reviewsCount ?? 0,
    };
  }, [apiProfile, user]);

  const stats = apiProfile?.stats;
  const reviews: DoctorReviewDto[] = apiProfile?.reviews ?? [];

  const chartLabels = stats?.chartLabels?.length
    ? stats.chartLabels
    : ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const chartValues = stats?.chartValues?.length ? stats.chartValues : [12, 19, 15, 22, 18, 24];

  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    setSaveMsg(null);
    const updated = await doctorService.updateProfile({ schedule: scheduleDraft });
    if (updated) {
      setApiProfile(updated);
      setSaveMsg("Schedule saved.");
    } else {
      setSaveMsg("Could not save — check your API route and permissions.");
    }
    setSavingSchedule(false);
  };

  const statCards = [
    {
      label: "Total patients",
      value: stats?.patientsCount ?? 0,
      hint: "+12% vs last month",
      accent: PRIMARY,
      filled: true,
      icon:
        "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    },
    {
      label: "Bookings",
      value: stats?.bookingsCount ?? 0,
      hint: "+8% vs last month",
      accent: TEXT,
      filled: false,
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
    },
    {
      label: "Cases",
      value: stats?.casesCount ?? 0,
      hint: "+3% vs last month",
      accent: TEXT,
      filled: false,
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    },
    {
      label: "Avg. rating",
      value: display.rating > 0 ? display.rating.toFixed(1) : "—",
      hint: display.reviewsCount ? `${display.reviewsCount} reviews` : "No reviews yet",
      accent: TEXT,
      filled: false,
      icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.887a1 1 0 00-1.176 0l-3.976 2.887c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen" dir="ltr" style={{ background: BG }}>
      <Navbar />

      <div className="flex flex-1 min-h-0">
        {/* Sidebar — desktop */}
        <aside
          className="hidden md:flex flex-col w-56 shrink-0 border-r border-gray-200/80 bg-white py-6 px-3"
          style={{ boxShadow: "4px 0 24px rgba(15,23,42,0.04)" }}
        >
          <div className="px-2 mb-6 flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white"
              style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 m-0 uppercase tracking-wider">Workspace</p>
              <p className="text-sm font-extrabold m-0" style={{ color: TEXT }}>
                Doctor
              </p>
            </div>
          </div>
          <nav className="flex flex-col gap-1">
            {sidebarNav.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  tab === item.id ? "text-white shadow-md" : "text-gray-600 hover:bg-gray-50"
                }`}
                style={tab === item.id ? { background: `linear-gradient(135deg, ${PRIMARY}, #1565C0)` } : undefined}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.path} />
                </svg>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="mt-auto pt-6 border-t border-gray-100">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 no-underline"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Back to site
            </Link>
          </div>
        </aside>

        <main className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] w-full mx-auto">
            {/* Mobile tab chips */}
            <div className="flex md:hidden gap-2 overflow-x-auto pb-4 mb-2 -mx-1 px-1">
              {sidebarNav.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold border ${
                    tab === item.id ? "text-white border-transparent" : "bg-white text-gray-600 border-gray-200"
                  }`}
                  style={tab === item.id ? { background: PRIMARY } : undefined}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Hero header */}
            <section
              className="relative overflow-hidden rounded-3xl border border-gray-100/80 mb-6"
              style={{ boxShadow: "0 8px 40px rgba(15,23,42,0.06)" }}
            >
              <div
                className="absolute inset-0 opacity-90"
                style={{
                  background: `
                    radial-gradient(ellipse 80% 60% at 100% 0%, rgba(30,136,229,0.2), transparent 55%),
                    radial-gradient(ellipse 60% 50% at 0% 100%, rgba(38,166,154,0.18), transparent 50%),
                    linear-gradient(135deg, #f8fafc 0%, #ffffff 45%, #f1f5f9 100%)
                  `,
                }}
              />
              <div
                className="absolute inset-0 opacity-[0.07] pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231e88e5' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
              <div className="relative p-6 md:p-10 flex flex-col lg:flex-row gap-8 lg:items-center lg:justify-between">
                {loading ? (
                  <div className="flex justify-center w-full py-12">
                    <div
                      className="h-12 w-12 rounded-full border-4 border-t-transparent animate-spin"
                      style={{ borderColor: `${PRIMARY} transparent transparent transparent` }}
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center flex-1 min-w-0">
                      <div
                        className="w-32 h-32 rounded-2xl flex-shrink-0 overflow-hidden border-[3px] border-white shadow-lg flex items-center justify-center text-3xl font-extrabold text-white"
                        style={{
                          boxShadow: "0 12px 40px rgba(30,136,229,0.25)",
                          background: display.avatar ? undefined : `linear-gradient(145deg, ${PRIMARY}, ${SECONDARY})`,
                        }}
                      >
                        {display.avatar ? (
                          <img src={display.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          initialsFrom(display.name)
                        )}
                      </div>
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight m-0" style={{ color: TEXT }}>
                            Dr. {display.name}
                          </h1>
                          <span
                            className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                            style={{ background: "rgba(38,166,154,0.15)", color: "#0D5C52" }}
                          >
                            Available
                          </span>
                        </div>
                        <p className="text-base font-semibold m-0" style={{ color: PRIMARY }}>
                          {display.specialty}
                        </p>
                        {display.degrees ? (
                          <p className="text-sm text-gray-600 m-0">{display.degrees}</p>
                        ) : (
                          <p className="text-sm text-gray-400 m-0 italic">Add degrees in your profile (API field: degrees)</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs font-semibold text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            ID <span className="text-gray-800">#{display.shortId}</span>
                          </span>
                          {display.clinicName && (
                            <span className="inline-flex items-center gap-1">
                              · {display.clinicName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-stretch lg:items-end gap-4 shrink-0">
                      {display.consultationFee ? (
                        <div className="text-right">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide m-0">Consultation</p>
                          <p className="text-2xl font-extrabold m-0" style={{ color: TEXT }}>
                            {display.consultationFee}
                          </p>
                        </div>
                      ) : null}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          type="button"
                          onClick={() => setEditOpen(true)}
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-95 shadow-lg"
                          style={{
                            background: `linear-gradient(135deg, ${PRIMARY}, #1565C0)`,
                            boxShadow: "0 10px 28px rgba(30,136,229,0.35)",
                          }}
                        >
                          Edit profile
                        </button>
                        <button
                          type="button"
                          onClick={() => setTab("schedule")}
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold border-2 bg-white/80 hover:bg-white transition-all"
                          style={{ borderColor: SECONDARY, color: SECONDARY }}
                        >
                          Manage schedule
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>

            {display.needsCompletion && !loading && (
              <div
                className="mb-6 rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border"
                style={{ background: "rgba(38,166,154,0.08)", borderColor: "rgba(38,166,154,0.35)" }}
              >
                <p className="text-sm font-semibold m-0" style={{ color: "#0D5C52" }}>
                  Only registration data is visible. Complete your professional profile for a full public-facing page.
                </p>
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="text-sm font-bold px-4 py-2 rounded-xl text-white shrink-0"
                  style={{ background: SECONDARY }}
                >
                  Complete profile
                </button>
              </div>
            )}

            {/* KPI row */}
            {!loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                {statCards.map((c) => (
                  <div
                    key={c.label}
                    className="rounded-2xl p-5 flex items-start justify-between gap-3 border border-gray-100/80 transition-transform hover:-translate-y-0.5"
                    style={{
                      background: c.filled ? `linear-gradient(135deg, ${PRIMARY}, #1565C0)` : "#fff",
                      boxShadow: c.filled ? "0 12px 32px rgba(30,136,229,0.28)" : "0 4px 20px rgba(15,23,42,0.05)",
                      color: c.filled ? "#fff" : TEXT,
                    }}
                  >
                    <div>
                      <p
                        className={`text-xs font-bold uppercase tracking-wide m-0 ${c.filled ? "text-white/80" : "text-gray-400"}`}
                      >
                        {c.label}
                      </p>
                      <p className="text-3xl font-extrabold m-0 mt-1">{c.value}</p>
                      <p className={`text-xs font-semibold m-0 mt-2 ${c.filled ? "text-emerald-100" : "text-gray-400"}`}>
                        {c.hint}
                      </p>
                    </div>
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: c.filled ? "rgba(255,255,255,0.2)" : `${c.accent}12`,
                        color: c.filled ? "#fff" : c.accent,
                      }}
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={c.icon} />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab content */}
            <div className="space-y-6 pb-12">
              {tab === "overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div
                    className="lg:col-span-2 rounded-3xl bg-white p-6 md:p-8 border border-gray-100"
                    style={{ boxShadow: "0 4px 24px rgba(15,23,42,0.05)" }}
                  >
                    <h2 className="text-lg font-extrabold mb-4 flex items-center gap-2 m-0" style={{ color: TEXT }}>
                      <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(30,136,229,0.12)", color: PRIMARY }}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </span>
                      Short bio
                    </h2>
                    <p className="text-gray-600 leading-relaxed m-0">{display.bio}</p>
                  </div>
                  <div
                    className="rounded-3xl bg-white p-6 border border-gray-100"
                    style={{ boxShadow: "0 4px 24px rgba(15,23,42,0.05)" }}
                  >
                    <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider m-0">Contact</h3>
                    <ul className="space-y-4 text-sm m-0 p-0 list-none">
                      <li className="flex items-start gap-3">
                        <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-gray-50 text-gray-500">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </span>
                        <span className="break-all text-gray-700 pt-1">{display.email}</span>
                      </li>
                      {display.phone && (
                        <li className="flex items-start gap-3">
                          <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-gray-50 text-gray-500">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </span>
                          <span className="text-gray-700 pt-1">{display.phone}</span>
                        </li>
                      )}
                      <li className="flex items-start gap-3">
                        <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-gray-50 text-gray-500">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </span>
                        <span className="text-gray-700 pt-1">
                          {display.years > 0 ? `${display.years}+ years experience` : "Experience not set"}
                        </span>
                      </li>
                    </ul>
                    <Link to="/appointment" className="mt-6 inline-flex items-center gap-2 text-sm font-bold no-underline" style={{ color: PRIMARY }}>
                      Open appointments
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>

                  <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <div className="rounded-3xl bg-white p-6 md:p-8 border border-gray-100" style={{ boxShadow: "0 4px 24px rgba(15,23,42,0.05)" }}>
                      <h2 className="text-lg font-extrabold mb-4 flex items-center gap-2 m-0" style={{ color: TEXT }}>
                        <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(38,166,154,0.12)", color: SECONDARY }}>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                          </svg>
                        </span>
                        Education
                      </h2>
                      {display.education.length === 0 ? (
                        <p className="text-gray-500 m-0">No education entries yet.</p>
                      ) : (
                        <ul className="space-y-4 m-0 p-0 list-none">
                          {display.education.map((e, i) => (
                            <li key={e.id ?? i} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                              <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white text-sm" style={{ background: PRIMARY }}>
                                {i + 1}
                              </div>
                              <div>
                                <p className="font-bold m-0" style={{ color: TEXT }}>{e.degree ?? "—"}</p>
                                <p className="text-sm text-gray-500 m-0 mt-1">{e.university ?? ""}</p>
                                {e.year != null && <p className="text-xs text-gray-400 m-0 mt-1">{e.year}</p>}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="rounded-3xl bg-white p-6 md:p-8 border border-gray-100" style={{ boxShadow: "0 4px 24px rgba(15,23,42,0.05)" }}>
                      <h2 className="text-lg font-extrabold mb-4 flex items-center gap-2 m-0" style={{ color: TEXT }}>
                        <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(30,136,229,0.12)", color: PRIMARY }}>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </span>
                        Experience
                      </h2>
                      {display.experience.length === 0 ? (
                        <p className="text-gray-500 m-0">No experience entries yet.</p>
                      ) : (
                        <ul className="space-y-4 m-0 p-0 list-none">
                          {display.experience.map((x, i) => (
                            <li key={x.id ?? i} className="rounded-2xl p-4" style={{ background: "#F8FAFC" }}>
                              <p className="font-bold m-0" style={{ color: TEXT }}>{x.hospitalOrClinic ?? "—"}</p>
                              <p className="text-sm text-gray-600 m-0 mt-1">
                                {x.years != null ? `${x.years} yrs` : ""}
                                {x.role ? ` · ${x.role}` : ""}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="rounded-3xl bg-white p-6 md:p-8 border border-gray-100 md:col-span-2 xl:col-span-1" style={{ boxShadow: "0 4px 24px rgba(15,23,42,0.05)" }}>
                      <h2 className="text-lg font-extrabold mb-4 flex items-center gap-2 m-0" style={{ color: TEXT }}>
                        <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.1)", color: "#7C3AED" }}>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                        </span>
                        Certificates & achievements
                      </h2>
                      {display.achievements.length === 0 ? (
                        <p className="text-gray-500 m-0">No certificates or awards added yet.</p>
                      ) : (
                        <ul className="space-y-4 m-0 p-0 list-none">
                          {display.achievements.map((a, i) => (
                            <li key={a.id ?? i} className="rounded-2xl p-4 border border-gray-100" style={{ background: "#FAFBFC" }}>
                              <p className="font-bold m-0" style={{ color: TEXT }}>{a.title ?? "—"}</p>
                              {a.issuer && <p className="text-sm text-gray-600 m-0 mt-1">{a.issuer}</p>}
                              {a.year != null && <p className="text-xs text-gray-400 m-0 mt-1">{a.year}</p>}
                              {a.description && <p className="text-sm text-gray-500 m-0 mt-2 leading-relaxed">{a.description}</p>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {tab === "schedule" && (
                <div className="rounded-3xl bg-white p-6 md:p-8 border border-gray-100" style={{ boxShadow: "0 4px 24px rgba(15,23,42,0.05)" }}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-xl font-extrabold m-0" style={{ color: TEXT }}>
                        Weekly schedule
                      </h2>
                      <p className="text-sm text-gray-500 m-0 mt-1">
                        Edit working hours and save. Persisted via your profile API.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={savingSchedule}
                      onClick={() => void handleSaveSchedule()}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
                      style={{ background: PRIMARY }}
                    >
                      {savingSchedule ? "Saving…" : "Save schedule"}
                    </button>
                  </div>
                  {saveMsg && (
                    <p className="text-sm font-semibold mb-4" style={{ color: saveMsg.includes("Could not") ? "#B91C1C" : SECONDARY }}>
                      {saveMsg}
                    </p>
                  )}
                  <div className="overflow-x-auto rounded-2xl border border-gray-100">
                    <table className="min-w-full text-sm text-left">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 font-bold text-gray-700">Day</th>
                          <th className="px-4 py-3 font-bold text-gray-700">From</th>
                          <th className="px-4 py-3 font-bold text-gray-700">To</th>
                          <th className="px-4 py-3 font-bold text-gray-700 text-center">Available</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scheduleDraft.map((row, idx) => (
                          <tr key={row.dayOfWeek} className="border-t border-gray-100">
                            <td className="px-4 py-3 font-semibold whitespace-nowrap">{EN_DAYS[row.dayOfWeek] ?? row.dayName}</td>
                            <td className="px-4 py-2">
                              <input
                                type="time"
                                className="w-full rounded-lg border border-gray-200 px-2 py-1.5"
                                value={row.startTime}
                                onChange={(e) => {
                                  const next = [...scheduleDraft];
                                  next[idx] = { ...row, startTime: e.target.value };
                                  setScheduleDraft(next);
                                }}
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="time"
                                className="w-full rounded-lg border border-gray-200 px-2 py-1.5"
                                value={row.endTime}
                                onChange={(e) => {
                                  const next = [...scheduleDraft];
                                  next[idx] = { ...row, endTime: e.target.value };
                                  setScheduleDraft(next);
                                }}
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                className="w-5 h-5"
                                style={{ accentColor: PRIMARY }}
                                checked={row.isAvailable !== false}
                                onChange={(e) => {
                                  const next = [...scheduleDraft];
                                  next[idx] = { ...row, isAvailable: e.target.checked };
                                  setScheduleDraft(next);
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {tab === "stats" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="rounded-3xl bg-white p-6 md:p-8 border border-gray-100" style={{ boxShadow: "0 4px 24px rgba(15,23,42,0.05)" }}>
                      <div className="flex items-center justify-between gap-4 mb-4">
                        <h2 className="text-lg font-extrabold m-0" style={{ color: TEXT }}>
                          Booking trend
                        </h2>
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-600">This month</span>
                      </div>
                      <p className="text-sm text-gray-500 m-0 mb-4">
                        Line chart from <code className="text-xs bg-gray-100 px-1 rounded">stats.chartLabels</code> &{" "}
                        <code className="text-xs bg-gray-100 px-1 rounded">chartValues</code>, or demo data.
                      </p>
                      <LineChart labels={chartLabels} values={chartValues} />
                    </div>
                    <div className="rounded-3xl bg-white p-6 md:p-8 border border-gray-100" style={{ boxShadow: "0 4px 24px rgba(15,23,42,0.05)" }}>
                      <h2 className="text-lg font-extrabold mb-4 m-0" style={{ color: TEXT }}>
                        Volume comparison
                      </h2>
                      <p className="text-sm text-gray-500 m-0 mb-4">Bar view of the same series.</p>
                      <BarChartMini labels={chartLabels} values={chartValues} />
                    </div>
                  </div>
                </div>
              )}

              {tab === "reviews" && (
                <ReviewsPanel
                  reviews={reviews}
                  averageRating={display.rating}
                  totalCount={Math.max(display.reviewsCount, reviews.length)}
                />
              )}
            </div>
          </div>
        </main>
      </div>

      <Footer />

      {editOpen && (
        <EditProfileModal
          open={editOpen}
          profile={apiProfile}
          displayNameFallback={display.name}
          onClose={() => setEditOpen(false)}
          onSaved={(p) => {
            setApiProfile(p);
            setEditOpen(false);
            void load();
          }}
        />
      )}
    </div>
  );
}

function ReviewsPanel({
  reviews,
  averageRating,
  totalCount,
}: {
  reviews: DoctorReviewDto[];
  averageRating: number;
  totalCount: number;
}) {
  const [filterStars, setFilterStars] = useState<"all" | 5 | 4 | 3 | 2 | 1>("all");
  const [sortBy, setSortBy] = useState<"newest" | "highest" | "lowest">("newest");
  const [query, setQuery] = useState("");
  const [helpful, setHelpful] = useState<Record<string, boolean>>({});

  const distribution = useMemo(() => {
    const d = [0, 0, 0, 0, 0];
    reviews.forEach((r) => {
      const s = Math.min(5, Math.max(1, Math.round(r.rating)));
      d[s - 1] += 1;
    });
    return d;
  }, [reviews]);

  const maxDist = Math.max(1, ...distribution);

  const filtered = useMemo(() => {
    let list = [...reviews];
    if (filterStars !== "all") {
      list = list.filter((r) => Math.round(r.rating) === filterStars);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          (r.patientName ?? "").toLowerCase().includes(q) ||
          (r.comment ?? "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (sortBy === "newest") return tb - ta;
      if (sortBy === "highest") return b.rating - a.rating;
      return a.rating - b.rating;
    });
    return list;
  }, [reviews, filterStars, query, sortBy]);

  const hasNoReviews = reviews.length === 0;

  const toggleHelpful = (id: string) => {
    setHelpful((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const fmtDate = (iso?: string) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return iso;
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      <div className="xl:col-span-4 space-y-6">
        <div className="rounded-3xl bg-white p-6 border border-gray-100" style={{ boxShadow: "0 4px 24px rgba(15,23,42,0.05)" }}>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider m-0 mb-4">Overall score</p>
          <div className="flex items-end gap-4">
            <span className="text-5xl font-black leading-none" style={{ color: TEXT }}>
              {averageRating > 0 ? averageRating.toFixed(1) : "—"}
            </span>
            <div>
              <StarRow value={averageRating} size={22} />
              <p className="text-sm text-gray-500 m-0 mt-2">
                {totalCount || reviews.length} verified ratings
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = distribution[star - 1] ?? 0;
              const pct = (count / maxDist) * 100;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFilterStars(filterStars === star ? "all" : (star as 5 | 4 | 3 | 2 | 1))}
                  className="w-full flex items-center gap-3 text-left group"
                >
                  <span className="text-xs font-bold text-gray-500 w-8">{star}★</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all group-hover:opacity-90"
                      style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${PRIMARY}, ${SECONDARY})` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-500 w-6 text-right">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl p-5 border border-dashed border-gray-200 bg-white/60">
          <p className="text-xs font-bold text-gray-500 m-0">
            Tip: backend can send <code className="text-[11px] bg-gray-100 px-1 rounded">verified</code>,{" "}
            <code className="text-[11px] bg-gray-100 px-1 rounded">visitType</code>, and{" "}
            <code className="text-[11px] bg-gray-100 px-1 rounded">helpfulCount</code> per review.
          </p>
        </div>
      </div>

      <div className="xl:col-span-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap gap-2">
            {(["all", 5, 4, 3] as const).map((f) => (
              <button
                key={String(f)}
                type="button"
                onClick={() => setFilterStars(f === "all" ? "all" : f)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  (f === "all" && filterStars === "all") || f === filterStars
                    ? "text-white border-transparent"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
                style={
                  (f === "all" && filterStars === "all") || f === filterStars ? { background: PRIMARY } : undefined
                }
              >
                {f === "all" ? "All" : `${f} stars`}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-xs font-bold rounded-xl border border-gray-200 px-3 py-2 bg-white text-gray-700"
            >
              <option value="newest">Newest</option>
              <option value="highest">Highest rated</option>
              <option value="lowest">Lowest rated</option>
            </select>
          </div>
        </div>

        <div className="relative">
          <input
            type="search"
            placeholder="Search by patient or keyword…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 pl-10 pr-4 py-3 text-sm font-medium text-gray-800 shadow-sm"
          />
          <svg
            className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {hasNoReviews ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center" style={{ boxShadow: "0 4px 24px rgba(15,23,42,0.05)" }}>
            <p className="text-gray-700 m-0 font-bold text-lg">No reviews yet</p>
            <p className="text-gray-500 m-0 mt-2 text-sm max-w-md mx-auto">
              When patients leave feedback, it will appear here with filters, search, and helpful votes.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center" style={{ boxShadow: "0 4px 24px rgba(15,23,42,0.05)" }}>
            <p className="text-gray-500 m-0 font-medium">No reviews match your filters.</p>
          </div>
        ) : (
          <ul className="space-y-4 m-0 p-0 list-none">
            {filtered.map((r, i) => {
              const id = r.id ?? `rv-${i}`;
              const marked = helpful[id];
              return (
                <li
                  key={id}
                  className="rounded-3xl p-5 md:p-6 border border-gray-100 bg-white hover:shadow-md transition-shadow"
                  style={{ boxShadow: "0 2px 16px rgba(15,23,42,0.04)" }}
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center text-sm font-extrabold text-white"
                      style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` }}
                    >
                      {initialsFrom(r.patientName ?? "Patient")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-extrabold text-gray-900">{r.patientName ?? "Patient"}</span>
                        {r.verified && (
                          <span
                            className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(38,166,154,0.15)", color: "#0D5C52" }}
                          >
                            Verified visit
                          </span>
                        )}
                        {r.visitType && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {r.visitType}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mb-3">
                        <StarRow value={r.rating} size={16} />
                        <span>{fmtDate(r.createdAt)}</span>
                      </div>
                      {r.comment ? (
                        <p className="text-gray-600 leading-relaxed m-0 text-sm md:text-base">{r.comment}</p>
                      ) : (
                        <p className="text-gray-400 italic text-sm m-0">No written comment.</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => toggleHelpful(id)}
                          className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border transition-all ${
                            marked ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 0 .714-.211 1.412-.608l2.006-1.134M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                          </svg>
                          Helpful
                          {(r.helpfulCount != null || marked) && (
                            <span className="text-gray-400 font-semibold">
                              ({(r.helpfulCount ?? 0) + (marked ? 1 : 0)})
                            </span>
                          )}
                        </button>
                        <span className="text-xs text-gray-400">Reply coming soon</span>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function normalizeEducation(rows: DoctorEducationDto[]): DoctorEducationDto[] {
  return rows
    .map((r) => ({
      ...r,
      degree: r.degree?.trim() || undefined,
      university: r.university?.trim() || undefined,
      year:
        r.year === undefined || r.year === null || Number.isNaN(Number(r.year))
          ? undefined
          : Number(r.year),
    }))
    .filter((r) => !!(r.degree || r.university || r.year != null));
}

function normalizeExperience(rows: DoctorExperienceDto[]): DoctorExperienceDto[] {
  return rows
    .map((r) => ({
      ...r,
      hospitalOrClinic: r.hospitalOrClinic?.trim() || undefined,
      role: r.role?.trim() || undefined,
      years:
        r.years === undefined || r.years === null || Number.isNaN(Number(r.years))
          ? undefined
          : Number(r.years),
    }))
    .filter((r) => !!(r.hospitalOrClinic || r.role || r.years != null));
}

function normalizeAchievements(rows: DoctorAchievementDto[]): DoctorAchievementDto[] {
  return rows
    .map((r) => ({
      ...r,
      title: r.title?.trim() || undefined,
      issuer: r.issuer?.trim() || undefined,
      description: r.description?.trim() || undefined,
      year:
        r.year === undefined || r.year === null || Number.isNaN(Number(r.year))
          ? undefined
          : Number(r.year),
    }))
    .filter((r) => !!(r.title || r.issuer || r.description || r.year != null));
}

function EditProfileModal({
  open,
  profile,
  displayNameFallback,
  onClose,
  onSaved,
}: {
  open: boolean;
  profile: DoctorProfileDto | null;
  displayNameFallback: string;
  onClose: () => void;
  onSaved: (p: DoctorProfileDto | null) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [yearsStr, setYearsStr] = useState("");
  const [bio, setBio] = useState("");
  const [degrees, setDegrees] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [consultationFee, setConsultationFee] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  /** 'none' | 'removed' | data URL for new upload */
  const [avatarChange, setAvatarChange] = useState<"none" | "removed" | string>("none");
  const [educationRows, setEducationRows] = useState<DoctorEducationDto[]>([]);
  const [experienceRows, setExperienceRows] = useState<DoctorExperienceDto[]>([]);
  const [achievementRows, setAchievementRows] = useState<DoctorAchievementDto[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const p = profile;
    setFullName((p?.fullName ?? displayNameFallback).trim() || displayNameFallback);
    setSpecialty(p?.specialty?.trim() ?? "");
    setYearsStr(p?.yearsOfExperience != null ? String(p.yearsOfExperience) : "");
    setBio(p?.bio?.trim() ?? "");
    setDegrees(p?.degrees?.trim() ?? "");
    setClinicName(p?.clinicName?.trim() ?? "");
    setConsultationFee(p?.consultationFee?.trim() ?? "");
    const existing = readLocalAvatarDataUrl() ?? p?.profileImageUrl ?? null;
    setAvatarPreview(existing);
    setAvatarChange("none");
    setEducationRows(p?.education?.length ? p.education.map((e) => ({ ...e })) : []);
    setExperienceRows(p?.experience?.length ? p.experience.map((e) => ({ ...e })) : []);
    setAchievementRows(p?.achievements?.length ? p.achievements.map((e) => ({ ...e })) : []);
  }, [open, profile, displayNameFallback]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 2.5 * 1024 * 1024) {
      window.alert("Please choose an image under 2.5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : null;
      if (dataUrl) {
        setAvatarPreview(dataUrl);
        setAvatarChange(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const removeAvatar = () => {
    setAvatarPreview(null);
    setAvatarChange("removed");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (avatarChange === "removed") {
        writeLocalAvatarDataUrl(null);
      } else if (avatarChange !== "none" && typeof avatarChange === "string") {
        writeLocalAvatarDataUrl(avatarChange);
      }
      const y = yearsStr.trim();
      const body: Partial<DoctorProfileDto> = {
        fullName: fullName.trim(),
        specialty: specialty.trim(),
        yearsOfExperience: y === "" ? undefined : Number(y),
        bio: bio.trim(),
        degrees: degrees.trim() || undefined,
        clinicName: clinicName.trim() || undefined,
        consultationFee: consultationFee.trim() || undefined,
        isProfileComplete: true,
        education: normalizeEducation(educationRows),
        experience: normalizeExperience(experienceRows),
        achievements: normalizeAchievements(achievementRows),
      };
      const result = await doctorService.updateProfile(body);
      onSaved(result);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="dialog" aria-modal>
      <button
        type="button"
        className="absolute inset-0 bg-black/45 border-0 cursor-default w-full h-full"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-extrabold m-0" style={{ color: TEXT }}>
            Edit profile
          </h2>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-2xl overflow-hidden border-2 flex items-center justify-center text-lg font-extrabold text-white flex-shrink-0"
              style={{
                borderColor: "#BBDEFB",
                background: avatarPreview ? undefined : `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})`,
              }}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                initialsFrom(fullName || displayNameFallback)
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-700">Profile photo</label>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-bold text-white cursor-pointer"
                  style={{ background: PRIMARY }}
                >
                  Upload
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
                {(avatarPreview || readLocalAvatarDataUrl()) && (
                  <button type="button" onClick={removeAvatar} className="px-4 py-2 rounded-xl text-sm font-bold border border-gray-200 text-gray-600 hover:bg-gray-50">
                    Remove photo
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 m-0">Stored locally until your API supports image upload.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Display name</label>
            <input
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Specialty</label>
            <input
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
              placeholder="e.g. Colorectal oncology"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Degrees</label>
            <input
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
              placeholder="e.g. MBBS, MD"
              value={degrees}
              onChange={(e) => setDegrees(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Clinic</label>
              <input
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                placeholder="Clinic name"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Consultation fee</label>
              <input
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                placeholder="e.g. $499 / 30 min"
                value={consultationFee}
                onChange={(e) => setConsultationFee(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Years of experience</label>
            <input
              type="number"
              min={0}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
              value={yearsStr}
              onChange={(e) => setYearsStr(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Bio</label>
            <textarea
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm min-h-[100px]"
              placeholder="Short professional summary…"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold m-0" style={{ color: TEXT }}>
                Education
              </h3>
              <button
                type="button"
                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                onClick={() => setEducationRows((rows) => [...rows, {}])}
              >
                + Add entry
              </button>
            </div>
            {educationRows.length === 0 && <p className="text-xs text-gray-400 m-0">No entries — click Add entry.</p>}
            {educationRows.map((row, idx) => (
              <div key={idx} className="rounded-xl border border-gray-100 p-3 space-y-2 bg-gray-50/80">
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-xs font-semibold text-red-600 hover:underline"
                    onClick={() => setEducationRows((rows) => rows.filter((_, i) => i !== idx))}
                  >
                    Remove
                  </button>
                </div>
                <input
                  className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm"
                  placeholder="Degree (e.g. MD)"
                  value={row.degree ?? ""}
                  onChange={(e) => {
                    const next = [...educationRows];
                    next[idx] = { ...row, degree: e.target.value };
                    setEducationRows(next);
                  }}
                />
                <input
                  className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm"
                  placeholder="University / institution"
                  value={row.university ?? ""}
                  onChange={(e) => {
                    const next = [...educationRows];
                    next[idx] = { ...row, university: e.target.value };
                    setEducationRows(next);
                  }}
                />
                <input
                  type="number"
                  className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm"
                  placeholder="Year"
                  value={row.year === undefined || row.year === null ? "" : row.year}
                  onChange={(e) => {
                    const next = [...educationRows];
                    const v = e.target.value;
                    next[idx] = { ...row, year: v === "" ? undefined : Number(v) };
                    setEducationRows(next);
                  }}
                />
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold m-0" style={{ color: TEXT }}>
                Experience
              </h3>
              <button
                type="button"
                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                onClick={() => setExperienceRows((rows) => [...rows, {}])}
              >
                + Add entry
              </button>
            </div>
            {experienceRows.length === 0 && <p className="text-xs text-gray-400 m-0">No entries — click Add entry.</p>}
            {experienceRows.map((row, idx) => (
              <div key={idx} className="rounded-xl border border-gray-100 p-3 space-y-2 bg-gray-50/80">
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-xs font-semibold text-red-600 hover:underline"
                    onClick={() => setExperienceRows((rows) => rows.filter((_, i) => i !== idx))}
                  >
                    Remove
                  </button>
                </div>
                <input
                  className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm"
                  placeholder="Hospital / clinic"
                  value={row.hospitalOrClinic ?? ""}
                  onChange={(e) => {
                    const next = [...experienceRows];
                    next[idx] = { ...row, hospitalOrClinic: e.target.value };
                    setExperienceRows(next);
                  }}
                />
                <input
                  type="number"
                  className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm"
                  placeholder="Years"
                  value={row.years === undefined || row.years === null ? "" : row.years}
                  onChange={(e) => {
                    const next = [...experienceRows];
                    const v = e.target.value;
                    next[idx] = { ...row, years: v === "" ? undefined : Number(v) };
                    setExperienceRows(next);
                  }}
                />
                <input
                  className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm"
                  placeholder="Role (optional)"
                  value={row.role ?? ""}
                  onChange={(e) => {
                    const next = [...experienceRows];
                    next[idx] = { ...row, role: e.target.value };
                    setExperienceRows(next);
                  }}
                />
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold m-0" style={{ color: TEXT }}>
                Certificates, awards & achievements
              </h3>
              <button
                type="button"
                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                onClick={() => setAchievementRows((rows) => [...rows, {}])}
              >
                + Add entry
              </button>
            </div>
            <p className="text-xs text-gray-400 m-0">Optional — licenses, board certifications, prizes, etc.</p>
            {achievementRows.length === 0 && <p className="text-xs text-gray-400 m-0">No entries — click Add entry.</p>}
            {achievementRows.map((row, idx) => (
              <div key={idx} className="rounded-xl border border-gray-100 p-3 space-y-2 bg-gray-50/80">
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-xs font-semibold text-red-600 hover:underline"
                    onClick={() => setAchievementRows((rows) => rows.filter((_, i) => i !== idx))}
                  >
                    Remove
                  </button>
                </div>
                <input
                  className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm"
                  placeholder="Title"
                  value={row.title ?? ""}
                  onChange={(e) => {
                    const next = [...achievementRows];
                    next[idx] = { ...row, title: e.target.value };
                    setAchievementRows(next);
                  }}
                />
                <input
                  className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm"
                  placeholder="Issuing organization"
                  value={row.issuer ?? ""}
                  onChange={(e) => {
                    const next = [...achievementRows];
                    next[idx] = { ...row, issuer: e.target.value };
                    setAchievementRows(next);
                  }}
                />
                <input
                  type="number"
                  className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm"
                  placeholder="Year"
                  value={row.year === undefined || row.year === null ? "" : row.year}
                  onChange={(e) => {
                    const next = [...achievementRows];
                    const v = e.target.value;
                    next[idx] = { ...row, year: v === "" ? undefined : Number(v) };
                    setAchievementRows(next);
                  }}
                />
                <textarea
                  className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm min-h-[56px]"
                  placeholder="Short description (optional)"
                  value={row.description ?? ""}
                  onChange={(e) => {
                    const next = [...achievementRows];
                    next[idx] = { ...row, description: e.target.value };
                    setAchievementRows(next);
                  }}
                />
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 m-0">
            Profile data is saved locally if the server is unavailable; align field names with your backend when ready.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl font-bold text-white disabled:opacity-60"
              style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` }}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
