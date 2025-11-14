// app/components/ReportSkeleton.tsx

import React from "react";

export function ReportSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg animate-pulse space-y-4">
      {/* Title */}
      <div className="h-4 w-40 bg-slate-800 rounded" />

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3">
        {[1, 2, 3].map((key) => (
          <div
            key={key}
            className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 space-y-2"
          >
            <div className="h-3 w-24 bg-slate-800 rounded" />
            <div className="h-4 w-16 bg-slate-700 rounded" />
            <div className="h-3 w-32 bg-slate-800 rounded" />
          </div>
        ))}
      </div>

      {/* Narrative skeleton */}
      <div className="space-y-2">
        <div className="h-3 w-32 bg-slate-800 rounded" />
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="h-3 w-full bg-slate-800 rounded" />
          <div className="h-3 w-5/6 bg-slate-800 rounded" />
          <div className="h-3 w-4/6 bg-slate-800 rounded" />
        </div>
      </div>
    </div>
  );
}
