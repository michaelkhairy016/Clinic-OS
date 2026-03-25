"use client";

import React, { useState, useEffect } from 'react';
import {
  Plus, User, FileText, Printer, Save, History,
  Trash2, AlertCircle, ArrowLeft, Pill, UserCheck
} from 'lucide-react';
import { useAuth } from '@/modules/auth/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { PatientRow } from '@/types/database';
import { generateRxPDF } from '@/modules/clinical/utils/generateRxPDF';
import { getWaitingPatients, completePatientVisit } from '@/lib/supabase/queue';
import { validateClinicalNotes, validatePrescription, formatValidationErrors } from '@/lib/validation';

type QueuePatient = {
  id: string;
  patient_id: string;
  queue_num: number;
  patients: PatientRow;
};

type PastVisit = {
  id: string;
  created_at: string;
  visit_type: string;
  diagnosis: string | null;
};

type PrescriptionDrug = {
  trade_name: string;
  generic_name: string;
  trade_name_ar: string;
  dose: string;
  frequency: string;
  duration: string;
};

export default function ClinicalPage() {
  // Fixed: Proper patient selection state
  const [activePatient, setActivePatient] = useState<PatientRow | null>(null);
  const [activeQueueEntryId, setActiveQueueEntryId] = useState<string | null>(null);

  const [visitType, setVisitType] = useState('Consultation');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // History State
  const [pastVisits, setPastVisits] = useState<PastVisit[]>([]);

  // Queue Patients State
  const [queuePatients, setQueuePatients] = useState<QueuePatient[]>([]);

  // Medication Builder State
  const [medsLibrary, setMedsLibrary] = useState<any[]>([]);
  const [selectedMedId, setSelectedMedId] = useState('');
  const [dose, setDose] = useState('');
  const [freq, setFreq] = useState('');
  const [duration, setDuration] = useState('');
  const [prescription, setPrescription] = useState<PrescriptionDrug[]>([]);

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { user, activeClinicId } = useAuth();
  const supabase = createClient();

  // Load Meds
  useEffect(() => {
    const fetchMeds = async () => {
      const { data } = await supabase.from('medication_master').select('*').order('trade_name_en');
      setMedsLibrary(data || []);
    };
    fetchMeds();
  }, [supabase]);

  // Load waiting patients for selection
  useEffect(() => {
    const fetchQueuePatients = async () => {
      if (!activeClinicId) return;
      try {
        const patients = await getWaitingPatients(activeClinicId);
        setQueuePatients(patients as any[]);
      } catch (error) {
        console.error('Error fetching queue patients:', error);
      }
    };
    fetchQueuePatients();
  }, [activeClinicId]);

  // Load Patient History when activePatient changes
  useEffect(() => {
    const fetchHistory = async () => {
      if (!activePatient) {
        setPastVisits([]);
        return;
      }

      // Fetch clinical notes with prescriptions
      const { data } = await supabase
        .from('clinical_notes')
        .select(`
          id,
          created_at,
          visit_type,
          diagnosis,
          prescriptions (
            trade_name,
            generic_name
          )
        `)
        .eq('queue_entry_id', activeQueueEntryId)
        .order('created_at', { ascending: false });

      setPastVisits(data || []);
    };
    fetchHistory();
  }, [activePatient, activeQueueEntryId, supabase]);

  // Select patient from queue
  const handleSelectPatient = async (queuePatient: QueuePatient) => {
    setActivePatient(queuePatient.patients);
    setActiveQueueEntryId(queuePatient.id);
    setErrors({}); // Clear errors
  };

  const handleAddMed = () => {
    const med = medsLibrary.find(m => m.id === selectedMedId);
    if (!med) return;

    // Validate prescription drug
    const validation = validatePrescription({
      tradeName: med.trade_name_en,
      genericName: med.generic_name_en,
      dose,
      frequency: freq,
      duration
    });

    if (!validation.isValid) {
      alert(formatValidationErrors(validation.errors));
      return;
    }

    setPrescription([...prescription, {
      trade_name: med.trade_name_en,
      generic_name: med.generic_name_en,
      trade_name_ar: med.trade_name_ar,
      dose, frequency: freq, duration
    }]);
    setSelectedMedId(''); setDose(''); setFreq(''); setDuration('');
  };

  const handleSaveVisit = async () => {
    if (!activePatient || !activeQueueEntryId) return;

    // Validate clinical notes
    const validation = validateClinicalNotes({ diagnosis, clinicalNotes: notes });
    if (!validation.isValid) {
      setErrors(validation.errors);
      alert(formatValidationErrors(validation.errors));
      return;
    }

    setSaving(true);
    try {
      // Create clinical note
      const { data: clinicalNote, error: noteError } = await supabase
        .from('clinical_notes')
        .insert({
          queue_entry_id: activeQueueEntryId,
          diagnosis,
          clinical_notes: notes,
          visit_type: visitType
        })
        .select()
        .single();

      if (noteError) throw noteError;

      // Save prescriptions if any
      if (prescription.length > 0 && clinicalNote) {
        const prescriptionData = prescription.map(drug => ({
          clinical_note_id: clinicalNote.id,
          trade_name: drug.trade_name,
          generic_name: drug.generic_name,
          dose: drug.dose,
          frequency: drug.frequency,
          duration: drug.duration
        }));

        const { error: rxError } = await supabase
          .from('prescriptions')
          .insert(prescriptionData);

        if (rxError) throw rxError;
      }

      // Complete the queue entry
      await completePatientVisit(activeQueueEntryId);

      // Clear form and show success
      setDiagnosis('');
      setNotes('');
      setPrescription([]);
      setActivePatient(null);
      setActiveQueueEntryId(null);
      alert('تم حفظ الزيارة بنجاح!\n\nVisit saved successfully for ' + activePatient.full_name);

      // Refresh queue
      if (activeClinicId) {
        const patients = await getWaitingPatients(activeClinicId);
        setQueuePatients(patients as any[]);
      }
    } catch (error: any) {
      console.error('Error saving visit:', error);
      alert('خطأ في حفظ الزيارة: ' + error.message + '\n\nError saving visit: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePrintRx = () => {
    if (!activePatient) return alert('الرجاء اختيار مريض أولاً\n\nPlease select a patient first');
    if (prescription.length === 0) return alert('الرجاء إضافة أدوية للروشتة\n\nPlease add medications to the prescription');
    const docName = user?.user_metadata?.full_name || "Dr. Amgad Khairy Kamel";
    generateRxPDF(activePatient, prescription, docName);
  };

  const handleSelectAnotherPatient = () => {
    setActivePatient(null);
    setActiveQueueEntryId(null);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: '2rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Header Section */}
        <div className="card shadow-sm">
           <div className="flex-between">
              <div>
                <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>Clinical Workspace: Dr. Amgad</h1>
                <p style={{ color: 'var(--text-light)', marginTop: '5px' }}>Build prescriptions and document patient visits efficiently.</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                 <select value={visitType} onChange={e => setVisitType(e.target.value)} className="btn btn-secondary" disabled={!activePatient}>
                    <option>Consultation</option>
                    <option>Follow-up</option>
                    <option>Urgent Session</option>
                 </select>
                 <button className="btn btn-primary" onClick={handlePrintRx} disabled={!activePatient || saving}><Printer size={18} /> Print Rx PDF</button>
                 <button className="btn btn-success" onClick={handleSaveVisit} disabled={!activePatient || saving} style={{ background: 'var(--success)', borderColor: 'var(--success)' }}>
                   {saving ? 'Saving...' : (
                     <>
                       <Save size={18} /> Save File
                     </>
                   )}
                 </button>
              </div>
           </div>
        </div>

        {/* Patient Selection */}
        {!activePatient && (
          <div className="card shadow-sm" style={{ border: '2px solid var(--primary)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--primary)' }}><UserCheck size={20} style={{ marginBottom: '-4px', marginRight: '8px' }}/> Select Patient from Queue</h3>
            {queuePatients.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {queuePatients.map(qp => (
                  <div
                    key={qp.id}
                    className="card"
                    style={{
                      padding: '1.2rem',
                      marginBottom: 0,
                      cursor: 'pointer',
                      border: '2px solid transparent',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                    onClick={() => handleSelectPatient(qp)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ background: 'var(--primary)', color: 'white', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                        {qp.queue_num}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-dark)' }}>{qp.patients.full_name}</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Code: {qp.patients.patient_code} • Age: {qp.patients.age}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                No patients waiting in queue. Check the queue page to add patients first.
              </div>
            )}
          </div>
        )}

        {/* Diagnosis & Notes */}
        {activePatient && (
          <div className="card shadow-sm">
            <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}><FileText size={20} style={{ marginBottom: '-4px', marginRight: '8px' }}/> Clinical Impressions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>Diagnosis / Reason for Visit</label>
                <input
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                  placeholder="e.g. Major Depressive Disorder, ADHD Assessment"
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: errors.diagnosis ? '2px solid #df4759' : '1px solid var(--border)',
                    fontSize: '1.1rem'
                  }}
                />
                {errors.diagnosis && <div style={{ color: '#df4759', fontSize: '0.85rem', marginTop: '4px' }}>{errors.diagnosis}</div>}
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>Clinical Progress Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={6}
                  placeholder="Type detailed clinical observations here..."
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: errors.clinicalNotes ? '2px solid #df4759' : '1px solid var(--border)',
                    fontFamily: 'inherit',
                    fontSize: '1rem'
                  }}
                />
                {errors.clinicalNotes && <div style={{ color: '#df4759', fontSize: '0.85rem', marginTop: '4px' }}>{errors.clinicalNotes}</div>}
              </div>
            </div>
          </div>
        )}

        {/* Medication Builder */}
        {activePatient && (
          <div className="card shadow-sm" style={{ borderTop: '4px solid var(--primary)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
              <div style={{ background: 'var(--bg-color)', padding: '10px', borderRadius: '50%', color: 'var(--primary)' }}><Pill size={20}/></div>
              Prescription Builder (Rx)
            </h3>

            {/* Add Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '10px', background: '#f5f8f8', padding: '1.25rem', borderRadius: '16px' }}>
              <select value={selectedMedId} onChange={e => setSelectedMedId(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <option value="">-- Choose Med --</option>
                {medsLibrary.map(m => (
                  <option key={m.id} value={m.id}>{m.trade_name_en} ({m.generic_name_en})</option>
                ))}
              </select>
              <input placeholder="Dose (10mg)" value={dose} onChange={e => setDose(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }} />
              <input placeholder="Freq (OD)" value={freq} onChange={e => setFreq(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }} />
              <input placeholder="Dur." value={duration} onChange={e => setDuration(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }} />
              <button className="btn btn-primary" onClick={handleAddMed} style={{ padding: '12px' }}><Plus/></button>
            </div>

            {/* Current Prescription Table */}
            <div className="table-container" style={{ marginTop: '1.5rem' }}>
              <table>
                <thead>
                  <tr>
                    <th>Medication</th>
                    <th>Generic</th>
                    <th>Dose</th>
                    <th>Frequency</th>
                    <th>Duration</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {prescription.map((p, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{p.trade_name}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{p.generic_name}</td>
                      <td>{p.dose}</td>
                      <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{p.frequency}</td>
                      <td>{p.duration}</td>
                      <td>
                        <button className="btn btn-ghost" style={{ color: '#df4759' }} onClick={() => setPrescription(prescription.filter((_, idx) => idx !== i))}>
                          <Trash2 size={16}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {prescription.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>No medications added. Start building your prescription above.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Side Panel: Active Patient & History */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {activePatient ? (
          <div className="card shadow-sm" style={{ borderLeft: '4px solid var(--primary)', position: 'sticky', top: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
              <div style={{ width: '45px', height: '45px', background: 'var(--primary)', color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={24}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>Active Patient</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Clinical Session Data</div>
              </div>
            </div>

            <div style={{ background: '#fcfdfe', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
              <div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-dark)' }}>{activePatient.full_name}</div>
              <div style={{ display: 'flex', gap: '15px', marginTop: '8px', fontSize: '0.9rem', color: 'var(--text-medium)' }}>
                <span>Age: {activePatient.age || 'N/A'}</span>
                <span>ID: {activePatient.patient_code}</span>
              </div>

              <button
                className="btn btn-secondary"
                onClick={handleSelectAnotherPatient}
                style={{ marginTop: '1.5rem', width: '100%' }}
              >
                <ArrowLeft size={16}/> Select Different Patient
              </button>
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={18} /> Past Visits Log
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pastVisits.map((v, i) => (
                  <div key={i} className="card" style={{ padding: '12px', marginBottom: 0, cursor: 'pointer', background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '4px' }}>
                      <span>{new Date(v.created_at).toLocaleDateString()}</span>
                      <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{v.visit_type}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Diagnosis: {v.diagnosis || 'General Session'}</div>
                  </div>
                ))}
                {pastVisits.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)', border: '2px dashed var(--border)', borderRadius: '12px' }}>
                    No history found. First visit?
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="card shadow-sm" style={{ borderLeft: '4px solid var(--primary)', position: 'sticky', top: '2rem' }}>
            <div style={{ textAlign: 'center', padding: '3rem', border: '2px dashed var(--border)', borderRadius: '20px' }}>
              <AlertCircle size={32} style={{ color: 'var(--text-light)', margin: '0 auto 1rem' }} />
              <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Please select a patient from the waiting queue above to begin session.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
