export default function Slide08CurricuLLM() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0c1a2e" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 70% 30%, rgba(30,155,138,0.12) 0%, transparent 60%)" }} />

      <div style={{ padding: "6vh 7vw", height: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: "3vh" }}>
          <div className="font-body font-semibold" style={{ color: "#1e9b8a", fontSize: "1.5vw", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1.5vh" }}>Key Differentiator</div>
          <div className="font-display font-extrabold" style={{ fontSize: "3.6vw", color: "#f0f7f6", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
            Why curriculum accuracy matters.
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", gap: "4vw", alignItems: "center" }}>
          <div style={{ flex: 1, background: "rgba(239,68,68,0.06)", border: "2px solid rgba(239,68,68,0.3)", borderRadius: "16px", padding: "3.5vh 3vw" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1vw", marginBottom: "2.5vh" }}>
              <div style={{ width: "2.5vw", height: "2.5vw", borderRadius: "8px", background: "rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#ef4444", fontSize: "1.5vw", fontWeight: 700 }}>✕</span>
              </div>
              <div className="font-display font-bold" style={{ color: "#ef4444", fontSize: "2vw" }}>Generic AI Returns</div>
            </div>
            <div style={{ padding: "2.5vh 2vw", background: "rgba(239,68,68,0.08)", borderRadius: "10px", fontFamily: "monospace" }}>
              <div style={{ color: "#f87171", fontSize: "1.6vw", textDecoration: "line-through", opacity: 0.7 }}>AC8 — Superseded curriculum</div>
              <div style={{ color: "#f87171", fontSize: "1.6vw", textDecoration: "line-through", opacity: 0.7, marginTop: "1.5vh" }}>ACDSEH105 ← code doesn't exist</div>
            </div>
            <div style={{ marginTop: "2.5vh", padding: "2vh 1.5vw", background: "rgba(239,68,68,0.1)", borderRadius: "10px" }}>
              <div className="font-body font-semibold" style={{ color: "#f87171", fontSize: "1.5vw" }}>Result:</div>
              <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.5vw", marginTop: "0.8vh" }}>Student assessment won't align to AC v9 reporting standards. Teacher's work is wasted.</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1vh" }}>
            <div style={{ color: "#1e9b8a", fontSize: "3vw", fontWeight: 700 }}>→</div>
          </div>

          <div style={{ flex: 1, background: "rgba(30,155,138,0.08)", border: "2px solid rgba(30,155,138,0.4)", borderRadius: "16px", padding: "3.5vh 3vw" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1vw", marginBottom: "2.5vh" }}>
              <div style={{ width: "2.5vw", height: "2.5vw", borderRadius: "8px", background: "rgba(30,155,138,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#1e9b8a", fontSize: "1.5vw", fontWeight: 700 }}>✓</span>
              </div>
              <div className="font-display font-bold" style={{ color: "#1e9b8a", fontSize: "2vw" }}>CurricuLLM Returns</div>
            </div>
            <div style={{ padding: "2.5vh 2vw", background: "rgba(30,155,138,0.1)", borderRadius: "10px", fontFamily: "monospace" }}>
              <div style={{ color: "#6ee7b7", fontSize: "1.6vw" }}>AC9 — Current curriculum ✓</div>
              <div style={{ marginTop: "1.5vh" }}>
                <div style={{ color: "#6ee7b7", fontSize: "1.6vw" }}>AC9HASS043 ✓</div>
                <div style={{ color: "#94a3b8", fontSize: "1.4vw", paddingLeft: "1.5vw" }}>Rights and freedoms in Australia</div>
              </div>
              <div style={{ marginTop: "1vh" }}>
                <div style={{ color: "#6ee7b7", fontSize: "1.6vw" }}>AC9HASS044 ✓</div>
                <div style={{ color: "#94a3b8", fontSize: "1.4vw", paddingLeft: "1.5vw" }}>Democratic political systems</div>
              </div>
            </div>
            <div style={{ marginTop: "2.5vh", padding: "2vh 1.5vw", background: "rgba(30,155,138,0.12)", borderRadius: "10px" }}>
              <div className="font-body font-semibold" style={{ color: "#1e9b8a", fontSize: "1.5vw" }}>Result:</div>
              <div className="font-body" style={{ color: "#c8dedd", fontSize: "1.5vw", marginTop: "0.8vh" }}>Lesson plans map to AC v9 reporting. Assessment aligns. Students get proper credit.</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: "2.5vh", textAlign: "center" }}>
          <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.4vw" }}>
            AC v9 launched 2022. Many AI models still use AC v8 training data. CurricuLLM is trained on current AC v9 JSON from ACARA.
          </div>
        </div>
      </div>
    </div>
  );
}
