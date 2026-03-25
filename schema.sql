-- Supabase / Postgres Schema for Clinic-OS v1.4
-- This schema matches the actual migrations and fixes identified issues

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
  patient_code text unique default public.get_next_patient_code(),
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
  created_at timestamptz default now(),
  updated_at timestamptz default now()
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
  queue_num int not null default public.get_next_queue_number(),
  visit_type_id uuid references public.visit_types(id),
  payment_method_id uuid references public.payment_methods(id),
  amount_paid numeric default 0,
  discount numeric default 0,
  is_vezeeta boolean default false,
  check_in_time timestamptz default now(), -- FIXED: was text, now proper timestamp
  updated_at timestamptz default now()
);

-- 6. CLINICAL DATA (New tables for v1.4)
create table if not exists public.clinical_notes (
  id uuid primary key default gen_random_uuid(),
  queue_entry_id uuid references public.queue_entries(id) on delete cascade,
  diagnosis text,
  clinical_notes text,
  visit_type text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  clinical_note_id uuid references public.clinical_notes(id) on delete cascade,
  trade_name text not null,
  generic_name text not null,
  dose text not null,
  frequency text not null,
  duration text not null,
  created_at timestamptz default now()
);

-- 7. FINANCE (Expenses)
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  amount numeric not null,
  category text, -- Rent, Electricity, Salaries, Other
  description text,
  clinic_id uuid references public.clinics(id),
  created_at timestamptz default now()
);

-- 8. MEDICAL REPRESENTATIVES (MR)
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

-- 9. CORE SYSTEM (Profiles)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  role text check (role in ('doctor', 'assistant', 'marketing', 'master')),
  approval_status text check (approval_status in ('pending', 'approved')),
  updated_at timestamptz default now()
);

-- 10. PATIENT VISIT WORKFLOW (New for v1.5)
create table if not exists public.patient_visits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  patient_id uuid references public.patients(id) on delete set null,
  qr_code text not null unique,
  status text not null check (status in ('qr_generated', 'form_submitted', 'verified', 'in_queue', 'completed')),
  form_data jsonb,
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  queue_entry_id uuid references public.queue_entries(id) on delete set null,
  is_returning_patient boolean default false
);

-- 11. UTILITY PAYMENTS (New for v1.5)
create table if not exists public.utility_payments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  amount numeric not null,
  category text not null check (category in ('rent', 'electricity', 'internet', 'supplies', 'maintenance', 'salary', 'other')),
  description text,
  paid_by uuid references public.profiles(id) on delete set null,
  verified_by uuid references public.profiles(id) on delete set null,
  clinic_id uuid references public.clinics(id) on delete set null
);

-- 12. AUDIT TRAIL
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  action text not null,
  description text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- 11. HELPER FUNCTIONS
create or replace function public.is_master_account()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'master'
      and p.approval_status = 'approved'
  );
$$;

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

-- 12. AUTH TRIGGER
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 13. RLS POLICIES
alter table public.profiles enable row level security;
create policy "Public Profiles" on public.profiles for select using (true);
create policy "Users update own" on public.profiles for update using (auth.uid() = id);
create policy "Profiles master full access" on public.profiles for all using (public.is_master_account());

alter table public.patients enable row level security;
create policy "Patients staff approved" on public.patients for all using (public.is_staff_approved());
create policy "Patients master full access" on public.patients for all using (public.is_master_account());

alter table public.queue_entries enable row level security;
create policy "Queue entries staff approved" on public.queue_entries for all using (public.is_staff_approved());
create policy "Queue entries master full access" on public.queue_entries for all using (public.is_master_account());

alter table public.clinical_notes enable row level security;
create policy "Clinical notes staff approved" on public.clinical_notes for all using (public.is_staff_approved());
create policy "Clinical notes master full access" on public.clinical_notes for all using (public.is_master_account());

alter table public.prescriptions enable row level security;
create policy "Prescriptions staff approved" on public.prescriptions for all using (public.is_staff_approved());
create policy "Prescriptions master full access" on public.prescriptions for all using (public.is_master_account());

alter table public.patient_visits enable row level security;
create policy "Patient visits master full access" on public.patient_visits for all using (public.is_master_account());
create policy "Patient visits staff approved" on public.patient_visits for all using (public.is_staff_approved());

alter table public.utility_payments enable row level security;
create policy "Utility payments master full access" on public.utility_payments for all using (public.is_master_account());
create policy "Utility payments staff approved" on public.utility_payments for all using (public.is_staff_approved());

-- 14. SEEDING (INITIAL DATA)
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

-- 15. MEDICATION MASTERS
insert into public.medication_master (trade_name_en, trade_name_ar, generic_name_en, category) values
  ('Cipralex', 'سيبرالكس', 'Escitalopram', 'SSRI'),
  ('Seroquel', 'سيروكويل', 'Quetiapine', 'Antipsychotic'),
  ('Depakine', 'ديباكين', 'Valproate', 'Mood Stabilizer'),
  ('Lustral', 'لوسترال', 'Sertraline', 'SSRI'),
  ('Prozac', 'بروزاك', 'Fluoxetine', 'SSRI'),
  ('Zyprexa', 'زيبريكسا', 'Olanzapine', 'Antipsychotic'),
  ('Xanax', 'زانكس', 'Alprazolam', 'Anxiolytic'),
  ('Amotril', 'اموتريل', 'Clonazepam', 'Anticonvulsant');

insert into public.frequency_dictionary (phrase_ar, phrase_en) values
  ('مرة يومياً', 'Once daily'),
  ('مرتين يومياً', 'Twice daily'),
  ('ثلاث مرات يومياً', 'Three times daily'),
  ('أربع مرات يومياً', 'Four times daily');

-- 16. AUTH TRIGGER (Updated for master accounts)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  src text;
  req text;
  is_master boolean;
begin
  src := coalesce(new.raw_user_meta_data->>'signup_source', '');
  req := coalesce(new.raw_user_meta_data->>'requested_role', '');
  is_master := coalesce(new.raw_user_meta_data->>'is_master', 'false')::boolean;

  if is_master then
    -- Master account creation (typically done manually in Supabase dashboard)
    insert into public.profiles (id, email, role, approval_status)
    values (new.id, new.email, 'master', 'approved');
  elsif src = 'clinic_staff' and req in ('assistant', 'marketing') then
    -- Staff signup from web form
    insert into public.profiles (id, email, role, approval_status)
    values (new.id, new.email, req, 'pending');
  else
    -- Doctor accounts (created directly in Supabase)
    insert into public.profiles (id, email, role, approval_status)
    values (new.id, new.email, 'doctor', 'approved');
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 13. INDEXES FOR NEW TABLES
create index if not exists idx_patient_visits_qr_code on public.patient_visits(qr_code);
create index if not exists idx_patient_visits_status on public.patient_visits(status);
create index if not exists idx_patient_visits_created_at on public.patient_visits(created_at desc);
create index if not exists idx_utility_payments_clinic on public.utility_payments(clinic_id);
create index if not exists idx_utility_payments_created_at on public.utility_payments(created_at desc);

-- 18. FOLLOW-UPS TABLE (New for marketing)
create table if not exists public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  patient_id uuid references public.patients(id) on delete set null,
  clinic_id uuid references public.clinics(id) on delete set null,
  follow_up_type text not null check (follow_up_type in ('call', 'visit', 'message')),
  notes text,
  scheduled_date timestamptz,
  status text not null check (status in ('scheduled', 'completed', 'cancelled')),
  completed_by uuid references public.profiles(id) on delete set null,
  completed_at timestamptz
);

-- 19. MARKETING CAMPAIGNS TABLE (New for marketing)
create table if not exists public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  type text not null check (type in ('social', 'vezeeta', 'referral', 'email')),
  message text,
  start_date timestamptz,
  end_date timestamptz,
  clinic_id uuid references public.clinics(id) on delete set null,
  status text not null check (status in ('active', 'paused', 'completed')),
  created_by uuid references public.profiles(id) on delete set null
);

-- 20. SATISFACTION SCORES TABLE (New for analytics)
create table if not exists public.satisfaction_scores (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  patient_id uuid references public.patients(id) on delete set null,
  rating numeric not null check (rating >= 1 and rating <= 5),
  feedback text,
  source text default 'in_person', -- 'in_person', 'email', 'phone', 'vezeeta'
  clinic_id uuid references public.clinics(id) on delete set null
);

-- 21. RLS FOR NEW TABLES
alter table public.follow_ups enable row level security;
create policy "Follow-ups master full access" on public.follow_ups for all using (public.is_master_account());
create policy "Follow-ups staff approved" on public.follow_ups for all using (public.is_staff_approved());

alter table public.marketing_campaigns enable row level security;
create policy "Marketing campaigns master full access" on public.marketing_campaigns for all using (public.is_master_account());
create policy "Marketing campaigns staff approved" on public.marketing_campaigns for all using (public.is_staff_approved());

alter table public.satisfaction_scores enable row level security;
create policy "Satisfaction scores master full access" on public.satisfaction_scores for all using (public.is_master_account());
create policy "Satisfaction scores staff approved" on public.satisfaction_scores for all using (public.is_staff_approved());
