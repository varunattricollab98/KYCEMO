-- EaseMyOffice KYC Portal — Row Level Security
--
-- Access model:
--  * Client (anonymous) NEVER touches these tables directly. All client
--    reads/writes go through Next.js route handlers using the service role,
--    which bypasses RLS but only after validating the public token. So we
--    deliberately grant NO anon/authenticated policies for the public flow.
--  * Staff (ops dashboard) query as their authenticated Supabase user. They
--    get access only if they are an active staff_user.

alter table kyc_cases enable row level security;
alter table kyc_steps enable row level security;
alter table identity_verifications enable row level security;
alter table video_kyc_sessions enable row level security;
alter table documents enable row level security;
alter table case_flags enable row level security;
alter table audit_log enable row level security;
alter table staff_users enable row level security;

-- Helper: is the current auth user an active staff member?
create or replace function is_active_staff() returns boolean as $$
  select exists (
    select 1 from staff_users s
    where s.id = auth.uid() and s.active = true
  );
$$ language sql security definer stable;

-- Helper: is the current auth user an admin?
create or replace function is_admin() returns boolean as $$
  select exists (
    select 1 from staff_users s
    where s.id = auth.uid() and s.active = true and s.role = 'admin'
  );
$$ language sql security definer stable;

-- ── Staff read access to all case data ────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'kyc_cases','kyc_steps','identity_verifications',
    'video_kyc_sessions','documents','case_flags','audit_log'
  ] loop
    execute format($f$
      drop policy if exists staff_read on %1$I;
      create policy staff_read on %1$I
        for select to authenticated
        using (is_active_staff());
    $f$, t);
  end loop;
end $$;

-- ── Staff write access (decisions, flag resolution, doc verification) ──
do $$
declare t text;
begin
  foreach t in array array[
    'kyc_cases','kyc_steps','documents','case_flags'
  ] loop
    execute format($f$
      drop policy if exists staff_update on %1$I;
      create policy staff_update on %1$I
        for update to authenticated
        using (is_active_staff())
        with check (is_active_staff());
    $f$, t);
  end loop;
end $$;

-- ── staff_users: a user can read their own row; admins manage all ──
drop policy if exists staff_self_read on staff_users;
create policy staff_self_read on staff_users
  for select to authenticated
  using (id = auth.uid() or is_admin());

drop policy if exists staff_admin_write on staff_users;
create policy staff_admin_write on staff_users
  for all to authenticated
  using (is_admin())
  with check (is_admin());

-- NOTE: no policies for anon/public — the client flow uses the service role
-- via server-side route handlers only.
