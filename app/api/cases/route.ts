import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateToken, audit } from "@/lib/cases";
import { createCaseSchema } from "@/lib/validation";
import { getNotificationProvider } from "@/lib/providers";
import { json, badRequest, unauthorized } from "@/lib/api";

// POST /api/cases — called by the CRM when a booking is confirmed.
// Creates a KYC case and returns the token + verification link.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-crm-secret");
  if (!secret || secret !== process.env.CRM_WEBHOOK_SECRET) {
    return unauthorized("Invalid CRM secret");
  }

  const body = await req.json().catch(() => null);
  const parsed = createCaseSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid payload");
  }

  const supabase = createAdminClient();
  const token = generateToken();
  const expires = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

  const { data, error } = await supabase
    .from("kyc_cases")
    .insert({
      token,
      token_expires_at: expires.toISOString(),
      token_status: "active",
      status: "created",
      ...parsed.data,
    })
    .select("id, token")
    .single();

  if (error || !data) {
    return json({ error: error?.message ?? "Could not create case" }, 500);
  }

  await audit({
    case_id: data.id,
    actor_type: "system",
    actor_id: "crm",
    action: "case.created",
    after: { order_id: parsed.data.order_id },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  // The client starts at /kyc and identifies with their Booking ID, which
  // matches this pre-created case (by order_id).
  const kycUrl = `${appUrl}/kyc`;

  // Email the client the KYC link right away (best-effort).
  try {
    const notify = getNotificationProvider();
    await notify.sendEmail(parsed.data.email, "kyc_invite", {
      name: parsed.data.client_name,
      order_id: parsed.data.order_id,
      verify_url: kycUrl,
    });
  } catch {
    // best-effort — the kyc_url is also returned to the CRM below
  }

  return json({
    id: data.id,
    token: data.token,
    kyc_url: kycUrl,
    order_id: parsed.data.order_id,
    expires_at: expires.toISOString(),
  });
}
