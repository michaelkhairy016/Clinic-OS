"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthContext';
import { Lock, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export const LoginScreen = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured()) return;
    setBusy(true);
    try {
      const result = await login(email.trim(), password);
      if (result.error) {
        alert(result.error);
        return;
      }
      if (result.approvalStatus === 'pending') {
        router.replace('/');
        return;
      }
      const r = result.role;
      if (r === 'assistant') router.push('/queue');
      else if (r === 'marketing') router.push('/analytics');
      else router.push('/');
    } finally {
      setBusy(false);
    }
  };

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
    >
      <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <div
          style={{
            background: 'var(--primary)',
            color: 'white',
            padding: '1rem',
            borderRadius: '50%',
            display: 'inline-block',
            marginBottom: '1rem',
          }}
        >
          <Lock size={32} />
        </div>
        <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>تسجيل الدخول (Sign In)</h2>
        <p style={{ color: 'var(--text-medium)', marginBottom: '2rem' }}>مرحباً بك في Clinic-OS</p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ position: 'relative', textAlign: 'right' }}>
            <User
              size={18}
              style={{ position: 'absolute', right: '12px', top: '12px', color: 'var(--text-light)' }}
            />
            <input
              type="email"
              autoComplete="email"
              placeholder="البريد الإلكتروني (Email)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 10px 10px 40px',
                paddingRight: '40px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Lock
              size={18}
              style={{ position: 'absolute', right: '12px', top: '12px', color: 'var(--text-light)' }}
            />
            <input
              type="password"
              placeholder="كلمة المرور (Password)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 10px 10px 40px',
                paddingRight: '40px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={busy}>
            {busy ? '…' : 'تسجيل الدخول (Login)'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
          <Link href="/auth/signup" style={{ color: 'var(--primary)', fontWeight: 700 }}>
            New assistant or marketer? Request access
          </Link>
          <span style={{ color: 'var(--text-light)', display: 'block', marginTop: '0.75rem', fontSize: '0.85rem' }}>
            Doctor accounts are created by the clinic (Supabase Dashboard); staff sign up here and wait for approval.
          </span>
        </div>
      </div>
    </div>
  );
};
