-- ============================================================================
-- IEEE NITW Student Branch — Operations Dashboard
-- Supabase schema: tables, profile-provisioning trigger, and 3-tier RLS.
--
-- Run this whole file once in the Supabase SQL Editor.
--
-- Role model (profiles.role):
--   super_admin — full access + user provisioning/demotion
--   admin       — read/write on all operational modules
--   member      — read-only everywhere
--
-- There is NO public sign-up: keep "Enable email signups" OFF in
-- Authentication -> Providers, and provision users from the dashboard
-- (Authentication -> Users -> Add user) or via the service-role API.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Enums
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('super_admin', 'admin', 'member');
create type public.task_status as enum ('todo', 'in_progress', 'review', 'done');
create type public.task_priority as enum ('low', 'medium', 'high', 'urgent');
create type public.event_status as enum ('draft', 'upcoming', 'ongoing', 'completed', 'cancelled');
create type public.budget_status as enum ('pending', 'approved', 'partially_paid', 'paid', 'rejected');
create type public.merch_status as enum ('pending', 'ordered', 'in_production', 'delivered', 'cancelled');
create type public.speaker_status as enum ('identified', 'contacted', 'follow_up', 'confirmed', 'declined');
create type public.recruit_status as enum ('applied', 'shortlisted', 'interviewed', 'accepted', 'rejected');

-- ---------------------------------------------------------------------------
-- 1. Profiles (linked 1:1 to auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text not null default '',
  role        public.user_role not null default 'member',
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'One row per auth user. role drives all RBAC; only super_admins may change it.';

-- ---------------------------------------------------------------------------
-- 2. Role helper functions
--    SECURITY DEFINER so they can read profiles without tripping RLS
--    (avoids infinite recursion in the profiles policies themselves).
-- ---------------------------------------------------------------------------
create or replace function public.current_role_of(uid uuid)
returns public.user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = uid;
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_role_of(auth.uid()) = 'super_admin';
$$;

create or replace function public.is_admin_or_above()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_role_of(auth.uid()) in ('admin', 'super_admin');
$$;

-- ---------------------------------------------------------------------------
-- 3. Auto-provision a profile whenever a user is created in auth.users.
--    Optional metadata honored: full_name. Role always starts as 'member'
--    (a super_admin promotes afterwards) EXCEPT the very first user, who
--    becomes super_admin so the system can be bootstrapped.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role public.user_role := 'member';
begin
  if not exists (select 1 from public.profiles) then
    assigned_role := 'super_admin';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    assigned_role
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 4. Block role self-escalation: only a super_admin may change roles,
--    and a super_admin cannot demote themself (prevents lockout).
-- ---------------------------------------------------------------------------
create or replace function public.enforce_role_change_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if not public.is_super_admin() then
      raise exception 'Only a super admin can change roles.';
    end if;
    if old.id = auth.uid() then
      raise exception 'Super admins cannot change their own role.';
    end if;
  end if;
  return new;
end;
$$;

create trigger on_profile_role_change
  before update on public.profiles
  for each row execute function public.enforce_role_change_rules();

-- ---------------------------------------------------------------------------
-- 5. updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Operational tables
-- ---------------------------------------------------------------------------

-- Events -----------------------------------------------------------------
create table public.events (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text default '',
  event_date   date not null,
  start_time   time,
  end_time     time,
  venue        text default '',
  status       public.event_status not null default 'upcoming',
  cover_url    text,
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index events_date_idx on public.events (event_date);
create index events_status_idx on public.events (status);

-- Tasks (Kanban) -----------------------------------------------------------
create table public.tasks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text default '',
  status       public.task_status not null default 'todo',
  priority     public.task_priority not null default 'medium',
  assignee_id  uuid references public.profiles (id) on delete set null,
  event_id     uuid references public.events (id) on delete set null,
  due_date     date,
  sort_order   integer not null default 0,
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index tasks_status_idx on public.tasks (status, sort_order);
create index tasks_assignee_idx on public.tasks (assignee_id);

-- Budget ledger --------------------------------------------------------------
create table public.budget_items (
  id               uuid primary key default gen_random_uuid(),
  item_name        text not null,
  category         text not null default 'general',
  event_id         uuid references public.events (id) on delete set null,
  allocated_amount numeric(12, 2) not null default 0 check (allocated_amount >= 0),
  paid_amount      numeric(12, 2) not null default 0 check (paid_amount >= 0),
  status           public.budget_status not null default 'pending',
  notes            text default '',
  created_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index budget_status_idx on public.budget_items (status);
create index budget_event_idx on public.budget_items (event_id);

-- CRM: Merch -----------------------------------------------------------------
create table public.merch_orders (
  id          uuid primary key default gen_random_uuid(),
  item_name   text not null,
  vendor      text default '',
  quantity    integer not null default 1 check (quantity > 0),
  unit_price  numeric(12, 2) not null default 0 check (unit_price >= 0),
  status      public.merch_status not null default 'pending',
  notes       text default '',
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index merch_status_idx on public.merch_orders (status);

-- CRM: Speakers ----------------------------------------------------------------
create table public.speakers (
  id           uuid primary key default gen_random_uuid(),
  full_name    text not null,
  organization text default '',
  topic        text default '',
  email        text default '',
  phone        text default '',
  status       public.speaker_status not null default 'identified',
  event_id     uuid references public.events (id) on delete set null,
  deck_url     text,
  notes        text default '',
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index speakers_status_idx on public.speakers (status);

-- CRM: Recruitment ---------------------------------------------------------------
create table public.recruitment (
  id               uuid primary key default gen_random_uuid(),
  candidate_name   text not null,
  email            text default '',
  phone            text default '',
  branch_year      text default '',
  position_applied text default '',
  status           public.recruit_status not null default 'applied',
  resume_url       text,
  notes            text default '',
  created_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index recruitment_status_idx on public.recruitment (status);

-- CRM: Resources --------------------------------------------------------------
create table public.resources (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  category    text not null default 'general',
  description text default '',
  file_url    text,
  external_url text,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index resources_category_idx on public.resources (category);

-- updated_at triggers on every table -------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'events', 'tasks', 'budget_items',
    'merch_orders', 'speakers', 'recruitment', 'resources'
  ]
  loop
    execute format(
      'create trigger touch_%1$s before update on public.%1$s
         for each row execute function public.touch_updated_at();',
      t
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Row Level Security
--    Pattern for every operational table:
--      SELECT  -> any authenticated user (members are read-only, not blind)
--      WRITE   -> admin or super_admin only
--    profiles has stricter rules (see below).
-- ---------------------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.events       enable row level security;
alter table public.tasks        enable row level security;
alter table public.budget_items enable row level security;
alter table public.merch_orders enable row level security;
alter table public.speakers     enable row level security;
alter table public.recruitment  enable row level security;
alter table public.resources    enable row level security;

-- Profiles ------------------------------------------------------------------
-- Everyone signed in can read profiles (needed for assignee dropdowns, names).
create policy "profiles: authenticated can read"
  on public.profiles for select
  to authenticated
  using (true);

-- Users may edit their own profile row (the trigger in §4 blocks role changes
-- unless the editor is a super_admin). Super admins may edit anyone.
create policy "profiles: self or super admin can update"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.is_super_admin())
  with check (id = auth.uid() or public.is_super_admin());

-- Only super admins may delete profiles (user de-provisioning).
create policy "profiles: super admin can delete"
  on public.profiles for delete
  to authenticated
  using (public.is_super_admin() and id <> auth.uid());

-- No INSERT policy on purpose: rows are created only by the auth trigger,
-- which runs as SECURITY DEFINER and bypasses RLS.

-- Operational tables ----------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'events', 'tasks', 'budget_items',
    'merch_orders', 'speakers', 'recruitment', 'resources'
  ]
  loop
    execute format($p$
      create policy "%1$s: authenticated can read"
        on public.%1$s for select
        to authenticated
        using (true);

      create policy "%1$s: admins can insert"
        on public.%1$s for insert
        to authenticated
        with check (public.is_admin_or_above());

      create policy "%1$s: admins can update"
        on public.%1$s for update
        to authenticated
        using (public.is_admin_or_above())
        with check (public.is_admin_or_above());

      create policy "%1$s: admins can delete"
        on public.%1$s for delete
        to authenticated
        using (public.is_admin_or_above());
    $p$, t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. Storage: bucket for speaker decks, resumes, and resource assets.
--    Read for any signed-in user; write/delete for admins and super admins.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('crm-files', 'crm-files', false)
on conflict (id) do nothing;

create policy "crm-files: authenticated can read"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'crm-files');

create policy "crm-files: admins can upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'crm-files' and public.is_admin_or_above());

create policy "crm-files: admins can update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'crm-files' and public.is_admin_or_above());

create policy "crm-files: admins can delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'crm-files' and public.is_admin_or_above());

-- ============================================================================
-- Done. Bootstrap steps:
--   1. Authentication -> Users -> "Add user" -> create your own account.
--      Being the first user, the trigger makes you super_admin automatically.
--   2. Add further users the same way; promote leaders to 'admin' by updating
--      their row in profiles (as super_admin) or via the future admin UI.
-- ============================================================================
