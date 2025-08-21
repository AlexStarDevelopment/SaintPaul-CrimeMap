'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

export function useCheckSessionUpdate() {
  const { update, status } = useSession();
  const hasRefreshed = useRef(false);

  useEffect(() => {
    // Only run once when authenticated and haven't refreshed yet
    if (status !== 'authenticated' || hasRefreshed.current) return;

    // Force a session update on page load to get fresh data
    hasRefreshed.current = true;
    update().catch((error) => {
      console.error('Error refreshing session:', error);
      hasRefreshed.current = false; // Allow retry on error
    });
  }, [status, update]);
}
