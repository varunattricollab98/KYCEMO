import { getAadhaarProvider } from "@/lib/providers";
import { audit, setStep } from "@/lib/cases";
import { withCase, json, clientMeta } from "@/lib/api";

// POST /api/cases/:token/aadhaar/init — begin DigiLocker OAuth.
export const POST = withCase(async (req, { kase, token }) => {
  const provider = getAadhaarProvider();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const redirectUri = `${appUrl}/api/cases/${token}/aadhaar/callback`;

  const { url, ref } = await provider.createAuthUrl(kase.id, redirectUri);

  await setStep(kase.id, "aadhaar", "in_progress", { provider_ref: ref });
  await audit({
    case_id: kase.id,
    actor_type: "client_token",
    actor_id: token.slice(0, 8),
    action: "aadhaar.init",
    step: "aadhaar",
    provider_ref: ref,
    consent: { digilocker: true, at: new Date().toISOString() },
    ...clientMeta(req),
  });

  return json({ url, ref });
});
