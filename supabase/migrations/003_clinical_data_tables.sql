-- Clinic-OS v1.4: Clinical Data Tables
-- Add tables for storing clinical notes and prescriptions

-- Clinical Notes Table
-- Stores diagnosis, clinical notes, and visit type for each patient visit
create table if not exists public.clinical_notes (
  id uuid primary key default gen_random_uuid(),
  queue_entry_id uuid references public.queue_entries(id) on delete cascade,
  diagnosis text,
  clinical_notes text,
  visit_type text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Prescriptions Table
-- Stores medication prescriptions linked to clinical notes
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

-- Enable Row Level Security
alter table public.clinical_notes enable row level security;
alter table public.prescriptions enable row level security;

-- RLS Policies for Clinical Notes
create policy "clinical_notes_staff_approved"
  on public.clinical_notes for all
  using (public.is_staff_approved())
  with check (public.is_staff_approved());

-- RLS Policies for Prescriptions
create policy "prescriptions_staff_approved"
  on public.prescriptions for all
  using (public.is_staff_approved())
  with check (public.is_staff_approved());

-- Automatic updated_at trigger for clinical_notes
create or replace function public.update_clinical_notes_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists clinical_notes_updated_at_trg on public.clinical_notes;
create trigger clinical_notes_updated_at_trg
  before update on public.clinical_notes
  for each row execute procedure public.update_clinical_notes_updated_at();

-- Indexes for better query performance
create index if not exists idx_clinical_notes_queue_entry on public.clinical_notes(queue_entry_id);
create index if not exists idx_prescriptions_clinical_note on public.prescriptions(clinical_note_id);
create index if not exists idx_clinical_notes_created_at on public.clinical_notes(created_at desc);
