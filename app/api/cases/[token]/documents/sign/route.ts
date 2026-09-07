import { createAdminClient } from "@/lib/supabase/admin";
import { withCase, json, badRequest } from "@/lib/api";

// POST /api/cases/:token/documents/sign — return a signed upload URL to the
// private kyc-documents bucket. Client PUTs the file straight to storage.
export const POST = withCase(async (req, { kase }) => {
  const body = await req.json().catch(() => null);
  const docType = body?.doc_type as string | undefined;
  const filename = (body?.filename as string | undefined) ?? "file";
  if (!docType) return badRequest("doc_type is required");

  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${kase.id}/${docType}/${Date.now()}-${safe}`;

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from("kyc-documents")
    .createSignedUploadUrl(path);

  if (error || !data) {
    return json({ error: error?.message ?? "Could not sign upload" }, 500);
  }

  return json({ uploadUrl: data.signedUrl, path });
});
