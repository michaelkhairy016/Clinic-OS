-- Fix for "column reference patient_code is ambiguous" error
-- The bug was in line 32: patient_code = patient_code compared column to itself
-- Run this in Supabase SQL Editor

-- Drop the old function
DROP FUNCTION IF EXISTS public.get_next_patient_code();

-- Create the fixed function
create or replace function public.get_next_patient_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_num integer;
  v_patient_code text;  -- Renamed variable to avoid ambiguity
  is_unique boolean;
begin
  -- Keep trying until we get a unique code (handles deleted patients)
  is_unique := false;
  while not is_unique loop
    next_num := nextval('public.patient_code_seq'::regclass);
    v_patient_code := 'P-' || next_num;

    -- Check if this code already exists (FIXED: qualified column name)
    select not exists(
      select 1 from public.patients p where p.patient_code = v_patient_code
    ) into is_unique;

    -- If code is unique, we're done
    if is_unique then
      exit;
    end if;
  end loop;

  return v_patient_code;
end;
$$;

-- Verify the fix
SELECT public.get_next_patient_code();
