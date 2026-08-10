-- Fix missing table-level SELECT grants for authenticated users.
-- The column-privacy grants for ratings/complaints/comments/praises are unchanged.
grant select on public.profiles to authenticated;
grant select on public.messes to authenticated;
grant select on public.meals to authenticated;
grant select on public.complaint_categories to authenticated;
grant select on public.settings to authenticated;
grant select on public.menu_items to authenticated;
grant select on public.announcements to authenticated;
