"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users, UserPlus, FileBarChart, Settings,
  UserCheck, MapPin, Briefcase, Wallet, Search as UserSearch, Share2
} from 'lucide-react';

import { useAuth } from '@/modules/auth/AuthContext';
import { createClient } from '@/lib/supabase/client';

export const Sidebar = () => {
  const pathname = usePathname();
  const { role, activeClinicId } = useAuth();
  const [activeClinicName, setActiveClinicName] = React.useState<string | null>(null);
  const isDoc = role === 'doctor';
  const supabase = React.useMemo(() => createClient(), []);

  React.useEffect(() => {
    const fetchClinic = async () => {
      if (!activeClinicId) return;
      const { data } = await supabase.from('clinics').select('name_ar').eq('id', activeClinicId).single();
      if (data) setActiveClinicName(data.name_ar);
    };
    fetchClinic();
  }, [activeClinicId, supabase]);

  const allNavItems = [
    { label: isDoc ? 'Clinical Brain (Libr.)' : 'المكتبة السريرية', href: '/', icon: <Settings size={20} />, roles: ['doctor'] },
    { label: isDoc ? 'Live Queue' : 'قائمة الانتظار', href: '/queue', icon: <Users size={20} />, roles: ['doctor', 'assistant'] },
    { label: isDoc ? 'Patient Archive' : 'أرشيف المرضى', href: '/records', icon: <UserSearch size={20} />, roles: ['doctor', 'assistant'] },
    { label: isDoc ? 'MR Visits' : 'زيارات المندوبين', href: '/mr/visits', icon: <Briefcase size={20} />, roles: ['doctor'] },
    { label: isDoc ? 'Financial Vault' : 'الخزينة والمالية', href: '/finance', icon: <Wallet size={20} />, roles: ['doctor'] },
    { label: isDoc ? 'Clinics & Prices' : 'العيادات والأسعار', href: '/clinics', icon: <MapPin size={20} />, roles: ['doctor'] },
    { label: isDoc ? 'App Configuration' : 'إعدادات النظام', href: '/settings', icon: <Settings size={20} />, roles: ['doctor'] },
    { label: isDoc ? 'Staff approvals' : 'موافقة الموظفين', href: '/approvals', icon: <UserCheck size={20} />, roles: ['doctor'] },
    { label: isDoc ? 'Clinical Workspace' : 'العيادة (Clinical)', href: '/clinical', icon: <UserPlus size={20} />, roles: ['doctor'] },
    { label: isDoc ? 'Performance & Analytics' : 'لأداء والتحليلات', href: '/analytics', icon: <FileBarChart size={20} />, roles: ['doctor', 'marketing'] },
    { label: isDoc ? 'Marketing Dashboard' : 'لوحة التسويق', href: '/marketing', icon: <Share2 size={20} />, roles: ['doctor', 'marketing'] },
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(role || ''));

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="brand-title">
          {isDoc ? 'Dr. Amgad\nClinic-OS' : 'عيادة\nد. أمجد خيري كامل'}
        </h2>
        {activeClinicName && (
          <div style={{ marginTop: '1rem', padding: '8px 12px', background: 'var(--bg-color)', color: 'var(--primary)', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
             <MapPin size={16} /> {activeClinicName}
          </div>
        )}
      </div>
      <nav className="nav-menu">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', color: 'var(--text-light)', fontSize: '0.85rem', textAlign: 'center' }}>
        v1.1.0 Clinic-OS
      </div>
    </aside>
  );
};
