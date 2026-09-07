import { createAdminClient } from "@/lib/supabase/admin";
import { withCase, json, badRequest } from "@/lib/api";
import type { DocType } from "@/lib/types";

// POST /api/kyc/:token/upload — return a signed upload URL.
// Aadhaar/PAN images go to the private `kyc-documents` bucket; the recorded
// video goes to the private `kyc-video` bucket.
const VIDEO_TYPES: DocType[] = ["kyc_video"];

export const POST = withCase(async (req, { kase }) => {
  const body = await req.json().catch(() => null);
  const docType = body?.doc_type as DocType | undefined;
  const filename = (body?.filename as string | undefined) ?? "file";
  if (!docType) return badRequest("doc_type is required");

  const bucket = VIDEO_TYPES.includes(docType) ? "kyc-video" : "kyc-documents";
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${kase.id}/${docType}/${Date.now()}-${safe}`;

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(path);

  if (error || !data) {
    return json({ error: error?.message ?? "Could not sign upload" }, 500);
  }

  return json({ uploadUrl: data.signedUrl, path, bucket });
});
