import { createAdminClient } from "@/lib/supabase/admin";
import { audit, setStep, raiseFlag } from "@/lib/cases";
import { getNotificationProvider } from "@/lib/providers";
import { withCase, json, clientMeta } from "@/lib/api";
import { REQUIRED_UPLOADS } from "@/lib/types";

// POST /api/kyc/:token/submit — finalise the client's submission.
// Verifies all uploads + video are present, marks steps, moves the case to
// under_review, locks the token, and emails the team + the client.
export const POST = withCase(async (req, { kase, token }) => {
  const supabase = createAdminClient();

  const { data: docs } = await supabase
    .from("documents")
    .select("doc_type")
    .eq("case_id", kase.id);

  const have = new Set((docs ?? []).map((d) => d.doc_type));
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

  // Notifications (best-effort).
  try {
    const notify = getNotificationProvider();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

    // Alert the team mailbox.
    const opsMailbox = process.env.OPS_NOTIFY_EMAIL;
    if (opsMailbox) {
      await notify.sendEmail(opsMailbox, "ops_new_submission", {
        name: kase.client_name || "(name via video)",
        company_name: kase.company_name || "(via booking)",
        order_id: kase.order_id,
        vo_location: kase.vo_location,
        verify_url: `${appUrl}/dashboard/${kase.id}`,
        flags: [
          ...(missingDocs.length ? [`documents_missing (${missingDocs.length})`] : []),
          ...(!hasVideo ? ["video_missing"] : []),
        ],
      });
    }

    // Confirm to the client.
    if (kase.email) {
      await notify.sendEmail(kase.email, "kyc_submitted", {
        name: kase.client_name || "there",
        company_name: kase.company_name,
        order_id: kase.order_id,
      });
    }
  } catch {
    // best-effort
  }

  return json({ ok: true, next: `/kyc/${token}/done` });
});
