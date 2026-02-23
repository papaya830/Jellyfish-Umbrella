/**
 * ESP32 HTTP Client
 * Sends commands to the ESP32's simple HTTP server on your local network.
 * 
 * The ESP32 should expose two endpoints:
 *   POST /led   — body: { r, g, b }
 *   POST /move  — body: { direction: "left" | "right" | "neutral" }
 */

const ESP32_BASE = `http://${process.env.ESP32_IP || "192.168.1.100"}`;

async function sendToESP32(endpoint, data) {
  const url = `${ESP32_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Connection": "close"
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`ESP32 responded with ${response.status}`);
    }

    const text = await response.text();
    console.log(`[ESP32] ${endpoint} →`, data, `| Response: ${text}`);
    return { success: true };
  } catch (err) {
    console.error(`[ESP32] Failed to reach ${url}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Set LED color on all tentacles
 * @param {{ r: number, g: number, b: number }} color
 */
async function setLEDColor(color) {
  return sendToESP32("/led", { r: color.r, g: color.g, b: color.b });
}

/**
 * Set tentacle movement direction
 * @param {"left" | "right" | "neutral"} direction
 */
async function setMovement(direction) {
  return sendToESP32("/move", { direction });
}

module.exports = { setLEDColor, setMovement };
