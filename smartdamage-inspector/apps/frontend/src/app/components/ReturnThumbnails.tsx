// app/components/ReturnThumbnails.tsx
"use client";

import React from "react";

type Props = {
  files: File[];
  activeIndex: number;
  onChange: (index: number) => void;
};

export function ReturnThumbnails({ files, activeIndex, onChange }: Props) {
  if (files.length === 0) return null;

  return (
    <div className="space-y-1">
      <p className="text-[11px] text-slate-500">Select a return image to inspect</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {files.map((file, idx) => {
          const url = URL.createObjectURL(file);
          const isActive = idx === activeIndex;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onChange(idx)}
              className={`relative rounded-md border overflow-hidden flex-shrink-0 ${
                isActive
                  ? "border-emerald-400 ring-2 ring-emerald-500/40"
                  : "border-slate-700 hover:border-slate-500"
              }`}
            >
              <img
                src={url}
                alt={`Return ${idx + 1}`}
                className="w-16 h-16 object-cover"
                onLoad={() => URL.revokeObjectURL(url)}
              />
              <span className="absolute bottom-0 left-0 right-0 text-[10px] bg-black/60 text-slate-100 px-1">
                {idx + 1}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
