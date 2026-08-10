-- Admin panel policies: committee/user management & full moderation

-- committee can update profiles (ban/unban, edit mess/roll), admin only changes is_banned
create policy "committee update profiles" on public.profiles for update to authenticated
  using (public.is_committee()) with check (public.is_committee());

-- committee can delete ratings (full moderation)
create policy "committee delete ratings" on public.ratings for delete to authenticated
  using (public.is_committee());

-- committee can delete praises
create policy "committee delete praises" on public.praises for delete to authenticated
  using (public.is_committee());

-- committee can delete comments (already admin-only; extend to committee)
drop policy "admin delete comment" on public.complaint_comments;
create policy "committee delete comment" on public.complaint_comments for delete to authenticated
  using (public.is_committee());

-- committee can read ratings incl. identities (needed for moderation/reports)
create policy "committee read ratings full" on public.ratings for select to authenticated
  using (public.is_committee());
create policy "committee read praises full" on public.praises for select to authenticated
  using (public.is_committee());
create policy "committee read complaints full" on public.complaints for select to authenticated
  using (public.is_committee());
create policy "committee read comments full" on public.complaint_comments for select to authenticated
  using (public.is_committee());

-- daily digest recipients stored in settings
update public.settings
set value = '{"daily_complaint_limit": 3, "digest_emails": [], "weekly_report_emails": []}'::jsonb
where key = 'general';
