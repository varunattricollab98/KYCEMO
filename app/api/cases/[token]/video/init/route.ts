import { getVideoKycProvider } from "@/lib/providers";
import { createAdminClient } from "@/lib/supabase/admin";
import { audit, setStep } from "@/lib/cases";
import { withCase, json, clientMeta } from "@/lib/api";
import { verificationSubjectRole } from "@/lib/types";

// POST /api/cases/:token/video/init — start a Video KYC session.
export const POST = withCase(async (req, { kase, token }) => {
  const provider = getVideoKycProvider();
  const role = verificationSubjectRole(kase.entity_type);

  const { url, ref } = await provider.createSession(kase.id, {
    name: kase.client_name,
    role,
  });

  const supabase = createAdminClient();
  await supabase.from("video_kyc_sessions").insert({
    case_id: kase.id,
    provider: process.env.VIDEO_KYC_PROVIDER ?? "mock",
    provider_ref: ref,
    subject_role: role,
    result: "pending",
  });

  await setStep(kase.id, "video", "in_progress", { provider_ref: ref });
  await audit({
    case_id: kase.id,
    actor_type: "client_token",
    actor_id: token.slice(0, 8),
    action: "video.init",
    step: "video",
    provider_ref: ref,
    ...clientMeta(req),
  });

  return json({ url, ref });
});
