-- Replace computed-column author functions with real stored columns.
-- PostgREST cannot evaluate computed columns on tables with column-level
-- SELECT grants (it needs full-row access), so list pages 42501'd under the
-- user token. Stored columns + insert triggers give the same result while
-- keeping user_id unselectable.
--
-- 1. Drop the computed functions.
drop function if exists public.complaint_author(public.complaints);
drop function if exists public.complaint_author_roll(public.complaints);
drop function if exists public.comment_author(public.complaint_comments);
drop function if exists public.praise_author(public.praises);

-- 2. Real columns.
alter table public.complaints
  add column complaint_author text,
  add column complaint_author_roll text;
alter table public.complaint_comments
  add column comment_author text;
alter table public.praises
  add column praise_author text;

-- 3. Populate at insert (snapshot of profile at authoring time).
create or replace function public.fill_complaint_author()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_anonymous then
    new.complaint_author := null;
    new.complaint_author_roll := null;
  else
    select full_name, roll_no into new.complaint_author, new.complaint_author_roll
      from public.profiles where id = new.user_id;
  end if;
  return new;
end $$;

create or replace function public.fill_comment_author()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select full_name into new.comment_author from public.profiles where id = new.user_id;
  return new;
end $$;

create or replace function public.fill_praise_author()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_anonymous then
    new.praise_author := null;
  else
    select full_name into new.praise_author from public.profiles where id = new.user_id;
  end if;
  return new;
end $$;

create trigger trg_complaints_author before insert on public.complaints
  for each row execute function public.fill_complaint_author();
create trigger trg_complaint_comments_author before insert on public.complaint_comments
  for each row execute function public.fill_comment_author();
create trigger trg_praises_author before insert on public.praises
  for each row execute function public.fill_praise_author();

-- 4. Backfill existing rows.
update public.complaints c
  set complaint_author = p.full_name, complaint_author_roll = p.roll_no
  from public.profiles p where p.id = c.user_id and not c.is_anonymous;
update public.complaint_comments cc
  set comment_author = p.full_name
  from public.profiles p where p.id = cc.user_id;
update public.praises pr
  set praise_author = p.full_name
  from public.profiles p where p.id = pr.user_id and not pr.is_anonymous;

-- 5. Extend column grants (user_id stays unselectable).
grant select (id, category_id, mess_id, title, description, is_anonymous, status,
  resolution_note, photo_urls, upvote_count, is_pinned, created_at, updated_at,
  complaint_author, complaint_author_roll)
  on public.complaints to authenticated;
grant select (id, complaint_id, body, is_deleted, created_at, comment_author)
  on public.complaint_comments to authenticated;
grant select (id, mess_id, text, is_anonymous, created_at, praise_author)
  on public.praises to authenticated;