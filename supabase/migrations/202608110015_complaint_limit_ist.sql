-- Daily complaint limit was counted against UTC midnight (resets 5:30 AM IST).
-- Count against the Asia/Kolkata day, matching every other date in the app.

create or replace function public.complaints_left_today(uid uuid default auth.uid())
returns int language sql stable security definer set search_path = public
as $$
  select greatest(
    coalesce((select (value->>'daily_complaint_limit')::int from public.settings where key = 'general'), 3)
    - (select count(*) from public.complaints c
       where c.user_id = uid
         and (c.created_at at time zone 'Asia/Kolkata')::date = (now() at time zone 'Asia/Kolkata')::date),
    0
  );
$$;
