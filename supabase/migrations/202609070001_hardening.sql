-- 17: security hardening
-- 1) Stop authenticated users UPDATE-ing profiles entirely. The app no longer
--    edits name/roll/etc. client-side (names come from Google; institution is
--    set by the auth callback via service role). The old column-level grant
--    included `is_banned`, so a banned user could flip their own ban.
revoke update on public.profiles from authenticated;

-- 2) A reply's parent_id must belong to the same complaint (blocks thread
--    poisoning where a client pastes another complaint's comment as a parent).
create or replace function public.check_comment_parent()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.parent_id is not null then
    if not exists (
      select 1 from public.complaint_comments p
      where p.id = new.parent_id
        and p.complaint_id = new.complaint_id
    ) then
      raise exception 'parent comment must belong to the same complaint';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_comment_parent_check on public.complaint_comments;
create trigger trg_comment_parent_check
  before insert on public.complaint_comments
  for each row execute function public.check_comment_parent();

-- 3) Deleting a complaint also deletes its public storage photos from the
--    bucket (currently RLS deletes leave orphaned objects whose public URLs
--    keep serving forever).
create or replace function public.cleanup_complaint_photos()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base text;
  fname text;
begin
  foreach base in array coalesce(old.photo_urls, '{}') loop
    begin
      fname := substring(regexp_replace(base, '\?.*$', '')
        from 'object/public/complaint-photos/(.*)$');
      if fname is not null and fname <> '' then
        delete from storage.objects
        where bucket_id = 'complaint-photos' and name = fname;
      end if;
    exception when others then
      null; -- never block the delete over storage cleanup
    end;
  end loop;
  return old;
end $$;

drop trigger if exists trg_cleanup_complaint_photos on public.complaints;
create trigger trg_cleanup_complaint_photos
  after delete on public.complaints
  for each row execute function public.cleanup_complaint_photos();

-- 4) Helper for the "Report" button: whether the current user already flagged
--    a complaint. Flags have no user_id SELECT grant, so read through RPC.
create or replace function public.my_flagged_complaint_ids(uid uuid default auth.uid())
returns table(complaint_id uuid)
language sql stable security definer set search_path = public as $$
  select f.complaint_id from public.complaint_flags f where f.user_id = uid;
$$;