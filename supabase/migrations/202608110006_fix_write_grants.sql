-- Missing INSERT/DELETE grants for authenticated users.
-- All insert policies require auth.uid() = user_id, so user_id is included in every grant.
grant insert (user_id, category_id, mess_id, title, description, is_anonymous, photo_urls)
  on public.complaints to authenticated;
grant delete on public.complaints to authenticated;

grant insert (complaint_id, user_id, body)
  on public.complaint_comments to authenticated;
grant delete on public.complaint_comments to authenticated;

grant insert (complaint_id, user_id)
  on public.complaint_upvotes to authenticated;
grant delete on public.complaint_upvotes to authenticated;

grant insert (complaint_id, user_id)
  on public.complaint_flags to authenticated;

grant insert (mess_id, user_id, text, is_anonymous)
  on public.praises to authenticated;

grant insert (meal_id, mess_id, user_id, stars, comment)
  on public.ratings to authenticated;
