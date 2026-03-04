// server/routes/movement.js
const express = require('express');
const router  = express.Router();
const { setMovement } = require('../esp32');

const RESET_DELAY_MS = 6000;

router.post("/", async (req, res) => {   // ← changed from "/movement" to "/"
  const { direction } = req.body;

  if (!["left", "right", "loop", "stop", "neutral"].includes(direction)) {  // ← added loop, stop
    return res.status(400).json({
      error: 'Invalid direction. Must be "left", "right", "loop", "stop", or "neutral".',
    });
  }

  const locals = req.app.locals;
  const appState = locals.state;

  if (locals.resetTimer) {
    clearTimeout(locals.resetTimer);
    locals.resetTimer = null;
  }

  if (direction === "neutral" || direction === "stop") {
    appState.position = "resting";
    const result = await setMovement("neutral");
    console.log('[Movement] Immediate stop → neutral');
    return res.json({ success: true, direction, esp32: result.success });
  }

  appState.position = direction;
  const result = await setMovement(direction);
  console.log(`[Movement] Tentacles → ${direction}`);

  res.json({ success: true, direction, esp32: result.success });
});

module.exports = router;