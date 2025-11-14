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

export type DamageReport = {
  pickup?: { filename?: string };
  returned?: { filename?: string };
  yolo?: RoboflowResult | null;
  qwen?: {
    description?: string;
    severityScore?: number;
  };
  summary?: {
    severityScore?: number;
    estimatedRepairCost?: number;
  };
};
