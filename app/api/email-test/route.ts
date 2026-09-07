import { NextRequest } from "next/server";
import { getNotificationProvider } from "@/lib/providers";
import { json, unauthorized } from "@/lib/api";

// TEMPORARY diagnostic endpoint — verifies the Resend email config on the live
// deployment. Guarded by a shared secret. REMOVE after confirming delivery.
//
// Usage: GET /api/email-test?secret=<CRM_WEBHOOK_SECRET or DIAG_SECRET>
export async function GET(req: NextRequest) {
  const provided = new URL(req.url).searchParams.get("secret") ?? "";
  const expected =
    process.env.DIAG_SECRET ?? process.env.CRM_WEBHOOK_SECRET ?? "";

  // Report which env vars are configured (presence only — never the values).
  const config = {
    NOTIFICATION_PROVIDER: process.env.NOTIFICATION_PROVIDER ?? "(unset)",
    RESEND_API_KEY: process.env.RESEND_API_KEY ? "set ✅" : "MISSING ❌",
    NOTIFY_EMAIL_FROM: process.env.NOTIFY_EMAIL_FROM ?? "(unset)",
    OPS_NOTIFY_EMAIL: process.env.OPS_NOTIFY_EMAIL ?? "(unset)",
  };

  if (!expected || provided !== expected) {
    // Still show config presence so we can debug even without the secret,
    // but do not send an email.
    return unauthorized(
      `Wrong or missing ?secret. Set DIAG_SECRET (or CRM_WEBHOOK_SECRET) in Vercel. Config seen: ${JSON.stringify(
        config
      )}`
    );
  }

  const to = process.env.OPS_NOTIFY_EMAIL;
  if (!to) {
    return json({ ok: false, error: "OPS_NOTIFY_EMAIL not set", config }, 400);
  }

  try {
    const notify = getNotificationProvider();
    await notify.sendEmail(to, "ops_kyc_package", {
      name: "Test Client (diagnostic)",
      order_id: "EMO-TEST-0001",
      email: "test@example.com",
      mobile: "9999999999",
      submitted_at: new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      }),
      links: {
        aadhaar_front: "https://example.com/sample",
        aadhaar_back: "https://example.com/sample",
        pan: "https://example.com/sample",
        kyc_video: "https://example.com/sample",
      },
      flags: ["This is a diagnostic test email — safe to ignore."],
    });
    return json({
      ok: true,
      message: `Test email dispatched to ${to}. Check the inbox (and spam).`,
      config,
    });
  } catch (err) {
    return json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "send failed",
        config,
      },
      500
    );
  }
}
