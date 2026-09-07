import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/cases";
import { withCase, json, badRequest } from "@/lib/api";
import type { DocType } from "@/lib/types";

// POST /api/kyc/:token/confirm — record an uploaded document or video.
// Upserts so re-uploading the same doc_type replaces the previous entry.
export const POST = withCase(async (req, { kase, token }) => {
  const body = await req.json().catch(() => null);
  const docType = body?.doc_type as DocType | undefined;
  const storagePath = body?.storage_path as string | undefined;
  const originalName = body?.original_name as string | undefined;
  const bucket = (body?.bucket as string | undefined) ?? "kyc-documents";
  if (!docType || !storagePath) {
    return badRequest("doc_type and storage_path required");
  }

  const supabase = createAdminClient();

  // Replace any previous upload of the same type for this case.
  await supabase
    .from("documents")
    .delete()
    .eq("case_id", kase.id)
    .eq("doc_type", docType);

  await supabase.from("documents").insert({
    case_id: kase.id,
    doc_type: docType,
    source: "upload",
    storage_path: storagePath,
    original_name: originalName ?? null,
    status: "received",
  });

  await audit({
    case_id: kase.id,
    actor_type: "client_token",
    actor_id: token.slice(0, 8),
    action: docType === "kyc_video" ? "video.uploaded" : "document.uploaded",
    step: docType === "kyc_video" ? "video" : "documents",
    after: { doc_type: docType, bucket },
  });

  return json({ ok: true });
});
