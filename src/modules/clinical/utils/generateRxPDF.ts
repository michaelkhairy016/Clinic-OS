import { jsPDF } from 'jspdf';
import { PatientRow } from '@/types/database';

type RxDrug = {
  trade_name: string;
  generic_name: string;
  dose: string;
  frequency: string;
  duration: string;
  trade_name_ar?: string;
};

// Arabic frequency translations
const frequencyArabic: Record<string, string> = {
  'OD': 'مرة يومياً',
  'QD': 'مرة يومياً',
  'BID': 'مرتين يومياً',
  'TID': 'ثلاث مرات يومياً',
  'QID': 'أربع مرات يومياً',
  'QHS': 'قبل النوم',
  'HS': 'وقت النوم',
  'QOD': 'يوم بعد يوم',
  'PRN': 'عند الحاجة',
  'AC': 'قبل الأكل',
  'PC': 'بعد الأكل',
  'STAT': 'فوراً',
  'Q4H': 'كل 4 ساعات',
  'Q6H': 'كل 6 ساعات',
  'Q8H': 'كل 8 ساعات',
  'Q12H': 'كل 12 ساعة',
};

// Arabic duration translations
const getArabicDuration = (duration: string): string => {
  const map: Record<string, string> = {
    '3 days': '3 أيام',
    '5 days': '5 أيام',
    '1 week': 'أسبوع',
    '2 weeks': 'أسبوعين',
    '3 weeks': '3 أسابيع',
    '1 month': 'شهر',
    '2 months': 'شهرين',
    '3 months': '3 أشهر',
    '6 months': '6 أشهر',
    'Ongoing': 'استمرار',
  };
  return map[duration] || duration;
};

/**
 * Generate Prescription PDF - With template background support
 * Medicine name in English, instructions in Arabic RTL
 *
 * To use your PDF template as background:
 * 1. Convert Prescription PDF.pdf to PNG image
 * 2. Place it in public/prescription-template.png
 * 3. Set useTemplateBackground: true when calling this function
 */
export const generateRxPDF = async (
  patient: PatientRow,
  drugs: RxDrug[],
  doctorName: string = "Dr. Amgad Khairy Kamel",
  diagnosis: string = "",
  severity?: 'mild' | 'moderate' | 'severe',
  useTemplateBackground: boolean = false
) => {
  const doc = new jsPDF();
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;

  let y = 15;

  // If using template background, load and apply it
  if (useTemplateBackground) {
    try {
      // The template should be placed at public/prescription-template.png
      // You need to convert your PDF to PNG first
      const templatePath = '/prescription-template.png';

      // For now, we'll proceed without the template if it doesn't load
      // In production, you'd preload this image
      console.log('Template background mode - ensure prescription-template.png exists in public folder');
    } catch (err) {
      console.warn('Template background not loaded, using default header');
    }
  }

  // ========== HEADER (skip if using template) ==========
  if (!useTemplateBackground) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(doctorName, pageWidth / 2, y, { align: 'center' });
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text("M.B.B.Ch, M.Sc. Psychiatry", pageWidth / 2, y, { align: 'center' });
    y += 5;

    doc.setFontSize(9);
    doc.text("250 Teraa Elbolakya St., Shoubra, Cairo", pageWidth / 2, y, { align: 'center' });
    y += 4;

    doc.setTextColor(80, 80, 80);
    doc.text("Tel: 0100 100 6013 / 0122 326 1827", pageWidth / 2, y, { align: 'center' });
    y += 6;

    // Header line
    doc.setDrawColor(0, 100, 100);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;
  } else {
    // When using template, start writing in the prescription area
    // Adjust this value based on your template's header height
    y = 65; // Skip past the template header area
  }

  // ========== PATIENT INFO ==========
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const today = new Date();
  const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  doc.text(`Date: ${dateStr}`, pageWidth - margin, y, { align: 'right' });
  doc.text(`Patient: ${patient.full_name}`, margin, y);
  y += 6;

  doc.text(`Code: ${patient.patient_code}  |  Age: ${patient.age || 'N/A'} yrs`, margin, y);
  y += 8;

  // ========== DIAGNOSIS ==========
  if (diagnosis) {
    doc.setFont('helvetica', 'bold');
    doc.text("Diagnosis:", margin, y);
    doc.setFont('helvetica', 'normal');

    // Capitalize diagnosis and add severity
    let diagDisplay = diagnosis.charAt(0).toUpperCase() + diagnosis.slice(1);
    if (severity) {
      const sevMap: Record<string, string> = { 'mild': 'Mild', 'moderate': 'Moderate', 'severe': 'Severe' };
      diagDisplay += ` (${sevMap[severity] || severity})`;
    }
    doc.text(diagDisplay.substring(0, 55), margin + 25, y);
    y += 8;
  }

  // Line before Rx
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ========== Rx PRESCRIPTION AREA ==========
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text("℞", margin, y);
  y += 10;

  // Prescription items
  doc.setFontSize(11);

  drugs.forEach((drug, index) => {
    if (y > pageHeight - 50) {
      doc.addPage();
      y = 20;
    }

    // Drug number and name in English (left side)
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 80, 80);
    doc.text(`${index + 1}. ${drug.trade_name} ${drug.dose}`, margin + 5, y);

    // Generic name (smaller)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const nameWidth = doc.getTextWidth(`${index + 1}. ${drug.trade_name} ${drug.dose}`);
    doc.text(`(${drug.generic_name})`, margin + 8 + nameWidth, y);
    doc.setFontSize(11);
    y += 5;

    // Arabic instruction (right side, RTL appearance)
    doc.setTextColor(0, 0, 0);
    const arabicFreq = frequencyArabic[drug.frequency.toUpperCase()] || drug.frequency;
    const arabicDur = getArabicDuration(drug.duration);
    const instruction = `قرص ${arabicFreq} لمدة ${arabicDur}`;

    doc.text(instruction, pageWidth - margin - 5, y, { align: 'right' });
    y += 3;

    // Ruled line under each drug
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.1);
    doc.line(margin + 5, y, pageWidth - margin, y);
    y += 10;
  });

  // Empty ruled lines for writing (only if not using template)
  if (!useTemplateBackground) {
    for (let i = 0; i < 4; i++) {
      if (y > pageHeight - 40) break;
      doc.setDrawColor(220, 220, 220);
      doc.line(margin + 5, y, pageWidth - margin, y);
      y += 7;
    }
  }

  // ========== SIGNATURE (skip if using template) ==========
  if (!useTemplateBackground) {
    const sigY = pageHeight - 25;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(pageWidth - 70, sigY, pageWidth - margin, sigY);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("Signature", pageWidth - margin - 20, sigY + 4);

    // Footer
    doc.setFontSize(7);
    doc.text("Generated by Clinic-OS", pageWidth / 2, pageHeight - 8, { align: 'center' });
  }

  // ========== OUTPUT - Open print dialog ==========
  const fileName = `Rx_${patient.patient_code}_${Date.now()}.pdf`;

  // Create blob and open in new tab with print
  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);

  // Open in new window and trigger print
  const printWindow = window.open(blobUrl, '_blank');
  if (printWindow) {
    printWindow.addEventListener('load', () => {
      printWindow.print();
    });
  }

  // Also save the file
  doc.save(fileName);

  // Cleanup
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

  return fileName;
};

/**
 * Synchronous version for backward compatibility
 */
export const generateRxPDFSync = (
  patient: PatientRow,
  drugs: RxDrug[],
  doctorName: string = "Dr. Amgad Khairy Kamel",
  diagnosis: string = "",
  severity?: 'mild' | 'moderate' | 'severe'
) => {
  // Call async version without waiting
  generateRxPDF(patient, drugs, doctorName, diagnosis, severity, false);
};
