"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users, UserPlus, FileBarChart, Settings,
  UserCheck, MapPin, Briefcase, Wallet, Search as UserSearch, Share2,
  Flag, AlertTriangle, CheckCircle
} from 'lucide-react';

import { useAuth } from '@/modules/auth/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { usePresence } from '@/hooks/usePresence';

export const Sidebar = () => {
  const pathname = usePathname();
  const { role, activeClinicId, user } = useAuth();
  const [activeClinicName, setActiveClinicName] = React.useState<string | null>(null);
  const isDoc = role === 'doctor';
  const supabase = React.useMemo(() => createClient(), []);

  // Poke-yoke presence tracking
  const { syncStatus } = usePresence();

  React.useEffect(() => {
    const fetchClinic = async () => {
      if (!activeClinicId) return;
      const { data } = await supabase.from('clinics').select('name_ar').eq('id', activeClinicId).single();
      if (data) setActiveClinicName(data.name_ar);
    };
    fetchClinic();
  }, [activeClinicId, supabase]);

  // Determine poke-yoke display state
  // Show indicator when there are other users present (at same or different clinic)
  const hasOtherUsers = syncStatus.sameClinicUsers.length > 0 || syncStatus.otherClinicUsers.length > 0;
  const showPokeYoke = hasOtherUsers && activeClinicId;

  // Determine indicator type: green if all at same clinic, yellow if anyone at different clinic
  const allAtSameClinic = syncStatus.otherClinicUsers.length === 0;

  // Get other users' names for tooltip
  const sameClinicNames = syncStatus.sameClinicUsers.map(u => u.user_name || 'Unknown').join(', ');
  const otherClinicNames = syncStatus.otherClinicUsers.map(u => `${u.user_name || 'Unknown'} (different clinic)`).join(', ');

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
          <div
            style={{
              marginTop: '1rem',
              padding: '8px 12px',
              background: showPokeYoke && !allAtSameClinic ? '#fff3cd' : 'var(--bg-color)',
              color: showPokeYoke && !allAtSameClinic ? '#856404' : 'var(--primary)',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: showPokeYoke && !allAtSameClinic ? '2px solid #ffc107' : 'none',
              transition: 'all 0.3s ease'
            }}
            title={showPokeYoke ?
              (allAtSameClinic
                ? `Same clinic: ${sameClinicNames}`
                : `WARNING: Different clinics! ${otherClinicNames}`)
              : ''
            }
          >
             <MapPin size={16} /> {activeClinicName}

             {/* Poke-yoke indicator - show when other users are present */}
             {showPokeYoke && (
               <div style={{
                 marginLeft: 'auto',
                 display: 'flex',
                 alignItems: 'center',
                 gap: '4px'
               }}>
                 {allAtSameClinic ? (
                   // Green flag - everyone at same clinic
                   <div style={{
                     display: 'flex',
                     alignItems: 'center',
                     gap: '4px',
                     padding: '2px 8px',
                     background: '#28a745',
                     color: 'white',
                     borderRadius: '12px',
                     fontSize: '0.75rem'
                   }}>
                     <CheckCircle size={14} />
                     <span>Synced</span>
                   </div>
                 ) : (
                   // Yellow warning - someone at different clinic
                   <div style={{
                     display: 'flex',
                     alignItems: 'center',
                     gap: '4px',
                     padding: '2px 8px',
                     background: '#ffc107',
                     color: '#856404',
                     borderRadius: '12px',
                     fontSize: '0.75rem',
                     animation: 'pulse 1.5s infinite'
                   }}>
                     <AlertTriangle size={14} />
                     <span>Mismatch!</span>
                   </div>
                 )}
               </div>
             )}
          </div>
        )}

        {/* Show who's online when there are other users at same clinic */}
        {showPokeYoke && syncStatus.sameClinicUsers.length > 0 && (
          <div style={{
            marginTop: '0.5rem',
            padding: '6px 10px',
            background: '#e8f5e9',
            borderRadius: '6px',
            fontSize: '0.75rem',
            color: '#2e7d32'
          }}>
            <strong>Online:</strong> {sameClinicNames}
          </div>
        )}

        {/* Warning about different clinics */}
        {showPokeYoke && !allAtSameClinic && (
          <div style={{
            marginTop: '0.5rem',
            padding: '8px 10px',
            background: '#fff3cd',
            borderRadius: '6px',
            fontSize: '0.75rem',
            color: '#856404',
            border: '1px solid #ffc107'
          }}>
            <AlertTriangle size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            Staff at different clinic! Verify before proceeding.
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
