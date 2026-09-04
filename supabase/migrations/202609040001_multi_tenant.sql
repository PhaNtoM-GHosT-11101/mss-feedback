-- ============================================================
-- MULTI-TENANT: institutions + institution_id scoping
-- Turns the single-college mess feedback app into a generic,
-- multi-college complaint system. Every tenant table gets an
-- institution_id FK. Existing rows are backfilled to NIT Agartala.
-- ============================================================

-- 1) institutions table
create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text,
  slug text not null unique,
  kind text not null default 'college',   -- 'college' | 'iit' | 'nit' | 'iiit' etc.
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

grant select on public.institutions to anon, authenticated;
grant all on public.institutions to service_role;
alter table public.institutions enable row level security;
drop policy if exists institutions_select on public.institutions;
create policy institutions_select on public.institutions
  for select using (is_active = true);

-- 2) Seed the popular colleges (IITs, NITs, IIITs) + NIT Agartala
insert into public.institutions (name, short_name, slug, kind) values
  ('IIT Bombay', 'IITB', 'iit-bombay', 'iit'),
  ('IIT Delhi', 'IITD', 'iit-delhi', 'iit'),
  ('IIT Madras', 'IITM', 'iit-madras', 'iit'),
  ('IIT Kanpur', 'IITK', 'iit-kanpur', 'iit'),
  ('IIT Kharagpur', 'IITKGP', 'iit-kharagpur', 'iit'),
  ('IIT Roorkee', 'IITR', 'iit-roorkee', 'iit'),
  ('IIT Guwahati', 'IITG', 'iit-guwahati', 'iit'),
  ('IIT Hyderabad', 'IITH', 'iit-hyderabad', 'iit'),
  ('IIT Patna', 'IITP', 'iit-patna', 'iit'),
  ('IIT (BHU) Varanasi', 'IITBHU', 'iit-bhu-varanasi', 'iit'),
  ('IIT Indore', 'IITI', 'iit-indore', 'iit'),
  ('IIT Mandi', 'IITMandi', 'iit-mandi', 'iit'),
  ('IIT Jodhpur', 'IITJ', 'iit-jodhpur', 'iit'),
  ('IIT Dharwad', 'IITDH', 'iit-dharwad', 'iit'),
  ('IIT Palakkad', 'IITPKD', 'iit-palakkad', 'iit'),
  ('IIT Tirupati', 'IITT', 'iit-tirupati', 'iit'),
  ('IIT Bhilai', 'IITBH', 'iit-bhilai', 'iit'),
  ('IIT Goa', 'IITGOA', 'iit-goa', 'iit'),
  ('IIT Jammu', 'IITJMU', 'iit-jammu', 'iit'),
  ('IIT Dhanbad', 'IITISM', 'iit-ism-dhanbad', 'iit'),
  ('NIT Trichy', 'NITT', 'nit-trichy', 'nit'),
  ('NIT Warangal', 'NITW', 'nit-warangal', 'nit'),
  ('NIT Surathkal', 'NITK', 'nit-surathkal', 'nit'),
  ('NIT Calicut', 'NITC', 'nit-calicut', 'nit'),
  ('NIT Allahabad', 'NITA', 'nit-allahabad', 'nit'),
  ('NIT Bhopal', 'MANIT', 'nit-bhopal', 'nit'),
  ('NIT Jaipur', 'MNITJ', 'nit-jaipur', 'nit'),
  ('NIT Nagpur', 'VNIT', 'nit-nagpur', 'nit'),
  ('NIT Rourkela', 'NITRKL', 'nit-rourkela', 'nit'),
  ('NIT Agartala', 'NITA', 'nit-agartala', 'nit'),
  ('NIT Kurukshetra', 'NITKKR', 'nit-kurukshetra', 'nit'),
  ('NIT Hamirpur', 'NITH', 'nit-hamirpur', 'nit'),
  ('NIT Jalandhar', 'NITJ', 'nit-jalandhar', 'nit'),
  ('NIT Patna', 'NITP', 'nit-patna', 'nit'),
  ('NIT Raipur', 'NITRR', 'nit-raipur', 'nit'),
  ('NIT Silchar', 'NITS', 'nit-silchar', 'nit'),
  ('NIT Meghalaya', 'NITM', 'nit-meghalaya', 'nit'),
  ('NIT Mizoram', 'NITMZ', 'nit-mizoram', 'nit'),
  ('NIT Manipur', 'NITMN', 'nit-manipur', 'nit'),
  ('NIT Nagaland', 'NITNL', 'nit-nagaland', 'nit'),
  ('IIIT Hyderabad', 'IIITH', 'iiit-hyderabad', 'iiit'),
  ('IIIT Allahabad', 'IIITA', 'iiit-allahabad', 'iiit'),
  ('IIIT Delhi', 'IIITD', 'iiit-delhi', 'iiit'),
  ('IIIT Sri City', 'IIITS', 'iiit-sri-city', 'iiit'),
  ('IIIT Jabalpur', 'IIITDMJ', 'iiit-jabalpur', 'iiit'),
  ('IIIT Kancheepuram', 'IIITK', 'iiit-kancheepuram', 'iiit'),
  ('IIIT Kottayam', 'IIITKTY', 'iiit-kottayam', 'iiit'),
  ('IIIT Agartala', 'IIITAG', 'iiit-agartala', 'iiit')
on conflict (slug) do nothing;

-- 3) Resolve NIT Agartala id for backfill
-- (used inline below via a subselect)

-- 4) Add institution_id to every tenant table and backfill to NIT Agartala
alter table public.profiles
  add column if not exists institution_id uuid references public.institutions(id) on delete set null;
update public.profiles set institution_id = (select id from public.institutions where slug = 'nit-agartala') where institution_id is null;

alter table public.messes
  add column if not exists institution_id uuid references public.institutions(id) on delete cascade;
update public.messes set institution_id = (select id from public.institutions where slug = 'nit-agartala') where institution_id is null;

alter table public.meals
  add column if not exists institution_id uuid references public.institutions(id) on delete cascade;
update public.meals set institution_id = (select id from public.institutions where slug = 'nit-agartala') where institution_id is null;

alter table public.complaints
  add column if not exists institution_id uuid references public.institutions(id) on delete cascade;
update public.complaints set institution_id = (select id from public.institutions where slug = 'nit-agartala') where institution_id is null;

alter table public.complaint_categories
  add column if not exists institution_id uuid references public.institutions(id) on delete cascade;
update public.complaint_categories set institution_id = (select id from public.institutions where slug = 'nit-agartala') where institution_id is null;

alter table public.ratings
  add column if not exists institution_id uuid references public.institutions(id) on delete cascade;
update public.ratings set institution_id = (select id from public.institutions where slug = 'nit-agartala') where institution_id is null;

alter table public.praises
  add column if not exists institution_id uuid references public.institutions(id) on delete cascade;
update public.praises set institution_id = (select id from public.institutions where slug = 'nit-agartala') where institution_id is null;

alter table public.announcements
  add column if not exists institution_id uuid references public.institutions(id) on delete cascade;
update public.announcements set institution_id = (select id from public.institutions where slug = 'nit-agartala') where institution_id is null;

alter table public.admin_members
  add column if not exists institution_id uuid references public.institutions(id) on delete cascade;
update public.admin_members set institution_id = (select id from public.institutions where slug = 'nit-agartala') where institution_id is null;

alter table public.notifications
  add column if not exists institution_id uuid references public.institutions(id) on delete cascade;
update public.notifications set institution_id = (select id from public.institutions where slug = 'nit-agartala') where institution_id is null;

alter table public.menu_items
  add column if not exists institution_id uuid references public.institutions(id) on delete cascade;
update public.menu_items set institution_id = (select id from public.institutions where slug = 'nit-agartala') where institution_id is null;

alter table public.mess_meal_settings
  add column if not exists institution_id uuid references public.institutions(id) on delete cascade;
update public.mess_meal_settings set institution_id = (select id from public.institutions where slug = 'nit-agartala') where institution_id is null;

alter table public.complaint_comments
  add column if not exists institution_id uuid references public.institutions(id) on delete cascade;
update public.complaint_comments set institution_id = (select id from public.institutions where slug = 'nit-agartala') where institution_id is null;

alter table public.complaint_upvotes
  add column if not exists institution_id uuid references public.institutions(id) on delete cascade;
update public.complaint_upvotes set institution_id = (select id from public.institutions where slug = 'nit-agartala') where institution_id is null;

alter table public.complaint_flags
  add column if not exists institution_id uuid references public.institutions(id) on delete cascade;
update public.complaint_flags set institution_id = (select id from public.institutions where slug = 'nit-agartala') where institution_id is null;

-- settings stays global (server-wide) but add institution_id for per-institution overrides
alter table public.settings
  add column if not exists institution_id uuid references public.institutions(id) on delete cascade;

-- 5) Helper: current user's institution id (from their profile)
create or replace function public.current_institution_id()
returns uuid language sql stable security definer set search_path = public as $$
  select institution_id from public.profiles where id = auth.uid() limit 1;
$$;

-- scoped admin/committee helpers (institution-aware)
create or replace function public.is_committee_in(inst uuid default public.current_institution_id())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_members
    where user_id = auth.uid() and role in ('admin','committee')
      and (institution_id = inst)
  );
$$;

create or replace function public.is_admin_in(inst uuid default public.current_institution_id())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_members
    where user_id = auth.uid() and role = 'admin'
      and (institution_id = inst)
  );
$$;

-- keep old unqualified helpers working (scope to user's own institution)
create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_members am
    join public.profiles p on p.id = am.user_id
    where am.user_id = uid and am.role = 'admin'
      and (am.institution_id = p.institution_id)
  );
$$;

create or replace function public.is_committee(uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_members am
    join public.profiles p on p.id = am.user_id
    where am.user_id = uid and am.role in ('admin','committee')
      and (am.institution_id = p.institution_id)
  );
$$;

-- 6) Seed the fixed complaint categories per existing institution
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
