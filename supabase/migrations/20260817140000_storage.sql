-- Supabase Storage (private) + deposits compatibility view + VERIFIED status.

alter type public.deposit_status add value if not exists 'VERIFIED';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'application-documents',
  'application-documents',
  false,
  20971520,
  array['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']::text[]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "documents_select_own_or_admin" on storage.objects;
drop policy if exists "documents_insert_own" on storage.objects;
drop policy if exists "documents_update_own" on storage.objects;
drop policy if exists "documents_delete_own_or_admin" on storage.objects;

create policy "documents_select_own_or_admin"
on storage.objects for select to authenticated
using (
  bucket_id = 'application-documents'
  and (
    public.is_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);

create policy "documents_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'application-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
  and not public.is_admin()
);

create policy "documents_insert_admin"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'application-documents'
  and public.is_admin()
);

create policy "documents_update_own"
on storage.objects for update to authenticated
using (
  bucket_id = 'application-documents'
  and (
    public.is_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
  )
)
with check (
  bucket_id = 'application-documents'
  and (
    public.is_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);

create policy "documents_delete_own_or_admin"
on storage.objects for delete to authenticated
using (
  bucket_id = 'application-documents'
  and (
    public.is_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);
