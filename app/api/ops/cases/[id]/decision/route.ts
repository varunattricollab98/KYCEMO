import { NextRequest } from "next/server";
import { createStaffClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateToken, audit } from "@/lib/cases";
import { getNotificationProvider } from "@/lib/providers";
import { json, badRequest, unauthorized } from "@/lib/api";

// POST /api/ops/cases/:id/decision — staff approves / rejects / requests re-KYC.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Authenticate the staff user.
  const staffClient = createStaffClient();
  const {
    data: { user },
  } = await staffClient.auth.getUser();
  if (!user) return unauthorized();
  const { data: staff } = await staffClient
    .from("staff_users")
    .select("role, active")
    .eq("id", user.id)
    .maybeSingle();
  if (!staff?.active) return unauthorized("Not an active staff member");

  const body = await req.json().catch(() => null);
  const decision = body?.decision as string | undefined;
  const reason = (body?.reason as string | undefined) ?? "";
  if (!decision || !["approve", "reject", "re_kyc"].includes(decision)) {
    return badRequest("decision must be approve | reject | re_kyc");
  }

  const admin = createAdminClient();
  const { data: kase } = await admin
    .from("kyc_cases")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (!kase) return json({ error: "Case not found" }, 404);

  let update: Record<string, unknown> = {};
  let approvalStatus = "pending";

  if (decision === "approve") {
    update = { status: "approved", crm_synced_at: new Date().toISOString() };
    approvalStatus = "completed";
  } else if (decision === "reject") {
    update = { status: "rejected" };
    approvalStatus = "failed";
  } else {
    // Re-KYC: issue a fresh token and re-open the flow.
    update = {
      status: "re_kyc",
      token: generateToken(),
      token_status: "active",
      token_expires_at: new Date(Date.now() + 14 * 864e5).toISOString(),
    };
    approvalStatus = "pending";
  }

  await admin.from("kyc_cases").update(update).eq("id", kase.id);
  await admin
    .from("kyc_steps")
    .update({ status: approvalStatus, updated_at: new Date().toISOString() })
    .eq("case_id", kase.id)
    .eq("step", "approval");

  await audit({
    case_id: kase.id,
    actor_type: "staff",
    actor_id: user.email ?? user.id,
    action: `decision.${decision}`,
    step: "approval",
    after: { reason },
  });

  // Notify the client + (TODO) sync status back to CRM.
  try {
    const notify = getNotificationProvider();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    // On re-KYC, include the fresh verification link so the client can restart.
    // On re-KYC the client restarts at /kyc and re-enters their Booking ID.
    const freshUrl = decision === "re_kyc" ? `${appUrl}/kyc` : undefined;
    await notify.sendEmail(kase.email, `kyc_${decision}`, {
      name: kase.client_name,
      company_name: kase.company_name,
      order_id: kase.order_id,
      reason,
      verify_url: freshUrl,
    });
  } catch {
    /* best-effort */
  }

  const newToken =
    decision === "re_kyc" ? (update.token as string) : undefined;
  return json({ ok: true, status: update.status, new_token: newToken });
}
