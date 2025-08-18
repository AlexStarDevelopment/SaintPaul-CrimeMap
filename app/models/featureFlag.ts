export interface FeatureFlag {
  _id?: string;
  name: string;
  key: string;
  description: string;
  enabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  // Optional: track who can see this feature
  allowedUsers?: string[]; // User IDs
  allowedTiers?: string[]; // Subscription tiers
}

// Predefined feature flags
export const DEFAULT_FEATURE_FLAGS: Omit<FeatureFlag, '_id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Dashboard',
    key: 'dashboard',
    description: 'Enable the user dashboard.',
    enabled: true,
  },
];
