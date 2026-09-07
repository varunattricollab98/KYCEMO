-- EaseMyOffice KYC Portal — private storage buckets
--
-- Both buckets are PRIVATE with NO storage policies. All access happens
-- server-side via signed URLs created with the service role:
--   * uploads  — short-lived signed upload URLs (client PUTs the file)
--   * delivery — signed download URLs emailed to the documentation team

insert into storage.buckets (id, name, public)
values ('kyc-documents', 'kyc-documents', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('kyc-video', 'kyc-video', false)
on conflict (id) do nothing;
