-- Marketing and Feedback Tables

-- Referral Sources (lookup table)
CREATE TABLE IF NOT EXISTS referral_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add referral_source_id to patients if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'referral_source_id'
  ) THEN
    ALTER TABLE patients ADD COLUMN referral_source_id UUID REFERENCES referral_sources(id);
  END IF;
END $$;

-- Follow-ups for patient retention
CREATE TABLE IF NOT EXISTS follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  follow_up_type TEXT NOT NULL CHECK (follow_up_type IN ('call', 'visit', 'message')),
  scheduled_date TIMESTAMPTZ NOT NULL,
  completed_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  outcome TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Marketing Campaigns
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('social', 'vezeeta', 'referral', 'email', 'other')),
  message TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  budget DECIMAL(10,2),
  reach INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Patient Satisfaction Scores
CREATE TABLE IF NOT EXISTS satisfaction_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  source TEXT NOT NULL DEFAULT 'in_person' CHECK (source IN ('in_person', 'phone', 'vezeeta', 'google', 'other')),
  would_recommend BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE referral_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE satisfaction_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_sources (read-only for all authenticated)
CREATE POLICY "All authenticated can read referral_sources"
  ON referral_sources FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for follow_ups
CREATE POLICY "Doctors can manage all follow_ups"
  ON follow_ups FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor')
    OR clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for marketing_campaigns
CREATE POLICY "Clinic staff can manage campaigns"
  ON marketing_campaigns FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor')
    OR clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for satisfaction_scores
CREATE POLICY "Clinic staff can manage satisfaction"
  ON satisfaction_scores FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor')
    OR clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Seed referral sources
INSERT INTO referral_sources (name_ar, name_en, description) VALUES
  ('توصية صديق', 'Friend Referral', 'Referred by a friend or family member'),
  ('بحث جوجل', 'Google Search', 'Found via Google search'),
  ('فيسبوك', 'Facebook', 'Found via Facebook'),
  ('انستجرام', 'Instagram', 'Found via Instagram'),
  ('فيزيتا', 'Vezeeta', 'Booked through Vezeeta platform'),
  ('وصل', 'Vezeeta', 'Booked through Vezeeta'),
  ('لوحة إعلان', 'Billboard', 'Saw a billboard advertisement'),
  ('أخرى', 'Other', 'Other sources')
ON CONFLICT DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_follow_ups_clinic_id ON follow_ups(clinic_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_patient_id ON follow_ups(patient_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_scheduled_date ON follow_ups(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_clinic_id ON marketing_campaigns(clinic_id);
CREATE INDEX IF NOT EXISTS idx_satisfaction_scores_clinic_id ON satisfaction_scores(clinic_id);
CREATE INDEX IF NOT EXISTS idx_satisfaction_scores_rating ON satisfaction_scores(rating);
CREATE INDEX IF NOT EXISTS idx_patients_referral_source ON patients(referral_source_id);

COMMENT ON TABLE referral_sources IS 'Lookup table for patient referral sources';
COMMENT ON TABLE follow_ups IS 'Patient follow-up scheduling and tracking';
COMMENT ON TABLE marketing_campaigns IS 'Marketing campaign management';
COMMENT ON TABLE satisfaction_scores IS 'Patient satisfaction and feedback collection';
