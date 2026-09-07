"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { DOC_LABELS, REQUIRED_UPLOADS, type DocType } from "@/lib/types";

// Uploads Aadhaar front/back + PAN. Each field allows either a gallery file or
// a direct camera capture (via the `capture` attribute on mobile).
export function DocumentsUploader({ token }: { token: string }) {
  const router = useRouter();
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
      // 1) Signed upload URL (private bucket, service role).
      const signRes = await fetch(`/api/kyc/${token}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_type: docType, filename: file.name }),
      });
      const sign = await signRes.json();
      if (!signRes.ok) throw new Error(sign.error ?? "Could not prepare upload");

      // 2) PUT the file directly to storage.
      const put = await fetch(sign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!put.ok) throw new Error("Upload failed, please try again");

      // 3) Record it.
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

  return (
    <div className="space-y-3">
      {REQUIRED_UPLOADS.map((d) => (
        <div
          key={d}
          className="rounded-xl border border-slate-200 p-3"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-800">
                {DOC_LABELS[d]}
              </div>
              {uploaded[d] ? (
                <div className="text-xs text-green-600">✓ Uploaded</div>
              ) : (
                <div className="text-xs text-slate-400">JPG / PNG / PDF · max 10 MB</div>
              )}
            </div>
            {busy === d && <span className="text-xs text-slate-400">Uploading…</span>}
          </div>

          <div className="mt-2 flex gap-2">
            {/* Camera capture (mobile) */}
            <label className="flex-1 cursor-pointer rounded-lg bg-brand-light px-3 py-2 text-center text-xs font-medium text-brand-dark hover:bg-blue-100">
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
            {/* Gallery / file */}
            <label className="flex-1 cursor-pointer rounded-lg bg-slate-100 px-3 py-2 text-center text-xs font-medium text-slate-700 hover:bg-slate-200">
              {uploaded[d] ? "Replace file" : "Choose file"}
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
      ))}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="pt-2">
        <Button
          href={allUploaded ? `/kyc/${token}/video` : undefined}
          disabled={!allUploaded}
        >
          Continue to Video KYC →
        </Button>
        {!allUploaded && (
          <p className="mt-2 text-xs text-slate-400">
            Please upload all three documents to continue.
          </p>
        )}
      </div>
    </div>
  );
}
