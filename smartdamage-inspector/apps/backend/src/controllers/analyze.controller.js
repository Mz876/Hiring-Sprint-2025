// controllers/analyze.controller.js
const {
  analyzePickupAndReturnImages,
} = require("../services/ai/damageAnalysis.service");

exports.analyzePickupAndReturn = async (req, res) => {
  try {
    const pickupFiles = req.files?.pickup || [];
    const returnFiles = req.files?.returned || [];

    // Basic validation (controller-level concern)
    if (!pickupFiles.length || !returnFiles.length) {
      return res.status(400).json({
        error: "At least one 'pickup' and one 'returned' image are required.",
      });
    }

    if (pickupFiles.length > 6 || returnFiles.length > 6) {
      return res.status(400).json({
        error: "You can upload a maximum of 6 pickup and 6 returned images.",
      });
    }

    // Delegate to service
    const result = await analyzePickupAndReturnImages(
      pickupFiles,
      returnFiles
    );

    return res.json(result);
  } catch (err) {
    console.error("Analyze error:", err);
    return res.status(500).json({
      error: `Analysis failed: ${err.message}`,
      details: err.message || String(err),
    });
  }
};
