
// app/types/damage.ts

// YOLO-style prediction
export interface YoloPrediction {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  class: string;
  class_id: number;
  detection_id?: string;
}

export interface YoloResult {
  time?: number;
  image?: {
    width: number;
    height: number;
  };
  predictions: YoloPrediction[];
}

// Qwen per-image result
export interface QwenResult {
  description: string;
  severityScore: number;
  repairRecommendation?: string;
}

// Per-return image analysis
export interface ReturnedImageAnalysis {
  index: number;
  filename: string;
  hash: string;
  yolo: YoloResult;
  qwen: QwenResult;
  // Overall severity for this image (including pre-existing)
  overallSeverity: number;
}

// Per-pickup image analysis
export interface PickupImageAnalysis {
  index: number;
  filename: string;
  hash: string;
  yolo: YoloResult;
  qwen: QwenResult;
  overallSeverity: number;
}

// Return–pickup pairing metadata
export interface ImagePairing {
  returnIndex: number;
  returnFilename: string;
  pickupIndex: number | null;
  pickupFilename: string | null;
  score: number;
  isIdentical: boolean;
}

// Comparison per return image (new vs pre-existing)
export interface PerImageComparison {
  returnImageIndex: number;
  returnFilename: string;
  pairedPickupIndex: number | null;
  pairedPickupFilename?: string | null;
  isIdenticalImage: boolean;

  // NEW vs pre-existing damage lists
  newDamages: Array<{
    class: string;
    confidence: number;
    returnImageIndex: number;
  }>;

  // Full YOLO boxes for new damages
  newDamageBoxes: YoloPrediction[];

  // YOLO boxes for pre-existing damages
  preExistingDamages: YoloPrediction[];

  // Qwen analysis of NEW damage only
  newDamageSeverity: number; // 0–1
  newDamageDescription: string;
  repairRecommendation?: string;
  qwenAnalyzedNewDamage: boolean;
}

// Overall comparison result
export interface ComparisonResult {
  perImage: PerImageComparison[];
  allNewDamages: YoloPrediction[];
  allPreExistingDamages: YoloPrediction[];
}

// Aggregated summary over ALL returned images
export interface DamageSummary {
  maxSeverity: number;
  avgSeverity: number;
  totalSeverity: number;
  severityScore: number;
  estimatedRepairCost: number;
  newDamageCount: number;
  preExistingDamageCount: number;
  worstImageIndex: number | null;
  worstImageFilename: string | null;
  worstDamageDescription: string | null;
  worstRepairRecommendation?: string | null;
  reason: string;
  analysisMethod: "identical_bypass" | "no_new_damage" | "hybrid_yolo_qwen";
}

// Main report structure returned from the API
export interface DamageReport {
  pickup: {
    filenames: string[];
    analyses: PickupImageAnalysis[];
  };
  returned: {
    filenames: string[];
    analyses: ReturnedImageAnalysis[];
  };

  pairings: ImagePairing[];
  comparison: ComparisonResult;
  summary: DamageSummary;

  // Legacy fields (for backward compatibility / convenience)
  yolo?: YoloResult | null;
  qwen?: QwenResult | null;
}

// Box overlays for the UI
export interface BoxOverlay {
  id: number;
  left: number;
  top: number;
  width: number;
  height: number;
  label: string;
  confidence?: number;
  color: string;
  isNew?: boolean;
  isPreExisting?: boolean;
}
