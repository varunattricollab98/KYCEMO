# EaseMyOffice KYC Portal — Project Context (read me first)

> This steering file is the memory of how this repo was built and how it works,
> so any new session has full context. Keep it updated when things change.

## What this is

A **self-serve KYC verification portal** for EaseMyOffice (virtual office,
coworking, company registration & GST services in India).
**Live at:** https://kyc.easemyoffice.in (custom domain on Vercel).
Business site: https://www.easemyoffice.in

It is **email-delivery, no dashboard**: the client completes KYC, and everything
is emailed to the documentation team (`team@easemyoffice.in`) with secure
download links. There is intentionally **no ops dashboard, no staff login**.

## The client flow (3 steps)

Route base: `/kyc`
1. **Identify** (`/kyc`) — Full Name, Email, Contact number, Booking ID,
   Virtual Office Location. Creates/matches a case by Booking ID, issues a token.
2. **Documents** (`/kyc/[token]/documents`) — LIVE camera capture only (in-page
   getUserMedia, no gallery/file picker) of Aadhaar front, Aadhaar back, PAN.
3. **Video KYC** (`/kyc/[token]/video`) — in-browser recording reading an
   on-screen script; **mandatory GPS location** captured first (no location →
   no camera → no submit). Then `/kyc/[token]/done`.

The video script + entity/doc constants live in `lib/types.ts`
(`VIDEO_KYC_SCRIPT`, `REQUIRED_UPLOADS`, `DOC_LABELS`).

## Tech stack

- **Next.js 14.2.15** (App Router, TypeScript, Tailwind). Keep this exact Next
  version — `after()`/`unstable_after` are NOT available in 14.2.x, don't import them.
- **Supabase** — Postgres + private Storage. Project ref: `eyrfusqjbagtcnpuotrg`
  (URL `https://eyrfusqjbagtcnpuotrg.supabase.co`). Uses NEW API keys
  (`sb_publishable_...` = anon, `sb_secret_...` = service role).
- **Resend** — email. Domain `easemyoffice.in` is verified. From:
  `EaseMyOffice KYC <kyc@easemyoffice.in>`. To: `team@easemyoffice.in`.
- **Vercel** — hosting (project `kycemo`), auto-deploys on push to `main`.

## Architecture notes

- **Token-capability model**: no client login. `POST /api/kyc/start` returns an
  opaque token; every `/api/kyc/[token]/*` handler re-validates it via
  `loadUsableCase` (lib/cases.ts) using the service role.
- **No direct client DB access.** RLS is ON with NO anon/authenticated policies
  (deny-all); all reads/writes go through server route handlers using the
  service role (`lib/supabase/admin.ts`).
- **Files** in private buckets `kyc-documents` (Aadhaar/PAN) and `kyc-video`
  (video). Delivered to the team only via short-lived **signed URLs** (7-day).
- **No raw Aadhaar/PAN numbers stored** — they're only spoken in the video.
- **Notifications** behind an adapter: `lib/providers/` → `getNotificationProvider()`
  picks `resend` (via `NOTIFICATION_PROVIDER` env) else a mock. Templates in
  `lib/email/templates.ts` (`kyc_invite`, `kyc_submitted`, `ops_kyc_package`).
- **Team email**: subject is `KYC — <BookingID> · <Location>`; body has Name,
  Booking ID, Virtual Office, contact, 📍 location (Google Maps link), and secure
  download links for all 3 docs + video.

## API routes

- `POST /api/kyc/start` — identify → create/match case, issue token
- `POST /api/kyc/[token]/upload` — signed upload URL (routes video→kyc-video, else kyc-documents)
- `POST /api/kyc/[token]/confirm` — record an uploaded file (upsert)
- `POST /api/kyc/[token]/geo` — store GPS lat/lng/accuracy on the case
- `POST /api/kyc/[token]/submit` — finalise: parallel DB writes + signed links + parallel Resend emails
- `POST /api/cases` — optional CRM webhook (x-crm-secret) to pre-create a case + email the client the link
- `GET  /api/cron/retention` — data-retention purge (Vercel Cron, auth via CRON_SECRET)

## Database (Supabase)

Migrations in `supabase/migrations/`:
- `0001_schema.sql` — kyc_cases, kyc_steps, documents, case_flags, audit_log; enums; triggers (seed steps, updated_at)
- `0002_rls.sql` — RLS on, no policies (service-role only)
- `0003_storage.sql` — private buckets kyc-documents, kyc-video
- `0004_drop_staff.sql` — removed the old staff/dashboard model
- `0005_geolocation.sql` — geo_lat, geo_lng, geo_accuracy, geo_captured_at on kyc_cases

`step_key` enum = identify | documents | video | review.
`documents.doc_type` = aadhaar_front | aadhaar_back | pan | kyc_video.

## Environment variables (set in Vercel)

- `NEXT_PUBLIC_SUPABASE_URL` = https://eyrfusqjbagtcnpuotrg.supabase.co  (Config)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = sb_publishable_...  (Config)
- `SUPABASE_SERVICE_ROLE_KEY` = sb_secret_...  (Secret)
- `NEXT_PUBLIC_APP_URL` = https://kyc.easemyoffice.in  (Config)
- `NOTIFICATION_PROVIDER` = resend  (Config)
- `RESEND_API_KEY` = re_...  (Secret)
- `NOTIFY_EMAIL_FROM` = EaseMyOffice KYC <kyc@easemyoffice.in>  (Config)
- `OPS_NOTIFY_EMAIL` = team@easemyoffice.in  (Config)
- `CRON_SECRET` = <random>  (Secret) — for the retention cron
- `RETENTION_DAYS` = optional, default 180  (Config)
- `CRM_WEBHOOK_SECRET` = optional  (Secret) — for /api/cases

Full reference: `docs/ENV_VARS.txt`. (There is NO `.env.example` — it was renamed
to avoid Vercel auto-importing vars as "Secret" type and blocking saves. In
Vercel, NEXT_PUBLIC_* must be type **Config**, keys must be **Secret**.)

## Design system (matches easemyoffice.in)

- Font **Inter** (next/font). Colors: navy `#0F1A2E`, brand blue `#11417C`/`#2C679E`,
  gold `#F59E0B`/`#FBBF24`, soft blue-white `#F0F6FC`. 12px radii, gradients + glow.
- Tokens in `tailwind.config.ts`; shared UI in `components/ui.tsx`
  (Card, Button, Field, Badge, `inputClass`), `components/Logo.tsx`,
  `components/PortalHeader.tsx`, `components/steps/StepNav.tsx`.
- Premium look: navy hero landing, brand-gradient buttons w/ glow, gold accents.

## Mobile compatibility (done)

- Viewport meta with `viewport-fit=cover` + themeColor in `app/layout.tsx`.
- Safe-area insets + `overflow-x hidden` in `globals.css`; inputs forced 16px on
  mobile (no iOS zoom); 44–48px tap targets; `100svh` instead of `100vh`.
- Camera/video hardened for iOS: `playsInline muted autoPlay`, facingMode
  fallback, granular getUserMedia errors, "open in Safari/Chrome" hint.
- Note: in-app browsers (Instagram/WhatsApp) may block camera — tell users to
  open in a real browser.

## Performance (done)

- Video: 720p @ 24fps, MediaRecorder capped 1.2 Mbps video / 64 kbps audio.
- Doc images: downscaled to 1600px, JPEG q0.75 (`components/steps/CameraCapture.tsx`).
- Submit route: independent DB writes + signed URLs run via `Promise.all`;
  both emails sent in parallel.

## Git / deploy workflow

- Work on `main`; push → Vercel auto-deploys. Always run `npx tsc --noEmit` and
  `next build` before pushing.
- When DB changes: add a numbered migration in `supabase/migrations/` AND tell
  the user the exact SQL to run in the Supabase SQL editor (their deployed DB is
  updated manually, not auto-migrated).

## Data retention

- `docs/DATA_RETENTION.md` documents the policy. `GET /api/cron/retention`
  (daily via `vercel.json`) deletes files + case rows older than `RETENTION_DAYS`
  (default 180). Confirm the real retention period with a CA/compliance advisor.

## Compliance posture

- This is EaseMyOffice's own client onboarding/due-diligence KYC (documents +
  self-recorded video + geo), NOT bank-grade VCIP / DigiLocker eKYC. Earlier
  DigiLocker plan was dropped in favour of this simpler compliant model.

## Pending / optional (not done yet)

- CRM integration: auto-create case + email KYC link on booking confirmation
  (endpoint `/api/cases` exists; not wired to the CRM).
- WhatsApp notifications (adapter has a no-op `sendWhatsApp`).
- Decide + set final `RETENTION_DAYS` with compliance advisor.
