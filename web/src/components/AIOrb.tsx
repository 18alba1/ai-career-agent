type OrbState = "idle" | "speaking" | "listening" | "thinking" | "processing";

interface AIOrbProps {
  state: OrbState;
  size?: number;
}

export function AIOrb({ state, size = 120 }: AIOrbProps) {
  const colors: Record<OrbState, [string, string]> = {
    idle: ["#3b82f6", "#06b6d4"],
    speaking: ["#3b82f6", "#8b5cf6"],
    listening: ["#06b6d4", "#10b981"],
    thinking: ["#8b5cf6", "#3b82f6"],
    processing: ["#f59e0b", "#3b82f6"],
  };

  const [c1, c2] = colors[state];
  const animated = state === "speaking" || state === "listening";

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Outer pulse rings */}
      {animated && (
        <>
          <div
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              border: `2px solid ${c1}`,
              animation: "ringPulse 2s ease-out infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              border: `2px solid ${c2}`,
              animation: "ringPulse 2s ease-out infinite 0.7s",
            }}
          />
        </>
      )}

      {/* Glow */}
      <div
        style={{
          position: "absolute",
          width: "80%",
          height: "80%",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${c1}40, transparent 70%)`,
          filter: "blur(20px)",
        }}
      />

      {/* Core orb */}
      <div
        style={{
          width: "60%",
          height: "60%",
          borderRadius: "50%",
          background: `radial-gradient(circle at 35% 35%, ${c1}, ${c2})`,
          boxShadow: `0 0 30px ${c1}60, inset 0 0 20px rgba(255,255,255,0.15)`,
          animation: animated
            ? "orbFloat 2s ease-in-out infinite"
            : "orbFloat 4s ease-in-out infinite",
          position: "relative",
          transition: "background 0.6s ease",
        }}
      >
        {/* Inner shimmer */}
        <div
          style={{
            position: "absolute",
            top: "15%",
            left: "20%",
            width: "30%",
            height: "30%",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.25)",
            filter: "blur(6px)",
          }}
        />
      </div>
    </div>
  );
}
