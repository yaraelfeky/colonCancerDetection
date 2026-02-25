import React, { useState } from "react";
import Container from "../../components/Layout/Container";
import HeroSection from "../../components/home/HeoSecton";
import CTASection from "../../components/home/CTASection";
import Navbar from "../../components/Layout/Navbar";
import Footer from "../../components/Layout/Footer";

// data
const features = [
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
    title: "AI-Powered Analysis",
    description:
      "Deep learning models trained on thousands of colonoscopy images to detect polyps and cancerous lesions with high accuracy.",
    color: "#1E88E5",
  },
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
    title: "Real-Time Detection",
    description:
      "Instant results with visual heatmaps highlighting suspicious regions — supporting clinicians in real-time decision making.",
    color: "#26A69A",
  },
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
    title: "Clinically Validated",
    description:
      "Tested and validated against standard diagnostic methods, ensuring reliability and safety for clinical assistance.",
    color: "#1E88E5",
  },
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
    title: "Detailed Reports",
    description:
      "Auto-generated diagnostic reports with annotated images, severity scores, and recommended follow-up actions.",
    color: "#26A69A",
  },
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
    ),
    title: "Secure & Private",
    description:
      "Patient data is encrypted end-to-end. Full compliance with medical data privacy standards and regulations.",
    color: "#1E88E5",
  },
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    ),
    title: "Early Detection Saves Lives",
    description:
      "Catching colon cancer at Stage I results in a 90%+ survival rate. Our system is built to enable that early intervention.",
    color: "#26A69A",
  },
];

const steps = [
  {
    step: "01",
    title: "Upload Image",
    desc: "Upload a colonoscopy or histopathology image through the secure dashboard. Supports JPEG, PNG, and DICOM formats.",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
        />
      </svg>
    ),
  },
  {
    step: "02",
    title: "AI Processing",
    desc: "Our convolutional neural network (ResNet-50) analyzes the image layer by layer and detects anomalies within seconds.",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    step: "03",
    title: "View Results",
    desc: "Get instant annotated results with confidence scores, highlighted regions of concern, and cancer stage classification.",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
    ),
  },
  {
    step: "04",
    title: "Download Report",
    desc: "Export a comprehensive PDF report with annotated images for clinical documentation, referral, and follow-up planning.",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
];

const projectHighlights = [
  { label: "Model Architecture", value: "CNN · ResNet-50" },
  { label: "Dataset Size", value: "10,000+ Images" },
  { label: "Detection Accuracy", value: "95%+" },
  { label: "Processing Speed", value: "< 3 Seconds" },
  { label: "Tech Stack", value: "React · Python · FastAPI" },
  { label: "Project Type", value: "Graduation Project" },
];

const Home: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: "#002570" }}
    >
      {/* navbar */}
      <Navbar />

      <main style={{ background: "#F5F7FA" }}>
        <HeroSection />

        {/* feature section */}
        <section id="features" className="py-24">
          <Container>
            <div className="text-center mb-16">
              <span
                className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-4"
                style={{ background: "rgba(30,136,229,0.1)", color: "#1E88E5" }}
              >
                Why ColonAI
              </span>
              <h2
                className="text-3xl md:text-4xl font-extrabold mb-4"
                style={{ color: "#0D1B2A", letterSpacing: "-0.75px" }}
              >
                Built for Accuracy.{" "}
                <span
                  style={{
                    background: "linear-gradient(120deg, #1E88E5, #26A69A)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Designed for Clinicians.
                </span>
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto leading-relaxed">
                Every feature is engineered to support medical professionals in
                making faster, more confident, and more accurate diagnoses.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="group bg-white rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl cursor-default"
                  style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                    style={{ background: `${f.color}18`, color: f.color }}
                  >
                    {f.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-2">{f.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {f.description}
                    </p>
                  </div>
                  <div
                    className="mt-auto h-0.5 w-0 rounded-full transition-all duration-500 group-hover:w-full"
                    style={{
                      background: `linear-gradient(90deg, ${f.color}, transparent)`,
                    }}
                  />
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* how it work section */}
        <section
          id="how-it-works"
          className="py-24"
          style={{ background: "#EEF2F7" }}
        >
          <Container>
            <div className="text-center mb-16">
              <span
                className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-4"
                style={{
                  background: "rgba(38,166,154,0.12)",
                  color: "#26A69A",
                }}
              >
                Simple Process
              </span>
              <h2
                className="text-3xl md:text-4xl font-extrabold mb-4"
                style={{ color: "#0D1B2A", letterSpacing: "-0.75px" }}
              >
                How It Works
              </h2>
              <p className="text-gray-500 max-w-lg mx-auto leading-relaxed">
                From image upload to clinical report in four straightforward
                steps.
              </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Steps sidebar */}
              <div className="flex flex-col gap-3 w-full lg:w-80 flex-shrink-0">
                {steps.map((s, i) => (
                  <button
                    key={s.step}
                    onClick={() => setActiveStep(i)}
                    className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-200 w-full"
                    style={
                      activeStep === i
                        ? {
                            background:
                              "linear-gradient(135deg, #1E88E5, #26A69A)",
                            boxShadow: "0 8px 24px rgba(30,136,229,0.3)",
                            color: "white",
                            transform: "scale(1.02)",
                          }
                        : {
                            background: "white",
                            boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                            color: "#4B5563",
                          }
                    }
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={
                        activeStep === i
                          ? {
                              background: "rgba(255,255,255,0.2)",
                              color: "white",
                            }
                          : { background: "#F1F5F9", color: "#1E88E5" }
                      }
                    >
                      {s.icon}
                    </div>
                    <div>
                      <span
                        className="text-xs font-bold tracking-widest uppercase"
                        style={{
                          color:
                            activeStep === i
                              ? "rgba(255,255,255,0.7)"
                              : "#9CA3AF",
                        }}
                      >
                        Step {s.step}
                      </span>
                      <p
                        className="font-bold text-sm mt-0.5"
                        style={{
                          color: activeStep === i ? "white" : "#1F2937",
                        }}
                      >
                        {s.title}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Detail panel */}
              <div
                className="flex-1 bg-white rounded-3xl p-8 md:p-10 flex flex-col justify-center min-h-64"
                style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-white"
                  style={{
                    background: "linear-gradient(135deg, #1E88E5, #26A69A)",
                    boxShadow: "0 8px 20px rgba(30,136,229,0.3)",
                  }}
                >
                  {steps[activeStep].icon}
                </div>
                <div
                  className="text-xs font-bold tracking-widest uppercase mb-2"
                  style={{ color: "#26A69A" }}
                >
                  Step {steps[activeStep].step}
                </div>
                <h3
                  className="text-2xl font-extrabold mb-4"
                  style={{ color: "#0D1B2A" }}
                >
                  {steps[activeStep].title}
                </h3>
                <p className="text-gray-500 leading-relaxed text-base">
                  {steps[activeStep].desc}
                </p>
                <div className="flex gap-2 mt-8">
                  {steps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveStep(i)}
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: activeStep === i ? "2rem" : "0.5rem",
                        background: activeStep === i ? "#1E88E5" : "#CBD5E1",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* about section */}
        <section id="about" className="py-24 scroll-mt-40">
          <Container>
            <div className="flex flex-col lg:flex-row gap-14 items-center">
              {/* Left: Text */}
              <div className="flex-1">
                <span
                  className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
                  style={{
                    background: "rgba(30,136,229,0.1)",
                    color: "#1E88E5",
                  }}
                >
                  About the Project
                </span>
                <h2
                  className="text-3xl md:text-4xl font-extrabold mb-6"
                  style={{ color: "#0D1B2A", letterSpacing: "-0.75px" }}
                >
                  A Graduation Project with{" "}
                  <span
                    style={{
                      background: "linear-gradient(120deg, #1E88E5, #26A69A)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Real Clinical Impact
                  </span>
                </h2>
                <p className="text-gray-500 leading-relaxed mb-5">
                  <strong className="text-gray-700">ColonAI</strong> is an
                  AI-based colon cancer detection system developed as a
                  graduation project. It leverages state-of-the-art
                  convolutional neural networks trained on large-scale
                  colonoscopy datasets to assist clinicians in identifying
                  suspicious lesions early.
                </p>
                <p className="text-gray-500 leading-relaxed mb-8">
                  Colorectal cancer is the third most common cancer worldwide.
                  When detected at an early stage, survival rates exceed 90%.
                  Our system is designed to make that early detection faster,
                  more accessible, and more reliable — even in resource-limited
                  settings.
                </p>
                <div
                  className="rounded-2xl p-5 border-l-4 mb-8"
                  style={{
                    background: "rgba(30,136,229,0.05)",
                    borderLeftColor: "#1E88E5",
                  }}
                >
                  <p className="text-sm text-gray-600 italic leading-relaxed">
                    "Our mission is to bridge the gap between cutting-edge AI
                    research and clinical practice — making intelligent cancer
                    detection accessible to every clinician."
                  </p>
                </div>
              </div>

              {/* Right: Highlights */}
              <div className="flex-1 w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {projectHighlights.map((item, i) => (
                    <div
                      key={item.label}
                      className="bg-white rounded-2xl p-5 flex flex-col gap-1 hover:-translate-y-0.5 transition-transform duration-200"
                      style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
                    >
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                        {item.label}
                      </span>
                      <span
                        className="text-base font-extrabold"
                        style={{ color: i % 2 === 0 ? "#1E88E5" : "#26A69A" }}
                      >
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Container>
        </section>

        <CTASection />
      </main>

      {/* footer */}
      <Footer />
    </div>
  );
};

export default Home;
