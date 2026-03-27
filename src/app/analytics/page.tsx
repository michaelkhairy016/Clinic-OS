"use client";

import React, { useState, useEffect } from 'react';
import {
  Users, DollarSign, TrendingUp, MapPin, Pill,
  Share2, Phone, Calendar, MessageSquare, BarChart3,
  PieChart, Star, Filter, Download, UserPlus,
  Clock, CheckCircle2, AlertCircle, ThumbsUp, ThumbsDown,
  ArrowRight, Mail, Plus, X
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { useAuth } from '@/modules/auth/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { PatientRow } from '@/types/database';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function AnalyticsPage() {
  const { role, activeClinicId } = useAuth();
  const supabase = createClient();

  // Chart Data States
  const [visitsPerDay, setVisitsPerDay] = useState<any[]>([]);
  const [revenuePerDay, setRevenuePerDay] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [referralSourceData, setReferralSourceData] = useState<any[]>([]);
  const [diagnosisDistribution, setDiagnosisDistribution] = useState<any[]>([]);
  const [satisfactionTrend, setSatisfactionTrend] = useState<any[]>([]);

  // Stats
  const [totalPatients, setTotalPatients] = useState(0);
  const [newPatientsThisMonth, setNewPatientsThisMonth] = useState(0);
  const [completedVisits, setCompletedVisits] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [satisfactionScores, setSatisfactionScores] = useState<any[]>([]);

  // Modals
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [feedbackPatientId, setFeedbackPatientId] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeClinicId) return;
    fetchChartData();
    fetchStats();
    fetchPatients();
  }, [activeClinicId]);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      // Last 30 days visits
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: queueData } = await supabase
        .from('queue_entries')
        .select('created_at, status, amount_paid, payment_method_id')
        .eq('clinic_id', activeClinicId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      // Process visits per day
      const visitsMap: Record<string, number> = {};
      const revenueMap: Record<string, number> = {};

      (queueData || []).forEach(entry => {
        const date = new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        visitsMap[date] = (visitsMap[date] || 0) + 1;
        revenueMap[date] = (revenueMap[date] || 0) + (Number(entry.amount_paid) || 0);
      });

      const visitsData = Object.entries(visitsMap).map(([date, count]) => ({ date, visits: count }));
      const revenueData = Object.entries(revenueMap).map(([date, amount]) => ({ date, revenue: amount }));

      setVisitsPerDay(visitsData);
      setRevenuePerDay(revenueData);

      // Payment methods distribution
      const { data: payments } = await supabase
        .from('payment_methods')
        .select('id, name_en');

      const paymentCounts: Record<string, number> = {};
      (queueData || []).forEach(entry => {
        if (entry.payment_method_id) {
          const method = payments?.find(p => p.id === entry.payment_method_id);
          const name = method?.name_en || 'Unknown';
          paymentCounts[name] = (paymentCounts[name] || 0) + 1;
        }
      });

      const paymentData = Object.entries(paymentCounts).map(([name, value]) => ({ name, value }));
      setPaymentMethods(paymentData);

      // Referral sources
      const { data: referralData } = await supabase
        .from('patients')
        .select('referral_sources(name_en)')
        .not('referral_source_id', 'is', null);

      const referralCounts: Record<string, number> = {};
      (referralData || []).forEach((p: any) => {
        const name = p.referral_sources?.name_en || 'Unknown';
        referralCounts[name] = (referralCounts[name] || 0) + 1;
      });

      const referralChartData = Object.entries(referralCounts).map(([name, value]) => ({ name, value }));
      setReferralSourceData(referralChartData);

      // Diagnosis distribution
      const { data: clinicalNotes } = await supabase
        .from('clinical_notes')
        .select('diagnosis')
        .not('diagnosis', 'is', null);

      const diagnosisCounts: Record<string, number> = {};
      (clinicalNotes || []).forEach((note: any) => {
        if (note.diagnosis) {
          const diag = note.diagnosis.split('(')[0].trim();
          diagnosisCounts[diag] = (diagnosisCounts[diag] || 0) + 1;
        }
      });

      const diagData = Object.entries(diagnosisCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);
      setDiagnosisDistribution(diagData);

      // Satisfaction trend
      const { data: satisfactionData } = await supabase
        .from('satisfaction_scores')
        .select('rating, created_at')
        .eq('clinic_id', activeClinicId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (satisfactionData && satisfactionData.length > 0) {
        const avgByDate: Record<string, { total: number; count: number }> = {};
        satisfactionData.forEach((s: any) => {
          const date = new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (!avgByDate[date]) avgByDate[date] = { total: 0, count: 0 };
          avgByDate[date].total += s.rating;
          avgByDate[date].count += 1;
        });

        const trendData = Object.entries(avgByDate).map(([date, data]) => ({
          date,
          rating: Number((data.total / data.count).toFixed(1))
        }));
        setSatisfactionTrend(trendData);
        setSatisfactionScores(satisfactionData);
        const avgRating = satisfactionData.reduce((sum: number, s: any) => sum + s.rating, 0) / satisfactionData.length;
        setAverageRating(Number(avgRating.toFixed(1)));
      }

    } catch (err) {
      console.error('Error fetching chart data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const { count: patientCount } = await supabase.from('patients').select('*', { count: 'exact', head: true });
    setTotalPatients(patientCount || 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    const { data: newPatients } = await supabase.from('patients').select('*').gte('created_at', monthStart.toISOString());
    setNewPatientsThisMonth(newPatients?.length || 0);

    const { count: visitCount } = await supabase.from('queue_entries').select('*', { count: 'exact', head: true }).eq('status', 'done');
    setCompletedVisits(visitCount || 0);

    const { data: revenueData } = await supabase.from('queue_entries').select('amount_paid').eq('status', 'done');
    const total = (revenueData || []).reduce((sum, r) => sum + (Number(r.amount_paid) || 0), 0);
    setTotalRevenue(total);
  };

  const fetchPatients = async () => {
    const { data } = await supabase.from('patients').select('*').order('full_name').limit(100);
    setPatients(data || []);
  };

  const handleCollectFeedback = async () => {
    if (!feedbackPatientId) return alert('Please select a patient');
    setLoading(true);
    try {
      const { error } = await supabase.from('satisfaction_scores').insert({
        patient_id: feedbackPatientId,
        rating: feedbackRating,
        feedback: feedbackText,
        source: 'in_person',
        clinic_id: activeClinicId
      });
      if (error) throw error;
      setShowFeedbackModal(false);
      setFeedbackPatientId('');
      setFeedbackRating(5);
      setFeedbackText('');
      fetchChartData();
      alert('Feedback saved!');
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return '#28a745';
    if (rating === 3) return '#ffc107';
    return '#dc3545';
  };

  if (role === 'marketing') {
    return <MarketingView
      referralData={referralSourceData}
      satisfactionTrend={satisfactionTrend}
      averageRating={averageRating}
      satisfactionScores={satisfactionScores}
    />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div className="card shadow-sm">
        <div className="flex-between">
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>Performance & Analytics</h1>
            <p style={{ color: 'var(--text-light)', marginTop: '5px' }}>Real-time clinic performance metrics</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowFeedbackModal(true)}>
            <Plus size={18} /> Collect Feedback
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div className="card shadow-sm" style={{ padding: '1.2rem', textAlign: 'center' }}>
          <Users size={28} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{totalPatients}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Total Patients</div>
        </div>
        <div className="card shadow-sm" style={{ padding: '1.2rem', textAlign: 'center', borderLeft: '4px solid #28a745' }}>
          <UserPlus size={28} style={{ color: '#28a745', marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#28a745' }}>{newPatientsThisMonth}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>New This Month</div>
        </div>
        <div className="card shadow-sm" style={{ padding: '1.2rem', textAlign: 'center', borderLeft: '4px solid var(--success)' }}>
          <CheckCircle2 size={28} style={{ color: 'var(--success)', marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{completedVisits}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Completed Visits</div>
        </div>
        <div className="card shadow-sm" style={{ padding: '1.2rem', textAlign: 'center', borderLeft: '4px solid #0070f3' }}>
          <DollarSign size={28} style={{ color: '#0070f3', marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{totalRevenue.toLocaleString()}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Total Revenue (EGP)</div>
        </div>
        <div className="card shadow-sm" style={{ padding: '1.2rem', textAlign: 'center', borderLeft: '4px solid #ffc107' }}>
          <Star size={28} style={{ color: '#ffc107', marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{averageRating || '-'}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Avg Rating</div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Visits Per Day Chart */}
        <div className="card shadow-sm" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
            <TrendingUp size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
            Patient Visits (Last 30 Days)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={visitsPerDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area type="monotone" dataKey="visits" stroke="#0088FE" fill="#0088FE" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Per Day Chart */}
        <div className="card shadow-sm" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
            <DollarSign size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
            Daily Revenue (EGP)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenuePerDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value) => `${value} EGP`} />
              <Bar dataKey="revenue" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' }}>
        {/* Payment Methods Pie */}
        <div className="card shadow-sm" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
            <Pill size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
            Payment Methods
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <RechartsPie>
              <Pie
                data={paymentMethods}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {paymentMethods.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPie>
          </ResponsiveContainer>
        </div>

        {/* Referral Sources Pie */}
        <div className="card shadow-sm" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
            <Share2 size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
            Referral Sources
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <RechartsPie>
              <Pie
                data={referralSourceData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
              >
                {referralSourceData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </RechartsPie>
          </ResponsiveContainer>
        </div>

        {/* Diagnosis Distribution */}
        <div className="card shadow-sm" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
            <BarChart3 size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
            Top Diagnoses
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={diagnosisDistribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={80} />
              <Tooltip />
              <Bar dataKey="value" fill="#8884D8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Satisfaction Trend */}
      <div className="card shadow-sm" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
          <Star size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
          Patient Satisfaction Trend
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={satisfactionTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="rating" stroke="#FFBB28" strokeWidth={2} dot={{ fill: '#FFBB28' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card shadow-lg" style={{ maxWidth: 400, width: '100%', padding: '2rem', borderRadius: 16 }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Collect Feedback</h3>
              <button onClick={() => setShowFeedbackModal(false)}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <select value={feedbackPatientId} onChange={e => setFeedbackPatientId(e.target.value)}
                style={{ padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                <option value="">Select Patient</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                {[1,2,3,4,5].map(r => (
                  <button key={r} onClick={() => setFeedbackRating(r)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <Star size={28} fill={r <= feedbackRating ? getRatingColor(feedbackRating) : '#ddd'} color={r <= feedbackRating ? getRatingColor(feedbackRating) : '#ddd'} />
                  </button>
                ))}
              </div>
              <textarea placeholder="Feedback notes (optional)" value={feedbackText} onChange={e => setFeedbackText(e.target.value)}
                rows={3} style={{ padding: 12, borderRadius: 8, border: '1px solid var(--border)' }} />
              <button className="btn btn-primary" onClick={handleCollectFeedback} disabled={loading}>
                {loading ? 'Saving...' : 'Save Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Marketing View Component
function MarketingView({ referralData, satisfactionTrend, averageRating, satisfactionScores }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="card shadow-sm">
        <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>Marketing Dashboard</h1>
        <p style={{ color: 'var(--text-light)' }}>Patient acquisition and satisfaction analytics</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="card shadow-sm" style={{ padding: '1.5rem' }}>
          <h3>Referral Sources</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RechartsPie>
              <Pie data={referralData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                {referralData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </RechartsPie>
          </ResponsiveContainer>
        </div>

        <div className="card shadow-sm" style={{ padding: '1.5rem' }}>
          <h3>Satisfaction Trend</h3>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '3rem', fontWeight: 800, color: '#ffc107' }}>{averageRating || '-'}</span>
            <span style={{ fontSize: '1rem', color: 'var(--text-light)' }}> / 5</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={satisfactionTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Line type="monotone" dataKey="rating" stroke="#FFBB28" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
