// app/components/DamagePreview.tsx
"use client";

import type { BoxOverlay } from "@/app/types/damage";

type DamagePreviewProps = {
  label: string;
  imageUrl: string | null;
  boxes: BoxOverlay[];
  hasDetections: boolean;
};

export function DamagePreview({
  label,
  imageUrl,
  boxes,
  hasDetections,
}: DamagePreviewProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-lg space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-slate-500 mb-1">
            Damage preview
          </p>
          <p className="text-sm text-slate-300">{label}</p>
        </div>
      </div>

      <div className="relative w-full aspect-video border border-slate-800 rounded-xl overflow-hidden bg-black/40">
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt="Active return preview"
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
          <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
            No return image selected.
          </div>
        )}
      </div>

      {!hasDetections && (
        <p className="text-[11px] text-slate-500">
          * No damage boxes detected or detection not run yet. Try uploading a
          clearer return image and analyzing again.
        </p>
      )}
    </div>
  );
}
