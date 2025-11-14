"use client";

import { useState, useMemo, useEffect } from "react";
import { ImageUploader } from "@/app/components/ImageUploader";
import { analyzeDamage } from "@/app/lib/api/analyzeDamage";
import type {
  DamageReport,
  RoboflowResult,
} from "@/app/types/damage";

type BoxOverlay = {
  id: number;
  left: number;
  top: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
  color: string;
};

export default function HomePage() {
  const [pickupFiles, setPickupFiles] = useState<File[]>([]);
  const [returnedFiles, setReturnedFiles] = useState<File[]>([]);
  const [returnPreviewUrl, setReturnPreviewUrl] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<DamageReport | null>(null);

  // When all images are cleared, reset report + error + preview
  useEffect(() => {
    if (pickupFiles.length === 0 && returnedFiles.length === 0) {
      setReport(null);
      setError(null);
      setReturnPreviewUrl(null);
    }
  }, [pickupFiles, returnedFiles]);

  // Keep preview synced with first returned file
  useEffect(() => {
    if (!returnedFiles[0]) {
      setReturnPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(returnedFiles[0]);
    setReturnPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [returnedFiles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setReport(null);

    try {
      setIsLoading(true);
      const data = await analyzeDamage({ pickupFiles, returnedFiles });
      setReport(data);
    } catch (err) {
      console.error("analyze error:", err);
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // YOLO overlays
  const yoloBoxes: BoxOverlay[] = useMemo(() => {
    if (!report?.yolo?.predictions || !report.yolo.image) return [];
    const preds = report.yolo.predictions;
    const imgMeta = report.yolo.image;
    const iw = imgMeta.width;
    const ih = imgMeta.height;
    if (!iw || !ih) return [];

    return preds.map((p, i) => {
      const left = ((p.x - p.width / 2) / iw) * 100;
      const top = ((p.y - p.height / 2) / ih) * 100;
      const width = (p.width / iw) * 100;
      const height = (p.height / ih) * 100;

      const cls = (p.class || "").toLowerCase();
      let color = "rgba(34,197,94,0.9)"; // green default
      if (cls.includes("mod")) color = "rgba(234,179,8,0.9)";
      if (cls.includes("sev")) color = "rgba(248,113,113,0.9)";

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

  const handleClearAll = () => {
    setPickupFiles([]);
    setReturnedFiles([]);
    setReport(null);
    setError(null);
    setReturnPreviewUrl(null);
  };

  const analyzeDisabled =
    isLoading || pickupFiles.length === 0 || returnedFiles.length === 0;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-4xl space-y-8 py-10">
        {/* Header */}
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
            Vehicle AI · Damage Assessment
          </p>
          <h1 className="text-3xl md:text-4xl font-bold">
            SmartDamage Inspector
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl">
            Upload pickup and return photos of a vehicle. We automatically
            detect visible damages, estimate severity, and suggest a repair
            cost.
          </p>
        </header>

        {/* Form */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-lg space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                New inspection
              </h2>
              <p className="text-xs text-slate-500">
                Step 1: Upload photos · Step 2: Run AI analysis
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs px-3 py-1.5 rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800/80 transition"
            >
              Clear all
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Pickup images */}
              <div className="space-y-2">
                <p className="text-[11px] uppercase text-slate-500 tracking-wide">
                  Step 1 · Pickup (before)
                </p>
                <ImageUploader
                  label="Pickup images"
                  helper="Capture the vehicle condition at pickup: front, rear, sides."
                  files={pickupFiles}
                  setFiles={setPickupFiles}
                  max={6}
                />
              </div>

              {/* Returned images */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-[11px] uppercase text-slate-500 tracking-wide">
                    Step 2 · Return (after)
                  </p>
                  <ImageUploader
                    label="Return images"
                    helper="Capture the vehicle condition at return from similar angles."
                    files={returnedFiles}
                    setFiles={setReturnedFiles}
                    max={6}
                  />
                </div>

                {/* Preview with YOLO boxes on first return image */}
                {returnedFiles.length > 0 && returnPreviewUrl && (
                  <div className="w-full text-xs text-slate-400 space-y-2">
                    <p className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Preview with detected damage (first return image)
                    </p>
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
                            className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-900 shadow-sm"
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
                        <span className="font-semibold text-slate-300">
                          Analyze Damage
                        </span>
                        .
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
            <div className="flex items-center justify-between gap-4">
              <button
                type="submit"
                disabled={analyzeDisabled}
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium text-slate-950 transition"
              >
                {isLoading ? "Analyzing..." : "Analyze Damage"}
              </button>
              <p className="text-[11px] text-slate-500">
                We don’t store your images. Analysis runs in real time on each
                upload.
              </p>
            </div>
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
                AI Damage Narrative
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
