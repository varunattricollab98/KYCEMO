import { createAdminClient } from "@/lib/supabase/admin";
import { audit, setStep } from "@/lib/cases";
import { basicDetailsSchema, namesMatch } from "@/lib/validation";
import { withCase, json, badRequest, clientMeta } from "@/lib/api";

// POST /api/cases/:token/basic — save/confirm basic details.
export const POST = withCase(async (req, { kase, token }) => {
  const body = await req.json().catch(() => null);
  const parsed = basicDetailsSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid details");
  }

  const supabase = createAdminClient();
  await supabase
    .from("kyc_cases")
    .update({ ...parsed.data, status: "in_progress" })
    .eq("id", kase.id);

  await setStep(kase.id, "basic", "completed", { confirmed: true });

  // If an Aadhaar verification already exists, re-check name match.
  const { data: idv } = await supabase
    .from("identity_verifications")
    .select("verified_name")
    .eq("case_id", kase.id)
    .eq("kind", "aadhaar_digilocker")
    .maybeSingle();
  if (idv?.verified_name && !namesMatch(idv.verified_name, parsed.data.client_name)) {
    await supabase.from("case_flags").insert({
      case_id: kase.id,
      flag: "name_mismatch",
      severity: "warning",
      detail: { typed: parsed.data.client_name, verified: idv.verified_name },
      resolved: false,
    });
  }

  await audit({
    case_id: kase.id,
    actor_type: "client_token",
    actor_id: token.slice(0, 8),
    action: "basic.saved",
    step: "basic",
    ...clientMeta(req),
  });

  return json({ ok: true, next: `/verify/${token}/aadhaar` });
});
