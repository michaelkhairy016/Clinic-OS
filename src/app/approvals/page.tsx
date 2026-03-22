"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/modules/auth/AuthContext';
import type { ApprovalStatus, ProfileRow, UserRole } from '@/types/database';
import { UserCheck } from 'lucide-react';

type ProfileListRow = Pick<ProfileRow, 'id' | 'email' | 'role' | 'approval_status' | 'full_name'>;

export default function ApprovalsPage() {
  const router = useRouter();
  const { role, approvalStatus, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<ProfileListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const supabase = createClient();
    const { data, error: e } = await supabase
      .from('profiles')
      .select('id, email, role, approval_status, full_name')
      .eq('approval_status', 'pending')
      .order('email', { ascending: true });
    if (e) setError(e.message);
    setRows((data as ProfileListRow[]) ?? []);
    setLoading(false);
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
    const supabase = createClient();
    const { error: e } = await supabase.from('profiles').update({ approval_status: 'approved' as ApprovalStatus }).eq('id', id);
    setBusyId(null);
    if (e) {
      alert(e.message);
      return;
    }
    await load();
  };

  if (authLoading || role !== 'doctor' || approvalStatus !== 'approved') {
    return (
      <div className="card">
        <p style={{ margin: 0, color: 'var(--text-medium)' }}>Loading…</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card">
        <p style={{ margin: 0, color: 'var(--text-medium)' }}>Loading pending accounts…</p>
      </div>
    );
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
        Approve new assistants and marketers after you verify them. They cannot access patient data until approved.
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
                  <th>Email</th>
                  <th>Requested role</th>
                  <th style={{ width: 140 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.email ?? '—'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{r.role as UserRole}</td>
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
