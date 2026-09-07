// Shared domain types for the EaseMyOffice KYC portal.
//
// Simplified client flow (per final spec):
//   1. Identify  — email + contact + booking ID
//   2. Documents — Aadhaar front + back, PAN (upload or camera)
//   3. Video KYC — in-browser recording following the on-screen script
// Everything is saved to private Supabase storage; the team is emailed on submit.

export type EntityType =
  | "private_limited"
  | "llp"
  | "partnership"
  | "proprietorship";

export type CaseStatus =
  | "created"
  | "in_progress"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "re_kyc";

export type TokenStatus = "active" | "submitted" | "expired" | "revoked";

// Simplified 3-step flow (+ final review by the team).
export type StepKey = "identify" | "documents" | "video" | "review";

export type StepStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "failed"
  | "skipped";

export type FlagKind =
  | "video_missing"
  | "documents_missing"
  | "potential_duplicate";

// The only uploads we collect now.
export type DocType = "aadhaar_front" | "aadhaar_back" | "pan" | "kyc_video";

export interface KycCase {
  id: string;
  token: string;
  token_expires_at: string;
  token_status: TokenStatus;
  order_id: string;
  client_name: string;
  mobile: string;
  mobile_verified: boolean;
  email: string;
  company_name: string;
  entity_type: EntityType;
  vo_location: string;
  plan: string;
  status: CaseStatus;
  crm_synced_at: string | null;
  geo_lat: number | null;
  geo_lng: number | null;
  geo_accuracy: number | null;
  geo_captured_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface KycStep {
  id: string;
  case_id: string;
  step: StepKey;
  status: StepStatus;
  data: Record<string, unknown>;
  updated_at: string;
}

export const DOC_LABELS: Record<DocType, string> = {
  aadhaar_front: "Aadhaar Card — Front",
  aadhaar_back: "Aadhaar Card — Back",
  pan: "PAN Card",
  kyc_video: "Video KYC",
};

// The document images the client must upload in Step 2.
export const REQUIRED_UPLOADS: DocType[] = ["aadhaar_front", "aadhaar_back", "pan"];

export const ENTITY_LABELS: Record<EntityType, string> = {
  private_limited: "Private Limited",
  llp: "LLP",
  partnership: "Partnership",
  proprietorship: "Proprietorship",
};

export const STEP_ORDER: StepKey[] = ["identify", "documents", "video", "review"];

export const STEP_LABELS: Record<StepKey, string> = {
  identify: "Your Details",
  documents: "Upload Documents",
  video: "Video KYC",
  review: "Review",
};

// The on-screen script shown to the client while recording their video KYC.
export const VIDEO_KYC_SCRIPT = `Hi! My name is _______________.
My Aadhaar Card number is _______________ (also show your Aadhaar card).
My PAN Card number is _______________ (also show your PAN card).
I am _______________ (Designation) in _______________ (Company Name).
We are taking Virtual Office Services in _______________ (Location / State) for our business purposes.`;
