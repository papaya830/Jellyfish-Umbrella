const express = require("express");
const router = express.Router();

/**
 * GET /api/status
 * Returns current system state (LED color + tentacle position).
 */
router.get("/status", (req, res) => {
  res.json(req.app.locals.state);
});

module.exports = router;
