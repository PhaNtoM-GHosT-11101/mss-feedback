-- ============================================================
-- MULTI-TENANT phase 2 + 3 + settings PK (applied live, capturing
-- the ad-hoc changes so the migrations dir is the source of truth).
-- Phase 2: per-institution complaint category uniqueness.
-- Phase 3: scope RLS read policies by current_institution_id().
-- Settings: composite PK (institution_id, key) for per-tenant config.
-- ============================================================

-- ---------- PHASE 2: per-institution category uniqueness ----------
-- Drop the old global unique on complaint_categories.name
alter table public.complaint_categories
  drop constraint if exists complaint_categories_name_key;
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'complaint_categories_institution_name_key'
      and conrelid = 'public.complaint_categories'::regclass
  ) then
    alter table public.complaint_categories
      add constraint complaint_categories_institution_name_key
      unique (institution_id, name);
  end if;
end $$;

-- Seed the 9 fixed categories for any institution missing them
insert into public.complaint_categories (name, is_active, sort_order, institution_id)
select cat.name, true, cat.sort_order, inst.id
from (values
  ('Mess', 1), ('WiFi', 2), ('Hostel', 3), ('Library', 4),
  ('Labs', 5), ('Washroom', 6), ('Sports', 7), ('Parking', 8), ('Other', 9)
) as cat(name, sort_order)
cross join public.institutions inst
where not exists (
  select 1 from public.complaint_categories c
  where c.name = cat.name and c.institution_id = inst.id
);

-- ---------- Phase 4b: settings per-tenant ----------
-- settings rows are per-institution (key scoped by institution_id)
update public.settings
  set institution_id = (select id from public.institutions where slug = 'nit-agartala')
  where institution_id is null;

alter table public.settings
  drop constraint if exists settings_pkey;
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'settings_pkey' and conrelid = 'public.settings'::regclass
  ) then
    alter table public.settings add primary key (institution_id, key);
  end if;
end $$;

alter table public.settings
  alter column institution_id set not null;

-- ---------- PHASE 3: scope read policies by institution ----------
-- (drop-then-create so this is safe to re-run)
drop policy if exists "read complaints" on public.complaints;
create policy "read complaints" on public.complaints
  for select using (institution_id = public.current_institution_id());

drop policy if exists "read categories" on public.complaint_categories;
create policy "read categories" on public.complaint_categories
  for select using (institution_id = public.current_institution_id());

drop policy if exists "read messes" on public.messes;
create policy "read messes" on public.messes
  for select using (institution_id = public.current_institution_id());

drop policy if exists "read meals" on public.meals;
create policy "read meals" on public.meals
  for select using (institution_id = public.current_institution_id());

drop policy if exists "read comments" on public.complaint_comments;
create policy "read comments" on public.complaint_comments
  for select using (institution_id = public.current_institution_id());

drop policy if exists "read praises" on public.praises;
create policy "read praises" on public.praises
  for select using (institution_id = public.current_institution_id());

drop policy if exists "read ratings" on public.ratings;
create policy "read ratings" on public.ratings
  for select using (institution_id = public.current_institution_id());

drop policy if exists "read menu" on public.menu_items;
create policy "read menu" on public.menu_items
  for select using (institution_id = public.current_institution_id());

drop policy if exists "read upvotes" on public.complaint_upvotes;
create policy "read upvotes" on public.complaint_upvotes
  for select using (institution_id = public.current_institution_id());

drop policy if exists "read announcements" on public.announcements;
create policy "read announcements" on public.announcements
  for select using (institution_id = public.current_institution_id());

drop policy if exists "mess_meal_settings_select" on public.mess_meal_settings;
create policy "mess_meal_settings_select" on public.mess_meal_settings
  for select using (institution_id = public.current_institution_id());

-- ---------- complaints_left_today: scope to user's institution ----------
create or replace function public.complaints_left_today(uid uuid default auth.uid())
returns integer language sql stable security definer set search_path = public as $$
  select greatest(
    coalesce(
      (select (value->>'daily_complaint_limit')::int from public.settings
       where key = 'general'
         and institution_id = (select institution_id from public.profiles where id = uid)),
      3
    )
    - (
      select count(*) from public.complaints c
      where c.user_id = uid
        and c.institution_id = (select institution_id from public.profiles where id = uid)
        and (c.created_at at time zone 'Asia/Kolkata')::date = (now() at time zone 'Asia/Kolkata')::date
    ),
    0
  );
$$;
