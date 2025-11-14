"use client";

import { useState } from "react";

type DamageReport = {
  pickup?: { filename?: string };
  returned?: { filename?: string };
  yolo?: any;
  qwen?: {
    description?: string;
    severityScore?: number;
  };
  summary?: {
    severityScore?: number;
    estimatedRepairCost?: number;
  };
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function HomePage(){

  const [pickupFile, setPickupFile] = useState<File | null>(null);
  const [returnedFile, setReturnedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<DamageReport | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setReport(null);

    if (!pickupFile || !returnedFile) {
      setError("Please select both pickup and return images.");
      return;
    }

    try {

      setIsLoading(true);

      const formData = new FormData();
      formData.append("pickup", pickupFile);
      formData.append("returned", returnedFile);

      const res = await fetch(`${BACKEND_URL}/api/analyze`, {
        method: "POST",
        body: formData,
      });

      console.log("boboboboob:",res);

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "Failed to analyze images.");
      }

      const data: DamageReport = await res.json();

      console.log("data errro:",data);

      setReport(data);
    } catch (err: any) {

      console.log("errororororo:",err);

      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
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
            Upload pickup and return photos of a vehicle. The backend will run
            YOLO (damage detection) and Qwen (damage description) and return an
            assessment report.
          </p>
        </header>

        {/* Form */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Pickup */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-200">
                  Pickup image (before)
                </label>
                <div className="border border-dashed border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setPickupFile(e.target.files?.[0] ?? null)
                    }
                    className="text-sm"
                  />
                  {pickupFile && (
                    <div className="w-full text-xs text-slate-400">
                      <p className="truncate">Selected: {pickupFile.name}</p>
                      <div className="mt-2">
                        <p className="mb-1">Preview:</p>
                        <img
                          src={URL.createObjectURL(pickupFile)}
                          alt="Pickup preview"
                          className="w-full h-40 object-cover rounded-lg border border-slate-700"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Returned */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-200">
                  Return image (after)
                </label>
                <div className="border border-dashed border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setReturnedFile(e.target.files?.[0] ?? null)
                    }
                    className="text-sm"
                  />
                  {returnedFile && (
                    <div className="w-full text-xs text-slate-400">
                      <p className="truncate">Selected: {returnedFile.name}</p>
                      <div className="mt-2">
                        <p className="mb-1">Preview:</p>
                        <img
                          src={URL.createObjectURL(returnedFile)}
                          alt="Return preview"
                          className="w-full h-40 object-cover rounded-lg border border-slate-700"
                        />
                      </div>
                    </div>
                  )}
                </div>
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
                Raw response (YOLO & Qwen JSON)
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
