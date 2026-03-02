// server/routes/color.js
const express = require('express');
const router  = express.Router();
const { sendToESP32 } = require('../esp32');

router.post('/', async (req, res) => {
  try {
    const { hex, brightness, pattern } = req.body;

    // Validate hex (6 uppercase hex chars)
    if (!hex || !/^[0-9A-Fa-f]{6}$/.test(hex)) {
      return res.status(400).json({ error: 'hex must be a 6-character hex string, e.g. "FF8800"' });
    }
    // Parse hex → r, g, b for the ESP32 /led endpoint
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    const bri = Math.max(0, Math.min(255, parseInt(brightness) || 192));

    const validPatterns = ['solid', 'twinkle', 'rainbow', 'pulse', 'wave'];
    const pat = validPatterns.includes(pattern) ? pattern : 'solid';

    // Forward to ESP32
    await sendToESP32('/led', { r, g, b, brightness: bri, pattern: pat });

    res.json({ ok: true, hex, r, g, b, brightness: bri, pattern: pat });
  } catch (err) {
    console.error('Color route error:', err.message);
    res.status(502).json({ error: 'Could not reach ESP32', detail: err.message });
  }
});

module.exports = router;