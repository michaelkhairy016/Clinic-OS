"use client";

import React from 'react';
import MasterLibrary from '@/modules/admin-library/components/MasterLibrary';
import { BrainCircuit, ShieldCheck, Database } from 'lucide-react';

export default function Home() {
  return (
    <div>
      <div 
        className="card" 
        style={{ 
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))', 
          color: 'white', 
          padding: '2.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: 'none',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div style={{ maxWidth: '60%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
             <BrainCircuit size={32} />
             <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 800 }}>Clinical Intelligence</h1>
          </div>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.6 }}>
            Welcome to the Clinic-OS Brain. Here you can manage your medications library, 
            prescribing frequencies, and clinical protocols across all your clinics.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '2rem' }}>
           <div style={{ textAlign: 'center' }}>
              <ShieldCheck size={40} style={{ opacity: 0.8, marginBottom: '8px' }} />
              <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>Secure</div>
           </div>
           <div style={{ textAlign: 'center' }}>
              <Database size={40} style={{ opacity: 0.8, marginBottom: '8px' }} />
              <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>Synced</div>
           </div>
        </div>
      </div>
      
      <MasterLibrary />
    </div>
  );
}
