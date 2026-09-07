// Branded HTML email templates for KYC events.
//
// Each builder returns { subject, html } so the Resend provider can send it.
// Kept dependency-free (plain template strings) so it works anywhere.

const BRAND = "#0B5FFF";
const BRAND_DARK = "#0842B0";

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f6f8fb;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <div style="max-width:560px;margin:0 auto;padding:24px;">
      <div style="padding:8px 0 16px;">
        <span style="font-size:18px;font-weight:700;color:${BRAND_DARK};">EaseMyOffice</span>
        <span style="font-size:12px;color:#64748b;"> &nbsp;·&nbsp; KYC Verification</span>
      </div>
      <div style="background:#fff;border-radius:16px;padding:28px;box-shadow:0 1px 2px rgba(15,23,42,.06);">
        <h1 style="margin:0 0 12px;font-size:20px;color:#0f172a;">${title}</h1>
        ${bodyHtml}
      </div>
      <p style="margin:16px 4px 0;font-size:12px;color:#94a3b8;">
        This is an automated message from EaseMyOffice KYC. If you weren't expecting it, please ignore.
      </p>
    </div>
  </body>
</html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${BRAND};color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 20px;border-radius:12px;">${label}</a>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#334155;">${text}</p>`;
}

export interface EmailContent {
  subject: string;
  html: string;
}

export interface TemplateData {
  name?: string;
  company_name?: string;
  order_id?: string;
  verify_url?: string;
  reason?: string;
  entity_type?: string;
  vo_location?: string;
  flags?: string[];
}

/** Sent to the CLIENT when the CRM issues a KYC link (booking confirmed). */
export function kycInvite(d: TemplateData): EmailContent {
  return {
    subject: "Complete your EaseMyOffice KYC",
    html: layout(
      "Complete your KYC",
      `${p(`Hi ${d.name ?? "there"},`)}
       ${p(
         `Your EaseMyOffice booking <b>${d.order_id ?? ""}</b> is confirmed. To activate your Virtual Office service, please complete your KYC — upload your Aadhaar &amp; PAN and record a short video. It takes about 3–4 minutes. Keep your cards ready.`
       )}
       <div style="margin:20px 0;">${button(d.verify_url ?? "#", "Start KYC →")}</div>
       ${p(
         `When you open the link, enter your <b>Booking ID (${d.order_id ?? ""})</b>, email and contact number to begin.`
       )}
       ${p(
         `If the button doesn't work, copy this link:<br><span style="color:#64748b;word-break:break-all;">${d.verify_url ?? ""}</span>`
       )}`
    ),
  };
}

/** Sent to the CLIENT after they submit the KYC. */
export function kycSubmitted(d: TemplateData): EmailContent {
  return {
    subject: "We've received your EaseMyOffice KYC",
    html: layout(
      "KYC submitted successfully",
      `${p(`Hi ${d.name ?? "there"},`)}
       ${p(
         `Thank you — we've received your KYC for <b>${d.company_name ?? ""}</b> (Order ${d.order_id ?? ""}). Our compliance team will review your information and documents and update you shortly.`
       )}
       ${p(`You can revisit your KYC link anytime to check the latest status.`)}`
    ),
  };
}

/** Sent to the CLIENT when KYC is approved. */
export function kycApprove(d: TemplateData): EmailContent {
  return {
    subject: "Your EaseMyOffice KYC is approved ✅",
    html: layout(
      "KYC approved",
      `${p(`Hi ${d.name ?? "there"},`)}
       ${p(
         `Good news — your KYC for <b>${d.company_name ?? ""}</b> (Order ${d.order_id ?? ""}) has been approved. Your Virtual Office service will now be activated. Our team will reach out with the next steps.`
       )}`
    ),
  };
}

/** Sent to the CLIENT when KYC is rejected. */
export function kycReject(d: TemplateData): EmailContent {
  return {
    subject: "Update on your EaseMyOffice KYC",
    html: layout(
      "KYC could not be approved",
      `${p(`Hi ${d.name ?? "there"},`)}
       ${p(
         `We were unable to approve your KYC for <b>${d.company_name ?? ""}</b> (Order ${d.order_id ?? ""}) at this time.`
       )}
       ${d.reason ? p(`<b>Reason:</b> ${d.reason}`) : ""}
       ${p(`Please contact our support team and we'll help you resolve this.`)}`
    ),
  };
}

/** Sent to the CLIENT when a re-KYC is requested (with a fresh link). */
export function kycReKyc(d: TemplateData): EmailContent {
  return {
    subject: "Action needed: please re-verify your EaseMyOffice KYC",
    html: layout(
      "Re-verification requested",
      `${p(`Hi ${d.name ?? "there"},`)}
       ${p(
         `We need you to re-complete part of your KYC for <b>${d.company_name ?? ""}</b> (Order ${d.order_id ?? ""}).`
       )}
       ${d.reason ? p(`<b>Reason:</b> ${d.reason}`) : ""}
       ${d.verify_url ? `<div style="margin:20px 0;">${button(d.verify_url, "Re-start KYC →")}</div>` : ""}`
    ),
  };
}

/** Sent to the internal TEAM MAILBOX when a client submits a KYC. */
export function opsNewSubmission(d: TemplateData): EmailContent {
  const flags =
    d.flags && d.flags.length
      ? `<div style="margin:12px 0;padding:10px 12px;background:#fef2f2;border-radius:10px;color:#b91c1c;font-size:13px;">🚨 Flags: ${d.flags.join(", ")}</div>`
      : "";
  return {
    subject: `New KYC submitted — ${d.company_name ?? ""} (${d.order_id ?? ""})`,
    html: layout(
      "New KYC submission",
      `${p(`A client has submitted their KYC and it's ready for review.`)}
       <table style="width:100%;font-size:14px;color:#334155;border-collapse:collapse;">
         <tr><td style="padding:4px 0;color:#94a3b8;">Client</td><td style="padding:4px 0;font-weight:600;">${d.name ?? ""}</td></tr>
         <tr><td style="padding:4px 0;color:#94a3b8;">Company</td><td style="padding:4px 0;font-weight:600;">${d.company_name ?? ""}</td></tr>
         <tr><td style="padding:4px 0;color:#94a3b8;">Entity</td><td style="padding:4px 0;">${d.entity_type ?? ""}</td></tr>
         <tr><td style="padding:4px 0;color:#94a3b8;">Location</td><td style="padding:4px 0;">${d.vo_location ?? ""}</td></tr>
         <tr><td style="padding:4px 0;color:#94a3b8;">Order</td><td style="padding:4px 0;">${d.order_id ?? ""}</td></tr>
       </table>
       ${flags}
       ${d.verify_url ? `<div style="margin:18px 0 4px;">${button(d.verify_url, "Open in dashboard →")}</div>` : ""}`
    ),
  };
}

/** Resolve a template name + data to concrete email content. */
export function renderTemplate(
  template: string,
  data: TemplateData
): EmailContent {
  switch (template) {
    case "kyc_invite":
      return kycInvite(data);
    case "kyc_submitted":
      return kycSubmitted(data);
    case "kyc_approve":
      return kycApprove(data);
    case "kyc_reject":
      return kycReject(data);
    case "kyc_re_kyc":
      return kycReKyc(data);
    case "ops_new_submission":
      return opsNewSubmission(data);
    default:
      return {
        subject: "EaseMyOffice KYC notification",
        html: layout("EaseMyOffice KYC", p("You have a new KYC notification.")),
      };
  }
}
