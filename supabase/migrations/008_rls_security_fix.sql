-- Fix RLS Security Vulnerability + Add Rejection Support
-- Run this in Supabase SQL Editor

-- 1. Drop the dangerous public policy that allows anon to read ALL profiles
DROP POLICY IF EXISTS "Public Profiles" ON public.profiles;

-- 2. Create secure policy: authenticated users can read profiles
-- Doctors can read all profiles, others can only read their own
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT
  USING (
    auth.role() = 'authenticated' AND (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'doctor'
        AND p.approval_status = 'approved'
      )
      OR auth.uid() = id
    )
  );

-- 3. Add rejection capability to approval_status
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_approval_status_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_approval_status_check
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- 4. Add rejection reason column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 5. Add unique constraint on patient phone numbers
ALTER TABLE public.patients
  DROP CONSTRAINT IF EXISTS patients_phone_unique;

ALTER TABLE public.patients
  ADD CONSTRAINT patients_phone_unique UNIQUE (phone);

-- 6. Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_patients_phone ON public.patients(phone);
CREATE INDEX IF NOT EXISTS idx_queue_entries_clinic_status ON public.queue_entries(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_profiles_approval_status ON public.profiles(approval_status);
