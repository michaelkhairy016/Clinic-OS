-- Supabase / Postgres Schema for Clinic-OS

CREATE TABLE clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  address TEXT,
  top_margin_cm NUMERIC,
  bottom_margin_cm NUMERIC,
  fees_json JSONB
);

CREATE TABLE medication_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_name_en TEXT NOT NULL,
  generic_name_en TEXT NOT NULL,
  category TEXT,
  dose_form TEXT NOT NULL -- Pill / Syrup
);

CREATE TABLE titration_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  med_id UUID REFERENCES medication_master(id) ON DELETE CASCADE,
  steps_jsonb JSONB NOT NULL -- e.g., [{ "day_range": "1-7", "dose_value": "5mg" }]
);

CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_code TEXT NOT NULL UNIQUE, -- e.g., P-10001
  full_name TEXT NOT NULL,
  phone TEXT,
  age INTEGER,
  chronic_history TEXT,
  living_district TEXT,
  is_first_psych_visit BOOLEAN,
  referral_source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE patient_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  changed_by UUID, -- Link to auth.users if possible
  previous_data JSONB NOT NULL,
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL -- 'booked' or 'arrived'
);

CREATE TABLE visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
  queue_num INTEGER NOT NULL,
  status TEXT NOT NULL,
  visit_type_id TEXT, -- Link to visit type if needed, for now just text
  payment_method TEXT,
  check_in_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
  drug_data_jsonb JSONB NOT NULL -- { "med_id": "...", "dose": "...", "freq_ar": "...", "duration": "..." }
);

-- Frequency Dictionary mapping standard Table / UI
CREATE TABLE frequency_dictionary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_en TEXT NOT NULL UNIQUE,
    label_ar TEXT NOT NULL
);

-- INSERT SEED DATA
INSERT INTO frequency_dictionary (code_en, label_ar) VALUES
('OD', 'مرة يومياً'),
('BD', 'مرتين يومياً'),
('TDS', 'ثلاث مرات يومياً'),
('QDS', 'أربع مرات يومياً');

INSERT INTO medication_master (trade_name_en, generic_name_en, category, dose_form) VALUES
('Cipralex', 'Escitalopram', 'SSRI', 'Pill'),
('Lustral', 'Sertraline', 'SSRI', 'Pill'),
('Prozac', 'Fluoxetine', 'SSRI', 'Pill'),
('Seroquel', 'Quetiapine', 'Atypical Antipsychotic', 'Pill'),
('Zyprexa', 'Olanzapine', 'Atypical Antipsychotic', 'Pill'),
('Depakine', 'Valproate', 'Mood Stabilizer', 'Pill'),
('Amotril', 'Clonazepam', 'Benzodiazepine', 'Pill'),
('Xanax', 'Alprazolam', 'Benzodiazepine', 'Pill');
