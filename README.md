# EaseMyOffice KYC Verification Portal

> `kyc.easemyoffice.in` — a transaction-linked, multi-step client KYC verification product for EaseMyOffice (virtual office, coworking, company registration & GST services).

This is **not a form**. It is a mini-product: a secure verification workflow that a client completes after booking, plus an internal operations dashboard for the EaseMyOffice compliance team to review, approve, reject, or request re-KYC.

---

## What this repo contains

| Doc | Purpose |
|-----|---------|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System architecture, screen-by-screen flow, API design, provider adapters, audit trail |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Supabase schema, tables, relationships, RLS strategy, storage buckets |
| [`supabase/migrations/`](supabase/migrations/) | SQL migrations (schema + RLS + storage) |
| `app/` | Next.js App Router — client KYC flow + ops dashboard |
| `lib/` | Supabase clients, verification provider adapters, validation |

## Stack

- **Frontend + API:** Next.js (App Router, TypeScript, Tailwind)
- **Backend / DB / Storage / Auth:** Supabase (Postgres + RLS + Storage)
- **Hosting:** Vercel (`kyc.easemyoffice.in`)
- **Identity (Aadhaar + PAN):** DigiLocker (via provider-agnostic adapter — direct Meri Pehchaan Partner API or an aggregator like Setu / Cashfree / Digitap)
- **Video KYC:** provider-agnostic adapter (self-serve liveness capture now; pluggable VCIP vendor later)
- **Notifications:** Email + WhatsApp (adapter)

## Compliance posture (important)

EaseMyOffice performs KYC for **its own client onboarding & due diligence** — NOT bank-grade VCIP. The stack is intentionally conservative:

- ✅ **DigiLocker** consented Aadhaar + PAN eKYC (no UIDAI AUA/KUA license required; consent is built into the DigiLocker journey)
- ✅ **PAN** verification
- ✅ **Self-serve video + liveness** capture with an audit trail (recording, timestamps, consent, provider reference IDs)
- ❌ No raw Aadhaar storage — store only the DigiLocker/provider reference + masked Aadhaar (last 4)
- ❌ No unregulated "official VCIP" claims

> ⚠️ Before go-live, confirm the exact Aadhaar/DigiLocker route, consent text, and data-retention policy with a CA / compliance advisor. The verification code is behind adapter interfaces so the legally-approved provider can be plugged in without a rewrite.

## Data minimisation

- Aadhaar number is **never** stored in full. Only `aadhaar_last4` + the provider's reference ID.
- Verified name / DOB / address come **from DigiLocker** (government source of truth), not client free-text — this is what powers automatic name-mismatch flags.
- All PII documents live in **private** Supabase storage buckets, accessed only via short-lived signed URLs.

## Getting started (developer)

```bash
npm install
cp .env.example .env.local   # fill in Supabase + provider keys
npm run dev
```

Then apply the database migrations to your Supabase project (see `docs/DATABASE.md`).

## Status

🟡 **Blueprint + scaffold.** Verification providers are behind adapters with mock implementations and clearly-marked `TODO: plug in vendor` seams. See `docs/ARCHITECTURE.md` → "Build status" for what's real vs. stubbed.
