-- Multi-mess architecture upgrades
-- 1. Per-mess meal structure (veg/non-veg messes differ)
-- 2. Per-mess committee members (super admin = mess_id null = all messes)
-- 3. Complaint close by both sides (student or committee)
-- 4. Mess type (veg / non-veg / none) for identity
-- 5. Notifications for resolution + in-app center

alter table public.messes
  add column if not exists mess_type text not null default 'none'
  check (mess_type in ('none', 'veg', 'non_veg'));

alter table public.meals
  add column if not exists mess_id uuid references public.messes(id) on delete cascade;

-- per-mess meals: when a mess has its own structure, only those meals apply
-- (null mess_id = shared default structure)

alter table public.admin_members
  add column if not exists mess_id uuid references public.messes(id) on delete cascade;

-- committee member with null mess_id is a super admin (all messes)
-- committee member with a mess_id can only act on that mess

alter table public.complaints
  add column if not exists closed_by text
  check (closed_by in ('student', 'committee'));

-- students may close their own complaint; committee closes via status change
create or replace function public.close_own_complaint(complaint_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  target_complaints public.complaints%rowtype;
begin
  select * into target_complaints from public.complaints where id = complaint_id;
  if not found then
    raise exception 'not found';
  end if;
  if target_complaints.user_id <> auth.uid() then
    raise exception 'forbidden';
  end if;
  if target_complaints.status = 'resolved' then
    return;
  end if;
  update public.complaints
  set status = 'resolved', closed_by = 'student', updated_at = now()
  where id = complaint_id;
end;
$$;

grant execute on function public.close_own_complaint(uuid) to authenticated;

-- notification center
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('complaint_resolved', 'announcement', 'system')),
  title text not null,
  body text,
  complaint_id uuid references public.complaints(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id, read, created_at desc);

grant select, update on public.notifications to authenticated;

-- notify complaint owner when committee resolves
create or replace function public.notify_complaint_resolved()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.status = 'resolved' and (old.status is distinct from 'resolved') then
    insert into public.notifications (user_id, type, title, body, complaint_id)
    values (new.user_id, 'complaint_resolved', 'Your issue was resolved', new.title, new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists complaints_resolved_notify on public.complaints;
create trigger complaints_resolved_notify
  after update on public.complaints
  for each row execute procedure public.notify_complaint_resolved();
