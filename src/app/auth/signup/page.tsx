"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/modules/auth/AuthContext';
import { UserPlus } from 'lucide-react';

export default function StaffSignupPage() {
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [requestedRole, setRequestedRole] = useState<'assistant' | 'marketing'>('assistant');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }
    setBusy(true);
    try {
      const result = await signup(email.trim(), password, fullName.trim(), requestedRole);
      if (result.error) {
        setError(result.error);
        return;
      }
      setDone(true);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-color)',
          padding: '2rem',
        }}
        dir="rtl"
      >
        <div className="card" style={{ maxWidth: 480, textAlign: 'center' }}>
          <h2 style={{ color: 'var(--primary)', marginTop: 0 }}>تم إرسال الطلب</h2>
          <p style={{ color: 'var(--text-medium)', lineHeight: 1.7 }}>
            تم إنشاء الحساب. انتظر موافقة الطبيب ثم سجّل الدخول من صفحة تسجيل الدخول.
          </p>
          <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
            Wait for the doctor to approve your account, then sign in.
          </p>
          <Link href="/" className="btn btn-primary" style={{ display: 'inline-block', marginTop: '1.5rem' }}>
            إلى تسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-color)',
        padding: '2rem',
      }}
      dir="rtl"
    >
      <div className="card" style={{ maxWidth: '440px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              background: 'var(--primary)',
              color: 'white',
              padding: '1rem',
              borderRadius: '50%',
              display: 'inline-block',
            }}
          >
            <UserPlus size={28} />
          </div>
          <h2 style={{ color: 'var(--primary)', marginBottom: '0.25rem' }}>تسجيل موظف جديد</h2>
          <p style={{ color: 'var(--text-medium)', margin: 0, fontSize: '0.95rem' }}>
            مساعد أو تسويق — يتطلب موافقة الطبيب
          </p>
          <p style={{ color: 'var(--text-light)', margin: '0.5rem 0 0', fontSize: '0.85rem' }}>
            Staff signup (assistant / marketing) — doctor approval required
          </p>
        </div>

        {error && (
          <p style={{ color: '#df4759', fontWeight: 600, marginBottom: '1rem' }} role="alert">
            {error}
          </p>
        )}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <span style={{ display: 'block', marginBottom: 8, fontWeight: 700 }}>نوع الحساب</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`btn ${requestedRole === 'assistant' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setRequestedRole('assistant')}
              >
                مساعد / Assistant
              </button>
              <button
                type="button"
                className={`btn ${requestedRole === 'marketing' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setRequestedRole('marketing')}
              >
                تسويق / Marketing
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>الاسم الكامل</label>
            <input
              type="text"
              required
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="مثال: أحمد محمد"
              style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '1rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>البريد الإلكتروني</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '1rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>كلمة المرور</label>
            <input
              type="password"
              required
              autoComplete="new-password"
              minLength={4}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '1rem' }}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '12px', marginTop: 8 }} disabled={busy}>
            {busy ? '…' : 'إنشاء الحساب'}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-light)' }}>
          <Link href="/" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            لديك حساب؟ تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
