/**
 * API client for the Jellyfish Umbrella Express backend.
 * 
 * In development, requests are proxied to localhost:3001 via the
 * "proxy" field in client/package.json.
 * 
 * In production, update BASE_URL to your deployed server address.
 */

const BASE_URL = ""; // empty = use proxy in dev, or set full URL for prod

/**
 * Set LED color on all tentacles
 * @param {{ r: number, g: number, b: number }} color
 */
export async function setColor(color) {
  const res = await fetch(`${BASE_URL}/api/color`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(color),
  });
  return res.json();
}

/**
 * Set tentacle movement direction
 * @param {"left" | "right"} direction
 */
export async function setMovement(direction) {
  const res = await fetch(`${BASE_URL}/api/movement`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ direction }),
  });
  return res.json();
}

/**
 * Generate 3 AI colors from a vibe/tone prompt via Gemini
 * @param {string} prompt
 * @returns {Promise<{ colors: Array<{r: number, g: number, b: number}>, fallback?: boolean }>}
 */
export async function generateAIColors(prompt) {
  const res = await fetch(`${BASE_URL}/api/ai-color`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  return res.json();
}

/**
 * Get current system state
 * @returns {Promise<{ color: {r,g,b}, position: string }>}
 */
export async function getStatus() {
  const res = await fetch(`${BASE_URL}/api/status`);
  return res.json();
}
