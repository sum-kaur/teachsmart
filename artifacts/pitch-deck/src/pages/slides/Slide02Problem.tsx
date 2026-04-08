const base = import.meta.env.BASE_URL;

export default function Slide02Problem() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex" style={{ background: "#0c1a2e" }}>
      <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, #0c1a2e 55%, rgba(30,155,138,0.08) 100%)" }} />

      <div className="relative flex w-full" style={{ padding: "7vh 0" }}>
        <div style={{ width: "55%", padding: "0 6vw 0 7vw", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className="font-body font-semibold" style={{ color: "#1e9b8a", fontSize: "1.5vw", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "2.5vh" }}>The Problem</div>
          <div className="font-display font-extrabold tracking-tight" style={{ fontSize: "3.8vw", lineHeight: 1.05, color: "#f0f7f6", marginBottom: "5vh" }}>
            Teachers spend 5–10 hours
            per week searching for resources.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "2.2vh" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1.5vw" }}>
              <div style={{ width: "2.2vw", height: "2.2vw", borderRadius: "6px", background: "rgba(239,68,68,0.15)", border: "1.5px solid #ef4444", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "0.3vh" }}>
                <span style={{ color: "#ef4444", fontSize: "1.3vw", fontWeight: 700 }}>×</span>
              </div>
              <div>
                <div className="font-display font-bold" style={{ color: "#f0f7f6", fontSize: "1.8vw" }}>Generic</div>
                <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.5vw" }}>Not aligned to exact Australian Curriculum outcomes</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "1.5vw" }}>
              <div style={{ width: "2.2vw", height: "2.2vw", borderRadius: "6px", background: "rgba(239,68,68,0.15)", border: "1.5px solid #ef4444", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "0.3vh" }}>
                <span style={{ color: "#ef4444", fontSize: "1.3vw", fontWeight: 700 }}>×</span>
              </div>
              <div>
                <div className="font-display font-bold" style={{ color: "#f0f7f6", fontSize: "1.8vw" }}>Unverified</div>
                <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.5vw" }}>No trust signals — biased, outdated, or unsafe</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "1.5vw" }}>
              <div style={{ width: "2.2vw", height: "2.2vw", borderRadius: "6px", background: "rgba(239,68,68,0.15)", border: "1.5px solid #ef4444", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "0.3vh" }}>
                <span style={{ color: "#ef4444", fontSize: "1.3vw", fontWeight: 700 }}>×</span>
              </div>
              <div>
                <div className="font-display font-bold" style={{ color: "#f0f7f6", fontSize: "1.8vw" }}>Not localised</div>
                <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.5vw" }}>US or UK resources — not Australian communities</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "1.5vw" }}>
              <div style={{ width: "2.2vw", height: "2.2vw", borderRadius: "6px", background: "rgba(239,68,68,0.15)", border: "1.5px solid #ef4444", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "0.3vh" }}>
                <span style={{ color: "#ef4444", fontSize: "1.3vw", fontWeight: 700 }}>×</span>
              </div>
              <div>
                <div className="font-display font-bold" style={{ color: "#f0f7f6", fontSize: "1.8vw" }}>Scattered</div>
                <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.5vw" }}>Google, Scootle, NESA, YouTube, TES, ABC Education</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ width: "45%", display: "flex", alignItems: "center", justifyContent: "center", paddingRight: "4vw", position: "relative" }}>
          <div style={{ position: "relative", width: "100%", height: "72vh", borderRadius: "16px", overflow: "hidden" }}>
            <img
              src={`${base}teacher-problem.png`}
              crossOrigin="anonymous"
              alt="Overwhelmed teacher"
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(12,26,46,0.6) 0%, transparent 40%)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
