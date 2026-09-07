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

  const { data: docs } = await supabase
    .from("documents")
    .select("doc_type, storage_path")
    .eq("case_id", kase.id);

  const rows = (docs ?? []) as { doc_type: DocType; storage_path: string | null }[];
  const have = new Set(rows.map((d) => d.doc_type));
  const missingDocs = REQUIRED_UPLOADS.filter((d) => !have.has(d));
  const hasVideo = have.has("kyc_video");

  // Mark step outcomes.
  await setStep(
    kase.id,
    "documents",
    missingDocs.length === 0 ? "completed" : "in_progress",
    missingDocs.length ? { missing: missingDocs } : undefined
  );
  await setStep(kase.id, "video", hasVideo ? "completed" : "in_progress");

  if (missingDocs.length) {
    await raiseFlag(kase.id, "documents_missing", "warning", { missing: missingDocs });
  }
  if (!hasVideo) {
    await raiseFlag(kase.id, "video_missing", "warning");
  }

  await supabase
    .from("kyc_cases")
    .update({ status: "under_review", token_status: "submitted" })
    .eq("id", kase.id);
  await setStep(kase.id, "review", "pending");

  await audit({
    case_id: kase.id,
    actor_type: "client_token",
    actor_id: token.slice(0, 8),
    action: "kyc.submitted",
    after: { missingDocs, hasVideo },
    ...clientMeta(req),
  });

  // Build secure signed download links for each uploaded file.
  const links: Record<string, string | null> = {
    aadhaar_front: null,
    aadhaar_back: null,
    pan: null,
    kyc_video: null,
  };
  await Promise.all(
    rows.map(async (r) => {
      if (!r.storage_path) return;
      const { data } = await supabase.storage
        .from(bucketFor(r.doc_type))
        .createSignedUrl(r.storage_path, LINK_TTL_SECONDS);
      links[r.doc_type] = data?.signedUrl ?? null;
    })
  );

  // Notifications (best-effort).
  try {
    const notify = getNotificationProvider();

    // Re-read the latest geo (captured during recording, after this handler
    // first loaded the case).
    const { data: fresh } = await supabase
      .from("kyc_cases")
      .select("geo_lat, geo_lng, geo_accuracy, geo_captured_at")
      .eq("id", kase.id)
      .maybeSingle();
    const geo =
      fresh?.geo_lat != null && fresh?.geo_lng != null
        ? {
            lat: fresh.geo_lat as number,
            lng: fresh.geo_lng as number,
            accuracy: fresh.geo_accuracy as number | null,
            maps_url: `https://www.google.com/maps?q=${fresh.geo_lat},${fresh.geo_lng}`,
          }
        : null;

    // 1) The documentation team receives the formatted package + secure links.
    const teamMailbox = process.env.OPS_NOTIFY_EMAIL;
    if (teamMailbox) {
      await notify.sendEmail(teamMailbox, "ops_kyc_package", {
        name: kase.client_name,
        order_id: kase.order_id,
        vo_location: kase.vo_location,
        email: kase.email,
        mobile: kase.mobile,
        submitted_at: new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        }),
        links,
        geo,
        flags: [
          ...(missingDocs.length ? [`Missing documents: ${missingDocs.join(", ")}`] : []),
          ...(!hasVideo ? ["Video KYC missing"] : []),
          ...(!geo ? ["Location not captured"] : []),
        ],
      });
    }

    // 2) Confirmation to the client.
    if (kase.email) {
      await notify.sendEmail(kase.email, "kyc_submitted", {
        name: kase.client_name || "there",
        order_id: kase.order_id,
      });
    }
  } catch {
    // best-effort — never block submission on email
  }

  return json({ ok: true, next: `/kyc/${token}/done` });
});
