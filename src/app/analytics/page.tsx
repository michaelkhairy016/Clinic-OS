"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/modules/auth/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { 
  Building2, Users, DollarSign, TrendingUp, 
  MapPin, Pill, Clock, Activity, Loader2 
} from 'lucide-react';

export default function AnalyticsPage() {
  const { role } = useAuth();
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      // Simplified analytics fetch (replace with real aggregations later)
      const { data: clinics } = await supabase.from('clinics').select('*');
      const { count: patientsCount } = await supabase.from('patients').select('*', { count: 'exact', head: true });
      const { count: queueCount } = await supabase.from('queue_entries').select('*', { count: 'exact', head: true });
      
      setStats([
        { label: 'Total Patients', value: patientsCount || 0, icon: <Users/>, trend: '+12% this month' },
        { label: 'Active Queue (Today)', value: queueCount || 0, icon: <Activity/>, trend: 'High Traffic' },
        { label: 'Est. Daily Revenue', value: '4500 EGP', icon: <DollarSign/>, trend: '+18% vs Yesterday' },
        { label: 'Total Clinic Branches', value: clinics?.length || 0, icon: <MapPin/>, trend: 'Shoubra & Masr' },
      ]);
      setLoading(false);
    };
    fetchAnalytics();
  }, [supabase]);

  if (role === 'assistant') return <div className="p-8">Access Restricted to Doctors & Managers.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #2c7a78 100%)', color: 'white', border: 'none' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>Clinical Intelligence Dashboard</h1>
        <p style={{ opacity: 0.9, marginTop: '5px', fontSize: '1.1rem' }}>Performance analytics for Dr. Amgad's Psychiatric Clinics</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        {stats.map((s, i) => (
          <div key={i} className="card shadow-sm" style={{ padding: '1.5rem', marginBottom: 0 }}>
             <div className="flex-between" style={{ marginBottom: '1rem' }}>
                <div style={{ background: 'var(--bg-color)', color: 'var(--primary)', padding: '12px', borderRadius: '14px' }}>
                   {s.icon}
                </div>
                <div style={{ color: 'var(--success)', fontSize: '0.85rem', fontWeight: 800 }}>{s.trend}</div>
             </div>
             <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: 600 }}>{s.label}</div>
             <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: '5px' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
         <div className="card shadow-sm">
            <h3 style={{ margin: '0 0 1.5rem 0' }}><TrendingUp size={20}/> Revenue Breakdown by Clinic</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
               <div>
                  <div className="flex-between" style={{ marginBottom: '8px', fontWeight: 800, fontSize: '1.1rem' }}>
                     <span>فرع شبرا (Shoubra)</span>
                     <span>5,200 EGP</span>
                  </div>
                  <div style={{ background: '#f5f8f8', height: '12px', borderRadius: '6px' }}>
                     <div style={{ background: 'var(--primary)', width: '65%', height: '100%', borderRadius: '6px' }}></div>
                  </div>
               </div>
               <div>
                  <div className="flex-between" style={{ marginBottom: '8px', fontWeight: 800, fontSize: '1.1rem' }}>
                     <span>فرع مصر الجديدة (Masr ElGedida)</span>
                     <span>3,800 EGP</span>
                  </div>
                  <div style={{ background: '#f5f8f8', height: '12px', borderRadius: '6px' }}>
                     <div style={{ background: '#4fd1c5', width: '45%', height: '100%', borderRadius: '6px' }}></div>
                  </div>
               </div>
            </div>
         </div>

         <div className="card shadow-sm" style={{ borderLeft: '4px solid var(--primary)' }}>
            <h3 style={{ margin: '0 0 1.5rem 0' }}><Pill size={20}/> Prescription Trends</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
               <li className="flex-between">
                  <span style={{ fontWeight: 600 }}>Cipralex (Escitalopram)</span>
                  <span className="badge badge-active">42 presc.</span>
               </li>
               <li className="flex-between">
                  <span style={{ fontWeight: 600 }}>Seroquel (Quetiapine)</span>
                  <span className="badge badge-active">28 presc.</span>
               </li>
               <li className="flex-between">
                  <span style={{ fontWeight: 600 }}>Depakine (Valproate)</span>
                  <span className="badge">12 presc.</span>
               </li>
            </ul>
         </div>
      </div>
    </div>
  );
}
