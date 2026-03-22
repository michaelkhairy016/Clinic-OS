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
  code: string;
  name: string;
  age: number | null;
  phone: string | null;
  history: string | null;
  referral_source: string | null;
};

export type QueueStatus = 'waiting' | 'active' | 'done';

export type QueueEntryRow = {
  id: string;
  created_at: string;
  patient_id: string;
  status: QueueStatus;
  queue_num: number;
  visit_type: string;
  payment: string;
  check_in_time: string;
};

export type QueueWithPatient = QueueEntryRow & {
  patients: PatientRow | null;
};
