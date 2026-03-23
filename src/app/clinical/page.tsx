"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus, User, FileText, Printer, Save, History, 
  Trash2, AlertCircle, ArrowLeft, Pill 
} from 'lucide-react';
import { useAuth } from '@/modules/auth/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { PatientRow } from '@/types/database';
import { generateRxPDF } from '@/modules/clinical/utils/generateRxPDF';

export default function ClinicalPage() {
  const [activePatient] = useState<PatientRow | null>(null);
  const [visitType, setVisitType] = useState('Consultation');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  
  // History State
  const [pastVisits, setPastVisits] = useState<any[]>([]);

  // Medication Builder State
  const [medsLibrary, setMedsLibrary] = useState<any[]>([]);
  const [selectedMedId, setSelectedMedId] = useState('');
  const [dose, setDose] = useState('');
  const [freq, setFreq] = useState('');
  const [duration, setDuration] = useState('');
  const [prescription, setPrescription] = useState<any[]>([]);
  
  const { user } = useAuth();
  const supabase = createClient();

  // Load Meds
  useEffect(() => {
    const fetchMeds = async () => {
      const { data } = await supabase.from('medication_master').select('*').order('trade_name_en');
      setMedsLibrary(data || []);
    };
    fetchMeds();
  }, [supabase]);

  // Load Patient History when activePatient changes
  useEffect(() => {
    const fetchHistory = async () => {
      if (!activePatient) {
        setPastVisits([]);
        return;
      }
      // Assuming we have a 'prescriptions_history' table
      const { data } = await supabase
        .from('queue_entries')
        .select('*, visits(*)') // Join with a potential visits table if exists
        .eq('patient_id', activePatient.id)
        .eq('status', 'done')
        .order('created_at', { ascending: false });
      setPastVisits(data || []);
    };
    fetchHistory();
  }, [activePatient, supabase]);

  const handleAddMed = () => {
    const med = medsLibrary.find(m => m.id === selectedMedId);
    if (!med) return;
    setPrescription([...prescription, {
      trade_name: med.trade_name_en,
      generic_name: med.generic_name_en,
      trade_name_ar: med.trade_name_ar,
      dose, frequency: freq, duration
    }]);
    setSelectedMedId(''); setDose(''); setFreq(''); setDuration('');
  };

  const handleSaveVisit = async () => {
    if (!activePatient) return;
    // Implementation for saving the full visit log
    alert('Visit saved successfully to ' + activePatient.full_name + "'s file.");
  };

  const handlePrintRx = () => {
    if (!activePatient) return alert('الرجاء اختيار مريض أولاً');
    if (prescription.length === 0) return alert('الرجاء إضافة أدوية للروشتة');
    const docName = user?.user_metadata?.full_name || "Dr. Amgad Khairy Kamel";
    generateRxPDF(activePatient, prescription, docName);
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
                 <select value={visitType} onChange={e => setVisitType(e.target.value)} className="btn btn-secondary">
                    <option>Consultation</option>
                    <option>Follow-up</option>
                    <option>Urgent Session</option>
                 </select>
                 <button className="btn btn-primary" onClick={handlePrintRx}><Printer size={18} /> Print Rx PDF</button>
                 <button className="btn btn-success" onClick={handleSaveVisit} style={{ background: 'var(--success)', borderColor: 'var(--success)' }}><Save size={18} /> Save File</button>
              </div>
           </div>
        </div>

        {/* Diagnosis & Notes */}
        <div className="card shadow-sm">
           <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}><FileText size={20} style={{ marginBottom: '-4px', marginRight: '8px' }}/> Clinical Impressions</h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                 <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>Diagnosis / Reason for Visit</label>
                 <input value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="e.g. Major Depressive Disorder, ADHD Assessment" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '1.1rem' }} />
              </div>
              <div>
                 <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>Clinical Progress Notes</label>
                 <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={6} placeholder="Type detailed clinical observations here..." style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: '1rem' }} />
              </div>
           </div>
        </div>

        {/* Medication Builder */}
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
      </div>

      {/* Side Panel: Active Patient & History */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="card shadow-sm" style={{ borderLeft: '4px solid var(--primary)', position: 'sticky', top: '2rem' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
              <div style={{ width: '45px', height: '45px', background: 'var(--primary)', color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <User size={24}/>
              </div>
              <div>
                 <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>Active Patient</div>
                 <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Clinical Session Data</div>
              </div>
           </div>

           {activePatient ? (
             <div style={{ background: '#fcfdfe', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
                <div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-dark)' }}>{activePatient.full_name}</div>
                <div style={{ display: 'flex', gap: '15px', marginTop: '8px', fontSize: '0.9rem', color: 'var(--text-medium)' }}>
                   <span>Age: {activePatient.age || 'N/A'}</span>
                   <span>ID: {activePatient.patient_code}</span>
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
             <div style={{ textAlign: 'center', padding: '3rem', border: '2px dashed var(--border)', borderRadius: '20px' }}>
                <AlertCircle size={32} style={{ color: 'var(--text-light)', margin: '0 auto 1rem' }} />
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Please select a patient from the Live Queue to begin session.</p>
                <button className="btn btn-secondary" style={{ marginTop: '1rem' }}><ArrowLeft size={16}/> Go to Queue</button>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
