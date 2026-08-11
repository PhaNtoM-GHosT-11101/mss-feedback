-- Photo storage hardening:
-- 1. Bucket caps: 10 MB per file, images only.
-- 2. Per-user quota (50 MB default) enforced in the insert policy so direct
--    storage API calls (bypassing the app) are limited too.

update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array[
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'image/heic', 'image/heif', 'image/avif'
    ]
where id = 'complaint-photos';

create or replace function public.can_upload_photo(max_bytes bigint default 52428800)
returns boolean language sql stable security definer set search_path = public
as $$
  select coalesce((
    select sum((metadata->>'size')::bigint) < max_bytes
    from storage.objects
    where bucket_id = 'complaint-photos' and owner = auth.uid()
  ), true);
$$;

drop policy if exists "insert complaint photos" on storage.objects;
create policy "insert complaint photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'complaint-photos' and public.can_upload_photo());
