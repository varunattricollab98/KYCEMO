import { z } from "zod";

// Indian identity / contact validators used across the client flow.

export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const GSTIN_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const MOBILE_REGEX = /^[6-9][0-9]{9}$/;
export const PINCODE_REGEX = /^[1-9][0-9]{5}$/;
export const AADHAAR_REGEX = /^[0-9]{12}$/;

export const entityTypeSchema = z.enum([
  "private_limited",
  "llp",
  "partnership",
  "proprietorship",
]);

export const basicDetailsSchema = z.object({
  client_name: z.string().min(2, "Enter the full name"),
  mobile: z.string().regex(MOBILE_REGEX, "Enter a valid 10-digit mobile"),
  email: z.string().email("Enter a valid email"),
  company_name: z.string().min(2, "Enter the business / company name"),
  entity_type: entityTypeSchema,
});

export const otpSchema = z.object({
  otp: z.string().regex(/^[0-9]{6}$/, "Enter the 6-digit OTP"),
});

export const createCaseSchema = z.object({
  order_id: z.string().min(3),
  client_name: z.string().min(2),
  mobile: z.string().regex(MOBILE_REGEX),
  email: z.string().email(),
  company_name: z.string().min(2),
  entity_type: entityTypeSchema,
  vo_location: z.string().min(2),
  plan: z.string().min(1),
});

export type BasicDetailsInput = z.infer<typeof basicDetailsSchema>;
export type CreateCaseInput = z.infer<typeof createCaseSchema>;

/** Validate a PAN string. */
export function isValidPan(pan: string): boolean {
  return PAN_REGEX.test(pan.toUpperCase());
}

/**
 * Normalise a name for comparison (used for DigiLocker vs typed-name mismatch).
 * Lowercase, strip punctuation, collapse whitespace, drop common honorifics.
 */
export function normaliseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(mr|mrs|ms|dr|shri|smt|m\/s)\.?\b/g, "")
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Loose name-match: true if the names are close enough to not flag. */
export function namesMatch(a: string, b: string): boolean {
  const na = normaliseName(a);
  const nb = normaliseName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  // token overlap — every token of the shorter name appears in the longer
  const ta = new Set(na.split(" "));
  const tb = new Set(nb.split(" "));
  const [small, big] = ta.size <= tb.size ? [ta, tb] : [tb, ta];
  let hits = 0;
  small.forEach((t) => {
    if (big.has(t)) hits++;
  });
  return hits / small.size >= 0.6;
}
