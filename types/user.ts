export type SubscriptionTier = 'free' | 'supporter' | 'pro';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing';
export type ThemeType = 'light' | 'dark' | 'sage' | 'slate';

export interface User {
  _id?: string;
  email: string;
  name?: string;
  image?: string;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionEndDate?: Date;
  trialEndDate?: Date;
  theme?: ThemeType;
  isAdmin?: boolean;
  createdAt: Date;
  updatedAt: Date;
  emailVerified?: Date;
}

export interface UserSession {
  id: string;
  email: string;
  name?: string;
  image?: string;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndDate?: Date;
  trialEndDate?: Date;
  theme?: ThemeType;
  isAdmin?: boolean;
}

export const SUBSCRIPTION_TIERS: Record<
  SubscriptionTier,
  {
    name: string;
    price: number;
    features: string[];
    stripePriceId?: string;
  }
> = {
  free: {
    name: 'Free',
    price: 0,
    features: [
      'Interactive crime map',
      'Filter by type, neighborhood & date',
      'Save up to 2 locations',
      'View crime statistics',
    ],
  },
  supporter: {
    name: 'Supporter',
    price: 5,
    features: [
      'Everything in Free',
      'Save up to 5 locations',
      'Support continued development',
      '7-day free trial',
    ],
    stripePriceId: process.env.STRIPE_SUPPORTER_PRICE_ID,
  },
  pro: {
    name: 'Pro',
    price: 15,
    features: [
      'Everything in Supporter',
      'Unlimited saved locations',
      'Dashboard analytics',
      'Unlimited PDF address safety reports',
      '7-day free trial',
    ],
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
  },
};

export const hasFeatureAccess = (userTier: SubscriptionTier, feature: string): boolean => {
  const tierPermissions = {
    free: ['basic_map', 'filters'],
    supporter: ['basic_map', 'filters', 'ad_free', 'early_access', 'priority_support'],
    pro: [
      'basic_map',
      'filters',
      'ad_free',
      'early_access',
      'priority_support',
      'export',
      'alerts',
      'api_access',
      'trends',
      'reports',
    ],
  };

  return tierPermissions[userTier]?.includes(feature) || false;
};

export const isSubscriptionActive = (user: User): boolean => {
  if (user.subscriptionTier === 'free') return true;

  if (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing') {
    return true;
  }

  // Check if subscription end date is in the future
  if (user.subscriptionEndDate && new Date(user.subscriptionEndDate) > new Date()) {
    return true;
  }

  // Check if trial is still active
  if (user.trialEndDate && new Date(user.trialEndDate) > new Date()) {
    return true;
  }

  return false;
};
