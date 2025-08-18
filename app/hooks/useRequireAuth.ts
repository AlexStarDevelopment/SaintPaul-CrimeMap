import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Hook that redirects unauthenticated users to sign-in page
 * @param redirectTo - Optional path to redirect to after sign in (defaults to current page)
 * @returns session data and loading state
 */
export function useRequireAuth(redirectTo?: string) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  return {
    session,
    loading: status === 'loading',
    authenticated: status === 'authenticated',
  };
}
