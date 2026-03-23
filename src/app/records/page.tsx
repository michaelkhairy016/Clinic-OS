"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Search, User, ChevronRight, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PatientRow } from '@/types/database';

export default function PatientArchivePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const searchPatients = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setPatients([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('patients')
      .select('*, districts(name_ar, name_en)')
      .or(`full_name.ilike.%${query}%,patient_code.ilike.%${query}%`)
      .limit(20);
    setPatients(data || [] as any);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const timer = setTimeout(() => searchPatients(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, searchPatients]);

  return (
    <div>
      <div className="flex-between">
        <h2 style={{ fontWeight: 800, color: 'var(--primary)' }}>Patient Archive & Full Records</h2>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={24} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input
            autoFocus
            type="text"
            placeholder="Search by Patient Name or Code (e.g. PT-1002)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            dir="rtl"
            style={{ 
              width: '100%', 
              padding: '1.2rem 3.5rem 1.2rem 1.5rem', 
              fontSize: '1.1rem', 
              borderRadius: '12px', 
              border: '2px solid var(--border)',
              outline: 'none',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
        {loading && <div style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--primary)' }}><Loader2 className="spinner" /> Searching...</div>}
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {patients.map(p => (
          <div key={p.id} className="card" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '1.5rem', 
            marginBottom: 0,
            cursor: 'pointer',
            border: '1px solid transparent'
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
          >
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <div style={{ background: 'var(--bg-color)', color: 'var(--primary)', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-dark)' }}>{p.full_name}</h3>
                <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '0.9rem', color: 'var(--text-medium)' }}>
                   <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{p.patient_code}</span>
                   <span>•</span>
                   <span>{p.age} years</span>
                   <span>•</span>
                   <span>{(p as any).districts?.name_ar || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
               <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>First Visit?</div>
                  <span className={`badge ${p.is_first_psych_visit ? 'badge-waiting' : 'badge-active'}`}>
                    {p.is_first_psych_visit ? 'New Patient' : 'Returning'}
                  </span>
               </div>
               <ChevronRight color="var(--border)" />
            </div>
          </div>
        ))}

        {!loading && searchTerm.length > 1 && patients.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
            No patients match your search.
          </div>
        )}
        
        {searchTerm.length <= 1 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)', border: '2px dashed var(--border)', borderRadius: '12px' }}>
             Start typing to search the medical archive.
          </div>
        )}
      </div>
    </div>
  );
}
