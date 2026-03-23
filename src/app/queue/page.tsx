"use client";

import React, { useCallback, useEffect, useState } from 'react';
import {
  Clock, Play, CheckCircle, Smartphone, UserPlus, CreditCard, 
  Edit, History as HistoryIcon, DollarSign, Plus, AlertCircle, 
  X, Search, Loader2 
} from 'lucide-react';
import { useAuth } from '@/modules/auth/AuthContext';
import { createClient } from '@/lib/supabase/client';
import type { PatientRow, QueueEntryRow } from '@/types/database';

type QueueRow = QueueEntryRow & { patients: PatientRow | null };

export default function QueuePage() {
  const { role, activeClinicId } = useAuth();
  
  // Dynamic Config Data
  const [vTypes, setVTypes] = useState<any[]>([]);
  const [pMethods, setPMethods] = useState<any[]>([]);
  const [clinicData, setClinicData] = useState<any>(null);

  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [queue, setQueue] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [selVTypeId, setSelVTypeId] = useState('');
  const [selPMethodId, setSelPMethodId] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [isVezeeta, setIsVezeeta] = useState(false);
  
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
    setLoading(false);
  }, [activeClinicId, supabase]);

  useEffect(() => {
    loadData();
    const inv = setInterval(loadData, 10000);
    return () => clearInterval(inv);
  }, [loadData]);

  const handleCheckIn = async (pId: string | null = null) => {
    const { data: maxRow } = await supabase.from('queue_entries').select('queue_num').order('queue_num', { ascending: false }).limit(1).maybeSingle();
    const queueNum = (maxRow?.queue_num ?? 0) + 1;

    let patient: PatientRow | null = null;
    if (pId) {
      patient = patients.find(p => p.id === pId) || null;
    } else {
      const { count } = await supabase.from('patients').select('*', { count: 'exact', head: true });
      const patientCode = `P-${1000 + (count || 0) + 1}`;
      const { data } = await supabase.from('patients').insert({
        patient_code: patientCode,
        full_name: searchName.trim(),
        is_vezeeta: isVezeeta
      }).select().single();
      patient = data;
    }

    if (!patient) return;

    await supabase.from('queue_entries').insert({
      patient_id: patient.id,
      clinic_id: activeClinicId,
      queue_num: queueNum,
      visit_type_id: selVTypeId,
      payment_method_id: selPMethodId,
      amount_paid: Number(amountPaid),
      is_vezeeta: isVezeeta,
      status: 'waiting',
      check_in_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    
    setShowCheckInModal(false);
    loadData();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="card shadow-sm" style={{ borderLeft: '5px solid var(--primary)' }}>
         <div className="flex-between">
            <div>
              <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>Clinic Queue & Reception</h1>
              <p style={{ color: 'var(--text-light)', marginTop: '5px' }}>Logged into: <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{clinicData?.name_ar}</span></p>
            </div>
            <button className="btn btn-primary" style={{ padding: '0.8rem 1.5rem', borderRadius: '12px' }} onClick={() => setShowCheckInModal(true)}>
               <UserPlus size={20}/> Check-in Patient
            </button>
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
                    <td><span className={`badge ${q.status === 'done' ? 'badge-active' : ''}`}>{q.status}</span></td>
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
           <div className="card shadow-lg" style={{ maxWidth: 500, width: '100%', padding: '2.5rem', borderRadius: '24px' }}>
              <div className="flex-between" style={{ marginBottom: '2rem' }}>
                 <h2 style={{ color: 'var(--primary)', margin: 0, fontWeight: 800 }}>Patient Check-in</h2>
                 <button onClick={() => setShowCheckInModal(false)}><X/></button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                 <div>
                    <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>Patient Name / Search</label>
                    <div style={{ position: 'relative' }}>
                       <input value={searchName} onChange={e => setSearchName(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid var(--border)', paddingLeft: '40px' }} />
                       <Search size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-light)' }} />
                    </div>
                 </div>

                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>Visit Type</label>
                        <select value={selVTypeId} onChange={e => setSelVTypeId(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                           {vTypes.map(vt => <option key={vt.id} value={vt.id}>{vt.name_ar}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>Payment Method</label>
                        <select value={selPMethodId} onChange={e => setSelPMethodId(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                           {pMethods.map(pm => <option key={pm.id} value={pm.id}>{pm.name_ar}</option>)}
                        </select>
                    </div>
                 </div>

                 <div>
                    <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>Amount Collected (EGP)</label>
                    <input type="number" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid var(--primary)', fontSize: '1.2rem', fontWeight: 800, textAlign: 'center' }} />
                 </div>

                 <div className="card" style={{ background: isVezeeta ? '#e6f4ff' : '#f8f9fa', border: isVezeeta ? '2px solid #0070f3' : '1px solid var(--border)', cursor: 'pointer' }} onClick={() => setIsVezeeta(!isVezeeta)}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontWeight: 800, color: '#0070f3' }}>
                       <input type="checkbox" checked={isVezeeta} onChange={() => {}} style={{ width: '22px', height: '22px' }} />
                       Vezeeta platform patient?
                    </label>
                 </div>

                 <button className="btn btn-primary" onClick={() => handleCheckIn()} style={{ padding: '1.2rem', fontSize: '1.1rem', borderRadius: '14px', marginTop: '1rem' }}>
                    <Plus size={20}/> Confirm & Print Ticket
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
