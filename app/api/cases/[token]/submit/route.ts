import { createAdminClient } from "@/lib/supabase/admin";
import { audit, setStep, raiseFlag } from "@/lib/cases";
import { getNotificationProvider } from "@/lib/providers";
import { withCase, json, clientMeta } from "@/lib/api";
import { requiredDocuments } from "@/lib/types";

// POST /api/cases/:token/submit — finalise the client's submission.
// Marks documents step, flags missing docs, moves case to under_review,
// locks the token, and notifies the client.
export const POST = withCase(async (req, { kase, token }) => {
  const body = await req.json().catch(() => ({}));
  const viaEmail = Boolean(body?.documents_via_email);

  const supabase = createAdminClient();

  // Documents step: completed if uploaded, in_progress if promised via email.
  const { data: docs } = await supabase
    .from("documents")
    .select("doc_type")
    .eq("case_id", kase.id);

  const uploadedTypes = new Set((docs ?? []).map((d) => d.doc_type));
  const needed = requiredDocuments(kase.entity_type);
  const missing = needed.filter((d) => !uploadedTypes.has(d));

  if (viaEmail) {
    await setStep(kase.id, "documents", "in_progress", { via_email: true });
  } else if (missing.length === 0) {
    await setStep(kase.id, "documents", "completed");
  } else {
    await setStep(kase.id, "documents", "in_progress", { missing });
    await raiseFlag(kase.id, "documents_missing", "warning", { missing });
  }

  await supabase
    .from("kyc_cases")
    .update({ status: "under_review", token_status: "submitted" })
    .eq("id", kase.id);

  await setStep(kase.id, "approval", "pending");

  await audit({
    case_id: kase.id,
    actor_type: "client_token",
    actor_id: token.slice(0, 8),
    action: "case.submitted",
    after: { via_email: viaEmail, missing },
    ...clientMeta(req),
  });

  // Notify the client (mock in dev).
  try {
    const notify = getNotificationProvider();
    await notify.sendEmail(kase.email, "kyc_submitted", {
      name: kase.client_name,
      order_id: kase.order_id,
    });
    await notify.sendWhatsApp(kase.mobile, "kyc_submitted", {
      name: kase.client_name,
    });
  } catch {
    // notifications are best-effort
  }

  return json({ ok: true, next: `/verify/${token}/status` });
});
