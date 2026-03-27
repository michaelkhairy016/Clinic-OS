"use client";

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, X, User, Clock, Search,
  DollarSign, Receipt, AlertCircle, ArrowRight,
  Plus, Trash2, RefreshCw, QrCode, Smartphone
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/modules/auth/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { validatePatientForm, formatValidationErrors, sanitizePhoneNumber } from '@/lib/validation';
import { PatientVisitRow, PatientRow, QueueEntryRow } from '@/types/database';

type PendingVisit = PatientVisitRow & {
  form_data: any;
};

export default function AssistantPage() {
  const { role, activeClinicId, user } = useAuth();

  // QR Code URL for patient intake form
  const [showQRModal, setShowQRModal] = useState(false);
  const intakeFormUrl = typeof window !== 'undefined' ? `${window.location.origin}/patient/form` : '';

  // State for pending patient visits
  const [pendingVisits, setPendingVisits] = useState<PendingVisit[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<PendingVisit | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // State for returning patients
  const [showReturningPatient, setShowReturningPatient] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [searchResults, setSearchResults] = useState<PatientRow[]>([]);

  // State for utility payments
  const [showPayments, setShowPayments] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentCategory, setPaymentCategory] = useState('rent');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});

  // Form state for new patient (returning patients)
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientAge, setNewPatientAge] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientErrors, setNewPatientErrors] = useState<Record<string, string>>({});

  const supabase = createClient();

  // Load pending patient visits
  useEffect(() => {
    const fetchPendingVisits = async () => {
      if (!activeClinicId) return;

      const { data, error } = await supabase
        .from('patient_visits')
        .select('*')
        .eq('status', 'form_submitted')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching pending visits:', error);
        return;
      }

      setPendingVisits(data || []);
    };

    fetchPendingVisits();
  }, [activeClinicId, supabase]);

  // Load utility payments
  useEffect(() => {
    const fetchPayments = async () => {
      if (!activeClinicId) return;

      const { data, error } = await supabase
        .from('utility_payments')
        .select('*, profiles(full_name)')
        .eq('clinic_id', activeClinicId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching payments:', error);
        return;
      }

      setPayments(data || []);
    };

    fetchPayments();
  }, [activeClinicId, supabase]);

  // Search existing patients for returning patient
  useEffect(() => {
    const searchPatients = async () => {
      if (searchName.length < 2) {
        setSearchResults([]);
        return;
      }

      const { data } = await supabase
        .from('patients')
        .select('*')
        .or(`full_name.ilike.%${searchName}%,patient_code.ilike.%${searchName}%`)
        .limit(5);

      setSearchResults(data || []);
    };

    const timer = setTimeout(searchPatients, 500);
    return () => clearTimeout(timer);
  }, [searchName, supabase]);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      const [visitsRes, paymentsRes] = await Promise.all([
        supabase.from('patient_visits').select('*').eq('status', 'form_submitted').order('created_at', { ascending: true }),
        supabase.from('utility_payments').select('*, profiles(full_name)').eq('clinic_id', activeClinicId).order('created_at', { ascending: false }).limit(50)
      ]);
      setPendingVisits(visitsRes.data || []);
      setPayments(paymentsRes.data || []);
    } catch (error) {
      console.error('Error refreshing data:', error);
      alert('Error refreshing data: ' + error);
    } finally {
      setRefreshing(false);
    }
  };

  const verifyPatient = async (visit: PendingVisit) => {
    if (!confirm(`Verify patient: ${visit.form_data?.fullName || 'Unknown'}?\n\nتأكيد التحقق من المريض؟`)) {
      return;
    }

    setLoading(true);
    try {
      // Create patient if doesn't exist
      let patientId: string | null = null;
      const patientData = visit.form_data;

      // Check if patient already exists by phone
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('id')
        .eq('phone', sanitizePhoneNumber(patientData.phone))
        .maybeSingle();

      if (existingPatient) {
        patientId = existingPatient.id;
      } else {
        // Create new patient
        const { data: newPatient, error: createError } = await supabase
          .from('patients')
          .insert({
            full_name: patientData.fullName,
            age: patientData.age,
            phone: sanitizePhoneNumber(patientData.phone),
            email: patientData.email || null,
            status: 'active'
          })
          .select()
          .single();

        if (createError) throw createError;
        patientId = newPatient?.id || null;
      }

      if (!patientId) throw new Error('Failed to create or find patient');

      // Update visit record
      const { error: updateError } = await supabase
        .from('patient_visits')
        .update({
          status: 'verified',
          patient_id: patientId,
          verified_by: user?.id
        })
        .eq('id', visit.id);

      if (updateError) throw updateError;

      // Remove from pending list
      setPendingVisits(pendingVisits.filter(v => v.id !== visit.id));
      setSelectedVisit(null);
      alert('تم التحقق بنجاح!\n\nPatient verified successfully!');
    } catch (error: any) {
      console.error('Verification error:', error);
      alert('خطأ في التحقق: ' + error.message + '\n\nVerification error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addReturningPatientToQueue = async (patient: PatientRow) => {
    if (!activeClinicId) return;

    setLoading(true);
    try {
      // Get next queue number
      const { data: queueNumData } = await supabase.rpc('get_next_queue_number');

      if (!queueNumData) throw new Error('Failed to get queue number');

      // Create queue entry
      const { error: queueError } = await supabase.from('queue_entries').insert({
        patient_id: patient.id,
        clinic_id: activeClinicId,
        queue_num: queueNumData,
        status: 'waiting',
        visit_type_id: null, // Will be set by assistant
        payment_method_id: null, // Will be set by assistant
        amount_paid: 0,
        is_vezeeta: patient.is_vezeeta
      });

      if (queueError) throw queueError;

      setShowReturningPatient(false);
      setSearchName('');
      setSearchResults([]);
      alert(`تم إضافة ${patient.full_name} إلى القائمة\n\nAdded ${patient.full_name} to queue!`);
    } catch (error: any) {
      console.error('Error adding returning patient:', error);
      alert('خطأ في الإضافة: ' + error.message + '\n\nError adding patient: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validation = validatePatientForm({
        fullName: 'Utility Payment',
        age: '0',
        phone: '0000000000',
        districtId: paymentCategory,
        sourceId: 'utility'
      });

      if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
        setPaymentErrors({ amount: 'المبلغ مطلوب و يجب أن يكون أكبر من صفر / Amount required and must be greater than 0' });
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('utility_payments').insert({
        amount: parseFloat(paymentAmount),
        category: paymentCategory,
        description: paymentDescription || null,
        paid_by: user?.id,
        clinic_id: activeClinicId
      });

      if (error) throw error;

      // Reset form
      setPaymentAmount('');
      setPaymentDescription('');
      setPaymentErrors({});

      // Refresh payments
      const { data: refreshedPayments } = await supabase
        .from('utility_payments')
        .select('*, profiles(full_name)')
        .eq('clinic_id', activeClinicId)
        .order('created_at', { ascending: false })
        .limit(50);

      setPayments(refreshedPayments || []);
      alert('تم تسجيل الدفعة بنجاح!\n\nPayment recorded successfully!');
    } catch (error: any) {
      console.error('Payment submission error:', error);
      alert('خطأ في تسجيل الدفعة: ' + error.message + '\n\nError recording payment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem' }}>
      {/* Header */}
      <div className="card shadow-sm" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #2c7a78 100%)', color: 'white', border: 'none' }}>
        <div className="flex-between">
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>Assistant Dashboard</h1>
            <p style={{ opacity: 0.9, marginTop: '5px' }}>لوحة تحكم المساعد / Assistant Control Panel</p>
          </div>
          <button
            className="btn btn-secondary"
            style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)' }}
            onClick={refreshData}
            disabled={refreshing}
          >
            {refreshing ? <RefreshCw className="spinner" size={20} /> : <RefreshCw size={20} />}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Pending Patient Visits */}
        <div className="card shadow-sm">
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
              <User size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
              Pending Verifications
            </h2>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
              {pendingVisits.length} awaiting
            </div>
          </div>

          {pendingVisits.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
              <Clock size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <div>No pending verifications</div>
              <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                انتظار استمارات المرضى من QR codes
                <br/>
                Waiting for patient forms from QR codes
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pendingVisits.map(visit => (
                <div
                  key={visit.id}
                  className="card"
                  style={{
                    padding: '1.2rem',
                    marginBottom: 0,
                    border: '2px solid #ffc107',
                    cursor: 'pointer',
                    background: selectedVisit?.id === visit.id ? '#fff3cd' : 'white'
                  }}
                  onClick={() => setSelectedVisit(selectedVisit?.id === visit.id ? null : visit)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-dark)' }}>
                        {visit.form_data?.fullName || 'Unknown Patient'}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginTop: '4px' }}>
                        {visit.form_data?.phone} • {visit.form_data?.age} years
                      </div>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                      {new Date(visit.created_at).toLocaleTimeString()}
                    </div>
                  </div>

                  <div style={{ fontSize: '0.9rem', color: 'var(--text-medium)' }}>
                    <strong>Chief Complaint:</strong> {visit.form_data?.chiefComplaint || 'Not specified'}
                  </div>

                  {selectedVisit?.id === visit.id && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                        <strong>Symptoms:</strong> {visit.form_data?.symptoms || 'Not specified'}
                      </div>
                      <div style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                        <strong>Medications:</strong> {visit.form_data?.medications || 'None'}
                      </div>
                      <div style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                        <strong>Allergies:</strong> {visit.form_data?.allergies || 'None'}
                      </div>
                      {visit.form_data?.isEmergency && (
                        <div style={{ background: '#fee2e2', color: '#dc3545', padding: '0.5rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 800 }}>
                          ⚠️ EMERGENCY CASE
                        </div>
                      )}

                      <button
                        className="btn btn-primary"
                        onClick={() => verifyPatient(visit)}
                        disabled={loading}
                        style={{ marginTop: '1rem', width: '100%', padding: '1rem' }}
                      >
                        {loading ? 'Processing...' : (
                          <>
                            <CheckCircle2 size={20} /> Verify & Add to Queue
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* QR Code for Patient Intake */}
          <div className="card shadow-sm" style={{ padding: '1.5rem', textAlign: 'center', border: '2px solid var(--primary)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <QrCode size={24} /> Patient Intake QR
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '1rem' }}>
              Scan to fill intake form / امسح الكود لتعبئة الاستمارة
            </p>
            <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', display: 'inline-block' }}>
              <QRCodeSVG
                value={intakeFormUrl}
                size={150}
                level="H"
                includeMargin={true}
              />
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <button
                className="btn btn-secondary"
                onClick={() => navigator.clipboard?.writeText(intakeFormUrl)}
                style={{ fontSize: '0.85rem', padding: '8px 16px' }}
              >
                Copy Link
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setShowQRModal(true)}
                style={{ fontSize: '0.85rem', padding: '8px 16px' }}
              >
                <Smartphone size={16} /> Large View
              </button>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => setShowReturningPatient(true)}
            style={{ padding: '1.2rem', fontSize: '1.1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <User size={20} />
            Add Returning Patient
          </button>

          <button
            className="btn btn-success"
            onClick={() => setShowPayments(true)}
            style={{ padding: '1.2rem', fontSize: '1.1rem', borderRadius: '12px', background: 'var(--success)', borderColor: 'var(--success)', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <Receipt size={20} />
            Utility Payments
          </button>
        </div>
      </div>

      {/* Selected Visit Detail Modal */}
      {selectedVisit && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card shadow-lg" style={{ maxWidth: 600, width: '100%', padding: '2rem', borderRadius: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ color: 'var(--primary)', margin: 0, fontWeight: 800 }}>Patient Verification</h2>
              <button onClick={() => setSelectedVisit(null)}><X size={24} /></button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', marginBottom: '1rem' }}>
                {selectedVisit.form_data?.fullName || 'Unknown Patient'}
              </h3>
              <div style={{ fontSize: '1rem', color: 'var(--text-medium)', lineHeight: 1.6 }}>
                <strong>Age:</strong> {selectedVisit.form_data?.age} years<br/>
                <strong>Phone:</strong> {selectedVisit.form_data?.phone}<br/>
                <strong>Email:</strong> {selectedVisit.form_data?.email || 'Not provided'}<br/>
                <strong>District:</strong> {selectedVisit.form_data?.district || 'Not specified'}
              </div>
            </div>

            <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Chief Complaint / الشكوى الرئيسية:</div>
              <div style={{ fontSize: '1rem' }}>{selectedVisit.form_data?.chiefComplaint || 'Not specified'}</div>

              <div style={{ fontWeight: 800, marginBottom: '0.5rem', marginTop: '1rem' }}>Symptoms / الأعراض:</div>
              <div style={{ fontSize: '1rem' }}>{selectedVisit.form_data?.symptoms || 'None specified'}</div>

              <div style={{ fontWeight: 800, marginBottom: '0.5rem', marginTop: '1rem' }}>Current Medications / الأدوية الحالية:</div>
              <div style={{ fontSize: '1rem' }}>{selectedVisit.form_data?.medications || 'None'}</div>

              <div style={{ fontWeight: 800, marginBottom: '0.5rem', marginTop: '1rem' }}>Allergies / الحساسية:</div>
              <div style={{ fontSize: '1rem' }}>{selectedVisit.form_data?.allergies || 'None'}</div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                className="btn btn-primary"
                onClick={() => verifyPatient(selectedVisit)}
                disabled={loading}
                style={{ flex: 1, padding: '1rem' }}
              >
                {loading ? 'Processing...' : (
                  <>
                    <CheckCircle2 size={20} /> Verify & Add to Queue
                  </>
                )}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedVisit(null)}
                disabled={loading}
                style={{ padding: '1rem' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Returning Patient Modal */}
      {showReturningPatient && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card shadow-lg" style={{ maxWidth: 500, width: '100%', padding: '2rem', borderRadius: '24px' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ color: 'var(--primary)', margin: 0, fontWeight: 800 }}>Add Returning Patient</h2>
              <button onClick={() => {
                setShowReturningPatient(false);
                setSearchName('');
                setSearchResults([]);
                setNewPatientErrors({});
              }}><X size={24} /></button>
            </div>

            {/* Search Existing Patients */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>
                Search Patient / بحث عن مريض
              </label>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', right: '12px', top: '12px', color: 'var(--text-light)' }} />
                <input
                  value={searchName}
                  onChange={e => setSearchName(e.target.value)}
                  placeholder="Patient name or code..."
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 40px',
                    borderRadius: '12px',
                    border: newPatientErrors.fullName ? '2px solid #df4759' : '1px solid var(--border)'
                  }}
                />
              </div>

              {searchResults.length > 0 && (
                <div style={{ marginTop: '1rem', maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '12px' }}>
                  {searchResults.map(patient => (
                    <div
                      key={patient.id}
                      onClick={() => addReturningPatientToQueue(patient)}
                      style={{
                        padding: '12px',
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        background: 'white'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-color)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <div style={{ fontWeight: 800, fontSize: '1rem' }}>{patient.full_name}</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', display: 'flex', gap: '10px' }}>
                        <span>{patient.patient_code}</span>
                        <span>{patient.age}y</span>
                        <span>{patient.phone}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create New Patient Option */}
            {searchResults.length === 0 && searchName.length >= 2 && (
              <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', padding: '1rem', textAlign: 'center', marginBottom: '1rem' }}>
                <AlertCircle size={16} style={{ color: '#ffc107', display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
                <span style={{ color: '#856404', fontWeight: 600 }}>
                  Patient not found. Creating new patient record.
                </span>
              </div>
            )}

            <button
              className="btn btn-primary"
              onClick={() => {
                setShowReturningPatient(false);
                window.location.href = '/queue';
              }}
              style={{ width: '100%', padding: '1rem' }}
            >
              <ArrowRight size={20} /> Go to Queue Management
            </button>
          </div>
        </div>
      )}

      {/* Utility Payments Modal */}
      {showPayments && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card shadow-lg" style={{ maxWidth: 600, width: '100%', padding: '2rem', borderRadius: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ color: 'var(--success)', margin: 0, fontWeight: 800 }}><Receipt size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} /> Utility Payments</h2>
              <button onClick={() => {
                setShowPayments(false);
                setPaymentErrors({});
              }}><X size={24} /></button>
            </div>

            <form onSubmit={submitPayment} style={{ marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>Amount (EGP)</label>
                <input
                  required
                  type="number"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount..."
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: paymentErrors.amount ? '2px solid #df4759' : '1px solid var(--border)',
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    textAlign: 'center'
                  }}
                />
                {paymentErrors.amount && <div style={{ color: '#df4759', fontSize: '0.85rem', marginTop: '4px' }}>{paymentErrors.amount}</div>}
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>Category</label>
                <select
                  value={paymentCategory}
                  onChange={e => setPaymentCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    fontSize: '1rem'
                  }}
                >
                  <option value="rent">Rent / إيجار</option>
                  <option value="electricity">Electricity / كهرباء</option>
                  <option value="internet">Internet / إنترنت</option>
                  <option value="supplies">Supplies / مستلزمات</option>
                  <option value="maintenance">Maintenance / صيانة</option>
                  <option value="salary">Salary / مرتبات</option>
                  <option value="other">Other / أخرى</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>Description (Optional)</label>
                <textarea
                  value={paymentDescription}
                  onChange={e => setPaymentDescription(e.target.value)}
                  rows={3}
                  placeholder="Payment details..."
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

              <button
                type="submit"
                className="btn btn-success"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '1.2rem',
                  fontSize: '1.1rem',
                  borderRadius: '12px',
                  marginTop: '1rem',
                  fontWeight: 800
                }}
              >
                {loading ? 'Processing...' : (
                  <>
                    <DollarSign size={20} /> Record Payment
                  </>
                )}
              </button>
            </form>

            {/* Recent Payments */}
            <div style={{ maxHeight: '300px', overflowY: 'auto', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <h3 style={{ margin: 0, marginBottom: '1rem', fontSize: '1rem' }}>Recent Payments</h3>
              {payments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                  No payments recorded yet
                </div>
              ) : (
                payments.map(payment => (
                  <div key={payment.id} className="card" style={{ padding: '1rem', marginBottom: '0.5rem', background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--success)' }}>
                        {payment.amount} EGP
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                        {new Date(payment.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-medium)' }}>
                      <span style={{ background: 'var(--bg-color)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                        {payment.category.toUpperCase()}
                      </span>
                      {payment.description && ` - ${payment.description}`}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                      By: {payment.profiles?.full_name || 'Unknown'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR Code Large View Modal */}
      {showQRModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card shadow-lg" style={{ maxWidth: 500, width: '100%', padding: '2rem', borderRadius: '24px', textAlign: 'center' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ color: 'var(--primary)', margin: 0, fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <QrCode size={24} /> Patient Intake QR
              </h2>
              <button onClick={() => setShowQRModal(false)}><X size={24} /></button>
            </div>

            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', display: 'inline-block', marginBottom: '1.5rem' }}>
              <QRCodeSVG
                value={intakeFormUrl}
                size={300}
                level="H"
                includeMargin={true}
              />
            </div>

            <p style={{ fontSize: '1.1rem', color: 'var(--text-medium)', marginBottom: '1rem' }}>
              Scan this QR code to fill the patient intake form
            </p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '1.5rem', direction: 'rtl' }}>
              امسح هذا الكود لتعبئة استمارة المريض
            </p>

            <div style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', wordBreak: 'break-all', fontSize: '0.85rem' }}>
              <strong>URL:</strong> {intakeFormUrl}
            </div>

            <button
              className="btn btn-primary"
              onClick={() => {
                navigator.clipboard?.writeText(intakeFormUrl);
                alert('Link copied! / تم نسخ الرابط!');
              }}
              style={{ width: '100%', padding: '1rem' }}
            >
              <Smartphone size={20} /> Copy Link to Share
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
