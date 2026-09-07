-- EaseMyOffice KYC Portal — remove the staff/dashboard model.
--
-- Run this ONLY if you already applied the earlier version of 0001–0003 that
-- created staff_users, staff RLS policies, and the storage staff policy.
-- Fresh installs using the current 0001–0003 don't need this.

-- Drop the storage policy that referenced is_active_staff().
drop policy if exists staff_read_documents on storage.objects;

-- Drop staff read/update policies from the case tables.
do $$
declare t text;
begin
  foreach t in array array[
    'kyc_cases','kyc_steps','documents','case_flags','audit_log'
  ] loop
    execute format('drop policy if exists staff_read on %1$I;', t);
    execute format('drop policy if exists staff_update on %1$I;', t);
  end loop;
end $$;

-- Drop staff_users policies + table + helper functions.
drop policy if exists staff_self_read on staff_users;
drop policy if exists staff_admin_write on staff_users;
drop table if exists staff_users;
drop function if exists is_active_staff();
drop function if exists is_admin();
