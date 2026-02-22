const express = require("express");
const router = express.Router();
const { setLEDColor } = require("../esp32");

/**
 * POST /api/color
 * Body: { r: 0-255, g: 0-255, b: 0-255 }
 * Sets all LED tentacles to the specified color.
 */
router.post("/color", async (req, res) => {
  const { r, g, b } = req.body;

  // Validate RGB values
  if (!isValidRGB(r) || !isValidRGB(g) || !isValidRGB(b)) {
    return res.status(400).json({
      error: "Invalid RGB values. Each must be an integer between 0 and 255.",
    });
  }

  const color = {
    r: Math.round(r),
    g: Math.round(g),
    b: Math.round(b),
  };

  // Update shared state
  req.app.locals.state.color = color;

  // Forward to ESP32
  const result = await setLEDColor(color);

  if (result.success) {
    console.log(`[Color] Set to rgb(${color.r}, ${color.g}, ${color.b})`);
    res.json({ success: true, color });
  } else {
    // Still update state even if ESP32 is unreachable (for development)
    console.warn(`[Color] ESP32 unreachable, state updated locally`);
    res.json({ success: true, color, esp32: false });
  }
});

function isValidRGB(value) {
  return typeof value === "number" && value >= 0 && value <= 255;
}

module.exports = router;
