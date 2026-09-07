# Data Retention Policy — EaseMyOffice KYC

This portal collects sensitive personal data (Aadhaar & PAN images, a
verification video, GPS location, and contact details) for the purpose of
client onboarding and compliance for virtual-office services.

## What we store

| Data | Location |
|------|----------|
| Aadhaar (front/back) & PAN images | Private Supabase bucket `kyc-documents` |
| Video KYC recording | Private Supabase bucket `kyc-video` |
| Name, email, contact, Booking ID, VO location, GPS coordinates | `kyc_cases` table |
| Audit events | `audit_log` table |

All files are private and only ever shared with the documentation team via
short-lived signed download links (7-day expiry) — never publicly accessible.

## Retention window

- KYC records and their files are retained for **180 days** from creation
  (configurable via the `RETENTION_DAYS` environment variable).
- After the window, a scheduled job **permanently deletes** the storage files
  (documents + video) and the associated database rows (case, steps, documents,
  flags, geo). A minimal audit entry (`case.purged`) is kept for accountability;
  it contains no personal identity data or files.

> Choose the retention window to match your legal/CA guidance. Some businesses
> keep KYC records longer for statutory reasons — set `RETENTION_DAYS`
> accordingly (e.g. `1825` for 5 years). Confirm the right period with your
> compliance advisor.

## How purging runs

- A **Vercel Cron** (see `vercel.json`) calls `GET /api/cron/retention` daily at
  02:00 UTC.
- The endpoint is authorised with the `CRON_SECRET` environment variable
  (Vercel Cron sends it as a Bearer token automatically).
- It finds cases older than the window, removes their files from both private
  buckets, deletes the case row (cascades to related rows), and logs a
  `case.purged` audit event.

## Required configuration

Add in Vercel → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `CRON_SECRET` | a long random string (Vercel also auto-provides this for Cron) |
| `RETENTION_DAYS` | optional; defaults to `180` |

## Manual purge / testing

You can trigger the cleanup manually (e.g. to verify it works):

```
GET https://kyc.easemyoffice.in/api/cron/retention?secret=<CRON_SECRET>
```

Returns `{ ok, purged, retention_days, cutoff }`.

## Data minimisation & access

- No raw Aadhaar/PAN **numbers** are captured digitally — they are only spoken
  in the video, not stored as text fields.
- There is no dashboard and no standing staff logins; data is delivered to the
  team by email and otherwise reachable only server-side via the service role.
- Access to files is always time-limited (signed URLs).
