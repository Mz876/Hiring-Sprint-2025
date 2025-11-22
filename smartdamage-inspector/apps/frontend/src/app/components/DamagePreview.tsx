
// app/components/DamagePreview.tsx
"use client";

import React from "react";
import type { BoxOverlay, PerImageComparison } from "@/app/types/damage";

type Props = {
  label: string;
  imageUrl: string | null;
  boxes: BoxOverlay[];
  hasDetections: boolean;
  comparisonForImage?: PerImageComparison | null;
};

export function DamagePreview({
  label,
  imageUrl,
  boxes,
  hasDetections,
  comparisonForImage,
}: Props) {
  // Separate boxes by type
  const newDamageBoxes = boxes.filter((b) => b.isNew);
  const preExistingBoxes = boxes.filter((b) => b.isPreExisting);
  const unknownBoxes = boxes.filter((b) => !b.isNew && !b.isPreExisting);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-lg space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-100 truncate">
          {label}
        </h2>
        {comparisonForImage?.pairedPickupFilename && (
          <span className="text-[11px] text-slate-400">
            Matched with:{" "}
            <span className="text-slate-200">
              {comparisonForImage.pairedPickupFilename}
            </span>
          </span>
        )}
      </div>

      {/* Image + box overlays */}
      <div className="relative w-full h-64 border border-slate-800 rounded-xl overflow-hidden bg-black/40 flex items-center justify-center">
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={label}
              className="w-full h-full object-cover"
            />

            {/* Draw bounding boxes */}
            {boxes.map((box) => (
              <div
                key={box.id}
                className="absolute border-2 rounded-sm pointer-events-none"
                style={{
                  left: `${box.left}%`,
                  top: `${box.top}%`,
                  width: `${box.width}%`,
                  height: `${box.height}%`,
                  borderColor: box.color,
                  boxShadow: `0 0 8px ${box.color}`,
                }}
              />
            ))}
          </>
        ) : (
          <p className="text-xs text-slate-500">
            Select a return image to see damage overlay.
          </p>
        )}
      </div>

      {/* Legend with categorized detections */}
      {boxes.length > 0 && (
        <div className="text-[11px] text-slate-300 space-y-3">
          <p className="font-semibold text-slate-200">
            Detections ({boxes.length} total)
          </p>

          {/* NEW DAMAGE */}
          {newDamageBoxes.length > 0 && (
            <div className="space-y-1">
              <p className="text-rose-400 font-medium text-xs">
                🆕 New Damage ({newDamageBoxes.length})
              </p>
              <ul className="space-y-0.5 pl-2">
                {newDamageBoxes.map((box) => (
                  <li key={box.id} className="flex items-center gap-2">
                    <span
                      className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: box.color }}
                    />
                    <span className="truncate">
                      {box.label?.replace("🆕 ", "") || "damage"}
                      {box.confidence !== undefined &&
                        ` · ${(box.confidence * 100).toFixed(0)}%`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* PRE-EXISTING DAMAGE */}
          {preExistingBoxes.length > 0 && (
            <div className="space-y-1">
              <p className="text-emerald-400 font-medium text-xs">
                ✓ Pre-existing ({preExistingBoxes.length})
              </p>
              <ul className="space-y-0.5 pl-2">
                {preExistingBoxes.map((box) => (
                  <li key={box.id} className="flex items-center gap-2">
                    <span
                      className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: box.color }}
                    />
                    <span className="truncate">
                      {box.label?.replace("✓ ", "") || "damage"}
                      {box.confidence !== undefined &&
                        ` · ${(box.confidence * 100).toFixed(0)}%`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* UNKNOWN (if any) */}
          {unknownBoxes.length > 0 && (
            <div className="space-y-1">
              <p className="text-yellow-400 font-medium text-xs">
                ⚠ Unclassified ({unknownBoxes.length})
              </p>
              <ul className="space-y-0.5 pl-2">
                {unknownBoxes.map((box) => (
                  <li key={box.id} className="flex items-center gap-2">
                    <span
                      className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: box.color }}
                    />
                    <span className="truncate">
                      {box.label || "damage"}
                      {box.confidence !== undefined &&
                        ` · ${(box.confidence * 100).toFixed(0)}%`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Comparison summary with Qwen severity */}
      {comparisonForImage && (
        <div className="text-[11px] space-y-2 pt-2 border-t border-slate-800">
          <p className="font-semibold text-slate-300">
            Damage Summary (this image)
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-rose-400 font-medium">
                  {comparisonForImage.newDamages?.length ?? 0}
                </span>
                <span className="text-slate-500 ml-1">new</span>
              </div>
              <div>
                <span className="text-emerald-300 font-medium">
                  {comparisonForImage.preExistingDamages?.length ?? 0}
                </span>
                <span className="text-slate-500 ml-1">pre-existing</span>
              </div>
            </div>

            {/* Show Qwen severity if available */}
            {comparisonForImage.newDamageSeverity !== undefined && 
             comparisonForImage.newDamageSeverity > 0 && (
              <div className="text-right">
                <div className="text-rose-400 font-semibold">
                  {Math.round(comparisonForImage.newDamageSeverity * 100)}/100
                </div>
                <div className="text-slate-500">severity</div>
              </div>
            )}
          </div>

          {/* Show if Qwen analyzed this image */}
          {comparisonForImage.qwenAnalyzedNewDamage && 
           comparisonForImage.newDamages?.length > 0 && (
            <p className="text-emerald-400 text-xs">
              ✓ Qwen vision analysis complete
            </p>
          )}

          {/* Show if identical image */}
          {comparisonForImage.isIdenticalImage && (
            <p className="text-blue-400 text-xs">
              ℹ Identical to pickup image
            </p>
          )}
        </div>
      )}

      {!hasDetections && imageUrl && (
        <p className="text-[11px] text-slate-500">
          No damage detected for this image with the current model/thresholds.
        </p>
      )}
    </div>
  );
}