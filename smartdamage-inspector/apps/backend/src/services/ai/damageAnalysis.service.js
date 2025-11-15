// services/ai/damageAnalysis.service.js
const crypto = require("crypto");
const yoloService = require("./yolo.service");
const qwenService = require("./qwen.service");

// ---------- Low-level helpers -----------------------------------------

function hashBuffer(buffer) {
  return crypto.createHash("md5").update(buffer).digest("hex");
}

// IoU for Roboflow / YOLOv8 boxes (x,y is center)
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

// ---------- Per-image analysis ----------------------------------------

// run YOLO + Qwen on a single image
async function analyzeSingleImage(file, index) {
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
    hash: hashBuffer(buffer),
    yolo: yoloResult,
    qwen: qwenResult,
    severityScore,
  };
}

// ---------- Pickup ↔ Return pairing -----------------------------------

// simple similarity score based on overlapping YOLO detections
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

    if (best >= iouThreshold) {
      score += best;
    }
  });

  return score / rBoxes.length;
}

// pair each return image with the most similar pickup image
function matchPickupAndReturn(pickupAnalyses, returnedAnalyses) {
  return returnedAnalyses.map((ret) => {
    let bestScore = 0;
    let bestPickup = null;

    pickupAnalyses.forEach((pick) => {
      // exact same image → perfect match
      if (pick.hash && ret.hash && pick.hash === ret.hash) {
        bestScore = 1.0;
        bestPickup = pick;
        return;
      }

      const sim = damageProfileSimilarity(pick, ret);
      if (sim > bestScore) {
        bestScore = sim;
        bestPickup = pick;
      }
    });

    if (!bestPickup || bestScore === 0) {
      return {
        returnIndex: ret.index,
        returnFilename: ret.filename,
        pickupIndex: null,
        pickupFilename: null,
        score: 0,
      };
    }

    return {
      returnIndex: ret.index,
      returnFilename: ret.filename,
      pickupIndex: bestPickup.index,
      pickupFilename: bestPickup.filename,
      score: bestScore,
    };
  });
}

// ---------- New vs Pre-existing comparison ----------------------------

function comparePickupAndReturn(pickupAnalyses, returnedAnalyses, pairings) {
  const iouThreshold = 0.3;

  // (A) confidence thresholds – tweak as you like
  const PICKUP_CONF_THRESHOLD = 0.6; // how sure we must be it existed at pickup
  const RETURN_CONF_THRESHOLD = 0.4; // how sure we must be it's real in return

  const perImage = [];
  const allNewDamages = [];
  const allPreExistingDamages = [];

  pairings.forEach((pair) => {
    const ret = returnedAnalyses.find((r) => r.index === pair.returnIndex);
    if (!ret) return;

    const pickup =
      pair.pickupIndex != null
        ? pickupAnalyses.find((p) => p.index === pair.pickupIndex)
        : null;

    const rBoxes = ret.yolo?.predictions || [];
    const pBoxes = pickup?.yolo?.predictions || [];

    const newDamages = [];
    const preExistingDamages = [];

    rBoxes.forEach((rBox) => {
      const rClass = (rBox.class || "").toLowerCase();
      const rConf =
        typeof rBox.confidence === "number" ? rBox.confidence : 0;

      let bestIoU = 0;
      let bestPickupBox = null;
      let bestPickupConf = 0;

      pBoxes.forEach((pBox) => {
        const pClass = (pBox.class || "").toLowerCase();
        if (pClass !== rClass) return;

        const overlap = iou(rBox, pBox);
        if (overlap > bestIoU) {
          bestIoU = overlap;
          bestPickupBox = pBox;
          bestPickupConf =
            typeof pBox.confidence === "number" ? pBox.confidence : 0;
        }
      });

      const isConfidentMatch =
        bestPickupBox &&
        bestIoU >= iouThreshold &&
        bestPickupConf >= PICKUP_CONF_THRESHOLD &&
        rConf >= RETURN_CONF_THRESHOLD;

      if (isConfidentMatch) {
        const item = {
          class: rBox.class,
          confidenceReturn: rConf,
          confidencePickup: bestPickupConf,
          pickupImageIndex: pickup ? pickup.index : null,
          pickupFilename: pickup ? pickup.filename : null,
          returnImageIndex: ret.index,
          returnFilename: ret.filename,
          iou: bestIoU,
        };
        preExistingDamages.push(item);
        allPreExistingDamages.push(item);
      } else {
        const item = {
          class: rBox.class,
          confidenceReturn: rConf,
          returnImageIndex: ret.index,
          returnFilename: ret.filename,
        };
        newDamages.push(item);
        allNewDamages.push(item);
      }
    });

    perImage.push({
      returnImageIndex: ret.index,
      returnFilename: ret.filename,
      pairedPickupIndex: pickup ? pickup.index : null,
      pairedPickupFilename: pickup ? pickup.filename : null,
      newDamages,
      preExistingDamages,
      returnSeverity: ret.severityScore,
      pickupSeverity: pickup ? pickup.severityScore : null,
    });
  });

  return {
    perImage,
    newDamages: allNewDamages,
    preExistingDamages: allPreExistingDamages,
  };
}

// ---------- Summary (real-world-ish) ----------------------------------

function buildDamageSummary(returnedAnalyses, comparison) {
  if (!returnedAnalyses.length) {
    return {
      maxSeverity: 0,
      avgSeverity: 0,
      totalSeverity: 0,
      severityScore: 0,
      estimatedRepairCost: 0,
      worstImageIndex: null,
      worstImageFilename: null,
    };
  }

  // Prefer images with NEW damage; if none, use all returned images.
  const newDamageImageIndexes = new Set(
    comparison.perImage
      .filter((img) => img.newDamages.length > 0)
      .map((img) => img.returnImageIndex)
  );

  const relevantAnalyses =
    newDamageImageIndexes.size > 0
      ? returnedAnalyses.filter((ret) => newDamageImageIndexes.has(ret.index))
      : returnedAnalyses;

  const severities = relevantAnalyses.map((r) => r.severityScore);
  const totalSeverity = severities.reduce((sum, s) => sum + s, 0);
  const maxSeverity = Math.max(...severities);
  const avgSeverity = severities.length ? totalSeverity / severities.length : 0;

  // Pick worst image among relevant
  const worst = relevantAnalyses.reduce((max, curr) =>
    curr.severityScore > max.severityScore ? curr : max
  );

  // Real-world style cost model:
  // - base fee for any incident
  // - plus extra cost per unit of total severity
  const BASE_FEE = 150;
  const COST_PER_SEVERITY_UNIT = 850;
  const estimatedRepairCost = Math.round(
    BASE_FEE + totalSeverity * COST_PER_SEVERITY_UNIT
  );

  return {
    maxSeverity,
    avgSeverity,
    totalSeverity,
    // keep old field name for compatibility
    severityScore: maxSeverity,
    estimatedRepairCost,
    worstImageIndex: worst ? worst.index : null,
    worstImageFilename: worst ? worst.filename : null,
  };
}

// ---------- High-level service API -----------------------------------

/**
 * Main entrypoint from the controller.
 * Takes arrays of pickup & return files, returns the full DamageReport shape.
 */
async function analyzePickupAndReturnImages(pickupFiles, returnFiles) {
  // 1) analyze all pickup images
  const pickupAnalyses = await Promise.all(
    pickupFiles.map((file, index) => analyzeSingleImage(file, index))
  );

  // 2) analyze all return images
  const returnedAnalyses = await Promise.all(
    returnFiles.map((file, index) => analyzeSingleImage(file, index))
  );

  // 3) pair return images with pickup images
  const pairings = matchPickupAndReturn(pickupAnalyses, returnedAnalyses);

  // 4) compute new vs pre-existing comparison
  const comparison = comparePickupAndReturn(
    pickupAnalyses,
    returnedAnalyses,
    pairings
  );

  // 5) compute summary with total/max/avg severity & cost
  const summary = buildDamageSummary(returnedAnalyses, comparison);

  const pickupNames = pickupFiles.map((f) => f.originalname);
  const returnNames = returnFiles.map((f) => f.originalname);

  // The "worst" image for convenience (align with summary.severityScore)
  const worst =
    summary.worstImageIndex != null
      ? returnedAnalyses.find((r) => r.index === summary.worstImageIndex)
      : null;

  return {
    pickup: {
      filenames: pickupNames,
      analyses: pickupAnalyses,
    },
    returned: {
      filenames: returnNames,
      analyses: returnedAnalyses,
    },

    // what the UI already consumes
    returnedAnalyses,
    comparison,

    // legacy / convenience fields
    yolo: worst ? worst.yolo : null,
    qwen: worst ? worst.qwen : null,

    summary,
  };
}

module.exports = {
  analyzePickupAndReturnImages,
};
