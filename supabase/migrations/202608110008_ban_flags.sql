-- Enforce ban on flags too (all other write policies already block banned users)
drop policy if exists "insert flag" on public.complaint_flags;
create policy "insert flag" on public.complaint_flags
  for insert
  with check (
    (auth.uid() = user_id)
    and (user_id <> (select user_id from public.complaints where id = complaint_flags.complaint_id))
    and (not (select is_banned from public.profiles where id = auth.uid()))
  );