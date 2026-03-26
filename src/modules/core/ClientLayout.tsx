"use client";

import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/modules/auth/AuthContext';
import { Sidebar } from './Sidebar';
import { usePathname } from 'next/navigation';
import { LogOut, AlertCircle, RefreshCw, WifiOff } from 'lucide-react';

import { LoginScreen } from '@/modules/auth/LoginScreen';
import { SetupSupabase } from '@/modules/auth/SetupSupabase';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import ClinicSelectorOverlay from '@/modules/admin-clinics/ClinicSelectorOverlay';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { user, role, approvalStatus, logout, language, loading, error, retryInit } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [maxLoadingExceeded, setMaxLoadingExceeded] = useState(false);
  const pathname = usePathname();
  const isOnline = useNetworkStatus();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Max loading safeguard (15 seconds)
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setMaxLoadingExceeded(true);
      }, 15000);
      return () => clearTimeout(timer);
    } else {
      setMaxLoadingExceeded(false);
    }
  }, [loading]);

  // Show error state with retry option
  if ((error && !loading) || (maxLoadingExceeded && loading)) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div className="card" style={{ maxWidth: 480, textAlign: 'center' }}>
          <AlertCircle size={48} style={{ color: '#df4759', marginBottom: '1rem' }} />
          <h2 style={{ color: '#df4759', marginTop: 0 }}>
            {maxLoadingExceeded ? 'Loading taking too long?' : 'Connection Error'}
          </h2>
          <p style={{ color: 'var(--text-medium)' }}>
            {error || 'Unable to connect to the server. Please check your network and try again.'}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-primary" onClick={retryInit} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={18} /> Retry
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => logout()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LogOut size={18} /> Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

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
      {/* Offline Banner */}
      {!isOnline && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: '#df4759',
          color: 'white',
          padding: '10px 16px',
          textAlign: 'center',
          zIndex: 9999,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <WifiOff size={18} />
          You are offline. Some features may not be available.
        </div>
      )}
      <Sidebar />
      <div className="main-wrapper">
        <header className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', background: 'white', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
             <h1 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--primary)' }}>Dr. Amgad Khairy Kamel Clinics</h1>
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
