-- Clinic-OS v1.4: Queue Number Sequence
-- Atomic queue number generation to prevent race conditions

-- Create sequence for queue numbers
create sequence if not exists public.queue_number_seq
  start with 1
  increment by 1
  no minvalue
  no maxvalue
  cache 1;

-- Function to get next queue number atomically
create or replace function public.get_next_queue_number()
returns integer
language sql
security definer
set search_path = public
as $$
  select nextval('public.queue_number_seq'::regclass);
$$;

-- Reset queue number function (to be called daily if needed)
create or replace function public.reset_queue_number()
returns integer
language plpgsql
security definer
set search_path = public
as $$
begin
  perform setval('public.queue_number_seq'::regclass, 1, false);
  return 1;
end;
$$;

-- Comment on sequence
comment on sequence public.queue_number_seq is 'Atomic sequence for generating unique queue numbers to prevent race conditions during concurrent check-ins';
