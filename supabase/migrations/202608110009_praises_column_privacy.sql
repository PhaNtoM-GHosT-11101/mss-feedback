-- Restore praises column privacy.
-- 001 revoked table-level select and granted only safe columns; a mistakenly
-- applied table-level grant exposed user_id again. Re-assert the intent here.
revoke select on public.praises from authenticated;
grant select (id, mess_id, text, is_anonymous, created_at)
  on public.praises to authenticated;