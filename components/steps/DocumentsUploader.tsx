"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { DOC_LABELS, REQUIRED_UPLOADS, type DocType } from "@/lib/types";

// Small icon per document type.
const DOC_ICON: Record<DocType, string> = {
  aadhaar_front: "🪪",
  aadhaar_back: "🪪",
  pan: "💳",
  kyc_video: "🎥",
};

// Uploads Aadhaar front/back + PAN. Each field allows either a gallery file or
// a direct camera capture (via the `capture` attribute on mobile).
export function DocumentsUploader({ token }: { token: string }) {
  const [uploaded, setUploaded] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(docType: DocType, file: File) {
    setBusy(docType);
    setError(null);
    try {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File too large (max 10 MB). Please use a smaller photo.");
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
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!put.ok) throw new Error("Upload failed, please try again");

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
      setUploaded((u) => ({ ...u, [docType]: file.name }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
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
                    ? "Uploaded successfully"
                    : busy === d
                      ? "Uploading…"
                      : "JPG / PNG / PDF · max 10 MB"}
                </div>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <label className="flex-1 cursor-pointer rounded-lg bg-brand-light px-3 py-2 text-center text-xs font-semibold text-brand transition hover:bg-brand-500/10">
                📷 Take photo
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  disabled={busy !== null}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) upload(d, f);
                  }}
                />
              </label>
              <label className="flex-1 cursor-pointer rounded-lg bg-slate-100 px-3 py-2 text-center text-xs font-semibold text-slate-600 transition hover:bg-slate-200">
                {done ? "Replace" : "Choose file"}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  disabled={busy !== null}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) upload(d, f);
                  }}
                />
              </label>
            </div>
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
            {doneCount} of {REQUIRED_UPLOADS.length} uploaded — upload all to
            continue
          </p>
        )}
      </div>
    </div>
  );
}
