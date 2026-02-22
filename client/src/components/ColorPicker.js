import React from "react";

const PRESET_COLORS = [
  { r: 214, g: 64, b: 200, name: "Magenta" },
  { r: 50, g: 205, b: 100, name: "Green" },
  { r: 100, g: 240, b: 210, name: "Mint" },
  { r: 210, g: 220, b: 50, name: "Lime" },
  { r: 230, g: 170, b: 50, name: "Gold" },
  { r: 160, g: 60, b: 210, name: "Purple" },
  { r: 60, g: 130, b: 240, name: "Blue" },
  { r: 230, g: 60, b: 70, name: "Red" },
  { r: 70, g: 50, b: 180, name: "Indigo" },
];

const rgb = (c) => `rgb(${c.r}, ${c.g}, ${c.b})`;
const colorsMatch = (a, b) => a && b && a.r === b.r && a.g === b.g && a.b === b.b;

export default function ColorPicker({ activeColor, onSelect }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 10,
      }}
    >
      {PRESET_COLORS.map((color, i) => {
        const isActive = colorsMatch(activeColor, color);
        return (
          <button
            key={i}
            onClick={() => onSelect(color)}
            title={color.name}
            style={{
              width: "100%",
              aspectRatio: "1",
              borderRadius: 14,
              border: `3px solid ${isActive ? "white" : "transparent"}`,
              background: `linear-gradient(145deg, ${rgb(color)}, rgba(${color.r}, ${color.g}, ${color.b}, 0.73))`,
              boxShadow: isActive ? `0 0 20px ${rgb(color)}55` : "none",
              cursor: "pointer",
              transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
              transform: isActive ? "scale(1.08)" : "scale(1)",
              padding: 0,
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.target.style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.target.style.transform = "scale(1)";
            }}
          />
        );
      })}
    </div>
  );
}
