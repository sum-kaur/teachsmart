export default function Slide06Demo() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#060f1c" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(30,155,138,0.14) 0%, transparent 65%)" }} />

      <div style={{ padding: "6vh 7vw", height: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: "3vh" }}>
          <div className="font-body font-semibold" style={{ color: "#1e9b8a", fontSize: "1.5vw", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1.5vh" }}>Live Demo</div>
          <div className="font-display font-extrabold" style={{ fontSize: "3.8vw", color: "#f0f7f6", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
            See it in action.
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", gap: "3vw", alignItems: "stretch" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2vh" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.8vh" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1.5vw", padding: "1.8vh 2vw", background: "rgba(30,155,138,0.1)", border: "1px solid rgba(30,155,138,0.3)", borderRadius: "10px" }}>
                <div style={{ width: "2.5vw", height: "2.5vw", borderRadius: "50%", background: "#1e9b8a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: "white", fontSize: "1.3vw", fontWeight: 700 }}>1</span>
                </div>
                <div>
                  <div className="font-display font-semibold" style={{ color: "#f0f7f6", fontSize: "1.6vw" }}>Sarah's profile — Year 9, NSW, Parramatta</div>
                  <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.4vw" }}>Search: "Rights and Freedoms"</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1.5vw", padding: "1.8vh 2vw", background: "rgba(240,165,0,0.07)", border: "1px solid rgba(240,165,0,0.25)", borderRadius: "10px" }}>
                <div style={{ width: "2.5vw", height: "2.5vw", borderRadius: "50%", background: "#f0a500", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: "white", fontSize: "1.3vw", fontWeight: 700 }}>2</span>
                </div>
                <div>
                  <div className="font-display font-semibold" style={{ color: "#f0f7f6", fontSize: "1.6vw" }}>Pipeline runs — 3 verified results appear</div>
                  <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.4vw" }}>Each card shows source, type, and Trust Scorecard</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1.5vw", padding: "1.8vh 2vw", background: "rgba(129,140,248,0.07)", border: "1px solid rgba(129,140,248,0.25)", borderRadius: "10px" }}>
                <div style={{ width: "2.5vw", height: "2.5vw", borderRadius: "50%", background: "#818cf8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: "white", fontSize: "1.3vw", fontWeight: 700 }}>3</span>
                </div>
                <div>
                  <div className="font-display font-semibold" style={{ color: "#f0f7f6", fontSize: "1.6vw" }}>Expand Trust Scorecard — Tier A / B / C</div>
                  <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.4vw" }}>Tier A: AIATSIS verified · Tier B: AC9HASS043 aligned · Tier C: Safe</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1.5vw", padding: "1.8vh 2vw", background: "rgba(30,155,138,0.1)", border: "1px solid rgba(30,155,138,0.3)", borderRadius: "10px" }}>
                <div style={{ width: "2.5vw", height: "2.5vw", borderRadius: "50%", background: "#1e9b8a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: "white", fontSize: "1.3vw", fontWeight: 700 }}>4</span>
                </div>
                <div>
                  <div className="font-display font-semibold" style={{ color: "#f0f7f6", fontSize: "1.6vw" }}>Local Lens — Darug Country context tip</div>
                  <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.4vw" }}>Lesson plan generated, ready to teach</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ width: "36vw", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "100%", aspectRatio: "16/10", background: "rgba(15,34,54,0.9)", border: "2px solid rgba(30,155,138,0.4)", borderRadius: "16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.5vh" }}>
              <div style={{ width: "4vw", height: "4vw", borderRadius: "50%", background: "rgba(30,155,138,0.2)", border: "2px solid #1e9b8a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#1e9b8a", fontSize: "2vw", fontWeight: 700 }}>▶</span>
              </div>
              <div className="font-display font-bold" style={{ color: "#1e9b8a", fontSize: "1.7vw" }}>LIVE DEMO</div>
              <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.4vw", textAlign: "center", padding: "0 2vw" }}>TeachSmart running live — searching "Rights and Freedoms" for Year 9 NSW</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
