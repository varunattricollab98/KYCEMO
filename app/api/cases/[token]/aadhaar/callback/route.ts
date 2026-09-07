import { NextRequest, NextResponse } from "next/server";
import { getAadhaarProvider } from "@/lib/providers";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadUsableCase, audit, setStep, raiseFlag, hashAadhaar } from "@/lib/cases";
import { namesMatch } from "@/lib/validation";

// GET /api/cases/:token/aadhaar/callback — DigiLocker redirects here.
// Exchanges the code, stores verified eKYC (no raw Aadhaar), flags mismatches,
// then redirects the client to the Video KYC step.
export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token;
  const kase = await loadUsableCase(token);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  if (!kase) {
    return NextResponse.redirect(`${appUrl}/verify/${token}`);
  }

  const url = new URL(req.url);
  const query: Record<string, string> = {};
  url.searchParams.forEach((v, k) => (query[k] = v));

  const provider = getAadhaarProvider();
  const result = await provider.handleCallback(query);
  const supabase = createAdminClient();

  if (!result.success) {
    await setStep(kase.id, "aadhaar", "failed");
    await raiseFlag(kase.id, "aadhaar_failed", "critical", { query });
    await audit({
      case_id: kase.id,
      actor_type: "provider",
      actor_id: "aadhaar",
      action: "aadhaar.failed",
      step: "aadhaar",
      provider_ref: result.providerRef,
    });
    return NextResponse.redirect(`${appUrl}/verify/${token}/aadhaar?error=1`);
  }

  await supabase.from("identity_verifications").insert({
    case_id: kase.id,
    kind: "aadhaar_digilocker",
    provider: process.env.AADHAAR_PROVIDER ?? "mock",
    provider_ref: result.providerRef,
    verified_name: result.name,
    verified_dob: result.dob ?? null,
    verified_address: result.address ?? null,
    aadhaar_last4: result.aadhaarLast4 ?? null,
    // Hash only if the provider surfaced a full number (mock does; DigiLocker does not).
    aadhaar_hash: result.aadhaarFull ? hashAadhaar(result.aadhaarFull) : null,
    result: "success",
    raw_meta: result.raw ?? null,
  });

  // Name-mismatch flag against the confirmed basic details.
  if (result.name && !namesMatch(result.name, kase.client_name)) {
    await raiseFlag(kase.id, "name_mismatch", "warning", {
      typed: kase.client_name,
      verified: result.name,
    });
  }

  // Potential-duplicate flag (same Aadhaar hash on another case).
  if (result.aadhaarFull) {
    const hash = hashAadhaar(result.aadhaarFull);
    const { data: dupes } = await supabase
      .from("identity_verifications")
      .select("case_id")
      .eq("aadhaar_hash", hash)
      .neq("case_id", kase.id);
    if (dupes && dupes.length > 0) {
      await raiseFlag(kase.id, "potential_duplicate", "warning", {
        matches: dupes.length,
      });
    }
  }

  await setStep(kase.id, "aadhaar", "completed", {
    verified_name: result.name,
  });
  await audit({
    case_id: kase.id,
    actor_type: "provider",
    actor_id: "aadhaar",
    action: "aadhaar.verified",
    step: "aadhaar",
    provider_ref: result.providerRef,
    after: { verified_name: result.name },
  });

  return NextResponse.redirect(`${appUrl}/verify/${token}/video`);
}
