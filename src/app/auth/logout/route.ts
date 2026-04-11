import { NextResponse } from 'next/server';

// Logout is handled entirely client-side by clearing localStorage.
// This route exists for backward compatibility and does nothing server-side.
export async function POST() {
  return NextResponse.json({ success: true });
}
