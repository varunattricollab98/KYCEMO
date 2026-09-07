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

// Step 1 — Identify. The link is sent after draft confirmation, so we only
// need enough to tie the KYC submission back to the client's booking.
export const identifySchema = z.object({
  client_name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  mobile: z.string().regex(MOBILE_REGEX, "Enter a valid 10-digit contact number"),
  booking_id: z.string().min(3, "Enter your Booking ID"),
});

// Used by the CRM when it creates the KYC case (still carries booking details).
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

export type IdentifyInput = z.infer<typeof identifySchema>;
export type CreateCaseInput = z.infer<typeof createCaseSchema>;

/** Validate a PAN string. */
export function isValidPan(pan: string): boolean {
  return PAN_REGEX.test(pan.toUpperCase());
}
