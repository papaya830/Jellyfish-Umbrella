import React from "react";

export default function Header({ page, setPage }) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "18px 28px",
        borderBottom: "1px solid var(--border-subtle)",
        position: "relative",
        zIndex: 10,
        backdropFilter: "blur(12px)",
        background: "rgba(26, 26, 46, 0.6)",
      }}
    >
      <button
        onClick={() => setPage("facts")}
        style={{
          fontSize: 13,
          color: page === "facts" ? "#fff" : "var(--text-dim)",
          fontWeight: page === "facts" ? 600 : 400,
          letterSpacing: 0.3,
          border: "none",
          background: "none",
          cursor: "pointer",
          fontFamily: "var(--font-body)",
          transition: "color 0.2s",
        }}
      >
        fun facts
      </button>

      <span
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: "#fff",
          letterSpacing: 0.5,
        }}
      >
        {page === "control" ? "control panel" : "fun facts"}
      </span>

      <button
        onClick={() => setPage("control")}
        style={{
          fontSize: 13,
          color: page === "control" ? "var(--text-dim)" : "var(--text-secondary)",
          fontWeight: page === "control" ? 600 : 400,
          border: "none",
          background: "none",
          cursor: "pointer",
          fontFamily: "var(--font-body)",
          transition: "color 0.2s",
        }}
      >
        {page === "facts" ? "control panel" : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          </svg>
        )}
      </button>
    </header>
  );
}
