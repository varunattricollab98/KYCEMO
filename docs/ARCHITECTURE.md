# Architecture — EaseMyOffice KYC Verification Portal

## 1. High-level flow

```
EaseMyOffice Website / CRM
        │
        │  Booking confirmed
        ▼
CRM creates a KYC CASE  ──►  generates unique token  ──►  Email + WhatsApp to client
                                                              │
                                                              ▼
                                            kyc.easemyoffice.in/verify/{token}
                                                              │
        ┌─────────────────────────────────────────────────────┤
        ▼            ▼              ▼              ▼            ▼
   Landing →  Basic Details →  Aadhaar (DigiLocker) →  Video KYC →  Documents →  Submitted
                                                              │
                                                              ▼
                                            Operations Dashboard (internal)
                                            Review → Approve / Reject / Re-KYC
                                                              │
                                                              ▼
                                            Status synced back to CRM
                                                              │
                                                              ▼
                                            Virtual Office Activation
```

**Key principle — transaction-linked.** A client never starts KYC from scratch. Every KYC case is tied to a booking (`EMO-XXXXXX`). Opening `/verify/{token}` already knows: who, which company, which plan, which location, which booking. This prevents manipulation and removes re-typing.

---

## 2. The token model

- CRM (or the `POST /api/cases` endpoint) creates a `kyc_case` row and returns an **opaque, high-entropy token** (not the booking id, not sequential).
- The public URL is `kyc.easemyoffice.in/verify/{token}`.
- The token maps server-side to the case; the `EMO-XXXXXX` order id is stored on the case but never exposed in the URL.
- Token has an **expiry** (`token_expires_at`) and a **status** (`active`, `submitted`, `expired`, `revoked`).
- Client sessions are **anonymous** — no client login. The token *is* the capability. Every state-changing action re-validates the token server-side (never trust the client).

---

## 3. Screen-by-screen (client flow)

All screens live under `app/verify/[token]/`. Progress is persisted server-side after each step so a client can resume from any device using the same link.

### Screen 0 — Landing (`/verify/{token}`)
> **Complete Your EaseMyOffice KYC**
> Your KYC is required to activate your Virtual Office service.
> Keep your Aadhaar and company/firm documents ready. Estimated time: 5–7 minutes.
- Shows prefilled context (name, company, plan, location) so the client trusts the link.
- Explicit **consent notice** + `[ Start KYC ]`.
- If token expired/submitted → show the appropriate state instead.

### Screen 1 — Basic Details (`/verify/{token}/basic`)
Prefilled from booking; client confirms/corrects.
- Client Name, Mobile, Email
- Business/Company Name
- Entity Type: `Private Limited | LLP | Partnership | Proprietorship`
- Virtual Office Location, Plan, Booking/Order ID (read-only)
- Mobile OTP verification (Supabase / SMS adapter) to prove reachability.

### Screen 2 — Aadhaar Authentication (`/verify/{token}/aadhaar`)
- Explains DigiLocker consent-based verification.
- `[ Verify with DigiLocker ]` → redirects to DigiLocker OAuth (Meri Pehchaan).
- On callback (`/verify/{token}/aadhaar/callback`) we exchange the code, fetch verified eKYC (name, DOB, gender, masked Aadhaar, address), and store **only** the reference + `aadhaar_last4` + verified name/DOB/address.
- Auto name-match against Basic Details → sets a flag if mismatch.

### Screen 3 — Video KYC ⭐ (mandatory) (`/verify/{token}/video`)
Person to verify depends on entity type:

| Entity | Person |
|--------|--------|
| Private Limited | Director / authorised signatory |
| LLP | Designated partner / authorised signatory |
| Partnership | Partner / authorised signatory |
| Proprietorship | Proprietor |

- Pre-checks: original ID, lighting, camera+mic, stable internet.
- `[ Start Video KYC ]` → provider adapter (`VideoKYCProvider`). Flow: **face → ID → liveness → verification → recording/audit trail**.
- Self-serve liveness capture now; adapter seam for a VCIP vendor later.

### Screen 4 — Documents (`/verify/{token}/documents`)
Entity-aware checklist:
- Certificate of Incorporation, PAN, GST Certificate (if applicable)
- Partnership Deed / LLP Agreement (if applicable)
- Authorisation Letter, Director/Partner KYC docs, others
- `[ Upload Documents ]` (signed-URL upload to a private bucket) **OR** "Already emailed?" path — ops can mark docs received from the existing email process. Both paths update the same `documents`/step state.

### Screen 5 — Status (`/verify/{token}/status`)
```
✓ Basic Details
✓ Aadhaar Verification
✓ Video KYC
⏳ Documents Verification
○ Final Approval
```
> Your KYC has been submitted successfully. Our compliance team will review your information and documents.

Reduces "bhai mera KYC hua ya nahi?" calls. Client can revisit the link anytime to see live status.

---

## 4. Operations Dashboard (internal)

Route group `app/(ops)/dashboard/` — protected by Supabase Auth (staff accounts, role = `ops` / `admin`).

**Case list table:**

| Client | Order ID | Aadhaar | Video KYC | Documents | Status |
|--------|----------|---------|-----------|-----------|--------|
| ABC Pvt Ltd | EMO10231 | ✓ | ✓ | ✓ | Approved |
| XYZ LLP | EMO10232 | ✓ | ✓ | ⏳ | Pending |
| ABC Traders | EMO10233 | ✓ | ✕ | ✓ | Video Pending |

**Automated flags (🚨):**
- Video KYC failed / not completed
- Aadhaar verification failed
- Name mismatch (DigiLocker name vs Basic Details / company records)
- Documents missing
- Potential duplicate client (same Aadhaar-hash / PAN / mobile / email across cases)

**Case detail:** all steps, verified data, documents (signed URLs), audit timeline, and actions:
- `Approve` → status `approved`, sync to CRM, notify client
- `Reject` → status `rejected` (+ reason), notify client
- `Request Re-KYC` → re-opens specific steps, issues fresh token, notifies client

---

## 5. Provider adapters (why the product is vendor-agnostic)

`lib/providers/` defines interfaces so the whole product is built now and the vendor is a config swap later.

```ts
// lib/providers/types.ts
export interface AadhaarProvider {
  createAuthUrl(caseId: string, redirectUri: string): Promise<{ url: string; ref: string }>;
  handleCallback(params: Record<string,string>): Promise<AadhaarKycResult>;
}
export interface VideoKYCProvider {
  createSession(caseId: string, subject: VerificationSubject): Promise<{ url: string; ref: string }>;
  getResult(ref: string): Promise<VideoKycResult>;
}
export interface PANProvider {
  verify(pan: string, name: string): Promise<PanResult>;
}
export interface NotificationProvider {
  sendEmail(to: string, template: string, data: object): Promise<void>;
  sendWhatsApp(to: string, template: string, data: object): Promise<void>;
}
```

- **DigiLocker adapter** implements `AadhaarProvider` (OAuth authorize → callback → eKYC pull). Ships as a `mock` for local dev + a `digilocker` implementation stub with `TODO: plug in vendor` where partner credentials go.
- Selection via env: `AADHAAR_PROVIDER=mock|digilocker`, `VIDEO_KYC_PROVIDER=mock|<vendor>`.

---

## 6. API surface (Next.js route handlers)

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| POST | `/api/cases` | CRM creates a KYC case, returns token | service key / CRM secret |
| GET | `/api/cases/:token` | Fetch case + step state for client flow | token |
| POST | `/api/cases/:token/basic` | Save basic details, trigger mobile OTP | token |
| POST | `/api/cases/:token/otp/verify` | Verify mobile OTP | token |
| POST | `/api/cases/:token/aadhaar/init` | Start DigiLocker OAuth | token |
| GET/POST | `/api/cases/:token/aadhaar/callback` | DigiLocker callback → store eKYC | token |
| POST | `/api/cases/:token/video/init` | Start Video KYC session | token |
| POST | `/api/cases/:token/video/webhook` | Provider posts liveness/verification result | provider signature |
| POST | `/api/cases/:token/documents/sign` | Get signed upload URL | token |
| POST | `/api/cases/:token/documents/confirm` | Record uploaded doc | token |
| POST | `/api/cases/:token/submit` | Finalise submission | token |
| GET | `/api/ops/cases` | Ops list w/ filters & flags | staff auth |
| POST | `/api/ops/cases/:id/decision` | Approve / Reject / Re-KYC | staff auth |

Every token-scoped handler re-loads the case server-side and rejects if token is expired/submitted/revoked.

---

## 7. Audit trail

Every meaningful event writes to `audit_log`: who/what (client via token, or staff user), action, step, before/after status, provider reference IDs, IP, user-agent, timestamp, and a `consent` snapshot where relevant. This is your evidence in a dispute or a "suspicious customer" review.

---

## 8. Security notes

- Public client flow is **token-capability** based; every write re-validates the token server-side.
- Ops dashboard behind Supabase Auth + role check + RLS.
- All documents/video in **private** buckets; access only via short-lived signed URLs.
- No raw Aadhaar at rest. Duplicate detection uses a salted **hash** of Aadhaar, never the number.
- Provider webhooks verified by signature.
- Rate-limiting on OTP + token endpoints.

---

## 9. Build status (real vs stubbed)

| Area | Status |
|------|--------|
| Docs, schema, RLS, API contract | ✅ Designed |
| Next.js scaffold, Supabase clients, validation | ✅ Scaffolded |
| Client flow screens (landing → status) | 🟡 Scaffolded UI + wiring |
| Ops dashboard | 🟡 Scaffolded UI + wiring |
| DigiLocker adapter | 🟡 Interface + mock; `TODO` for partner creds |
| Video KYC adapter | 🟡 Interface + mock; `TODO` for vendor |
| Notifications (email/WhatsApp) | 🟡 Adapter + mock |
