// app/components/ReturnThumbnails.tsx
"use client";

type ReturnThumbnailsProps = {
  files: File[];
  activeIndex: number;
  onChange: (index: number) => void;
};

export function ReturnThumbnails({
  files,
  activeIndex,
  onChange,
}: ReturnThumbnailsProps) {
  if (files.length === 0) return null;

  return (
    <div className="space-y-2 text-xs text-slate-400">
      <p className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        Select a return image to inspect:
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {files.map((file, idx) => {
          const thumbUrl = URL.createObjectURL(file);
          const isActive = idx === activeIndex;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onChange(idx)}
              className={`relative flex-shrink-0 rounded-lg border ${
                isActive
                  ? "border-emerald-400 ring-2 ring-emerald-500/60"
                  : "border-slate-700 hover:border-slate-500"
              } overflow-hidden w-16 h-16 bg-slate-900`}
            >
              <img
                src={thumbUrl}
                alt={`Return ${idx + 1}`}
                className="w-full h-full object-cover"
                onLoad={() => URL.revokeObjectURL(thumbUrl)}
              />
              <span className="absolute bottom-0 right-0 text-[10px] bg-black/60 px-1 rounded-tl">
                {idx + 1}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
