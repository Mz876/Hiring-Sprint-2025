const yoloService = require("../services/ai/yolo.service");
const qwenService = require("../services/ai/qwen.service");

exports.analyzePickupAndReturn = async (req, res) => {
  try {
    const pickupFiles = req.files?.pickup || [];
    const returnFiles = req.files?.returned || [];

    // Validate input
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

    // --- Run YOLO + Qwen on ALL returned images ---
    const returnedAnalyses = await Promise.all(
      returnFiles.map(async (file, index) => {
        const buffer = file.buffer;

        const [yoloResult, qwenResult] = await Promise.all([
          yoloService.detectDamage(buffer),
          qwenService.describeDamage(buffer),
        ]);

        const severityScore =
          typeof qwenResult.severityScore === "number"
            ? qwenResult.severityScore
            : 0.5;

        return {
          index,
          filename: file.originalname,
          yolo: yoloResult,
          qwen: qwenResult,
          severityScore,
        };
      })
    );

    // Pick the "worst" returned image by severity
    const worst =
      returnedAnalyses.length > 0
        ? returnedAnalyses.reduce((max, curr) =>
            curr.severityScore > max.severityScore ? curr : max
          )
        : null;

    const overallSeverity = worst ? worst.severityScore : 0.5;
    const estimatedRepairCost = Math.round(overallSeverity * 1000);

    const pickupNames = pickupFiles.map((f) => f.originalname);
    const returnNames = returnFiles.map((f) => f.originalname);

    res.json({
      pickup: {
        filenames: pickupNames,
      },
      returned: {
        filenames: returnNames,
      },

      // Per-image analysis for ALL returned images
      returnedAnalyses,

      // For backward compatibility / easy UI: also expose the worst image's analysis
      yolo: worst ? worst.yolo : null,
      qwen: worst ? worst.qwen : null,

      summary: {
        severityScore: overallSeverity,
        estimatedRepairCost,
        worstImageIndex: worst ? worst.index : null,
        worstImageFilename: worst ? worst.filename : null,
      },
    });
  } catch (err) {
    console.error("Analyze error:", err);
    res.status(500).json({
      error: `Analysis failed: ${err.message}`,
      details: err.message || String(err),
    });
  }
};
