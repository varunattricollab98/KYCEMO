import { randomBytes, createHmac } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { KycCase } from "@/lib/types";

/** Generate an opaque, URL-safe, high-entropy token for the public KYC link. */
export function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

/** Salted hash of an Aadhaar number for duplicate detection. Never stores raw. */
export function hashAadhaar(aadhaar: string): string {
  const salt = process.env.AADHAAR_HASH_SALT ?? "";
  return createHmac("sha256", salt).update(aadhaar).digest("hex");
}

/**
 * Load a case by public token and enforce that it is usable.
 * Returns null when missing/expired/revoked. Runs with the service role,
 * so this is the single choke point for token validation.
 */
export async function loadUsableCase(token: string): Promise<KycCase | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("kyc_cases")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (error || !data) return null;

  const c = data as KycCase;
  if (c.token_status === "revoked" || c.token_status === "expired") return null;
  if (new Date(c.token_expires_at).getTime() < Date.now()) {
    await supabase
      .from("kyc_cases")
      .update({ token_status: "expired" })
      .eq("id", c.id);
    return null;
  }
  return c;
}

/** Append an audit-log entry. Best-effort; failures never block the flow. */
export async function audit(entry: {
  case_id?: string;
  actor_type: "client_token" | "staff" | "system" | "provider";
  actor_id: string;
  action: string;
  step?: string;
  before?: unknown;
  after?: unknown;
  provider_ref?: string;
  ip?: string;
  user_agent?: string;
  consent?: unknown;
}): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("audit_log").insert({
      case_id: entry.case_id ?? null,
      actor_type: entry.actor_type,
      actor_id: entry.actor_id,
      action: entry.action,
      step: entry.step ?? null,
      before: entry.before ?? null,
      after: entry.after ?? null,
      provider_ref: entry.provider_ref ?? null,
      ip: entry.ip ?? null,
      user_agent: entry.user_agent ?? null,
      consent: entry.consent ?? null,
    });
  } catch {
    // swallow — audit must never break the request path
  }
}

/** Raise (or upsert) an automated flag on a case. */
export async function raiseFlag(
  caseId: string,
  flag: string,
  severity: "info" | "warning" | "critical",
  detail?: unknown
): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("case_flags").insert({
    case_id: caseId,
    flag,
    severity,
    detail: detail ?? null,
    resolved: false,
  });
}

/** Set a single step's status for a case. */
export async function setStep(
  caseId: string,
  step: string,
  status: string,
  data?: Record<string, unknown>
): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from("kyc_steps")
    .update({
      status,
      data: data ?? {},
      updated_at: new Date().toISOString(),
    })
    .eq("case_id", caseId)
    .eq("step", step);
}
