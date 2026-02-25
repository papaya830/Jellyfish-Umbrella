import React, { useState } from "react";

const EFFECTS = [
  {
    id: "static",
    label: "Static",
    desc: "Solid color",
  },
  {
    id: "pulse",
    label: "Pulse",
    desc: "Breathe in & out",
  },
  {
    id: "sparkling",
    label: "Sparkling",
    desc: "Twinkle effect",
  },
  {
    id: "rainbow",
    label: "Rainbow",
    desc: "Cycle all colors",
  },
  {
    id: "chase",
    label: "White Chase",
    desc: "Theater chase",
  },
];

export default function LightingEffects({ activeEffect, onSelect }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div>
      <style>{`
        @keyframes pulseAnim {
          0%, 100% { opacity: 0.3; transform: scale(0.92); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes sparkle1 {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
        @keyframes sparkle2 {
          0%, 100% { opacity: 0; }
          30% { opacity: 1; }
        }
        @keyframes sparkle3 {
          0%, 100% { opacity: 0; }
          70% { opacity: 1; }
        }
        @keyframes rainbowShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes chaseMove {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes staticGlow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .effect-box {
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }
        .effect-box:hover {
          transform: translateY(-2px);
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {EFFECTS.map((effect) => {
          const isActive = activeEffect === effect.id;
          const isHovered = hovered === effect.id;

          return (
            <div
              key={effect.id}
              className="effect-box"
              onClick={() => onSelect(effect.id)}
              onMouseEnter={() => setHovered(effect.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                padding: "14px 16px",
                borderRadius: 12,
                border: isActive
                  ? "2px solid var(--accent-purple)"
                  : "1.5px solid rgba(255,255,255,0.08)",
                background: isActive
                  ? "rgba(160, 60, 210, 0.12)"
                  : "rgba(255,255,255,0.02)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* ── Hover Animation Overlays ── */}
              {isHovered && effect.id === "pulse" && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 12,
                    background: "radial-gradient(circle at center, rgba(160,60,210,0.2), transparent 70%)",
                    animation: "pulseAnim 1.5s ease-in-out infinite",
                    pointerEvents: "none",
                  }}
                />
              )}

              {isHovered && effect.id === "sparkling" && (
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        width: 3,
                        height: 3,
                        borderRadius: "50%",
                        background: "#fff",
                        top: `${15 + (i * 37) % 70}%`,
                        left: `${10 + (i * 29) % 80}%`,
                        animation: `sparkle${(i % 3) + 1} ${0.6 + (i % 4) * 0.3}s ease-in-out infinite`,
                        animationDelay: `${i * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
              )}

              {isHovered && effect.id === "rainbow" && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(90deg, #ff0000, #ff8800, #ffff00, #00ff00, #0088ff, #8800ff, #ff0000)",
                    backgroundSize: "200% 100%",
                    animation: "rainbowShift 2s linear infinite",
                    opacity: 0.15,
                    pointerEvents: "none",
                  }}
                />
              )}

              {isHovered && effect.id === "chase" && (
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "40%",
                      height: "100%",
                      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
                      animation: "chaseMove 1s linear infinite",
                    }}
                  />
                </div>
              )}

              {isHovered && effect.id === "static" && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "radial-gradient(circle at center, rgba(160,60,210,0.15), transparent 60%)",
                    animation: "staticGlow 3s ease-in-out infinite",
                    pointerEvents: "none",
                  }}
                />
              )}

              {/* ── Content ── */}
              <div style={{ position: "relative", zIndex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? "var(--accent-purple)" : "rgba(255,255,255,0.7)",
                      transition: "color 0.2s",
                    }}
                  >
                    {effect.label}
                  </span>
                  {isActive && (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "var(--accent-purple)",
                        boxShadow: "0 0 8px rgba(160,60,210,0.6)",
                      }}
                    />
                  )}
                </div>
                <span
                  style={{
                    fontSize: 10,
                    color: isActive ? "rgba(160,60,210,0.5)" : "rgba(255,255,255,0.25)",
                    fontFamily: "var(--font-mono)",
                    marginTop: 2,
                    display: "block",
                    transition: "color 0.2s",
                  }}
                >
                  {effect.desc}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}