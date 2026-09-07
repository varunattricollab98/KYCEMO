-- EaseMyOffice KYC Portal — schema
-- Postgres / Supabase. Apply in order (0001 -> 0002 -> 0003).

create extension if not exists "pgcrypto";

-- ── Enums ─────────────────────────────────────────────────
do $$ begin
  create type entity_type as enum ('private_limited','llp','partnership','proprietorship');
exception when duplicate_object then null; end $$;

do $$ begin
  create type case_status as enum ('created','in_progress','submitted','under_review','approved','rejected','re_kyc');
exception when duplicate_object then null; end $$;

do $$ begin
  create type token_status as enum ('active','submitted','expired','revoked');
exception when duplicate_object then null; end $$;

do $$ begin
  create type step_key as enum ('basic','aadhaar','video','documents','approval');
exception when duplicate_object then null; end $$;

do $$ begin
  create type step_status as enum ('pending','in_progress','completed','failed','skipped');
exception when duplicate_object then null; end $$;

-- ── kyc_cases ─────────────────────────────────────────────
create table if not exists kyc_cases (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  token_expires_at timestamptz not null,
  token_status token_status not null default 'active',
  order_id text not null,
  client_name text not null,
  mobile text not null,
  mobile_verified boolean not null default false,
  email text not null,
  company_name text not null,
  entity_type entity_type not null,
  vo_location text not null,
  plan text not null,
  status case_status not null default 'created',
  crm_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_cases_order on kyc_cases(order_id);
create index if not exists idx_cases_status on kyc_cases(status);
create index if not exists idx_cases_mobile on kyc_cases(mobile);
create index if not exists idx_cases_email on kyc_cases(email);

-- ── kyc_steps ─────────────────────────────────────────────
create table if not exists kyc_steps (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references kyc_cases(id) on delete cascade,
  step step_key not null,
  status step_status not null default 'pending',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (case_id, step)
);
create index if not exists idx_steps_case on kyc_steps(case_id);

-- ── identity_verifications (NO raw Aadhaar) ───────────────
create table if not exists identity_verifications (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references kyc_cases(id) on delete cascade,
  kind text not null,                 -- aadhaar_digilocker | pan
  provider text not null,
  provider_ref text,
  verified_name text,
  verified_dob date,
  verified_address jsonb,
  aadhaar_last4 text,                 -- masked only
  aadhaar_hash text,                  -- salted hash, duplicate detection only
  pan text,
  result text not null default 'pending',  -- success | failed | pending
  raw_meta jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_idv_case on identity_verifications(case_id);
create index if not exists idx_idv_aadhaar_hash on identity_verifications(aadhaar_hash);
create index if not exists idx_idv_pan on identity_verifications(pan);

-- ── video_kyc_sessions ────────────────────────────────────
create table if not exists video_kyc_sessions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references kyc_cases(id) on delete cascade,
  provider text not null,
  provider_ref text,
  subject_role text,
  recording_path text,                -- private bucket path
  liveness_score numeric,
  face_match_score numeric,
  result text not null default 'pending',
  created_at timestamptz not null default now()
);
create index if not exists idx_vkyc_case on video_kyc_sessions(case_id);

-- ── documents ─────────────────────────────────────────────
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references kyc_cases(id) on delete cascade,
  doc_type text not null,
  source text not null default 'upload',   -- upload | email
  storage_path text,
  original_name text,
  status text not null default 'received', -- received | verified | rejected
  uploaded_at timestamptz not null default now()
);
create index if not exists idx_docs_case on documents(case_id);

-- ── case_flags ────────────────────────────────────────────
create table if not exists case_flags (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references kyc_cases(id) on delete cascade,
  flag text not null,
  severity text not null default 'warning', -- info | warning | critical
  detail jsonb,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_flags_case on case_flags(case_id);
create index if not exists idx_flags_unresolved on case_flags(case_id) where resolved = false;

-- ── audit_log ─────────────────────────────────────────────
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references kyc_cases(id) on delete set null,
  actor_type text not null,           -- client_token | staff | system | provider
  actor_id text,
  action text not null,
  step text,
  "before" jsonb,
  "after" jsonb,
  provider_ref text,
  ip text,
  user_agent text,
  consent jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_case on audit_log(case_id);
create index if not exists idx_audit_created on audit_log(created_at);

-- ── staff_users ───────────────────────────────────────────
create table if not exists staff_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'ops',   -- ops | admin
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── updated_at trigger ────────────────────────────────────
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_cases_updated on kyc_cases;
create trigger trg_cases_updated before update on kyc_cases
  for each row execute function set_updated_at();

-- ── seed steps when a case is created ─────────────────────
create or replace function seed_case_steps() returns trigger as $$
begin
  insert into kyc_steps(case_id, step, status) values
    (new.id, 'basic', 'pending'),
    (new.id, 'aadhaar', 'pending'),
    (new.id, 'video', 'pending'),
    (new.id, 'documents', 'pending'),
    (new.id, 'approval', 'pending')
  on conflict (case_id, step) do nothing;
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_seed_steps on kyc_cases;
create trigger trg_seed_steps after insert on kyc_cases
  for each row execute function seed_case_steps();
