"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, DollarSign, Plus, Trash2, Loader2, Save, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Clinic = {
  id: string;
  name_ar: string;
  address_ar: string;
  consultation_fee: number;
  followup_fee: number;
};

export default function ClinicsManager() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempClinic, setTempClinic] = useState<Clinic | null>(null);
  
  const supabase = createClient();

  const fetchClinics = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('clinics').select('*').order('name_ar');
    setClinics(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchClinics();
  }, [fetchClinics]);

  const handleStartEdit = (clinic: Clinic) => {
    setEditingId(clinic.id);
    setTempClinic({ ...clinic });
  };

  const handleSave = async () => {
    if (!tempClinic) return;
    const { error } = await supabase.from('clinics').update({
       name_ar: tempClinic.name_ar,
       address_ar: tempClinic.address_ar,
       consultation_fee: tempClinic.consultation_fee,
       followup_fee: tempClinic.followup_fee
    }).eq('id', tempClinic.id);

    if (error) alert(error.message);
    else {
      setEditingId(null);
      fetchClinics();
    }
  };

  const handleAddDefault = async () => {
    const { error } = await supabase.from('clinics').insert({
      name_ar: 'الفرع الجديد',
      address_ar: 'عنوان العيادة...',
      consultation_fee: 500,
      followup_fee: 300
    });
    if (error) alert(error.message);
    else fetchClinics();
  };

  const deleteClinic = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه العيادة؟')) return;
    await supabase.from('clinics').delete().eq('id', id);
    fetchClinics();
  };

  return (
    <div className="card">
      <div className="flex-between">
        <h2 style={{ margin: 0, color: 'var(--primary)', fontWeight: 800 }}>إدارة العيادات وقوائم الأسعار</h2>
        <button className="btn btn-primary" onClick={handleAddDefault}>
          <Plus size={16} /> إضافة عيادة
        </button>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: '3rem' }}><Loader2 className="spinner" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
          {clinics.map(clinic => {
            const isEditing = editingId === clinic.id;
            const item = isEditing ? tempClinic! : clinic;

            return (
              <div key={clinic.id} className="card" style={{ border: isEditing ? '2px solid var(--primary)' : '1px solid var(--border)', background: '#fafcfc', padding: '1.5rem', marginBottom: 0 }}>
                <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                  {isEditing ? (
                    <input 
                      style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', borderBottom: '2px solid var(--primary)', background: 'transparent', textAlign: 'right' }}
                      value={item.name_ar}
                      onChange={e => setTempClinic({...item, name_ar: e.target.value})}
                      dir="rtl"
                    />
                  ) : (
                    <h3 style={{ margin: 0, color: 'var(--primary)', fontWeight: 800 }}>{clinic.name_ar}</h3>
                  )}
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {isEditing ? (
                      <>
                        <button className="btn btn-ghost" onClick={handleSave} style={{ color: 'var(--success)' }}><Save size={18}/></button>
                        <button className="btn btn-ghost" onClick={() => setEditingId(null)}><X size={18}/></button>
                      </>
                    ) : (
                       <>
                         <button className="btn btn-ghost" onClick={() => handleStartEdit(clinic)}><MapPin size={18}/></button>
                         <button className="btn btn-ghost" style={{ color: '#df4759' }} onClick={() => deleteClinic(clinic.id)}><Trash2 size={18}/></button>
                       </>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ padding: '10px', background: 'white', borderRadius: '8px', border: '1px solid var(--border)' }}>
                     <label style={{ fontSize: '0.8rem', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>العنوان</label>
                     {isEditing ? (
                       <input value={item.address_ar} onChange={e => setTempClinic({...item, address_ar: e.target.value})} style={{ width: '100%', border: 'none', textAlign: 'right' }} dir="rtl"/>
                     ) : (
                       <div dir="rtl" style={{ fontWeight: 600 }}>{clinic.address_ar}</div>
                     )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '5px' }}>كشف (EGP)</div>
                      {isEditing ? (
                        <input type="number" value={item.consultation_fee} onChange={e => setTempClinic({...item, consultation_fee: Number(e.target.value)})} style={{ width: '100%', border: 'none', fontWeight: 800 }}/>
                      ) : (
                        <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{clinic.consultation_fee}</div>
                      )}
                    </div>
                    <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '5px' }}>إعادة (EGP)</div>
                      {isEditing ? (
                        <input type="number" value={item.followup_fee} onChange={e => setTempClinic({...item, followup_fee: Number(e.target.value)})} style={{ width: '100%', border: 'none', fontWeight: 800 }}/>
                      ) : (
                        <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{clinic.followup_fee}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
