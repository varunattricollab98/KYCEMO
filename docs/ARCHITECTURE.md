# Architecture — EaseMyOffice KYC Verification Portal

A simple, self-serve KYC portal for `kyc.easemyoffice.in`. The link is shared
with the client after draft confirmation; they complete KYC in **3 steps**, and
the team reviews it from an internal dashboard.

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
   Submit → "KYC submitted"    files saved, team emailed, case = under_review
        │
        ▼
   Operations Dashboard        review documents + video → Approve / Reject / Re-KYC
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

## 4. Operations dashboard (internal, staff-auth)

- `/dashboard` — case list: client, Booking ID, Documents ✓, Video ✓, status, 🚨 flags
- `/dashboard/{id}` — case detail: Step 1 info, **signed links to view each uploaded
  document + the video**, audit trail, and Approve / Reject / Request Re-KYC
- Auto flags: `documents_missing`, `video_missing`, `potential_duplicate`

## 5. API surface

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| POST | `/api/kyc/start` | Step 1 — identify, issue token | public |
| POST | `/api/kyc/:token/upload` | Signed upload URL (docs → `kyc-documents`, video → `kyc-video`) | token |
| POST | `/api/kyc/:token/confirm` | Record an uploaded file | token |
| POST | `/api/kyc/:token/submit` | Finalise submission + notify | token |
| POST | `/api/cases` | (Optional) CRM pre-creates a case | CRM secret |
| GET | `/dashboard`, `/dashboard/:id` | Ops views | staff auth |
| POST | `/api/ops/cases/:id/decision` | Approve / reject / re-KYC | staff auth |

## 6. Storage (private, signed URLs only)

| Bucket | Contents |
|--------|----------|
| `kyc-documents` | Aadhaar front/back, PAN images |
| `kyc-video` | Recorded video KYC |

Staff view files via short-lived signed URLs generated server-side.

## 7. Notifications (Resend)

- Client submits → confirmation email to client **+ alert to `OPS_NOTIFY_EMAIL`**
- Ops decision → approve / reject / re-KYC email to client (re-KYC includes the
  `/kyc` link to restart)
- CRM pre-create (optional) → invite email to client

## 8. Audit trail

Every meaningful event (`kyc.started`, `document.uploaded`, `video.uploaded`,
`kyc.submitted`, `decision.*`) is written to `audit_log` with actor, step, IP,
and user-agent.

## 9. Security & compliance notes

- Public flow is token-capability based; every write re-validates the token.
- Aadhaar/PAN images + video live in **private** buckets, signed-URL access only.
- Ops dashboard behind Supabase Auth + active-staff check + RLS.
- This is EaseMyOffice's own client onboarding/due-diligence KYC (documents +
  self-recorded video), not bank-grade VCIP. Confirm consent text + data
  retention with a compliance advisor before go-live.
