// server/routes/movement.js
const express = require('express');
const router  = express.Router();
const { sendToESP32 } = require('../esp32');

router.post('/', async (req, res) => {
  try {
    const { direction } = req.body;

    const validDirections = ['left', 'right', 'loop', 'stop'];
    if (!direction || !validDirections.includes(direction)) {
      return res.status(400).json({
        error: `direction must be one of: ${validDirections.join(', ')}`
      });
    }

    // Forward to ESP32
    await sendToESP32('/move', { direction });

    res.json({ ok: true, direction });
  } catch (err) {
    console.error('Movement route error:', err.message);
    res.status(502).json({ error: 'Could not reach ESP32', detail: err.message });
  }
});

module.exports = router;