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
        This is an automated message from EaseMyOffice KYC.
      </p>
    </div>
  </body>
</html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${BRAND};color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 20px;border-radius:12px;">${label}</a>`;
}

function linkRow(label: string, href: string | null): string {
  const right = href
    ? `<a href="${href}" style="color:${BRAND_DARK};font-weight:600;text-decoration:none;">Download / view →</a>`
    : `<span style="color:#b91c1c;">not provided</span>`;
  return `<tr>
    <td style="padding:8px 0;border-bottom:1px solid #eef2f7;color:#334155;font-size:14px;">${label}</td>
    <td style="padding:8px 0;border-bottom:1px solid #eef2f7;text-align:right;font-size:14px;">${right}</td>
  </tr>`;
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
  email?: string;
  mobile?: string;
  submitted_at?: string;
  flags?: string[];
  // Secure signed download links for the team email.
  links?: {
    aadhaar_front?: string | null;
    aadhaar_back?: string | null;
    pan?: string | null;
    kyc_video?: string | null;
  };
  link_expiry_note?: string;
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
         `Thank you — we've received your KYC documents and video for Booking <b>${d.order_id ?? ""}</b>. Our documentation team will verify the details and reach out with the next steps.`
       )}`
    ),
  };
}

/**
 * Sent to the DOCUMENTATION TEAM (team@easemyoffice.in) when a client submits.
 * Contains formatted details + secure download links for each file.
 */
export function opsKycPackage(d: TemplateData): EmailContent {
  const l = d.links ?? {};
  const flags =
    d.flags && d.flags.length
      ? `<div style="margin:14px 0 4px;padding:10px 12px;background:#fef2f2;border-radius:10px;color:#b91c1c;font-size:13px;">⚠️ ${d.flags.join(" · ")}</div>`
      : "";
  return {
    subject: `New KYC submission — Booking ${d.order_id ?? ""}`,
    html: layout(
      "New KYC submission",
      `${p(`A client has submitted their KYC. Details and secure file links are below.`)}
       <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
         <tr><td style="padding:4px 0;color:#94a3b8;font-size:14px;">Name</td><td style="padding:4px 0;text-align:right;font-weight:600;font-size:14px;">${d.name ?? "—"}</td></tr>
         <tr><td style="padding:4px 0;color:#94a3b8;font-size:14px;">Booking ID</td><td style="padding:4px 0;text-align:right;font-weight:600;font-size:14px;">${d.order_id ?? "—"}</td></tr>
         <tr><td style="padding:4px 0;color:#94a3b8;font-size:14px;">Email</td><td style="padding:4px 0;text-align:right;font-size:14px;">${d.email ?? "—"}</td></tr>
         <tr><td style="padding:4px 0;color:#94a3b8;font-size:14px;">Contact</td><td style="padding:4px 0;text-align:right;font-size:14px;">${d.mobile ?? "—"}</td></tr>
         <tr><td style="padding:4px 0;color:#94a3b8;font-size:14px;">Submitted</td><td style="padding:4px 0;text-align:right;font-size:14px;">${d.submitted_at ?? "—"}</td></tr>
       </table>

       <h2 style="margin:18px 0 6px;font-size:15px;color:#0f172a;">Documents &amp; Video</h2>
       <table style="width:100%;border-collapse:collapse;">
         ${linkRow("Aadhaar — Front", l.aadhaar_front ?? null)}
         ${linkRow("Aadhaar — Back", l.aadhaar_back ?? null)}
         ${linkRow("PAN Card", l.pan ?? null)}
         ${linkRow("Video KYC", l.kyc_video ?? null)}
       </table>
       ${flags}
       ${p(
         `<span style="color:#94a3b8;font-size:12px;">${
           d.link_expiry_note ??
           "These secure links expire after 7 days. Download the files to your records before they expire."
         }</span>`
       )}`
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
    case "ops_kyc_package":
      return opsKycPackage(data);
    default:
      return {
        subject: "EaseMyOffice KYC notification",
        html: layout("EaseMyOffice KYC", p("You have a new KYC notification.")),
      };
  }
}
