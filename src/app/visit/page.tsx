"use client";

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'react-qr-code';
import { Scan, CheckCircle2, Clock, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { validatePatientForm, formatValidationErrors, sanitizePhoneNumber, isValidEmail } from '@/lib/validation';
import { PatientVisitRow } from '@/types/database';

export default function PatientVisitPage() {
  const [visitId, setVisitId] = useState<string>('');
  const [visitData, setVisitData] = useState<PatientVisitRow | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [district, setDistrict] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [medications, setMedications] = useState('');
  const [allergies, setAllergies] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  // Generate QR code on page load
  useEffect(() => {
    const generateVisitId = () => {
      const id = `VISIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setVisitId(id);
      return id;
    };

    generateVisitId();
  }, []);

  // Check if visit exists (for returning to form)
  useEffect(() => {
    if (!visitId) return;

    const checkVisit = async () => {
      const { data } = await supabase
        .from('patient_visits')
        .select('*')
        .eq('qr_code', visitId)
        .single();

      if (data) {
        setVisitData(data);
        if (data.status !== 'qr_generated') {
          setFormSubmitted(true);
        }
      }
    };

    checkVisit();
  }, [visitId, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form data
      const validation = validatePatientForm({
        fullName,
        age,
        phone,
        districtId: district,
        sourceId: 'self'
      });

      if (!validation.isValid) {
        setErrors(validation.errors);
        alert(formatValidationErrors(validation.errors));
        setLoading(false);
        return;
      }

      // Validate email if provided
      if (email && !isValidEmail(email)) {
        setErrors({ email: 'Invalid email format / تنسيق البريد الإلكتروني غير صحيح' });
        alert('Invalid email format');
        setLoading(false);
        return;
      }

      // Create or update patient visit record
      const visitFormData = {
        fullName,
        age: parseInt(age),
        phone: sanitizePhoneNumber(phone),
        email,
        district,
        chiefComplaint,
        symptoms,
        medications,
        allergies,
        isEmergency
      };

      let visitRecord;

      if (visitData && visitData.status === 'qr_generated') {
        // Update existing visit record
        const { data, error } = await supabase
          .from('patient_visits')
          .update({
            status: 'form_submitted',
            form_data: visitFormData
          })
          .eq('id', visitData.id)
          .select()
          .single();

        if (error) throw error;
        visitRecord = data;
      } else {
        // Create new patient visit record
        const { data, error } = await supabase
          .from('patient_visits')
          .insert({
            qr_code: visitId,
            status: 'form_submitted',
            form_data: visitFormData,
            is_returning_patient: false
          })
          .select()
          .single();

        if (error) throw error;
        visitRecord = data;
      }

      if (!visitRecord) throw new Error('Failed to save visit record');

      setFormSubmitted(true);
      setVisitData(visitRecord);
      setErrors({});
      setSuccess(true);
    } catch (error: any) {
      console.error('Form submission error:', error);
      alert('Error submitting form: ' + error.message + '\n\nخطأ في إرسال النموذج: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Get status text and color
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { text: string; color: string; ar: string }> = {
      'qr_generated': { text: 'QR Generated', color: '#6c757d', ar: 'تم إنشاء QR' },
      'form_submitted': { text: 'Awaiting Verification', color: '#ffc107', ar: 'في انتظار التحقق' },
      'verified': { text: 'Verified - In Queue', color: '#198754', ar: 'تم التحقق - في القائمة' },
      'in_queue': { text: 'In Queue', color: '#0d6efd', ar: 'في القائمة' },
      'completed': { text: 'Completed', color: '#198754', ar: 'مكتمل' }
    };
    return statusMap[status] || { text: 'Unknown', color: '#6c757d', ar: 'غير معروف' };
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', padding: '2rem' }}>
        <div className="card" style={{ maxWidth: 450, textAlign: 'center', padding: '3.5rem' }}>
          <CheckCircle2 size={80} style={{ color: 'var(--success)', margin: '0 auto 1.5rem' }} />
          <h2 style={{ color: 'var(--success)', marginBottom: '1rem' }}>تم التسجيل بنجاح!</h2>
          <h3 style={{ color: 'var(--success)', marginBottom: '1rem' }}>Registration Successful!</h3>
          <p style={{ color: 'var(--text-medium)', fontSize: '1.2rem', lineHeight: 1.6 }}>
            بياناتك تم إرسالها للمساعد للتحقق
            <br/><br/>
            Your data has been sent to the assistant for verification
          </p>
          <p style={{ color: 'var(--text-light)', fontSize: '1rem', marginTop: '1.5rem' }}>
            يرجى الانتظار حتى يتم استدعاؤك للدخول
            <br/>
            Please wait until you are called to enter
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '2rem' }}>
      <div className="card shadow-lg" style={{ maxWidth: 800, margin: '0 auto', borderRadius: '24px', padding: '3rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: 'var(--primary)', margin: 0, fontSize: '2rem', fontWeight: 800 }}>
            Dr. Amgad Khairy Clinic
          </h1>
          <p style={{ color: 'var(--text-light)', fontSize: '1.1rem', marginTop: '0.5rem' }}>
            استمارة زيارة المريض
            <br/>
            Patient Visit Form
          </p>
        </div>

        {/* Visit Status */}
        {visitData && (
          <div style={{ background: '#f8f9fa', border: '2px solid var(--primary)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <Clock size={32} style={{ color: getStatusInfo(visitData.status).color }} />
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: getStatusInfo(visitData.status).color }}>
                  {getStatusInfo(visitData.status).ar}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                  {getStatusInfo(visitData.status).text}
                </div>
              </div>
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-medium)' }}>
              Visit ID: <span style={{ fontWeight: 800, fontFamily: 'monospace' }}>{visitId}</span>
            </div>
          </div>
        )}

        {formSubmitted ? (
          <div style={{ textAlign: 'center', padding: '2rem', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '12px' }}>
            <CheckCircle2 size={48} style={{ color: '#ffc107', marginBottom: '1rem' }} />
            <h3 style={{ color: '#856404', margin: 0, marginBottom: '0.5rem' }}>
              نموذجك قيد المراجعة
            </h3>
            <h4 style={{ color: '#856404', margin: 0, marginBottom: '1rem' }}>
              Your form is under review
            </h4>
            <p style={{ color: 'var(--text-medium)', fontSize: '1rem', lineHeight: 1.6 }}>
              سيقوم المساعد بالتحقق من بياناتك وإضافتك إلى القائمة
              <br/><br/>
              The assistant will verify your data and add you to the queue
            </p>
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'white', borderRadius: '8px' }}>
              <User size={20} style={{ color: 'var(--primary)', display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
              <span style={{ color: 'var(--text-dark)', fontWeight: 600 }}>
                يرجى الانتظار في غرفة الانتظار
                <br/>
                Please wait in the waiting room
              </span>
            </div>
          </div>
        ) : (
          <>
            {/* QR Code Section */}
            {!visitData && (
              <div style={{ textAlign: 'center', marginBottom: '2rem', padding: '2rem', background: 'white', borderRadius: '16px', border: '2px dashed var(--primary)' }}>
                <p style={{ color: 'var(--text-light)', marginBottom: '1rem', fontSize: '1rem' }}>
                  Scan this QR code with your phone to fill out the visit form
                  <br/>
                  امسح هذا الرمز بهاتفك لملء استمارة الزيارة
                </p>
                <div style={{ background: 'white', padding: '1rem', display: 'inline-block', borderRadius: '12px' }}>
                  <QRCodeSVG
                    value={`https://clinic-os.com/visit?id=${visitId}`}
                    size={200}
                    level="H"
                  />
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-light)', fontFamily: 'monospace' }}>
                  Visit ID: {visitId}
                </div>
              </div>
            )}

            {/* Patient Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px', fontSize: '1rem' }}>
                  الاسم الكامل * / Full Name *
                </label>
                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="الاسم الثلاثي / Your full name"
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: errors.fullName ? '2px solid #df4759' : '1px solid var(--border)',
                    fontSize: '1.1rem'
                  }}
                />
                {errors.fullName && <div style={{ color: '#df4759', fontSize: '0.85rem', marginTop: '4px' }}>{errors.fullName}</div>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px', fontSize: '1rem' }}>
                    العمر * / Age *
                  </label>
                  <input
                    required
                    type="number"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    placeholder="العمر / Age"
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '12px',
                      border: errors.age ? '2px solid #df4759' : '1px solid var(--border)',
                      fontSize: '1.1rem'
                    }}
                  />
                  {errors.age && <div style={{ color: '#df4759', fontSize: '0.85rem', marginTop: '4px' }}>{errors.age}</div>}
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px', fontSize: '1rem' }}>
                    رقم الموبايل * / Mobile *
                  </label>
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="01xxxxxxxxx / Mobile number"
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '12px',
                      border: errors.phone ? '2px solid #df4759' : '1px solid var(--border)',
                      fontSize: '1.1rem'
                    }}
                  />
                  {errors.phone && <div style={{ color: '#df4759', fontSize: '0.85rem', marginTop: '4px' }}>{errors.phone}</div>}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px', fontSize: '1rem' }}>
                  البريد الإلكتروني / Email (اختياري / Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: errors.email ? '2px solid #df4759' : '1px solid var(--border)',
                    fontSize: '1.1rem'
                  }}
                />
                {errors.email && <div style={{ color: '#df4759', fontSize: '0.85rem', marginTop: '4px' }}>{errors.email}</div>}
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px', fontSize: '1rem' }}>
                  منطقة السكن / District
                </label>
                <input
                  type="text"
                  value={district}
                  onChange={e => setDistrict(e.target.value)}
                  placeholder="العنوان / Address"
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: errors.districtId ? '2px solid #df4759' : '1px solid var(--border)',
                    fontSize: '1.1rem'
                  }}
                />
                {errors.districtId && <div style={{ color: '#df4759', fontSize: '0.85rem', marginTop: '4px' }}>{errors.districtId}</div>}
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px', fontSize: '1rem' }}>
                  الشكوى الرئيسية / Chief Complaint *
                </label>
                <textarea
                  required
                  rows={3}
                  value={chiefComplaint}
                  onChange={e => setChiefComplaint(e.target.value)}
                  placeholder="ما هي مشكلتك الرئيسية؟ / What is your main complaint?"
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
                  <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px', fontSize: '1rem' }}>
                    الأعراض / Symptoms
                  </label>
                  <textarea
                    rows={3}
                    value={symptoms}
                    onChange={e => setSymptoms(e.target.value)}
                    placeholder="صف الأعراض / Describe symptoms"
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
                <div>
                  <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px', fontSize: '1rem' }}>
                    الأدوية الحالية / Current Medications
                  </label>
                  <textarea
                    rows={3}
                    value={medications}
                    onChange={e => setMedications(e.target.value)}
                    placeholder="ما هي الأدوية التي تتناولها حالياً؟ / What medications are you currently taking?"
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

              <div>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px', fontSize: '1rem' }}>
                  الحساسية / Allergies
                </label>
                <textarea
                  rows={2}
                  value={allergies}
                  onChange={e => setAllergies(e.target.value)}
                  placeholder="هل لديك أي حساسية؟ / Do you have any allergies?"
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

              <div className="card" style={{ background: isEmergency ? '#fee2e2' : '#f8f9fa', border: isEmergency ? '2px solid #dc3545' : '1px solid var(--border)', padding: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontWeight: 800, color: '#dc3545' }}>
                  <input type="checkbox" checked={isEmergency} onChange={() => setIsEmergency(!isEmergency)} style={{ width: '24px', height: '24px' }} />
                  حالة طارئة / Emergency Case?
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  padding: '1.2rem',
                  fontSize: '1.2rem',
                  borderRadius: '16px',
                  marginTop: '1rem',
                  width: '100%',
                  fontWeight: 800
                }}
              >
                {loading ? 'جاري الإرسال... / Sending...' : 'إرسال البيانات / Submit Data'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
