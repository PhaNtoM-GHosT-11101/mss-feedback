-- MSS Feedback — initial schema
-- Tables: messes, complaint_categories, meals, settings, profiles, complaints,
-- complaint_upvotes, complaint_comments, complaint_flags, ratings, praises,
-- menu_items, announcements, admin_members

create extension if not exists pgcrypto;

-- ============================================================
-- Core reference tables (admin-editable via panel)
-- ============================================================
create table public.messes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.complaint_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_hour int not null check (start_hour between 0 and 23),
  end_hour int not null check (end_hour between 0 and 23),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Profiles
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  roll_no text,
  mess_id uuid references public.messes(id) on delete set null,
  is_banned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Complaints
-- ============================================================
create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid references public.complaint_categories(id) on delete set null,
  mess_id uuid references public.messes(id) on delete set null,
  title text not null check (char_length(title) between 3 and 120),
  description text not null check (char_length(description) between 10 and 2000),
  is_anonymous boolean not null default false,
  status text not null default 'new' check (status in ('new','in_progress','resolved')),
  resolution_note text,
  photo_urls text[] not null default '{}',
  upvote_count int not null default 0,
  is_pinned boolean not null default false,
  is_flagged boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index complaints_status_idx on public.complaints(status);
create index complaints_category_idx on public.complaints(category_id);
create index complaints_created_idx on public.complaints(created_at desc);
create index complaints_upvotes_idx on public.complaints(upvote_count desc);

create table public.complaint_upvotes (
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (complaint_id, user_id)
);

create table public.complaint_comments (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  is_deleted boolean not null default false,
  created_at timestamptz not null default now()
);
create index complaint_comments_cid_idx on public.complaint_comments(complaint_id, created_at);

create table public.complaint_flags (
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (complaint_id, user_id)
);

-- ============================================================
-- Ratings (anonymous publicly, once per meal per day)
-- ============================================================
create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  meal_id uuid not null references public.meals(id) on delete cascade,
  mess_id uuid references public.messes(id) on delete set null,
  stars int not null check (stars between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 200),
  rating_date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, meal_id, rating_date)
);
create index ratings_meal_date_idx on public.ratings(meal_id, rating_date);
create index ratings_mess_date_idx on public.ratings(mess_id, rating_date);

-- ============================================================
-- Praises
-- ============================================================
create table public.praises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mess_id uuid references public.messes(id) on delete set null,
  text text not null check (char_length(text) between 1 and 500),
  is_anonymous boolean not null default false,
  created_at timestamptz not null default now()
);
create index praises_created_idx on public.praises(created_at desc);

-- ============================================================
-- Menu (daily items + weekly template)
-- ============================================================
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  mess_id uuid references public.messes(id) on delete set null,
  item_text text not null check (char_length(item_text) <= 200),
  menu_date date,
  weekday int check (weekday between 0 and 6 or weekday is null),
  is_template boolean not null default false,
  created_at timestamptz not null default now()
);
create index menu_items_date_idx on public.menu_items(menu_date);

-- ============================================================
-- Announcements
-- ============================================================
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 1000),
  is_active boolean not null default true,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
create index announcements_active_idx on public.announcements(is_active, created_at desc);

-- ============================================================
-- Admin members (admin = super, committee = limited)
-- ============================================================
create table public.admin_members (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role text not null check (role in ('admin','committee')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- Functions & triggers
-- ============================================================
-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- updated_at bumpers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
create trigger complaints_updated_at before update on public.complaints
  for each row execute procedure public.set_updated_at();
create trigger settings_updated_at before update on public.settings
  for each row execute procedure public.set_updated_at();

-- upvote count maintenance
create or replace function public.bump_upvote()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  update public.complaints set upvote_count = upvote_count + 1 where id = new.complaint_id;
  return new;
end;
$$;

create or replace function public.unbump_upvote()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  update public.complaints set upvote_count = greatest(upvote_count - 1, 0) where id = old.complaint_id;
  return old;
end;
$$;

create trigger upvotes_after_insert after insert on public.complaint_upvotes
  for each row execute procedure public.bump_upvote();
create trigger upvotes_after_delete after delete on public.complaint_upvotes
  for each row execute procedure public.unbump_upvote();

-- role helpers
create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.admin_members where user_id = uid and role = 'admin');
$$;

create or replace function public.is_committee(uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.admin_members where user_id = uid and role in ('admin','committee'));
$$;

-- privacy helpers: expose author name without exposing user_id
create or replace function public.complaint_author(c public.complaints)
returns text language sql stable security definer set search_path = public
as $$
  select case when c.is_anonymous then null
              else (select p.full_name from public.profiles p where p.id = c.user_id) end;
$$;

create or replace function public.complaint_author_roll(c public.complaints)
returns text language sql stable security definer set search_path = public
as $$
  select case when c.is_anonymous then null
              else (select p.roll_no from public.profiles p where p.id = c.user_id) end;
$$;

create or replace function public.comment_author(cc public.complaint_comments)
returns text language sql stable security definer set search_path = public
as $$
  select (select p.full_name from public.profiles p where p.id = cc.user_id);
$$;

create or replace function public.praise_author(pr public.praises)
returns text language sql stable security definer set search_path = public
as $$
  select case when pr.is_anonymous then null
              else (select p.full_name from public.profiles p where p.id = pr.user_id) end;
$$;

-- setting reader
create or replace function public.get_setting(k text)
returns jsonb language sql stable security definer set search_path = public
as $$
  select value from public.settings where key = k;
$$;

-- meal-hour window check (Asia/Kolkata)
create or replace function public.meal_is_open(meal_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.meals m
    where m.id = meal_id and m.is_active
      and (
        (m.start_hour <= m.end_hour and extract(hour from now() at time zone 'Asia/Kolkata') >= m.start_hour and extract(hour from now() at time zone 'Asia/Kolkata') < m.end_hour)
        or (m.start_hour > m.end_hour and (extract(hour from now() at time zone 'Asia/Kolkata') >= m.start_hour or extract(hour from now() at time zone 'Asia/Kolkata') < m.end_hour))
      )
  );
$$;

-- complaints left today (limit from settings)
create or replace function public.complaints_left_today(uid uuid default auth.uid())
returns int language sql stable security definer set search_path = public
as $$
  select greatest(
    coalesce((select (value->>'daily_complaint_limit')::int from public.settings where key = 'general'), 3)
    - (select count(*) from public.complaints c where c.user_id = uid and c.created_at::date = current_date),
    0
  );
$$;

-- ============================================================
-- Seed data
-- ============================================================
insert into public.messes (name) values
  ('Main Mess')
on conflict (name) do nothing;

insert into public.complaint_categories (name, sort_order) values
  ('Food Quality', 1),
  ('Staff Behavior', 2),
  ('Cleanliness', 3),
  ('Infrastructure', 4),
  ('Other', 5)
on conflict (name) do nothing;

insert into public.meals (name, start_hour, end_hour, sort_order) values
  ('Morning', 6, 11, 1),
  ('Afternoon', 11, 16, 2),
  ('Evening', 16, 19, 3),
  ('Night', 19, 23, 4);

insert into public.settings (key, value) values
  ('general', '{"daily_complaint_limit": 3}'::jsonb),
  ('branding', '{"site_name": "MSS Feedback", "tagline": "NIT Agartala Mess & Service Society"}'::jsonb)
on conflict (key) do nothing;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.messes enable row level security;
alter table public.complaint_categories enable row level security;
alter table public.meals enable row level security;
alter table public.settings enable row level security;
alter table public.profiles enable row level security;
alter table public.complaints enable row level security;
alter table public.complaint_upvotes enable row level security;
alter table public.complaint_comments enable row level security;
alter table public.complaint_flags enable row level security;
alter table public.ratings enable row level security;
alter table public.praises enable row level security;
alter table public.menu_items enable row level security;
alter table public.announcements enable row level security;
alter table public.admin_members enable row level security;

-- --- public read (any authenticated) ---
create policy "read messes" on public.messes for select to authenticated using (true);
create policy "read categories" on public.complaint_categories for select to authenticated using (true);
create policy "read meals" on public.meals for select to authenticated using (true);
create policy "read settings" on public.settings for select to authenticated using (true);
create policy "read menu" on public.menu_items for select to authenticated using (true);
create policy "read announcements" on public.announcements for select to authenticated using (true);
create policy "read profiles" on public.profiles for select to authenticated using (true);

-- --- profiles: self-update ---
create policy "update own profile" on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- --- complaints: public read, user can create/delete own, committee full ---
create policy "read complaints" on public.complaints for select to authenticated using (true);

create policy "insert complaint" on public.complaints for insert to authenticated
  with check (
    auth.uid() = user_id
    and (select public.complaints_left_today() > 0)
    and not (select is_banned from public.profiles where id = auth.uid())
  );

create policy "delete own complaint" on public.complaints for delete to authenticated
  using (auth.uid() = user_id);

create policy "committee manage complaints" on public.complaints for all to authenticated
  using (public.is_committee()) with check (public.is_committee());

-- --- upvotes: own insert/delete only ---
create policy "read upvotes" on public.complaint_upvotes for select to authenticated using (true);
create policy "insert upvote" on public.complaint_upvotes for insert to authenticated
  with check (
    auth.uid() = user_id
    and user_id <> (select user_id from public.complaints where id = complaint_id)
    and not (select is_banned from public.profiles where id = auth.uid())
  );
create policy "delete own upvote" on public.complaint_upvotes for delete to authenticated
  using (auth.uid() = user_id);
create policy "admin delete upvote" on public.complaint_upvotes for delete to authenticated
  using (public.is_admin());

-- --- comments: own insert/delete, admin delete ---
create policy "read comments" on public.complaint_comments for select to authenticated using (true);
create policy "insert comment" on public.complaint_comments for insert to authenticated
  with check (
    auth.uid() = user_id
    and not (select is_banned from public.profiles where id = auth.uid())
  );
create policy "delete own comment" on public.complaint_comments for delete to authenticated
  using (auth.uid() = user_id);
create policy "admin delete comment" on public.complaint_comments for delete to authenticated
  using (public.is_admin());

-- --- flags: own insert only (admin sees all via service role) ---
create policy "insert flag" on public.complaint_flags for insert to authenticated
  with check (
    auth.uid() = user_id
    and user_id <> (select user_id from public.complaints where id = complaint_id)
  );
create policy "admin read flags" on public.complaint_flags for select to authenticated
  using (public.is_admin());

-- --- ratings: insert within window, once/day (unique idx); read via column grants ---
create policy "read ratings" on public.ratings for select to authenticated using (true);
create policy "insert rating" on public.ratings for insert to authenticated
  with check (
    auth.uid() = user_id
    and public.meal_is_open(meal_id)
    and not (select is_banned from public.profiles where id = auth.uid())
  );

-- --- praises ---
create policy "read praises" on public.praises for select to authenticated using (true);
create policy "insert praise" on public.praises for insert to authenticated
  with check (
    auth.uid() = user_id
    and not (select is_banned from public.profiles where id = auth.uid())
  );

-- --- menu & announcements: committee writes ---
create policy "committee write menu" on public.menu_items for insert to authenticated
  with check (public.is_committee());
create policy "committee update menu" on public.menu_items for update to authenticated
  using (public.is_committee()) with check (public.is_committee());
create policy "committee delete menu" on public.menu_items for delete to authenticated
  using (public.is_committee());

create policy "committee write announcements" on public.announcements for insert to authenticated
  with check (public.is_committee() and created_by = auth.uid());
create policy "committee update announcements" on public.announcements for update to authenticated
  using (public.is_committee()) with check (public.is_committee());
create policy "committee delete announcements" on public.announcements for delete to authenticated
  using (public.is_committee());

-- --- settings/messes/categories/meals: committee writes ---
create policy "committee write messes" on public.messes for all to authenticated
  using (public.is_committee()) with check (public.is_committee());
create policy "committee write categories" on public.complaint_categories for all to authenticated
  using (public.is_committee()) with check (public.is_committee());
create policy "committee write meals" on public.meals for all to authenticated
  using (public.is_committee()) with check (public.is_committee());
create policy "committee write settings" on public.settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- admin_members: admin only ---
create policy "read admin members" on public.admin_members for select to authenticated
  using (public.is_committee());
create policy "write admin members" on public.admin_members for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- column privacy grants ---
-- students never see who rated (ratings are anonymous)
revoke select on public.ratings from authenticated;
grant select (id, meal_id, mess_id, stars, comment, rating_date, created_at)
  on public.ratings to authenticated;

-- students see complaints without user_id (names via author functions)
revoke select on public.complaints from authenticated;
grant select (id, category_id, mess_id, title, description, is_anonymous, status,
  resolution_note, photo_urls, upvote_count, is_pinned, created_at, updated_at)
  on public.complaints to authenticated;

-- comments: hide user_id (names via comment_author function)
revoke select on public.complaint_comments from authenticated;
grant select (id, complaint_id, body, is_deleted, created_at)
  on public.complaint_comments to authenticated;

-- praises: hide user_id (names via praise_author function)
revoke select on public.praises from authenticated;
grant select (id, mess_id, text, is_anonymous, created_at)
  on public.praises to authenticated;

-- ============================================================
-- Storage: complaint photos
-- ============================================================
insert into storage.buckets (id, name, public)
values ('complaint-photos', 'complaint-photos', true)
on conflict (id) do nothing;

create policy "public read complaint photos" on storage.objects
  for select to authenticated using (bucket_id = 'complaint-photos');
create policy "insert complaint photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'complaint-photos');
create policy "owner manage complaint photos" on storage.objects
  for update to authenticated using (bucket_id = 'complaint-photos' and owner = auth.uid());
create policy "owner delete complaint photos" on storage.objects
  for delete to authenticated using (bucket_id = 'complaint-photos' and owner = auth.uid());
