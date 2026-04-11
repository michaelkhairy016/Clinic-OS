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
  if (!body?.email || !body?.password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('admins')
    .select('id, email, full_name, role, approval_status, password')
    .eq('email', (body.email as string).trim().toLowerCase())
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  if (data.password !== body.password) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const { password: _pwd, ...admin } = data;
  return NextResponse.json({ admin });
}
