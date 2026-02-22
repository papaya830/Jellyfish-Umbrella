import React, { useState } from "react";

const FUN_FACTS = [
  "Jellyfish do not have brains or hearts.",
  "Some jellyfish are bioluminescent — they glow in the dark.",
  "The Turritopsis dohrnii, or 'immortal jellyfish', can revert to its juvenile state.",
  "Jellyfish have roamed the oceans for over 500 million years — before dinosaurs.",
  "A group of jellyfish is called a bloom, swarm, or smack.",
  "Jellyfish are 95% water.",
  "The lion's mane jellyfish can grow tentacles over 36 meters long.",
  "Jellyfish inspired the bell-shaped design used in modern underwater robotics.",
  "NASA has sent jellyfish to space to study how microgravity affects development.",
  "Engineers study jellyfish propulsion for energy-efficient underwater vehicles.",
];

export default function FunFacts() {
  const [factIdx, setFactIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  const nextFact = () => {
    setVisible(false);
    setTimeout(() => {
      setFactIdx((i) => (i + 1) % FUN_FACTS.length);
      setVisible(true);
    }, 250);
  };

  return (
    <div
      style={{
        position: "relative",
        minHeight: "calc(100vh - 60px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 28px",
        overflow: "hidden",
      }}
    >
      {/* ── Floating Glass Bubbles Background ── */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 0 }}>
        <div
          style={{
            position: "absolute",
            width: 320,
            height: 320,
            borderRadius: "50%",
            top: "5%",
            right: "-8%",
            background:
              "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.08), rgba(160,60,210,0.04), transparent 70%)",
            border: "1px solid rgba(255,255,255,0.04)",
            animation: "float1 12s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 240,
            height: 240,
            borderRadius: "50%",
            bottom: "10%",
            left: "-5%",
            background:
              "radial-gradient(circle at 40% 30%, rgba(255,255,255,0.06), rgba(60,130,240,0.04), transparent 70%)",
            border: "1px solid rgba(255,255,255,0.03)",
            animation: "float2 15s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 180,
            height: 180,
            borderRadius: "50%",
            top: "35%",
            left: "15%",
            background:
              "radial-gradient(circle at 45% 40%, rgba(255,255,255,0.05), rgba(100,240,210,0.03), transparent 65%)",
            border: "1px solid rgba(255,255,255,0.025)",
            animation: "float3 10s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 140,
            height: 140,
            borderRadius: "50%",
            top: "15%",
            left: "50%",
            background:
              "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.07), transparent 60%)",
            border: "1px solid rgba(255,255,255,0.03)",
            animation: "float1 18s ease-in-out infinite reverse",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 100,
            height: 100,
            borderRadius: "50%",
            bottom: "25%",
            right: "20%",
            background:
              "radial-gradient(circle at 40% 35%, rgba(160,60,210,0.06), transparent 60%)",
            border: "1px solid rgba(255,255,255,0.03)",
            animation: "float2 13s ease-in-out infinite reverse",
          }}
        />
        {/* Ambient glow */}
        <div
          style={{
            position: "absolute",
            width: "60%",
            height: "50%",
            top: "20%",
            left: "20%",
            background: "radial-gradient(ellipse, rgba(160,60,210,0.06), transparent 70%)",
            animation: "pulseGlow 6s ease-in-out infinite",
          }}
        />
      </div>

      {/* ── Fact Content ── */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 500, textAlign: "center" }}>
        {/* Fact card */}
        <div
          style={{
            padding: "28px 32px",
            minHeight: 160,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 16,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
            marginBottom: 48,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(8px)",
            transition: "all 0.35s ease-out",
          }}
        >
          {/* Label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
              justifyContent: "center",
            }}
          >
            <div style={{ width: 8, height: 2, background: "rgba(160,60,210,0.5)", borderRadius: 1 }} />
            <span
              style={{
                fontSize: 10,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: "rgba(160,60,210,0.6)",
                fontFamily: "var(--font-mono)",
              }}
            >
              did you know?
            </span>
            <div style={{ width: 8, height: 2, background: "rgba(160,60,210,0.5)", borderRadius: 1 }} />
          </div>

          <p
            style={{
              fontSize: 18,
              fontWeight: 400,
              lineHeight: 1.65,
              color: "rgba(255,255,255,0.85)",
              letterSpacing: 0.2,
            }}
          >
            {FUN_FACTS[factIdx]}
          </p>
        </div>

        {/* Next fact button */}
        <button
          onClick={nextFact}
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            border: "1.5px solid rgba(160,60,210,0.35)",
            background: "rgba(160,60,210,0.08)",
            color: "rgba(255,255,255,0.85)",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "var(--font-body)",
            letterSpacing: 0.5,
            backdropFilter: "blur(8px)",
            boxShadow: "0 0 20px rgba(160,60,210,0.15)",
            cursor: "pointer",
            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            margin: "0 auto",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.06)";
            e.currentTarget.style.boxShadow = "0 0 30px rgba(160,60,210,0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 0 20px rgba(160,60,210,0.15)";
          }}
        >
          <span>next</span>
          <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.6 }}>fun fact</span>
        </button>

        {/* Counter */}
        <div
          style={{
            marginTop: 24,
            fontSize: 11,
            color: "var(--text-dim)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {factIdx + 1} / {FUN_FACTS.length}
        </div>
      </div>
    </div>
  );
}
