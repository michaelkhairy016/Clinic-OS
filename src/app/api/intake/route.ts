import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  const supabase = getAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase admin client not initialized' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { 
      name, age, phone, districtId, 
      isFirstVisit, previousDoctor, previousMedIds, 
      history, referralSourceId 
    } = body;

    // 1. Create Patient Record
    const patientCode = `P-${Math.floor(10000 + Math.random() * 90000)}`;
    const { data: patient, error: pErr } = await supabase
      .from('patients')
      .insert({
        patient_code: patientCode,
        full_name: name,
        age: age || 0,
        phone: phone || '',
        chronic_history: history || '',
        district_id: districtId || null,
        is_first_psych_visit: isFirstVisit === true,
        previous_doctor: previousDoctor || '',
        referral_source_id: referralSourceId || null
      })
      .select()
      .single();

    if (pErr) throw pErr;

    // 2. Insert Previous Meds (Relational)
    if (previousMedIds && previousMedIds.length > 0) {
      const medHistory = previousMedIds.map((mId: string) => ({
        patient_id: patient.id,
        medication_id: mId
      }));
      await supabase.from('patient_previous_meds').insert(medHistory);
    }

    // 3. Add to Queue (Default to waiting for now)
    await supabase.from('queue_entries').insert({
      patient_id: patient.id,
      status: 'waiting'
    });

    return NextResponse.json({ success: true, patientCode: patient.patient_code });
  } catch (error: any) {
    console.error('Intake error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
