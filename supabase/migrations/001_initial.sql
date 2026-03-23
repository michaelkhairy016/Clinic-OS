-- Run this in the Supabase SQL Editor (or via CLI) after creating a project.
-- Creates profiles, patients, queue; RLS; and a trigger to attach a profile row to new auth users.

-- Extensions
create extension if not exists "pgcrypto";

-- Profiles (1:1 with auth.users)
create table if not exists public.districts (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text
);

create table if not exists public.referral_sources (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text
);

create table if not exists public.pharma_companies (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text
);

create table if not exists public.medical_lines (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text
);

create table if not exists public.mr_visits (
  id uuid primary key default gen_random_uuid(),
  mr_name text not null,
  pharma_company_id uuid references public.pharma_companies(id),
  other_company_name text,
  medical_line_id uuid references public.medical_lines(id),
  other_line_name text,
  promoted_meds text, -- Or link to medication_master if you prefer
  notes text,
  clinic_id uuid references public.clinics(id),
  created_at timestamptz default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  action text not null,
  description text,
  metadata jsonb,
  created_at timestamptz default now()
);

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  role text default 'assistant' check (role in ('doctor', 'assistant', 'marketing')),
  approval_status text default 'pending' check (approval_status in ('pending', 'approved')),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Clinics & Price Lists
create table if not exists public.clinics (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  address_ar text,
  consultation_fee numeric default 0,
  followup_fee numeric default 0,
  created_at timestamptz default now()
);

-- Patients (Standardized & Expanded)
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  patient_code text unique not null,
  full_name text not null,
  age int default 0,
  phone text default '',
  chronic_history text default '',
  district_id uuid references public.districts(id),
  is_first_psych_visit boolean default true,
  previous_doctor text,
  referral_source_id uuid references public.referral_sources(id),
  is_vezeeta boolean default false,
  status text default 'active', -- active, archived
  created_at timestamptz default now()
);

-- Junction for Previous Medications
create table if not exists public.patient_previous_meds (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete cascade,
  medication_id uuid references public.medication_master(id) on delete cascade,
  created_at timestamptz default now()
);

alter table public.patients enable row level security;

create policy "patients_staff_approved"
  on public.patients for all
  using (auth.role() = 'authenticated');

-- Queue Entries
create table if not exists public.visit_types (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text,
  default_fee_type text check (default_fee_type in ('consultation', 'followup'))
);

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text,
  is_active boolean default true
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  amount numeric not null,
  category text, -- Rent, Electricity, Salaries, Other
  description text,
  clinic_id uuid references public.clinics(id),
  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

create table if not exists public.queue_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  clinic_id uuid references public.clinics (id) on delete set null,
  status text not null check (status in ('waiting', 'active', 'done')),
  queue_num int not null,
  visit_type_id uuid references public.visit_types(id),
  payment_method_id uuid references public.payment_methods(id),
  amount_paid numeric default 0,
  discount numeric default 0,
  is_vezeeta boolean default false,
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

-- Clinical Brain
create table if not exists public.medication_master (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  trade_name_en text not null,
  trade_name_ar text,
  generic_name_en text not null,
  category text,
  dose_form text default 'Pill'
);

create table if not exists public.frequency_dictionary (
  id uuid primary key default gen_random_uuid(),
  code_en text unique not null,
  label_ar text not null
);

alter table public.medication_master enable row level security;
alter table public.frequency_dictionary enable row level security;

create policy "meds_staff_approved" on public.medication_master for all using (auth.role() = 'authenticated');
create policy "freq_staff_approved" on public.frequency_dictionary for all using (auth.role() = 'authenticated');

-- Seed Districts
insert into public.districts (name_ar, name_en) values
  ('شبرا', 'Shoubra'),
  ('مصر الجديدة', 'Masr ElGedida'),
  ('مدينة نصر', 'Nasr City'),
  ('التجمع الخامس', 'New Cairo')
on conflict do nothing;

-- Seed Clinics (Specific)
insert into public.clinics (name_ar, address_ar, consultation_fee, followup_fee) values
  ('عيادة شبرا', 'القاهرة - شبرا', 500, 300),
  ('عيادة مصر الجديدة', 'القاهرة - مصر الجديدة', 600, 400)
on conflict do nothing;

-- Seed Referral Sources
insert into public.referral_sources (name_ar, name_en) values
  ('فيسبوك', 'Facebook'),
  ('بحث جوجل', 'Google Search'),
  ('تطبيق فيزيتا', 'Vezeeta'),
  ('ترشيح صديق / قريب', 'Friend / Relative'),
  ('أخرى', 'Other')
on conflict do nothing;

-- Config Seed
insert into public.visit_types (name_ar, name_en, default_fee_type) values
  ('كشف عادي', 'Normal Consultation', 'consultation'),
  ('استشارة طبية', 'Follow-up', 'followup'),
  ('جلسة نفسية مطولة', 'Long Psych. Session', 'consultation')
on conflict do nothing;

insert into public.payment_methods (name_ar, name_en) values
  ('كاش', 'Cash'),
  ('Instapay', 'Instapay'),
  ('فيزيتا (رصيد)', 'Vezeeta (Balance)'),
  ('فيزيتا (كاش بالعيادة)', 'Vezeeta (Cash at Clinic)')
on conflict do nothing;

-- Pharma Seed
insert into public.pharma_companies (name_ar, name_en) values
  ('نوفارتس', 'Novartis'),
  ('فايزر', 'Pfizer'),
  ('جلاكسو سميث كلاين', 'GSK'),
  ('سانوفي', 'Sanofi'),
  ('ايفا فارما', 'Eva Pharma'),
  ('أمون', 'Amoun')
on conflict do nothing;

insert into public.medical_lines (name_ar, name_en) values
  ('نفسية وعصبية', 'CNS / Psychiatry'),
  ('باطنة', 'Internal Medicine'),
  ('قلب وأوعية دموية', 'Cardiology')
on conflict do nothing;

-- Clinical Brain (Seed)
insert into public.medication_master (trade_name_en, trade_name_ar, generic_name_en, category) values
  ('Cipralex', 'سيبرالكس', 'Escitalopram', 'SSRI'),
  ('Seroquel', 'سيروكويل', 'Quetiapine', 'Antipsychotic'),
  ('Depakine', 'ديباكين', 'Valproate', 'Mood Stabilizer'),
  ('Lustral', 'لوسترال', 'Sertraline', 'SSRI')
on conflict do nothing;
