"use client";

import React, { useState, useEffect } from 'react';
import {
  Users, TrendingUp, Phone, Mail,
  Calendar, MessageSquare, Share2, BarChart3,
  PieChart, Filter, Download, CheckCircle2,
  AlertCircle, Clock, ArrowRight, UserPlus,
  Star, ThumbsUp, ThumbsDown, Plus, X
} from 'lucide-react';
import { useAuth } from '@/modules/auth/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { PatientRow } from '@/types/database';

export default function MarketingDashboard() {
  const { role, activeClinicId } = useAuth();

  // Analytics State
  const [totalPatients, setTotalPatients] = useState(0);
  const [newPatientsThisMonth, setNewPatientsThisMonth] = useState(0);
  const [returningPatients, setReturningPatients] = useState(0);
  const [vezeetaPatients, setVezeetaPatients] = useState(0);
  const [averageWaitTime, setAverageWaitTime] = useState(0);

  // Referral Analytics
  const [referralData, setReferralData] = useState<any[]>([]);
  const [topReferrals, setTopReferrals] = useState<any[]>([]);

  // Patient Satisfaction
  const [satisfactionScores, setSatisfactionScores] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);

  // Follow-up Management
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientRow | null>(null);
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [followUpType, setFollowUpType] = useState<'call' | 'visit' | 'message'>('call');

  // Marketing Campaign State
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [campaignType, setCampaignType] = useState<'social' | 'vezeeta' | 'referral'>('social');
  const [campaignMessage, setCampaignMessage] = useState('');
  const [campaignStartDate, setCampaignStartDate] = useState('');
  const [campaignEndDate, setCampaignEndDate] = useState('');

  // Feedback Collection State
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackPatientId, setFeedbackPatientId] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSource, setFeedbackSource] = useState<'in_person' | 'phone' | 'vezeeta'>('in_person');
  const [patients, setPatients] = useState<PatientRow[]>([]);

  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  const supabase = createClient();

  // Load Analytics Data
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!activeClinicId) return;

      const [
        totalRes,
        newRes,
        vezeetaRes,
        referralRes
      ] = await Promise.all([
        supabase.from('patients').select('*', { count: 'exact', head: true }),
        supabase.from('patients').select('*').gte('created_at', new Date(new Date().setDate(1)).toISOString()),
        supabase.from('patients').select('*').eq('is_vezeeta', true),
        supabase.from('patients').select('*, referral_sources(name_ar, name_en)')
      ]);

      setTotalPatients(totalRes.count || 0);
      setNewPatientsThisMonth(newRes.data?.length || 0);
      setVezeetaPatients(vezeetaRes.data?.length || 0);
      setReturningPatients((totalRes.count || 0) - (newRes.data?.length || 0));

      // Process referral data
      const referralCounts: any = {};
      (referralRes.data || []).forEach((patient: any) => {
        const source = patient.referral_sources?.name_ar || 'Unknown';
        referralCounts[source] = (referralCounts[source] || 0) + 1;
      });

      const referralArray = Object.entries(referralCounts).map(([source, count]) => ({
        source,
        count: count as number,
        percentage: totalPatients > 0 ? (((count as number) / totalPatients) * 100).toFixed(1) : '0'
      }));

      setReferralData(referralArray.sort((a, b) => b.count - a.count).slice(0, 5));
      setTopReferrals(referralArray.sort((a, b) => b.count - a.count).slice(0, 3));
    };

    fetchAnalytics();
  }, [activeClinicId, supabase]);

  // Load Follow-up Data
  useEffect(() => {
    const fetchFollowUps = async () => {
      const { data } = await supabase
        .from('follow_ups')
        .select('*, patients(full_name, patient_code, phone)')
        .eq('clinic_id', activeClinicId)
        .order('scheduled_date', { ascending: true })
        .limit(20);

      setFollowUps(data || []);
    };

    fetchFollowUps();
  }, [activeClinicId, supabase]);

  // Load Campaigns from database
  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!activeClinicId) return;

      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('clinic_id', activeClinicId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching campaigns:', error);
        return;
      }

      setCampaigns(data || []);
    };

    fetchCampaigns();
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

  // Load Satisfaction Data from database
  useEffect(() => {
    const fetchSatisfaction = async () => {
      if (!activeClinicId) return;

      const { data, error } = await supabase
        .from('satisfaction_scores')
        .select('*, patients(full_name, patient_code)')
        .eq('clinic_id', activeClinicId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching satisfaction scores:', error);
        return;
      }

      const formattedData = (data || []).map(score => ({
        id: score.id,
        patient: score.patients?.full_name || 'Anonymous',
        patientCode: score.patients?.patient_code,
        rating: score.rating,
        date: score.created_at,
        feedback: score.feedback || ''
      }));

      setSatisfactionScores(formattedData);
      if (formattedData.length > 0) {
        setAverageRating(Number((formattedData.reduce((sum: number, s: any) => sum + s.rating, 0) / formattedData.length).toFixed(1)));
      }
    };

    fetchSatisfaction();
  }, [activeClinicId, supabase]);

  const handleScheduleFollowUp = async () => {
    if (!selectedPatient || !activeClinicId) return;

    setLoading(true);
    try {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + 3); // Schedule 3 days from now

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
      alert('خطأ في جدار المتابعة: ' + error.message + '\n\nError scheduling follow-up: ' + error.message);
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
        .order('created_at', { ascending: false });

      setCampaigns(updatedCampaigns || []);

      setShowCampaignModal(false);
      setCampaignName('');
      setCampaignMessage('');
      setCampaignStartDate('');
      setCampaignEndDate('');
      alert('تم إنشاء الحملة بنجاح!\n\nCampaign created successfully!');
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      alert('خطأ في إنشاء الحملة: ' + error.message + '\n\nError creating campaign: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return '#28a745';
    if (rating === 3) return '#ffc107';
    return '#dc3545';
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
        .limit(20);

      if (updatedScores) {
        const formattedData = updatedScores.map(score => ({
          id: score.id,
          patient: score.patients?.full_name || 'Anonymous',
          patientCode: score.patients?.patient_code,
          rating: score.rating,
          date: score.created_at,
          feedback: score.feedback || ''
        }));
        setSatisfactionScores(formattedData);
        if (formattedData.length > 0) {
          setAverageRating(Number((formattedData.reduce((sum: number, s: any) => sum + s.rating, 0) / formattedData.length).toFixed(1)));
        }
      }

      setShowFeedbackModal(false);
      setFeedbackPatientId('');
      setFeedbackRating(5);
      setFeedbackText('');
      alert('تم تسجيل التقييم بنجاح!\n\nFeedback recorded successfully!');
    } catch (error: any) {
      console.error('Error collecting feedback:', error);
      alert('خطأ في تسجيل التقييم: ' + error.message + '\n\nError recording feedback: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem' }}>
      {/* Header */}
      <div className="card shadow-sm">
        <div className="flex-between">
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>Marketing Dashboard</h1>
            <p style={{ color: 'var(--text-light)', marginTop: '5px' }}>
              لوحة تسويق العيادة / Clinic Marketing Dashboard
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

      {/* Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        <div className="card shadow-sm" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <Users size={32} style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-dark)' }}>{totalPatients}</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
            Total Patients / إجمالي المرضى
          </div>
        </div>

        <div className="card shadow-sm" style={{ padding: '1.5rem', textAlign: 'center', borderLeft: '4px solid #28a745' }}>
          <UserPlus size={32} style={{ color: '#28a745', margin: '0 auto 1rem' }} />
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#28a745' }}>{newPatientsThisMonth}</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
            New This Month / جدد هذا الشهر
          </div>
        </div>

        <div className="card shadow-sm" style={{ padding: '1.5rem', textAlign: 'center', borderLeft: '4px solid #ffc107' }}>
          <Users size={32} style={{ color: '#ffc107', margin: '0 auto 1rem' }} />
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#ffc107' }}>{returningPatients}</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
            Returning Patients / مرضى عائدين
          </div>
        </div>

        <div className="card shadow-sm" style={{ padding: '1.5rem', textAlign: 'center', borderLeft: '4px solid #0070f3' }}>
          <Share2 size={32} style={{ color: '#0070f3', margin: '0 auto 1rem' }} />
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#0070f3' }}>{vezeetaPatients}</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
            Vezeeta Patients / مرضى فيزيتا
          </div>
        </div>

        <div className="card shadow-sm" style={{ padding: '1.5rem', textAlign: 'center', borderLeft: '4px solid var(--success)' }}>
          <Star size={32} style={{ color: 'var(--success)', margin: '0 auto 1rem' }} />
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--success)' }}>{averageRating.toFixed(1)}</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
            Avg Rating / متوسط التقييم
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Left Column - Referrals & Follow-ups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Referral Sources */}
          <div className="card shadow-sm">
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
                <Share2 size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
                Top Referral Sources / أهم مصادر الإحالة
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {referralData.map((referral, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-dark)' }}>
                      {referral.source}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                      {referral.count} patients ({referral.percentage}%)
                    </div>
                  </div>
                  <div style={{
                    width: '60px',
                    height: '8px',
                    background: '#e9ecef',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${referral.percentage}%`,
                      height: '100%',
                      background: 'var(--primary)'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Follow-up Management */}
          <div className="card shadow-sm">
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
                <Phone size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
                Follow-ups / المتابعات
              </h2>
              <button
                className="btn btn-primary"
                onClick={() => setShowFollowUpModal(true)}
                style={{ padding: '0.8rem 1.2rem' }}
              >
                <Calendar size={18} /> Schedule Follow-up
              </button>
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {followUps.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                  <Clock size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <div>No scheduled follow-ups</div>
                </div>
              ) : (
                followUps.map(followUp => (
                  <div key={followUp.id} className="card" style={{ padding: '1rem', marginBottom: '0.5rem', background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                          {followUp.patients?.full_name}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                          {followUp.patients?.patient_code} • {new Date(followUp.scheduled_date).toLocaleDateString()}
                        </div>
                      </div>
                      <span className="badge" style={{
                        background: followUp.status === 'completed' ? '#d1e7dd' : followUp.status === 'scheduled' ? '#ffc107' : '#6c757d',
                        color: 'white'
                      }}>
                        {followUp.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-medium)' }}>
                      <strong>{followUp.follow_up_type.toUpperCase()}:</strong> {followUp.notes}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Satisfaction & Campaigns */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Patient Satisfaction */}
          <div className="card shadow-sm">
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
                <Star size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
                Patient Satisfaction / رضا المرضى
              </h2>
              <button
                className="btn btn-primary"
                onClick={() => setShowFeedbackModal(true)}
                style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}
              >
                <Plus size={16} /> Collect Feedback
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {satisfactionScores.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                  <Star size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <div>No feedback collected yet</div>
                  <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Click "Collect Feedback" to add patient reviews</div>
                </div>
              ) : (
                satisfactionScores.slice(0, 5).map((score, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', borderRadius: '8px', background: 'white' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          size={16}
                          fill={star <= score.rating ? getRatingColor(score.rating) : '#e9ecef'}
                          style={{ color: star <= score.rating ? getRatingColor(score.rating) : '#e9ecef' }}
                        />
                      ))}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{score.patient}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '2px' }}>
                        {new Date(score.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Marketing Campaigns */}
          <div className="card shadow-sm">
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
                <MessageSquare size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
                Marketing Campaigns / حملات تسويقية
              </h2>
              <button
                className="btn btn-primary"
                onClick={() => setShowCampaignModal(true)}
                style={{ padding: '0.8rem 1.2rem' }}
              >
                <Plus size={18} /> New Campaign
              </button>
            </div>

            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
              {campaigns.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                  <MessageSquare size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <div>No active campaigns</div>
                </div>
              ) : (
                campaigns.map(campaign => (
                  <div key={campaign.id} className="card" style={{ padding: '1rem', marginBottom: '0.5rem', background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary)' }}>
                          {campaign.name}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                          {campaign.type.toUpperCase()} • {new Date(campaign.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <span className="badge badge-active">{campaign.status}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-medium)' }}>
                      {campaign.message?.substring(0, 60)}...
                    </div>
                  </div>
                ))
              )}
            </div>
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

      {/* Campaign Modal */}
      {showCampaignModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card shadow-lg" style={{ maxWidth: 600, width: '100%', padding: '2rem', borderRadius: '24px' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ color: 'var(--primary)', margin: 0, fontWeight: 800 }}>Create Marketing Campaign</h2>
              <button onClick={() => setShowCampaignModal(false)}><X size={24} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>
                  Campaign Name / اسم الحملة *
                </label>
                <input
                  required
                  type="text"
                  value={campaignName}
                  onChange={e => setCampaignName(e.target.value)}
                  placeholder="e.g., Spring Mental Health Awareness"
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>
                  Campaign Type / نوع الحملة *
                </label>
                <select
                  required
                  value={campaignType}
                  onChange={e => setCampaignType(e.target.value as any)}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '1rem' }}
                >
                  <option value="social">Social Media / وسائل التواصل الاجتماعي</option>
                  <option value="vezeeta">Vezeeta Platform / منصة فيزيتا</option>
                  <option value="referral">Referral Program / برنامج الإحالة</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>
                  Campaign Message / رسالة الحملة *
                </label>
                <textarea
                  required
                  value={campaignMessage}
                  onChange={e => setCampaignMessage(e.target.value)}
                  rows={4}
                  placeholder="Campaign message content..."
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>
                    Start Date / تاريخ البداية
                  </label>
                  <input
                    required
                    type="date"
                    value={campaignStartDate}
                    onChange={e => setCampaignStartDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>
                    End Date / تاريخ النهاية
                  </label>
                  <input
                    required
                    type="date"
                    value={campaignEndDate}
                    onChange={e => setCampaignEndDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                className="btn btn-primary"
                onClick={handleCreateCampaign}
                disabled={loading}
                style={{ flex: 1, padding: '1.2rem', fontSize: '1.1rem', fontWeight: 800 }}
              >
                {loading ? 'Creating...' : (
                  <>
                    <Plus size={20} /> Create Campaign
                  </>
                )}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowCampaignModal(false)}
                disabled={loading}
                style={{ padding: '1.2rem', fontSize: '1.1rem' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Collection Modal */}
      {showFeedbackModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card shadow-lg" style={{ maxWidth: 500, width: '100%', padding: '2rem', borderRadius: '24px' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ color: 'var(--primary)', margin: 0, fontWeight: 800 }}>Collect Feedback</h2>
              <button onClick={() => setShowFeedbackModal(false)}><X size={24} /></button>
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
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
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
                  Feedback Source / مصدر التقييم
                </label>
                <select
                  value={feedbackSource}
                  onChange={e => setFeedbackSource(e.target.value as any)}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '1rem' }}
                >
                  <option value="in_person">In Person / في العيادة</option>
                  <option value="phone">Phone Call / مكالمة هاتفية</option>
                  <option value="vezeeta">Vezeeta Platform / منصة فيزيتا</option>
                </select>
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
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                className="btn btn-primary"
                onClick={handleCollectFeedback}
                disabled={loading}
                style={{ flex: 1, padding: '1.2rem', fontSize: '1.1rem', fontWeight: 800 }}
              >
                {loading ? 'Saving...' : (
                  <>
                    <Star size={20} /> Save Feedback
                  </>
                )}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowFeedbackModal(false)}
                disabled={loading}
                style={{ padding: '1.2rem', fontSize: '1.1rem' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
