// Provider-agnostic verification interfaces.
//
// The whole product is built against these interfaces. Swapping DigiLocker
// partner credentials, or a Video KYC vendor, is a config change (env var)
// — not a rewrite. See lib/providers/index.ts for selection.

export interface AadhaarKycResult {
  success: boolean;
  providerRef: string;
  name?: string;
  dob?: string; // ISO date
  gender?: string;
  aadhaarLast4?: string;
  aadhaarFull?: string; // used ONLY to compute a salted hash, never persisted
  address?: Record<string, unknown>;
  raw?: Record<string, unknown>;
}

export interface VerificationSubject {
  name: string;
  role: string; // director / partner / proprietor / signatory
}

export interface VideoKycResult {
  success: boolean;
  providerRef: string;
  livenessScore?: number;
  faceMatchScore?: number;
  recordingUrl?: string;
  status: "success" | "failed" | "pending";
}

export interface PanResult {
  success: boolean;
  pan: string;
  registeredName?: string;
  nameMatch?: boolean;
}

export interface AadhaarProvider {
  /** Build the redirect URL the client uses to consent + authenticate. */
  createAuthUrl(
    caseId: string,
    redirectUri: string
  ): Promise<{ url: string; ref: string }>;
  /** Exchange the callback params for verified eKYC data. */
  handleCallback(params: Record<string, string>): Promise<AadhaarKycResult>;
}

export interface VideoKYCProvider {
  createSession(
    caseId: string,
    subject: VerificationSubject
  ): Promise<{ url: string; ref: string }>;
  getResult(ref: string): Promise<VideoKycResult>;
}

export interface PANProvider {
  verify(pan: string, name: string): Promise<PanResult>;
}

export interface NotificationProvider {
  sendEmail(to: string, template: string, data: object): Promise<void>;
  sendWhatsApp(to: string, template: string, data: object): Promise<void>;
}
