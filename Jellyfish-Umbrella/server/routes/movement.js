// server/routes/movement.js
const express = require('express');
const router  = express.Router();
const { setMovement } = require('../esp32');

const RESET_DELAY_MS = 6000; // 6 seconds before auto-reset to neutral

/**
 * POST /api/movement
 * Body: { direction: "left" | "right" | "neutral" }
 *
 * - "left" / "right": curl tentacles in the specified direction,
 *   then automatically reset to neutral/resting after 6 seconds.
 * - "neutral": immediately stop movement and clear any pending auto‑reset.
 */
router.post("/movement", async (req, res) => {
  const { direction } = req.body;

  // Validate direction
  if (!["left", "right", "neutral"].includes(direction)) {
    return res.status(400).json({
      error: 'Invalid direction. Must be "left", "right", or "neutral".',
    });
  }

  const locals = req.app.locals;
  const appState = locals.state;

  // Clear any existing reset timer
  if (locals.resetTimer) {
    clearTimeout(locals.resetTimer);
    locals.resetTimer = null;
  }

  // If we're being asked to go neutral, just stop and return immediately
  if (direction === "neutral") {
    appState.position = "resting";
    const result = await setMovement("neutral");
    console.log('[Movement] Immediate stop → neutral');
    return res.json({
      success: true,
      direction,
      esp32: result.success,
    });
  }

  // Update state
  appState.position = direction;

  // Forward to ESP32
  const result = await setMovement(direction);
  console.log(`[Movement] Tentacles → ${direction}`);

  // Start 6-second auto-reset timer
  locals.resetTimer = setTimeout(async () => {
    appState.position = "resting";
    await setMovement("neutral");
    console.log(`[Movement] Auto-reset → neutral (after ${RESET_DELAY_MS / 1000}s)`);
    locals.resetTimer = null;
  }, RESET_DELAY_MS);

  res.json({
    success: true,
    direction,
    resetIn: RESET_DELAY_MS,
    esp32: result.success,
  });
});

module.exports = router;