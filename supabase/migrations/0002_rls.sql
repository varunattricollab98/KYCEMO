-- EaseMyOffice KYC Portal — Row Level Security
--
-- Access model (email-only delivery):
--  * There is NO staff dashboard and NO authenticated staff users. The client
--    flow runs entirely through Next.js route handlers using the service role,
--    which bypasses RLS but only after validating the public token.
--  * We therefore enable RLS on every table and grant NO anon/authenticated
--    policies. With RLS on and no policies, direct client/browser access is
--    denied by default — only the server-side service role can read/write.

alter table kyc_cases enable row level security;
alter table kyc_steps enable row level security;
alter table documents enable row level security;
alter table case_flags enable row level security;
alter table audit_log enable row level security;

-- No policies are defined on purpose. RLS-enabled + no-policy = deny all for
-- anon/authenticated roles. All access happens server-side via the service
-- role (SUPABASE_SERVICE_ROLE_KEY), which is not subject to RLS.
