export default function Slide04Solution() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0c1a2e" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 120%, rgba(30,155,138,0.18) 0%, transparent 60%)" }} />
      <div className="absolute top-0 left-0 right-0" style={{ height: "0.5vh", background: "linear-gradient(90deg, #1e9b8a, #f0a500, #1e9b8a)" }} />

      <div style={{ padding: "7vh 7vw 5vh", height: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: "1.5vh" }}>
          <div className="font-body font-semibold" style={{ color: "#1e9b8a", fontSize: "1.5vw", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1.5vh" }}>The Solution</div>
          <div className="font-display font-extrabold" style={{ fontSize: "4.2vw", color: "#f0f7f6", lineHeight: 1, letterSpacing: "-0.02em" }}>TeachSmart solves this in three ways.</div>
        </div>

        <div style={{ flex: 1, display: "flex", gap: "2.5vw", alignItems: "stretch", marginTop: "3vh" }}>
          <div style={{ flex: 1, background: "rgba(30,155,138,0.08)", border: "1px solid rgba(30,155,138,0.3)", borderRadius: "16px", padding: "3.5vh 2.5vw", display: "flex", flexDirection: "column" }}>
            <div style={{ width: "4.5vw", height: "4.5vw", borderRadius: "12px", background: "rgba(30,155,138,0.2)", border: "1.5px solid #1e9b8a", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "2.5vh" }}>
              <span style={{ color: "#1e9b8a", fontSize: "2.2vw", fontWeight: 700 }}>A</span>
            </div>
            <div className="font-display font-bold" style={{ color: "#1e9b8a", fontSize: "1.9vw", marginBottom: "1vh" }}>CurricuLLM-AU</div>
            <div className="font-body font-semibold" style={{ color: "#f0f7f6", fontSize: "2.8vw", lineHeight: 1, marginBottom: "1.5vh" }}>89%</div>
            <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.5vw", marginBottom: "1vh" }}>accuracy on AC benchmarks</div>
            <div style={{ marginTop: "auto", padding: "1.2vh 1.2vw", background: "rgba(239,68,68,0.1)", borderRadius: "8px" }}>
              <div className="font-body" style={{ color: "#f87171", fontSize: "1.4vw" }}>vs GPT / Gemini: only 41%</div>
            </div>
          </div>

          <div style={{ flex: 1, background: "rgba(240,165,0,0.06)", border: "1px solid rgba(240,165,0,0.3)", borderRadius: "16px", padding: "3.5vh 2.5vw", display: "flex", flexDirection: "column" }}>
            <div style={{ width: "4.5vw", height: "4.5vw", borderRadius: "12px", background: "rgba(240,165,0,0.15)", border: "1.5px solid #f0a500", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "2.5vh" }}>
              <span style={{ color: "#f0a500", fontSize: "2.2vw", fontWeight: 700 }}>B</span>
            </div>
            <div className="font-display font-bold" style={{ color: "#f0a500", fontSize: "1.9vw", marginBottom: "1.5vh" }}>3-Tier Trust Scorecard</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.2vh" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1vw" }}>
                <div style={{ width: "1.8vw", height: "1.8vw", borderRadius: "50%", background: "#1e9b8a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: "white", fontSize: "1vw", fontWeight: 700 }}>A</span>
                </div>
                <span className="font-body" style={{ color: "#c8dedd", fontSize: "1.5vw" }}>Source verification</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1vw" }}>
                <div style={{ width: "1.8vw", height: "1.8vw", borderRadius: "50%", background: "#f0a500", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: "white", fontSize: "1vw", fontWeight: 700 }}>B</span>
                </div>
                <span className="font-body" style={{ color: "#c8dedd", fontSize: "1.5vw" }}>Curriculum alignment</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1vw" }}>
                <div style={{ width: "1.8vw", height: "1.8vw", borderRadius: "50%", background: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: "white", fontSize: "1vw", fontWeight: 700 }}>C</span>
                </div>
                <span className="font-body" style={{ color: "#c8dedd", fontSize: "1.5vw" }}>AI safety flags</span>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "16px", padding: "3.5vh 2.5vw", display: "flex", flexDirection: "column" }}>
            <div style={{ width: "4.5vw", height: "4.5vw", borderRadius: "12px", background: "rgba(99,102,241,0.15)", border: "1.5px solid #818cf8", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "2.5vh" }}>
              <span style={{ color: "#818cf8", fontSize: "2.2vw", fontWeight: 700 }}>C</span>
            </div>
            <div className="font-display font-bold" style={{ color: "#818cf8", fontSize: "1.9vw", marginBottom: "1.5vh" }}>Local Lens</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.2vh" }}>
              <div className="font-body" style={{ color: "#c8dedd", fontSize: "1.5vw" }}>Postcode-based context</div>
              <div className="font-body" style={{ color: "#c8dedd", fontSize: "1.5vw" }}>First Nations Country awareness</div>
              <div className="font-body" style={{ color: "#c8dedd", fontSize: "1.5vw" }}>Local examples and community links</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
