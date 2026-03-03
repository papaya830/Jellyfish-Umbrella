const express = require("express");
const router = express.Router();
const { setMovement } = require("../esp32");

const RESET_DELAY_MS = 6000; // 6 seconds before auto-reset to neutral

/**
 * POST /api/movement
 * Body: { direction: "left" | "right" | "neutral" }
 *
 * - "left" / "right": curl tentacles in the specified direction, then
 *   automatically reset to neutral/resting after 6 seconds.
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

  const state = req.app.locals;

  // Always clear any existing reset timer before handling the new command
  if (state.resetTimer) {
    clearTimeout(state.resetTimer);
    state.resetTimer = null;
  }

  // If we're being asked to go neutral, just stop and return immediately
  if (direction === "neutral") {
    state.state.position = "resting";
    const result = await setMovement("neutral");
    console.log("[Movement] Immediate stop → neutral");
    return res.json({
      success: true,
      direction,
      esp32: result.success,
    });
  }

  // For left/right, update state and start the usual auto‑reset timer
  state.state.position = direction;

  const result = await setMovement(direction);
  console.log(`[Movement] Tentacles → ${direction}`);

  state.resetTimer = setTimeout(async () => {
    state.state.position = "resting";
    await setMovement("neutral");
    console.log(
      `[Movement] Auto-reset → neutral (after ${RESET_DELAY_MS / 1000}s)`
    );
    state.resetTimer = null;
  }, RESET_DELAY_MS);

  res.json({
    success: true,
    direction,
    resetIn: RESET_DELAY_MS,
    esp32: result.success,
  });
});

module.exports = router;
