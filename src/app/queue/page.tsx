"use client";

import React, { useCallback, useEffect, useState } from 'react';
import {
  Clock, CheckCircle, UserPlus,
  Plus, X, Search, UserCheck, AlertCircle, Phone
} from 'lucide-react';
import { useAuth } from '@/modules/auth/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { getNextQueueNumber, callNextPatient, getWaitingPatients } from '@/lib/supabase/queue';
import { validateQueueCheckIn, formatValidationErrors, sanitizePhoneNumber } from '@/lib/validation';
import type { PatientRow, QueueEntryRow } from '@/types/database';

type QueueRow = QueueEntryRow & { patients: PatientRow | null };

interface ExistingPatient {
  id: string;
  patient_code: string;
  full_name: string;
  age: number | null;
  phone: string | null;
  is_vezeeta: boolean;
}

export default function QueuePage() {
  const { activeClinicId } = useAuth();

  // Dynamic Config Data
  const [vTypes, setVTypes] = useState<any[]>([]);
  const [pMethods, setPMethods] = useState<any[]>([]);
  const [clinicData, setClinicData] = useState<any>(null);

  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [queue, setQueue] = useState<QueueRow[]>([]);

  // Modal States
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchResults, setSearchResults] = useState<ExistingPatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<ExistingPatient | null>(null);

  const [selVTypeId, setSelVTypeId] = useState('');
  const [selPMethodId, setSelPMethodId] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [isVezeeta, setIsVezeeta] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const fetchConfig = async () => {
      const [vRes, pRes, cRes] = await Promise.all([
        supabase.from('visit_types').select('*').order('name_ar'),
        supabase.from('payment_methods').select('*').order('name_ar'),
        supabase.from('clinics').select('*').eq('id', activeClinicId).single()
      ]);
      setVTypes(vRes.data || []);
      setPMethods(pRes.data || []);
      setClinicData(cRes.data);
      if (vRes.data?.length) setSelVTypeId(vRes.data[0].id);
      if (pRes.data?.length) setSelPMethodId(pRes.data[0].id);
    };
    fetchConfig();
  }, [activeClinicId, supabase]);

  // Handle Dynamic Fees
  useEffect(() => {
    if (clinicData && selVTypeId) {
      const vt = vTypes.find(v => v.id === selVTypeId);
      if (vt?.default_fee_type === 'consultation') {
        setAmountPaid(clinicData.consultation_fee.toString());
      } else {
        setAmountPaid(clinicData.followup_fee.toString());
      }
    }
  }, [selVTypeId, clinicData, vTypes]);

  const loadData = useCallback(async () => {
    const [pRes, qRes] = await Promise.all([
      supabase.from('patients').select('*').order('created_at', { ascending: false }),
      supabase.from('queue_entries')
        .select('*, patients(*)')
        .eq('clinic_id', activeClinicId)
        .order('queue_num', { ascending: true }),
    ]);
    setPatients(pRes.data || []);
    setQueue((qRes.data as QueueRow[]) || []);
  }, [activeClinicId, supabase]);

  useEffect(() => {
    loadData();
    const inv = setInterval(loadData, 10000);
    return () => clearInterval(inv);
  }, [loadData]);

  // Search for existing patients
  const searchExistingPatients = async (name: string, phone: string) => {
    if (name.length < 2 && phone.length < 5) {
      setSearchResults([]);
      return;
    }

    const { data } = await supabase
      .from('patients')
      .select('id, patient_code, full_name, age, phone, is_vezeeta')
      .or(`full_name.ilike.%${name}%,phone.ilike.%${phone}%`)
      .limit(5);

    setSearchResults(data || []);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const cleanPhone = sanitizePhoneNumber(searchPhone);
      searchExistingPatients(searchName, cleanPhone);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchName, searchPhone]);

  const handleCheckIn = async (pId: string | null = null) => {
    // Validation
    const validation = validateQueueCheckIn({
      patientId: pId,
      searchName: selectedPatient ? selectedPatient.full_name : searchName,
      visitTypeId: selVTypeId,
      paymentMethodId: selPMethodId,
      amountPaid
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      alert(formatValidationErrors(validation.errors));
      return;
    }

    setLoading(true);
    try {
      let patient: PatientRow | null = null;

      if (pId || selectedPatient) {
        // Use existing patient
        const existingId = pId || selectedPatient?.id;
        if (!existingId) throw new Error('No patient ID provided');
        patient = patients.find(p => p.id === existingId) || null;
      } else {
        // Create new patient (using sequence for patient code)
        const { data, error: pError } = await supabase
          .from('patients')
          .insert({
            full_name: searchName.trim(),
            phone: sanitizePhoneNumber(searchPhone),
            is_vezeeta: isVezeeta
          })
          .select()
          .single();

        if (pError) throw pError;
        patient = data;
      }

      if (!patient) throw new Error('Failed to get or create patient');

      // Get next queue number atomically
      const queueNum = await getNextQueueNumber();

      // Create queue entry
      const { error: qError } = await supabase.from('queue_entries').insert({
        patient_id: patient.id,
        clinic_id: activeClinicId,
        queue_num: queueNum,
        visit_type_id: selVTypeId,
        payment_method_id: selPMethodId,
        amount_paid: Number(amountPaid),
        is_vezeeta: isVezeeta,
        status: 'waiting'
      });

      if (qError) throw qError;

      // Reset form
      setShowCheckInModal(false);
      setSearchName('');
      setSearchPhone('');
      setSearchResults([]);
      setSelectedPatient(null);
      setErrors({});
      setIsVezeeta(false);
      loadData();
    } catch (error: any) {
      console.error('Check-in error:', error);
      alert('خطأ في تسجيل المريض: ' + error.message + '\n\nError during check-in: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCallNextPatient = async () => {
    if (!activeClinicId) return;
    try {
      const nextPatient = await callNextPatient(activeClinicId);
      if (nextPatient) {
        alert(`Calling patient ${nextPatient.queue_num}: ${nextPatient.patients?.full_name}`);
        loadData();
      } else {
        alert('No patients waiting in queue');
      }
    } catch (error: any) {
      console.error('Error calling next patient:', error);
      alert('Error calling next patient: ' + error.message);
    }
  };

  const handleSelectExistingPatient = (patient: ExistingPatient) => {
    setSelectedPatient(patient);
    setSearchName(patient.full_name);
    setSearchPhone(patient.phone || '');
    setSearchResults([]);
    setErrors({});
    setIsVezeeta(patient.is_vezeeta);
  };

  const handleCreateNewPatient = () => {
    setSelectedPatient(null);
    setSearchResults([]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="card shadow-sm" style={{ borderLeft: '5px solid var(--primary)' }}>
         <div className="flex-between">
            <div>
              <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>Clinic Queue & Reception</h1>
              <p style={{ color: 'var(--text-light)', marginTop: '5px' }}>Logged into: <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{clinicData?.name_ar}</span></p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary" style={{ padding: '0.8rem 1.5rem', borderRadius: '12px' }} onClick={() => setShowCheckInModal(true)}>
                 <UserPlus size={20}/> Check-in Patient
              </button>
              <button
                className="btn btn-success"
                style={{ padding: '0.8rem 1.5rem', borderRadius: '12px', background: 'var(--success)', borderColor: 'var(--success)' }}
                onClick={handleCallNextPatient}
              >
                <UserCheck size={20}/> Call Next
              </button>
            </div>
         </div>
      </div>

      <div className="table-container">
         <table>
            <thead>
               <tr>
                  <th>No.</th>
                  <th>Patient Detail</th>
                  <th>Visit Category</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th>Actions</th>
               </tr>
            </thead>
            <tbody>
               {queue.map(q => (
                 <tr key={q.id}>
                    <td><div style={{ width: '30px', height: '30px', background: 'var(--bg-color)', color: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{q.queue_num}</div></td>
                    <td>
                       <div style={{ fontWeight: 800 }}>{q.patients?.full_name}</div>
                       <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{q.patients?.patient_code}</div>
                    </td>
                    <td><span className="badge badge-active">{vTypes.find(v => v.id === q.visit_type_id)?.name_ar || 'Consultation'}</span></td>
                    <td style={{ fontWeight: 800, color: 'var(--success)' }}>{q.amount_paid} EGP</td>
                    <td><span className={`badge ${q.status === 'done' ? 'badge-active' : q.status === 'active' ? 'badge-waiting' : ''}`}>{q.status}</span></td>
                    <td>
                       {q.is_vezeeta ? <span className="badge" style={{ background: '#0070f3', color: 'white' }}>Vezeeta</span> : <span className="badge">Internal</span>}
                    </td>
                    <td>
                       <button className="btn btn-ghost" onClick={async () => {
                          await supabase.from('queue_entries').update({ status: 'done' }).eq('id', q.id);
                          loadData();
                       }}><CheckCircle size={18} style={{ color: 'var(--success)' }}/></button>
                    </td>
                 </tr>
               ))}
               {queue.length === 0 && (
                 <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-light)' }}>
                       <Clock size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }}/>
                       <div>No patients in queue for {clinicData?.name_ar}</div>
                    </td>
                 </tr>
               )}
            </tbody>
         </table>
      </div>

      {showCheckInModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <div className="card shadow-lg" style={{ maxWidth: 600, width: '100%', padding: '2.5rem', borderRadius: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="flex-between" style={{ marginBottom: '2rem' }}>
                 <h2 style={{ color: 'var(--primary)', margin: 0, fontWeight: 800 }}>Patient Check-in</h2>
                 <button onClick={() => {
                   setShowCheckInModal(false);
                   setSearchName('');
                   setSearchPhone('');
                   setSearchResults([]);
                   setSelectedPatient(null);
                   setErrors({});
                 }}><X/></button>
              </div>

              {/* Search Section */}
              <div style={{ marginBottom: '1.5rem' }}>
                 <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>Search Existing Patients</label>
                 <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: '1fr auto' }}>
                    <div style={{ position: 'relative' }}>
                       <input
                         value={searchName}
                         onChange={e => {
                           setSearchName(e.target.value);
                           handleCreateNewPatient();
                         }}
                         placeholder="Patient Name"
                         style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: errors.patient ? '2px solid #df4759' : '1px solid var(--border)' }}
                       />
                       <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-light)' }} />
                    </div>
                    <div style={{ position: 'relative' }}>
                       <input
                         value={searchPhone}
                         onChange={e => {
                           setSearchPhone(e.target.value);
                           handleCreateNewPatient();
                         }}
                         placeholder="Phone Number"
                         style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: errors.patient ? '2px solid #df4759' : '1px solid var(--border)' }}
                       />
                       <Phone size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-light)' }} />
                    </div>
                 </div>

                 {/* Search Results */}
                 {searchResults.length > 0 && !selectedPatient && (
                   <div style={{ marginTop: '1rem', maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '12px' }}>
                      {searchResults.map(patient => (
                        <div
                          key={patient.id}
                          onClick={() => handleSelectExistingPatient(patient)}
                          style={{
                            padding: '12px',
                            borderBottom: '1px solid var(--border)',
                            cursor: 'pointer',
                            background: 'white',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-color)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                        >
                          <div style={{ fontWeight: 800, fontSize: '1rem' }}>{patient.full_name}</div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', display: 'flex', gap: '10px' }}>
                            <span>{patient.patient_code}</span>
                            <span>{patient.age}y</span>
                            <span>{patient.phone}</span>
                          </div>
                        </div>
                      ))}
                   </div>
                 )}

                 {searchResults.length === 0 && (searchName.length >= 2 || searchPhone.length >= 5) && (
                   <div style={{ marginTop: '1rem', padding: '1rem', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center' }}>
                      <AlertCircle size={16} style={{ color: '#ffc107', display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
                      No existing patients found. Will create new patient.
                   </div>
                 )}
              </div>

              {/* Selected Patient Info */}
              {selectedPatient && (
                <div style={{ background: '#e6f4ff', border: '1px solid #0070f3', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0070f3' }}>{selectedPatient.full_name}</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Code: {selectedPatient.patient_code} • Age: {selectedPatient.age}</div>
                      </div>
                      <button
                        onClick={handleCreateNewPatient}
                        className="btn btn-ghost"
                        style={{ color: '#0070f3', padding: '8px' }}
                      >
                        Use Different Patient
                      </button>
                   </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                 <div>
                    <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>Visit Type</label>
                    <select value={selVTypeId} onChange={e => setSelVTypeId(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: errors.visitType ? '2px solid #df4759' : '1px solid var(--border)' }}>
                       {vTypes.map(vt => <option key={vt.id} value={vt.id}>{vt.name_ar}</option>)}
                    </select>
                    {errors.visitType && <div style={{ color: '#df4759', fontSize: '0.85rem', marginTop: '4px' }}>{errors.visitType}</div>}
                 </div>
                 <div>
                    <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>Payment Method</label>
                    <select value={selPMethodId} onChange={e => setSelPMethodId(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: errors.paymentMethod ? '2px solid #df4759' : '1px solid var(--border)' }}>
                       {pMethods.map(pm => <option key={pm.id} value={pm.id}>{pm.name_ar}</option>)}
                    </select>
                    {errors.paymentMethod && <div style={{ color: '#df4759', fontSize: '0.85rem', marginTop: '4px' }}>{errors.paymentMethod}</div>}
                 </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                 <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>Amount Collected (EGP)</label>
                 <input type="number" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: errors.amountPaid ? '2px solid #df4759' : '2px solid var(--primary)', fontSize: '1.2rem', fontWeight: 800, textAlign: 'center' }} />
                 {errors.amountPaid && <div style={{ color: '#df4759', fontSize: '0.85rem', marginTop: '4px' }}>{errors.amountPaid}</div>}
              </div>

              <div className="card" style={{ background: isVezeeta ? '#e6f4ff' : '#f8f9fa', border: isVezeeta ? '2px solid #0070f3' : '1px solid var(--border)', cursor: 'pointer' }} onClick={() => setIsVezeeta(!isVezeeta)}>
                 <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontWeight: 800, color: '#0070f3' }}>
                    <input type="checkbox" checked={isVezeeta} onChange={() => {}} style={{ width: '22px', height: '22px' }} />
                    Vezeeta platform patient?
                 </label>
              </div>

              <button
                className="btn btn-primary"
                onClick={() => handleCheckIn(selectedPatient?.id || null)}
                disabled={loading}
                style={{ padding: '1.2rem', fontSize: '1.1rem', borderRadius: '14px', marginTop: '1rem', width: '100%' }}
              >
                {loading ? 'Processing...' : <><Plus size={20}/> Confirm & Print Ticket
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
