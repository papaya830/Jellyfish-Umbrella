import React, { useState, useRef } from "react";
import ColorPicker from "./ColorPicker";
import AIColorPicker from "./AIColorPicker";
import TentacleControls from "./TentacleControls";
import { setColor, setMovement } from "../api";

const rgb = (c) => `rgb(${c.r}, ${c.g}, ${c.b})`;

export default function ControlPanel({
  activeColor,
  setActiveColor,
  tentacleState,
  setTentacleState,
}) {
  const [colorMode, setColorMode] = useState("presets"); // "presets" | "ai"
  const resetTimerRef = useRef(null);

  // ── Handle color selection (preset or AI) ──
  const handleColorSelect = async (color) => {
    setActiveColor(color);
    try {
      await setColor(color);
    } catch (err) {
      console.error("Failed to send color:", err);
    }
  };

  // ── Handle tentacle direction ──
  const handleTentacle = async (direction) => {
    // Clear existing reset timer
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    setTentacleState(direction);

    if (direction !== "resting") {
      try {
        await setMovement(direction);
      } catch (err) {
        console.error("Failed to send movement:", err);
      }

      // Client-side timer synced with server's 6s reset
      resetTimerRef.current = setTimeout(() => {
        setTentacleState("resting");
        resetTimerRef.current = null;
      }, 6000);
    }
  };

  return (
    <div
      style={{
        padding: "0 24px 40px",
        maxWidth: 520,
        margin: "0 auto",
        animation: "fadeIn 0.4s ease-out",
      }}
    >
      {/* Active color indicator */}
      {activeColor && (
        <div
          style={{
            margin: "20px 0 0",
            padding: "10px 16px",
            borderRadius: 10,
            background: `${rgb(activeColor)}12`,
            border: `1px solid ${rgb(activeColor)}30`,
            display: "flex",
            alignItems: "center",
            gap: 10,
            animation: "fadeIn 0.3s ease-out",
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 6,
              background: rgb(activeColor),
              boxShadow: `0 0 12px ${rgb(activeColor)}66`,
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              color: "var(--text-secondary)",
            }}
          >
            active — rgb({activeColor.r}, {activeColor.g}, {activeColor.b})
          </span>
        </div>
      )}

      {/* Section labels */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          marginTop: 32,
          marginBottom: 24,
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,0.85)", letterSpacing: 0.8 }}>
          colours
        </span>
        <span style={{ fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,0.85)", letterSpacing: 0.8 }}>
          tentacles
        </span>
      </div>

      {/* Main content: colors + tentacles side by side */}
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        {/* Colors */}
        <div style={{ flex: 1 }}>
          {colorMode === "presets" ? (
            <ColorPicker activeColor={activeColor} onSelect={handleColorSelect} />
          ) : (
            <AIColorPicker activeColor={activeColor} onSelect={handleColorSelect} />
          )}

          {/* Toggle link */}
          <button
            onClick={() => setColorMode(colorMode === "presets" ? "ai" : "presets")}
            style={{
              display: "block",
              margin: "16px auto 0",
              fontSize: 12,
              color: "var(--text-dim)",
              textDecoration: "underline",
              textUnderlineOffset: 3,
              padding: 4,
              border: "none",
              background: "none",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.color = "var(--text-secondary)")}
            onMouseLeave={(e) => (e.target.style.color = "var(--text-dim)")}
          >
            {colorMode === "presets" ? "more colours" : "nine colours"}
          </button>
        </div>

        {/* Tentacles */}
        <div style={{ flex: 1 }}>
          <TentacleControls
            state={tentacleState}
            onDirectionChange={handleTentacle}
          />
        </div>
      </div>

      {/* Status footer */}
      <div
        style={{
          marginTop: 36,
          padding: "14px 18px",
          borderRadius: 12,
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 11, color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
          ESP32 {activeColor ? "● connected" : "○ waiting"}
        </div>
        <div style={{ fontSize: 10, color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
          tentacles: {tentacleState}
        </div>
      </div>
    </div>
  );
}
