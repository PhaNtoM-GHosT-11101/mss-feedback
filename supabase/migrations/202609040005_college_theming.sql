-- Per-college branding: give each institution its own theme and tagline so it
-- reads as its own product.
alter table public.institutions
  add column if not exists theme text not null default 'amber',
  add column if not exists tagline text;

-- A distinctive palette per college (seed once; admins can edit later).
update public.institutions
set theme = sub.theme
from (
  select id, (array['amber','crimson','emerald','indigo','teal','rose','violet','slate'])[
    (row_number() over (order by created_at, id) - 1) % 8 + 1
  ] as theme
  from public.institutions
) sub
where public.institutions.id = sub.id;