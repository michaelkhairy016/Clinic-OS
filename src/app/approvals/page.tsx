"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/modules/auth/AuthContext';
import { UserCheck } from 'lucide-react';

type PendingAdmin = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  approval_status: string;
  created_at: string;
};

export default function ApprovalsPage() {
  const router = useRouter();
  const { role, approvalStatus, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<PendingAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/auth/approvals');
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to load'); return; }
      setRows(data.admins ?? []);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (role !== 'doctor' || approvalStatus !== 'approved') {
      router.replace('/');
    }
  }, [role, approvalStatus, authLoading, router]);

  useEffect(() => {
    if (authLoading || role !== 'doctor' || approvalStatus !== 'approved') return;
    void load();
  }, [authLoading, role, approvalStatus, load]);

  const approve = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch('/api/auth/approvals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, approval_status: 'approved' }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Failed to approve'); return; }
      await load();
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading || role !== 'doctor' || approvalStatus !== 'approved') {
    return <div className="card"><p style={{ margin: 0, color: 'var(--text-medium)' }}>Loading…</p></div>;
  }

  if (loading) {
    return <div className="card"><p style={{ margin: 0, color: 'var(--text-medium)' }}>Loading pending accounts…</p></div>;
  }

  return (
    <div>
      <div className="flex-between">
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <UserCheck size={28} color="var(--primary)" />
          Staff approvals
        </h2>
      </div>
      <p style={{ color: 'var(--text-medium)', marginBottom: '1.5rem' }}>
        Approve new assistants and marketers after you verify them. They cannot access the system until approved.
      </p>

      {error && (
        <div className="card" style={{ borderColor: '#df4759', marginBottom: '1rem' }}>
          <p style={{ color: '#df4759', margin: 0 }}>{error}</p>
        </div>
      )}

      <div className="card" style={{ marginBottom: 0 }}>
        {rows.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--text-medium)' }}>No pending staff accounts.</p>
        ) : (
          <div className="table-container">
            <table style={{ textAlign: 'left', width: '100%' }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Requested role</th>
                  <th style={{ width: 140 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.full_name || '—'}</td>
                    <td>{r.email}</td>
                    <td style={{ textTransform: 'capitalize' }}>{r.role}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                        disabled={busyId === r.id}
                        onClick={() => void approve(r.id)}
                      >
                        {busyId === r.id ? '…' : 'Approve'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
