const express = require("express");
const router = express.Router();
const analyzeRoutes = require("./analyze.routes");

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "ok", service: "SmartDamage backend" });
});

// Analyze endpoints
router.use("/analyze", analyzeRoutes);

module.exports = router;
