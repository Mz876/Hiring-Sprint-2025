// app/components/ImageUploader.tsx
"use client";

import { useRef } from "react";

type ImageUploaderProps = {
  label: string;
  helper?: string;
  files: File[];
  setFiles: (files: File[]) => void;
  max?: number;
};

export function ImageUploader({
  label,
  helper,
  files,
  setFiles,
  max = 6,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const openFilePicker = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    const merged = [...files, ...newFiles].slice(0, max);
    setFiles(merged);
    // allow selecting same file again later
    e.target.value = "";
  };

  const handleRemove = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-slate-200">
            {label} <span className="text-xs text-slate-500">(max {max})</span>
          </label>
          {helper && (
            <p className="text-[11px] text-slate-500 mt-0.5">{helper}</p>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleAddFiles}
        className="hidden"
      />

      <div className="grid grid-cols-3 gap-3">
        {/* Thumbnails */}
        {files.map((file, idx) => (
          <div
            key={idx}
            className="relative rounded-lg border border-slate-700 overflow-hidden bg-slate-900/60"
          >
            <img
              src={URL.createObjectURL(file)}
              className="w-full h-28 object-cover"
              alt={`${label} ${idx + 1}`}
            />
            {/* Remove button */}
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="absolute top-1 right-1 bg-red-600/90 hover:bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        ))}

        {/* + Add button */}
        {files.length < max && (
          <button
            type="button"
            onClick={openFilePicker}
            className="flex flex-col items-center justify-center rounded-lg border border-slate-700 border-dashed h-28 hover:bg-slate-800/60 transition"
          >
            <span className="text-4xl leading-none text-slate-400">+</span>
            <span className="text-[11px] text-slate-400 mt-1">Add images</span>
          </button>
        )}
      </div>
    </div>
  );
}
