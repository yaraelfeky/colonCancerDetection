import Container from "../Layout/Container";

const CTASection = () => {
  return (
        <section className="pb-24">
          <Container>
            <div
              className="rounded-3xl p-10 md:p-16 flex flex-col items-center text-center relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #1E88E5 0%, #26A69A 100%)", boxShadow: "0 24px 64px rgba(30,136,229,0.28)" }}
            >
              <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white opacity-[0.06] pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-52 h-52 rounded-full bg-white opacity-[0.06] pointer-events-none" />
              <span className="relative z-10 inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-white/20 text-white mb-5">
                Get Started Today
              </span>
              <h2 className="relative z-10 text-3xl md:text-4xl font-extrabold text-white mb-4" style={{ letterSpacing: "-0.75px" }}>
                Ready to Start a Diagnosis?
              </h2>
              <p className="relative z-10 text-blue-100 mb-8 max-w-md leading-relaxed">
                Upload your first colonoscopy image and receive AI-assisted results in under 3 seconds.
              </p>
              <a
                href="/diagnosis"
                className="relative z-10 inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold bg-white hover:bg-blue-50 transition-all duration-200 hover:shadow-xl active:scale-95"
                style={{ color: "#1E88E5" }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Start Diagnosis
              </a>
            </div>
          </Container>
        </section>
  );
};

export default CTASection;