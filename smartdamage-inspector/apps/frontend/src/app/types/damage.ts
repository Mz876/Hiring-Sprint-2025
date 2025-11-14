
export type RoboflowPrediction = {
  x: number;
  y: number;
  width: number;
  height: number;
  class: string;
  confidence: number;
  [key: string]: any;
};

export type RoboflowImageMeta = {
  width: number;
  height: number;
};

export type RoboflowResult = {
  predictions?: RoboflowPrediction[];
  image?: RoboflowImageMeta;
  [key: string]: any;
};

export type QwenResult = {
  description?: string;
  severityScore?: number;
  mock?: boolean;
};

export type SingleImageAnalysis = {
  index: number;
  filename: string;
  hash?: string;
  yolo: RoboflowResult | null;
  qwen: QwenResult;
  severityScore: number;
};

export type ReturnedImageAnalysis = SingleImageAnalysis;

export type DamagePairing = {
  returnIndex: number;
  returnFilename: string;
  pickupIndex: number | null;
  pickupFilename: string | null;
  score: number;
};

export type PerImageComparison = {
  returnImageIndex: number;
  returnFilename: string;
  pairedPickupIndex: number | null;
  pairedPickupFilename: string | null;

  newDamages: Array<{
    class: string;
    confidenceReturn: number;
    returnImageIndex: number;
    returnFilename: string;
  }>;

  preExistingDamages: Array<{
    class: string;
    confidenceReturn: number;
    confidencePickup: number;
    pickupImageIndex: number | null;
    pickupFilename: string | null;
    returnImageIndex: number;
    returnFilename: string;
    iou: number;
  }>;

  returnSeverity: number;
  pickupSeverity: number | null;
};

export type DamageComparison = {
  perImage: PerImageComparison[];
  newDamages: PerImageComparison["newDamages"][number][];
  preExistingDamages: PerImageComparison["preExistingDamages"][number][];
};

/**
 * Aggregated summary over ALL returned images.
 * Real-world-ish model:
 * - maxSeverity: worst single view
 * - avgSeverity: average over all return images
 * - totalSeverity: sum over all return images (used for cost)
 * - severityScore: kept for backward compat; alias of maxSeverity
 */
export type DamageSummary = {
  maxSeverity: number;
  avgSeverity: number;
  totalSeverity: number;
  severityScore: number; // = maxSeverity
  estimatedRepairCost: number;
  worstImageIndex: number | null;
  worstImageFilename: string | null;
};

export type DamageReport = {
  pickup?: {
    filenames?: string[];
    analyses?: SingleImageAnalysis[];
  };
  returned?: {
    filenames?: string[];
    analyses?: ReturnedImageAnalysis[];
  };

  /**
   * Convenience alias used by the UI (per-image analyses for all returned images)
   */
  returnedAnalyses?: ReturnedImageAnalysis[];

  /**
   * For backward compatibility / convenience, often the "worst" image analysis
   */
  yolo?: RoboflowResult | null;
  qwen?: QwenResult | null;

  comparison?: DamageComparison;
  summary?: DamageSummary;
};

export type BoxOverlay = {
  id: number;
  left: number;
  top: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
  color: string;
};
