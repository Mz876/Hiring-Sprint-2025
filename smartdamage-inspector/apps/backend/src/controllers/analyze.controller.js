const yoloService = require("../services/ai/yolo.service");
const qwenService = require("../services/ai/qwen.service");

exports.analyzePickupAndReturn = async (req, res) => {
  try {
    const pickupFile = req.files?.pickup?.[0];
    const returnFile = req.files?.returned?.[0];

    // Validate input
    if (!pickupFile || !returnFile) {
      return res.status(400).json({
        error: "Both 'pickup' and 'returned' images are required.",
      });
    }

    const pickupBuffer = pickupFile.buffer;
    const returnBuffer = returnFile.buffer;

    // Run Roboflow YOLO + Qwen in parallel on the RETURN image
    const [yoloResult, qwenResult] = await Promise.all([
      yoloService.detectDamage(returnBuffer),
      qwenService.describeDamage(returnBuffer),
    ]);

    // Basic severity / cost logic (from Qwen)
    const severityScore =
      typeof qwenResult.severityScore === "number"
        ? qwenResult.severityScore
        : 0.5;

    const estimatedRepairCost = Math.round(severityScore * 1000);

    res.json({
      pickup: {
        filename: pickupFile.originalname,
      },
      returned: {
        filename: returnFile.originalname,
      },
      yolo: yoloResult, // <-- Roboflow detections here
      qwen: qwenResult,
      summary: {
        severityScore,
        estimatedRepairCost,
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
