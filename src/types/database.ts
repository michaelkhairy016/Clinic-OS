export type UserRole = 'doctor' | 'assistant' | 'marketing' | 'master';

export type ApprovalStatus = 'pending' | 'approved';

export type ProfileRow = {
  id: string;
  email: string | null;
  role: UserRole;
  full_name: string | null;
  updated_at: string | null;
  approval_status: ApprovalStatus;
};

// Patient Visit Workflow Types
export type VisitStatus = 'qr_generated' | 'form_submitted' | 'verified' | 'in_queue' | 'completed';

export type PatientVisitRow = {
  id: string;
  created_at: string;
  updated_at: string | null;
  patient_id: string | null;
  qr_code: string; // Unique QR code identifier
  status: VisitStatus;
  form_data: any | null; // JSON data from patient form
  verified_by: string | null; // Assistant user ID who verified
  verified_at: string | null;
  queue_entry_id: string | null; // Link to queue when added
  is_returning_patient: boolean; // Flag for returning patients
};

// Prescription Workflow Types
export type DiagnosisCategory = 'depression' | 'anxiety' | 'bipolar' | 'schizophrenia' | 'adhd' | 'ocd' | 'ptsd' | 'other';

export type IntensityLevel = 'mild' | 'moderate' | 'severe';

export type MedicationCategory = 'antidepressant' | 'antipsychotic' | 'anxiolytic' | 'mood_stabilizer' | 'stimulant' | 'other';

export type PrescriptionStep = {
  step_number: number;
  diagnosis: DiagnosisCategory | null;
  intensity: IntensityLevel | null;
  category: MedicationCategory | null;
  medications: Array<{
    trade_name: string;
    generic_name: string;
    dose: string;
    frequency_ar: string;
    frequency_en: string;
    duration: string;
  }>;
  notes_ar: string; // Arabic clinical notes
  notes_en: string; // English clinical notes
};

// Payment Management Types
export type UtilityPayment = {
  id: string;
  created_at: string;
  amount: number;
  category: 'rent' | 'electricity' | 'internet' | 'supplies' | 'maintenance' | 'salary' | 'other';
  description: string | null;
  paid_by: string; // Assistant name
  verified_by: string | null; // Master account verification
  clinic_id: string | null;
};

export type PatientRow = {
  id: string;
  created_at: string;
  updated_at: string | null;
  patient_code: string;
  full_name: string;
  age: number | null;
  phone: string | null;
  chronic_history: string | null;
  district_id: string | null;
  is_first_psych_visit: boolean;
  previous_doctor: string | null;
  referral_source_id: string | null;
  is_vezeeta: boolean;
  status: string;
};

export type QueueStatus = 'waiting' | 'active' | 'done';

export interface QueueEntryRow {
  id: string;
  created_at: string;
  updated_at: string | null;
  patient_id: string;
  clinic_id: string;
  status: QueueStatus;
  queue_num: number;
  visit_type_id: string | null;
  payment_method_id: string | null;
  amount_paid: number;
  discount: number;
  is_vezeeta: boolean;
  check_in_time: string; // Fixed: now proper timestamptz in database
}

export type QueueWithPatient = QueueEntryRow & {
  patients: PatientRow | null;
};

// New clinical data types for v1.4
export type ClinicalNoteRow = {
  id: string;
  created_at: string;
  updated_at: string | null;
  queue_entry_id: string | null;
  diagnosis: string | null;
  clinical_notes: string | null;
  visit_type: string | null;
};

export type PrescriptionRow = {
  id: string;
  created_at: string;
  clinical_note_id: string | null;
  trade_name: string;
  generic_name: string;
  dose: string;
  frequency: string;
  duration: string;
};

export type VisitTypeRow = {
  id: string;
  name_ar: string;
  name_en: string | null;
  default_fee_type: 'consultation' | 'followup';
};

export type PaymentMethodRow = {
  id: string;
  name_ar: string;
  name_en: string | null;
  is_active: boolean;
};

export type MedicationMasterRow = {
  id: string;
  created_at: string;
  trade_name_en: string;
  trade_name_ar: string | null;
  generic_name_en: string | null;
  category: string | null;
};

export type DistrictRow = {
  id: string;
  name_ar: string;
  name_en: string | null;
};

export type ReferralSourceRow = {
  id: string;
  name_ar: string;
  name_en: string | null;
};

export type ExpenseRow = {
  id: string;
  created_at: string;
  amount: number;
  category: string;
  description: string | null;
  clinic_id: string | null;
};

export type PharmaCompanyRow = {
  id: string;
  name_ar: string;
  name_en: string | null;
};

export type MedicalLineRow = {
  id: string;
  name_ar: string;
  name_en: string | null;
};

export type MRVisitRow = {
  id: string;
  created_at: string;
  mr_name: string;
  pharma_company_id: string | null;
  other_company_name: string | null;
  medical_line_id: string | null;
  other_line_name: string | null;
  promoted_meds: string | null;
  notes: string | null;
  clinic_id: string | null;
};

// Marketing tables (migration 012)
export type ReferralSourceRow = {
  id: string;
  name_ar: string;
  name_en: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
};

export type FollowUpRow = {
  id: string;
  patient_id: string;
  clinic_id: string;
  follow_up_type: 'call' | 'visit' | 'message';
  scheduled_date: string;
  completed_date: string | null;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes: string | null;
  outcome: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type MarketingCampaignRow = {
  id: string;
  clinic_id: string;
  name: string;
  type: 'social' | 'vezeeta' | 'referral' | 'email' | 'other';
  message: string | null;
  start_date: string | null;
  end_date: string | null;
  status: 'draft' | 'active' | 'paused' | 'completed';
  budget: number | null;
  reach: number;
  conversions: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type SatisfactionScoreRow = {
  id: string;
  patient_id: string | null;
  clinic_id: string;
  rating: number;
  feedback: string | null;
  source: 'in_person' | 'phone' | 'vezeeta' | 'google' | 'other';
  would_recommend: boolean | null;
  created_at: string;
};
