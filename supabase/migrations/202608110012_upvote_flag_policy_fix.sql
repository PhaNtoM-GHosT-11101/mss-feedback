-- The upvote and flag policies check "cannot vote/flag your own complaint" by
-- selecting complaints.user_id inline. That column has no SELECT grant for
-- authenticated (column privacy), so every insert returned 42501. Route the
-- check through a security definer helper instead.
create or replace function public.complaint_owner(complaint_id uuid)
returns uuid language sql stable security definer set search_path = public
as $$
  select user_id from public.complaints where id = complaint_id;
$$;

drop policy if exists "insert upvote" on public.complaint_upvotes;
create policy "insert upvote" on public.complaint_upvotes for insert to authenticated
  with check (
    auth.uid() = user_id
    and user_id <> public.complaint_owner(complaint_id)
    and not (select is_banned from public.profiles where id = auth.uid())
  );

drop policy if exists "insert flag" on public.complaint_flags;
create policy "insert flag" on public.complaint_flags for insert to authenticated
  with check (
    auth.uid() = user_id
    and user_id <> public.complaint_owner(complaint_id)
    and not (select is_banned from public.profiles where id = auth.uid())
  );