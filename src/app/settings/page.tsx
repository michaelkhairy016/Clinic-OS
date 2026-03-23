"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/modules/auth/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { 
  Settings, MapPin, CreditCard, Stethoscope, 
  Plus, Save, Trash2, Globe, Building2 
} from 'lucide-react';

export default function SettingsPage() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<'clinics' | 'visits' | 'payments' | 'masters'>('clinics');
  const [loading, setLoading] = useState(false);
  
  const [clinics, setClinics] = useState<any[]>([]);
  const [visitTypes, setVisitTypes] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [cRes, vRes, pRes] = await Promise.all([
      supabase.from('clinics').select('*').order('name_ar'),
      supabase.from('visit_types').select('*').order('name_ar'),
      supabase.from('payment_methods').select('*').order('name_ar'),
    ]);
    setClinics(cRes.data || []);
    setVisitTypes(vRes.data || []);
    setPayments(pRes.data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (role !== 'doctor') return <div className="p-8">Access Denied. Doctors only.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="card">
        <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>Clinic Configuration Hub</h1>
        <p style={{ color: 'var(--text-light)', marginTop: '5px' }}>Manage prices, visit logic, and clinical locations.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
        {[
          { id: 'clinics', label: 'Branches & Prices', icon: <Building2 size={18}/> },
          { id: 'visits', label: 'Visit Types', icon: <Stethoscope size={18}/> },
          { id: 'payments', label: 'Payments', icon: <CreditCard size={18}/> },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="card shadow-sm">
        {activeTab === 'clinics' && (
          <div>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
               <h3>Clinical Branches (Shoubra & Masr ElGedida)</h3>
               <button className="btn btn-primary" onClick={() => {}}><Plus size={18}/> Add Branch</button>
            </div>
            <div className="table-container">
               <table>
                  <thead>
                     <tr>
                        <th>Branch Name (AR)</th>
                        <th>Consultation Fee</th>
                        <th>Follow-up Fee</th>
                        <th>Actions</th>
                     </tr>
                  </thead>
                  <tbody>
                     {clinics.map(c => (
                       <tr key={c.id}>
                          <td><strong>{c.name_ar}</strong></td>
                          <td>{c.consultation_fee} EGP</td>
                          <td>{c.followup_fee} EGP</td>
                          <td>
                             <button className="btn btn-ghost"><Save size={18} style={{ color: 'var(--primary)' }}/></button>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {activeTab === 'visits' && (
          <div>
             <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                <h3>Visit Logic Config</h3>
                <button className="btn btn-primary"><Plus size={18}/> Add Type</button>
             </div>
             <div className="table-container">
               <table>
                  <thead>
                     <tr>
                        <th>Title (Arabic)</th>
                        <th>Fee Mapping</th>
                        <th>Actions</th>
                     </tr>
                  </thead>
                  <tbody>
                     {visitTypes.map(v => (
                       <tr key={v.id}>
                          <td><strong>{v.name_ar}</strong></td>
                          <td>{v.default_fee_type === 'consultation' ? 'Full Consultation Fee' : 'Follow-up Fee'}</td>
                          <td><button className="btn btn-ghost"><Trash2 size={18}/></button></td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div>
             <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                <h3>Payment Methods (Including Vezeeta)</h3>
                <button className="btn btn-primary"><Plus size={18}/> Add Method</button>
             </div>
             <div className="table-container">
               <table>
                  <thead>
                     <tr>
                        <th>Method</th>
                        <th>Arabic Name</th>
                        <th>Status</th>
                        <th>Actions</th>
                     </tr>
                  </thead>
                  <tbody>
                     {payments.map(p => (
                       <tr key={p.id}>
                          <td>{p.name_en || 'Internal'}</td>
                          <td><strong>{p.name_ar}</strong></td>
                          <td><span className="badge badge-active">Active</span></td>
                          <td><button className="btn btn-ghost"><Trash2 size={18}/></button></td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
