export default function Slide11Team() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0c1a2e" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 70%, rgba(30,155,138,0.1) 0%, transparent 55%)" }} />

      <div style={{ padding: "5.5vh 7vw", height: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: "3vh" }}>
          <div className="font-body font-semibold" style={{ color: "#1e9b8a", fontSize: "1.5vw", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1.5vh" }}>The Team</div>
          <div className="font-display font-extrabold" style={{ fontSize: "3.6vw", color: "#f0f7f6", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
            Built by educators and engineers.
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", gap: "5vw", alignItems: "center" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.8vh" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1.5vw", padding: "1.8vh 2vw", background: "rgba(30,155,138,0.08)", border: "1px solid rgba(30,155,138,0.2)", borderRadius: "10px" }}>
              <div style={{ width: "3vw", height: "3vw", borderRadius: "50%", background: "rgba(30,155,138,0.2)", border: "1.5px solid #1e9b8a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: "#1e9b8a", fontSize: "1.4vw", fontWeight: 700 }}>01</span>
              </div>
              <div>
                <div className="font-display font-semibold" style={{ color: "#f0f7f6", fontSize: "1.6vw" }}>[Name] — Product and UI/UX</div>
                <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.4vw" }}>Masters — Software Engineering</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1.5vw", padding: "1.8vh 2vw", background: "rgba(30,155,138,0.08)", border: "1px solid rgba(30,155,138,0.2)", borderRadius: "10px" }}>
              <div style={{ width: "3vw", height: "3vw", borderRadius: "50%", background: "rgba(30,155,138,0.2)", border: "1.5px solid #1e9b8a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: "#1e9b8a", fontSize: "1.4vw", fontWeight: 700 }}>02</span>
              </div>
              <div>
                <div className="font-display font-semibold" style={{ color: "#f0f7f6", fontSize: "1.6vw" }}>[Name] — Backend and API Integration</div>
                <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.4vw" }}>Masters — Software Engineering</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1.5vw", padding: "1.8vh 2vw", background: "rgba(30,155,138,0.08)", border: "1px solid rgba(30,155,138,0.2)", borderRadius: "10px" }}>
              <div style={{ width: "3vw", height: "3vw", borderRadius: "50%", background: "rgba(30,155,138,0.2)", border: "1.5px solid #1e9b8a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: "#1e9b8a", fontSize: "1.4vw", fontWeight: 700 }}>03</span>
              </div>
              <div>
                <div className="font-display font-semibold" style={{ color: "#f0f7f6", fontSize: "1.6vw" }}>[Name] — CurricuLLM and Curriculum</div>
                <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.4vw" }}>Masters — Data Science</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1.5vw", padding: "1.8vh 2vw", background: "rgba(30,155,138,0.08)", border: "1px solid rgba(30,155,138,0.2)", borderRadius: "10px" }}>
              <div style={{ width: "3vw", height: "3vw", borderRadius: "50%", background: "rgba(30,155,138,0.2)", border: "1.5px solid #1e9b8a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: "#1e9b8a", fontSize: "1.4vw", fontWeight: 700 }}>04</span>
              </div>
              <div>
                <div className="font-display font-semibold" style={{ color: "#f0f7f6", fontSize: "1.6vw" }}>[Name] — Data and Local Context</div>
                <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.4vw" }}>Masters — Data Science</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1.5vw", padding: "1.8vh 2vw", background: "rgba(30,155,138,0.08)", border: "1px solid rgba(30,155,138,0.2)", borderRadius: "10px" }}>
              <div style={{ width: "3vw", height: "3vw", borderRadius: "50%", background: "rgba(30,155,138,0.2)", border: "1.5px solid #1e9b8a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: "#1e9b8a", fontSize: "1.4vw", fontWeight: 700 }}>05</span>
              </div>
              <div>
                <div className="font-display font-semibold" style={{ color: "#f0f7f6", fontSize: "1.6vw" }}>[Name] — QA and Testing</div>
                <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.4vw" }}>Masters — Software Engineering</div>
              </div>
            </div>
          </div>

          <div style={{ width: "34vw", display: "flex", flexDirection: "column", gap: "2vh" }}>
            <div className="font-display font-semibold" style={{ color: "#94a3b8", fontSize: "1.6vw", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.5vh" }}>Timeline</div>

            <div style={{ position: "relative", paddingLeft: "2.5vw" }}>
              <div style={{ position: "absolute", left: "0.7vw", top: "1.2vh", bottom: "1.2vh", width: "0.25vw", background: "rgba(30,155,138,0.3)" }} />

              <div style={{ display: "flex", flexDirection: "column", gap: "2.5vh" }}>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: "-1.8vw", top: "0.6vh", width: "1.2vw", height: "1.2vw", borderRadius: "50%", background: "#1e9b8a", border: "2px solid #0c1a2e" }} />
                  <div className="font-display font-semibold" style={{ color: "#22c55e", fontSize: "1.5vw" }}>April 9, 2026 — Complete</div>
                  <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.4vw" }}>Demo day, pitch, working prototype</div>
                </div>

                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: "-1.8vw", top: "0.6vh", width: "1.2vw", height: "1.2vw", borderRadius: "50%", background: "#f0a500", border: "2px solid #0c1a2e" }} />
                  <div className="font-display font-semibold" style={{ color: "#f0a500", fontSize: "1.5vw" }}>April–May 2026</div>
                  <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.4vw" }}>Teacher feedback and refinement</div>
                </div>

                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: "-1.8vw", top: "0.6vh", width: "1.2vw", height: "1.2vw", borderRadius: "50%", background: "#1e9b8a", border: "2px solid #0c1a2e" }} />
                  <div className="font-display font-semibold" style={{ color: "#1e9b8a", fontSize: "1.5vw" }}>Mid-2026</div>
                  <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.4vw" }}>Soft launch to NSW schools</div>
                </div>

                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: "-1.8vw", top: "0.6vh", width: "1.2vw", height: "1.2vw", borderRadius: "50%", background: "#818cf8", border: "2px solid #0c1a2e" }} />
                  <div className="font-display font-semibold" style={{ color: "#818cf8", fontSize: "1.5vw" }}>2027</div>
                  <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.4vw" }}>Scale to all states and NZ</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
