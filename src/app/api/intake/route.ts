import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: Request) {
  const supabase = getAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Intake API not configured (missing service role key)' }, { status: 503 });
  }

  let body: {
    name?: string;
    age?: number;
    phone?: string;
    history?: string;
    referralSource?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const name = String(body.name ?? '').trim();
  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const age = Number.isFinite(body.age) ? Math.max(0, Math.floor(Number(body.age))) : 0;
  const phone = String(body.phone ?? '').trim();
  const history = String(body.history ?? '').trim();
  const referralSource = String(body.referralSource ?? '').trim();

  const { count } = await supabase.from('patients').select('*', { count: 'exact', head: true });
  const nextIndex = (count ?? 0) + 1;
  const patientCode = `PT-${1000 + nextIndex}`;

  const { data: patient, error: pErr } = await supabase
    .from('patients')
    .insert({
      patient_code: patientCode,
      full_name: name,
      age,
      phone,
      chronic_history: history,
      referral_source: referralSource || null,
    })
    .select()
    .single();

  if (pErr) {
    return NextResponse.json({ error: pErr.message }, { status: 500 });
  }

  const { data: maxRow } = await supabase
    .from('queue_entries')
    .select('queue_num')
    .order('queue_num', { ascending: false })
    .limit(1)
    .maybeSingle();

  const queueNum = (maxRow?.queue_num ?? 0) + 1;
  const checkInTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const { data: entry, error: qErr } = await supabase
    .from('queue_entries')
    .insert({
      patient_id: patient.id,
      status: 'waiting',
      queue_num: queueNum,
      visit_type: 'كشف عادي (Normal Visit)',
      payment: 'كاش',
      check_in_time: checkInTime,
    })
    .select()
    .single();

  if (qErr) {
    return NextResponse.json({ error: qErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, patient, queue: entry });
}
