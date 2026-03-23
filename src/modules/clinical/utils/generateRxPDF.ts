import { jsPDF } from 'jspdf';
import { PatientRow } from '@/types/database';

type RxDrug = {
  trade_name: string;
  generic_name: string;
  dose: string;
  frequency: string;
  duration: string;
};

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
    
    // Instruction (Hybrid - Placeholder for Arabic text rendering)
    // NOTE: Standard jsPDF requires special fonts for Arabic. 
    // We will use standard labels for now, but I recommend adding a custom font file.
    doc.setTextColor(74, 102, 101);
    doc.setFontSize(10);
    doc.text(`Dosage: ${drug.dose} --- Frequency: ${drug.frequency} --- Duration: ${drug.duration}`, 30, currentY + 7);
    
    currentY += 20;

    // Check for page overflow
    if (currentY > 270) {
      doc.addPage();
      currentY = 20;
    }
  });

  // 4. Footer
  doc.setFontSize(10);
  doc.setTextColor(143, 166, 165);
  doc.text("This is an electronically generated prescription. No signature required.", 105, 285, { align: 'center' });
  doc.text("Powered by Clinic-OS", 105, 290, { align: 'center' });

  // Save the PDF
  doc.save(`Rx_${patient.patient_code}_${new Date().getTime()}.pdf`);
};
