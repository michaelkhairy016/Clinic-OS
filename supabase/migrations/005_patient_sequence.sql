-- Clinic-OS v1.4: Patient Code Sequence
-- Atomic patient code generation to prevent race conditions

-- Create sequence for patient codes (starts at 1000 to maintain existing format P-1000+)
create sequence if not exists public.patient_code_seq
  start with 1000
  increment by 1
  no minvalue
  no maxvalue
  cache 1;

-- Function to get next patient code atomically
create or replace function public.get_next_patient_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_num integer;
  patient_code text;
  is_unique boolean;
begin
  -- Keep trying until we get a unique code (handles deleted patients)
  is_unique := false;
  while not is_unique loop
    next_num := nextval('public.patient_code_seq'::regclass);
    patient_code := 'P-' || next_num;

    -- Check if this code already exists
    select exists(
      select 1 from public.patients where patient_code = patient_code
    ) into is_unique;

    -- If code is unique, we're done
    if is_unique then
      exit;
    end if;
  end loop;

  return patient_code;
end;
$$;

-- Default value for patient_code column
alter table public.patients
  alter column patient_code set default public.get_next_patient_code();

-- Comment on sequence
comment on sequence public.patient_code_seq is 'Atomic sequence for generating unique patient codes in P-XXXX format';
