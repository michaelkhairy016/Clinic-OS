"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
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
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<'en' | 'ar'>('ar');

  const refreshProfile = useCallback(async (sessionUser: User | null) => {
    if (!sessionUser) {
      setUser(null);
      setRole(null);
      setApprovalStatus(null);
      return;
    }
    setUser(sessionUser);
    const supabase = createClient();
    const { data } = await supabase
      .from('profiles')
      .select('role, approval_status')
      .eq('id', sessionUser.id)
      .maybeSingle();
    if (!data) {
      setRole(null);
      setApprovalStatus(null);
      return;
    }
    setRole((data.role as UserRole) ?? null);
    const raw = data.approval_status as string | undefined;
    setApprovalStatus(raw === 'pending' ? 'pending' : 'approved');
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    let cancelled = false;

    const init = async () => {
      try {
        const {
          data: { user: u },
        } = await supabase.auth.getUser();
        if (!cancelled) await refreshProfile(u);
      } catch (err) {
        console.error('Auth initialization failed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        await refreshProfile(session?.user ?? null);
      } catch (err) {
        console.error('Profile refresh failed:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [refreshProfile]);

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
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setApprovalStatus(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, role, approvalStatus, login, signup, logout, loading, language }}
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
