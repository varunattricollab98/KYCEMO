// Mock provider implementations for local development and CI.
// These let the entire flow run end-to-end without any vendor credentials.

import type {
  AadhaarProvider,
  VideoKYCProvider,
  PANProvider,
  NotificationProvider,
  AadhaarKycResult,
  VideoKycResult,
  PanResult,
  VerificationSubject,
} from "./types";

export const mockAadhaar: AadhaarProvider = {
  async createAuthUrl(caseId, redirectUri) {
    const ref = `mock-dl-${caseId.slice(0, 8)}`;
    // In mock mode we route straight back to the callback with a fake code.
    const url = `${redirectUri}?code=MOCK_CODE&state=${caseId}&ref=${ref}`;
    return { url, ref };
  },
  async handleCallback(params): Promise<AadhaarKycResult> {
    return {
      success: true,
      providerRef: params.ref ?? "mock-dl",
      name: "Demo Client",
      dob: "1990-01-01",
      gender: "M",
      aadhaarLast4: "1234",
      aadhaarFull: "999999991234",
      address: { state: "Delhi", pincode: "110001" },
      raw: { mock: true },
    };
  },
};

export const mockVideoKyc: VideoKYCProvider = {
  async createSession(caseId, subject: VerificationSubject) {
    return {
      url: `/verify/mock/video?case=${caseId}&role=${encodeURIComponent(
        subject.role
      )}`,
      ref: `mock-vkyc-${caseId.slice(0, 8)}`,
    };
  },
  async getResult(ref): Promise<VideoKycResult> {
    return {
      success: true,
      providerRef: ref,
      livenessScore: 0.98,
      faceMatchScore: 0.95,
      status: "success",
    };
  },
};

export const mockPan: PANProvider = {
  async verify(pan, name): Promise<PanResult> {
    return { success: true, pan, registeredName: name, nameMatch: true };
  },
};

export const mockNotifications: NotificationProvider = {
  async sendEmail(to, template) {
    console.log(`[mock email] -> ${to} (${template})`);
  },
  async sendWhatsApp(to, template) {
    console.log(`[mock whatsapp] -> ${to} (${template})`);
  },
};
