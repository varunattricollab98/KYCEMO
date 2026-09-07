import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateToken, audit, setStep } from "@/lib/cases";
import { identifySchema } from "@/lib/validation";
import { json, badRequest, clientMeta } from "@/lib/api";

// POST /api/kyc/start — Step 1 (Identify).
// The link is shared with the client after draft confirmation, so a case may
// already exist for this booking. We match by booking_id; if none exists we
// create a lightweight case. Returns an active token for the rest of the flow.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = identifySchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid details");
  }
  const { client_name, email, mobile, booking_id, vo_location } = parsed.data;

  const supabase = createAdminClient();
  const expires = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

  // Try to find an existing case for this booking.
  const { data: existing } = await supabase
    .from("kyc_cases")
    .select("*")
    .eq("order_id", booking_id)
    .maybeSingle();

  let caseId: string;
  let token: string;

  if (existing) {
    // Reuse the case. Refresh the token + contact details, reopen it.
    caseId = existing.id;
    token = generateToken();
    await supabase
      .from("kyc_cases")
      .update({
        token,
        token_status: "active",
        token_expires_at: expires.toISOString(),
        client_name,
        email,
        mobile,
        vo_location,
        status: "in_progress",
      })
      .eq("id", caseId);
  } else {
    // No pre-created case — create a lightweight one from what the client gave.
    token = generateToken();
    const { data: created, error } = await supabase
      .from("kyc_cases")
      .insert({
        token,
        token_status: "active",
        token_expires_at: expires.toISOString(),
        order_id: booking_id,
        client_name,
        mobile,
        email,
        company_name: "",
        entity_type: "proprietorship",
        vo_location,
        plan: "",
        status: "in_progress",
      })
      .select("id")
      .single();
    if (error || !created) {
      return json({ error: error?.message ?? "Could not start KYC" }, 500);
    }
    caseId = created.id;
  }

  await setStep(caseId, "identify", "completed", { booking_id, email, mobile });
  await audit({
    case_id: caseId,
    actor_type: "client_token",
    actor_id: token.slice(0, 8),
    action: "kyc.started",
    step: "identify",
    after: { booking_id },
    ...clientMeta(req),
  });

  return json({ token, next: `/kyc/${token}/documents` });
}
