// Supabase Edge Function: Patient Intake
// Creates a new patient and returns the patient code
// Deploy with: supabase functions deploy patient-intake

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PatientInput {
  fullName: string
  age: number
  phone: string
  districtId?: string
  sourceId?: string
  isFirstVisit: boolean
  prevDoc?: string
  prevMeds?: string[]
  chronic?: string
  isVezeeta: boolean
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const body: PatientInput = await req.json()

    // Validate required fields
    if (!body.fullName || !body.phone) {
      return new Response(
        JSON.stringify({ error: 'Full name and phone are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Create patient record
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .insert({
        full_name: body.fullName,
        age: body.age ? Number(body.age) : null,
        phone: body.phone,
        district_id: body.districtId || null,
        referral_source_id: body.sourceId || null,
        is_first_psych_visit: body.isFirstVisit ?? true,
        previous_doctor: body.prevDoc || null,
        chronic_history: body.chronic || null,
        is_vezeeta: body.isVezeeta === true,
        status: 'active'
      })
      .select('id, patient_code')
      .single()

    if (patientError) {
      console.error('Patient insert error:', patientError)
      return new Response(
        JSON.stringify({ error: patientError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Map previous medications if provided
    if (body.prevMeds && Array.isArray(body.prevMeds) && body.prevMeds.length > 0) {
      const medInserts = body.prevMeds.map((medId: string) => ({
        patient_id: patient.id,
        medication_id: medId,
      }))

      const { error: medsError } = await supabase
        .from('patient_previous_meds')
        .insert(medInserts)

      if (medsError) {
        console.error('Medications insert error:', medsError)
        // Don't fail the whole request, just log the error
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        patientCode: patient.patient_code,
        patientId: patient.id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
