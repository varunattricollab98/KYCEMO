// DigiLocker (Meri Pehchaan) Aadhaar provider.
//
// Implements the AadhaarProvider interface using DigiLocker's OAuth 2.0
// authorization-code flow. The client consents on the DigiLocker screen and
// authenticates with an Aadhaar OTP; DigiLocker returns an auth code which we
// exchange for a token and then pull verified eKYC (name, DOB, gender, address,
// masked Aadhaar) from the government source.
//
// Compliance: consent is part of the DigiLocker journey. We store ONLY the
// masked Aadhaar (last 4) + a salted hash + verified fields — never the raw
// Aadhaar number.
//
// TODO: plug in vendor — the exact endpoints/params depend on whether you
// onboard directly as a DigiLocker partner or through an aggregator
// (Setu / Cashfree / Digitap / IDfy). Fill DIGILOCKER_* env vars and complete
// the two fetch calls below against your onboarded spec, then set
// AADHAAR_PROVIDER=digilocker.

import type { AadhaarProvider, AadhaarKycResult } from "./types";

const AUTH_BASE = process.env.DIGILOCKER_AUTH_BASE ?? "";
const CLIENT_ID = process.env.DIGILOCKER_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.DIGILOCKER_CLIENT_SECRET ?? "";

export const digilockerAadhaar: AadhaarProvider = {
  async createAuthUrl(caseId, redirectUri) {
    if (!CLIENT_ID || !AUTH_BASE) {
      throw new Error(
        "DigiLocker not configured. Set DIGILOCKER_CLIENT_ID / DIGILOCKER_AUTH_BASE, or use AADHAAR_PROVIDER=mock."
      );
    }
    // `state` carries the caseId so the callback can be tied back to the case.
    const params = new URLSearchParams({
      response_type: "code",
      client_id: CLIENT_ID,
      redirect_uri: redirectUri,
      state: caseId,
      // acr can force Aadhaar-based auth for KYC (per Meri Pehchaan spec).
      // scope/acr values depend on your onboarding — adjust as required.
    });
    const url = `${AUTH_BASE}/public/oauth2/1/authorize?${params.toString()}`;
    return { url, ref: `dl-${caseId}` };
  },

  async handleCallback(params): Promise<AadhaarKycResult> {
    const code = params.code;
    if (!code) {
      return { success: false, providerRef: "digilocker" };
    }

    // 1) Exchange the authorization code for an access token.
    // TODO: plug in vendor — confirm token endpoint + auth style for your spec.
    const tokenRes = await fetch(`${AUTH_BASE}/public/oauth2/1/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: process.env.DIGILOCKER_REDIRECT_URI ?? "",
      }),
    });
    if (!tokenRes.ok) {
      return { success: false, providerRef: "digilocker" };
    }
    const token = (await tokenRes.json()) as { access_token?: string };
    if (!token.access_token) {
      return { success: false, providerRef: "digilocker" };
    }

    // 2) Pull verified eKYC (Aadhaar) using the access token.
    // TODO: plug in vendor — confirm the eKYC endpoint + response shape.
    const kycRes = await fetch(`${AUTH_BASE}/public/oauth2/1/user`, {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    if (!kycRes.ok) {
      return { success: false, providerRef: "digilocker" };
    }
    const kyc = (await kycRes.json()) as Record<string, string>;

    return {
      success: true,
      providerRef: `dl-${kyc.reference_key ?? code.slice(0, 12)}`,
      name: kyc.name,
      dob: kyc.dob,
      gender: kyc.gender,
      // DigiLocker returns masked Aadhaar (xxxx-xxxx-1234). Store last 4 only.
      aadhaarLast4: (kyc.masked_aadhaar ?? "").replace(/\D/g, "").slice(-4),
      aadhaarFull: undefined, // not returned by DigiLocker eKYC — hash unavailable
      address: {
        state: kyc.state,
        pincode: kyc.pincode,
        line: kyc.address,
      },
      raw: { provider: "digilocker" },
    };
  },
};
