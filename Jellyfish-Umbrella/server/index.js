require("dotenv").config();
const express = require("express");
const cors = require("cors");

const colorRoutes = require("./routes/color");
const movementRoutes = require("./routes/movement");
const aiColorRoutes = require("./routes/aiColor");
const statusRoutes = require("./routes/status");

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───
app.use(cors());
app.use(express.json());

// ─── Shared State ───
// Tracks current system state (color + tentacle position)
// This is shared across routes via app.locals
app.locals.state = {
  color: { r: 0, g: 0, b: 0 },
  position: "resting", // "resting" | "left" | "right"
};
app.locals.resetTimer = null;

// ─── Routes ───
// ─── Routes ───
app.use("/api/color",    colorRoutes);
app.use("/api/movement", movementRoutes);
app.use("/api/ai-color", aiColorRoutes);
app.use("/api/status",   statusRoutes);

// ─── Health Check ───
app.get("/", (req, res) => {
  res.json({ status: "Jellyfish Umbrella server running" });
});

// ─── Start ───
app.listen(PORT, () => {
  console.log(`\n🪼 Jellyfish Umbrella server running on http://localhost:${PORT}`);
  console.log(`   ESP32 target: http://${process.env.ESP32_IP || "NOT SET"}`);
  console.log(`   Gemini API: ${process.env.GEMINI_API_KEY ? "configured" : "NOT SET"}\n`);
});
