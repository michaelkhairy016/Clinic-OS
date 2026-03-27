import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();

    // Get all cookies first
    const allCookies = cookieStore.getAll();

    // Delete all Supabase cookies directly
    for (const cookie of allCookies) {
      if (cookie.name.includes('sb-') || cookie.name.includes('supabase') || cookie.name.startsWith('sb')) {
        cookieStore.delete(cookie.name);
      }
    }

    // Try to sign out via Supabase (may fail if cookies already cleared)
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                );
              } catch {
                // Ignore cookie errors
              }
            },
          },
        }
      );
      await supabase.auth.signOut();
    } catch {
      // Ignore Supabase errors - cookies are already cleared
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout route error:', error);
    return NextResponse.json({ success: true }); // Return success anyway
  }
}
