-- Run after 001_initial.sql. Staff who self-register stay pending until a doctor approves.
-- Doctor accounts: create user in Supabase Dashboard (Authentication → Users) without app signup metadata;
-- the trigger below gives them an approved doctor profile.

-- 1) Approval column
alter table public.profiles
  add column if not exists approval_status text;

update public.profiles
set approval_status = 'approved'
where approval_status is null;

alter table public.profiles
  alter column approval_status set default 'pending',
  alter column approval_status set not null;

alter table public.profiles
  drop constraint if exists profiles_approval_status_check;

alter table public.profiles
  add constraint profiles_approval_status_check
  check (approval_status in ('pending', 'approved'));

-- 2) Helpers for RLS
create or replace function public.is_staff_approved()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.approval_status = 'approved'
      and p.role in ('doctor', 'assistant', 'marketing')
  );
$$;

create or replace function public.is_approved_doctor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.approval_status = 'approved'
      and p.role = 'doctor'
  );
$$;

-- 3) Replace patient / queue policies (pending accounts cannot touch PHI)
drop policy if exists patients_authenticated_all on public.patients;
create policy "patients_staff_approved"
  on public.patients for all
  using (public.is_staff_approved())
  with check (public.is_staff_approved());

drop policy if exists queue_authenticated_all on public.queue_entries;
create policy "queue_staff_approved"
  on public.queue_entries for all
  using (public.is_staff_approved())
  with check (public.is_staff_approved());

-- 4) Profiles: doctors can list everyone (for approvals UI); doctors can update any row (approve / reject role changes)
drop policy if exists profiles_update_own on public.profiles;

create policy "profiles_select_doctor_all"
  on public.profiles for select
  using (public.is_approved_doctor());

create policy "profiles_update_doctor_all"
  on public.profiles for update
  using (public.is_approved_doctor())
  with check (public.is_approved_doctor());

-- Any signed-in user may update their own row; trigger below blocks pending users from changing role/approval themselves.
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.profiles_pending_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.approval_status = 'pending' then
    if new.role is distinct from old.role or new.approval_status is distinct from old.approval_status then
      if not public.is_approved_doctor() then
        raise exception 'Only an approved doctor can approve accounts or change roles';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_pending_guard_trg on public.profiles;
create trigger profiles_pending_guard_trg
  before update on public.profiles
  for each row execute procedure public.profiles_pending_guard();

-- 5) New signups from the Clinic-OS staff form (metadata) → pending assistant/marketing.
--    Users created in the Supabase Dashboard (no signup_source) → approved doctor (bootstrap).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  src text;
  req text;
begin
  src := coalesce(new.raw_user_meta_data->>'signup_source', '');
  req := coalesce(new.raw_user_meta_data->>'requested_role', '');

  if src = 'clinic_staff' and req in ('assistant', 'marketing') then
    insert into public.profiles (id, email, role, approval_status)
    values (new.id, new.email, req, 'pending');
  else
    insert into public.profiles (id, email, role, approval_status)
    values (new.id, new.email, 'doctor', 'approved');
  end if;

  return new;
end;
$$;

comment on column public.profiles.approval_status is 'pending = awaiting doctor; approved = can use clinic data.';
