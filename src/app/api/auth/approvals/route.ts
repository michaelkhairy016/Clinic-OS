import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

/** List all pending admins (password excluded) */
export async function GET() {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('admins')
    .select('id, email, full_name, role, approval_status, created_at')
    .eq('approval_status', 'pending')
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ admins: data ?? [] });
}

/** Approve or reject an admin by id */
export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.id || !body?.approval_status) {
    return NextResponse.json({ error: 'id and approval_status are required' }, { status: 400 });
  }

  const allowed = ['approved', 'pending'];
  if (!allowed.includes(body.approval_status)) {
    return NextResponse.json({ error: 'Invalid approval_status' }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { error } = await supabase
    .from('admins')
    .update({ approval_status: body.approval_status, updated_at: new Date().toISOString() })
    .eq('id', body.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
