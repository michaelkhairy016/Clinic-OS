-- Marketing Tables (Simplified - no follow-ups)

-- Drop if exists with wrong schema
DROP TABLE IF EXISTS referral_sources CASCADE;

-- Referral Sources (lookup table)
CREATE TABLE referral_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
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
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Patient Satisfaction Scores
CREATE TABLE IF NOT EXISTS satisfaction_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  source TEXT NOT NULL DEFAULT 'in_person' CHECK (source IN ('in_person', 'phone', 'vezeeta', 'google', 'other')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE referral_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE satisfaction_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "All authenticated can read referral_sources"
  ON referral_sources FOR SELECT TO authenticated USING (true);

CREATE POLICY "Clinic staff manage campaigns"
  ON marketing_campaigns FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor')
    OR clinic_id IN (SELECT clinic_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Clinic staff manage satisfaction"
  ON satisfaction_scores FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor')
    OR clinic_id IN (SELECT clinic_id FROM profiles WHERE id = auth.uid())
  );

-- Seed referral sources
INSERT INTO referral_sources (name_ar, name_en) VALUES
  ('توصية صديق', 'Friend Referral'),
  ('بحث جوجل', 'Google Search'),
  ('فيسبوك', 'Facebook'),
  ('انستجرام', 'Instagram'),
  ('فيزيتا', 'Vezeeta'),
  ('لوحة إعلان', 'Billboard'),
  ('أخرى', 'Other')
ON CONFLICT DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_clinic_id ON marketing_campaigns(clinic_id);
CREATE INDEX IF NOT EXISTS idx_satisfaction_scores_clinic_id ON satisfaction_scores(clinic_id);
