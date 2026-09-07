# EaseMyOffice KYC Verification Portal

> `kyc.easemyoffice.in` — a simple, self-serve client KYC portal for EaseMyOffice (virtual office, coworking, company registration & GST services).

The link is shared with a client after draft confirmation. They complete KYC in **3 quick steps**, and the EaseMyOffice team reviews it from an internal dashboard.

## The flow (3 steps)

1. **Identify** — Email + Contact number + Booking ID
2. **Upload documents** — Aadhaar card (front + back) + PAN card (camera or file)
3. **Video KYC** — record a short in-browser video reading an on-screen script, showing the Aadhaar & PAN cards to the camera

On submit, everything is saved to **private Supabase storage** and the team is emailed. Staff review the documents + video and **Approve / Reject / Request Re-KYC**.

---

## What this repo contains

| Path | Purpose |
|-----|---------|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Flow, screens, API, storage, notifications, audit trail |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Supabase schema, RLS, storage buckets |
| [`supabase/migrations/`](supabase/migrations/) | SQL migrations (schema + RLS + storage) |
| `app/kyc/` | The 3-step client flow |
| `app/(ops)/dashboard/` | Internal review dashboard |
| `app/api/` | Route handlers (start, upload, confirm, submit, ops decision) |
| `lib/` | Supabase clients, validation, notification provider (Resend) |

## Stack

- **Frontend + API:** Next.js (App Router, TypeScript, Tailwind)
- **Backend / DB / Storage / Auth:** Supabase (Postgres + RLS + Storage)
- **Email:** Resend
- **Hosting:** Vercel (`kyc.easemyoffice.in`)

## Compliance & data handling

- Aadhaar/PAN images and the KYC video are stored in **private** Supabase buckets, accessed only via short-lived signed URLs.
- This is EaseMyOffice's own client onboarding / due-diligence KYC (document + self-recorded video) — not bank-grade VCIP.
- Before go-live, confirm consent text and data-retention with a compliance advisor.

## Getting started (developer)

```bash
npm install
cp .env.example .env.local   # fill in Supabase + Resend keys
npm run dev
```

Apply the migrations in `supabase/migrations/` to your Supabase project and create the two private storage buckets (`kyc-documents`, `kyc-video`) — see `docs/DATABASE.md`.

## Status

🟡 **Working scaffold.** Verified: `tsc` clean + `next build` passes. Needs a live Supabase project + Resend key + storage buckets to run end-to-end.
