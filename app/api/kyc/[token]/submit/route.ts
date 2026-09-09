import { createAdminClient } from "@/lib/supabase/admin";
import { audit, setStep, raiseFlag } from "@/lib/cases";
import { getNotificationProvider } from "@/lib/providers";
import { withCase, json, clientMeta } from "@/lib/api";
import { REQUIRED_UPLOADS, type DocType } from "@/lib/types";

// How long the secure download links in the team email stay valid.
const LINK_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

function bucketFor(docType: DocType): string {
  return docType === "kyc_video" ? "kyc-video" : "kyc-documents";
}

// POST /api/kyc/:token/submit — finalise the client's submission.
// Marks steps, locks the token, generates secure signed download links for
// every uploaded file, and emails the package to the documentation team.
export const POST = withCase(async (req, { kase, token }) => {
  const supabase = createAdminClient();

  // Read documents + latest geo together.
  const [{ data: docs }, { data: fresh }] = await Promise.all([
    supabase
      .from("documents")
      .select("doc_type, storage_path")
      .eq("case_id", kase.id),
    supabase
      .from("kyc_cases")
      .select("geo_lat, geo_lng, geo_accuracy")
      .eq("id", kase.id)
      .maybeSingle(),
  ]);

  const rows = (docs ?? []) as { doc_type: DocType; storage_path: string | null }[];
  const have = new Set(rows.map((d) => d.doc_type));
  const missingDocs = REQUIRED_UPLOADS.filter((d) => !have.has(d));
  const hasVideo = have.has("kyc_video");

  // Run all the independent DB writes + signed-URL generation concurrently.
  const links: Record<string, string | null> = {
    aadhaar_front: null,
    aadhaar_back: null,
    pan: null,
    kyc_video: null,
  };

  await Promise.all([
    setStep(
      kase.id,
      "documents",
      missingDocs.length === 0 ? "completed" : "in_progress",
      missingDocs.length ? { missing: missingDocs } : undefined
    ),
    setStep(kase.id, "video", hasVideo ? "completed" : "in_progress"),
    setStep(kase.id, "review", "pending"),
    supabase
      .from("kyc_cases")
      .update({ status: "under_review", token_status: "submitted" })
      .eq("id", kase.id),
    missingDocs.length
      ? raiseFlag(kase.id, "documents_missing", "warning", { missing: missingDocs })
      : Promise.resolve(),
    hasVideo ? Promise.resolve() : raiseFlag(kase.id, "video_missing", "warning"),
    audit({
      case_id: kase.id,
      actor_type: "client_token",
      actor_id: token.slice(0, 8),
      action: "kyc.submitted",
      after: { missingDocs, hasVideo },
      ...clientMeta(req),
    }),
    // Signed download links for each uploaded file (concurrent).
    ...rows.map(async (r) => {
      if (!r.storage_path) return;
      const { data } = await supabase.storage
        .from(bucketFor(r.doc_type))
        .createSignedUrl(r.storage_path, LINK_TTL_SECONDS);
      links[r.doc_type] = data?.signedUrl ?? null;
    }),
  ]);

  const geo =
    fresh?.geo_lat != null && fresh?.geo_lng != null
      ? {
          lat: fresh.geo_lat as number,
          lng: fresh.geo_lng as number,
          accuracy: fresh.geo_accuracy as number | null,
          maps_url: `https://www.google.com/maps?q=${fresh.geo_lat},${fresh.geo_lng}`,
        }
      : null;

  // Send both emails in parallel (was sequential). This keeps delivery reliable
  // on serverless while cutting the email wait to a single round-trip instead
  // of two. Failures are swallowed — email never blocks the submission result.
  const submittedAt = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
  });
  const notify = getNotificationProvider();
  const teamMailbox = process.env.OPS_NOTIFY_EMAIL;
  await Promise.all([
    teamMailbox
      ? notify
          .sendEmail(teamMailbox, "ops_kyc_package", {
            name: kase.client_name,
            order_id: kase.order_id,
            vo_location: kase.vo_location,
            email: kase.email,
            mobile: kase.mobile,
            submitted_at: submittedAt,
            links,
            geo,
            flags: [
              ...(missingDocs.length ? [`Missing documents: ${missingDocs.join(", ")}`] : []),
              ...(!hasVideo ? ["Video KYC missing"] : []),
              ...(!geo ? ["Location not captured"] : []),
            ],
          })
          .catch(() => {})
      : Promise.resolve(),
    kase.email
      ? notify
          .sendEmail(kase.email, "kyc_submitted", {
            name: kase.client_name || "there",
            order_id: kase.order_id,
          })
          .catch(() => {})
      : Promise.resolve(),
  ]);

  return json({ ok: true, next: `/kyc/${token}/done` });
});
