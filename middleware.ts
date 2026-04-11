import { type NextRequest, NextResponse } from 'next/server';

// Auth is handled client-side via the custom admins table.
// No Supabase GoTrue session refresh needed.
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
