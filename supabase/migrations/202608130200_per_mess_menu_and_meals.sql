-- Per-mess food structure:
-- 1. menu_items.mess_id: menu items can belong to one mess (null = shared across messes)
-- 2. mess_meal_settings: which meals a mess actually serves (e.g. evening snack only in some)

alter table public.menu_items
  add column if not exists mess_id uuid references public.messes(id) on delete cascade;

create table if not exists public.mess_meal_settings (
  id uuid primary key default gen_random_uuid(),
  mess_id uuid not null references public.messes(id) on delete cascade,
  meal_id uuid not null references public.meals(id) on delete cascade,
  is_active boolean not null default true,
  unique (mess_id, meal_id)
);

alter table public.mess_meal_settings enable row level security;

drop policy if exists mess_meal_settings_select on public.mess_meal_settings;
create policy mess_meal_settings_select on public.mess_meal_settings
  for select to authenticated using (true);

grant select on public.mess_meal_settings to authenticated;
grant all on public.mess_meal_settings to service_role;

-- seed: every mess serves every currently-active meal by default
insert into public.mess_meal_settings (mess_id, meal_id, is_active)
select m.id, meal.id, true
from public.messes m
cross join public.meals meal
where m.is_active = true and meal.is_active = true
on conflict (mess_id, meal_id) do nothing;
