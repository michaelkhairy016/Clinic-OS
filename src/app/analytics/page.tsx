"use client";

import React, { useState, useEffect } from 'react';
import {
  Users, DollarSign, TrendingUp, MapPin, Pill,
  Share2, Phone, Calendar, MessageSquare, BarChart3,
  PieChart, Star, Filter, Download, UserPlus,
  Clock, CheckCircle2, AlertCircle, ThumbsUp, ThumbsDown,
  ArrowRight, Mail, Facebook, Instagram, Plus, X
} from 'lucide-react';
import { useAuth } from '@/modules/auth/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { PatientRow } from '@/types/database';

type ReferralStat = {
  source: string;
  count: number;
  percentage: string;
  isNewPatients: number;
};

type SatisfactionScore = {
  patient: string;
  patient_code: string;
  rating: number;
  date: string;
  feedback: string;
};

export default function AnalyticsPage() {
  const { role, activeClinicId } = useAuth();

  // Patient Statistics
  const [totalPatients, setTotalPatients] = useState(0);
  const [newPatientsThisMonth, setNewPatientsThisMonth] = useState(0);
  const [returningPatients, setReturningPatients] = useState(0);
  const [vezeetaPatients, setVezeetaPatients] = useState(0);
  const [averageAge, setAverageAge] = useState(0);

  // Revenue & Performance
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [revenueThisMonth, setRevenueThisMonth] = useState(0);
  const [completedVisits, setCompletedVisits] = useState(0);

  // Referral Analytics
  const [referralStats, setReferralStats] = useState<ReferralStat[]>([]);
  const [topReferralSources, setTopReferralSources] = useState<any[]>([]);

  // Patient Satisfaction
  const [satisfactionScores, setSatisfactionScores] = useState<SatisfactionScore[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [showSatisfactionModal, setShowSatisfactionModal] = useState(false);
  const [feedbackPatientId, setFeedbackPatientId] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSource, setFeedbackSource] = useState<'in_person' | 'phone' | 'vezeeta'>('in_person');
  const [patients, setPatients] = useState<PatientRow[]>([]);

  // Marketing Campaigns
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [campaignType, setCampaignType] = useState<'social' | 'vezeeta' | 'referral'>('social');
  const [campaignMessage, setCampaignMessage] = useState('');
  const [campaignStartDate, setCampaignStartDate] = useState('');
  const [campaignEndDate, setCampaignEndDate] = useState('');

  // Follow-up Management
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientRow | null>(null);
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [followUpType, setFollowUpType] = useState<'call' | 'visit' | 'message'>('call');

  // Filter state
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedMetric, setSelectedMetric] = useState<'all' | 'new' | 'returning' | 'vezeeta'>('all');

  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // Load comprehensive analytics
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!activeClinicId) return;

      // Patient demographics and statistics
      const [
        totalRes,
        newRes,
        vezeetaRes,
        ageData
      ] = await Promise.all([
        supabase.from('patients').select('*', { count: 'exact', head: true }),
        supabase.from('patients').select('*').gte('created_at', new Date(new Date().setDate(1)).toISOString()),
        supabase.from('patients').select('*').eq('is_vezeeta', true),
        supabase.from('patients').select('age')
      ]);

      setTotalPatients(totalRes.count || 0);
      setNewPatientsThisMonth(newRes.data?.length || 0);
      setVezeetaPatients(vezeetaRes.data?.length || 0);
      setReturningPatients((totalRes.count || 0) - (newRes.data?.length || 0));

      // Calculate average age
      const ages = (ageData.data || []).map(p => p.age).filter(a => a !== null) as number[];
      if (ages.length > 0) {
        const avgAge = ages.reduce((sum, age) => sum + age, 0) / ages.length;
        setAverageAge(Math.round(avgAge));
      }
    };

    // Revenue and visits
    const fetchRevenueStats = async () => {
      const [revenueRes, visitsRes] = await Promise.all([
        supabase.from('queue_entries').select('amount_paid').eq('status', 'done'),
        supabase.from('queue_entries').select('*', { count: 'exact', head: true }).eq('status', 'done')
      ]);

      const totalRev = (revenueRes.data || []).reduce((sum, curr) => sum + (Number(curr.amount_paid) || 0), 0);
      setTotalRevenue(totalRev);
      setCompletedVisits(visitsRes.count || 0);
    };

    // Referral tracking
    const fetchReferralStats = async () => {
      const { data } = await supabase
        .from('patients')
        .select('*, referral_sources(name_ar, name_en)')
        .order('created_at', { ascending: false })
        .limit(100);

      const referralCounts: any = {};
      (data || []).forEach((patient: any) => {
        const source = patient.referral_sources?.name_ar || 'Unknown';
        referralCounts[source] = (referralCounts[source] || 0) + 1;
      });

      const referralArray = Object.entries(referralCounts).map(([source, count]) => ({
        source,
        count: count as number,
        percentage: totalPatients > 0 ? (((count as number) / totalPatients) * 100).toFixed(1) : '0',
        isNewPatients: 0 // TODO: implement new patients per referral source
      })).sort((a, b) => b.count - a.count);

      setReferralStats(referralArray.slice(0, 8));
      setTopReferralSources(referralArray.slice(0, 5));
    };

    // Follow-ups
    const fetchFollowUps = async () => {
      const { data } = await supabase
        .from('follow_ups')
        .select('*, patients(full_name, patient_code, phone)')
        .eq('clinic_id', activeClinicId)
        .order('scheduled_date', { ascending: true })
        .limit(20);

      setFollowUps(data || []);
    };

    // Marketing campaigns
    const fetchCampaigns = async () => {
      const { data } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('clinic_id', activeClinicId)
        .order('created_at', { ascending: false })
        .limit(10);

      setCampaigns(data || []);
    };

    // Satisfaction scores
    const fetchSatisfactionScores = async () => {
      const { data, error } = await supabase
        .from('satisfaction_scores')
        .select('*, patients(full_name, patient_code)')
        .eq('clinic_id', activeClinicId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching satisfaction scores:', error);
        return;
      }

      const formattedData = (data || []).map(score => ({
        id: score.id,
        patient: score.patients?.full_name || 'Anonymous',
        patient_code: score.patients?.patient_code || '',
        rating: score.rating,
        date: score.created_at,
        feedback: score.feedback || ''
      }));

      setSatisfactionScores(formattedData);
      if (formattedData.length > 0) {
        setAverageRating(Number((formattedData.reduce((sum, s) => sum + s.rating, 0) / formattedData.length).toFixed(1)));
      }
    };

    fetchAnalytics();
    fetchRevenueStats();
    fetchReferralStats();
    fetchFollowUps();
    fetchCampaigns();
    fetchSatisfactionScores();
  }, [activeClinicId, supabase]);

  // Load patients for feedback selection
  useEffect(() => {
    const fetchPatients = async () => {
      const { data } = await supabase
        .from('patients')
        .select('*')
        .order('full_name')
        .limit(100);
      setPatients(data || []);
    };
    fetchPatients();
  }, [supabase]);

  const handleScheduleFollowUp = async () => {
    if (!selectedPatient || !activeClinicId) return;

    setLoading(true);
    try {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + 7); // Schedule 7 days from now

      const { error } = await supabase.from('follow_ups').insert({
        patient_id: selectedPatient.id,
        clinic_id: activeClinicId,
        follow_up_type: followUpType,
        notes: followUpNotes,
        scheduled_date: scheduledDate.toISOString(),
        status: 'scheduled'
      });

      if (error) throw error;

      setShowFollowUpModal(false);
      setSelectedPatient(null);
      setFollowUpNotes('');
      alert('تم جدار المتابعة بنجاح!\n\nFollow-up scheduled successfully!');
    } catch (error: any) {
      console.error('Error scheduling follow-up:', error);
      alert('خطأ في جدار المتابعة: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCollectFeedback = async () => {
    if (!feedbackPatientId || !feedbackRating) {
      alert('Please select a patient and rating\n\nالرجاء اختيار المريض والتقييم');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('satisfaction_scores').insert({
        patient_id: feedbackPatientId,
        rating: feedbackRating,
        feedback: feedbackText,
        source: feedbackSource,
        clinic_id: activeClinicId
      });

      if (error) throw error;

      // Refresh satisfaction scores
      const { data: updatedScores } = await supabase
        .from('satisfaction_scores')
        .select('*, patients(full_name, patient_code)')
        .eq('clinic_id', activeClinicId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (updatedScores) {
        const formattedData = updatedScores.map(score => ({
          id: score.id,
          patient: score.patients?.full_name || 'Anonymous',
          patient_code: score.patients?.patient_code || '',
          rating: score.rating,
          date: score.created_at,
          feedback: score.feedback || ''
        }));
        setSatisfactionScores(formattedData);
        if (formattedData.length > 0) {
          setAverageRating(Number((formattedData.reduce((sum, s) => sum + s.rating, 0) / formattedData.length).toFixed(1)));
        }
      }

      setShowSatisfactionModal(false);
      setFeedbackPatientId('');
      setFeedbackRating(5);
      setFeedbackText('');
      alert('تم تسجيل التقييم بنجاح!\n\nFeedback recorded successfully!');
    } catch (error: any) {
      console.error('Error collecting feedback:', error);
      alert('خطأ في تسجيل التقييم: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!campaignName || !campaignMessage) {
      alert('Please fill in all required fields\n\nالرجاء ملء جميع الحقول المطلوبة');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('marketing_campaigns').insert({
        name: campaignName,
        type: campaignType,
        message: campaignMessage,
        start_date: campaignStartDate,
        end_date: campaignEndDate,
        clinic_id: activeClinicId,
        status: 'active'
      });

      if (error) throw error;

      // Refresh campaigns list
      const { data: updatedCampaigns } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('clinic_id', activeClinicId)
        .order('created_at', { ascending: false })
        .limit(10);

      setCampaigns(updatedCampaigns || []);

      setShowCampaignModal(false);
      setCampaignName('');
      setCampaignMessage('');
      setCampaignStartDate('');
      setCampaignEndDate('');
      alert('تم إنشاء الحملة بنجاح!\n\nCampaign created successfully!');
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      alert('خطأ في إنشاء الحملة: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return '#28a745'; // Green
    if (rating === 3) return '#ffc107'; // Yellow
    return '#dc3545'; // Red
  };

  const getFilteredPatients = () => {
    switch (selectedMetric) {
      case 'new':
        return newPatientsThisMonth;
      case 'returning':
        return returningPatients;
      case 'vezeeta':
        return vezeetaPatients;
      default:
        return totalPatients;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div className="card shadow-sm">
        <div className="flex-between">
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>
              {role === 'marketing' ? 'Marketing Dashboard' : 'لأداء والتحليلات'}
            </h1>
            <p style={{ color: 'var(--text-light)', marginTop: '5px' }}>
              {role === 'marketing' ? 'Marketing & Patient Analytics' : 'Performance & Analytics'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value as any)}
              className="btn btn-secondary"
            >
              <option value="week">This Week / هذا الأسبوع</option>
              <option value="month">This Month / هذا الشهر</option>
              <option value="quarter">This Quarter / هذا الربع</option>
              <option value="year">This Year / هذه السنة</option>
            </select>
            <button className="btn btn-primary">
              <Download size={18} /> Export Report
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Left Column - Patient Statistics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Key Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="card shadow-sm" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <Users size={32} style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-dark)' }}>{totalPatients}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                Total Patients / إجمالي المرضى
              </div>
            </div>

            <div className="card shadow-sm" style={{ padding: '1.5rem', textAlign: 'center', borderLeft: '4px solid #28a745' }}>
              <UserPlus size={32} style={{ color: '#28a745', margin: '0 auto 1rem' }} />
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#28a745' }}>{newPatientsThisMonth}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                New This Month / جدد هذا الشهر
              </div>
            </div>

            <div className="card shadow-sm" style={{ padding: '1.5rem', textAlign: 'center', borderLeft: '4px solid #ffc107' }}>
              <Users size={32} style={{ color: '#ffc107', margin: '0 auto 1rem' }} />
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffc107' }}>{returningPatients}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                Returning / عائدين
              </div>
            </div>

            <div className="card shadow-sm" style={{ padding: '1.5rem', textAlign: 'center', borderLeft: '4px solid #0070f3' }}>
              <Share2 size={32} style={{ color: '#0070f3', margin: '0 auto 1rem' }} />
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0070f3' }}>{vezeetaPatients}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                Vezeeta / فيزيتا
              </div>
            </div>

            <div className="card shadow-sm" style={{ padding: '1.5rem', textAlign: 'center', borderLeft: '4px solid var(--success)' }}>
              <DollarSign size={32} style={{ color: 'var(--success)', margin: '0 auto 1rem' }} />
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)' }}>{completedVisits}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                Completed Visits / زيارات مكتملة
              </div>
            </div>
          </div>

          {/* Patient Demographics */}
          <div className="card shadow-sm" style={{ padding: '1.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', marginBottom: '1rem' }}>
              <Pill size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
              Patient Demographics / بيانات سكانية للمرضى
            </h2>
            <div style={{ fontSize: '1.1rem', color: 'var(--text-medium)', marginBottom: '0.5rem' }}>
              Average Age: <span style={{ fontWeight: 800 }}>{averageAge}</span> years
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1, background: '#f8f9fa', padding: '1rem', borderRadius: '12px' }}>
                <div style={{ fontWeight: 800, marginBottom: '0.5rem' }}>New Patients / مرضى جدد</div>
                <div style={{ fontSize: '2rem', fontWeight: 800 }}>{newPatientsThisMonth}</div>
              </div>
              <div style={{ flex: 1, background: '#f8f9fa', padding: '1rem', borderRadius: '12px' }}>
                <div style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Returning / عائدين</div>
                <div style={{ fontSize: '2rem', fontWeight: 800 }}>{returningPatients}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Detailed Analytics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Revenue & Performance */}
          <div className="card shadow-sm" style={{ padding: '1.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', marginBottom: '1rem' }}>
              <DollarSign size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
              Revenue & Performance / الإيرادات والأداء
            </h2>
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Total Revenue (All Time)</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)' }}>{totalRevenue.toLocaleString()} EGP</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Completed Visits</div>
                <div style={{ fontSize: '2rem', fontWeight: 800 }}>{completedVisits}</div>
              </div>
            </div>
          </div>

          {/* Referral Sources */}
          <div className="card shadow-sm">
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                <Share2 size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
                Referral Sources / مصادر الإحالة
              </h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-primary" style={{ padding: '0.6rem 1rem' }}>
                  <Mail size={16} /> Campaign
                </button>
                <button className="btn btn-secondary" style={{ padding: '0.6rem 1rem' }}>
                  <Filter size={16} /> Filter
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {referralStats.map((referral, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-dark)' }}>
                      {referral.source}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                      {referral.count} patients ({referral.percentage}%)
                    </div>
                  </div>
                  <div style={{ width: '60px', height: '8px', background: '#e9ecef', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${referral.percentage}%`, height: '100%', background: 'var(--primary)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Satisfaction, Follow-ups, Campaigns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' }}>
        {/* Patient Satisfaction */}
        <div className="card shadow-sm">
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
              <Star size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
              Patient Satisfaction / رضا المرضى
            </h2>
            <button
              className="btn btn-primary"
              onClick={() => setShowSatisfactionModal(true)}
              style={{ padding: '0.6rem 1rem' }}
            >
              <Plus size={16} /> Collect Feedback
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-dark)' }}>{averageRating}</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                Average Rating (out of 5) / متوسط التقييم (من 5)
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1, display: 'flex', gap: '0.5rem' }}>
                <ThumbsUp size={20} style={{ color: '#28a745' }} />
                <span>Excellent: {satisfactionScores.filter(s => s.rating >= 4).length}</span>
              </div>
              <div style={{ flex: 1, display: 'flex', gap: '0.5rem' }}>
                <ThumbsDown size={20} style={{ color: '#dc3545' }} />
                <span>Needs Improvement: {satisfactionScores.filter(s => s.rating <= 2).length}</span>
              </div>
            </div>

            <button className="btn btn-secondary" style={{ width: '100%', fontSize: '0.9rem', marginTop: '1rem' }}>
              View All Feedback / عرض جميع التقييمات
            </button>
          </div>
        </div>

        {/* Follow-up Management */}
        <div className="card shadow-sm">
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
              <Phone size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
              Follow-ups / المتابعات
            </h2>
            <button
              className="btn btn-primary"
              onClick={() => setShowFollowUpModal(true)}
              style={{ padding: '0.6rem 1rem' }}
            >
              <Calendar size={16} /> Schedule Follow-up
            </button>
          </div>

          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {followUps.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                <Clock size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <div>No scheduled follow-ups</div>
              </div>
            ) : (
              followUps.slice(0, 5).map((followUp, index) => (
                <div key={index} style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                        {followUp.patients?.full_name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                        {followUp.patients?.patient_code} • {new Date(followUp.scheduled_date).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="badge badge-active" style={{ fontSize: '0.75rem' }}>
                      {followUp.follow_up_type.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-medium)' }}>
                    {followUp.notes?.substring(0, 40) || 'No notes'}...
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Marketing Campaigns */}
        <div className="card shadow-sm">
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
              <MessageSquare size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
              Marketing Campaigns / حملات تسويقية
            </h2>
            <button
              className="btn btn-primary"
              onClick={() => setShowCampaignModal(true)}
              style={{ padding: '0.6rem 1rem' }}
            >
              <Plus size={16} /> New Campaign
            </button>
          </div>

          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {campaigns.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                <MessageSquare size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <div>No active campaigns</div>
              </div>
            ) : (
              campaigns.slice(0, 4).map((campaign, index) => (
                <div key={index} style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--primary)' }}>
                        {campaign.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                        {campaign.type.toUpperCase()} • {new Date(campaign.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="badge badge-active" style={{ fontSize: '0.75rem' }}>
                      {campaign.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-medium)' }}>
                    {campaign.message?.substring(0, 50)}...
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Follow-up Modal */}
      {showFollowUpModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card shadow-lg" style={{ maxWidth: 500, width: '100%', padding: '2rem', borderRadius: '24px' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ color: 'var(--primary)', margin: 0, fontWeight: 800 }}>Schedule Follow-up</h2>
              <button onClick={() => setShowFollowUpModal(false)}><X size={24} /></button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>
                Select Patient / اختيار المريض
              </label>
              <input
                type="text"
                placeholder="Search patient..."
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>
                  Follow-up Type / نوع المتابعة
                </label>
                <select
                  value={followUpType}
                  onChange={e => setFollowUpType(e.target.value as any)}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '1rem' }}
                >
                  <option value="call">Phone Call / مكالمة هاتفية</option>
                  <option value="visit">Clinic Visit / زيارة للعيادة</option>
                  <option value="message">WhatsApp Message / رسالة واتساب</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>
                  Scheduled Date / التاريخ المقرر
                </label>
                <input
                  type="date"
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '1rem' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>
                Notes / ملاحظات
              </label>
              <textarea
                value={followUpNotes}
                onChange={e => setFollowUpNotes(e.target.value)}
                rows={4}
                placeholder="Follow-up notes..."
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  fontSize: '1rem',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                className="btn btn-primary"
                onClick={handleScheduleFollowUp}
                disabled={loading}
                style={{ flex: 1, padding: '1.2rem', fontSize: '1.1rem' }}
              >
                {loading ? 'Scheduling...' : (
                  <>
                    <Phone size={20} /> Schedule Follow-up
                  </>
                )}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowFollowUpModal(false)}
                disabled={loading}
                style={{ padding: '1.2rem', fontSize: '1.1rem' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Satisfaction Feedback Modal */}
      {showSatisfactionModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card shadow-lg" style={{ maxWidth: 500, width: '100%', padding: '2rem', borderRadius: '24px' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ color: 'var(--primary)', margin: 0, fontWeight: 800 }}>Collect Feedback</h2>
              <button onClick={() => setShowSatisfactionModal(false)}><X size={24} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>
                  Select Patient / اختيار المريض *
                </label>
                <select
                  value={feedbackPatientId}
                  onChange={e => setFeedbackPatientId(e.target.value)}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '1rem' }}
                >
                  <option value="">-- Select Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name} ({p.patient_code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: '12px' }}>
                  Rating / التقييم *
                </label>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setFeedbackRating(rating)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                    >
                      <Star
                        size={32}
                        fill={rating <= feedbackRating ? getRatingColor(feedbackRating) : '#e9ecef'}
                        style={{ color: rating <= feedbackRating ? getRatingColor(feedbackRating) : '#e9ecef' }}
                      />
                    </button>
                  ))}
                </div>
                <div style={{ textAlign: 'center', marginTop: '8px', fontWeight: 600, color: getRatingColor(feedbackRating) }}>
                  {feedbackRating} Star{feedbackRating !== 1 ? 's' : ''}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>
                  Feedback Notes / ملاحظات
                </label>
                <textarea
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  rows={3}
                  placeholder="Patient feedback or comments..."
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '1rem', fontFamily: 'inherit' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn btn-primary" onClick={handleCollectFeedback} disabled={loading} style={{ flex: 1, padding: '1.2rem', fontSize: '1.1rem', fontWeight: 800 }}>
                {loading ? 'Saving...' : <><Star size={20} /> Save Feedback</>}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowSatisfactionModal(false)} disabled={loading} style={{ padding: '1.2rem', fontSize: '1.1rem' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Modal */}
      {showCampaignModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card shadow-lg" style={{ maxWidth: 500, width: '100%', padding: '2rem', borderRadius: '24px' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ color: 'var(--primary)', margin: 0, fontWeight: 800 }}>Create Campaign</h2>
              <button onClick={() => setShowCampaignModal(false)}><X size={24} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>Campaign Name *</label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={e => setCampaignName(e.target.value)}
                  placeholder="e.g., Spring Campaign"
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '1rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>Campaign Type *</label>
                <select
                  value={campaignType}
                  onChange={e => setCampaignType(e.target.value as any)}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '1rem' }}
                >
                  <option value="social">Social Media</option>
                  <option value="vezeeta">Vezeeta Platform</option>
                  <option value="referral">Referral Program</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>Message *</label>
                <textarea
                  value={campaignMessage}
                  onChange={e => setCampaignMessage(e.target.value)}
                  rows={3}
                  placeholder="Campaign message..."
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '1rem', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>Start Date</label>
                  <input
                    type="date"
                    value={campaignStartDate}
                    onChange={e => setCampaignStartDate(e.target.value)}
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '1rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>End Date</label>
                  <input
                    type="date"
                    value={campaignEndDate}
                    onChange={e => setCampaignEndDate(e.target.value)}
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '1rem' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn btn-primary" onClick={handleCreateCampaign} disabled={loading} style={{ flex: 1, padding: '1.2rem', fontSize: '1.1rem', fontWeight: 800 }}>
                {loading ? 'Creating...' : <><Plus size={20} /> Create Campaign</>}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowCampaignModal(false)} disabled={loading} style={{ padding: '1.2rem', fontSize: '1.1rem' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
