import { createClient } from './client';

/**
 * Queue Management Utilities
 * Provides atomic operations for queue management to prevent race conditions
 */

export interface QueueEntry {
  id: string;
  patient_id: string;
  clinic_id: string;
  status: 'waiting' | 'active' | 'done';
  queue_num: number;
  check_in_time: string;
  patients?: {
    full_name: string;
    patient_code: string;
  };
}

/**
 * Get next queue number atomically using database sequence
 * This prevents race conditions during concurrent check-ins
 */
export async function getNextQueueNumber(): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase
    .rpc('get_next_queue_number');

  if (error) {
    console.error('Error getting next queue number:', error);
    throw new Error('Failed to generate queue number');
  }

  return data || 1;
}

/**
 * Call next patient from waiting queue
 * Changes status from 'waiting' to 'active'
 */
export async function callNextPatient(clinicId: string): Promise<QueueEntry | null> {
  const supabase = createClient();

  // Get first waiting patient
  const { data: waitingPatients, error: fetchError } = await supabase
    .from('queue_entries')
    .select('*, patients(*)')
    .eq('clinic_id', clinicId)
    .eq('status', 'waiting')
    .order('queue_num', { ascending: true })
    .limit(1);

  if (fetchError) {
    console.error('Error fetching waiting patients:', fetchError);
    throw new Error('Failed to fetch waiting patients');
  }

  if (!waitingPatients || waitingPatients.length === 0) {
    return null; // No patients waiting
  }

  const nextPatient = waitingPatients[0];

  // Update status to active
  const { error: updateError } = await supabase
    .from('queue_entries')
    .update({ status: 'active' })
    .eq('id', nextPatient.id);

  if (updateError) {
    console.error('Error updating patient status:', updateError);
    throw new Error('Failed to update patient status');
  }

  return nextPatient as QueueEntry;
}

/**
 * Complete current active patient visit
 * Changes status from 'active' to 'done'
 */
export async function completePatientVisit(queueEntryId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('queue_entries')
    .update({ status: 'done' })
    .eq('id', queueEntryId);

  if (error) {
    console.error('Error completing patient visit:', error);
    throw new Error('Failed to complete patient visit');
  }
}

/**
 * Get active queue entries for clinic
 */
export async function getActiveQueue(clinicId: string): Promise<QueueEntry[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('queue_entries')
    .select('*, patients(*)')
    .eq('clinic_id', clinicId)
    .in('status', ['waiting', 'active'])
    .order('queue_num', { ascending: true });

  if (error) {
    console.error('Error fetching active queue:', error);
    throw new Error('Failed to fetch active queue');
  }

  return data as QueueEntry[] || [];
}

/**
 * Get waiting patients only
 */
export async function getWaitingPatients(clinicId: string): Promise<QueueEntry[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('queue_entries')
    .select('*, patients(*)')
    .eq('clinic_id', clinicId)
    .eq('status', 'waiting')
    .order('queue_num', { ascending: true });

  if (error) {
    console.error('Error fetching waiting patients:', error);
    throw new Error('Failed to fetch waiting patients');
  }

  return data as QueueEntry[] || [];
}

/**
 * Reset queue for the day (optional functionality)
 */
export async function resetDailyQueue(clinicId: string): Promise<void> {
  const supabase = createClient();

  // Get current queue numbers for this clinic
  const { data: currentQueue } = await supabase
    .from('queue_entries')
    .select('queue_num')
    .eq('clinic_id', clinicId)
    .order('queue_num', { ascending: false })
    .limit(1);

  if (currentQueue && currentQueue.length > 0) {
    // Reset sequence to start fresh tomorrow
    const { error } = await supabase.rpc('reset_queue_number');

    if (error) {
      console.error('Error resetting queue sequence:', error);
      throw new Error('Failed to reset queue sequence');
    }
  }
}
