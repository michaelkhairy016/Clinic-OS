"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/modules/auth/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { 
  Receipt, TrendingUp, 
  Plus, 
  Calendar, Loader2, Wallet 
} from 'lucide-react';

export default function FinancialVault() {
  const { role, activeClinicId } = useAuth();
  const [revenue, setRevenue] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [vTypes, setVTypes] = useState<any[]>([]);
  const [pMethods, setPMethods] = useState<any[]>([]);
  
  // States for adding expenses
  const [exAmount, setExAmount] = useState('');
  const [exCategory, setExCategory] = useState('Rent');
  const [exDesc, setExDesc] = useState('');
  const [savingEx, setSavingEx] = useState(false);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const [revRes, expRes, vRes, pRes] = await Promise.all([
      supabase.from('queue_entries').select('*, patients(full_name)').eq('clinic_id', activeClinicId).eq('status', 'done'),
      supabase.from('expenses').select('*').eq('clinic_id', activeClinicId).order('created_at', { ascending: false }),
      supabase.from('visit_types').select('*'),
      supabase.from('payment_methods').select('*'),
    ]);
    setRevenue(revRes.data || []);
    setExpenses(expRes.data || []);
    setVTypes(vRes.data || []);
    setPMethods(pRes.data || []);
  }, [activeClinicId, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEx(true);
    const { error } = await supabase.from('expenses').insert({
       amount: Number(exAmount),
       category: exCategory,
       description: exDesc,
       clinic_id: activeClinicId
    });
    if (error) alert(error.message);
    else {
      setExAmount(''); setExDesc('');
      fetchData();
    }
    setSavingEx(false);
  };

  const totalRevenue = revenue.reduce((sum, item) => sum + (Number(item.amount_paid) || 0), 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  if (role !== 'doctor') return <div className="p-8">Access Denied. Doctors only.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div className="card shadow-sm" style={{ background: 'var(--primary)', color: 'white', border: 'none' }}>
           <div className="flex-between">
              <h3 style={{ margin: 0 }}>Clinical Revenue</h3>
              <TrendingUp size={24}/>
           </div>
           <div style={{ fontSize: '2.4rem', fontWeight: 800, marginTop: '1rem' }}>{totalRevenue.toLocaleString()} <span style={{ fontSize: '1rem' }}>EGP</span></div>
           <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Total collected from all sessions</div>
        </div>
        <div className="card shadow-sm" style={{ borderLeft: '5px solid #df4759' }}>
           <div className="flex-between">
              <h3 style={{ margin: 0, color: '#df4759' }}>Expenses</h3>
              <Receipt size={24}/>
           </div>
           <div style={{ fontSize: '2.4rem', fontWeight: 800, marginTop: '1rem' }}>{totalExpenses.toLocaleString()} <span style={{ fontSize: '1rem' }}>EGP</span></div>
           <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Operational costs</div>
        </div>
        <div className="card shadow-sm" style={{ borderLeft: '5px solid var(--success)' }}>
           <div className="flex-between">
              <h3 style={{ margin: 0, color: 'var(--success)' }}>Net Profit</h3>
              <Wallet size={24}/>
           </div>
           <div style={{ fontSize: '2.4rem', fontWeight: 800, marginTop: '1rem' }}>{netProfit.toLocaleString()} <span style={{ fontSize: '1rem' }}>EGP</span></div>
           <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Take-home earnings</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card">
             <h3 style={{ margin: '0 0 1.5rem 0' }}><Calendar size={20}/> Daily Collection Audit</h3>
             <div className="table-container">
                <table>
                   <thead>
                      <tr>
                         <th>Patient Entry</th>
                         <th>Visit Type</th>
                         <th>Payment</th>
                         <th>Amount</th>
                      </tr>
                   </thead>
                   <tbody>
                      {revenue.map(r => (
                        <tr key={r.id}>
                           <td><div style={{ fontWeight: 800 }}>{r.patients?.full_name}</div></td>
                           <td><span className="badge">{vTypes.find(v => v.id === r.visit_type_id)?.name_ar || 'Manual'}</span></td>
                           <td><span className="badge badge-active">{pMethods.find(pm => pm.id === r.payment_method_id)?.name_ar || 'Other'}</span></td>
                           <td style={{ fontWeight: 800, color: 'var(--success)' }}>{r.amount_paid} EGP</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
           <div className="card" style={{ border: '1px solid var(--primary)', background: '#fafcfc' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: 'var(--primary)' }}>Log Expense</h3>
              <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 <div>
                    <label style={{ fontSize: '0.85rem' }}>Amount (EGP)</label>
                    <input required type="number" value={exAmount} onChange={e => setExAmount(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                 </div>
                 <div>
                    <label style={{ fontSize: '0.85rem' }}>Category</label>
                    <select value={exCategory} onChange={e => setExCategory(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                       <option>Rent</option>
                       <option>Electricity</option>
                       <option>Assistant Salaries</option>
                       <option>Cleaning</option>
                       <option>Other</option>
                    </select>
                 </div>
                 <div>
                    <label style={{ fontSize: '0.85rem' }}>Notes</label>
                    <input value={exDesc} onChange={e => setExDesc(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                 </div>
                 <button disabled={savingEx} className="btn btn-primary" style={{ marginTop: '10px', width: '100%' }}>
                    {savingEx ? <Loader2 className="spinner"/> : <Plus size={18}/>} Add Expense entry
                 </button>
              </form>
              <p style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: '0.8rem', marginTop: '1rem' }}>Dr. Amgad Khairy Kamel</p>
           </div>
        </div>
      </div>
    </div>
  );
}
