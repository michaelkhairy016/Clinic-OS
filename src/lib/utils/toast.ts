import { toast } from 'sonner';

/**
 * Toast notification wrapper with bilingual support
 * Usage:
 *   showSuccess('Saved!', 'تم الحفظ!')
 *   showError('Failed to save', 'فشل الحفظ')
 *   showConfirm('Delete this?', () => handleDelete())
 */

export const showSuccess = (messageEn: string, messageAr?: string) => {
  toast.success(messageAr ? `${messageEn}\n${messageAr}` : messageEn);
};

export const showError = (messageEn: string, messageAr?: string) => {
  toast.error(messageAr ? `${messageEn}\n${messageAr}` : messageEn);
};

export const showInfo = (messageEn: string, messageAr?: string) => {
  toast.info(messageAr ? `${messageEn}\n${messageAr}` : messageEn);
};

export const showWarning = (messageEn: string, messageAr?: string) => {
  toast.warning(messageAr ? `${messageEn}\n${messageAr}` : messageEn);
};

export const showLoading = (messageEn: string, messageAr?: string) => {
  return toast.loading(messageAr ? `${messageEn}\n${messageAr}` : messageEn);
};

export const dismissToast = (toastId?: string | number) => {
  toast.dismiss(toastId);
};

export const showConfirm = (
  message: string,
  onConfirm: () => void,
  confirmText: string = 'Confirm'
) => {
  toast(message, {
    action: {
      label: confirmText,
      onClick: onConfirm,
    },
  });
};

// Export sonner's toast directly for advanced usage
export { toast };
