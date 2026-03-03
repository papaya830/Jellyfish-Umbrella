import React, { useEffect, useRef, useState } from "react";
import { setMovement } from "../api";
import "./MovementModeControl.css";

// Interval between automatic direction changes in "continuous" mode (ms)
const CONTINUOUS_INTERVAL_MS = 8000;

/**
 * Compact tentacle movement control with four high‑level modes:
 *  - In        → single move "in" (mapped to ESP32 "left")
 *  - Out       → single move "out" (mapped to ESP32 "right")
 *  - Continuous→ gently alternate in/out on a timer
 *  - Stop      → send an immediate neutral/stop command
 */
export default function MovementModeControl({ tentacleState, setTentacleState }) {
  const [activeMode, setActiveMode] = useState("stop"); // 'in'|'out'|'continuous'|'stop'
  const [status, setStatus] = useState("idle"); // 'idle'|'error' (no longer used for disabling)
  const [lastDirection, setLastDirection] = useState(null); // 'left'|'right'|null

  const intervalRef = useRef(null);
  const nextDirRef = useRef("left");

  const clearContinuousTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const sendDirection = async (direction) => {
    try {
      await setMovement({ direction });
      setLastDirection(direction === "neutral" ? null : direction);
    } catch (err) {
      console.error("Failed to set movement", err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2500);
    }
  };

  const modeToPreviewState = (mode) => {
    if (mode === "in") return "in";
    if (mode === "out") return "out";
    if (mode === "continuous") return "continuous";
    return "resting";
  };

  const handleModeChange = async (mode) => {
    if (mode === activeMode && mode !== "continuous") {
      // No-op for re-clicking the same one-off mode
      return;
    }

    setActiveMode(mode);

    clearContinuousTimer();

    if (mode === "stop") {
      // Immediate neutral command, preview goes to resting straight away
      if (setTentacleState) setTentacleState("resting");
      await sendDirection("neutral");
      return;
    }

    if (mode === "in") {
      if (setTentacleState) setTentacleState("in");
      await sendDirection("left");
      return;
    }

    if (mode === "out") {
      if (setTentacleState) setTentacleState("out");
      await sendDirection("right");
      return;
    }

    if (mode === "continuous") {
      // Start alternating between left / right on a gentle timer.
      // We also fire an immediate move so the mode feels responsive
      const first = nextDirRef.current;
      const firstState = first === "left" ? "in" : "out";
      if (setTentacleState) setTentacleState(firstState);
      await sendDirection(first);
      nextDirRef.current = first === "left" ? "right" : "left";

      intervalRef.current = setInterval(() => {
        const dir = nextDirRef.current;
        const state = dir === "left" ? "in" : "out";
        nextDirRef.current = dir === "left" ? "right" : "left";
        if (setTentacleState) setTentacleState(state);
        // Fire-and-forget; errors are logged inside sendDirection.
        sendDirection(dir);
      }, CONTINUOUS_INTERVAL_MS);
    }
  };

  // Clean up any timers on unmount
  useEffect(() => {
    return () => {
      clearContinuousTimer();
    };
  }, []);

  const statusText = (() => {
    if (status === "error") return "Could not reach ESP32 — check Wi‑Fi/IP.";
    if (activeMode === "continuous") return "Continuous sway — alternating in/out.";
    if (activeMode === "in") return "Single move inwards.";
    if (activeMode === "out") return "Single move outwards.";
    if (activeMode === "stop") return "Stopped — tentacles resting.";
    if (lastDirection) return `Last moved ${lastDirection}.`;
    return "Ready to move tentacles.";
  })();

  return (
    <div className="cp-card cp-pattern-card-full mm-card">
      <div className="mm-title">Step 4 — Tentacle movement</div>
      <div className="mm-subtitle">
        Choose how the tentacles move — one tap modes plus a continuous sway.
      </div>

      <div className="mm-grid">
        <button
          type="button"
          className={`mm-btn${activeMode === "in" ? " mm-btn--active" : ""}`}
          onClick={() => handleModeChange("in")}
          onMouseEnter={() => {
            if (setTentacleState) setTentacleState(modeToPreviewState("in"));
          }}
          onMouseLeave={() => {
            if (setTentacleState) setTentacleState(modeToPreviewState(activeMode));
          }}
        >
          <span className="mm-label">In</span>
          <span className="mm-desc">Curl tentacles inward once.</span>
        </button>

        <button
          type="button"
          className={`mm-btn${activeMode === "out" ? " mm-btn--active" : ""}`}
          onClick={() => handleModeChange("out")}
          onMouseEnter={() => {
            if (setTentacleState) setTentacleState(modeToPreviewState("out"));
          }}
          onMouseLeave={() => {
            if (setTentacleState) setTentacleState(modeToPreviewState(activeMode));
          }}
        >
          <span className="mm-label">Out</span>
          <span className="mm-desc">Curl tentacles outward once.</span>
        </button>

        <button
          type="button"
          className={`mm-btn mm-btn--accent${
            activeMode === "continuous" ? " mm-btn--active" : ""
          }`}
          onClick={() => handleModeChange("continuous")}
          onMouseEnter={() => {
            if (setTentacleState) setTentacleState(modeToPreviewState("continuous"));
          }}
          onMouseLeave={() => {
            if (setTentacleState) setTentacleState(modeToPreviewState(activeMode));
          }}
        >
          <span className="mm-label">Continuous</span>
          <span className="mm-desc">Gently alternate in and out.</span>
        </button>

        <button
          type="button"
          className={`mm-btn mm-btn--danger${
            activeMode === "stop" ? " mm-btn--active" : ""
          }`}
          onClick={() => handleModeChange("stop")}
          onMouseEnter={() => {
            if (setTentacleState) setTentacleState("resting");
          }}
          onMouseLeave={() => {
            if (setTentacleState) setTentacleState(modeToPreviewState(activeMode));
          }}
        >
          <span className="mm-label">Stop</span>
          <span className="mm-desc">Send an immediate stop.</span>
        </button>
      </div>

      <div className="mm-status">
        {statusText}
        {tentacleState && (
          <span className="mm-state"> · State: {tentacleState}</span>
        )}
      </div>
    </div>
  );
}

