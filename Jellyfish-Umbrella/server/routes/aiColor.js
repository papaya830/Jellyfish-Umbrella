const express = require("express");
const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

/**
 * POST /api/ai-color
 * Body: { prompt: "ocean midnight" }
 * Calls Gemini API to generate 3 RGB colors matching the vibe/tone.
 * Returns: { colors: [{ r, g, b }, { r, g, b }, { r, g, b }] }
 */
router.post("/ai-color", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "Prompt is required." });
  }

  if (!GEMINI_API_KEY || GEMINI_API_KEY === "your_gemini_api_key_here") {
    console.warn("[AI Color] Gemini API key not configured, returning fallback colors");
    return res.json({ colors: getFallbackColors(), fallback: true });
  }

  try {
    const geminiRes = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: buildPrompt(prompt.trim()),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 200,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("[AI Color] Gemini API error:", geminiRes.status, errText);
      return res.json({ colors: getFallbackColors(), fallback: true });
    }

    const data = await geminiRes.json();

    // Extract text from Gemini response
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("No text in Gemini response");
    }

    // Parse JSON from response (strip markdown fences if present)
    const cleaned = text.replace(/```json|```|\n/g, "").trim();
    const colors = JSON.parse(cleaned);

    // Validate the parsed colors
    if (!Array.isArray(colors) || colors.length !== 3) {
      throw new Error("Expected array of 3 colors");
    }

    const validColors = colors.map((c) => ({
      r: clamp(Math.round(c.r), 0, 255),
      g: clamp(Math.round(c.g), 0, 255),
      b: clamp(Math.round(c.b), 0, 255),
    }));

    console.log(`[AI Color] "${prompt}" →`, validColors);
    res.json({ colors: validColors });
  } catch (err) {
    console.error("[AI Color] Error:", err.message);
    res.json({ colors: getFallbackColors(), fallback: true });
  }
});

function buildPrompt(userPrompt) {
  return `You are an LED color expert for a jellyfish art installation.
The user will describe a color, mood, or vibe. Return exactly 3 RGB color options that match their description.
Each option should be a noticeably different interpretation of the request.
Make colors vivid enough to look good on LED strips (avoid very dark or muddy colors).

Examples:
- "warm sunset" → vibrant oranges, pinks, golds
- "light green with some purple" → pastel green bases with varying purple/blue undertones
- "chill vibes" → cool blues, soft teals, muted lavenders
- "neon tokyo" → hot pink, electric cyan, bright violet

User request: "${userPrompt}"

Respond with ONLY a JSON array of 3 objects with r, g, b values (0-255). No other text, no markdown, no explanation.
Example format: [{"r":255,"g":100,"b":50},{"r":30,"g":200,"b":180},{"r":180,"g":50,"b":220}]`;
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function getFallbackColors() {
  const rand = () => Math.floor(Math.random() * 180) + 60;
  return [
    { r: rand(), g: rand(), b: rand() },
    { r: rand(), g: rand(), b: rand() },
    { r: rand(), g: rand(), b: rand() },
  ];
}

module.exports = router;
