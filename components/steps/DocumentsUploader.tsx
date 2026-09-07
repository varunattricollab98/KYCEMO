"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { DOC_LABELS, type DocType } from "@/lib/types";

export function DocumentsUploader({
  token,
  docTypes,
}: {
  token: string;
  docTypes: DocType[];
}) {
  const router = useRouter();
  const [uploaded, setUploaded] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function upload(docType: DocType, file: File) {
    setBusy(docType);
    setError(null);
    try {
      // 1) Ask the server for a signed upload URL (service-role, private bucket).
      const signRes = await fetch(`/api/cases/${token}/documents/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_type: docType, filename: file.name }),
      });
      const sign = await signRes.json();
      if (!signRes.ok) throw new Error(sign.error ?? "Could not prepare upload");

      // 2) Upload directly to storage using the signed URL.
      const put = await fetch(sign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!put.ok) throw new Error("Upload failed");

      // 3) Confirm the upload so a `documents` row is recorded.
      await fetch(`/api/cases/${token}/documents/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doc_type: docType,
          storage_path: sign.path,
          original_name: file.name,
        }),
      });
      setUploaded((u) => ({ ...u, [docType]: file.name }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(null);
    }
  }

  async function finish(viaEmail: boolean) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents_via_email: viaEmail }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not submit");
      router.push(`/verify/${token}/status`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      {docTypes.map((d) => (
        <div
          key={d}
          className="flex items-center justify-between rounded-xl border border-slate-200 p-3"
        >
          <div>
            <div className="text-sm font-medium text-slate-800">
              {DOC_LABELS[d]}
            </div>
            {uploaded[d] && (
              <div className="text-xs text-green-600">✓ {uploaded[d]}</div>
            )}
          </div>
          <label className="cursor-pointer text-sm font-medium text-brand hover:text-brand-dark">
            {busy === d ? "Uploading…" : uploaded[d] ? "Replace" : "Upload"}
            <input
              type="file"
              className="hidden"
              disabled={busy !== null}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(d, f);
              }}
            />
          </label>
        </div>
      ))}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-col gap-2 pt-2">
        <Button type="button" disabled={submitting} onClick={() => finish(false)}>
          {submitting ? "Submitting…" : "Submit KYC →"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={submitting}
          onClick={() => finish(true)}
        >
          I&apos;ve already emailed my documents
        </Button>
      </div>
    </div>
  );
}
