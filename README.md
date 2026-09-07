# EaseMyOffice KYC Verification Portal

> `kyc.easemyoffice.in` — a simple, self-serve client KYC portal for EaseMyOffice (virtual office, coworking, company registration & GST services).

The link is shared with a client after draft confirmation. They complete KYC in **3 quick steps**, then everything is emailed to the documentation team.

## The flow (3 steps)

1. **Identify** — Email + Contact number + Booking ID
2. **Upload documents** — Aadhaar card (front + back) + PAN card (camera or file)
3. **Video KYC** — record a short in-browser video reading an on-screen script, showing the Aadhaar & PAN cards to the camera

On submit, all files are saved to **private Supabase storage** and an email is sent to **`team@easemyoffice.in`** with the client's details plus **secure download links** for each document and the video. There is no dashboard — the team works entirely from their inbox.

---

## What this repo contains

| Path | Purpose |
|-----|---------|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Flow, screens, API, storage, notifications, audit trail |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Supabase schema, RLS, storage buckets |
| [`supabase/migrations/`](supabase/migrations/) | SQL migrations (schema + RLS + storage) |
| `app/kyc/` | The 3-step client flow |
| `app/api/` | Route handlers (start, upload, confirm, submit) |
| `lib/` | Supabase clients, validation, notification provider (Resend) |

## Stack

- **Frontend + API:** Next.js (App Router, TypeScript, Tailwind)
- **Storage / DB:** Supabase (Postgres + private Storage)
- **Email:** Resend (delivers the KYC package to the team)
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
