"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { CameraCapture } from "@/components/steps/CameraCapture";
import { DOC_LABELS, REQUIRED_UPLOADS, type DocType } from "@/lib/types";

// Small icon per document type.
const DOC_ICON: Record<DocType, string> = {
  aadhaar_front: "🪪",
  aadhaar_back: "🪪",
  pan: "💳",
  kyc_video: "🎥",
};

// Live-photo-only document capture. Each document uses an in-page camera
// (getUserMedia) — works on desktop + mobile, no gallery/file picker — so only
// a real on-the-spot photo of the physical Aadhaar/PAN card can be submitted.
export function DocumentsUploader({ token }: { token: string }) {
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(docType: DocType, file: File) {
    setBusy(docType);
    setError(null);
    try {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("Photo too large. Please retake.");
      }
      const signRes = await fetch(`/api/kyc/${token}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_type: docType, filename: file.name }),
      });
      const sign = await signRes.json();
      if (!signRes.ok) throw new Error(sign.error ?? "Could not prepare upload");

      const put = await fetch(sign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "image/jpeg" },
        body: file,
      });
      if (!put.ok) throw new Error("Upload failed, please retake");

      await fetch(`/api/kyc/${token}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doc_type: docType,
          storage_path: sign.path,
          original_name: file.name,
          bucket: sign.bucket,
        }),
      });
      setUploaded((u) => ({ ...u, [docType]: true }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploaded((u) => ({ ...u, [docType]: false }));
    } finally {
      setBusy(null);
    }
  }

  const allUploaded = REQUIRED_UPLOADS.every((d) => uploaded[d]);
  const doneCount = REQUIRED_UPLOADS.filter((d) => uploaded[d]).length;

  return (
    <div className="space-y-3">
      {REQUIRED_UPLOADS.map((d) => {
        const done = Boolean(uploaded[d]);
        return (
          <div
            key={d}
            className={`rounded-xl border p-3.5 transition-colors ${
              done
                ? "border-emerald-200 bg-emerald-50/50"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg ${
                  done ? "bg-emerald-100" : "bg-slate-100"
                }`}
              >
                {done ? "✅" : DOC_ICON[d]}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-navy">
                  {DOC_LABELS[d]}
                </div>
                <div
                  className={`text-xs ${done ? "text-emerald-600" : "text-slate-400"}`}
                >
                  {done
                    ? "Photo captured & uploaded"
                    : busy === d
                      ? "Uploading…"
                      : "Live photo — camera only"}
                </div>
              </div>
            </div>

            <CameraCapture
              label={DOC_LABELS[d]}
              uploading={busy === d}
              uploaded={done}
              onCapture={(file) => upload(d, file)}
            />
          </div>
        );
      })}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="pt-1">
        <Button
          href={allUploaded ? `/kyc/${token}/video` : undefined}
          disabled={!allUploaded}
        >
          Continue to Video KYC {allUploaded && <span aria-hidden>→</span>}
        </Button>
        {!allUploaded && (
          <p className="mt-2 text-center text-xs text-slate-400">
            {doneCount} of {REQUIRED_UPLOADS.length} captured — capture all to
            continue
          </p>
        )}
      </div>
    </div>
  );
}
