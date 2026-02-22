import React, { useState, useEffect } from "react";
import { generateAIColors } from "../api";

const rgb = (c) => `rgb(${c.r}, ${c.g}, ${c.b})`;
const colorsMatch = (a, b) => a && b && a.r === b.r && a.g === b.g && a.b === b.b;

export default function AIColorPicker({ activeColor, onSelect }) {
  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState("input"); // "input" | "loading" | "pick"
  const [colors, setColors] = useState([]);
  const [dots, setDots] = useState("");
  const [error, setError] = useState(null);

  // Animate loading dots
  useEffect(() => {
    if (phase !== "loading") return;
    const iv = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 400);
    return () => clearInterval(iv);
  }, [phase]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setPhase("loading");
    setError(null);
    setColors([]);

    try {
      const data = await generateAIColors(prompt.trim());

      if (data.colors && data.colors.length === 3) {
        setColors(data.colors);
        setPhase("pick");
        if (data.fallback) {
          setError("Gemini unavailable — showing random colors");
        }
      } else {
        throw new Error("Invalid response");
      }
    } catch (err) {
      setError("Failed to reach server — is Express running?");
      setPhase("input");
    }
  };

  const handleReset = () => {
    setPrompt("");
    setPhase("input");
    setColors([]);
    setError(null);
  };

  return (
    <div>
      {/* Text input */}
      <div style={{ marginBottom: 14 }}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && phase !== "loading") {
              if (phase === "pick") handleReset();
              else handleGenerate();
            }
          }}
          placeholder="describe the colours you want..."
          disabled={phase === "loading"}
          style={{
            width: "100%",
            padding: "12px 14px",
            fontSize: 13,
            fontFamily: "var(--font-body)",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid var(--border-medium)",
            borderRadius: 10,
            color: "var(--text-primary)",
            outline: "none",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent-purple-dim)")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
        />
      </div>

      {/* Generate button */}
      {phase === "input" && (
        <button
          onClick={handleGenerate}
          disabled={!prompt.trim()}
          style={{
            width: "100%",
            padding: "11px",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "var(--font-body)",
            border: "none",
            borderRadius: 10,
            color: "#fff",
            background: !prompt.trim()
              ? "rgba(255,255,255,0.06)"
              : "linear-gradient(135deg, #a03cd2, #6e30b0)",
            opacity: !prompt.trim() ? 0.4 : 1,
            cursor: !prompt.trim() ? "default" : "pointer",
            transition: "all 0.25s",
          }}
        >
          generate
        </button>
      )}

      {/* Loading state */}
      {phase === "loading" && (
        <div
          style={{
            textAlign: "center",
            padding: "16px 0",
            fontSize: 13,
            color: "var(--text-secondary)",
            background: "linear-gradient(90deg, transparent, rgba(160,60,210,0.15), transparent)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s infinite linear",
            borderRadius: 10,
          }}
        >
          asking gemini{dots}
        </div>
      )}

      {/* AI color results */}
      {phase === "pick" && colors.length === 3 && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10,
              animation: "fadeIn 0.4s ease-out",
            }}
          >
            {colors.map((color, i) => {
              const isActive = colorsMatch(activeColor, color);
              return (
                <button
                  key={i}
                  onClick={() => onSelect(color)}
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    borderRadius: 14,
                    border: `3px solid ${isActive ? "white" : "transparent"}`,
                    background: `linear-gradient(145deg, ${rgb(color)}, rgba(${color.r}, ${color.g}, ${color.b}, 0.73))`,
                    boxShadow: isActive ? `0 0 20px ${rgb(color)}55` : "none",
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    transform: isActive ? "scale(1.08)" : "scale(1)",
                    padding: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.target.style.transform = "translateY(-4px) scale(1.05)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.target.style.transform = "scale(1)";
                  }}
                />
              );
            })}
          </div>

          {/* Try again button */}
          <button
            onClick={handleReset}
            style={{
              display: "block",
              margin: "12px auto 0",
              fontSize: 11,
              color: "var(--text-dim)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            try again
          </button>
        </>
      )}

      {/* Error message */}
      {error && (
        <div
          style={{
            marginTop: 10,
            fontSize: 11,
            color: "#f59e0b",
            textAlign: "center",
            fontFamily: "var(--font-mono)",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
