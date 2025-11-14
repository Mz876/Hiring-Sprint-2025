// app/types/damage.ts

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

export type DamageSummary = {
  severityScore: number;
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
  returnedAnalyses?: ReturnedImageAnalysis[];
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
