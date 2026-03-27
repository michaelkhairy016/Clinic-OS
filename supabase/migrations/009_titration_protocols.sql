-- Clinic-OS: Titration Protocols Table
-- Stores drug titration schedules for gradual dose adjustments

create table if not exists public.titration_protocols (
  id uuid primary key default gen_random_uuid(),
  medication_name text not null,
  start_dose text not null,
  target_dose text not null,
  increment_step text not null,
  days_per_step int default 7,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.titration_protocols enable row level security;

-- RLS Policies
create policy "titration_protocols_staff_approved"
  on public.titration_protocols for all
  using (public.is_staff_approved())
  with check (public.is_staff_approved());

-- Indexes
create index if not exists idx_titration_medication on public.titration_protocols(medication_name);

-- Seed some common titration protocols
insert into public.titration_protocols (medication_name, start_dose, target_dose, increment_step, days_per_step, notes) values
  ('Cipralex (Escitalopram)', '5mg', '20mg', '5mg', 7, 'Start low, increase weekly if tolerated'),
  ('Seroquel (Quetiapine)', '25mg', '300mg', '25-50mg', 3, 'Increase every 2-3 days until therapeutic dose'),
  ('Depakine (Valproate)', '200mg', '1000mg', '200mg', 7, 'Check blood levels at target dose'),
  ('Zoloft (Sertraline)', '25mg', '200mg', '25mg', 7, 'Standard SSRI titration protocol'),
  ('Xanax (Alprazolam)', '0.25mg', '0.5mg TID', '0.125mg', 5, 'Use shortest duration possible'),
  ('Lamictal (Lamotrigine)', '25mg', '200mg', '25mg', 14, 'SLOW titration to avoid rash - increase every 2 weeks');
