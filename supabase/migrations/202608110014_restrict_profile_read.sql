-- PII fix: students previously could read every profile (full_name, roll_no).
-- Author display already uses stored author columns (migrations 009/010),
-- so authenticated users only need their own row.

drop policy if exists "read profiles" on public.profiles;
create policy "read own profile" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);
