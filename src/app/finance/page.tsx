"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/modules/auth/AuthContext';
import { createClient } from '@/lib/supabase/client';
import {
  Receipt, TrendingUp, Plus, Calendar, Loader2, Wallet, BarChart3
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#4ECDC4'];

export default function FinancialVault() {
  const { role, activeClinicId } = useAuth();
  const [revenue, setRevenue] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [vTypes, setVTypes] = useState<any[]>([]);
  const [pMethods, setPMethods] = useState<any[]>([]);

  // Chart data states
  const [revenueTrend, setRevenueTrend] = useState<any[]>([]);
  const [paymentMethodData, setPaymentMethodData] = useState<any[]>([]);
  const [expenseCategoryData, setExpenseCategoryData] = useState<any[]>([]);
  const [monthlyComparison, setMonthlyComparison] = useState<any[]>([]);

  // Expense form states
  const [exAmount, setExAmount] = useState('');
  const [exCategory, setExCategory] = useState('Rent');
  const [exDesc, setExDesc] = useState('');
  const [savingEx, setSavingEx] = useState(false);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    if (!activeClinicId) return;

    const [revRes, expRes, vRes, pRes] = await Promise.all([
      supabase.from('queue_entries').select('*, patients(full_name)').eq('clinic_id', activeClinicId).eq('status', 'done').order('created_at', { ascending: true }),
      supabase.from('expenses').select('*').eq('clinic_id', activeClinicId).order('created_at', { ascending: false }),
      supabase.from('visit_types').select('*'),
      supabase.from('payment_methods').select('*'),
    ]);

    setRevenue(revRes.data || []);
    setExpenses(expRes.data || []);
    setVTypes(vRes.data || []);
    setPMethods(pRes.data || []);

    // Process chart data

    // 1. Revenue trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const revenueByDate: Record<string, number> = {};
    (revRes.data || []).forEach((r: any) => {
      const date = new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      revenueByDate[date] = (revenueByDate[date] || 0) + (Number(r.amount_paid) || 0);
    });
    setRevenueTrend(Object.entries(revenueByDate).map(([date, revenue]) => ({ date, revenue })));

    // 2. Payment methods breakdown
    const paymentCounts: Record<string, number> = {};
    (revRes.data || []).forEach((r: any) => {
      const method = pRes.data?.find((p: any) => p.id === r.payment_method_id);
      const name = method?.name_en || 'Other';
      paymentCounts[name] = (paymentCounts[name] || 0) + (Number(r.amount_paid) || 0);
    });
    setPaymentMethodData(Object.entries(paymentCounts).map(([name, value]) => ({ name, value })));

    // 3. Expense categories
    const expenseByCategory: Record<string, number> = {};
    (expRes.data || []).forEach((e: any) => {
      expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + (Number(e.amount) || 0);
    });
    setExpenseCategoryData(Object.entries(expenseByCategory).map(([name, amount]) => ({ name, amount })));

    // 4. Monthly comparison (last 6 months)
    const monthlyData: Record<string, { revenue: number; expenses: number }> = {};
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    (revRes.data || []).forEach((r: any) => {
      const d = new Date(r.created_at);
      if (d >= sixMonthsAgo) {
        const month = d.toLocaleDateString('en-US', { month: 'short' });
        if (!monthlyData[month]) monthlyData[month] = { revenue: 0, expenses: 0 };
        monthlyData[month].revenue += (Number(r.amount_paid) || 0);
      }
    });

    (expRes.data || []).forEach((e: any) => {
      const d = new Date(e.created_at);
      if (d >= sixMonthsAgo) {
        const month = d.toLocaleDateString('en-US', { month: 'short' });
        if (!monthlyData[month]) monthlyData[month] = { revenue: 0, expenses: 0 };
        monthlyData[month].expenses += (Number(e.amount) || 0);
      }
    });

    setMonthlyComparison(Object.entries(monthlyData).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      expenses: data.expenses,
      profit: data.revenue - data.expenses
    })));

  }, [activeClinicId, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exAmount || Number(exAmount) <= 0) return alert('Please enter a valid amount');
    setSavingEx(true);
    try {
      const { error } = await supabase.from('expenses').insert({
        amount: Number(exAmount),
        category: exCategory,
        description: exDesc,
        clinic_id: activeClinicId
      });
      if (error) throw error;
      setExAmount('');
      setExDesc('');
      fetchData();
      alert('Expense logged successfully!\n\nتم تسجيل المصروف بنجاح!');
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSavingEx(false);
    }
  };

  const totalRevenue = revenue.reduce((sum, item) => sum + (Number(item.amount_paid) || 0), 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  if (role !== 'doctor') return <div className="p-8">Access Denied. Doctors only.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <div className="card shadow-sm" style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '1.5rem' }}>
          <div className="flex-between">
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Clinical Revenue</h3>
            <TrendingUp size={24} />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '1rem' }}>{totalRevenue.toLocaleString()} <span style={{ fontSize: '0.9rem' }}>EGP</span></div>
          <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Total collected from all sessions</div>
        </div>

        <div className="card shadow-sm" style={{ borderLeft: '5px solid #df4759', padding: '1.5rem' }}>
          <div className="flex-between">
            <h3 style={{ margin: 0, color: '#df4759', fontSize: '1rem' }}>Expenses</h3>
            <Receipt size={24} />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '1rem', color: '#df4759' }}>{totalExpenses.toLocaleString()} <span style={{ fontSize: '0.9rem' }}>EGP</span></div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Operational costs</div>
        </div>

        <div className="card shadow-sm" style={{ borderLeft: '5px solid var(--success)', padding: '1.5rem' }}>
          <div className="flex-between">
            <h3 style={{ margin: 0, color: 'var(--success)', fontSize: '1rem' }}>Net Profit</h3>
            <Wallet size={24} />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '1rem', color: netProfit >= 0 ? 'var(--success)' : '#df4759' }}>
            {netProfit.toLocaleString()} <span style={{ fontSize: '0.9rem' }}>EGP</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Take-home earnings</div>
        </div>

        <div className="card shadow-sm" style={{ borderLeft: '5px solid #0088FE', padding: '1.5rem' }}>
          <div className="flex-between">
            <h3 style={{ margin: 0, color: '#0088FE', fontSize: '1rem' }}>Sessions</h3>
            <BarChart3 size={24} />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '1rem' }}>{revenue.length}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Completed visits</div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Revenue Trend */}
        <div className="card shadow-sm" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
            <TrendingUp size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
            Revenue Trend (Last 30 Days)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value) => `${value} EGP`} />
              <Area type="monotone" dataKey="revenue" stroke="#00C49F" fill="#00C49F" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods Pie */}
        <div className="card shadow-sm" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
            <Wallet size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
            Payment Methods
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={paymentMethodData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {paymentMethodData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} EGP`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Monthly Comparison */}
        <div className="card shadow-sm" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
            <BarChart3 size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
            Revenue vs Expenses (Last 6 Months)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value) => `${value} EGP`} />
              <Legend />
              <Bar dataKey="revenue" fill="#00C49F" name="Revenue" />
              <Bar dataKey="expenses" fill="#FF8042" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Categories */}
        <div className="card shadow-sm" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
            <Receipt size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
            Expense Categories
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={expenseCategoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={70} />
              <Tooltip formatter={(value) => `${value} EGP`} />
              <Bar dataKey="amount" fill="#FF8042" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
        {/* Revenue Table */}
        <div className="card shadow-sm" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
            <Calendar size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
            Recent Transactions
          </h3>
          <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Patient</th>
                  <th>Visit Type</th>
                  <th>Payment</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {revenue.slice(-20).reverse().map((r: any) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.patients?.full_name || 'Unknown'}</td>
                    <td><span className="badge">{vTypes.find((v: any) => v.id === r.visit_type_id)?.name_ar || 'Manual'}</span></td>
                    <td><span className="badge badge-active">{pMethods.find((pm: any) => pm.id === r.payment_method_id)?.name_ar || 'Other'}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>{Number(r.amount_paid || 0).toLocaleString()} EGP</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Expense Form */}
        <div className="card shadow-sm" style={{ padding: '1.5rem', border: '2px solid var(--primary)', background: '#fafcfc' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: 'var(--primary)' }}>Log Expense</h3>
          <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Amount (EGP)</label>
              <input
                required
                type="number"
                min="1"
                value={exAmount}
                onChange={e => setExAmount(e.target.value)}
                placeholder="Enter amount"
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '1rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Category</label>
              <select
                value={exCategory}
                onChange={e => setExCategory(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '1rem' }}
              >
                <option value="Rent">Rent / الإيجار</option>
                <option value="Electricity">Electricity / الكهرباء</option>
                <option value="Water">Water / المياه</option>
                <option value="Internet">Internet / الإنترنت</option>
                <option value="Salaries">Salaries / الرواتب</option>
                <option value="Cleaning">Cleaning / النظافة</option>
                <option value="Supplies">Supplies / المستلزمات</option>
                <option value="Maintenance">Maintenance / الصيانة</option>
                <option value="Marketing">Marketing / التسويق</option>
                <option value="Other">Other / أخرى</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Notes (optional)</label>
              <input
                value={exDesc}
                onChange={e => setExDesc(e.target.value)}
                placeholder="Description..."
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '1rem' }}
              />
            </div>
            <button
              disabled={savingEx}
              className="btn btn-primary"
              style={{ marginTop: '0.5rem', width: '100%', padding: '14px', fontSize: '1rem' }}
            >
              {savingEx ? <Loader2 className="spinner" /> : <Plus size={18} />} Add Expense
            </button>
          </form>

          {/* Recent Expenses */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-medium)' }}>Recent Expenses</h4>
            {expenses.slice(0, 5).map((e: any) => (
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                <span style={{ fontSize: '0.85rem' }}>{e.category}</span>
                <span style={{ fontWeight: 600, color: '#df4759' }}>-{Number(e.amount).toLocaleString()} EGP</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
