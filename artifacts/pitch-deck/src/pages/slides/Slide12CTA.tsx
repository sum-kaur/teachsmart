const base = import.meta.env.BASE_URL;

export default function Slide12CTA() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#060f1c" }}>
      <img
        src={`${base}hero-classroom.png`}
        crossOrigin="anonymous"
        alt="Australian classroom"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.3 }}
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(6,15,28,0.95) 0%, rgba(6,15,28,0.85) 40%, rgba(12,26,46,0.92) 100%)" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 80% 80%, rgba(30,155,138,0.25) 0%, transparent 55%)" }} />

      <div className="absolute inset-0 flex flex-col justify-between" style={{ padding: "7vh 8vw" }}>
        <div className="flex items-center gap-[1.2vw]">
          <div style={{ width: "1.2vw", height: "1.2vw", borderRadius: "50%", background: "#1e9b8a" }} />
          <span className="font-display font-bold" style={{ color: "#f0f7f6", fontSize: "1.8vw" }}>TeachSmart</span>
        </div>

        <div>
          <div className="font-display font-extrabold tracking-tight" style={{ fontSize: "4.8vw", lineHeight: 1.05, color: "#f0f7f6", letterSpacing: "-0.02em", maxWidth: "75vw" }}>
            Teachers spend 5–10 hours searching.
            <span style={{ color: "#1e9b8a" }}> TeachSmart gets them back to teaching in 3 minutes.</span>
          </div>

          <div style={{ width: "10vw", height: "0.4vh", background: "#1e9b8a", margin: "3.5vh 0 3vh" }} />

          <div className="font-display font-semibold" style={{ fontSize: "2.2vw", color: "#c8dedd", lineHeight: 1.4, maxWidth: "65vw" }}>
            Curriculum-aligned. Trust-verified. Locally contextualised.
          </div>

          <div className="font-display font-bold" style={{ fontSize: "2.8vw", color: "#f0a500", marginTop: "2vh" }}>
            Now.
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="font-body font-medium" style={{ color: "#94a3b8", fontSize: "1.5vw" }}>Cambridge EduX Hackathon 2026 · Challenge 4</div>
            <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.5vw", marginTop: "0.5vh" }}>April 9, 2026 · UTS Sydney</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="font-display font-bold" style={{ color: "#1e9b8a", fontSize: "1.8vw" }}>teachsmart.edu.au</div>
            <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.5vw", marginTop: "0.5vh" }}>team@teachsmart.edu.au</div>
          </div>
        </div>
      </div>
    </div>
  );
}
