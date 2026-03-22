"use client";

import React from 'react';

export function SetupSupabase() {
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
      <div className="card" style={{ maxWidth: 520 }}>
        <h2 style={{ marginTop: 0, color: 'var(--primary)' }}>Supabase configuration</h2>
        <p style={{ color: 'var(--text-medium)', lineHeight: 1.6 }}>
          Add your project URL and anon key to <code>.env.local</code> at the project root:
        </p>
        <pre
          style={{
            background: '#f0f4f4',
            padding: '1rem',
            borderRadius: 8,
            overflow: 'auto',
            fontSize: '0.85rem',
          }}
        >
{`NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # server only; for /api/intake`}
        </pre>
        <p style={{ color: 'var(--text-medium)', fontSize: '0.9rem' }}>
          Run <code>supabase/migrations/001_initial.sql</code> then <code>002_staff_signup_approval.sql</code> in the
          SQL editor. Create the doctor in <strong>Authentication → Users</strong> (Dashboard users become approved
          doctors). Turn on <strong>Email</strong> provider; staff use <code>/auth/signup</code> and wait for approval
          on <strong>Staff approvals</strong>.
        </p>
      </div>
    </div>
  );
}
