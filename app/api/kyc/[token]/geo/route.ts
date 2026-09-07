import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/cases";
import { withCase, json, badRequest, clientMeta } from "@/lib/api";

// POST /api/kyc/:token/geo — store the client's GPS location captured at the
// moment of video recording (mandatory for office KYC compliance).
export const POST = withCase(async (req, { kase, token }) => {
  const body = await req.json().catch(() => null);
  const lat = Number(body?.lat);
  const lng = Number(body?.lng);
  const accuracy =
    body?.accuracy != null ? Number(body.accuracy) : null;

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return badRequest("Valid coordinates are required");
  }

  const supabase = createAdminClient();
  await supabase
    .from("kyc_cases")
    .update({
      geo_lat: lat,
      geo_lng: lng,
      geo_accuracy: Number.isFinite(accuracy) ? accuracy : null,
      geo_captured_at: new Date().toISOString(),
    })
    .eq("id", kase.id);

  await audit({
    case_id: kase.id,
    actor_type: "client_token",
    actor_id: token.slice(0, 8),
    action: "geo.captured",
    step: "video",
    after: { lat, lng, accuracy },
    ...clientMeta(req),
  });

  return json({ ok: true });
});
