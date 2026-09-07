import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/cases";
import { withCase, json, badRequest } from "@/lib/api";

// POST /api/cases/:token/documents/confirm — record an uploaded document.
export const POST = withCase(async (req, { kase, token }) => {
  const body = await req.json().catch(() => null);
  const docType = body?.doc_type as string | undefined;
  const storagePath = body?.storage_path as string | undefined;
  const originalName = body?.original_name as string | undefined;
  if (!docType || !storagePath) return badRequest("doc_type and storage_path required");

  const supabase = createAdminClient();
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
    action: "documents.uploaded",
    step: "documents",
    after: { doc_type: docType },
  });

  return json({ ok: true });
});
