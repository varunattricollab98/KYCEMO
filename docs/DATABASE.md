# Database — Supabase (Postgres)

Schema for the EaseMyOffice KYC portal. Full SQL lives in [`../supabase/migrations/`](../supabase/migrations/).

## Design principles

- **One case per booking.** `kyc_cases` is the aggregate root.
- **Data minimisation.** No raw Aadhaar. Only masked (`aadhaar_last4`), a salted `aadhaar_hash` for duplicate detection, and verified fields returned by DigiLocker.
- **Everything auditable.** `audit_log` records every state change.
- **Step state is explicit.** `kyc_steps` tracks each step's status so the client status screen and ops dashboard read the same source of truth.
- **RLS everywhere.** Public client access is scoped by token (via `SECURITY DEFINER` RPCs / service role in route handlers); staff access is scoped by authenticated role.

## Tables

### `kyc_cases`
The root record, created from a booking.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `token` | text unique | opaque high-entropy token used in the public URL |
| `token_expires_at` | timestamptz | |
| `token_status` | text | `active \| submitted \| expired \| revoked` |
| `order_id` | text | `EMO-XXXXXX` from CRM |
| `client_name` | text | prefilled from booking |
| `mobile` | text | |
| `mobile_verified` | bool | |
| `email` | text | |
| `company_name` | text | |
| `entity_type` | text | `private_limited \| llp \| partnership \| proprietorship` |
| `vo_location` | text | virtual office location |
| `plan` | text | |
| `status` | text | overall: `created \| in_progress \| submitted \| under_review \| approved \| rejected \| re_kyc` |
| `crm_synced_at` | timestamptz | |
| `created_at` / `updated_at` | timestamptz | |

### `kyc_steps`
One row per step per case.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `case_id` | uuid FK → kyc_cases | |
| `step` | text | `basic \| aadhaar \| video \| documents \| approval` |
| `status` | text | `pending \| in_progress \| completed \| failed \| skipped` |
| `data` | jsonb | step-specific non-sensitive metadata |
| `updated_at` | timestamptz | |
| unique | (`case_id`,`step`) | |

### `identity_verifications`
Aadhaar (DigiLocker) + PAN results. **No raw Aadhaar.**

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `case_id` | uuid FK | |
| `kind` | text | `aadhaar_digilocker \| pan` |
| `provider` | text | `mock \| digilocker \| ...` |
| `provider_ref` | text | vendor reference id |
| `verified_name` | text | from govt source |
| `verified_dob` | date | |
| `verified_address` | jsonb | |
| `aadhaar_last4` | text | masked only |
| `aadhaar_hash` | text | salted hash — duplicate detection only |
| `pan` | text | PAN can be stored (not as sensitive as Aadhaar) |
| `result` | text | `success \| failed \| pending` |
| `raw_meta` | jsonb | non-sensitive provider metadata |
| `created_at` | timestamptz | |

### `video_kyc_sessions`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `case_id` | uuid FK | |
| `provider` | text | |
| `provider_ref` | text | |
| `subject_role` | text | director / partner / proprietor / signatory |
| `recording_path` | text | private bucket path |
| `liveness_score` | numeric | |
| `face_match_score` | numeric | |
| `result` | text | `success \| failed \| pending` |
| `created_at` | timestamptz | |

### `documents`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `case_id` | uuid FK | |
| `doc_type` | text | `coi \| pan \| gst \| deed \| llp_agreement \| authorisation \| director_kyc \| other` |
| `source` | text | `upload \| email` |
| `storage_path` | text | private bucket path (null if email) |
| `original_name` | text | |
| `status` | text | `received \| verified \| rejected` |
| `uploaded_at` | timestamptz | |

### `case_flags`
Automated + manual flags for the ops dashboard.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `case_id` | uuid FK | |
| `flag` | text | `video_failed \| video_incomplete \| aadhaar_failed \| name_mismatch \| documents_missing \| potential_duplicate` |
| `severity` | text | `info \| warning \| critical` |
| `detail` | jsonb | |
| `resolved` | bool | |
| `created_at` | timestamptz | |

### `audit_log`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `case_id` | uuid FK (nullable) | |
| `actor_type` | text | `client_token \| staff \| system \| provider` |
| `actor_id` | text | staff user id / token id / provider name |
| `action` | text | e.g. `basic.saved`, `aadhaar.verified`, `decision.approved` |
| `step` | text | nullable |
| `before` / `after` | jsonb | status snapshots |
| `provider_ref` | text | |
| `ip` / `user_agent` | text | |
| `consent` | jsonb | consent snapshot where relevant |
| `created_at` | timestamptz | |

### `staff_users`
Maps a Supabase auth user to an ops role.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK = auth.uid() | |
| `email` | text | |
| `role` | text | `ops \| admin` |
| `active` | bool | |

## Relationships

```
kyc_cases 1───* kyc_steps
kyc_cases 1───* identity_verifications
kyc_cases 1───* video_kyc_sessions
kyc_cases 1───* documents
kyc_cases 1───* case_flags
kyc_cases 1───* audit_log
auth.users 1──1 staff_users
```

## Storage buckets (all private)

| Bucket | Contents |
|--------|----------|
| `kyc-documents` | uploaded client documents |
| `kyc-video` | video KYC recordings |

Access only via short-lived signed URLs generated server-side.

## RLS strategy

- **Client (anonymous) access:** no direct table access from the browser. All client reads/writes go through Next.js route handlers using the **service role**, after the handler validates the token. This keeps token logic server-side and avoids leaking rows.
- **Staff access:** ops dashboard queries run as the authenticated staff user. RLS on all tables: `USING (exists (select 1 from staff_users s where s.id = auth.uid() and s.active))`. Decisions/writes restricted to `role in ('ops','admin')`.
- **Storage:** buckets private; no public policy. Signed URLs only.

See `supabase/migrations/0002_rls.sql` for exact policies.
