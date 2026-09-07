# Architecture — EaseMyOffice KYC Verification Portal

A simple, self-serve KYC portal for `kyc.easemyoffice.in`. The link is shared
with the client after draft confirmation; they complete KYC in **3 steps**, and
the submission is emailed to the documentation team. **There is no dashboard.**

## 1. Client flow (3 steps)

```
kyc.easemyoffice.in/kyc
        │
   Step 1 — Identify           email + contact number + Booking ID
        │                       → matches (or creates) the case, issues a token
        ▼
   Step 2 — Documents          upload Aadhaar (front + back) + PAN
        │                       (camera capture or file; private storage)
        ▼
   Step 3 — Video KYC          record in-browser reading the on-screen script,
        │                       showing Aadhaar & PAN to the camera (~60s)
        ▼
   Submit → "KYC submitted"    files saved to private storage
        │
        ▼
   Email to team@easemyoffice.in    formatted details + secure download links
                                     (Aadhaar front/back, PAN, video KYC)
```

### The video KYC script (shown on screen while recording)
> Hi! My name is ______. My Aadhaar Card number is ______ (also show your Aadhaar
> card). My PAN Card number is ______ (also show your PAN card). I am ______
> (Designation) in ______ (Company). We are taking Virtual Office Services in
> ______ (Location / State) for our business purposes.

Because the client states name, company, designation and location **in the
video**, we don't ask them to re-type it — Step 1 only needs enough to tie the
submission to their booking.

## 2. Token model

- Step 1 (`POST /api/kyc/start`) matches an existing case by **Booking ID** (if the
  CRM pre-created one) or creates a lightweight case, then issues an opaque,
  high-entropy **token** with an expiry.
- The rest of the flow lives under `/kyc/{token}/…`. Every state-changing API
  handler re-validates the token server-side (`loadUsableCase`) — the client
  never has direct database access.

## 3. Screens

| Route | Step |
|-------|------|
| `/kyc` | Landing + Step 1 (Identify) |
| `/kyc/{token}/documents` | Step 2 (Aadhaar front/back + PAN upload) |
| `/kyc/{token}/video` | Step 3 (in-browser video recording) |
| `/kyc/{token}/done` | Confirmation |

## 4. API surface

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| POST | `/api/kyc/start` | Step 1 — identify, issue token | public |
| POST | `/api/kyc/:token/upload` | Signed upload URL (docs → `kyc-documents`, video → `kyc-video`) | token |
| POST | `/api/kyc/:token/confirm` | Record an uploaded file | token |
| POST | `/api/kyc/:token/submit` | Finalise + email the team the package | token |
| POST | `/api/cases` | (Optional) CRM pre-creates a case + emails the client the link | CRM secret |

## 5. Storage (private, signed URLs only)

| Bucket | Contents |
|--------|----------|
| `kyc-documents` | Aadhaar front/back, PAN images |
| `kyc-video` | Recorded video KYC |

Both buckets are private. Files are delivered to the team as **short-lived signed
download URLs** (default 7-day expiry) generated server-side with the service role.

## 6. Notifications (Resend)

- **Client submits →** the documentation team (`OPS_NOTIFY_EMAIL`, e.g.
  `team@easemyoffice.in`) receives a formatted email: Booking ID, email, contact,
  submitted-at, and secure download links for Aadhaar front/back, PAN, and the
  video KYC. The client also gets a confirmation email.
- **CRM pre-create (optional) →** invite email to the client with the `/kyc` link.

## 7. Audit trail

Every meaningful event (`kyc.started`, `document.uploaded`, `video.uploaded`,
`kyc.submitted`) is written to `audit_log` with actor, step, IP, and user-agent.

## 8. Security & compliance notes

- Public flow is token-capability based; every write re-validates the token.
- Aadhaar/PAN images + video live in **private** buckets; access only via
  server-generated signed URLs.
- No dashboard, no staff accounts — RLS is enabled on all tables with no
  anon/authenticated policies, so only the server-side service role can touch data.
- This is EaseMyOffice's own client onboarding / due-diligence KYC (documents +
  self-recorded video), not bank-grade VCIP. Confirm consent text + data
  retention with a compliance advisor before go-live.
