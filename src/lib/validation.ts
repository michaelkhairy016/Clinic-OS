/**
 * Form Validation Utilities
 * Provides validation functions for all forms in Clinic-OS
 */

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate patient form data
 */
export function validatePatientForm(data: {
  fullName?: string;
  age?: string;
  phone?: string;
  districtId?: string;
  sourceId?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  // Full name validation
  if (!data.fullName || data.fullName.trim().length < 3) {
    errors.fullName = 'الاسم يجب أن يكون 3 أحرف على الأقل (Name must be at least 3 characters)';
  }

  // Age validation
  if (!data.age) {
    errors.age = 'العمر مطلوب (Age is required)';
  } else {
    const ageNum = parseInt(data.age);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
      errors.age = 'العمر يجب أن يكون بين 0-120 (Age must be between 0-120)';
    }
  }

  // Phone validation (basic format)
  if (!data.phone || data.phone.trim().length < 10) {
    errors.phone = 'رقم الموبايل يجب أن يكون 10 أرقام على الأقل (Mobile must be at least 10 digits)';
  }

  // District validation
  if (!data.districtId) {
    errors.districtId = 'المنطقة مطلوبة (District is required)';
  }

  // Source validation
  if (!data.sourceId) {
    errors.sourceId = 'المصدر مطلوب (Source is required)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate queue check-in data
 */
export function validateQueueCheckIn(data: {
  patientId?: string;
  searchName?: string;
  visitTypeId?: string;
  paymentMethodId?: string;
  amountPaid?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  // Either patient ID or search name required
  if (!data.patientId && (!data.searchName || data.searchName.trim().length < 3)) {
    errors.patient = 'يجب اختيار مريض أو البحث عن اسم (Must select patient or search by name)';
  }

  // Visit type validation
  if (!data.visitTypeId) {
    errors.visitType = 'نوع الزيارة مطلوب (Visit type is required)';
  }

  // Payment method validation
  if (!data.paymentMethodId) {
    errors.paymentMethod = 'طريقة الدفع مطلوبة (Payment method is required)';
  }

  // Amount validation
  if (!data.amountPaid) {
    errors.amountPaid = 'المبلغ المطلوب (Amount is required)';
  } else {
    const amountNum = parseFloat(data.amountPaid);
    if (isNaN(amountNum) || amountNum < 0) {
      errors.amountPaid = 'المبلغ يجب أن يكون رقم صحيح (Amount must be a valid number)';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate clinical notes
 */
export function validateClinicalNotes(data: {
  diagnosis?: string;
  clinicalNotes?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  // Diagnosis is optional but if provided, must be meaningful
  if (data.diagnosis && data.diagnosis.trim().length < 3) {
    errors.diagnosis = 'التشخيص يجب أن يكون 3 أحرف على الأقل (Diagnosis must be at least 3 characters)';
  }

  // Clinical notes are required for completed visits
  if (!data.clinicalNotes || data.clinicalNotes.trim().length < 10) {
    errors.clinicalNotes = 'الملاحظات السريرية مطلوبة (Clinical notes are required, minimum 10 characters)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate prescription data
 */
export function validatePrescription(drug: {
  tradeName?: string;
  genericName?: string;
  dose?: string;
  frequency?: string;
  duration?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  // Trade name validation
  if (!drug.tradeName || drug.tradeName.trim().length < 2) {
    errors.tradeName = 'اسم الدواء التجاري مطلوب (Trade name is required)';
  }

  // Generic name validation
  if (!drug.genericName || drug.genericName.trim().length < 2) {
    errors.genericName = 'اسم الدواء العلمي مطلوب (Generic name is required)';
  }

  // Dose validation
  if (!drug.dose || drug.dose.trim().length < 1) {
    errors.dose = 'الجرعة مطلوبة (Dose is required)';
  }

  // Frequency validation
  if (!drug.frequency || drug.frequency.trim().length < 1) {
    errors.frequency = 'التكرار مطلوب (Frequency is required)';
  }

  // Duration validation
  if (!drug.duration || drug.duration.trim().length < 1) {
    errors.duration = 'المدة مطلوبة (Duration is required)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate expense entry
 */
export function validateExpense(data: {
  amount?: string;
  category?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  // Amount validation
  if (!data.amount) {
    errors.amount = 'المبلغ مطلوب (Amount is required)';
  } else {
    const amountNum = parseFloat(data.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      errors.amount = 'المبلغ يجب أن يكون رقم صحيح أكبر من صفر (Amount must be a valid number greater than 0)';
    }
  }

  // Category validation
  if (!data.category || data.category.trim().length < 2) {
    errors.category = 'الفئة مطلوبة (Category is required)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Sanitize phone number
 */
export function sanitizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, ''); // Remove all non-numeric characters
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format error message for display
 */
export function formatValidationErrors(errors: Record<string, string>): string {
  const errorMessages = Object.values(errors);
  return errorMessages.length > 0
    ? errorMessages.join('\n')
    : '';
}
