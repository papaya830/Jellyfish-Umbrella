const express = require("express");
const router = express.Router();
const { setMovement } = require("../esp32");

const RESET_DELAY_MS = 6000; // 6 seconds before auto-reset to neutral

/**
 * POST /api/movement
 * Body: { direction: "left" | "right" }
 * Curls tentacles in the specified direction.
 * Automatically resets to neutral/resting after 6 seconds.
 */
router.post("/movement", async (req, res) => {
  const { direction } = req.body;

  // Validate direction
  if (!["left", "right"].includes(direction)) {
    return res.status(400).json({
      error: 'Invalid direction. Must be "left" or "right".',
    });
  }

  const state = req.app.locals;

  // Clear any existing reset timer
  if (state.resetTimer) {
    clearTimeout(state.resetTimer);
    state.resetTimer = null;
  }

  // Update state
  state.state.position = direction;

  // Forward to ESP32
  const result = await setMovement(direction);
  console.log(`[Movement] Tentacles → ${direction}`);

  // Start 6-second auto-reset timer
  state.resetTimer = setTimeout(async () => {
    state.state.position = "resting";
    await setMovement("neutral");
    console.log(`[Movement] Auto-reset → neutral (after ${RESET_DELAY_MS / 1000}s)`);
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
