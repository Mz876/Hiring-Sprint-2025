// app/types/damage.ts

export type RoboflowPrediction = {
  x: number;
  y: number;
  width: number;
  height: number;
  class: string;
  confidence: number;
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

export type ReturnedImageAnalysis = {
  index: number;
  filename: string;
  yolo?: RoboflowResult | null;
  qwen?: {
    description?: string;
    severityScore?: number;
  };
  severityScore?: number;
};

export type DamageSummary = {
  severityScore: number;
  estimatedRepairCost: number;
  worstImageIndex?: number;
  worstImageFilename?: string;
};

export type DamageReport = {
  pickup?: {
    filenames: string[];
  };
  returned?: {
    filenames: string[];
  };
  // Per-return-image analyses (what we want for the preview)
  returnedAnalyses?: ReturnedImageAnalysis[];

  // Optional “worst image” aggregate (like in your JSON)
  yolo?: RoboflowResult | null;
  qwen?: {
    description?: string;
    severityScore?: number;
  };
  summary?: DamageSummary;
};

// Overlay box used by the UI
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
