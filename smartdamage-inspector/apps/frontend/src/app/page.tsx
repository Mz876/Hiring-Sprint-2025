"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { ImageUploader } from "@/app/components/ImageUploader";
import { ReturnThumbnails } from "@/app/components/ReturnThumbnails";
import { DamagePreview } from "@/app/components/DamagePreview";
import { DamagePreviewSkeleton } from "@/app/components/DamagePreviewSkeleton";
import { ReportSkeleton } from "@/app/components/ReportSkeleton";
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
      console.log("📊 Analysis result:", data);
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

  const currentAnalysis: ReturnedImageAnalysis | undefined =
    report?.returned?.analyses?.[activeReturnIndex];

  const currentComparison: PerImageComparison | null = useMemo(() => {
    if (!report?.comparison?.perImage) return null;
    return (
      report.comparison.perImage.find(
        (c) => c.returnImageIndex === activeReturnIndex
      ) ?? null
    );
  }, [report, activeReturnIndex]);

  const yoloBoxes: BoxOverlay[] = useMemo(() => {
    if (!currentAnalysis?.yolo?.predictions || !currentAnalysis.yolo.image) {
      return [];
    }

    const preds = currentAnalysis.yolo.predictions;
    const imgMeta = currentAnalysis.yolo.image;
    const iw = imgMeta.width;
    const ih = imgMeta.height;
    if (!iw || !ih) return [];

    const newDamageBoxes = currentComparison?.newDamageBoxes || [];
    const preExistingBoxes = currentComparison?.preExistingDamages || [];

    return preds.map((p, i) => {
      const left = ((p.x - p.width / 2) / iw) * 100;
      const top = ((p.y - p.height / 2) / ih) * 100;
      const width = (p.width / iw) * 100;
      const height = (p.height / ih) * 100;

      const isNew = newDamageBoxes.some((nb) => 
        Math.abs(nb.x - p.x) < 1 && 
        Math.abs(nb.y - p.y) < 1
      );
      
      const isPreExisting = preExistingBoxes.some((pb) => 
        Math.abs(pb.x - p.x) < 1 && 
        Math.abs(pb.y - p.y) < 1
      );

      let color = "rgba(234,179,8,0.9)";
      let label = p.class || "damage";

      if (isNew) {
        color = "rgba(239,68,68,0.9)";
        label = `🆕 ${p.class || "damage"}`;
      } else if (isPreExisting) {
        color = "rgba(34,197,94,0.9)";
        label = `✓ ${p.class || "damage"}`;
      }

      return {
        id: i,
        left,
        top,
        width,
        height,
        label,
        confidence: p.confidence,
        color,
        isNew,
        isPreExisting,
      };
    });
  }, [currentAnalysis, currentComparison]);

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
            <div className="grid md:grid-cols-2 gap-6">
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

            {error && (
              <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-4 py-2">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between gap-4">
              <motion.button
                type="submit"
                disabled={analyzeDisabled}
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium text-slate-950"
                whileHover={
                  analyzeDisabled
                    ? undefined
                    : { scale: 1.03, translateY: -1 }
                }
                whileTap={
                  analyzeDisabled
                    ? undefined
                    : { scale: 0.97, translateY: 0 }
                }
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
              >
                {isLoading ? "Analyzing..." : "Analyze Damage"}
              </motion.button>

              <p className="text-[11px] text-slate-500">
                We don't store your images. Analysis runs in real time on each
                upload.
              </p>
            </div>
          </form>
        </section>

        {/* Damage Preview + Report */}
        {(activeReturnPreviewUrl || report || isLoading) && (
          <section className="grid md:grid-cols-2 gap-6">
            {isLoading && !report ? (
              <DamagePreviewSkeleton />
            ) : (
              <DamagePreview
                label={activeReturnLabel}
                imageUrl={activeReturnPreviewUrl}
                boxes={yoloBoxes}
                hasDetections={hasDetections}
                comparisonForImage={currentComparison ?? undefined}
              />
            )}

            {isLoading && !report ? (
              <ReportSkeleton />
            ) : (
              report && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
                  <h2 className="text-lg font-semibold">Inspection Report</h2>

                  {/* Summary */}
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800">
                      <p className="text-xs uppercase text-slate-500 mb-1">
                        Severity (worst new damage)
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
                      {report.summary?.analysisMethod && (
                        <p className="text-xs text-emerald-400 mt-1">
                          Method: {report.summary.analysisMethod}
                        </p>
                      )}
                    </div>

                    {report?.summary && (
                      <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800">
                        <p className="text-xs uppercase text-slate-500 mb-1">
                          Overall damage (all images)
                        </p>
                        <p className="text-xs text-slate-400">
                          Total severity:{" "}
                          <span className="font-semibold text-slate-200">
                            {report.summary.totalSeverity.toFixed(2)}
                          </span>
                          <br />
                          Avg severity per view:{" "}
                          <span className="font-semibold text-slate-200">
                            {report.summary.avgSeverity.toFixed(2)}
                          </span>
                        </p>
                      </div>
                    )}

                    <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800">
                      <p className="text-xs uppercase text-slate-500 mb-1">
                        Estimated repair cost
                      </p>
                      <p className="text-lg font-semibold">
                        {report.summary?.estimatedRepairCost !== undefined
                          ? `$${report.summary.estimatedRepairCost}`
                          : "N/A"}
                      </p>
                      {report.summary?.reason && (
                        <p className="text-xs text-slate-500 mt-1">
                          {report.summary.reason}
                        </p>
                      )}
                    </div>

                    <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800">
                      <p className="text-xs uppercase text-slate-500 mb-1">
                        Damage breakdown
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-rose-400 font-semibold">
                            {report.summary?.newDamageCount ?? 0}
                          </span>
                          <span className="text-slate-500 ml-1">new</span>
                        </div>
                        <div>
                          <span className="text-emerald-400 font-semibold">
                            {report.summary?.preExistingDamageCount ?? 0}
                          </span>
                          <span className="text-slate-500 ml-1">pre-existing</span>
                        </div>
                      </div>
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

                  {/* UPDATED: Show ONLY focused analysis */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-200">
                      Damage Analysis (selected image)
                    </h3>
                    
                    {/* Show focused analysis if new damage exists */}
                    {currentComparison?.newDamageDescription && 
                     currentComparison.newDamages?.length > 0 ? (
                      <div className="text-sm text-slate-300 bg-rose-950/20 border border-rose-900/30 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs uppercase text-rose-400">
                            🆕 New Damage Detected
                          </p>
                          {currentComparison.newDamageSeverity > 0 && (
                            <span className="text-xs text-rose-300">
                              Severity: {Math.round(currentComparison.newDamageSeverity * 100)}/100
                            </span>
                          )}
                        </div>
                        <p className="leading-relaxed">{currentComparison.newDamageDescription}</p>
                        {currentComparison.repairRecommendation && (
                          <div className="mt-3 pt-3 border-t border-rose-900/30">
                            <p className="text-xs text-slate-400">
                              <strong className="text-slate-300">Repair Recommendation:</strong>
                              <br />
                              {currentComparison.repairRecommendation}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : currentComparison?.isIdenticalImage ? (
                      <div className="text-sm text-slate-400 bg-blue-950/20 border border-blue-900/30 rounded-xl p-4">
                        <p className="text-xs uppercase text-blue-400 mb-2">
                          ℹ️ Identical Image
                        </p>
                        <p>This image is identical to the pickup image. No new damage detected.</p>
                      </div>
                    ) : (currentComparison?.preExistingDamages?.length ?? 0) > 0 ? (
                      <div className="text-sm text-slate-400 bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-4">
                        <p className="text-xs uppercase text-emerald-400 mb-2">
                          ✓ No New Damage
                        </p>
                        <p>
                          All detected damage ({currentComparison?.preExistingDamages?.length ?? 0} item{(currentComparison?.preExistingDamages?.length ?? 0) !== 1 ? 's' : ''}) 
                          was already present at pickup. No repair charges for this image.
                        </p>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-400 bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                        <p className="text-xs uppercase text-slate-500 mb-2">
                          No Damage Detected
                        </p>
                        <p>No damage was detected in this image by the AI model.</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </section>
        )}
      </div>
    </main>
  );
}