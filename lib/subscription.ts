import { User, SubscriptionTier, hasFeatureAccess, isSubscriptionActive } from '../app/models/user';
import { getUserById, updateUserSubscription } from './users';

export interface SubscriptionCheckResult {
  hasAccess: boolean;
  user: User | null;
  tier: SubscriptionTier;
  message?: string;
}

/**
 * Check if a user has access to a specific feature
 */
export async function checkFeatureAccess(
  userId: string,
  feature: string
): Promise<SubscriptionCheckResult> {
  try {
    const user = await getUserById(userId);

    if (!user) {
      return {
        hasAccess: false,
        user: null,
        tier: 'free',
        message: 'User not found',
      };
    }

    // Check if subscription is active
    if (!isSubscriptionActive(user)) {
      // If subscription expired, downgrade to free
      if (user.subscriptionTier !== 'free') {
        await updateUserSubscription(userId, {
          tier: 'free',
          status: 'canceled',
        });
        user.subscriptionTier = 'free';
      }
    }

    const hasAccess = hasFeatureAccess(user.subscriptionTier, feature);

    return {
      hasAccess,
      user,
      tier: user.subscriptionTier,
      message: hasAccess
        ? undefined
        : `This feature requires ${getRequiredTierForFeature(feature)} tier`,
    };
  } catch (error) {
    console.error('Error checking feature access:', error);
    return {
      hasAccess: false,
      user: null,
      tier: 'free',
      message: 'Error checking access',
    };
  }
}

/**
 * Get the minimum tier required for a feature
 */
function getRequiredTierForFeature(feature: string): SubscriptionTier {
  const featureTiers: Record<string, SubscriptionTier> = {
    basic_map: 'free',
    filters: 'free',
    ad_free: 'supporter',
    early_access: 'supporter',
    priority_support: 'supporter',
    export: 'pro',
    alerts: 'pro',
    api_access: 'pro',
    trends: 'pro',
    reports: 'pro',
  };

  return featureTiers[feature] || 'pro';
}

/**
 * Check if user can upgrade to a specific tier
 */
export function canUpgradeToTier(
  currentTier: SubscriptionTier,
  targetTier: SubscriptionTier
): boolean {
  const tierHierarchy: Record<SubscriptionTier, number> = {
    free: 0,
    supporter: 1,
    pro: 2,
  };

  return tierHierarchy[targetTier] > tierHierarchy[currentTier];
}

/**
 * Get upgrade options for a user
 */
export function getUpgradeOptions(currentTier: SubscriptionTier): SubscriptionTier[] {
  const allTiers: SubscriptionTier[] = ['free', 'supporter', 'pro'];
  return allTiers.filter((tier) => canUpgradeToTier(currentTier, tier));
}

/**
 * Calculate trial end date (14 days from now)
 */
export function calculateTrialEndDate(): Date {
  const trialDays = 14;
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + trialDays);
  return trialEnd;
}

/**
 * Check if user is in trial period
 */
export function isInTrialPeriod(user: User): boolean {
  if (!user.trialEndDate) return false;
  return new Date(user.trialEndDate) > new Date();
}

/**
 * Get days remaining in trial
 */
export function getTrialDaysRemaining(user: User): number {
  if (!user.trialEndDate) return 0;

  const now = new Date();
  const trialEnd = new Date(user.trialEndDate);

  if (trialEnd <= now) return 0;

  const diffTime = trialEnd.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Format subscription status for display
 */
export function formatSubscriptionStatus(user: User): string {
  if (user.subscriptionTier === 'free') {
    return 'Free Plan';
  }

  if (isInTrialPeriod(user)) {
    const daysRemaining = getTrialDaysRemaining(user);
    return `${user.subscriptionTier} Trial (${daysRemaining} days left)`;
  }

  if (!isSubscriptionActive(user)) {
    return `${user.subscriptionTier} (Expired)`;
  }

  return user.subscriptionTier.charAt(0).toUpperCase() + user.subscriptionTier.slice(1);
}
