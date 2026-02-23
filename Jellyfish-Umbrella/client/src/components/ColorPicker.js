import React from "react";

const PRESET_COLORS = [
  { r: 255, g: 0,   b: 234, name: "Magenta" },
  { r: 0,   g: 255, b: 47,  name: "Green" },
  { r: 0,   g: 255, b: 191, name: "Mint" },
  { r: 221, g: 255, b: 0,   name: "Lime" },
  { r: 255, g: 200, b: 0,   name: "Gold" },
  { r: 208, g: 0,   b: 255, name: "Purple" },
  { r: 0,   g: 190, b: 255, name: "Blue" },
  { r: 255, g: 0,   b: 4,   name: "Red" },
  { r: 91,  g: 0,   b: 255, name: "Indigo" },
];

const rgb = (c) => `rgb(${c.r}, ${c.g}, ${c.b})`;
const colorsMatch = (a, b) => a && b && a.r === b.r && a.g === b.g && a.b === b.b;
const toHex = (c) => '#' + [c.r, c.g, c.b].map(v => v.toString(16).padStart(2, '0')).join('');

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
