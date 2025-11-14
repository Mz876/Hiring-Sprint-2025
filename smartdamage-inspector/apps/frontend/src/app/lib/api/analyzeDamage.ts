// app/lib/api/analyzeDamage.ts
import type { DamageReport } from "@/app/types/damage";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export async function analyzeDamage(params: {
  pickupFiles: File[];
  returnedFiles: File[];
}): Promise<DamageReport> {
  const { pickupFiles, returnedFiles } = params;

  if (!pickupFiles.length || !returnedFiles.length) {
    throw new Error("Please select at least one pickup and one return image.");
  }

  if (pickupFiles.length > 6 || returnedFiles.length > 6) {
    throw new Error("You can upload a maximum of 6 pickup and 6 return images.");
  }

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
  return data;
}
