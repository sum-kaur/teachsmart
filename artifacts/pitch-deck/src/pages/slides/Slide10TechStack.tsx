export default function Slide10TechStack() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0c1a2e" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(30,155,138,0.1) 0%, transparent 55%)" }} />
      <div className="absolute top-0 left-0 right-0" style={{ height: "0.4vh", background: "linear-gradient(90deg, transparent, #1e9b8a, transparent)" }} />

      <div style={{ padding: "5.5vh 7vw", height: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: "3vh" }}>
          <div className="font-body font-semibold" style={{ color: "#1e9b8a", fontSize: "1.5vw", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1.5vh" }}>Tech Stack</div>
          <div className="font-display font-extrabold" style={{ fontSize: "3.6vw", color: "#f0f7f6", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
            Open. Transparent. Documented.
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", gap: "2.5vw", alignItems: "stretch" }}>
          <div style={{ flex: 1, background: "rgba(15,34,54,0.7)", border: "1px solid rgba(30,155,138,0.2)", borderRadius: "14px", padding: "3vh 2.5vw" }}>
            <div style={{ borderBottom: "1.5px solid rgba(30,155,138,0.3)", paddingBottom: "1.5vh", marginBottom: "2vh" }}>
              <div className="font-display font-bold" style={{ color: "#1e9b8a", fontSize: "1.8vw" }}>Frontend</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.8vh" }}>
              <div>
                <div className="font-body font-semibold" style={{ color: "#f0f7f6", fontSize: "1.6vw" }}>React 19 + Vite 7</div>
                <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.4vw" }}>Fast, modern, production-ready</div>
              </div>
              <div>
                <div className="font-body font-semibold" style={{ color: "#f0f7f6", fontSize: "1.6vw" }}>TypeScript</div>
                <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.4vw" }}>Safe, typed, maintainable</div>
              </div>
              <div>
                <div className="font-body font-semibold" style={{ color: "#f0f7f6", fontSize: "1.6vw" }}>Tailwind CSS</div>
                <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.4vw" }}>Consistent design system</div>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, background: "rgba(15,34,54,0.7)", border: "1px solid rgba(240,165,0,0.2)", borderRadius: "14px", padding: "3vh 2.5vw" }}>
            <div style={{ borderBottom: "1.5px solid rgba(240,165,0,0.3)", paddingBottom: "1.5vh", marginBottom: "2vh" }}>
              <div className="font-display font-bold" style={{ color: "#f0a500", fontSize: "1.8vw" }}>Backend</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.8vh" }}>
              <div>
                <div className="font-body font-semibold" style={{ color: "#f0f7f6", fontSize: "1.6vw" }}>Express 5 + Node.js</div>
                <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.4vw" }}>Lightweight, scalable API</div>
              </div>
              <div>
                <div className="font-body font-semibold" style={{ color: "#f0f7f6", fontSize: "1.6vw" }}>Groq LLaMA 3.3</div>
                <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.4vw" }}>Resource generation engine</div>
              </div>
              <div>
                <div className="font-body font-semibold" style={{ color: "#f0f7f6", fontSize: "1.6vw" }}>Tavily Search API</div>
                <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.4vw" }}>Real-time web resource discovery</div>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, background: "rgba(15,34,54,0.7)", border: "1px solid rgba(129,140,248,0.2)", borderRadius: "14px", padding: "3vh 2.5vw" }}>
            <div style={{ borderBottom: "1.5px solid rgba(129,140,248,0.3)", paddingBottom: "1.5vh", marginBottom: "2vh" }}>
              <div className="font-display font-bold" style={{ color: "#818cf8", fontSize: "1.8vw" }}>Data</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.8vh" }}>
              <div>
                <div className="font-body font-semibold" style={{ color: "#f0f7f6", fontSize: "1.6vw" }}>Australian Curriculum v9</div>
                <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.4vw" }}>Full AC v9 JSON from ACARA</div>
              </div>
              <div>
                <div className="font-body font-semibold" style={{ color: "#f0f7f6", fontSize: "1.6vw" }}>30+ Trusted Sources</div>
                <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.4vw" }}>Verified Australian education orgs</div>
              </div>
              <div>
                <div className="font-body font-semibold" style={{ color: "#f0f7f6", fontSize: "1.6vw" }}>Postcode Context Maps</div>
                <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.4vw" }}>Local + First Nations data</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: "2vh", display: "flex", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5vw", padding: "1.2vh 3vw", background: "rgba(30,155,138,0.08)", border: "1px solid rgba(30,155,138,0.2)", borderRadius: "8px" }}>
            <div style={{ width: "0.6vw", height: "0.6vw", borderRadius: "50%", background: "#1e9b8a" }} />
            <span className="font-body" style={{ color: "#94a3b8", fontSize: "1.5vw" }}>
              Fully open-source · All sources documented · No black boxes
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
