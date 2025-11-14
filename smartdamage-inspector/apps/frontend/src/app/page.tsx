"use client";

import { useState, useMemo, useRef } from "react";

type RoboflowPrediction = {
  x: number;
  y: number;
  width: number;
  height: number;
  class: string;
  confidence: number;
};

type RoboflowImageMeta = {
  width: number;
  height: number;
};

type RoboflowResult = {
  predictions?: RoboflowPrediction[];
  image?: RoboflowImageMeta;
  [key: string]: any;
};

type DamageReport = {
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

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

/**
 * Generic image uploader with a grid and + Add box.
 */
function ImageUploader({
  label,
  files,
  setFiles,
  max = 6,
}: {
  label: string;
  files: File[];
  setFiles: (f: File[]) => void;
  max?: number;
}) {
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
      <label className="block text-sm font-medium text-slate-200">
        {label} (up to {max})
      </label>

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
            className="relative rounded-lg border border-slate-700 overflow-hidden"
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
              className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
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
            className="flex flex-col items-center justify-center rounded-lg border border-slate-700 border-dashed h-28 hover:bg-slate-800 transition"
          >
            <span className="text-4xl text-slate-400">+</span>
            <span className="text-xs text-slate-400 mt-1">Add</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [pickupFiles, setPickupFiles] = useState<File[]>([]);
  const [returnedFiles, setReturnedFiles] = useState<File[]>([]);
  const [returnPreviewUrl, setReturnPreviewUrl] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<DamageReport | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setReport(null);

    if (pickupFiles.length === 0 || returnedFiles.length === 0) {
      setError("Please select at least one pickup and one return image.");
      return;
    }

    if (pickupFiles.length > 6 || returnedFiles.length > 6) {
      setError("You can upload a maximum of 6 pickup and 6 return images.");
      return;
    }

    try {
      setIsLoading(true);

      const formData = new FormData();
      pickupFiles.forEach((file) => formData.append("pickup", file));
      returnedFiles.forEach((file) => formData.append("returned", file));

      const res = await fetch(`${BACKEND_URL}/api/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "Failed to analyze images.");
      }

      const data: DamageReport = await res.json();
      console.log("analyze result:", data);
      setReport(data);
    } catch (err: any) {
      console.error("analyze error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  // Convert Roboflow predictions into overlay boxes (in percentages)
  const yoloBoxes = useMemo(() => {
    if (!report?.yolo?.predictions || !report.yolo.image) return [];
    const preds = report.yolo.predictions;
    const imgMeta = report.yolo.image;
    const iw = imgMeta.width;
    const ih = imgMeta.height;
    if (!iw || !ih) return [];

    return preds.map((p, i) => {
      // Roboflow x,y are center coords
      const left = ((p.x - p.width / 2) / iw) * 100;
      const top = ((p.y - p.height / 2) / ih) * 100;
      const width = (p.width / iw) * 100;
      const height = (p.height / ih) * 100;

      // Color by class name: Light / Moderate / Severe
      const cls = (p.class || "").toLowerCase();
      let color = "rgba(34,197,94,0.9)"; // green = light
      if (cls.includes("mod")) {
        color = "rgba(234,179,8,0.9)"; // yellow = moderate
      }
      if (cls.includes("sev")) {
        color = "rgba(248,113,113,0.9)"; // red = severe
      }

      return {
        id: i,
        left,
        top,
        width,
        height,
        label: p.class,
        confidence: p.confidence,
        color,
      };
    });
  }, [report]);

  // Keep preview synced with first returned file
  const syncReturnPreview = (files: File[]) => {
    if (files[0]) {
      setReturnPreviewUrl(URL.createObjectURL(files[0]));
    } else {
      setReturnPreviewUrl(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-4xl space-y-8 py-10">
        {/* Header */}
        <header className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">
            SmartDamage Inspector
          </h1>
          <p className="text-slate-400 text-sm md:text-base">
            Upload up to 6 pickup and 6 return photos of a vehicle. The backend
            will run Roboflow (damage detection) and Qwen (damage description)
            and return an assessment report.
          </p>
        </header>

        {/* Form */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Pickup images */}
              <ImageUploader
                label="Pickup images (before)"
                files={pickupFiles}
                setFiles={setPickupFiles}
                max={6}
              />

              {/* Returned images */}
              <div className="space-y-4">
                <ImageUploader
                  label="Return images (after)"
                  files={returnedFiles}
                  setFiles={(files) => {
                    setReturnedFiles(files);
                    syncReturnPreview(files);
                  }}
                  max={6}
                />

                {/* Preview with YOLO boxes on first return image */}
                {returnedFiles.length > 0 && returnPreviewUrl && (
                  <div className="w-full text-xs text-slate-400 space-y-2">
                    <p>Preview with detected damage (first return image):</p>
                    <div className="relative w-full h-40 border border-slate-700 rounded-lg overflow-hidden bg-black/40">
                      <img
                        src={returnPreviewUrl}
                        alt="Return preview"
                        className="w-full h-full object-cover"
                      />
                      {yoloBoxes.map((box) => (
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
                            className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-900"
                            style={{ backgroundColor: box.color }}
                          >
                            {box.label}{" "}
                            {box.confidence !== undefined &&
                              `(${(box.confidence * 100).toFixed(0)}%)`}
                          </div>
                        </div>
                      ))}
                    </div>
                    {(!report?.yolo?.predictions ||
                      report.yolo.predictions.length === 0) && (
                      <p className="mt-1 text-[11px] text-slate-500">
                        * Boxes will appear here after you click{" "}
                        <span className="font-semibold">Analyze</span> and the
                        detection finishes.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-4 py-2">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-70 disabled:cursor-not-allowed text-sm font-medium text-slate-950 transition"
            >
              {isLoading ? "Analyzing..." : "Analyze Damage"}
            </button>
          </form>
        </section>

        {/* Report */}
        {report && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-lg space-y-6">
            <h2 className="text-xl font-semibold">Inspection Report</h2>

            {/* High-level summary */}
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800">
                <p className="text-xs uppercase text-slate-500 mb-1">
                  Severity
                </p>
                <p className="text-lg font-semibold">
                  {report.summary?.severityScore !== undefined
                    ? `${Math.round(
                        (report.summary.severityScore ?? 0) * 100
                      )} / 100`
                    : "N/A"}
                </p>
              </div>
              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800">
                <p className="text-xs uppercase text-slate-500 mb-1">
                  Estimated repair cost
                </p>
                <p className="text-lg font-semibold">
                  {report.summary?.estimatedRepairCost !== undefined
                    ? `$${report.summary.estimatedRepairCost}`
                    : "N/A"}
                </p>
              </div>
              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800">
                <p className="text-xs uppercase text-slate-500 mb-1">
                  Files analyzed
                </p>
                <p className="text-sm">
                  <span className="block truncate">
                    Pickup: {report.pickup?.filename ?? "N/A"}
                  </span>
                  <span className="block truncate">
                    Return: {report.returned?.filename ?? "N/A"}
                  </span>
                </p>
              </div>
            </div>

            {/* Qwen description */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-200">
                AI Damage Description (Qwen)
              </h3>
              <p className="text-sm text-slate-300 bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                {report.qwen?.description ??
                  "No description returned by the AI service."}
              </p>
            </div>

            {/* Raw JSON (debug section) */}
            <details className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-400">
              <summary className="cursor-pointer text-slate-200 mb-2">
                Raw response (Detections & Qwen JSON)
              </summary>
              <pre className="mt-2 whitespace-pre-wrap break-all">
                {JSON.stringify(report, null, 2)}
              </pre>
            </details>
          </section>
        )}
      </div>
    </main>
  );
}
