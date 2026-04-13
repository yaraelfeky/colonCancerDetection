import React, { useEffect, useState } from "react";
import Container from "./Container";
import { useAuth } from "../../Context/AuthContext";
import { useDoctorProfile } from "../../Context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../../services/authService";
import { getEffectiveUserRole } from "../../utils/userRole";
import { readLocalAvatarDataUrl } from "../../utils/localDoctorProfile";
import {
  getUnreadNotificationCount,
  NOTIFICATIONS_UNREAD_EVENT,
} from "../../utils/notificationsUnread";

const navLinks = [
  { label: "Home", href: "/dashboard" },
  { label: "About", href: "/dashboard#about" },
  { label: "Diagnosis", href: "/dashboard#diagnosis" },
  { label: "Contact", href: "/dashboard#contact" },
];

const Navbar: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [doctorUiTick, setDoctorUiTick] = useState(0);
  const [notifTick, setNotifTick] = useState(0);

  useEffect(() => {
    const onProfile = () => setDoctorUiTick((n) => n + 1);
    window.addEventListener("colonai-local-profile-changed", onProfile);
    return () =>
      window.removeEventListener("colonai-local-profile-changed", onProfile);
  }, []);

  useEffect(() => {
    const onNotif = () => setNotifTick((n) => n + 1);
    window.addEventListener(NOTIFICATIONS_UNREAD_EVENT, onNotif);
    return () =>
      window.removeEventListener(NOTIFICATIONS_UNREAD_EVENT, onNotif);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const doctorProfile = useDoctorProfile();
  const isDoctor = getEffectiveUserRole(authService.getToken()) === "doctor";

  const doctorAvatarUrl =
    readLocalAvatarDataUrl() ?? doctorProfile?.profileImageUrl ?? undefined;
  const doctorDisplayName =
    doctorProfile?.fullName?.trim() ||
    user?.username?.trim() ||
    user?.email?.split("@")[0] ||
    "Doctor";

  const services = [
    { label: "Patient", href: "/patient" },
    { label: "Appointment", href: "/appointments" },
    ...(isDoctor
      ? []
      : ([{ label: "Notifications", href: "/notifications" }] as const)),
    { label: "Report History", href: "/reports" },
    { label: "Settings", href: "/settings" },
  ];

  const unreadNotifications = getUnreadNotificationCount();

  void doctorUiTick;
  void notifTick;

  return (
    <header className="w-full sticky top-0 z-50">
      {/* ── Top Info Bar ── */}
      <div className="w-full bg-[#EBF3FC]">
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2 min-h-[3.25rem] py-2 sm:py-0 sm:h-20 sm:gap-4">
            {/* Logo */}
            <Link
              to="/dashboard"
              className="flex items-center gap-2 sm:gap-2.5 min-w-0 max-w-[min(52%,11rem)] sm:max-w-none select-none"
            >
              {/* Medical cross icon */}
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 border-[#1E88E5] flex-shrink-0"
                style={{ background: "white" }}
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-[#1E88E5]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-6 15h-2v-5H6v-2h5V6h2v5h5v2h-5v5z" />
                </svg>
              </div>
              <span
                className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight truncate"
                style={{ color: "#1E3A6E", letterSpacing: "-0.5px" }}
              >
                ColonAI
              </span>
            </Link>

            <div className="flex w-full min-w-0 sm:w-auto sm:flex-1 flex-wrap items-center justify-end gap-x-1 gap-y-1.5 sm:gap-x-3 md:gap-x-4">
              {/* CTA — compact on small phones, full from md */}
              <a
                href="#diagnosis"
                className="inline-flex md:hidden no-underline items-center px-2 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold text-white transition-all active:scale-95 shrink-0"
                style={{
                  background: "#1E88E5",
                  boxShadow: "0 2px 10px rgba(30,136,229,0.35)",
                }}
              >
                Diagnosis
              </a>
              <a
                href="#diagnosis"
                className="hidden md:inline-flex no-underline items-center gap-2 px-3 py-2 rounded-2xl text-sm font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-95 flex-shrink-0"
                style={{
                  background: "#1E88E5",
                  boxShadow: "0 4px 16px rgba(30,136,229,0.4)",
                }}
              >
                Start Diagnosis
              </a>

              {isDoctor && (
                <div className="flex items-center gap-0.5 sm:gap-2 md:gap-3 shrink-0">
                  <Link
                    to="/settings"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-gray-200/80 text-[#1E3A6E] hover:bg-gray-300/90 transition-colors no-underline"
                    aria-label="Settings"
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </Link>
                  <Link
                    to="/notifications"
                    className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-gray-200/80 text-[#1E3A6E] hover:bg-gray-300/90 transition-colors no-underline"
                    aria-label="Notifications"
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    {unreadNotifications > 0 && (
                      <span
                        className="absolute top-1 right-1.5 sm:top-1.5 sm:right-2 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#1E88E5] ring-2 ring-[#EBF3FC]"
                        aria-hidden
                      />
                    )}
                  </Link>
                  <Link
                    to="/doctor/profile"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center overflow-hidden border-2 sm:border-[3px] border-[#1E88E5] bg-white shrink-0 no-underline"
                    title={doctorDisplayName}
                    aria-label="Doctor profile"
                  >
                    {doctorAvatarUrl ? (
                      <img
                        src={doctorAvatarUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] sm:text-xs font-extrabold text-[#1E88E5]">
                        {doctorDisplayName.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </Link>
                </div>
              )}

              {/* Logout — icon only on small screens */}
              <div className="flex items-center shrink-0">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 p-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-sm font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition-all duration-150 active:scale-95"
                  aria-label="Logout"
                >
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* ── Blue Nav Bar ── */}
      <div
        className="w-full flex items-center justify-between"
        style={{ background: "#1E88E5" }}
      >
        <Container>
          <div className="flex items-center py-3 justify-between">
            {/* Mobile: hamburger menu */}
            <button
              className="md:hidden p-2 text-white"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                {menuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>

            {/* Desktop nav links */}
            <nav className="hidden md:flex items-center h-full gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href === "/dashboard" ? "/dashboard" : link.href}
                  className="flex items-center px-5 no-underline text-sm font-bold tracking-wide text-white hover:bg-white/15 rounded-md p-2 transition-all duration-150"
                >
                  {link.label.toUpperCase()}
                </a>
              ))}

              {/* Services dropdown - Fixed to allow clicking on items */}
              <div className="relative ml-2">
                <button
                  type="button"
                  className="flex items-center px-5 no-underline text-sm font-bold tracking-wide text-white hover:bg-white/15 rounded-md p-2 transition-all duration-150"
                  onClick={() => setServicesOpen(!servicesOpen)}
                >
                  SERVICES
                  <svg
                    className="w-3 h-3 ml-1 transition-transform duration-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    style={{
                      transform: servicesOpen
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown menu - stays open when clicking on items */}
                <div
                  className={`absolute left-0 mt-2 w-56 bg-white rounded-md shadow-xl py-2 z-50 transition-all duration-200 ${servicesOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
                  style={{ pointerEvents: servicesOpen ? "auto" : "none" }}
                >
                  {services.map((item) => (
                    <Link
                      key={item.label}
                      to={item.href}
                      className="block px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-[#1E88E5] transition-colors duration-150"
                      onClick={() => setServicesOpen(false)}
                    >
                      {item.label.toUpperCase()}
                    </Link>
                  ))}
                </div>
              </div>
            </nav>

            {/* Right: Social icons */}
            <div className="hidden md:flex items-center gap-2 ml-auto">
              {[
                // Facebook
                <path
                  key="fb"
                  d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"
                />,
                // Twitter
                <path
                  key="tw"
                  d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"
                />,
                // Instagram
                <>
                  <rect
                    key="ig-rect"
                    x="2"
                    y="2"
                    width="20"
                    height="20"
                    rx="5"
                    ry="5"
                  />
                  <path
                    key="ig-path"
                    d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"
                  />
                  <line key="ig-line" x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </>,
                // Search
                <>
                  <circle key="s-circle" cx="11" cy="11" r="8" />
                  <line key="s-line" x1="21" y1="21" x2="16.65" y2="16.65" />
                </>,
              ].map((icon, i) => (
                <button
                  key={i}
                  className="w-9 h-9 rounded-full border border-white/40 flex items-center justify-center text-white hover:bg-white/20 transition-all duration-150"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    {icon}
                  </svg>
                </button>
              ))}
            </div>

            {/* Mobile: simple Diagnosis link */}
            <div className="md:hidden flex items-center gap-3 w-full justify-end">
              <a href="#diagnosis" className="text-white text-sm font-bold">
                Diagnosis
              </a>
            </div>
          </div>
        </Container>
      </div>

      {/* Mobile dropdown menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${menuOpen ? "max-h-96" : "max-h-0"}`}
        style={{ background: "#1565C0" }}
      >
        <Container>
          <div className="flex flex-col py-3 gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href === "/dashboard" ? "/dashboard" : link.href}
                className="px-4 py-2.5 text-sm font-bold text-white hover:bg-white/15 rounded-lg transition-all"
                onClick={() => setMenuOpen(false)}
              >
                {link.label.toUpperCase()}
              </a>
            ))}

            {/* Mobile Services submenu */}
            <div className="mt-2">
              <p className="px-4 py-1 text-xs font-bold text-white/60 uppercase">
                Services
              </p>
              {services.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="block px-6 py-2 text-sm font-semibold text-white hover:bg-white/15"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <a
              href="#diagnosis"
              className="mt-2 px-4 py-2.5 text-sm font-bold text-[#1E88E5] bg-white rounded-lg text-center"
              onClick={() => setMenuOpen(false)}
            >
              START DIAGNOSIS
            </a>
          </div>
        </Container>
      </div>
    </header>
  );
};

export default Navbar;
