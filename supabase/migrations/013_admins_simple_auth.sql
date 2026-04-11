-- 013_admins_simple_auth.sql
-- Replace Supabase GoTrue auth with a simple custom admins table.
-- All RLS policies that rely on auth.uid() are replaced with open anon policies —
-- access control is enforced at the application layer (AuthContext + role gating).

-- -----------------------------------------------------------------------
-- 1. admins table (source of truth for login credentials and roles)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admins (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text        UNIQUE NOT NULL,
  full_name       text,
  password        text        NOT NULL,
  role            text        NOT NULL CHECK (role IN ('doctor', 'assistant', 'marketing', 'master')),
  approval_status text        NOT NULL DEFAULT 'pending'
                              CHECK (approval_status IN ('pending', 'approved')),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Block ALL direct client access. Only API routes using the service-role key
-- can read or write this table. Passwords never reach the browser.
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_service_role_only" ON public.admins FOR ALL USING (false);

-- -----------------------------------------------------------------------
-- 2. user_presence — drop FK to auth.users (GoTrue no longer used).
--    user_id will now logically reference admins.id by convention.
-- -----------------------------------------------------------------------
ALTER TABLE public.user_presence
  DROP CONSTRAINT IF EXISTS user_presence_user_id_fkey;

-- -----------------------------------------------------------------------
-- 3. Relax RLS on all data tables to allow the anon role full access.
--    A dynamic loop drops every existing policy per table, then a single
--    permissive policy is recreated so all existing data queries continue
--    working with the browser Supabase client (anon key, no GoTrue session).
-- -----------------------------------------------------------------------

-- Helper: drop all policies on a table
CREATE OR REPLACE FUNCTION pg_temp.drop_all_policies(tbl text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE pol text;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = tbl AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, tbl);
  END LOOP;
END $$;

-- profiles
SELECT pg_temp.drop_all_policies('profiles');
CREATE POLICY "profiles_open" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- patients
SELECT pg_temp.drop_all_policies('patients');
CREATE POLICY "patients_open" ON public.patients FOR ALL USING (true) WITH CHECK (true);

-- queue_entries
SELECT pg_temp.drop_all_policies('queue_entries');
CREATE POLICY "queue_entries_open" ON public.queue_entries FOR ALL USING (true) WITH CHECK (true);

-- clinical_notes
SELECT pg_temp.drop_all_policies('clinical_notes');
CREATE POLICY "clinical_notes_open" ON public.clinical_notes FOR ALL USING (true) WITH CHECK (true);

-- prescriptions
SELECT pg_temp.drop_all_policies('prescriptions');
CREATE POLICY "prescriptions_open" ON public.prescriptions FOR ALL USING (true) WITH CHECK (true);

-- patient_visits
SELECT pg_temp.drop_all_policies('patient_visits');
CREATE POLICY "patient_visits_open" ON public.patient_visits FOR ALL USING (true) WITH CHECK (true);

-- utility_payments
SELECT pg_temp.drop_all_policies('utility_payments');
CREATE POLICY "utility_payments_open" ON public.utility_payments FOR ALL USING (true) WITH CHECK (true);

-- follow_ups
SELECT pg_temp.drop_all_policies('follow_ups');
CREATE POLICY "follow_ups_open" ON public.follow_ups FOR ALL USING (true) WITH CHECK (true);

-- marketing_campaigns
SELECT pg_temp.drop_all_policies('marketing_campaigns');
CREATE POLICY "marketing_campaigns_open" ON public.marketing_campaigns FOR ALL USING (true) WITH CHECK (true);

-- satisfaction_scores
SELECT pg_temp.drop_all_policies('satisfaction_scores');
CREATE POLICY "satisfaction_scores_open" ON public.satisfaction_scores FOR ALL USING (true) WITH CHECK (true);

-- referral_sources
SELECT pg_temp.drop_all_policies('referral_sources');
CREATE POLICY "referral_sources_open" ON public.referral_sources FOR ALL USING (true) WITH CHECK (true);

-- user_presence
SELECT pg_temp.drop_all_policies('user_presence');
CREATE POLICY "user_presence_open" ON public.user_presence FOR ALL USING (true) WITH CHECK (true);

-- audit_logs (enable RLS if not already, then open)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
SELECT pg_temp.drop_all_policies('audit_logs');
CREATE POLICY "audit_logs_open" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

-- expenses (enable RLS if not already, then open)
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
SELECT pg_temp.drop_all_policies('expenses');
CREATE POLICY "expenses_open" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

-- clinics, visit_types, payment_methods, districts, medication_master,
-- frequency_dictionary, pharma_companies, medical_lines, mr_visits,
-- patient_previous_meds — open up or disable RLS (these are low-sensitivity)
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'clinics','visit_types','payment_methods','districts',
    'medication_master','frequency_dictionary',
    'pharma_companies','medical_lines','mr_visits','patient_previous_meds',
    'referral_sources'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END $$;

-- -----------------------------------------------------------------------
-- 4. Index for fast email lookups on admins
-- -----------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(email);
