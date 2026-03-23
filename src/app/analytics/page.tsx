"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/modules/auth/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { 
  Users, DollarSign, TrendingUp, 
  MapPin, Pill 
} from 'lucide-react';

export default function AnalyticsPage() {
  const { role } = useAuth();
  const [stats, setStats] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchAnalytics = async () => {
      const { data: clinics } = await supabase.from('clinics').select('*');
      const { count: patientsCount } = await supabase.from('patients').select('*', { count: 'exact', head: true });
      const { data: revenueData } = await supabase.from('queue_entries').select('amount_paid').eq('status', 'done');
      
      const totalRevenue = revenueData?.reduce((acc, curr) => acc + (Number(curr.amount_paid) || 0), 0) || 0;

      setStats([
        { label: 'Total Patients Archive', value: patientsCount || 0, icon: <Users/>, trend: 'Lifetime' },
        { label: 'Total Revenue (Lifetime)', value: `${totalRevenue.toLocaleString()} EGP`, icon: <DollarSign/>, trend: 'All Branches' },
        { label: 'Clinic Branches', value: clinics?.length || 0, icon: <MapPin/>, trend: 'Active Locations' },
      ]);
    };
    fetchAnalytics();
  }, [supabase]);

  if (role === 'assistant') return <div className="p-8">Access Restricted to Doctors.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #2c7a78 100%)', color: 'white', border: 'none' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>Clinical Intelligence Overview</h1>
        <p style={{ opacity: 0.9, marginTop: '5px' }}>Performance data for Dr. Amgad Khairy Kamel's Psychiatric Clinics</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {stats.map((s, i) => (
          <div key={i} className="card shadow-sm" style={{ padding: '1.5rem', marginBottom: 0 }}>
             <div className="flex-between" style={{ marginBottom: '1rem' }}>
                <div style={{ background: 'var(--bg-color)', color: 'var(--primary)', padding: '12px', borderRadius: '14px' }}>
                   {s.icon}
                </div>
                <div style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 800 }}>{s.trend}</div>
             </div>
             <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: 600 }}>{s.label}</div>
             <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: '5px' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
         <div className="card shadow-sm">
            <h3 style={{ margin: '0 0 1.5rem 0' }}><TrendingUp size={20}/> Practice Growth Insights</h3>
            <p style={{ color: 'var(--text-light)' }}>Detailed branch performance charts and diagnosis distributions are currently processing...</p>
         </div>

         <div className="card shadow-sm" style={{ borderLeft: '4px solid var(--primary)' }}>
            <h3 style={{ margin: '0 0 1.5rem 0' }}><Pill size={20}/> Medication Trends</h3>
            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Prescription analytics will appear here as more sessions are completed.</p>
         </div>
      </div>
    </div>
  );
}
