-- REVERB: nested comment threads + saved complaints
-- parent_id makes complaint_comments a tree (threaded replies, deleted via cascade).
alter table public.complaint_comments
  add column if not exists parent_id uuid references public.complaint_comments(id) on delete cascade;

create index if not exists complaint_comments_parent_idx
  on public.complaint_comments(complaint_id, parent_id);

-- Saved (bookmarked) complaints, per user.
create table if not exists public.saved_complaints (
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (complaint_id, user_id)
);
create index if not exists saved_complaints_user_idx
  on public.saved_complaints(user_id, created_at desc);

alter table public.saved_complaints enable row level security;

drop policy if exists "read own saves" on public.saved_complaints;
create policy "read own saves" on public.saved_complaints
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "insert own save" on public.saved_complaints;
create policy "insert own save" on public.saved_complaints
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "delete own save" on public.saved_complaints;
create policy "delete own save" on public.saved_complaints
  for delete to authenticated using (auth.uid() = user_id);

grant select, insert, delete on table public.saved_complaints to authenticated;