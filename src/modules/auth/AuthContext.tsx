"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ApprovalStatus, UserRole } from '@/types/database';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  approval_status: ApprovalStatus;
}

type Role = UserRole | null;

interface AuthState {
  user: AdminUser | null;
  role: Role;
  approvalStatus: ApprovalStatus | null;
  login: (
    email: string,
    password: string
  ) => Promise<{ error?: string; role?: Role; approvalStatus?: ApprovalStatus }>;
  signup: (
    email: string,
    password: string,
    fullName: string,
    requestedRole: 'assistant' | 'marketing'
  ) => Promise<{ error?: string }>;
  logout: () => void;
  loading: boolean;
  language: 'en' | 'ar';
  activeClinicId: string | null;
  setActiveClinicId: (id: string | null) => void;
  error: string | null;
  retryInit: () => void;
}

const STORAGE_KEY = 'clinic_os_admin';

function readSessionFromStorage(): AdminUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<'en' | 'ar'>('ar');
  const [activeClinicId, setActiveClinicIdState] = useState<string | null>(null);
  const [error] = useState<string | null>(null);

  // Derived from user — no separate state needed
  const role: Role = user?.role ?? null;
  const approvalStatus: ApprovalStatus | null = user?.approval_status ?? null;

  useEffect(() => {
    const saved = sessionStorage.getItem('clinic_os_active_clinic');
    if (saved) setActiveClinicIdState(saved);
  }, []);

  const setActiveClinicId = (id: string | null) => {
    setActiveClinicIdState(id);
    if (id) sessionStorage.setItem('clinic_os_active_clinic', id);
    else sessionStorage.removeItem('clinic_os_active_clinic');
  };

  // Initialize from localStorage — synchronous, instant, no async init
  useEffect(() => {
    const stored = readSessionFromStorage();
    setUser(stored);
    setLoading(false);
  }, []);

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
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Login failed' };
      const admin = data.admin as AdminUser;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(admin));
      setUser(admin);
      return { role: admin.role, approvalStatus: admin.approval_status };
    } catch {
      return { error: 'Network error. Please try again.' };
    }
  };

  const signup = async (
    email: string,
    password: string,
    fullName: string,
    requestedRole: 'assistant' | 'marketing'
  ) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName, role: requestedRole }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Signup failed' };
      return {};
    } catch {
      return { error: 'Network error. Please try again.' };
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem('clinic_os_active_clinic');
    setUser(null);
    setActiveClinicIdState(null);
  };

  const retryInit = useCallback(() => {
    const stored = readSessionFromStorage();
    setUser(stored);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user, role, approvalStatus, login, signup, logout,
        loading, language, activeClinicId, setActiveClinicId,
        error, retryInit,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
