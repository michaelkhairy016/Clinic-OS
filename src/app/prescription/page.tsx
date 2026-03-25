"use client";

import React, { useState, useEffect } from 'react';
import {
  Plus, Pill, FileText, Printer, Save,
  ArrowRight, ArrowLeft, Trash2, CheckCircle2,
  AlertCircle, Lightbulb, Activity
} from 'lucide-react';
import { useAuth } from '@/modules/auth/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { PatientRow } from '@/types/database';
import type {
  DiagnosisCategory,
  IntensityLevel,
  MedicationCategory,
  PrescriptionStep
} from '@/types/database';

export default function PrescriptionPage() {
  const { activeClinicId, user } = useAuth();

  // Patient Selection
  const [activePatient, setActivePatient] = useState<PatientRow | null>(null);
  const [queuePatients, setQueuePatients] = useState<any[]>([]);

  // Prescription Workflow State
  const [currentStep, setCurrentStep] = useState(1);
  const [prescriptionSteps, setPrescriptionSteps] = useState<PrescriptionStep[]>([]);
  const [finalPrescription, setFinalPrescription] = useState<any[]>([]);

  // Current Step State
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<DiagnosisCategory | null>(null);
  const [selectedIntensity, setSelectedIntensity] = useState<IntensityLevel | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<MedicationCategory | null>(null);
  const [clinicalNotesAr, setClinicalNotesAr] = useState('');
  const [clinicalNotesEn, setClinicalNotesEn] = useState('');

  // Medication Selection State
  const [medsLibrary, setMedsLibrary] = useState<any[]>([]);
  const [selectedMedId, setSelectedMedId] = useState('');
  const [dose, setDose] = useState('');
  const [frequency, setFrequency] = useState('');
  const [duration, setDuration] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  // Load medications
  useEffect(() => {
    const fetchMeds = async () => {
      const { data } = await supabase.from('medication_master').select('*').order('trade_name_en');
      setMedsLibrary(data || []);
    };
    fetchMeds();
  }, [supabase]);

  // Load queue patients for selection
  useEffect(() => {
    const fetchQueue = async () => {
      if (!activeClinicId) return;
      const { data } = await supabase
        .from('queue_entries')
        .select('*, patients(*)')
        .eq('clinic_id', activeClinicId)
        .eq('status', 'active')
        .order('queue_num', { ascending: true });

      setQueuePatients(data || []);
    };
    fetchQueue();
  }, [activeClinicId, supabase]);

  // Diagnosis Options
  const diagnosisOptions: { key: DiagnosisCategory; label: string; labelAr: string }[] = [
    { key: 'depression', label: 'Depression', labelAr: 'اكتئاب' },
    { key: 'anxiety', label: 'Anxiety', labelAr: 'قلق' },
    { key: 'bipolar', label: 'Bipolar Disorder', labelAr: 'اضطراب ثنائي القطب' },
    { key: 'schizophrenia', label: 'Schizophrenia', labelAr: 'فصام' },
    { key: 'adhd', label: 'ADHD', labelAr: 'فرط الحركة' },
    { key: 'ocd', label: 'OCD', labelAr: 'وسواس قهري' },
    { key: 'ptsd', label: 'PTSD', labelAr: 'اضطراب ما بعد الصدمة' },
    { key: 'other', label: 'Other', labelAr: 'أخرى' }
  ];

  // Intensity Options
  const intensityOptions: { key: IntensityLevel; label: string; labelAr: string; color: string }[] = [
    { key: 'mild', label: 'Mild', labelAr: 'خفيف', color: '#28a745' },
    { key: 'moderate', label: 'Moderate', labelAr: 'متوسط', color: '#ffc107' },
    { key: 'severe', label: 'Severe', labelAr: 'شديد', color: '#dc3545' }
  ];

  // Medication Category Options
  const categoryOptions: { key: MedicationCategory; label: string; labelAr: string }[] = [
    { key: 'antidepressant', label: 'Antidepressant', labelAr: 'مضاد اكتئاب' },
    { key: 'antipsychotic', label: 'Antipsychotic', labelAr: 'مضاد ذهان' },
    { key: 'anxiolytic', label: 'Anxiolytic', labelAr: 'مهدئ' },
    { key: 'mood_stabilizer', label: 'Mood Stabilizer', labelAr: 'مثبت للمزاج' },
    { key: 'stimulant', label: 'Stimulant', labelAr: 'منبه' },
    { key: 'other', label: 'Other', labelAr: 'أخرى' }
  ];

  // Frequency Options (Arabic labels)
  const frequencyOptions: { value: string; labelAr: string; labelEn: string }[] = [
    { value: 'OD', labelAr: 'مرة يومياً', labelEn: 'Once daily' },
    { value: 'BD', labelAr: 'مرتين يومياً', labelEn: 'Twice daily' },
    { value: 'TDS', labelAr: 'ثلاث مرات يومياً', labelEn: 'Three times daily' },
    { value: 'QDS', labelAr: 'أربع مرات يومياً', labelEn: 'Four times daily' },
    { value: 'PRN', labelAr: 'عند الحاجة', labelEn: 'As needed' },
    { value: 'HS', labelAr: 'وقت النوم', labelEn: 'At bedtime' }
  ];

  const handleAddMedication = () => {
    const med = medsLibrary.find(m => m.id === selectedMedId);
    if (!med || !selectedCategory) return;

    const newMed = {
      trade_name: med.trade_name_en,
      generic_name: med.generic_name_en,
      dose,
      frequency_ar: frequencyOptions.find(f => f.value === frequency)?.labelAr || frequency,
      frequency_en: frequencyOptions.find(f => f.value === frequency)?.labelEn || frequency,
      duration
    };

    setFinalPrescription([...finalPrescription, newMed]);
    setSelectedMedId('');
    setDose('');
    setFrequency('');
    setDuration('');
  };

  const handleCompleteStep = () => {
    const newStep: PrescriptionStep = {
      step_number: currentStep,
      diagnosis: selectedDiagnosis,
      intensity: selectedIntensity,
      category: selectedCategory,
      medications: [],
      notes_ar: clinicalNotesAr,
      notes_en: clinicalNotesEn
    };

    setPrescriptionSteps([...prescriptionSteps, newStep]);

    // Move to next step
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    }
  };

  const handleRemoveStep = (stepNumber: number) => {
    setPrescriptionSteps(prescriptionSteps.filter(s => s.step_number !== stepNumber));
  };

  const handleRemoveMedication = (index: number) => {
    setFinalPrescription(finalPrescription.filter((_, i) => i !== index));
  };

  const handleSavePrescription = async () => {
    if (!activePatient) {
      alert('Please select a patient first / الرجاء اختيار مريض أولاً');
      return;
    }

    if (finalPrescription.length === 0) {
      alert('Please add medications to the prescription / الرجاء إضافة أدوية للروشتة');
      return;
    }

    setLoading(true);
    try {
      // Create clinical note with prescription data
      const { data: clinicalNote, error: noteError } = await supabase
        .from('clinical_notes')
        .insert({
          queue_entry_id: queuePatients[0]?.id,
          diagnosis: selectedDiagnosis || 'General consultation',
          clinical_notes: `AR: ${clinicalNotesAr}\nEN: ${clinicalNotesEn}`,
          visit_type: 'Prescription'
        })
        .select()
        .single();

      if (noteError) throw noteError;
      if (!clinicalNote) throw new Error('Failed to create clinical note');

      // Save prescription medications
      const prescriptionData = finalPrescription.map(med => ({
        clinical_note_id: clinicalNote.id,
        trade_name: med.trade_name,
        generic_name: med.generic_name,
        dose: med.dose,
        frequency: `${med.frequency_en} (${med.frequency_ar})`,
        duration: med.duration
      }));

      const { error: rxError } = await supabase.from('prescriptions').insert(prescriptionData);

      if (rxError) throw rxError;

      // Complete the queue entry
      if (queuePatients[0]?.id) {
        await supabase.from('queue_entries').update({ status: 'done' }).eq('id', queuePatients[0].id);
      }

      setSuccess(true);
      // Reset form
      setCurrentStep(1);
      setSelectedDiagnosis(null);
      setSelectedIntensity(null);
      setSelectedCategory(null);
      setClinicalNotesAr('');
      setClinicalNotesEn('');
      setFinalPrescription([]);
    } catch (error: any) {
      console.error('Error saving prescription:', error);
      alert('خطأ في حفظ الروشتة: ' + error.message + '\n\nError saving prescription: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPrescription = () => {
    if (!activePatient || finalPrescription.length === 0) return;

    // This would integrate with generateRxPDF utility
    alert('Prescription ready for printing!\n\nالروشتة جاهزة للطباعة!');
  };

  const getStepProgress = () => {
    const totalSteps = 4;
    const completedSteps = prescriptionSteps.length;
    const percentage = (completedSteps / totalSteps) * 100;
    return { completed: completedSteps, total: totalSteps, percentage };
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', padding: '2rem' }}>
        <div className="card" style={{ maxWidth: 450, textAlign: 'center', padding: '3.5rem' }}>
          <CheckCircle2 size={80} style={{ color: 'var(--success)', margin: '0 auto 1.5rem' }} />
          <h2 style={{ color: 'var(--success)', marginBottom: '1rem' }}>تم الحفظ بنجاح!</h2>
          <h3 style={{ color: 'var(--success)', marginBottom: '1rem' }}>Saved Successfully!</h3>
          <p style={{ color: 'var(--text-medium)', fontSize: '1.2rem', lineHeight: 1.6 }}>
            الروشتة تم حفظها في ملف المريض
            <br/><br/>
            Prescription has been saved to patient file
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem' }}>
      {/* Header */}
      <div className="card shadow-sm">
        <div className="flex-between">
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>Smart Prescription Writer</h1>
            <p style={{ color: 'var(--text-light)', marginTop: '5px' }}>
              كاتب الروشتة الذكي / Streamlined prescription interface
            </p>
          </div>
          <button className="btn btn-secondary" onClick={() => window.location.href = '/clinical'}>
            <ArrowLeft size={18} /> Back to Clinical
          </button>
        </div>
      </div>

      {!activePatient ? (
        <div className="card shadow-sm" style={{ border: '2px solid var(--primary)', padding: '2rem', textAlign: 'center' }}>
          <AlertCircle size={48} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
          <h2 style={{ margin: 0, marginBottom: '1rem' }}>Select Active Patient</h2>
          <p style={{ color: 'var(--text-light)', fontSize: '1rem', marginBottom: '1.5rem' }}>
            Please select the active patient from the queue to begin prescription
            <br/><br/>
            الرجاء اختيار المريض النشط من القائمة لبدء الروشتة
          </p>
          {queuePatients.length > 0 ? (
            <div>
              <p style={{ fontWeight: 600, marginBottom: '1rem' }}>Active patients in queue:</p>
              {queuePatients.map(qp => (
                <button
                  key={qp.id}
                  onClick={() => setActivePatient(qp.patients)}
                  className="btn btn-ghost"
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '1rem',
                    marginBottom: '0.5rem',
                    border: '1px solid var(--border)',
                    borderRadius: '8px'
                  }}
                >
                  {qp.patients.full_name} (#{qp.queue_num})
                </button>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-light)' }}>No active patients in queue</p>
          )}
        </div>
      ) : (
        <>
          {/* Progress Overview */}
          <div className="card shadow-sm">
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.4rem', fontWeight: 800 }}>
              <Activity size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
              Prescription Progress / تقدم الروشتة
            </h2>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}>
                Patient: <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{activePatient.full_name}</span>
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                Code: <span style={{ fontWeight: 600 }}>{activePatient.patient_code}</span> •
                Age: <span style={{ fontWeight: 600 }}>{activePatient.age}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ background: '#e9ecef', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
              <div
                style={{
                  background: 'var(--primary)',
                  height: '100%',
                  width: `${getStepProgress().percentage}%`,
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              <span>{getStepProgress().completed} of {getStepProgress().total} steps completed</span>
              <span>{Math.round(getStepProgress().percentage)}%</span>
            </div>
          </div>

          {/* Completed Steps */}
          {prescriptionSteps.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Completed Steps / الخطوات المكتملة:</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {prescriptionSteps.map(step => (
                  <div key={step.step_number} className="card" style={{ padding: '1rem', background: 'white', position: 'relative' }}>
                    <button
                      onClick={() => handleRemoveStep(step.step_number)}
                      className="btn btn-ghost"
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        color: '#dc3545',
                        padding: '4px'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>

                    <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      <strong>Step {step.step_number}:</strong> {diagnosisOptions.find(d => d.key === step.diagnosis)?.labelAr || 'Unknown'}
                    </div>
                    {step.intensity && (
                      <div style={{ fontSize: '0.85rem' }}>
                        Intensity: <span style={{ color: intensityOptions.find(i => i.key === step.intensity)?.color, fontWeight: 600 }}>
                          {intensityOptions.find(i => i.key === step.intensity)?.labelAr || 'Unknown'}
                        </span>
                      </div>
                    )}
                    {step.category && (
                      <div style={{ fontSize: '0.85rem' }}>
                        Category: <span style={{ fontWeight: 600 }}>
                          {categoryOptions.find(c => c.key === step.category)?.labelAr || 'Unknown'}
                        </span>
                      </div>
                    )}
                    {step.medications.length > 0 && (
                      <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                        <strong>Medications:</strong> {step.medications.length} drugs
                      </div>
                    )}
                    {step.notes_ar && (
                      <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: 'var(--text-light)' }}>
                        <strong>Notes (AR):</strong> {step.notes_ar.substring(0, 50)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current Step */}
          {currentStep === 1 && (
            <div className="card shadow-sm" style={{ borderLeft: '4px solid var(--primary)', marginTop: '2rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'var(--primary)', color: 'white', padding: '10px', borderRadius: '50%' }}>1</div>
                <div>
                  Step 1: Diagnosis / الخطوة 1: التشخيص
                  <Lightbulb size={20} style={{ marginLeft: '8px', color: '#ffc107' }} />
                </div>
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                {diagnosisOptions.map(option => (
                  <button
                    key={option.key}
                    onClick={() => setSelectedDiagnosis(selectedDiagnosis === option.key ? null : option.key)}
                    className="btn btn-ghost"
                    style={{
                      padding: '1.5rem',
                      border: selectedDiagnosis === option.key ? '2px solid var(--primary)' : '1px solid var(--border)',
                      borderRadius: '12px',
                      background: selectedDiagnosis === option.key ? '#e6f4ff' : 'white',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                      {option.labelAr}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                      {option.label}
                    </div>
                  </button>
                ))}
              </div>

              <button
                className="btn btn-primary"
                onClick={handleCompleteStep}
                disabled={!selectedDiagnosis}
                style={{ marginTop: '2rem', width: '100%', padding: '1.2rem', fontSize: '1.1rem' }}
              >
                <ArrowRight size={20} /> Next Step
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="card shadow-sm" style={{ borderLeft: '4px solid #ffc107', marginTop: '2rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#ffc107', color: 'white', padding: '10px', borderRadius: '50%' }}>2</div>
                <div>
                  Step 2: Intensity / الخطوة 2: الشدة
                  <Lightbulb size={20} style={{ marginLeft: '8px', color: '#ffc107' }} />
                </div>
              </h3>

              <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                {intensityOptions.map(option => (
                  <button
                    key={option.key}
                    onClick={() => setSelectedIntensity(selectedIntensity === option.key ? null : option.key)}
                    className="btn btn-ghost"
                    style={{
                      padding: '1.5rem',
                      border: selectedIntensity === option.key ? '2px solid #ffc107' : '1px solid var(--border)',
                      borderRadius: '12px',
                      background: selectedIntensity === option.key ? '#fff3cd' : 'white',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: option.color
                      }} />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                          {option.labelAr}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                          {option.label}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <button
                className="btn btn-primary"
                onClick={handleCompleteStep}
                disabled={!selectedIntensity}
                style={{ marginTop: '2rem', width: '100%', padding: '1.2rem', fontSize: '1.1rem' }}
              >
                <ArrowRight size={20} /> Next Step
              </button>
            </div>
          )}

          {currentStep === 3 && (
            <div className="card shadow-sm" style={{ borderLeft: '4px solid var(--success)', marginTop: '2rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'var(--success)', color: 'white', padding: '10px', borderRadius: '50%' }}>3</div>
                <div>
                  Step 3: Medication Category / الخطوة 3: فئة الدواء
                  <Pill size={20} style={{ marginLeft: '8px', color: 'var(--success)' }} />
                </div>
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                {categoryOptions.map(option => (
                  <button
                    key={option.key}
                    onClick={() => setSelectedCategory(selectedCategory === option.key ? null : option.key)}
                    className="btn btn-ghost"
                    style={{
                      padding: '1.5rem',
                      border: selectedCategory === option.key ? '2px solid var(--success)' : '1px solid var(--border)',
                      borderRadius: '12px',
                      background: selectedCategory === option.key ? '#d1e7dd' : 'white',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                      {option.labelAr}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                      {option.label}
                    </div>
                  </button>
                ))}
              </div>

              <button
                className="btn btn-primary"
                onClick={handleCompleteStep}
                disabled={!selectedCategory}
                style={{ marginTop: '2rem', width: '100%', padding: '1.2rem', fontSize: '1.1rem' }}
              >
                <ArrowRight size={20} /> Next Step
              </button>
            </div>
          )}

          {currentStep === 4 && (
            <div className="card shadow-sm" style={{ borderLeft: '4px solid #0d6efd', marginTop: '2rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#0d6efd', color: 'white', padding: '10px', borderRadius: '50%' }}>4</div>
                <div>
                  Step 4: Clinical Notes & Compile Medications
                  <br/>
                  الخطوة 4: الملاحظات السريرية وتجميع الأدوية
                  <FileText size={20} style={{ marginLeft: '8px', color: '#0d6efd' }} />
                </div>
              </h3>

              {/* Clinical Notes */}
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>
                    Clinical Notes (Arabic) / الملاحظات السريرية (عربي)
                  </label>
                  <textarea
                    value={clinicalNotesAr}
                    onChange={e => setClinicalNotesAr(e.target.value)}
                    rows={4}
                    placeholder="اكتب الملاحظات السريرية بالعربي..."
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      fontSize: '1rem',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>
                    Clinical Notes (English) / الملاحظات السريرية (إنجليزي)
                  </label>
                  <textarea
                    value={clinicalNotesEn}
                    onChange={e => setClinicalNotesEn(e.target.value)}
                    rows={4}
                    placeholder="Write clinical notes in English..."
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      fontSize: '1rem',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>

              {/* Medication Builder */}
              <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '16px', marginTop: '1.5rem' }}>
                <h4 style={{ margin: 0, marginBottom: '1rem' }}>Add Medications / إضافة أدوية:</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '10px' }}>
                  <select
                    value={selectedMedId}
                    onChange={e => setSelectedMedId(e.target.value)}
                    style={{ padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }}
                  >
                    <option value="">-- Select Medication --</option>
                    {medsLibrary.map(med => (
                      <option key={med.id} value={med.id}>{med.trade_name_en}</option>
                    ))}
                  </select>
                  <input
                    placeholder="Dose"
                    value={dose}
                    onChange={e => setDose(e.target.value)}
                    style={{ padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }}
                  />
                  <select
                    value={frequency}
                    onChange={e => setFrequency(e.target.value)}
                    style={{ padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }}
                  >
                    <option value="">-- Frequency --</option>
                    {frequencyOptions.map(freq => (
                      <option key={freq.value} value={freq.value}>{freq.labelEn} ({freq.labelAr})</option>
                    ))}
                  </select>
                  <input
                    placeholder="Duration"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    style={{ padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleAddMedication}
                    disabled={!selectedMedId || !dose || !frequency || !duration}
                    style={{ padding: '12px' }}
                  >
                    <Plus size={20} />
                  </button>
                </div>

                {/* Current Medications */}
                {finalPrescription.length > 0 && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <h4 style={{ margin: 0, marginBottom: '1rem' }}>Current Prescription / الروشتة الحالية:</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {finalPrescription.map((med, i) => (
                        <div key={i} className="card" style={{ padding: '1rem', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary)' }}>
                              {med.trade_name}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
                              {med.generic_name} • {med.dose} • {med.frequency_en} ({med.frequency_ar}) • {med.duration}
                            </div>
                          </div>
                          <button
                            className="btn btn-ghost"
                            onClick={() => handleRemoveMedication(i)}
                            style={{ color: '#dc3545', padding: '8px' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleSavePrescription}
                  disabled={loading || finalPrescription.length === 0}
                  style={{ flex: 1, padding: '1.2rem', fontSize: '1.1rem' }}
                >
                  {loading ? 'Saving...' : (
                    <>
                      <Save size={20} /> Save Prescription
                    </>
                  )}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handlePrintPrescription}
                  disabled={finalPrescription.length === 0}
                  style={{ padding: '1.2rem', fontSize: '1.1rem' }}
                >
                  <Printer size={20} /> Print PDF
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
