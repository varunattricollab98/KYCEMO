# Database — Supabase (Postgres)

Schema for the simplified KYC portal. Full SQL in [`../supabase/migrations/`](../supabase/migrations/).

## Principles

- **One case per booking.** `kyc_cases` is the root, keyed to a Booking ID (`order_id`).
- **Step state is explicit** in `kyc_steps` so the client screens and the ops dashboard read the same source of truth.
- **Files, not numbers.** We store the Aadhaar/PAN **images** and the **video** in private storage; we don't capture raw Aadhaar/PAN numbers digitally (they're stated in the video).
- **Everything auditable** via `audit_log`.
- **RLS everywhere.** The public client flow uses the service role via server route handlers (after token validation); staff access is gated by an active `staff_users` row.

## Tables

### `kyc_cases`
Root record. Booking fields (name/company/entity/location/plan) are optional — a case may be created lightweight in Step 1 or pre-created by the CRM with full data.

Key columns: `token`, `token_expires_at`, `token_status`, `order_id` (Booking ID), `email`, `mobile`, `company_name`, `status` (`created | in_progress | submitted | under_review | approved | rejected | re_kyc`).

### `kyc_steps`
One row per step per case. `step ∈ (identify, documents, video, review)`, `status ∈ (pending, in_progress, completed, failed, skipped)`. Seeded automatically by a trigger on case insert.

### `documents`
The uploads. `doc_type ∈ (aadhaar_front, aadhaar_back, pan, kyc_video)`, `storage_path` (private bucket path), `status ∈ (received, verified, rejected)`.

### `case_flags`
Automated review flags: `documents_missing`, `video_missing`, `potential_duplicate`.

### `audit_log`
Actor (client token / staff / system), action, step, IP, user-agent, timestamps.

### `staff_users`
Maps a Supabase auth user → ops role (`ops | admin`), with an `active` flag.

## Relationships

```
kyc_cases 1───* kyc_steps
kyc_cases 1───* documents
kyc_cases 1───* case_flags
kyc_cases 1───* audit_log
auth.users 1──1 staff_users
```

## Storage buckets (private)

| Bucket | Contents |
|--------|----------|
| `kyc-documents` | Aadhaar front/back, PAN images |
| `kyc-video` | Recorded video KYC |

No public policies — access only via short-lived signed URLs generated server-side. See `0003_storage.sql`.

## RLS

- **Client (public):** no direct table access from the browser. Route handlers use the service role after validating the token.
- **Staff:** `select` on all case tables when `is_active_staff()`; `update` on `kyc_cases`, `kyc_steps`, `documents`, `case_flags`. See `0002_rls.sql`.
