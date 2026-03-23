"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/modules/auth/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { MapPin, Building2, Loader2, LogOut } from 'lucide-react';

export default function ClinicSelectorOverlay() {
  const { user, activeClinicId, setActiveClinicId, logout } = useAuth();
  const [clinics, setClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchClinics = async () => {
      const { data } = await supabase.from('clinics').select('*').order('name_ar');
      setClinics(data || []);
      setLoading(false);
    };
    if (user) fetchClinics();
  }, [user, supabase]);

  if (!user || activeClinicId) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '600px', width: '100%', textAlign: 'center' }}>
        <Building2 size={64} style={{ color: 'var(--primary)', margin: '0 auto 1.5rem' }} />
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '1rem' }}>
          Welcome back, Doctor
        </h1>
        <p style={{ color: 'var(--text-light)', marginBottom: '3rem', fontSize: '1.1rem' }}>
          Please select your current workspace for today
        </p>

        {loading ? (
          <Loader2 className="spinner" size={40} style={{ color: 'var(--primary)', margin: '0 auto' }} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {clinics.map(clinic => (
              <button 
                key={clinic.id} 
                onClick={() => setActiveClinicId(clinic.id)}
                className="card"
                style={{
                  padding: '2rem',
                  cursor: 'pointer',
                  border: '2px solid var(--border)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1rem',
                  background: 'white'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ background: 'var(--bg-color)', color: 'var(--primary)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <MapPin size={28} />
                </div>
                <div>
                   <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem' }}>{clinic.name_ar}</h3>
                   <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-light)' }}>{clinic.address_ar}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {clinics.length === 0 && !loading && (
          <div style={{ color: '#df4759', padding: '1rem', border: '1px solid currentColor', borderRadius: '8px' }}>
            System Error: No clinics configured. Please contact the administrator.
          </div>
        )}

        <button 
          onClick={() => logout()}
          style={{ 
            marginTop: '3rem', 
            background: 'none', 
            border: 'none', 
            color: 'var(--text-light)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            margin: '3rem auto 0',
            cursor: 'pointer'
          }}
        >
          <LogOut size={18} /> Sign out instead
        </button>
      </div>
    </div>
  );
}
