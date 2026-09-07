// Provider selection. Reads env vars to pick the active adapter for each
// verification concern. Defaults to `mock` so the app runs with zero vendor
// credentials during development.

import type {
  AadhaarProvider,
  VideoKYCProvider,
  PANProvider,
  NotificationProvider,
} from "./types";
import {
  mockAadhaar,
  mockVideoKyc,
  mockPan,
  mockNotifications,
} from "./mock";
import { digilockerAadhaar } from "./digilocker";

export function getAadhaarProvider(): AadhaarProvider {
  switch (process.env.AADHAAR_PROVIDER) {
    case "digilocker":
      return digilockerAadhaar;
    default:
      return mockAadhaar;
  }
}

export function getVideoKycProvider(): VideoKYCProvider {
  switch (process.env.VIDEO_KYC_PROVIDER) {
    // case "idfy": return idfyVideoKyc; // TODO: plug in vendor
    default:
      return mockVideoKyc;
  }
}

export function getPanProvider(): PANProvider {
  return mockPan; // TODO: plug in NSDL-backed provider when ready
}

export function getNotificationProvider(): NotificationProvider {
  return mockNotifications; // TODO: plug in email + WhatsApp vendor
}

export * from "./types";
