"use client";

import React, { useState } from 'react';

export default function PatientIntakeForm() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [history, setHistory] = useState('');
  const [referral, setReferral] = useState('');

  const t = {
    title: lang === 'ar' ? 'استمارة بيانات المريض' : 'Patient Intake Form',
    subtitle:
      lang === 'ar'
        ? 'يرجى ملء البيانات التالية قبل الدخول للعيادة'
        : 'Please fill out your information before entering the clinic',
    fullName: lang === 'ar' ? 'الاسم الثلاثي' : 'Full Name',
    age: lang === 'ar' ? 'العمر' : 'Age',
    phone: lang === 'ar' ? 'رقم الهاتف' : 'Phone Number',
    history: lang === 'ar' ? 'هل تعاني من أي أمراض مزمنة؟' : 'Do you have any chronic diseases?',
    submit: lang === 'ar' ? 'إرسال البيانات' : 'Submit Information',
    success:
      lang === 'ar'
        ? 'تم تسجيل البيانات بنجاح! يرجى الانتظار حتى يتم النداء باسمك.'
        : 'Information submitted successfully! Please wait until your name is called.',
    switchLang: lang === 'ar' ? 'English' : 'عربي',
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          age: age === '' ? undefined : Number(age),
          phone,
          history,
          referralSource: referral || undefined,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? (lang === 'ar' ? 'تعذر الإرسال' : 'Could not submit'));
        return;
      }
      setSubmitted(true);
    } catch {
      setError(lang === 'ar' ? 'خطأ في الشبكة' : 'Network error');
    } finally {
      setBusy(false);
    }
  };

  if (submitted) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-color)',
        }}
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>{t.success}</h2>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ minHeight: '100vh', background: 'var(--bg-color)', padding: '2rem 1rem' }}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button
            type="button"
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            style={{
              background: 'white',
              border: '1px solid var(--border)',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            {t.switchLang}
          </button>
        </div>

        <div className="card">
          <h2 style={{ color: 'var(--primary)', marginTop: 0 }}>{t.title}</h2>
          <p style={{ color: 'var(--text-medium)', marginBottom: '2rem' }}>{t.subtitle}</p>

          {error && (
            <p style={{ color: '#df4759', marginBottom: '1rem', fontWeight: 600 }} role="alert">
              {error}
            </p>
          )}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>{t.fullName} *</label>
              <input
                required
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>{t.age} *</label>
                <input
                  required
                  type="number"
                  min={0}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>{t.phone} *</label>
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>{t.history}</label>
              <textarea
                rows={4}
                value={history}
                onChange={(e) => setHistory(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem', fontFamily: 'inherit' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                {lang === 'ar' ? 'كيف سمعت عنا؟ (اختياري)' : 'How did you hear about us? (Optional)'}
              </label>
              <select
                value={referral}
                onChange={(e) => setReferral(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  background: 'white',
                }}
              >
                <option value="">{lang === 'ar' ? '-- اختر من القائمة --' : '-- Select an option --'}</option>
                <option value="facebook">{lang === 'ar' ? 'فيسبوك' : 'Facebook'}</option>
                <option value="google">{lang === 'ar' ? 'بحث جوجل' : 'Google Search'}</option>
                <option value="vezeeta">{lang === 'ar' ? 'فيزيتا' : 'Vezeeta'}</option>
                <option value="friend">{lang === 'ar' ? 'صديق / معارف' : 'Friend / Family'}</option>
                <option value="other">{lang === 'ar' ? 'أخرى' : 'Other'}</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '1rem', fontSize: '1.1rem', marginTop: '1rem' }} disabled={busy}>
              {busy ? '…' : t.submit}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
