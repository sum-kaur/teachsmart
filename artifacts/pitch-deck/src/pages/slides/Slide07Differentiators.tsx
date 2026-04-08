export default function Slide07Differentiators() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0c1a2e" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 20% 80%, rgba(30,155,138,0.1) 0%, transparent 55%)" }} />

      <div style={{ padding: "5.5vh 7vw", height: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: "2.5vh" }}>
          <div className="font-body font-semibold" style={{ color: "#1e9b8a", fontSize: "1.5vw", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1.5vh" }}>Why TeachSmart Wins</div>
          <div className="font-display font-extrabold" style={{ fontSize: "3.8vw", color: "#f0f7f6", lineHeight: 1.05, letterSpacing: "-0.02em" }}>The competition can't match this.</div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ background: "rgba(15,34,54,0.7)", border: "1px solid rgba(30,155,138,0.2)", borderRadius: "16px", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr 1fr 1.3fr", background: "rgba(30,155,138,0.15)", padding: "1.8vh 2vw", gap: "1vw" }}>
              <div className="font-display font-semibold" style={{ color: "#94a3b8", fontSize: "1.5vw" }}>Feature</div>
              <div className="font-display font-semibold" style={{ color: "#ef4444", fontSize: "1.5vw", textAlign: "center" }}>Generic AI</div>
              <div className="font-display font-semibold" style={{ color: "#f0a500", fontSize: "1.5vw", textAlign: "center" }}>Scootle</div>
              <div className="font-display font-semibold" style={{ color: "#1e9b8a", fontSize: "1.5vw", textAlign: "center" }}>TeachSmart</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr 1fr 1.3fr", padding: "1.6vh 2vw", gap: "1vw", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="font-body" style={{ color: "#c8dedd", fontSize: "1.5vw" }}>Curriculum alignment accuracy</div>
                <div style={{ textAlign: "center" }}><span style={{ color: "#ef4444", fontSize: "1.5vw", fontWeight: 700 }}>41% ✕</span></div>
                <div style={{ textAlign: "center" }}><span style={{ color: "#f0a500", fontSize: "1.5vw" }}>Manual ✕</span></div>
                <div style={{ textAlign: "center" }}><span style={{ color: "#22c55e", fontSize: "1.5vw", fontWeight: 700 }}>89% ✓</span></div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr 1fr 1.3fr", padding: "1.6vh 2vw", gap: "1vw", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)" }}>
                <div className="font-body" style={{ color: "#c8dedd", fontSize: "1.5vw" }}>Trust verification</div>
                <div style={{ textAlign: "center" }}><span style={{ color: "#ef4444", fontSize: "1.5vw" }}>None ✕</span></div>
                <div style={{ textAlign: "center" }}><span style={{ color: "#f0a500", fontSize: "1.5vw" }}>Basic ⚠</span></div>
                <div style={{ textAlign: "center" }}><span style={{ color: "#22c55e", fontSize: "1.5vw", fontWeight: 700 }}>3-tier ✓</span></div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr 1fr 1.3fr", padding: "1.6vh 2vw", gap: "1vw", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="font-body" style={{ color: "#c8dedd", fontSize: "1.5vw" }}>Local contextualisation</div>
                <div style={{ textAlign: "center" }}><span style={{ color: "#ef4444", fontSize: "1.5vw" }}>None ✕</span></div>
                <div style={{ textAlign: "center" }}><span style={{ color: "#ef4444", fontSize: "1.5vw" }}>None ✕</span></div>
                <div style={{ textAlign: "center" }}><span style={{ color: "#22c55e", fontSize: "1.5vw", fontWeight: 700 }}>Postcode ✓</span></div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr 1fr 1.3fr", padding: "1.6vh 2vw", gap: "1vw", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)" }}>
                <div className="font-body" style={{ color: "#c8dedd", fontSize: "1.5vw" }}>Lesson plan generation</div>
                <div style={{ textAlign: "center" }}><span style={{ color: "#f0a500", fontSize: "1.5vw" }}>Generic ⚠</span></div>
                <div style={{ textAlign: "center" }}><span style={{ color: "#ef4444", fontSize: "1.5vw" }}>None ✕</span></div>
                <div style={{ textAlign: "center" }}><span style={{ color: "#22c55e", fontSize: "1.5vw", fontWeight: 700 }}>AI-tailored ✓</span></div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr 1fr 1.3fr", padding: "1.6vh 2vw", gap: "1vw", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="font-body" style={{ color: "#c8dedd", fontSize: "1.5vw" }}>Speed to results</div>
                <div style={{ textAlign: "center" }}><span style={{ color: "#ef4444", fontSize: "1.5vw" }}>Scattered ✕</span></div>
                <div style={{ textAlign: "center" }}><span style={{ color: "#f0a500", fontSize: "1.5vw" }}>Slow ✕</span></div>
                <div style={{ textAlign: "center" }}><span style={{ color: "#22c55e", fontSize: "1.5vw", fontWeight: 700 }}>3 seconds ✓</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
