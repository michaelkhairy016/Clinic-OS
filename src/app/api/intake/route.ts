import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = getAdmin();
    if (!supabase) throw new Error('Supabase Admin client not initialized');

    // Map the relational fields
    const {
      fullName, age, phone, districtId, sourceId,
      isFirstVisit, prevDoc, prevMeds, chronic, isVezeeta
    } = body;

    // 1. Create Patient Record
    const { data: patient, error: pErr } = await supabase
      .from('patients')
      .insert({
        full_name: fullName,
        age: Number(age),
        phone,
        district_id: districtId || null,
        referral_source_id: sourceId || null,
        is_first_psych_visit: isFirstVisit,
        previous_doctor: prevDoc,
        chronic_history: chronic,
        is_vezeeta: isVezeeta === true,
        status: 'active'
      })
      .select()
      .single();

    if (pErr) throw pErr;

    // 2. Map Previous Medications if any
    if (prevMeds && Array.isArray(prevMeds) && prevMeds.length > 0) {
      const medInserts = prevMeds.map((mId: string) => ({
        patient_id: patient.id,
        medication_id: mId,
      }));
      await supabase.from('patient_previous_meds').insert(medInserts);
    }

    return NextResponse.json({ success: true, patientCode: patient.patient_code });
  } catch (error: any) {
    console.error('Intake Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
