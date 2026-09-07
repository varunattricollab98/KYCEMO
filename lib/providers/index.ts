// Provider selection. Reads env vars to pick the active adapter.
//
// The simplified flow only needs notifications (Resend). Identity/video are
// collected as uploads (Aadhaar/PAN images + a self-recorded video), reviewed
// by the team — no third-party verification vendor in this phase.

import type { NotificationProvider } from "./types";
import { mockNotifications } from "./mock";
import { resendNotifications } from "./resend";

export function getNotificationProvider(): NotificationProvider {
  switch (process.env.NOTIFICATION_PROVIDER) {
    case "resend":
      return resendNotifications;
    default:
      return mockNotifications;
  }
}

export * from "./types";
