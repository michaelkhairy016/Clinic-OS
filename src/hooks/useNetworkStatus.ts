import { useState, useEffect } from 'react';

export function useNetworkStatus() {
  // Always start as true to match the server-rendered HTML (SSR-safe).
  // The actual value is synced in the effect below.
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Sync the real value once we're on the client
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
