const base = import.meta.env.BASE_URL;

export default function Slide09Impact() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0c1a2e" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 80% 50%, rgba(30,155,138,0.12) 0%, transparent 60%)" }} />

      <div style={{ padding: "6vh 7vw", height: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: "3vh" }}>
          <div className="font-body font-semibold" style={{ color: "#1e9b8a", fontSize: "1.5vw", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1.5vh" }}>Impact and Scale</div>
          <div className="font-display font-extrabold" style={{ fontSize: "3.8vw", color: "#f0f7f6", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
            From 10 hours to 3 minutes.
            <span style={{ color: "#1e9b8a" }}> At scale.</span>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", gap: "4vw", alignItems: "center" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2.5vh" }}>
            <div className="font-display font-semibold" style={{ color: "#94a3b8", fontSize: "1.6vw", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.5vh" }}>Per Teacher Impact</div>

            <div style={{ display: "flex", gap: "2.5vw" }}>
              <div style={{ flex: 1, background: "rgba(30,155,138,0.08)", border: "1px solid rgba(30,155,138,0.25)", borderRadius: "12px", padding: "2.5vh 2vw", textAlign: "center" }}>
                <div className="font-display font-extrabold" style={{ color: "#1e9b8a", fontSize: "5vw", lineHeight: 1 }}>5–10</div>
                <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.5vw", marginTop: "1vh" }}>hours/week before</div>
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ color: "#f0a500", fontSize: "3vw", fontWeight: 700 }}>→</span>
              </div>
              <div style={{ flex: 1, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "12px", padding: "2.5vh 2vw", textAlign: "center" }}>
                <div className="font-display font-extrabold" style={{ color: "#22c55e", fontSize: "5vw", lineHeight: 1 }}>3</div>
                <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.5vw", marginTop: "1vh" }}>minutes with TeachSmart</div>
              </div>
            </div>

            <div style={{ padding: "2vh 2vw", background: "rgba(240,165,0,0.07)", border: "1px solid rgba(240,165,0,0.2)", borderRadius: "10px" }}>
              <div className="font-display font-bold" style={{ color: "#f0a500", fontSize: "2.2vw" }}>200+ hours</div>
              <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.5vw" }}>saved per teacher per year — back to students</div>
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2.5vh" }}>
            <div className="font-display font-semibold" style={{ color: "#94a3b8", fontSize: "1.6vw", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.5vh" }}>Market Scale</div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.8vh" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "2vw", padding: "1.8vh 2vw", background: "rgba(15,34,54,0.6)", border: "1px solid rgba(30,155,138,0.2)", borderRadius: "10px" }}>
                <div className="font-display font-extrabold" style={{ color: "#1e9b8a", fontSize: "3.2vw", lineHeight: 1, minWidth: "8vw" }}>200K</div>
                <div className="font-body" style={{ color: "#c8dedd", fontSize: "1.5vw" }}>teachers in Australia (Years 7–12)</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "2vw", padding: "1.8vh 2vw", background: "rgba(15,34,54,0.6)", border: "1px solid rgba(240,165,0,0.25)", borderRadius: "10px" }}>
                <div className="font-display font-extrabold" style={{ color: "#f0a500", fontSize: "3.2vw", lineHeight: 1, minWidth: "8vw" }}>35K</div>
                <div className="font-body" style={{ color: "#c8dedd", fontSize: "1.5vw" }}>immediate market — NSW, VIC, QLD, ACT</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "2vw", padding: "1.8vh 2vw", background: "rgba(15,34,54,0.6)", border: "1px solid rgba(129,140,248,0.25)", borderRadius: "10px" }}>
                <div className="font-display font-extrabold" style={{ color: "#818cf8", fontSize: "2.2vw", lineHeight: 1, minWidth: "8vw" }}>NZ · SG</div>
                <div className="font-body" style={{ color: "#c8dedd", fontSize: "1.5vw" }}>Expandable to NZ, Singapore, UK next</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
