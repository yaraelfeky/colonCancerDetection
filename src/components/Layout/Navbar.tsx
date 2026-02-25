import React, { useState } from "react";
import Container from "./Container";
import { useAuth } from "../../Context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const navLinks = [
  { label: "Home", href: "/dashboard" },
  { label: "About", href: "#about" },
  { label: "Diagnosis", href: "#diagnosis" },
  { label: "Contact", href: "#contact" },
];

const Navbar: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const services = [
    { label: "Patient", href: "/patient" },
    { label: "Appointment", href: "/appointment" },
    { label: "Notifications", href: "/notifications" },
    { label: "Report History", href: "/reports" },
    { label: "Settings", href: "/settings" },
  ];

  return (
    <header className="w-full sticky top-0 z-50">
      {/* ── Top Info Bar ── */}
      <div className="w-full bg-[#EBF3FC]">
        <Container>
          <div className="flex items-center justify-between h-20 gap-4">
            {/* Logo */}
            <Link
              to="/dashboard"
              className="flex items-center gap-2.5 flex-shrink-0 select-none"
            >
              {/* Medical cross icon */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-[#1E88E5]"
                style={{ background: "white" }}
              >
                <svg
                  className="w-5 h-5 text-[#1E88E5]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-6 15h-2v-5H6v-2h5V6h2v5h5v2h-5v5z" />
                </svg>
              </div>
              <span
                className="text-2xl font-extrabold tracking-tight"
                style={{ color: "#1E3A6E", letterSpacing: "-0.5px" }}
              >
                ColonAI
              </span>
            </Link>

            <div className="flex gap-4">
              {/* CTA Button */}
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
              {/* Right: welcome + logout */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition-all duration-150 active:scale-95"
                >
                  <svg
                    className="w-4 h-4"
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
                  Logout
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
                  className="flex items-center px-5 no-underline text-sm font-bold tracking-wide text-white hover:bg-white/15 rounded-md p-2 transition-all duration-150"
                  onClick={() => setServicesOpen(!servicesOpen)}
                  onMouseEnter={() => setServicesOpen(true)}
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
