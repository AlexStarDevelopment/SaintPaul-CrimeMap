import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function useFeatureFlags() {
  const { data: session } = useSession();
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFlags = async () => {
      try {
        const response = await fetch('/api/feature-flags');
        const data = await response.json();
        setFlags(data.flags || {});
      } catch (error) {
        console.error('Error fetching feature flags:', error);
        setFlags({});
      } finally {
        setLoading(false);
      }
    };

    fetchFlags();
  }, [session]); // Refetch when session changes

  const isEnabled = (key: string): boolean => {
    return flags[key] || false;
  };

  return {
    flags,
    isEnabled,
    loading,
  };
}

// Hook for a specific feature flag
export function useFeatureFlag(key: string): boolean {
  const { isEnabled } = useFeatureFlags();
  return isEnabled(key);
}
