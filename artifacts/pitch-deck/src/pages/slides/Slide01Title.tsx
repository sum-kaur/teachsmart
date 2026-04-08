const base = import.meta.env.BASE_URL;

export default function Slide01Title() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0c1a2e" }}>
      <img
        src={`${base}hero-classroom.png`}
        crossOrigin="anonymous"
        alt="Diverse Australian classroom"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.35 }}
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(12,26,46,0.92) 0%, rgba(12,26,46,0.70) 50%, rgba(30,155,138,0.45) 100%)" }} />

      <div className="absolute inset-0 flex flex-col justify-between" style={{ padding: "7vh 8vw" }}>
        <div className="flex items-center gap-[1.2vw]">
          <div style={{ width: "0.5vw", height: "4vh", background: "#1e9b8a", borderRadius: "2px" }} />
          <span className="font-body font-semibold" style={{ color: "#1e9b8a", fontSize: "1.6vw", letterSpacing: "0.15em", textTransform: "uppercase" }}>Cambridge EduX Hackathon 2026</span>
        </div>

        <div>
          <div className="font-display font-extrabold tracking-tight" style={{ fontSize: "9vw", lineHeight: 0.9, color: "#f0f7f6", letterSpacing: "-0.03em" }}>
            Teach
            <span style={{ color: "#1e9b8a" }}>Smart</span>
          </div>
          <div className="font-body font-medium" style={{ fontSize: "2.2vw", color: "#c8dedd", marginTop: "3vh", maxWidth: "60vw", lineHeight: 1.4 }}>
            The search engine that knows your classroom,
            your curriculum, and your community.
          </div>
          <div style={{ width: "8vw", height: "0.4vh", background: "#1e9b8a", marginTop: "3vh", borderRadius: "2px" }} />
        </div>

        <div className="flex items-center justify-between">
          <div className="font-body" style={{ color: "#94a3b8", fontSize: "1.5vw" }}>
            Challenge 4 · Team TeachSmart · April 9, 2026 · UTS Sydney
          </div>
          <div className="flex items-center gap-[0.8vw]">
            <div style={{ width: "1.2vw", height: "1.2vw", borderRadius: "50%", background: "#1e9b8a" }} />
            <span className="font-display font-bold" style={{ color: "#f0f7f6", fontSize: "1.8vw" }}>TeachSmart</span>
          </div>
        </div>
      </div>
    </div>
  );
}
