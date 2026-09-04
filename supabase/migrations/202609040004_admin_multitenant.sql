-- Grant multi-college admin access: allow one user to be admin/committee at
-- many institutions. The old PK was user_id (one institution only). Replace it
-- with a composite (user_id, institution_id) PK.
--
-- Also seed the super-admin (Aditya) as admin on every active institution so
-- they can open and manage each college.

-- 1) Make admin_members multi-institution capable.
alter table public.admin_members
  drop constraint if exists admin_members_pkey;

alter table public.admin_members
  add constraint admin_members_pkey primary key (user_id, institution_id);

-- 2) Admin RPCs already key off admin_members.institution_id via is_admin_in /
--    is_committee_in. Drop the old profile-scoped wrappers' dependence on a
--    single institution is not needed; keep them for backwards compat but
--    switch callers to the _in variants (handled in app code).

-- 3) Seed the super-admin on every active institution.
insert into public.admin_members (user_id, role, institution_id)
select '61aef4a7-a744-4e99-b6f4-284254cc457f', 'admin', id
from public.institutions
where is_active = true
  and not exists (
    select 1 from public.admin_members am
    where am.user_id = '61aef4a7-a744-4e99-b6f4-284254cc457f'
      and am.institution_id = institutions.id
  );