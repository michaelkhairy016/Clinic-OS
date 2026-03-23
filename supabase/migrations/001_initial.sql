-- Run this in the Supabase SQL Editor (or via CLI) after creating a project.
-- Creates profiles, patients, queue; RLS; and a trigger to attach a profile row to new auth users.

-- Extensions
create extension if not exists "pgcrypto";

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null check (role in ('doctor', 'assistant', 'marketing')),
  full_name text,
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Patients
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  patient_code text unique not null,
  full_name text not null,
  age int default 0,
  phone text default '',
  chronic_history text default '',
  referral_source text default ''
);

alter table public.patients enable row level security;

create policy "patients_authenticated_all"
  on public.patients for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Queue
create table if not exists public.queue_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  status text not null check (status in ('waiting', 'active', 'done')),
  queue_num int not null,
  visit_type text default '',
  payment text default '',
  check_in_time text default ''
);

create index if not exists queue_entries_status_idx on public.queue_entries (status);
create index if not exists queue_entries_patient_idx on public.queue_entries (patient_id);

alter table public.queue_entries enable row level security;

create policy "queue_authenticated_all"
  on public.queue_entries for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- New auth users get a profile (default assistant). Promote the clinic owner to doctor in SQL or the dashboard.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'assistant');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Service role / API route inserts for public intake bypass RLS automatically.

comment on table public.profiles is 'Clinic staff; role is set by trigger for new users (default assistant).';
comment on table public.patients is 'Patient demographics; PHI — protect with RLS and app policies.';
comment on table public.queue_entries is 'Visit queue; status active = patient currently with doctor.';
