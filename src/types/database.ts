export type UserRole = 'doctor' | 'assistant' | 'marketing';

export type ApprovalStatus = 'pending' | 'approved';

export type ProfileRow = {
  id: string;
  email: string | null;
  role: UserRole;
  full_name: string | null;
  updated_at: string | null;
  approval_status: ApprovalStatus;
};

export type PatientRow = {
  id: string;
  created_at: string;
  patient_code: string;
  full_name: string;
  age: number | null;
  phone: string | null;
  chronic_history: string | null;
  district_id: string | null;
  is_first_psych_visit: boolean;
  previous_doctor: string | null;
  referral_source_id: string | null;
};

export type QueueStatus = 'waiting' | 'active' | 'done';

export interface QueueEntryRow {
  id: string;
  created_at: string;
  patient_id: string;
  clinic_id: string;
  status: 'waiting' | 'active' | 'done';
  queue_num: number;
  visit_type: string;
  payment_mode: 'cash' | 'instapay' | 'card';
  amount_paid: number;
  discount: number;
  check_in_time: string;
};

export type QueueWithPatient = QueueEntryRow & {
  patients: PatientRow | null;
};
