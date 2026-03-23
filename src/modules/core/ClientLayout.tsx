"use client";

import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/modules/auth/AuthContext';
import { Sidebar } from './Sidebar';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';

import { LoginScreen } from '@/modules/auth/LoginScreen';
import { SetupSupabase } from '@/modules/auth/SetupSupabase';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import ClinicSelectorOverlay from '@/modules/admin-clinics/ClinicSelectorOverlay';

const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { user, role, approvalStatus, logout, language, loading, activeClinicId } = useAuth();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--primary)',
        fontWeight: 'bold',
        fontSize: '1.1rem'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #fff', borderTop: '4px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <span>جاري التحميل... (Loading Clinic-OS by Amgad)</span>
        </div>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (!isSupabaseConfigured()) {
    return <SetupSupabase />;
  }

  const isPublicPath = pathname.startsWith('/patient/form') || pathname.startsWith('/auth/signup');

  if (isPublicPath) {
    return <main>{children}</main>;
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (!role) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', padding: '2rem' }}>
        <div className="card" style={{ maxWidth: 480, textAlign: 'center' }}>
          <h2 style={{ color: 'var(--primary)', marginTop: 0 }}>Account not linked</h2>
          <p style={{ color: 'var(--text-medium)' }}>No clinic profile was found. Please contact Dr. Amgad to approve your access.</p>
          <button type="button" className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => logout()}>Sign out</button>
        </div>
      </div>
    );
  }

  if (approvalStatus === 'pending') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', padding: '2rem' }} dir="rtl">
        <div className="card" style={{ maxWidth: 520, textAlign: 'center' }}>
          <h2 style={{ color: 'var(--primary)', marginTop: 0 }}>بانتظار الموافقة</h2>
          <p style={{ color: 'var(--text-medium)', lineHeight: 1.7 }}>
            تم إنشاء حسابك كـ <strong>{role === 'marketing' ? 'تسويق' : 'مساعد'}</strong>. سيقوم د. أمجد بمراجعة طلبك وتفعيل الدخول قريباً.
          </p>
          <button type="button" className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => logout()}>تسجيل الخروج / Sign out</button>
        </div>
      </div>
    );
  }

  const isRTL = language === 'ar';

  return (
    <div className={`app-container ${isRTL ? 'dir-rtl' : 'dir-ltr'}`}>
      <Sidebar />
      <div className="main-wrapper">
        <header className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', background: 'white', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
             <h1 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--primary)' }}>Psychiatry EMR - Dr. Amgad</h1>
             <span className="badge badge-active">{role === 'doctor' ? 'Online' : 'Assistant'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button type="button" className="btn btn-ghost" onClick={() => logout()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LogOut size={18} /> {isRTL ? 'خروج' : 'Logout'}
            </button>
          </div>
        </header>
        <main className="main-content" style={{ padding: '2rem' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>
      <ClinicSelectorOverlay />
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
