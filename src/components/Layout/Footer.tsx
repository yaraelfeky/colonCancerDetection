import React from "react";
import Container from "./Container";

const quickLinks = [
  { label: "Home", href: "/dashboard" },
  { label: "About", href: "/dashboard#about" },
  { label: "Start Diagnosis", href: "/dashboard#diagnosis" },
  { label: "Login", href: "/login" },
];

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      id="contact"
      className="border-t border-gray-100 mt-auto scroll-mt-40"
      style={{ background: "#0D3077" }}
    >
      {/* Top divider accent */}
      <div
        className="h-1 w-full"
        style={{ background: "linear-gradient(90deg, #1E88E5, #26A69A)" }}
      />

      <Container>
        <div className="py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand Column */}
          <div className="flex flex-col gap-4">
            <a href="/" className="flex items-center gap-2 w-fit">
              <span
                className="flex items-center justify-center w-9 h-9 rounded-xl text-white font-bold text-base"
                style={{ background: "linear-gradient(135deg, #1E88E5, #26A69A)" }}
              >
                C
              </span>
              <span
                className="text-xl font-extrabold tracking-tight"
                style={{ color: "#1E88E5", letterSpacing: "-0.5px" }}
              >
                Colon<span style={{ color: "#26A69A" }}>AI</span>
              </span>
            </a>
            <p className="text-sm text-gray-300 leading-relaxed max-w-xs">
              AI-Based Colon Cancer Detection System — leveraging deep learning
              to assist clinicians in early-stage colorectal cancer diagnosis
              with precision and speed.
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: "#26A69A" }}
              />
              <span className="text-xs font-medium" style={{ color: "#26A69A" }}>
                AI-Powered Medical Imaging
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-4">
            <h3
              className="text-sm font-bold uppercase tracking-widest"
              style={{ color: "#1E88E5" }}
            >
              Quick Links
            </h3>
            <ul className="flex flex-col gap-2">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-300 hover:text-blue-600 transition-colors duration-150 flex items-center gap-2 group"
                  >
                    <span
                      className="inline-block w-1 h-1 rounded-full bg-gray-300 group-hover:bg-blue-400 transition-colors"
                    />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Project Info */}
          <div className="flex flex-col gap-4">
            <h3
              className="text-sm font-bold uppercase tracking-widest"
              style={{ color: "#1E88E5" }}
            >
              Project Info
            </h3>
            <div className="flex flex-col gap-3">
              {[
                { label: "Type", value: "Graduation Project" },
                { label: "Field", value: "Medical AI & Computer Vision" },
                { label: "Technology", value: "Deep Learning · React · Python" },
              ].map((item) => (
                <div key={item.label}>
                  <span className="block text-xs font-semibold text-gray-200 uppercase tracking-wide">
                    {item.label}
                  </span>
                  <span className="text-sm text-gray-500">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright Bar */}
        <div className="border-t border-gray-200 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-400">
            © {currentYear}{" "}
            <span className="font-semibold" style={{ color: "#1E88E5" }}>
              ColonAI
            </span>{" "}
            — AI-Based Colon Cancer Detection System. All rights reserved.
          </p>
          <p className="text-xs text-gray-400">
            Built with ❤️ for early cancer detection
          </p>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;