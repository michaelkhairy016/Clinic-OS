"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, Plus, Loader2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Medication = {
  id: string;
  trade_name_en: string;
  generic_name_en: string;
  category: string;
  dose_form: string;
};

type Frequency = {
  id: string;
  phrase_en: string;
  phrase_ar: string;
};

type Titration = {
  id: string;
  medication_name: string;
  start_dose: string;
  target_dose: string;
  increment_step: string;
  days_per_step: number;
  notes: string;
};

export default function MasterLibrary() {
  const [activeTab, setActiveTab] = useState<'medications' | 'frequencies' | 'titrations'>('medications');
  const [meds, setMeds] = useState<Medication[]>([]);
  const [freqs, setFreqs] = useState<Frequency[]>([]);
  const [titrations, setTitrations] = useState<Titration[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newMed, setNewMed] = useState({ trade_name_en: '', generic_name_en: '', category: '', dose_form: 'Pill' });
  const [newFreq, setNewFreq] = useState({ phrase_en: '', phrase_ar: '' });
  const [newTitration, setNewTitration] = useState({ medication_name: '', start_dose: '', target_dose: '', increment_step: '', days_per_step: 7, notes: '' });

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'medications') {
        const { data } = await supabase.from('medication_master').select('*').order('trade_name_en');
        setMeds(data || []);
      } else if (activeTab === 'frequencies') {
        const { data } = await supabase.from('frequency_dictionary').select('*').order('phrase_en');
        setFreqs(data || []);
      } else if (activeTab === 'titrations') {
        const { data } = await supabase.from('titration_protocols').select('*').order('medication_name');
        setTitrations(data || []);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddMed = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await supabase.from('medication_master').insert(newMed);
    if (error) alert(error.message);
    else {
      setShowAddModal(false);
      setNewMed({ trade_name_en: '', generic_name_en: '', category: '', dose_form: 'Pill' });
      fetchData();
    }
    setIsSubmitting(false);
  };

  const handleAddFreq = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await supabase.from('frequency_dictionary').insert(newFreq);
    if (error) alert(error.message);
    else {
      setShowAddModal(false);
      setNewFreq({ phrase_en: '', phrase_ar: '' });
      fetchData();
    }
    setIsSubmitting(false);
  };

  const handleAddTitration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await supabase.from('titration_protocols').insert({
      ...newTitration,
      days_per_step: Number(newTitration.days_per_step)
    });
    if (error) alert(error.message);
    else {
      setShowAddModal(false);
      setNewTitration({ medication_name: '', start_dose: '', target_dose: '', increment_step: '', days_per_step: 7, notes: '' });
      fetchData();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (table: string, id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) alert(error.message);
    else fetchData();
  };

  return (
    <div className="card">
      <div className="flex-between">
        <h2 style={{ margin: 0, color: 'var(--primary)', fontWeight: 800 }}>Clinical Brain (Master Library)</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className={`btn ${activeTab === 'medications' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('medications')}>Medications</button>
          <button className={`btn ${activeTab === 'frequencies' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('frequencies')}>Frequencies</button>
          <button className={`btn ${activeTab === 'titrations' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('titrations')}>Titration Protocols</button>
        </div>
      </div>

      <div className="flex-between" style={{ marginTop: '2rem' }}>
        <h3 style={{ margin: 0, color: 'var(--text-medium)' }}>
          {activeTab === 'medications' ? 'Medications Inventory' : activeTab === 'frequencies' ? 'Frequency Dictionary' : 'Titration Logic'}
        </h3>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> {activeTab === 'medications' ? 'Add Medication' : activeTab === 'frequencies' ? 'Add Frequency' : 'Add Titration'}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <Loader2 size={32} className="spinner" style={{ color: 'var(--primary)', margin: '0 auto' }} />
          <p style={{ color: 'var(--text-light)', marginTop: '1rem' }}>Updating Brain Access...</p>
        </div>
      ) : (
        <div className="table-container">
          <table style={{ textAlign: 'left' }}>
            <thead>
              {activeTab === 'medications' ? (
                <tr>
                  <th style={{ textAlign: 'left' }}>Trade Name</th>
                  <th style={{ textAlign: 'left' }}>Generic Name</th>
                  <th style={{ textAlign: 'left' }}>Category</th>
                  <th style={{ textAlign: 'left' }}>Form</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              ) : activeTab === 'frequencies' ? (
                <tr>
                  <th style={{ textAlign: 'left' }}>Code (EN)</th>
                  <th style={{ textAlign: 'left' }}>Label (AR)</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              ) : (
                <tr>
                  <th style={{ textAlign: 'left' }}>Medication</th>
                  <th style={{ textAlign: 'left' }}>Start → Target</th>
                  <th style={{ textAlign: 'left' }}>Increment</th>
                  <th style={{ textAlign: 'left' }}>Days/Step</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              )}
            </thead>
            <tbody>
              {activeTab === 'medications' && meds.map(med => (
                <tr key={med.id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{med.trade_name_en}</td>
                  <td>{med.generic_name_en}</td>
                  <td><span className="badge badge-waiting">{med.category}</span></td>
                  <td>{med.dose_form}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost" style={{ color: '#df4759' }} onClick={() => handleDelete('medication_master', med.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {activeTab === 'frequencies' && freqs.map(freq => (
                <tr key={freq.id}>
                  <td style={{ fontWeight: 800 }}>{freq.phrase_en}</td>
                  <td dir="rtl" style={{ fontSize: '1.1rem' }}>{freq.phrase_ar}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost" style={{ color: '#df4759' }} onClick={() => handleDelete('frequency_dictionary', freq.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {activeTab === 'titrations' && titrations.map(tit => (
                <tr key={tit.id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{tit.medication_name}</td>
                  <td>{tit.start_dose} → {tit.target_dose}</td>
                  <td>{tit.increment_step}</td>
                  <td>{tit.days_per_step} days</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost" style={{ color: '#df4759' }} onClick={() => handleDelete('titration_protocols', tit.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Basic Add Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', marginBottom: 0 }}>
            <div className="flex-between">
              <h3>{activeTab === 'medications' ? 'New Medication' : activeTab === 'frequencies' ? 'New Frequency' : 'New Titration Protocol'}</h3>
              <button className="btn btn-ghost" onClick={() => setShowAddModal(false)}><X size={20}/></button>
            </div>

            {activeTab === 'medications' ? (
              <form onSubmit={handleAddMed} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input placeholder="Trade Name (e.g. Cipralex)" value={newMed.trade_name_en} onChange={e => setNewMed({...newMed, trade_name_en: e.target.value})} required className="btn" style={{ border: '1px solid var(--border)', textAlign: 'left' }} />
                <input placeholder="Generic Name" value={newMed.generic_name_en} onChange={e => setNewMed({...newMed, generic_name_en: e.target.value})} required className="btn" style={{ border: '1px solid var(--border)', textAlign: 'left' }} />
                <input placeholder="Category (e.g. SSRI)" value={newMed.category} onChange={e => setNewMed({...newMed, category: e.target.value})} className="btn" style={{ border: '1px solid var(--border)', textAlign: 'left' }} />
                <select value={newMed.dose_form} onChange={e => setNewMed({...newMed, dose_form: e.target.value})} className="btn" style={{ border: '1px solid var(--border)' }}>
                   <option value="Pill">Pill</option>
                   <option value="Syrup">Syrup</option>
                   <option value="Injection">Injection</option>
                </select>
                <button disabled={isSubmitting} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                   {isSubmitting ? 'Saving...' : 'Add to Library'}
                </button>
              </form>
            ) : activeTab === 'frequencies' ? (
              <form onSubmit={handleAddFreq} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input placeholder="Code (e.g. OD)" value={newFreq.phrase_en} onChange={e => setNewFreq({...newFreq, phrase_en: e.target.value})} required className="btn" style={{ border: '1px solid var(--border)', textAlign: 'left' }} />
                <input dir="rtl" placeholder="الاسم (مثلاً: مرة يومياً)" value={newFreq.phrase_ar} onChange={e => setNewFreq({...newFreq, phrase_ar: e.target.value})} required className="btn" style={{ border: '1px solid var(--border)', textAlign: 'right' }} />
                <button disabled={isSubmitting} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                   {isSubmitting ? 'Saving...' : 'Add to Library'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleAddTitration} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input placeholder="Medication Name (e.g. Cipralex)" value={newTitration.medication_name} onChange={e => setNewTitration({...newTitration, medication_name: e.target.value})} required className="btn" style={{ border: '1px solid var(--border)', textAlign: 'left' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <input placeholder="Start Dose (5mg)" value={newTitration.start_dose} onChange={e => setNewTitration({...newTitration, start_dose: e.target.value})} required className="btn" style={{ border: '1px solid var(--border)', textAlign: 'left' }} />
                  <input placeholder="Target Dose (20mg)" value={newTitration.target_dose} onChange={e => setNewTitration({...newTitration, target_dose: e.target.value})} required className="btn" style={{ border: '1px solid var(--border)', textAlign: 'left' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <input placeholder="Increment (5mg)" value={newTitration.increment_step} onChange={e => setNewTitration({...newTitration, increment_step: e.target.value})} required className="btn" style={{ border: '1px solid var(--border)', textAlign: 'left' }} />
                  <input type="number" placeholder="Days per Step" value={newTitration.days_per_step} onChange={e => setNewTitration({...newTitration, days_per_step: Number(e.target.value)})} required className="btn" style={{ border: '1px solid var(--border)', textAlign: 'left' }} />
                </div>
                <textarea placeholder="Notes (optional)" value={newTitration.notes} onChange={e => setNewTitration({...newTitration, notes: e.target.value})} className="btn" style={{ border: '1px solid var(--border)', textAlign: 'left', minHeight: '60px' }} />
                <button disabled={isSubmitting} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                   {isSubmitting ? 'Saving...' : 'Add Titration Protocol'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
