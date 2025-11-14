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
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-lg space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-100 truncate">
          {label}
        </h2>
        {comparisonForImage?.pairedPickupFilename && (
          <span className="text-[11px] text-slate-400">
            Matched with pickup:{" "}
            <span className="text-slate-200">
              {comparisonForImage.pairedPickupFilename}
            </span>
          </span>
        )}
      </div>

      <div className="relative w-full h-64 border border-slate-800 rounded-xl overflow-hidden bg-black/40 flex items-center justify-center">
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={label}
              className="w-full h-full object-cover"
            />
            {boxes.map((box) => (
              <div
                key={box.id}
                className="absolute border-2 rounded-sm"
                style={{
                  left: `${box.left}%`,
                  top: `${box.top}%`,
                  width: `${box.width}%`,
                  height: `${box.height}%`,
                  borderColor: box.color,
                }}
              >
                <div
                  className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-900 shadow-sm"
                  style={{ backgroundColor: box.color }}
                >
                  {box.label}{" "}
                  {box.confidence !== undefined &&
                    `(${(box.confidence * 100).toFixed(0)}%)`}
                </div>
              </div>
            ))}
          </>
        ) : (
          <p className="text-xs text-slate-500">
            Select a return image to see damage overlay.
          </p>
        )}
      </div>

      {/* Mini legend for new vs pre-existing if we have comparison */}
      {comparisonForImage && (
        <div className="text-[11px] text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300">Damage summary (this image)</p>
          <p>
            New damage:{" "}
            <span className="text-rose-400 font-medium">
              {comparisonForImage.newDamages.length}
            </span>{" "}
            · Pre-existing:{" "}
            <span className="text-emerald-300 font-medium">
              {comparisonForImage.preExistingDamages.length}
            </span>
          </p>
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
