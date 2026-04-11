"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/modules/auth/AuthContext';
import { createClient } from '@/lib/supabase/client';

export type PresenceUser = {
  user_id: string;
  clinic_id: string;
  role: string;
  user_name: string | null;
  last_heartbeat: string;
};

export type ClinicSyncStatus = {
  isSynced: boolean;
  sameClinicUsers: PresenceUser[];
  otherClinicUsers: PresenceUser[];
  doctorPresent: boolean;
  assistantPresent: boolean;
};

/**
 * Hook to track user presence and clinic sync status for poke-yoke verification
 */
export function usePresence() {
  const { user, role, activeClinicId } = useAuth();
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  // Update own presence
  const updatePresence = useCallback(async () => {
    if (!user || !activeClinicId) return;

    const userName = user.full_name || user.email.split('@')[0] || 'Unknown';

    await supabase
      .from('user_presence')
      .upsert({
        user_id: user.id,
        clinic_id: activeClinicId,
        role: role || 'assistant',
        user_name: userName,
        last_heartbeat: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
  }, [user, activeClinicId, role, supabase]);

  // Fetch all presence users
  const fetchPresence = useCallback(async () => {
    const { data } = await supabase
      .from('user_presence')
      .select('user_id, clinic_id, role, user_name, last_heartbeat')
      .gte('last_heartbeat', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Active in last 5 minutes

    setPresenceUsers((data as PresenceUser[]) || []);
  }, [supabase]);

  // Calculate sync status
  const getSyncStatus = useCallback((): ClinicSyncStatus => {
    if (!activeClinicId) {
      return {
        isSynced: true,
        sameClinicUsers: [],
        otherClinicUsers: [],
        doctorPresent: false,
        assistantPresent: false
      };
    }

    // Filter out current user
    const otherUsers = presenceUsers.filter(u => u.user_id !== user?.id);

    const sameClinicUsers = otherUsers.filter(u => u.clinic_id === activeClinicId);
    const otherClinicUsers = otherUsers.filter(u => u.clinic_id !== activeClinicId);

    const doctorPresent = sameClinicUsers.some(u => u.role === 'doctor');
    const assistantPresent = sameClinicUsers.some(u => u.role === 'assistant');

    // Show warning if there are other users online AND any of them are at a DIFFERENT clinic
    // This means: if doctor at Clinic A and assistant at Clinic B, both should see warning
    const showWarning = otherUsers.length > 0 && otherClinicUsers.length > 0;

    return {
      isSynced: !showWarning,
      sameClinicUsers,
      otherClinicUsers,
      doctorPresent,
      assistantPresent
    };
  }, [activeClinicId, presenceUsers, user?.id]);

  // Initialize presence tracking
  useEffect(() => {
    if (!user || !activeClinicId) return;

    // Initial update
    updatePresence();
    fetchPresence();

    // Heartbeat every 30 seconds
    heartbeatInterval.current = setInterval(() => {
      updatePresence();
      fetchPresence();
    }, 30000);

    // Subscribe to real-time changes
    const channel = supabase
      .channel('presence-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence'
        },
        () => {
          fetchPresence();
        }
      )
      .subscribe();

    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      supabase.removeChannel(channel);

      // Remove presence on unmount/logout
      supabase
        .from('user_presence')
        .delete()
        .eq('user_id', user.id)
        .then(() => {});
    };
  }, [user, activeClinicId, updatePresence, fetchPresence, supabase]);

  return {
    presenceUsers,
    syncStatus: getSyncStatus(),
    refreshPresence: fetchPresence
  };
}
