-- 18: per-user daily rate limits on votes and comments (mirrors the 3/day
-- complaint rule in complaints_left_today, counted against the Asia/Kolkata day).

create or replace function public.daily_votes_left(uid uuid default auth.uid())
returns int language sql stable security definer set search_path = public as $$
  select greatest(
    coalesce((select (value->>'daily_vote_limit')::int from public.settings where key = 'general'), 100)
    - (select count(*) from public.complaint_upvotes v
       where v.user_id = uid
         and (v.created_at at time zone 'Asia/Kolkata')::date = (now() at time zone 'Asia/Kolkata')::date),
    0
  );
$$;

create or replace function public.daily_comments_left(uid uuid default auth.uid())
returns int language sql stable security definer set search_path = public as $$
  select greatest(
    coalesce((select (value->>'daily_comment_limit')::int from public.settings where key = 'general'), 50)
    - (select count(*) from public.complaint_comments cm
       where cm.user_id = uid
         and (cm.created_at at time zone 'Asia/Kolkata')::date = (now() at time zone 'Asia/Kolkata')::date),
    0
  );
$$;

update public.settings
set value = value || '{"daily_vote_limit": 100, "daily_comment_limit": 50}'::jsonb
where key = 'general';

drop policy if exists "insert upvote" on public.complaint_upvotes;
create policy "insert upvote" on public.complaint_upvotes for insert to authenticated
  with check (
    auth.uid() = user_id
    and user_id <> public.complaint_owner(complaint_id)
    and not (select is_banned from public.profiles where id = auth.uid())
    and public.daily_votes_left() > 0
  );

drop policy if exists "insert comment" on public.complaint_comments;
create policy "insert comment" on public.complaint_comments for insert to authenticated
  with check (
    auth.uid() = user_id
    and not (select is_banned from public.profiles where id = auth.uid())
    and public.daily_comments_left() > 0
  );