export default function Slide05Pipeline() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0c1a2e" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 80% 50%, rgba(30,155,138,0.1) 0%, transparent 60%)" }} />

      <div style={{ padding: "6vh 7vw", height: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: "3vh" }}>
          <div className="font-body font-semibold" style={{ color: "#1e9b8a", fontSize: "1.5vw", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1.5vh" }}>How It Works</div>
          <div className="font-display font-extrabold" style={{ fontSize: "3.8vw", color: "#f0f7f6", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
            Three streams. One result.
            <span style={{ color: "#1e9b8a" }}> Under 3 seconds.</span>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "2.5vh" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "2vw" }}>
            <div style={{ background: "rgba(30,155,138,0.12)", border: "1.5px solid rgba(30,155,138,0.4)", borderRadius: "12px", padding: "2vh 2.5vw", minWidth: "18vw", textAlign: "center" }}>
              <div className="font-display font-bold" style={{ color: "#1e9b8a", fontSize: "1.7vw" }}>Teacher</div>
              <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.4vw", marginTop: "0.5vh" }}>Types: "Rights and Freedoms"</div>
            </div>
            <div style={{ color: "#1e9b8a", fontSize: "2vw", fontWeight: 700 }}>→</div>
            <div style={{ flex: 1, background: "rgba(15,34,54,0.8)", border: "1.5px solid rgba(30,155,138,0.25)", borderRadius: "16px", padding: "2.5vh 2.5vw" }}>
              <div className="font-display font-semibold" style={{ color: "#94a3b8", fontSize: "1.4vw", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "2vh" }}>Parallel Pipeline</div>
              <div style={{ display: "flex", gap: "2vw" }}>
                <div style={{ flex: 1, background: "rgba(30,155,138,0.1)", borderRadius: "10px", padding: "1.8vh 1.5vw", borderLeft: "3px solid #1e9b8a" }}>
                  <div className="font-display font-bold" style={{ color: "#1e9b8a", fontSize: "1.5vw", marginBottom: "0.5vh" }}>Stream 1</div>
                  <div className="font-body font-medium" style={{ color: "#f0f7f6", fontSize: "1.4vw" }}>CurricuLLM-AU</div>
                  <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.3vw" }}>Finds AC v9 outcome codes</div>
                </div>
                <div style={{ flex: 1, background: "rgba(240,165,0,0.08)", borderRadius: "10px", padding: "1.8vh 1.5vw", borderLeft: "3px solid #f0a500" }}>
                  <div className="font-display font-bold" style={{ color: "#f0a500", fontSize: "1.5vw", marginBottom: "0.5vh" }}>Stream 2</div>
                  <div className="font-body font-medium" style={{ color: "#f0f7f6", fontSize: "1.4vw" }}>Trusted Sources</div>
                  <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.3vw" }}>AIATSIS, NMA, Scootle, ABC</div>
                </div>
                <div style={{ flex: 1, background: "rgba(99,102,241,0.08)", borderRadius: "10px", padding: "1.8vh 1.5vw", borderLeft: "3px solid #818cf8" }}>
                  <div className="font-display font-bold" style={{ color: "#818cf8", fontSize: "1.5vw", marginBottom: "0.5vh" }}>Stream 3</div>
                  <div className="font-body font-medium" style={{ color: "#f0f7f6", fontSize: "1.4vw" }}>Merge + Rank</div>
                  <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.3vw" }}>Trust score + local context</div>
                </div>
              </div>
            </div>
            <div style={{ color: "#1e9b8a", fontSize: "2vw", fontWeight: 700 }}>→</div>
            <div style={{ background: "rgba(30,155,138,0.15)", border: "2px solid #1e9b8a", borderRadius: "12px", padding: "2vh 2vw", minWidth: "16vw", textAlign: "center" }}>
              <div className="font-display font-bold" style={{ color: "#f0f7f6", fontSize: "1.6vw", marginBottom: "1vh" }}>3 Verified Results</div>
              <div className="font-body" style={{ color: "#1e9b8a", fontSize: "1.4vw" }}>+ Trust Scorecard</div>
              <div className="font-body" style={{ color: "#1e9b8a", fontSize: "1.4vw" }}>+ Local Lens tip</div>
              <div className="font-body" style={{ color: "#1e9b8a", fontSize: "1.4vw" }}>+ Lesson plan ready</div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1.5vw", background: "rgba(30,155,138,0.08)", border: "1px solid rgba(30,155,138,0.2)", borderRadius: "10px", padding: "1.5vh 3vw" }}>
              <div style={{ width: "0.8vw", height: "0.8vw", borderRadius: "50%", background: "#1e9b8a" }} />
              <div className="font-body font-semibold" style={{ color: "#f0f7f6", fontSize: "1.6vw" }}>
                From search to lesson plan — in under 3 seconds
              </div>
              <div style={{ width: "0.8vw", height: "0.8vw", borderRadius: "50%", background: "#1e9b8a" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
