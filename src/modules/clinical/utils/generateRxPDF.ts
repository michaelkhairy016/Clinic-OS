import { jsPDF } from 'jspdf';
import { PatientRow } from '@/types/database';

type RxDrug = {
  trade_name: string;
  generic_name: string;
  dose: string;
  frequency: string;
  duration: string;
  trade_name_ar?: string; // Arabic trade name
};

/**
 * Generate Prescription PDF with Arabic Text Support
 * Uses basic font support for Arabic text rendering
 */
export const generateRxPDF = (patient: PatientRow, drugs: RxDrug[], doctorName: string = "Dr. Amgad Khairy Kamel") => {
  const doc = new jsPDF();

  // 1. Header (Professional Branding)
  doc.setTextColor(33, 94, 92); // var(--primary)
  doc.setFontSize(22);
  doc.text(doctorName, 105, 20, { align: 'center' });
  doc.setFontSize(14);
  doc.text("Clinic-OS Medical Prescription", 105, 30, { align: 'center' });

  doc.setDrawColor(226, 235, 235);
  doc.line(20, 35, 190, 35);

  // 2. Patient Info Section
  doc.setTextColor(26, 51, 50); // var(--text-dark)
  doc.setFontSize(12);
  doc.text(`Patient: ${patient.full_name}`, 20, 45);
  doc.text(`Age: ${patient.age || 'N/A'}`, 120, 45);
  doc.text(`Code: ${patient.patient_code}`, 20, 52);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 120, 52);

  doc.line(20, 58, 190, 58);

  // 3. The Rx List
  doc.setFontSize(18);
  doc.text("Rx", 20, 70);

  let currentY = 80;
  drugs.forEach((drug, index) => {
    // Medication Name (English)
    doc.setFontSize(12);
    doc.setTextColor(33, 94, 92);
    doc.text(`${index + 1}. ${drug.trade_name} (${drug.generic_name})`, 25, currentY);

    // Instruction - using Arabic labels from frequency dictionary
    doc.setTextColor(74, 102, 101);
    doc.setFontSize(10);

    // Format frequency in both Arabic and English
    const frequencyText = formatFrequency(drug.frequency);
    doc.text(`Dosage: ${drug.dose} --- ${frequencyText} --- Duration: ${drug.duration}`, 30, currentY + 7);

    currentY += 20;

    // Check for page overflow
    if (currentY > 270) {
      doc.addPage();
      currentY = 20;
    }
  });

  // 4. Footer with Arabic support
  doc.setFontSize(10);
  doc.setTextColor(143, 166, 165);
  doc.text("This is an electronically generated prescription. No signature required.", 105, 285, { align: 'center' });
  doc.text("Powered by Clinic-OS | وصفة طبية", 105, 290, { align: 'center' });

  // Save PDF
  doc.save(`Rx_${patient.patient_code}_${new Date().getTime()}.pdf`);
};

/**
 * Format frequency with Arabic translation
 * Maps English frequency codes to Arabic labels
 */
const formatFrequency = (frequency: string): string => {
  const frequencyMap: Record<string, { ar: string; en: string }> = {
    'OD': { ar: 'مرة يومياً', en: 'Once daily' },
    'BD': { ar: 'مرتين يومياً', en: 'Twice daily' },
    'TDS': { ar: 'ثلاث مرات يومياً', en: 'Three times daily' },
    'QDS': { ar: 'أربع مرات يومياً', en: 'Four times daily' },
    'PRN': { ar: 'عند الحاجة', en: 'As needed' },
    'QID': { ar: 'كل 6 ساعات', en: 'Every 6 hours' },
    'Q4H': { ar: 'كل 4 ساعات', en: 'Every 4 hours' },
    'HS': { ar: 'وقت النوم', en: 'At bedtime' },
    'AC': { ar: 'قبل الأكل', en: 'Before meals' },
    'PC': { ar: 'بعد الأكل', en: 'After meals' },
  };

  // Check if frequency is a standard code
  const standardFreq = frequencyMap[frequency.toUpperCase()];
  if (standardFreq) {
    return `${standardFreq.en} (${standardFreq.ar})`;
  }

  // If it's a custom frequency, return as-is
  return frequency;
};

/**
 * Alternative: Simple Arabic text rendering note
 * For better Arabic support, consider using:
 * - jspdf-autotable for RTL tables
 * - Custom Arabic font files loaded into jsPDF
 * - PDF-lib or react-pdf libraries with better RTL support
 *
 * Current implementation provides basic Arabic labels alongside English
 */
