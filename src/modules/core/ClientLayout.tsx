"use client";

import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/modules/auth/AuthContext';
import { Sidebar } from '@/modules/core/Sidebar';
import { LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { LoginScreen } from '@/modules/auth/LoginScreen';
import { SetupSupabase } from '@/modules/auth/SetupSupabase';
import { isSupabaseConfigured } from '@/lib/supabase/client';

const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { user, role, approvalStatus, logout, language, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div style={{ minHeight: '100vh', background: 'var(--bg-color)' }} />;

  if (!isSupabaseConfigured()) {
    return <SetupSupabase />;
  }

  const isPublicPath =
    pathname.startsWith('/patient/form') || pathname.startsWith('/auth/signup');

  if (isPublicPath) {
    return <main>{children}</main>;
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', background: 'var(--bg-color)' }} />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (!role) {
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
        <div className="card" style={{ maxWidth: 480, textAlign: 'center' }}>
          <h2 style={{ color: 'var(--primary)', marginTop: 0 }}>Account not linked</h2>
          <p style={{ color: 'var(--text-medium)' }}>
            No clinic profile was found. If you just signed up as staff, wait for a doctor to approve your account, or
            contact the clinic.
          </p>
          <button type="button" className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => logout()}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (approvalStatus === 'pending') {
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
        <div className="card" style={{ maxWidth: 520, textAlign: 'center' }}>
          <h2 style={{ color: 'var(--primary)', marginTop: 0 }}>بانتظار الموافقة</h2>
          <p style={{ color: 'var(--text-medium)', lineHeight: 1.7 }}>
            تم إنشاء حسابك كـ <strong>{role === 'marketing' ? 'تسويق' : 'مساعد'}</strong>. سيقوم الطبيب بمراجعة طلبك
            وتفعيل الدخول قريباً.
          </p>
          <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
            Awaiting approval. Your doctor will activate your access soon.
          </p>
          <button type="button" className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => logout()}>
            تسجيل الخروج / Sign out
          </button>
        </div>
      </div>
    );
  }

  const isRTL = language === 'ar';

  return (
    <div className={`app-container ${isRTL ? 'dir-rtl' : 'dir-ltr'}`}>
      <Sidebar />
      <div className="main-wrapper">
        <header className="top-header">
          <h1 className="page-title">
            {role === 'doctor' ? 'Clinic-OS Psychiatry EMR' : 'عيادة د. أمجد خيري كامل'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span className="badge badge-active">{role === 'doctor' ? 'Online' : 'متصل'}</span>
            <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
              {role === 'doctor'
                ? 'Dr. Amjad'
                : role === 'assistant'
                  ? 'مساعد التمريض'
                  : 'التسويق'}
            </span>
            <button type="button" className="btn btn-ghost" onClick={() => logout()} style={{ padding: '8px' }}>
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
};

export const ClientLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
};
