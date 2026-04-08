const base = import.meta.env.BASE_URL;

export default function Slide03Persona() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex" style={{ background: "#0f2236" }}>
      <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, #0c1a2e 0%, #0f2236 100%)" }} />
      <div className="absolute top-0 right-0" style={{ width: "45vw", height: "100vh", background: "linear-gradient(135deg, rgba(30,155,138,0.12) 0%, transparent 70%)" }} />

      <div className="relative flex w-full" style={{ padding: "7vh 0" }}>
        <div style={{ width: "52%", padding: "0 4vw 0 7vw", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className="font-body font-semibold" style={{ color: "#1e9b8a", fontSize: "1.5vw", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "2vh" }}>Our Primary User</div>
          <div className="font-display font-extrabold" style={{ fontSize: "5vw", color: "#f0f7f6", lineHeight: 1, marginBottom: "4vh", letterSpacing: "-0.02em" }}>
            Meet Sarah Jin
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "2vh" }}>
            <div style={{ display: "flex", gap: "1.5vw", alignItems: "flex-start" }}>
              <div style={{ width: "0.4vw", height: "2.5vh", background: "#1e9b8a", borderRadius: "2px", marginTop: "0.5vh", flexShrink: 0 }} />
              <div>
                <span className="font-display font-semibold" style={{ color: "#f0f7f6", fontSize: "1.8vw" }}>Year 9 History Teacher</span>
                <span className="font-body" style={{ color: "#94a3b8", fontSize: "1.6vw" }}> — Parramatta, NSW (2150)</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "1.5vw", alignItems: "flex-start" }}>
              <div style={{ width: "0.4vw", height: "2.5vh", background: "#1e9b8a", borderRadius: "2px", marginTop: "0.5vh", flexShrink: 0 }} />
              <div className="font-body" style={{ color: "#c8dedd", fontSize: "1.7vw" }}>
                Highly multicultural class — Western Sydney
              </div>
            </div>

            <div style={{ display: "flex", gap: "1.5vw", alignItems: "flex-start" }}>
              <div style={{ width: "0.4vw", height: "2.5vh", background: "#f0a500", borderRadius: "2px", marginTop: "0.5vh", flexShrink: 0 }} />
              <div>
                <span className="font-display font-semibold" style={{ color: "#f0a500", fontSize: "1.8vw" }}>Topic: </span>
                <span className="font-body" style={{ color: "#f0f7f6", fontSize: "1.7vw" }}>Rights and Freedoms</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "1.5vw", alignItems: "flex-start" }}>
              <div style={{ width: "0.4vw", height: "2.5vh", background: "#1e9b8a", borderRadius: "2px", marginTop: "0.5vh", flexShrink: 0 }} />
              <div className="font-body" style={{ color: "#c8dedd", fontSize: "1.7vw" }}>
                Needs: AC v9 aligned, trust-verified, locally contextualised
              </div>
            </div>
          </div>

          <div style={{ marginTop: "4vh", padding: "2.5vh 2.5vw", background: "rgba(240,165,0,0.1)", border: "1px solid rgba(240,165,0,0.3)", borderRadius: "12px" }}>
            <div className="font-body font-medium" style={{ color: "#f0a500", fontSize: "1.6vw" }}>
              She has one hour. This is her reality every week.
            </div>
          </div>
        </div>

        <div style={{ width: "48%", display: "flex", alignItems: "center", justifyContent: "center", paddingRight: "5vw" }}>
          <div style={{ position: "relative", width: "88%", height: "76vh", borderRadius: "20px", overflow: "hidden" }}>
            <img
              src={`${base}sarah-chen.png`}
              crossOrigin="anonymous"
              alt="Sarah Jin — Year 9 teacher"
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(12,26,46,0.7) 0%, transparent 50%)" }} />
            <div style={{ position: "absolute", bottom: "3vh", left: "2vw", right: "2vw" }}>
              <div className="font-display font-bold" style={{ color: "#f0f7f6", fontSize: "1.8vw" }}>Sarah Jen</div>
              <div className="font-body" style={{ color: "#c8dedd", fontSize: "1.5vw" }}>Darug Country · Parramatta, NSW</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
