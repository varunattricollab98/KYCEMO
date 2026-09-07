// Shared domain types for the EaseMyOffice KYC portal.

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

export type StepKey = "basic" | "aadhaar" | "video" | "documents" | "approval";

export type StepStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "failed"
  | "skipped";

export type FlagKind =
  | "video_failed"
  | "video_incomplete"
  | "aadhaar_failed"
  | "name_mismatch"
  | "documents_missing"
  | "potential_duplicate";

export type DocType =
  | "coi"
  | "pan"
  | "gst"
  | "deed"
  | "llp_agreement"
  | "authorisation"
  | "director_kyc"
  | "other";

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

/** Which person must appear on Video KYC, based on entity type. */
export function verificationSubjectRole(entity: EntityType): string {
  switch (entity) {
    case "private_limited":
      return "Director / authorised signatory";
    case "llp":
      return "Designated partner / authorised signatory";
    case "partnership":
      return "Partner / authorised signatory";
    case "proprietorship":
      return "Proprietor";
  }
}

/** Entity-aware document checklist. */
export function requiredDocuments(entity: EntityType): DocType[] {
  const common: DocType[] = ["pan", "authorisation", "director_kyc"];
  switch (entity) {
    case "private_limited":
      return ["coi", ...common, "gst"];
    case "llp":
      return ["coi", "llp_agreement", ...common, "gst"];
    case "partnership":
      return ["deed", ...common, "gst"];
    case "proprietorship":
      return ["pan", "gst", "authorisation"];
  }
}

export const DOC_LABELS: Record<DocType, string> = {
  coi: "Certificate of Incorporation",
  pan: "PAN",
  gst: "GST Certificate (if applicable)",
  deed: "Partnership Deed",
  llp_agreement: "LLP Agreement",
  authorisation: "Authorisation Letter",
  director_kyc: "Director / Partner KYC documents",
  other: "Other supporting document",
};

export const ENTITY_LABELS: Record<EntityType, string> = {
  private_limited: "Private Limited",
  llp: "LLP",
  partnership: "Partnership",
  proprietorship: "Proprietorship",
};

export const STEP_ORDER: StepKey[] = [
  "basic",
  "aadhaar",
  "video",
  "documents",
  "approval",
];

export const STEP_LABELS: Record<StepKey, string> = {
  basic: "Basic Details",
  aadhaar: "Aadhaar Verification",
  video: "Video KYC",
  documents: "Documents Verification",
  approval: "Final Approval",
};
