-- EaseMyOffice KYC Portal — schema (simplified 3-step flow)
-- Postgres / Supabase. Apply in order (0001 -> 0002 -> 0003).
--
-- Flow: identify (email + contact + booking id) -> upload Aadhaar/PAN ->
-- record video KYC -> team review. Files live in private storage buckets.

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
  create type step_key as enum ('identify','documents','video','review');
exception when duplicate_object then null; end $$;

do $$ begin
  create type step_status as enum ('pending','in_progress','completed','failed','skipped');
exception when duplicate_object then null; end $$;

-- ── kyc_cases ─────────────────────────────────────────────
-- Booking details (name/company/entity/location/plan) are optional: a case may
-- be created lightweight from Step 1, or pre-created by the CRM with full data.
create table if not exists kyc_cases (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  token_expires_at timestamptz not null,
  token_status token_status not null default 'active',
  order_id text not null,                 -- Booking ID (EMO-XXXXXX)
  client_name text not null default '',
  mobile text not null default '',
  mobile_verified boolean not null default false,
  email text not null default '',
  company_name text not null default '',
  entity_type entity_type not null default 'proprietorship',
  vo_location text not null default '',
  plan text not null default '',
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

-- ── documents (Aadhaar front/back, PAN, and the KYC video) ─
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references kyc_cases(id) on delete cascade,
  doc_type text not null,                  -- aadhaar_front | aadhaar_back | pan | kyc_video
  source text not null default 'upload',
  storage_path text,                       -- path in the private bucket
  original_name text,
  status text not null default 'received', -- received | verified | rejected
  uploaded_at timestamptz not null default now()
);
create index if not exists idx_docs_case on documents(case_id);

-- ── case_flags ────────────────────────────────────────────
create table if not exists case_flags (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references kyc_cases(id) on delete cascade,
  flag text not null,                       -- documents_missing | video_missing | potential_duplicate
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
    (new.id, 'identify', 'pending'),
    (new.id, 'documents', 'pending'),
    (new.id, 'video', 'pending'),
    (new.id, 'review', 'pending')
  on conflict (case_id, step) do nothing;
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_seed_steps on kyc_cases;
create trigger trg_seed_steps after insert on kyc_cases
  for each row execute function seed_case_steps();
