"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, UserPlus, FileBarChart, Settings, UserCheck } from 'lucide-react';

import { useAuth } from '@/modules/auth/AuthContext';

export const Sidebar = () => {
  const pathname = usePathname();
  const { role } = useAuth();
  const isDoc = role === 'doctor';

  const allNavItems = [
    { label: isDoc ? 'Clinical Brain (Library)' : 'المكتبة السريرية', href: '/', icon: <Settings size={20} />, roles: ['doctor'] },
    { label: isDoc ? 'Staff approvals' : 'موافقة الموظفين', href: '/approvals', icon: <UserCheck size={20} />, roles: ['doctor'] },
    { label: isDoc ? 'Live Queue' : 'قائمة المرضى (Queue)', href: '/queue', icon: <Users size={20} />, roles: ['doctor', 'assistant'] },
    { label: isDoc ? 'Clinical Workspace' : 'العيادة (Clinical)', href: '/clinical', icon: <UserPlus size={20} />, roles: ['doctor'] },
    { label: isDoc ? 'Performance & Analytics' : 'لأداء والتحليلات', href: '/analytics', icon: <FileBarChart size={20} />, roles: ['doctor', 'marketing'] },
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(role || ''));

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="brand-title">
          {isDoc ? 'Dr. Amjad\nClinic-OS' : 'عيادة\nد. أمجد خيري كامل'}
        </h2>
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
        v1.0.0 Clinic-OS
      </div>
    </aside>
  );
};
