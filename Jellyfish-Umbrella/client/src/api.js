// client/src/api.js
const BASE = ''; // proxied via CRA proxy in package.json

/**
 * Set LED colour, brightness, and pattern.
 * @param {{ hex: string, brightness: number, pattern: string }} params
 */
export async function setColor({ hex, brightness, pattern }) {
  const res = await fetch(`${BASE}/api/color`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hex, brightness, pattern }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Trigger tentacle movement.
 * @param {{ direction: 'left' | 'right' | 'neutral' }} params
 */
export async function setMovement({ direction }) {
  const res = await fetch(`${BASE}/api/movement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ direction }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Get current ESP32 status.
 */
export async function getStatus() {
  const res = await fetch(`${BASE}/api/status`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Generate AI colour suggestions from a text prompt.
 * Accepts a raw prompt string. Returns { colors: [{r,g,b}, ...] }.
 * @param {string} prompt
 */
export async function getAIColors(prompt) {
  const res = await fetch(`${BASE}/api/ai-color`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Alias — AIColorPicker.js and ColorPicker.js both import this name
export const generateAIColors = getAIColors;