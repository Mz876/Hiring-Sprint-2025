// app/components/DamagePreviewSkeleton.tsx

import React from "react";

export function DamagePreviewSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-lg animate-pulse">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-32 bg-slate-800 rounded" />
        <div className="h-3 w-16 bg-slate-800 rounded" />
      </div>

      {/* Big image area */}
      <div className="w-full h-64 bg-slate-800/80 rounded-xl" />

      {/* Legend / footer skeleton */}
      <div className="mt-4 flex items-center gap-3">
        <div className="h-3 w-24 bg-slate-800 rounded" />
        <div className="h-3 w-16 bg-slate-800 rounded" />
      </div>
    </div>
  );
}
