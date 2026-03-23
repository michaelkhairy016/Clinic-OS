"use client";

import React, { useEffect, useState } from 'react';
import { Pill, Printer, Save, History, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { PatientRow } from '@/types/database';

const DIx_LIST = ['Depression', 'ADHD', 'Anxiety', 'Bipolar', 'OCD', 'Schizophrenia'];
const MEDS_DB: Record<string, string[]> = {
   'SSRIs': ['Cipralex', 'Lustral', 'Prozac'],
   'Atypical Antipsychotics': ['Seroquel', 'Zyprexa'],
   'Mood Stabilizers': ['Depakine'],
   'Benzodiazepines': ['Amotril', 'Xanax'],
   'ADHD Stimulants': ['Concerta', 'Ritalin']
};

const DOSES = [
  { id: '1/4', ar: 'ربع قرص' },
  { id: '1/2', ar: 'نصف قرص' },
  { id: '1', ar: 'قرص كامل' },
  { id: '1.5', ar: 'قرص ونصف' },
  { id: '2', ar: 'قرصين' }
];

const FREQS = [
  { id: 'OD', ar: 'مرة يومياً' },
  { id: 'BD', ar: 'مرتين يومياً' },
  { id: 'TDS', ar: 'ثلاث مرات يومياً' },
  { id: 'PRN', ar: 'عند اللزوم' },
];

export default function ClinicalPage() {
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [visitType, setVisitType] = useState('Normal Visit');

  const [activePatient, setActivePatient] = useState<PatientRow | null>(null);
  const [activeQueueId, setActiveQueueId] = useState<string | null>(null);
  const [patientLoading, setPatientLoading] = useState(true);

  // Diagnosis State
  const [diagnosis, setDiagnosis] = useState('');
  const [severity, setSeverity] = useState(5);
  const [notes, setNotes] = useState('');

  // Prescription Builder State
  const [activeCat, setActiveCat] = useState('');
  const [activeMed, setActiveMed] = useState('');
  const [activeDose, setActiveDose] = useState<{ id: string; ar: string } | null>(null);
  const [activeFreq, setActiveFreq] = useState<{ id: string; ar: string } | null>(null);

  const [prescriptions, setPrescriptions] = useState<string[]>([]);

  useEffect(() => {
    const supabase = createClient();
    const load = async () => {
      const { data } = await supabase
        .from('queue_entries')
        .select('id, patients(*)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      type Row = { id: string; patients: PatientRow | null };
      const row = data as Row | null;
      if (row?.patients) {
        setActiveQueueId(row.id);
        setActivePatient(row.patients);
      } else {
        setActiveQueueId(null);
        setActivePatient(null);
      }
      setPatientLoading(false);
    };
    void load();
    const t = setInterval(() => void load(), 5000);
    return () => clearInterval(t);
  }, []);

  const discharge = async () => {
    if (!activeQueueId) return;
    const supabase = createClient();
    const { error } = await supabase.from('queue_entries').update({ status: 'done' }).eq('id', activeQueueId);
    if (error) {
      alert(error.message);
      return;
    }
    setActiveQueueId(null);
    setActivePatient(null);
  };

  const addMedication = () => {
     if (activeMed && activeDose && activeFreq) {
        setPrescriptions([...prescriptions, `يؤخذ ${activeDose.ar} من ${activeMed} ${activeFreq.ar}`]);
        // Reset builder
        setActiveMed('');
        setActiveDose(null);
        setActiveFreq(null);
     } else {
        alert("Please complete all medication bubbles (Cat -> Med -> Dose -> Freq)");
     }
  };

  const removeMedication = (idx: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div className="flex-between">
         <h2 style={{ margin: 0 }}>Clinical Workspace</h2>
         <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select 
               value={visitType} 
               onChange={(e) => setVisitType(e.target.value)}
               style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--primary)', background: 'var(--bg-color)', color: 'var(--primary)', fontWeight: 'bold' }}
            >
               <option>Normal Visit</option>
               <option>Long Session (Therapy)</option>
               <option>Follow-Up</option>
               <option>Emergency</option>
            </select>
            <span className="badge badge-active" style={{ fontSize: '1rem', padding: '8px 16px' }}>
              {patientLoading
                ? 'Loading patient…'
                : activePatient
                  ? `Active Patient: ${activePatient.full_name} (${activePatient.patient_code})`
                  : 'No active patient — call someone from Live Queue'}
            </span>
         </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'start', marginTop: '2rem' }}>
        {/* Main Workspace */}
         <div className="card" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '2rem' }}>
              <button 
                className={`btn ${activeTab === 'current' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTab('current')}
              >
                 <Pill size={18} /> Current Session Builder
              </button>
              <button 
                className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTab('history')}
              >
                 <History size={18} /> Medical History
              </button>
            </div>

            {activeTab === 'current' && (
               <div>
                  {/* Diagnosis Builder */}
                  <div style={{ padding: '1.5rem', background: '#fafcfc', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '2rem' }}>
                     <h3 style={{ marginTop: 0, color: 'var(--primary)', marginBottom: '1rem' }}>1. Primary Diagnosis</h3>
                     
                     <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                        {DIx_LIST.map(dix => (
                           <button 
                              key={dix} 
                              onClick={() => setDiagnosis(dix)}
                              className={`btn ${diagnosis === dix ? 'btn-primary' : 'btn-secondary'}`}
                              style={{ borderRadius: '20px', padding: '6px 16px' }}
                           >
                              {dix}
                           </button>
                        ))}
                     </div>

                     {diagnosis && (
                        <div style={{ marginBottom: '1.5rem' }}>
                           <label style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '8px' }}>
                              <span>Severity Level ({diagnosis})</span>
                              <span style={{ color: severity > 7 ? '#df4759' : 'var(--primary)' }}>{severity} / 10</span>
                           </label>
                           <input 
                              type="range" 
                              min="1" max="10" 
                              value={severity} 
                              onChange={(e) => setSeverity(Number(e.target.value))}
                              style={{ width: '100%', accentColor: 'var(--primary)', height: '6px', background: 'var(--border)', outline: 'none', borderRadius: '4px' }}
                           />
                           <div style={{ marginTop: '10px', fontSize: '0.9rem', color: 'var(--text-medium)', fontStyle: 'italic' }}>
                              {`Generated Note: Patient presents with a level ${severity}/10 severity of ${diagnosis}.`}
                           </div>
                        </div>
                     )}

                     <textarea 
                        placeholder="Additional session notes / Suggested areas..." 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3} 
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontFamily: 'inherit' }}
                     />
                  </div>

                  {/* Prescription Builder */}
                  <div style={{ padding: '1.5rem', background: '#fff', borderRadius: '12px', border: '1px solid var(--primary)', marginBottom: '2rem' }}>
                     <h3 style={{ marginTop: 0, color: 'var(--primary)', marginBottom: '1rem' }}>2. Interactive Rx Builder</h3>
                     
                     {/* Row 1: Category */}
                     <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '8px', fontWeight: 'bold' }}>Choose Category:</div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                           {Object.keys(MEDS_DB).map(cat => (
                              <button 
                                 key={cat} onClick={() => { setActiveCat(cat); setActiveMed(''); }}
                                 className={`btn ${activeCat === cat ? 'btn-primary' : 'btn-secondary'}`}
                                 style={{ padding: '4px 12px', fontSize: '0.85rem', borderRadius: '20px' }}
                              >{cat}</button>
                           ))}
                        </div>
                     </div>

                     {/* Row 2: Medication */}
                     {activeCat && (
                        <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f5f8f8', borderRadius: '8px' }}>
                           <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '8px', fontWeight: 'bold' }}>Select Medication:</div>
                           <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {MEDS_DB[activeCat].map(med => (
                                 <button 
                                    key={med} onClick={() => setActiveMed(med)}
                                    className={`btn ${activeMed === med ? 'btn-primary' : 'btn-ghost'}`}
                                    style={{ padding: '4px 12px', fontSize: '0.85rem', borderRadius: '20px', border: activeMed === med ? 'none' : '1px solid var(--border)' }}
                                 >{med}</button>
                              ))}
                           </div>
                        </div>
                     )}

                     {/* Row 3: Titration & Buttons */}
                     {activeMed && (
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: '#fff5f0', padding: '1rem', borderRadius: '8px', border: '1px solid var(--accent)' }}>
                           <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-dark)', marginBottom: '8px', fontWeight: 'bold' }}>Dose Fraction:</div>
                              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                 {DOSES.map(d => (
                                   <button 
                                      key={d.id} onClick={() => setActiveDose(d)}
                                      className={`btn ${activeDose?.id === d.id ? 'btn-primary' : 'btn-secondary'}`}
                                      style={{ padding: '4px 10px', fontSize: '0.8rem', borderRadius: '6px' }}
                                   >{d.id}</button>
                                 ))}
                              </div>
                           </div>
                           
                           <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-dark)', marginBottom: '8px', fontWeight: 'bold' }}>Frequency:</div>
                              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                 {FREQS.map(f => (
                                   <button 
                                      key={f.id} onClick={() => setActiveFreq(f)}
                                      className={`btn ${activeFreq?.id === f.id ? 'btn-primary' : 'btn-secondary'}`}
                                      style={{ padding: '4px 10px', fontSize: '0.8rem', borderRadius: '6px' }}
                                   >{f.id}</button>
                                 ))}
                              </div>
                           </div>

                           <button 
                              onClick={addMedication}
                              disabled={!activeDose || !activeFreq}
                              className="btn btn-primary" 
                              style={{ height: 'fit-content', opacity: activeDose && activeFreq ? 1 : 0.5 }}
                           >
                              + Compile
                           </button>
                        </div>
                     )}
                  </div>

                  {/* Output Sentences */}
                  {prescriptions.length > 0 && (
                     <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#fdfdfd', border: '1px solid var(--border)', borderRadius: '8px' }}>
                        <h4 style={{ margin: '0 0 1rem', color: 'var(--text-dark)' }}>Compiled Arabic Prescription:</h4>
                        <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                           {prescriptions.map((rx, idx) => (
                              <li key={idx} dir="rtl" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f5f8f8', marginBottom: '8px', borderRadius: '6px', fontSize: '1.1rem', textAlign: 'right' }}>
                                 <span style={{ fontWeight: 600 }}>{rx}</span>
                                 <button onClick={() => removeMedication(idx)} className="btn btn-ghost" style={{ color: '#df4759', padding: '4px' }}><Trash2 size={16}/></button>
                              </li>
                           ))}
                        </ul>
                     </div>
                  )}

                  <div className="flex-between" style={{ borderTop: '2px solid var(--border)', paddingTop: '1.5rem' }}>
                     <button type="button" className="btn btn-secondary" onClick={() => window.print()}><Printer size={18} /> Print Rx PDF</button>
                     <button type="button" className="btn btn-primary" onClick={() => void discharge()} disabled={!activeQueueId}>
                       <Save size={18} /> Complete & Discharge
                     </button>
                  </div>
               </div>
            )}

            {activeTab === 'history' && (
               <div>
                  <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>History Comparison</h3>
                  <div style={{ padding: '1.5rem', background: 'var(--bg-color)', borderRadius: '8px', marginBottom: '1rem', textAlign: 'left' }}>
                     <div className="flex-between">
                        <strong>Visit: March 15, 2026 (Long Session)</strong>
                     </div>
                     <p>Patient presents with a level 7/10 severity of ADHD.</p>
                     <div style={{ background: '#fff', padding: '10px', borderRadius: '4px', border: '1px solid var(--border)', textAlign: 'right' }} dir="rtl">
                        يؤخذ قرص كامل من Concerta مرة يومياً
                     </div>
                  </div>
               </div>
            )}
         </div>

         {/* Side Panel: Clinical Brain Quick Reference */}
         <div className="card" style={{ background: 'var(--bg-color)', border: 'none', boxShadow: 'none' }}>
            <h3 style={{ marginTop: 0, color: 'var(--primary)', borderBottom: '2px solid var(--border-focus)', paddingBottom: '1rem', textAlign: 'left' }}>
               Clinical Brain (Titrations)
            </h3>
            <div style={{ background: '#fff', borderRadius: '8px', padding: '1rem', marginTop: '1rem', border: '1px solid var(--border)', textAlign: 'left' }}>
               <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-dark)' }}>Cipralex</h4>
               <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: 'var(--text-medium)' }}>• Day 1-7: <strong>1/2 Tab</strong></p>
               <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-medium)' }}>• Day 8+: <strong>1 Tab</strong></p>
            </div>
         </div>
      </div>
    </div>
  );
}
