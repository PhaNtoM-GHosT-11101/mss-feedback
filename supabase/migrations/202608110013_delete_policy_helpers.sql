-- DELETE policies that reference user_id directly break: the column has no
-- SELECT grant for authenticated (column privacy), and DELETE policies must
-- read the existing row. Route ownership checks through security definer
-- helpers keyed on granted columns only.

create or replace function public.is_my_complaint(complaint_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.complaints where id = complaint_id and user_id = auth.uid());
$$;

create or replace function public.is_my_upvote(complaint_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.complaint_upvotes where complaint_id = complaint_id and user_id = auth.uid());
$$;

create or replace function public.is_my_comment(comment_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.complaint_comments where id = comment_id and user_id = auth.uid());
$$;

drop policy if exists "delete own complaint" on public.complaints;
create policy "delete own complaint" on public.complaints for delete to authenticated
  using (public.is_my_complaint(id));

drop policy if exists "delete own upvote" on public.complaint_upvotes;
create policy "delete own upvote" on public.complaint_upvotes for delete to authenticated
  using (public.is_my_upvote(complaint_id));

drop policy if exists "delete own comment" on public.complaint_comments;
create policy "delete own comment" on public.complaint_comments for delete to authenticated
  using (public.is_my_comment(id));