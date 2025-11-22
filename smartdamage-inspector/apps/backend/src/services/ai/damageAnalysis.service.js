// services/ai/damageAnalysis.service.js - SIMPLIFIED WITH NON-THROWING SERVICES
const crypto = require("crypto");
const yoloService = require("./yolo.service");
const qwenService = require("./qwen.service");

// ==================== HELPERS ====================

function hashBuffer(buffer) {
  return crypto.createHash("md5").update(buffer).digest("hex");
}

function iou(boxA, boxB) {
  const ax1 = boxA.x - boxA.width / 2;
  const ay1 = boxA.y - boxA.height / 2;
  const ax2 = boxA.x + boxA.width / 2;
  const ay2 = boxA.y + boxA.height / 2;

  const bx1 = boxB.x - boxB.width / 2;
  const by1 = boxB.y - boxB.height / 2;
  const bx2 = boxB.x + boxB.width / 2;
  const by2 = boxB.y + boxB.height / 2;

  const interX1 = Math.max(ax1, bx1);
  const interY1 = Math.max(ay1, by1);
  const interX2 = Math.min(ax2, bx2);
  const interY2 = Math.min(ay2, by2);

  const interW = Math.max(0, interX2 - interX1);
  const interH = Math.max(0, interY2 - interY1);
  const interArea = interW * interH;

  const areaA = (ax2 - ax1) * (ay2 - ay1);
  const areaB = (bx2 - bx1) * (by2 - by1);
  const union = areaA + areaB - interArea;

  if (union <= 0) return 0;
  return interArea / union;
}

// ==================== QWEN FOCUSED ANALYSIS ====================

/**
 * Ask Qwen to analyze SPECIFIC damages, not the whole image.
 * This gives us REAL severity scores for NEW damages only.
 * 
 * Services never throw, so no try/catch needed!
 */
async function analyzeSpecificDamages(imageBuffer, damageBoxes) {
  if (!damageBoxes.length) {
    return { 
      severityScore: 0, 
      description: "No damage to analyze",
      repairRecommendation: "None",
      error: null,
    };
  }

  // Build a prompt that tells Qwen WHERE to look
  const damageLocations = damageBoxes.map((box, i) => {
    const location = `x:${Math.round(box.x)}, y:${Math.round(box.y)}`;
    return `${i + 1}. ${box.class} at (${location}) - confidence: ${(box.confidence * 100).toFixed(1)}%`;
  }).join("\n");

  const prompt = `
You are an expert vehicle damage assessor analyzing a car return inspection photo.

CRITICAL: Focus ONLY on these specific NEW damages that were NOT present at pickup:

${damageLocations}

IGNORE any other visible damage in the image - those are pre-existing.

For ONLY the damages listed above, provide a JSON response:
{
  "description": "detailed description of the NEW damages only",
  "severityScore": number between 0-1 where:
    - 0.0-0.2: Minor cosmetic (light scratches, small paint chips)
    - 0.2-0.4: Moderate (deeper scratches, small dents, minor cracks)
    - 0.4-0.6: Significant (large dents, multiple damages, visible deformation)
    - 0.6-0.8: Severe (major panel damage, structural issues, extensive damage)
    - 0.8-1.0: Critical (multiple severe damages, potential safety issues),
  "repairRecommendation": "specific repairs needed and estimated complexity"
}

Consider:
- Damage size and depth
- Number of affected areas
- Repair complexity (paint, panel replacement, structural work)
- Location on vehicle (bumper vs door vs structural panel)
`;

  // Service never throws - just call it!
  const result = await qwenService.describeDamageWithPrompt(imageBuffer, prompt);
  
  // Validate the result
  if (result.error || typeof result.severityScore !== 'number') {
    console.warn("Qwen analysis failed or returned invalid data, using fallback");
    return {
      severityScore: estimateSeverityFromBoxes(damageBoxes),
      description: result.error 
        ? `Vision analysis failed: ${result.error}. Using YOLO-based estimation.`
        : "Vision analysis returned invalid data, using estimation",
      repairRecommendation: "Manual inspection recommended",
      error: result.error,
    };
  }
  
  return result;
}

// ==================== PER-IMAGE ANALYSIS ====================

/**
 * SIMPLIFIED: No try/catch needed since services never throw!
 */
async function analyzeSingleImage(file, index) {
  const buffer = file.buffer;
  const filename = file.originalname;

  // Services never throw - just call them directly!
  const [yoloResult, qwenResult] = await Promise.all([
    yoloService.detectDamage(buffer),
    qwenService.describeDamage(buffer),
  ]);

  // Check for errors in results
  const hasError = yoloResult.error || qwenResult.error;
  
  if (hasError) {
    console.warn(`⚠️  Analysis issues for ${filename}:`, {
      yolo: yoloResult.error || 'OK',
      qwen: qwenResult.error || 'OK',
    });
  }

  return {
    index,
    filename,
    hash: hashBuffer(buffer),
    buffer,
    yolo: yoloResult,
    qwen: qwenResult,
    overallSeverity: qwenResult.severityScore || 0.5,
    error: yoloResult.error || qwenResult.error || null,
  };
}

// ==================== IMAGE PAIRING ====================

function damageProfileSimilarity(pickupAnalysis, returnAnalysis) {
  const pBoxes = pickupAnalysis.yolo?.predictions || [];
  const rBoxes = returnAnalysis.yolo?.predictions || [];

  if (!pBoxes.length || !rBoxes.length) return 0;

  let score = 0;
  const iouThreshold = 0.3;

  rBoxes.forEach((rBox) => {
    const rClass = (rBox.class || "").toLowerCase();
    let best = 0;

    pBoxes.forEach((pBox) => {
      const pClass = (pBox.class || "").toLowerCase();
      if (pClass !== rClass) return;

      const overlap = iou(rBox, pBox);
      if (overlap > best) best = overlap;
    });

    if (best >= iouThreshold) score += best;
  });

  return score / rBoxes.length;
}

function matchPickupAndReturn(pickupAnalyses, returnedAnalyses) {
  return returnedAnalyses.map((ret) => {
    let bestScore = 0;
    let bestPickup = null;
    let isIdentical = false;

    pickupAnalyses.forEach((pick) => {
      // Check for identical images
      if (pick.hash && ret.hash && pick.hash === ret.hash) {
        bestScore = 1.0;
        bestPickup = pick;
        isIdentical = true;
        return;
      }

      const sim = damageProfileSimilarity(pick, ret);
      if (sim > bestScore) {
        bestScore = sim;
        bestPickup = pick;
      }
    });

    return {
      returnIndex: ret.index,
      returnFilename: ret.filename,
      pickupIndex: bestPickup?.index ?? null,
      pickupFilename: bestPickup?.filename ?? null,
      score: bestScore,
      isIdentical,
    };
  });
}

// ==================== DAMAGE COMPARISON ====================

/**
 * STEP 1: Use YOLO to identify which damages are NEW
 */
function identifyNewDamages(pickupAnalyses, returnedAnalyses, pairings) {
  const iouThreshold = 0.3;
  const PICKUP_CONF_THRESHOLD = 0.6;
  const RETURN_CONF_THRESHOLD = 0.4;

  const perImage = [];
  const allNewDamages = [];
  const allPreExistingDamages = [];

  pairings.forEach((pair) => {
    const ret = returnedAnalyses.find((r) => r.index === pair.returnIndex);
    if (!ret) return;

    // CASE 1: Identical images = all pre-existing
    if (pair.isIdentical) {
      const rBoxes = ret.yolo?.predictions || [];
      perImage.push({
        returnImageIndex: ret.index,
        returnFilename: ret.filename,
        returnBuffer: ret.buffer,
        pairedPickupIndex: pair.pickupIndex,
        isIdenticalImage: true,
        newDamages: [],
        newDamageBoxes: [],
        preExistingDamages: rBoxes,
      });
      allPreExistingDamages.push(...rBoxes);
      return;
    }

    // CASE 2: Different images - compare box by box
    const pickup = pair.pickupIndex != null
      ? pickupAnalyses.find((p) => p.index === pair.pickupIndex)
      : null;

    const rBoxes = ret.yolo?.predictions || [];
    const pBoxes = pickup?.yolo?.predictions || [];

    const newDamages = [];
    const newDamageBoxes = [];
    const preExistingDamages = [];

    rBoxes.forEach((rBox) => {
      const rClass = (rBox.class || "").toLowerCase();
      const rConf = rBox.confidence || 0;

      let bestIoU = 0;
      let bestPickupConf = 0;

      pBoxes.forEach((pBox) => {
        const pClass = (pBox.class || "").toLowerCase();
        if (pClass !== rClass) return;

        const overlap = iou(rBox, pBox);
        if (overlap > bestIoU) {
          bestIoU = overlap;
          bestPickupConf = pBox.confidence || 0;
        }
      });

      const isPreExisting =
        bestIoU >= iouThreshold &&
        bestPickupConf >= PICKUP_CONF_THRESHOLD &&
        rConf >= RETURN_CONF_THRESHOLD;

      if (isPreExisting) {
        preExistingDamages.push(rBox);
        allPreExistingDamages.push(rBox);
      } else {
        newDamages.push({
          class: rBox.class,
          confidence: rConf,
          returnImageIndex: ret.index,
        });
        newDamageBoxes.push(rBox);
        allNewDamages.push(rBox);
      }
    });

    perImage.push({
      returnImageIndex: ret.index,
      returnFilename: ret.filename,
      returnBuffer: ret.buffer,
      pairedPickupIndex: pickup?.index ?? null,
      isIdenticalImage: false,
      newDamages,
      newDamageBoxes,
      preExistingDamages,
    });
  });

  return { perImage, allNewDamages, allPreExistingDamages };
}

/**
 * STEP 2: Use Qwen to analyze ONLY the new damages
 * SIMPLIFIED: analyzeSpecificDamages never throws!
 */
async function analyzeNewDamagesWithQwen(comparisonResult) {
  const analysisPromises = comparisonResult.perImage.map(async (imageData) => {
    // Skip if no new damages or identical image
    if (imageData.isIdenticalImage || imageData.newDamageBoxes.length === 0) {
      return {
        ...imageData,
        newDamageSeverity: 0,
        newDamageDescription: "No new damage",
        repairRecommendation: "None",
        qwenAnalyzedNewDamage: true,
      };
    }

    // analyzeSpecificDamages never throws - just call it!
    const qwenAnalysis = await analyzeSpecificDamages(
      imageData.returnBuffer,
      imageData.newDamageBoxes
    );

    return {
      ...imageData,
      newDamageSeverity: qwenAnalysis.severityScore || 0,
      newDamageDescription: qwenAnalysis.description || "",
      repairRecommendation: qwenAnalysis.repairRecommendation || "",
      qwenAnalyzedNewDamage: !qwenAnalysis.error,
    };
  });

  const analyzedImages = await Promise.all(analysisPromises);

  return {
    perImage: analyzedImages,
    allNewDamages: comparisonResult.allNewDamages,
    allPreExistingDamages: comparisonResult.allPreExistingDamages,
  };
}

/**
 * Fallback: Estimate severity from YOLO boxes if Qwen fails
 */
function estimateSeverityFromBoxes(boxes) {
  if (!boxes.length) return 0;

  const weights = {
    "severe-damage": 1.0,
    "major-damage": 0.9,
    "dent": 0.7,
    "scratch": 0.5,
    "crack": 0.8,
    "broken": 0.9,
  };

  let total = 0;
  boxes.forEach((box) => {
    const cls = (box.class || "").toLowerCase();
    const weight = Object.entries(weights).find(([k]) => cls.includes(k))?.[1] || 0.6;
    total += (box.confidence || 0.5) * weight;
  });

  return Math.min(1.0, total / 2);
}

// ==================== SUMMARY ====================

function buildDamageSummary(comparison, pairings) {
  // Case 1: All identical
  if (pairings.every((p) => p.isIdentical)) {
    return {
      maxSeverity: 0,
      avgSeverity: 0,
      totalSeverity: 0,
      severityScore: 0,
      estimatedRepairCost: 0,
      newDamageCount: 0,
      preExistingDamageCount: comparison.allPreExistingDamages.length,
      worstImageIndex: null,
      worstImageFilename: null,
      worstDamageDescription: null,
      reason: "All images identical - no new damage",
      analysisMethod: "identical_bypass",
    };
  }

  // Case 2: No new damages
  if (comparison.allNewDamages.length === 0) {
    return {
      maxSeverity: 0,
      avgSeverity: 0,
      totalSeverity: 0,
      severityScore: 0,
      estimatedRepairCost: 0,
      newDamageCount: 0,
      preExistingDamageCount: comparison.allPreExistingDamages.length,
      worstImageIndex: null,
      worstImageFilename: null,
      worstDamageDescription: null,
      reason: "All damage is pre-existing",
      analysisMethod: "no_new_damage",
    };
  }

  // Case 3: New damages found - use QWEN'S REAL severity scores
  const imagesWithNewDamage = comparison.perImage.filter(
    (img) => img.newDamageBoxes?.length > 0
  );

  const severities = imagesWithNewDamage.map((img) => img.newDamageSeverity);
  
  const totalSeverity = severities.reduce((sum, s) => sum + s, 0);
  const maxSeverity = Math.max(...severities);
  const avgSeverity = severities.length ? totalSeverity / severities.length : 0;

  const worst = imagesWithNewDamage.reduce(
    (max, curr) => (curr.newDamageSeverity > max.newDamageSeverity ? curr : max),
    imagesWithNewDamage[0]
  );

  // Cost based on Qwen's REAL visual analysis
  const COST_PER_SEVERITY_UNIT = 850;
  const COST_PER_DAMAGE_INSTANCE = 100;
  
  // Only charge if there's actual severity (Qwen confirmed real damage)
  const imagesWithRealDamage = imagesWithNewDamage.filter(
    img => img.newDamageSeverity > 0
  );
  const realNewDamageCount = imagesWithRealDamage.reduce(
    (sum, img) => sum + img.newDamages.length,
    0
  );
  
  const estimatedRepairCost = Math.round(
    totalSeverity * COST_PER_SEVERITY_UNIT +
    realNewDamageCount * COST_PER_DAMAGE_INSTANCE
  );

  return {
    maxSeverity,
    avgSeverity,
    totalSeverity,
    severityScore: maxSeverity,
    estimatedRepairCost,
    newDamageCount: comparison.allNewDamages.length,
    preExistingDamageCount: comparison.allPreExistingDamages.length,
    worstImageIndex: worst?.returnImageIndex ?? null,
    worstImageFilename: worst?.returnFilename ?? null,
    worstDamageDescription: worst?.newDamageDescription ?? null,
    worstRepairRecommendation: worst?.repairRecommendation ?? null,
    reason: `${comparison.allNewDamages.length} new damage(s) detected`,
    analysisMethod: "hybrid_yolo_qwen",
  };
}

// ==================== MAIN ENTRY POINT ====================

/**
 * SIMPLIFIED: Services never throw, so less error handling needed
 */
async function analyzePickupAndReturnImages(pickupFiles, returnFiles) {
  if (!returnFiles.length) {
    throw new Error("No return images provided");
  }

  try {
    // 1) Analyze all images - services never throw!
    const pickupAnalyses = await Promise.all(
      pickupFiles.map((file, index) => analyzeSingleImage(file, index))
    );

    const returnedAnalyses = await Promise.all(
      returnFiles.map((file, index) => analyzeSingleImage(file, index))
    );

    // Check if all analyses completely failed
    const allReturnFailed = returnedAnalyses.every(a => 
      a.error && a.yolo.predictions.length === 0
    );
    
    if (allReturnFailed) {
      throw new Error(
        "All return images failed to analyze. " +
        "This may be due to API issues, corrupt files, or network problems. " +
        "Please check image quality and try again."
      );
    }

    // Count failures for warnings
    const pickupFailures = pickupAnalyses.filter(a => a.error).length;
    const returnFailures = returnedAnalyses.filter(a => a.error).length;
    
    if (pickupFailures > 0) {
      console.warn(`⚠️  ${pickupFailures} pickup image(s) had analysis issues`);
    }
    if (returnFailures > 0) {
      console.warn(`⚠️  ${returnFailures} return image(s) had analysis issues`);
    }

    // 2) Pair images
    const pairings = matchPickupAndReturn(pickupAnalyses, returnedAnalyses);

    // 3) YOLO identifies NEW damages
    const comparisonResult = identifyNewDamages(
      pickupAnalyses,
      returnedAnalyses,
      pairings
    );

    // 4) Qwen analyzes ONLY new damages for REAL severity
    const analysisWithQwen = await analyzeNewDamagesWithQwen(comparisonResult);

    // 5) Build summary with real Qwen-analyzed severity
    const summary = buildDamageSummary(analysisWithQwen, pairings);

    return {
      pickup: {
        filenames: pickupFiles.map((f) => f.originalname),
        analyses: pickupAnalyses,
      },
      returned: {
        filenames: returnFiles.map((f) => f.originalname),
        analyses: returnedAnalyses,
      },
      pairings,
      comparison: analysisWithQwen,
      summary,
      warnings: {
        pickupFailures,
        returnFailures,
        totalFailures: pickupFailures + returnFailures,
        message: (pickupFailures + returnFailures) > 0
          ? `${pickupFailures + returnFailures} image(s) had analysis issues but inspection continued`
          : null,
      },
    };
  } catch (err) {
    console.error("❌ analyzePickupAndReturnImages failed:", err.message);
    
    if (err.message.includes("All return images failed")) {
      throw err;
    }
    
    throw new Error(
      `Damage analysis failed: ${err.message}. ` +
      `Please verify image files are valid and services are available.`
    );
  }
}

module.exports = {
  analyzePickupAndReturnImages,
};