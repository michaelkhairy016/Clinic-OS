-- Clinic-OS v1.3: Total Clinical ERP Schema
-- Doctor: Dr. Amgad Khairy Kamel

-- 1. REFERENCE TABLES (Fixed Data)
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

create table if not exists public.clinics (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text,
  address_ar text,
  address_en text,
  consultation_fee numeric not null default 500,
  followup_fee numeric not null default 300,
  created_at timestamptz default now()
);

-- 2. CONFIGURATION TABLES (Dynamic Settings)
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

-- 3. CLINICAL BRAIN (Medical Masters)
create table if not exists public.medication_master (
  id uuid primary key default gen_random_uuid(),
  trade_name_en text not null,
  trade_name_ar text,
  generic_name_en text,
  category text, -- SSRI, Antipsychotic, etc.
  created_at timestamptz default now()
);

create table if not exists public.frequency_dictionary (
  id uuid primary key default gen_random_uuid(),
  phrase_ar text not null,
  phrase_en text,
  created_at timestamptz default now()
);

-- 4. PATIENTS & HISTORY
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  patient_code text unique,
  full_name text not null,
  age int,
  phone text,
  chronic_history text,
  district_id uuid references public.districts(id),
  referral_source_id uuid references public.referral_sources(id),
  is_first_psych_visit boolean default true,
  previous_doctor text,
  is_vezeeta boolean default false,
  status text default 'active',
  created_at timestamptz default now()
);

create table if not exists public.patient_previous_meds (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete cascade,
  medication_id uuid references public.medication_master(id) on delete cascade,
  created_at timestamptz default now()
);

-- 5. OPERATIONS & QUEUE
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
  check_in_time text,
  updated_at timestamptz default now()
);

-- 6. FINANCE (Expenses)
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  amount numeric not null,
  category text, -- Rent, Electricity, Salaries, Other
  description text,
  clinic_id uuid references public.clinics(id),
  created_at timestamptz default now()
);

-- 7. MEDICAL REPRESENTATIVES (MR)
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
  promoted_meds text,
  notes text,
  clinic_id uuid references public.clinics(id),
  created_at timestamptz default now()
);

-- 8. CORE SYSTEM (Profiles)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  role text check (role in ('doctor', 'assistant', 'marketing')),
  approval_status text check (approval_status in ('pending', 'approved')),
  updated_at timestamptz default now()
);

-- 9. AUDIT TRAIL
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  action text not null,
  description text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- RLS POLICIES (Simplified for Internal Use)
alter table public.profiles enable row level security;
create policy "Public Profiles" on public.profiles for select using (true);
create policy "Users update own" on public.profiles for update using (auth.uid() = id);

alter table public.patients enable row level security;
create policy "Authenticated access" on public.patients for all using (auth.role() = 'authenticated');

alter table public.queue_entries enable row level security;
create policy "Authenticated queue" on public.queue_entries for all using (auth.role() = 'authenticated');

-- SEEDING (INITIAL DATA)
insert into public.clinics (name_ar, name_en, consultation_fee, followup_fee) values
  ('فرع شبرا', 'Shoubra Branch', 500, 300),
  ('فرع مصر الجديدة', 'Masr ElGedida Branch', 600, 400);

insert into public.visit_types (name_ar, name_en, default_fee_type) values
  ('كشف عادي', 'Normal Consultation', 'consultation'),
  ('استشارة طبية', 'Follow-up', 'followup'),
  ('جلسة نفسية مطولة', 'Long Psych. Session', 'consultation');

insert into public.payment_methods (name_ar, name_en) values
  ('كاش', 'Cash'),
  ('Instapay', 'Instapay'),
  ('فيزيتا (رصيد)', 'Vezeeta (Balance)'),
  ('فيزيتا (كاش بالعيادة)', 'Vezeeta (Cash at Clinic)');

insert into public.districts (name_ar, name_en) values
  ('شبرا', 'Shoubra'), ('مصر الجديدة', 'Heliopolis'), ('مدينة نصر', 'Nasr City'), ('المعادي', 'Maadi');

insert into public.referral_sources (name_ar, name_en) values
  ('فيزيتا (Vezeeta)', 'Vezeeta'), ('فيسبوك', 'Facebook'), ('جوجل', 'Google Search'), ('صديق', 'Word of Mouth');

insert into public.pharma_companies (name_ar, name_en) values
  ('نوفارتس', 'Novartis'), ('فايزر', 'Pfizer'), ('جلاكسو', 'GSK'), ('إيفا فارما', 'Eva Pharma');

insert into public.medical_lines (name_ar, name_en) values
  ('نفسية وعصبية', 'Psychiatry / CNS'), ('باطنة', 'Internal Med');

-- 10. AUTH TRIGGERS
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, approval_status)
  values (new.id, new.email, 'assistant', 'pending');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 11. CLINICAL BRAIN SEEDING
insert into public.medication_master (trade_name_en, trade_name_ar, generic_name_en, category) values
  ('Cipralex', 'سيبرالكس', 'Escitalopram', 'SSRI'),
  ('Seroquel', 'سيروكويل', 'Quetiapine', 'Antipsychotic'),
  ('Depakine', 'ديباكين', 'Valproate', 'Mood Stabilizer'),
  ('Lustral', 'لوسترال', 'Sertraline', 'SSRI'),
  ('Prozac', 'بروزاك', 'Fluoxetine', 'SSRI'),
  ('Zyprexa', 'زيبريكسا', 'Olanzapine', 'Antipsychotic'),
  ('Xanax', 'زانكس', 'Alprazolam', 'Anxiolytic'),
  ('Amotril', 'اموتريل', 'Clonazepam', 'Anticonvulsant');
