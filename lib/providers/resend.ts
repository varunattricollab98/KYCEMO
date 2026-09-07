// Resend-backed NotificationProvider.
//
// Sends KYC emails via the Resend HTTP API (no SDK dependency needed).
// Matches the EaseMyOffice website's existing email setup.
//
// Env:
//   RESEND_API_KEY   — your Resend API key (re_...)
//   NOTIFY_EMAIL_FROM — verified sender, e.g. "EaseMyOffice KYC <kyc@easemyoffice.in>"
//
// WhatsApp is left as a no-op for now (email is the confirmed channel).

import type { NotificationProvider } from "./types";
import { renderTemplate, type TemplateData } from "@/lib/email/templates";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

async function send(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.NOTIFY_EMAIL_FROM ?? "EaseMyOffice KYC <kyc@easemyoffice.in>";

  if (!apiKey) {
    // Don't hard-fail the request path if email isn't configured yet.
    console.warn("[resend] RESEND_API_KEY not set — skipping email to", to);
    return;
  }

  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    // Log but don't throw — notifications are best-effort.
    console.error(`[resend] send failed (${res.status}): ${detail}`);
  }
}

export const resendNotifications: NotificationProvider = {
  async sendEmail(to: string, template: string, data: object): Promise<void> {
    const { subject, html } = renderTemplate(template, data as TemplateData);
    await send(to, subject, html);
  },
  async sendWhatsApp(to: string, template: string): Promise<void> {
    // TODO: plug in WhatsApp vendor. No-op for now.
    console.log(`[resend provider] WhatsApp not configured (${template} -> ${to})`);
  },
};
