"use client";

import { useState, useMemo, useEffect } from "react";
import { ImageUploader } from "@/app/components/ImageUploader";
import { ReturnThumbnails } from "@/app/components/ReturnThumbnails";
import { DamagePreview } from "@/app/components/DamagePreview";
import { analyzeDamage } from "@/app/lib/api/analyzeDamage";
import type {
  DamageReport,
  BoxOverlay,
  ReturnedImageAnalysis,
  PerImageComparison,
} from "@/app/types/damage";

export default function HomePage() {
  const [pickupFiles, setPickupFiles] = useState<File[]>([]);
  const [returnedFiles, setReturnedFiles] = useState<File[]>([]);
  const [activeReturnIndex, setActiveReturnIndex] = useState(0);
  const [activeReturnPreviewUrl, setActiveReturnPreviewUrl] =
    useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<DamageReport | null>(null);

  // Reset when everything cleared
  useEffect(() => {
    if (pickupFiles.length === 0 && returnedFiles.length === 0) {
      setReport(null);
      setError(null);
      setActiveReturnPreviewUrl(null);
      setActiveReturnIndex(0);
    }
  }, [pickupFiles, returnedFiles]);

  // Keep active index in range
  useEffect(() => {
    if (returnedFiles.length === 0) {
      setActiveReturnIndex(0);
      setActiveReturnPreviewUrl(null);
      return;
    }
    if (activeReturnIndex >= returnedFiles.length) {
      setActiveReturnIndex(0);
    }
  }, [returnedFiles, activeReturnIndex]);

  // Preview URL for active return file
  useEffect(() => {
    if (returnedFiles.length === 0) {
      setActiveReturnPreviewUrl(null);
      return;
    }

    const file = returnedFiles[activeReturnIndex] ?? returnedFiles[0];
    if (!file) {
      setActiveReturnPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setActiveReturnPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [returnedFiles, activeReturnIndex]);

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

  // Per-image analysis for active return
  const currentAnalysis: ReturnedImageAnalysis | undefined =
    report?.returnedAnalyses?.[activeReturnIndex];

  // Comparison entry for active image (new vs pre-existing)
  const currentComparison: PerImageComparison | null = useMemo(() => {
    if (!report?.comparison?.perImage) return null;
    return (
      report.comparison.perImage.find(
        (c) => c.returnImageIndex === activeReturnIndex
      ) ?? null
    );
  }, [report, activeReturnIndex]);

  // YOLO overlays for current image
  const yoloBoxes: BoxOverlay[] = useMemo(() => {
    if (!currentAnalysis?.yolo?.predictions || !currentAnalysis.yolo.image) {
      return [];
    }

    const preds = currentAnalysis.yolo.predictions;
    const imgMeta = currentAnalysis.yolo.image;
    const iw = imgMeta.width;
    const ih = imgMeta.height;
    if (!iw || !ih) return [];

    return preds.map((p, i) => {
      const left = ((p.x - p.width / 2) / iw) * 100;
      const top = ((p.y - p.height / 2) / ih) * 100;
      const width = (p.width / iw) * 100;
      const height = (p.height / ih) * 100;

      const cls = (p.class || "").toLowerCase();
      let color = "rgba(34,197,94,0.9)"; // default green
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
  }, [currentAnalysis]);

  const handleClearAll = () => {
    setPickupFiles([]);
    setReturnedFiles([]);
    setReport(null);
    setError(null);
    setActiveReturnPreviewUrl(null);
    setActiveReturnIndex(0);
  };

  const analyzeDisabled =
    isLoading || pickupFiles.length === 0 || returnedFiles.length === 0;

  const activeReturnLabel =
    returnedFiles.length > 0
      ? `Return ${activeReturnIndex + 1} of ${returnedFiles.length}${
          currentAnalysis?.filename ? ` · ${currentAnalysis.filename}` : ""
        }`
      : "No return image selected";

  const hasDetections =
    !!currentAnalysis?.yolo?.predictions &&
    currentAnalysis.yolo.predictions.length > 0;

  const activeDescription =
    currentAnalysis?.qwen?.description ?? report?.qwen?.description;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-5xl space-y-8 py-10">
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

        {/* Form & Uploads */}
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
            {/* Pickup & Return Upload Grids */}
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

                <ReturnThumbnails
                  files={returnedFiles}
                  activeIndex={activeReturnIndex}
                  onChange={setActiveReturnIndex}
                />
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

        {/* Damage Preview + Report */}
        {(activeReturnPreviewUrl || report) && (
          <section className="grid md:grid-cols-2 gap-6">
            {/* Big Damage Preview */}
            <DamagePreview
              label={activeReturnLabel}
              imageUrl={activeReturnPreviewUrl}
              boxes={yoloBoxes}
              hasDetections={hasDetections}
              comparisonForImage={currentComparison ?? undefined}
            />

            {/* Report / Analysis Panel */}
            {report && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
                <h2 className="text-lg font-semibold">Inspection Report</h2>

                {/* Summary */}
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800">
                    <p className="text-xs uppercase text-slate-500 mb-1">
                      Severity (worst image)
                    </p>
                    <p className="text-lg font-semibold">
                      {report.summary?.severityScore !== undefined
                        ? `${Math.round(
                            (report.summary.severityScore ?? 0) * 100
                          )} / 100`
                        : "N/A"}
                    </p>
                    {report.summary?.worstImageFilename && (
                      <p className="text-xs text-slate-500 mt-1">
                        Worst: {report.summary.worstImageFilename}
                      </p>
                    )}
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
                      <span className="block">
                        Pickup:{" "}
                        {report.pickup?.filenames &&
                        report.pickup.filenames.length
                          ? report.pickup.filenames.join(", ")
                          : "N/A"}
                      </span>
                      <span className="block">
                        Return:{" "}
                        {report.returned?.filenames &&
                        report.returned.filenames.length
                          ? report.returned.filenames.join(", ")
                          : "N/A"}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Per-image Qwen description */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-slate-200">
                    AI Damage Narrative (selected image)
                  </h3>
                  <p className="text-sm text-slate-300 bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                    {activeDescription ??
                      "No description returned by the AI service for this image."}
                  </p>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
