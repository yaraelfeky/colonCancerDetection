import Container from "../Layout/Container";

const HeroSection = () => {
  return (
        <section className="relative overflow-hidden py-24 md:py-32"style={{ background: "#002570" }} >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 70% 55% at 65% -5%, rgba(30,136,229,0.1) 0%, transparent 65%)," +
                "radial-gradient(ellipse 50% 40% at 5% 90%, rgba(38,166,154,0.09) 0%, transparent 60%)",
            }}
          />

          <Container>
            <div className="flex flex-col lg:flex-row items-center gap-14">

              {/* Left: Text */}
              <div className="flex-1 text-center lg:text-left">

                <h1
                  className="text-4xl md:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.15] mb-6"
                  style={{ color: "#E1EEFF", letterSpacing: "-1.5px" }}
                >
                  Detect{" "}
                  <span
                    style={{
                      background: "linear-gradient(120deg, #1E88E5 30%, #26A69A)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Colon Cancer
                  </span>
                  <br />
                  Earlier with AI
                </h1>

                <p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
                  An intelligent diagnostic assistant that analyzes colonoscopy images using deep
                  learning — helping clinicians detect colorectal cancer{" "}
                  <strong className="text-gray-100 font-semibold">faster, earlier,</strong> and more accurately.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <a
                    href="#diagnosis"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:opacity-90 hover:shadow-xl active:scale-95"
                    style={{
                      background: "linear-gradient(135deg, #1E88E5, #26A69A)",
                      boxShadow: "0 8px 24px rgba(30,136,229,0.35)",
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Start Diagnosis
                  </a>
                  <a
                    href="#about"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:border-blue-300 hover:text-blue-600 transition-all duration-200"
                  >
                    About the Project
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </a>
                </div>

                <div className="flex flex-wrap items-center gap-5 mt-10 justify-center lg:justify-start">
                  {["95%+ Accuracy", "< 3s Results", "Secure & Private"].map((badge) => (
                    <span key={badge} className="flex items-center gap-1.5 text-xs font-medium text-gray-300">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#26A69A" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right: Visual Card */}
              <div className="flex-1 flex justify-center lg:justify-end">
                <div className="relative">
                  <div
                    className="relative w-80 h-80 md:w-96 md:h-96 rounded-3xl flex flex-col items-center justify-center gap-5"
                    style={{
                      background: "linear-gradient(145deg, rgba(30,136,229,0.07) 0%, rgba(38,166,154,0.1) 100%)",
                      border: "1.5px solid rgba(30,136,229,0.15)",
                      boxShadow: "0 24px 64px rgba(30,136,229,0.12), 0 0 0 1px rgba(255,255,255,0.8) inset",
                    }}
                  >
                    <div className="absolute inset-6 rounded-2xl opacity-20 animate-pulse" style={{ border: "1.5px dashed #1E88E5" }} />
                    <div
                      className="relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #1E88E5, #26A69A)", boxShadow: "0 12px 32px rgba(30,136,229,0.4)" }}
                    >
                      <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="relative z-10 flex flex-col items-center gap-2 w-48">
                      <span className="text-xs font-semibold text-gray-300 tracking-widest uppercase">Analyzing Image</span>
                      <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
                        <div className="h-full rounded-full animate-pulse" style={{ width: "72%", background: "linear-gradient(90deg, #1E88E5, #26A69A)" }} />
                      </div>
                      <span className="text-[11px] text-gray-300">CNN Processing · Layer 48/50</span>
                    </div>
                  </div>
                  <div
                    className="absolute -top-4 -right-4 flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold text-white shadow-lg"
                    style={{ background: "linear-gradient(135deg, #26A69A, #1E88E5)" }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    95% Accuracy
                  </div>
                  <div
                    className="absolute -bottom-4 -left-4 flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold text-white shadow-lg"
                    style={{ background: "#1E88E5" }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Real-Time
                  </div>
                </div>
              </div>

            </div>
          </Container>
        </section>
  );
};

export default HeroSection;