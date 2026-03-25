-- Clinic-OS v1.5: Patient Visit Workflow Tables
-- Add tables for QR-based patient visit system and verification workflow

-- Patient Visits Table
-- Tracks patient visits from QR code generation to completion
create table if not exists public.patient_visits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  patient_id uuid references public.patients(id) on delete set null,
  qr_code text not null unique, -- Unique QR code identifier
  status text not null check (status in ('qr_generated', 'form_submitted', 'verified', 'in_queue', 'completed')),
  form_data jsonb, -- JSON data from patient form
  verified_by uuid references public.profiles(id) on delete set null, -- Assistant who verified
  verified_at timestamptz,
  queue_entry_id uuid references public.queue_entries(id) on delete set null, -- Link to queue when added
  is_returning_patient boolean default false -- Flag for returning patients
);

-- Utility Payments Table
-- Tracks clinic utility payments and expenses
create table if not exists public.utility_payments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  amount numeric not null,
  category text not null check (category in ('rent', 'electricity', 'internet', 'supplies', 'maintenance', 'salary', 'other')),
  description text,
  paid_by uuid references public.profiles(id) on delete set null, -- Assistant who made payment
  verified_by uuid references public.profiles(id) on delete set null, -- Master account verification
  clinic_id uuid references public.clinics(id) on delete set null
);

-- Follow-ups Table (New for marketing)
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

-- Marketing Campaigns Table (New for marketing)
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

-- Satisfaction Scores Table (New for analytics)
create table if not exists public.satisfaction_scores (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  patient_id uuid references public.patients(id) on delete set null,
  rating numeric not null check (rating >= 1 and rating <= 5),
  feedback text,
  source text default 'in_person', -- 'in_person', 'email', 'phone', 'vezeeta'
  clinic_id uuid references public.clinics(id) on delete set null
);

-- Master Account Override Function
-- Allows master accounts to bypass normal restrictions
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

-- Update RLS policies to allow master account full access
drop policy if exists patient_visits_authenticated_all on public.patient_visits;
create policy "patient_visits_master_full" on public.patient_visits for all
  using (public.is_master_account())
  with check (public.is_master_account());

create policy "patient_visits_staff_approved" on public.patient_visits for all
  using (public.is_staff_approved())
  with check (public.is_staff_approved());

drop policy if exists utility_payments_authenticated_all on public.utility_payments;
create policy "utility_payments_master_full" on public.utility_payments for all
  using (public.is_master_account())
  with check (public.is_master_account());

create policy "utility_payments_staff_approved" on public.utility_payments for all
  using (public.is_staff_approved())
  with check (public.is_staff_approved());

-- Enable RLS
alter table public.patient_visits enable row level security;
alter table public.utility_payments enable row level security;
alter table public.follow_ups enable row level security;
alter table public.marketing_campaigns enable row level security;
alter table public.satisfaction_scores enable row level security;

-- RLS for new tables
create policy "follow_ups_master_full" on public.follow_ups for all
  using (public.is_master_account())
  with check (public.is_master_account());

create policy "follow_ups_staff_approved" on public.follow_ups for all
  using (public.is_staff_approved())
  with check (public.is_staff_approved());

create policy "marketing_campaigns_master_full" on public.marketing_campaigns for all
  using (public.is_master_account())
  with check (public.is_master_account());

create policy "marketing_campaigns_staff_approved" on public.marketing_campaigns for all
  using (public.is_staff_approved())
  with check (public.is_staff_approved());

create policy "satisfaction_scores_master_full" on public.satisfaction_scores for all
  using (public.is_master_account())
  with check (public.is_master_account());

create policy "satisfaction_scores_staff_approved" on public.satisfaction_scores for all
  using (public.is_staff_approved())
  with check (public.is_staff_approved());

-- Indexes for better query performance
create index if not exists idx_patient_visits_qr_code on public.patient_visits(qr_code);
create index if not exists idx_patient_visits_status on public.patient_visits(status);
create index if not exists idx_patient_visits_created_at on public.patient_visits(created_at desc);
create index if not exists idx_utility_payments_clinic on public.utility_payments(clinic_id);
create index if not exists idx_utility_payments_created_at on public.utility_payments(created_at desc);
create index if not exists idx_follow_ups_patient on public.follow_ups(patient_id);
create index if not exists idx_follow_ups_clinic_status on public.follow_ups(clinic_id, status);
create index if not exists idx_marketing_campaigns_clinic on public.marketing_campaigns(clinic_id);
create index if not exists idx_marketing_campaigns_status on public.marketing_campaigns(status);
create index if not exists idx_marketing_campaigns_dates on public.marketing_campaigns(start_date, end_date);
create index if not exists idx_satisfaction_scores_patient on public.satisfaction_scores(patient_id);
create index if not exists idx_satisfaction_scores_clinic on public.satisfaction_scores(clinic_id);
create index if not exists idx_satisfaction_scores_rating on public.satisfaction_scores(rating);

-- Comment on new functionality
comment on table public.patient_visits is 'QR-based patient visit workflow: QR generation → Form submission → Assistant verification → Queue addition → Completion';
comment on table public.utility_payments is 'Clinic utility payments tracking with master account verification override';
comment on table public.follow_ups is 'Patient follow-up management for marketing and patient retention';
comment on table public.marketing_campaigns is 'Marketing campaigns for social media, Vezeeta, referral programs';
comment on table public.satisfaction_scores is 'Patient satisfaction tracking for quality improvement';
comment on function public.is_master_account is 'Master accounts have full system access and can override normal restrictions';
