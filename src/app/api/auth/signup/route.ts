import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.email || !body?.password || !body?.role) {
    return NextResponse.json({ error: 'Email, password, and role are required' }, { status: 400 });
  }

  const allowedRoles = ['assistant', 'marketing'];
  if (!allowedRoles.includes(body.role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { error } = await supabase.from('admins').insert({
    email: (body.email as string).trim().toLowerCase(),
    password: body.password,
    full_name: body.full_name || null,
    role: body.role,
    approval_status: 'pending',
  });

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
