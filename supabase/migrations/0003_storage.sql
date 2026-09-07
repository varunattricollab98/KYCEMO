-- EaseMyOffice KYC Portal — private storage buckets
--
-- Both buckets are PRIVATE. There are intentionally NO public storage policies.
-- All access happens server-side via short-lived signed URLs created with the
-- service role after token/staff validation.

insert into storage.buckets (id, name, public)
values ('kyc-documents', 'kyc-documents', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('kyc-video', 'kyc-video', false)
on conflict (id) do nothing;

-- Staff may read objects (e.g. to generate signed URLs from a server action
-- running as the staff user). Client uploads use service-role signed URLs and
-- do not rely on RLS.
drop policy if exists staff_read_documents on storage.objects;
create policy staff_read_documents on storage.objects
  for select to authenticated
  using (bucket_id in ('kyc-documents','kyc-video') and is_active_staff());
