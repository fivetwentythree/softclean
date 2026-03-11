-- Create attachments storage bucket and policies

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload attachments
create policy "Authenticated can upload attachments"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'attachments');

-- Allow authenticated users to read attachments
create policy "Authenticated can read attachments"
  on storage.objects for select to authenticated
  using (bucket_id = 'attachments');
