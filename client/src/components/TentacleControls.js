import React, { useState, useEffect } from "react";

const STATES = [
  { key: "left", label: "Curl\nLeft" },
  { key: "resting", label: "Resting" },
  { key: "right", label: "Curl\nRight" },
];

export default function TentacleControls({ state, onDirectionChange }) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingTop: 10,
        }}
      >
        {/* Left Arrow */}
        <button
          onClick={() => onDirectionChange("left")}
          style={{
            fontSize: 22,
            color: state === "left" ? "var(--accent-purple)" : "var(--text-dim)",
            padding: "8px 4px",
            border: "none",
            background: "none",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          ‹
        </button>

        {/* 3 State Boxes */}
        <div style={{ display: "flex", gap: 8 }}>
          {STATES.map((s) => {
            const isActive = state === s.key;
            return (
              <div
                key={s.key}
                onClick={() => onDirectionChange(s.key)}
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 10,
                  border: isActive
                    ? "2px solid var(--accent-purple)"
                    : "1.5px solid var(--border-medium)",
                  background: isActive
                    ? "rgba(160, 60, 210, 0.12)"
                    : "rgba(255,255,255,0.02)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                  animation: isActive ? "tentaclePulse 2s infinite" : "none",
                  cursor: "pointer",
                }}
              >
                {isActive && (
                  <div
                    style={{
                      fontSize: 9,
                      color: "var(--accent-purple)",
                      fontWeight: 600,
                      textAlign: "center",
                      lineHeight: 1.3,
                      fontFamily: "var(--font-mono)",
                      whiteSpace: "pre-line",
                      animation: "fadeIn 0.3s ease-out",
                    }}
                  >
                    {s.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => onDirectionChange("right")}
          style={{
            fontSize: 22,
            color: state === "right" ? "var(--accent-purple)" : "var(--text-dim)",
            padding: "8px 4px",
            border: "none",
            background: "none",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          ›
        </button>
      </div>

      {/* Countdown timer */}
      {state !== "resting" && (
        <div style={{ marginTop: 20, animation: "fadeIn 0.3s ease-out" }}>
          <Countdown key={state} />
        </div>
      )}
    </div>
  );
}

/* ─── Countdown Timer ─── */
function Countdown() {
  const [seconds, setSeconds] = useState(6);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const progress = (6 - seconds) / 6;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 120,
          height: 3,
          borderRadius: 2,
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: "100%",
            borderRadius: 2,
            background: "linear-gradient(90deg, #a03cd2, #6e30b0)",
            transition: "width 1s linear",
          }}
        />
      </div>
      <span
        style={{
          fontSize: 11,
          color: "var(--text-dim)",
          fontFamily: "var(--font-mono)",
          minWidth: 20,
        }}
      >
        {seconds}s
      </span>
    </div>
  );
}
