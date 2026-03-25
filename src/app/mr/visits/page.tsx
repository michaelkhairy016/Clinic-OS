"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/modules/auth/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { 
  PlusCircle, X, Save, 
  Loader2 
} from 'lucide-react';

export default function MRVisitsPage() {
  const { role } = useAuth();
  const [visits, setVisits] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New Med Form State
  const [newMedName, setNewMedName] = useState('');
  const [newMedGeneric, setNewMedGeneric] = useState('');
  const [newMedCategory, setNewMedCategory] = useState('');
  const [addingMed, setAddingMed] = useState(false);

  const supabase = createClient();

  const fetchVisits = useCallback(async () => {
    const { data } = await supabase
      .from('mr_visits')
      .select('*, pharma_companies(name_ar, name_en), medical_lines(name_ar, name_en)')
      .order('created_at', { ascending: false });
    setVisits(data || []);
  }, [supabase]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  const handleAddMed = async () => {
    setAddingMed(true);
    const { error } = await supabase.from('medication_master').insert({
      trade_name_en: newMedName,
      generic_name_en: newMedGeneric,
      category: newMedCategory,
    });
    if (error) alert(error.message);
    else {
      setShowAddModal(false);
      setNewMedName('');
      setNewMedGeneric('');
    }
    setAddingMed(false);
  };

  if (role !== 'doctor') return <div className="p-8">Access Denied. Doctors only.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="card">
        <div className="flex-between">
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>MR Visits Log</h1>
            <p style={{ color: 'var(--text-light)', marginTop: '5px' }}>Track representatives and officialize new drug launches into your brain library.</p>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Representative</th>
              <th>Company</th>
              <th>Specialty Line</th>
              <th>Promoted Medicines</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visits.map(v => (
              <tr key={v.id}>
                <td><div style={{ fontWeight: 800, color: 'var(--primary)' }}>{v.mr_name}</div></td>
                <td>
                  {v.pharma_companies?.name_en || (
                    <span className="badge" style={{ background: '#fff3cd', color: '#856404' }}>
                       Custom: {v.other_company_name}
                    </span>
                  )}
                </td>
                <td>
                   {v.medical_lines?.name_en || (
                     <span className="badge" style={{ background: '#e2e3e5', color: '#383d41' }}>
                        Custom: {v.other_line_name}
                     </span>
                   )}
                </td>
                <td><div style={{ maxWidth: '300px', fontSize: '0.9rem' }}>{v.promoted_meds}</div></td>
                <td style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>
                   {new Date(v.created_at).toLocaleDateString()}
                </td>
                <td>
                   <button 
                     className="btn btn-secondary" 
                     onClick={() => {
                        setNewMedName(v.promoted_meds.split(',')[0]); // Take first med as suggestion
                        setShowAddModal(true);
                     }}
                     style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
                   >
                      <PlusCircle size={16}/> Add to Brain
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ maxWidth: 450, width: '100%', padding: '2rem' }}>
             <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}>Add New Medication</h2>
                <button onClick={() => setShowAddModal(false)}><X/></button>
             </div>
             
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                   <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Trade Name (e.g. Cipralex)</label>
                   <input value={newMedName} onChange={e => setNewMedName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                </div>
                <div>
                   <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Generic Name (e.g. Escitalopram)</label>
                   <input value={newMedGeneric} onChange={e => setNewMedGeneric(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                </div>
                <div>
                   <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Category</label>
                   <input value={newMedCategory} onChange={e => setNewMedCategory(e.target.value)} placeholder="e.g. SSRI, Antipsychotic" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                </div>
                <button 
                  disabled={addingMed}
                  className="btn btn-primary"
                  onClick={handleAddMed}
                  style={{ marginTop: '1rem', width: '100%' }}
                >
                   {addingMed ? <Loader2 className="spinner"/> : (
                     <>
                       <Save size={18}/> Save to Clinical Brain
                     </>
                   )}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
