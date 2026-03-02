import React from "react";

export default function Header({ page, setPage }) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "18px 28px",
        borderBottom: "1px solid var(--border-subtle)",
        position: "relative",
        zIndex: 10,
        backdropFilter: "blur(12px)",
        background: "rgba(26, 26, 46, 0.6)",
      }}
    >
      <button
        onClick={() => setPage(page === "facts" ? "control" : "facts")}
        style={{
          position: "absolute",
          left: 28,
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: 18,
          color: "var(--text-secondary)",
          fontWeight: 600,
          letterSpacing: 0.3,
          border: "none",
          background: "none",
          cursor: "pointer",
          fontFamily: "var(--font-body)",
          transition: "color 0.2s",
        }}
      >
        {page === "facts" ? "control panel" : "fun facts"}
      </button>

      <span
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: "#fff",
          letterSpacing: 0.5,
        }}
      >
        {page === "control" ? "control panel" : "fun facts"}
      </span>
    </header>
  );
}
