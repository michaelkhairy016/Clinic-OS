"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient, isSupabaseConfigured, clearAllSupabaseData } from '@/lib/supabase/client';
import type { ApprovalStatus, UserRole } from '@/types/database';

type Role = UserRole | null;

interface AuthState {
  user: User | null;
  role: Role;
  approvalStatus: ApprovalStatus | null;
  login: (
    email: string,
    password: string
  ) => Promise<{ error?: string; role?: Role; approvalStatus?: ApprovalStatus }>;
  signup: (
    email: string,
    password: string,
    requestedRole: 'assistant' | 'marketing'
  ) => Promise<{ error?: string; needsEmailConfirm?: boolean }>;
  logout: () => Promise<void>;
  loading: boolean;
  language: 'en' | 'ar';
  activeClinicId: string | null;
  setActiveClinicId: (id: string | null) => void;
  error: string | null;
  retryInit: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<'en' | 'ar'>('ar');
  const [activeClinicId, setActiveClinicIdState] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Initialize activeClinicId from sessionStorage (session-only, cleared on tab close)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('clinic_os_active_clinic');
      if (saved) setActiveClinicIdState(saved);
    }
  }, []);

  const setActiveClinicId = (id: string | null) => {
    setActiveClinicIdState(id);
    if (typeof window !== 'undefined') {
      if (id) sessionStorage.setItem('clinic_os_active_clinic', id);
      else sessionStorage.removeItem('clinic_os_active_clinic');
    }
  };

  // Fetch profile with retry logic
  const fetchProfileWithRetry = useCallback(async (userId: string): Promise<{ role: string | null; approval_status: string | null } | null> => {
    const supabase = createClient();
    let retries = 3;
    let lastError = null;

    while (retries > 0) {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, approval_status')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        lastError = error;
        retries--;
        if (retries > 0) {
          await new Promise(r => setTimeout(r, 1000));
        }
      } else {
        return data;
      }
    }

    console.error('Profile fetch failed after retries:', lastError);
    return null;
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    let cancelled = false;
    let initCompleted = false;

    // Shorter timeout (5 seconds) with auto-clear
    const timeoutId = setTimeout(() => {
      if (!cancelled && !initCompleted) {
        console.warn('Auth initialization timed out - clearing all data');
        // Auto-clear storage on timeout
        clearAllSupabaseData();
        setError('Connection timeout. Please refresh or clear cookies.');
        setLoading(false);
      }
    }, 5000);

    const init = async () => {
      try {
        setError(null);

        const {
          data: { user: u },
          error: userError,
        } = await supabase.auth.getUser();

        // If there's an auth error, clear cookies and reset
        if (userError) {
          console.warn('Auth error, clearing session:', userError.message);
          clearAllSupabaseData();
          if (!cancelled) {
            setUser(null);
            setRole(null);
            setApprovalStatus(null);
          }
          return;
        }

        if (cancelled) return;

        if (u) {
          setUser(u);
          const profileData = await fetchProfileWithRetry(u.id);

          if (cancelled) return;

          if (profileData) {
            setRole((profileData.role as UserRole) ?? null);
            const raw = profileData.approval_status as string | undefined;
            setApprovalStatus(raw === 'pending' ? 'pending' : 'approved');
          } else {
            setRole(null);
            setApprovalStatus(null);
          }
        }
      } catch (err) {
        console.error('Auth initialization failed:', err);
        if (!cancelled) {
          // Clear storage on error
          clearAllSupabaseData();
          setError('Authentication error. Please refresh the page.');
        }
      } finally {
        initCompleted = true;
        clearTimeout(timeoutId);
        if (!cancelled) setLoading(false);
      }
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Only handle specific events
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setUser(session.user);
          const profileData = await fetchProfileWithRetry(session.user.id);
          if (profileData) {
            setRole((profileData.role as UserRole) ?? null);
            const raw = profileData.approval_status as string | undefined;
            setApprovalStatus(raw === 'pending' ? 'pending' : 'approved');
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setRole(null);
        setApprovalStatus(null);
        setActiveClinicIdState(null);
        setError(null);
        // Clear session storage on sign out
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('clinic_os_active_clinic');
        }
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [retryCount, fetchProfileWithRetry]);

  useEffect(() => {
    if (role === 'doctor') {
      setLanguage('en');
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
    } else {
      setLanguage('ar');
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
    }
  }, [role]);

  const login = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return { error: 'Supabase is not configured' };
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    if (!u) return { error: 'No user returned' };
    const { data } = await supabase.from('profiles').select('role, approval_status').eq('id', u.id).maybeSingle();
    if (!data) {
      setUser(u);
      setRole(null);
      setApprovalStatus(null);
      return { error: 'No profile row for this user' };
    }
    const r = (data.role as UserRole) ?? null;
    setUser(u);
    setRole(r);
    const ap = data.approval_status as string | undefined;
    const approval: ApprovalStatus = ap === 'pending' ? 'pending' : 'approved';
    setApprovalStatus(approval);
    return { role: r, approvalStatus: approval };
  };

  const signup = async (email: string, password: string, requestedRole: 'assistant' | 'marketing') => {
    if (!isSupabaseConfigured()) {
      return { error: 'Supabase is not configured' };
    }
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          signup_source: 'clinic_staff',
          requested_role: requestedRole,
        },
      },
    });
    if (error) return { error: error.message };
    const needsEmailConfirm = !data.session;
    return { needsEmailConfirm };
  };

  const logout = async () => {
    // Clear local state immediately
    setUser(null);
    setRole(null);
    setApprovalStatus(null);
    setError(null);
    setActiveClinicIdState(null);
    setLoading(true); // Prevent flash of content

    if (typeof window !== 'undefined') {
      try {
        // 1. Call server-side logout first (wait for it)
        await fetch('/auth/logout', { method: 'POST' });

        // 2. Try client-side signout
        if (isSupabaseConfigured()) {
          const supabase = createClient();
          await supabase.auth.signOut().catch(() => {});
        }

        // 3. Clear ALL storage (localStorage, sessionStorage, IndexedDB, cookies)
        await clearAllSupabaseData();

        // 4. Clear service workers
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(reg => reg.unregister()));
        }

        // 5. Clear caches
        if ('caches' in window) {
          const names = await caches.keys();
          await Promise.all(names.map(name => caches.delete(name)));
        }

        // 6. Full page reload to clear any in-memory state
        window.location.href = '/';
      } catch (error) {
        console.error('Logout error:', error);
        // Even on error, clear everything and redirect
        await clearAllSupabaseData();
        window.location.href = '/';
      }
    }
  };

  const retryInit = useCallback(() => {
    setError(null);
    setLoading(true);
    setRetryCount(c => c + 1);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user, role, approvalStatus, login, signup, logout,
        loading, language, activeClinicId, setActiveClinicId,
        error, retryInit
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
