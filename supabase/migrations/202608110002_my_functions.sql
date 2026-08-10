-- Privacy helpers: students can query their OWN data via security-definer functions
-- (user_id stays hidden from the public; these return only the caller's rows)

create or replace function public.my_ratings()
returns table (
  id uuid, meal_id uuid, stars int, comment text,
  rating_date date, created_at timestamptz
)
language sql stable security definer set search_path = public
as $$
  select r.id, r.meal_id, r.stars, r.comment, r.rating_date, r.created_at
  from public.ratings r
  where r.user_id = auth.uid();
$$;

create or replace function public.my_complaints()
returns table (
  id uuid, category_id uuid, mess_id uuid, title text, description text,
  is_anonymous boolean, status text, resolution_note text,
  upvote_count int, created_at timestamptz, updated_at timestamptz
)
language sql stable security definer set search_path = public
as $$
  select c.id, c.category_id, c.mess_id, c.title, c.description,
         c.is_anonymous, c.status, c.resolution_note,
         c.upvote_count, c.created_at, c.updated_at
  from public.complaints c
  where c.user_id = auth.uid();
$$;

create or replace function public.my_comments()
returns table (
  id uuid, complaint_id uuid, body text, is_deleted boolean, created_at timestamptz
)
language sql stable security definer set search_path = public
as $$
  select cc.id, cc.complaint_id, cc.body, cc.is_deleted, cc.created_at
  from public.complaint_comments cc
  where cc.user_id = auth.uid();
$$;

create or replace function public.my_praises()
returns table (
  id uuid, mess_id uuid, text text, is_anonymous boolean, created_at timestamptz
)
language sql stable security definer set search_path = public
as $$
  select p.id, p.mess_id, p.text, p.is_anonymous, p.created_at
  from public.praises p
  where p.user_id = auth.uid();
$$;

create or replace function public.my_upvoted_complaint_ids()
returns table (complaint_id uuid)
language sql stable security definer set search_path = public
as $$
  select u.complaint_id
  from public.complaint_upvotes u
  where u.user_id = auth.uid();
$$;

-- hide upvoter identities from the public
revoke select on public.complaint_upvotes from authenticated;
grant select (complaint_id, created_at) on public.complaint_upvotes to authenticated;

-- hide flagger identities (admins read flags via service role / is_admin policy)
revoke select on public.complaint_flags from authenticated;
grant select (complaint_id, created_at) on public.complaint_flags to authenticated;
