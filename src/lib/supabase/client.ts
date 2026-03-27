import { createBrowserClient } from '@supabase/ssr';

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  return createBrowserClient(url, key, {
    isSingleton: true,
  });
}

/**
 * Fully clear all Supabase session data from browser storage
 * This clears: cookies, localStorage, sessionStorage, and IndexedDB
 */
export async function clearAllSupabaseData(): Promise<void> {
  if (typeof window === 'undefined') return;

  // 1. Clear localStorage
  const localKeys = Object.keys(localStorage);
  localKeys.forEach(key => {
    if (key.startsWith('sb-') || key.includes('supabase')) {
      localStorage.removeItem(key);
    }
  });

  // 2. Clear sessionStorage
  const sessionKeys = Object.keys(sessionStorage);
  sessionKeys.forEach(key => {
    if (key.startsWith('sb-') || key.includes('supabase')) {
      sessionStorage.removeItem(key);
    }
  });

  // 3. Clear IndexedDB (Supabase stores auth tokens here)
  if ('indexedDB' in window) {
    try {
      const databases = await indexedDB.databases();
      for (const db of databases) {
        if (db.name && (db.name.includes('supabase') || db.name.startsWith('sb-'))) {
          indexedDB.deleteDatabase(db.name);
        }
      }
    } catch {
      // Fallback: try to delete known Supabase DB names
      const knownDbNames = ['supabase-auth', 'sb-auth-token'];
      for (const name of knownDbNames) {
        try {
          indexedDB.deleteDatabase(name);
        } catch {
          // Ignore errors
        }
      }
    }
  }

  // 4. Clear cookies by setting them to expired
  const cookies = document.cookie.split(';');
  cookies.forEach(cookie => {
    const name = cookie.split('=')[0].trim();
    if (name.startsWith('sb-') || name.includes('supabase')) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  });
}
