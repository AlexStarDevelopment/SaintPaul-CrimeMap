'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { User, SubscriptionTier, SUBSCRIPTION_TIERS, FeatureFlag } from '@/types';
import SupportDialog from '@/app/components/SupportDialog';
import AccountBenefitsDialog from '@/app/components/AccountBenefitsDialog';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'users' | 'features'>('users');

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Feature flags state
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [flagsLoading, setFlagsLoading] = useState(true);
  const [updatingFlagId, setUpdatingFlagId] = useState<string | null>(null);
  const [cleanupLoading, setCleanupLoading] = useState(false);

  // Dialog states
  const [supportDialogOpen, setSupportDialogOpen] = useState(false);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (!session.user?.isAdmin) {
      router.push('/');
      return;
    }

    fetchUsers();
    fetchFeatureFlags();
  }, [session, status, router]);

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await fetch('/api/admin/users');

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchFeatureFlags = async () => {
    try {
      setFlagsLoading(true);
      const response = await fetch('/api/admin/feature-flags');

      if (!response.ok) {
        throw new Error('Failed to fetch feature flags');
      }

      const data = await response.json();
      setFeatureFlags(data.flags);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setFlagsLoading(false);
    }
  };

  const updateUserTier = async (userId: string, newTier: SubscriptionTier) => {
    try {
      setUpdatingUserId(userId);
      const response = await fetch(`/api/admin/users/${userId}/tier`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier: newTier }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user tier');
      }

      // Update local state
      setUsers(
        users.map((user) =>
          user._id === userId
            ? { ...user, subscriptionTier: newTier, subscriptionStatus: 'active' }
            : user
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update user tier');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const toggleUserAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      setUpdatingUserId(userId);
      const response = await fetch(`/api/admin/users/${userId}/admin`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isAdmin: !currentStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update admin status');
      }

      // Update local state
      setUsers(
        users.map((user) => (user._id === userId ? { ...user, isAdmin: !currentStatus } : user))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update admin status');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const toggleFeatureFlag = async (flagId: string, currentStatus: boolean) => {
    try {
      setUpdatingFlagId(flagId);
      const response = await fetch(`/api/admin/feature-flags/${flagId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update feature flag');
      }

      const data = await response.json();

      // Update local state
      setFeatureFlags(featureFlags.map((flag) => (flag._id === flagId ? data.flag : flag)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update feature flag');
    } finally {
      setUpdatingFlagId(null);
    }
  };

  const updateShowInDev = async (flagId: string, showInDev: boolean) => {
    try {
      setUpdatingFlagId(flagId);
      const response = await fetch(`/api/admin/feature-flags/${flagId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ showInDev }),
      });

      if (!response.ok) {
        throw new Error('Failed to update feature flag');
      }

      const data = await response.json();

      // Update local state
      setFeatureFlags(featureFlags.map((flag) => (flag._id === flagId ? data.flag : flag)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update feature flag');
    } finally {
      setUpdatingFlagId(null);
    }
  };

  const cleanupFeatureFlags = async () => {
    if (
      !confirm(
        'This will remove all placeholder feature flags and keep only the working ones. Continue?'
      )
    ) {
      return;
    }

    try {
      setCleanupLoading(true);
      const response = await fetch('/api/admin/feature-flags/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to cleanup feature flags');
      }

      const data = await response.json();

      // Refresh the feature flags list
      await fetchFeatureFlags();

      alert(
        `Cleanup successful! Removed ${data.deleted} old flags, now showing ${data.finalFlags.length} working flag(s).`
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cleanup feature flags');
    } finally {
      setCleanupLoading(false);
    }
  };

  if (status === 'loading' || (usersLoading && flagsLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage users and feature flags
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSupportDialogOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Test Support Dialog
              </button>
              <button
                onClick={() => setAccountDialogOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Test Account Dialog
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('features')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'features'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Feature Flags ({featureFlags.length})
            </button>
          </nav>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Current Tier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {user.image && (
                            <div className="h-10 w-10 rounded-full mr-3 overflow-hidden relative">
                              <Image
                                src={user.image}
                                alt={user.name || user.email}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.name || 'No name'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${
                            user.subscriptionTier === 'pro'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200'
                              : user.subscriptionTier === 'supporter'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {SUBSCRIPTION_TIERS[user.subscriptionTier].name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${
                            user.subscriptionStatus === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200'
                          }`}
                        >
                          {user.subscriptionStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user._id !== session.user.id ? (
                          <button
                            onClick={() => toggleUserAdmin(user._id!, user.isAdmin || false)}
                            disabled={updatingUserId === user._id}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              user.isAdmin ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                            } ${updatingUserId === user._id ? 'opacity-50' : ''}`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                user.isAdmin ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        ) : (
                          <span className="text-xs text-gray-500 dark:text-gray-400">You</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.subscriptionTier}
                          onChange={(e) =>
                            updateUserTier(user._id!, e.target.value as SubscriptionTier)
                          }
                          disabled={updatingUserId === user._id}
                          className="text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
                        >
                          <option value="free">Free</option>
                          <option value="supporter">Supporter</option>
                          <option value="pro">Pro</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Feature Flags Tab */}
        {activeTab === 'features' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Feature Flags ({featureFlags.length})
              </h3>
              <button
                onClick={cleanupFeatureFlags}
                disabled={cleanupLoading}
                className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                {cleanupLoading ? 'Cleaning...' : 'Cleanup Placeholders'}
              </button>
            </div>
            {featureFlags.map((flag) => (
              <div key={flag._id} className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {flag.name}
                      </h3>
                      <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {flag.key}
                      </code>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {flag.description}
                    </p>
                    {flag.allowedTiers && flag.allowedTiers.length > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Restricted to:
                        </span>
                        {flag.allowedTiers.map((tier) => (
                          <span
                            key={tier}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
                          >
                            {tier}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Prod</span>
                      <button
                        onClick={() => toggleFeatureFlag(flag._id!, flag.enabled)}
                        disabled={updatingFlagId === flag._id}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          flag.enabled ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-600'
                        } ${updatingFlagId === flag._id ? 'opacity-50' : ''}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            flag.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Dev</span>
                      <button
                        onClick={() => updateShowInDev(flag._id!, !flag.showInDev)}
                        disabled={updatingFlagId === flag._id}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                          flag.showInDev ? 'bg-orange-600' : 'bg-gray-200 dark:bg-gray-600'
                        } ${updatingFlagId === flag._id ? 'opacity-50' : ''}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            flag.showInDev ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
          {activeTab === 'users'
            ? `Total users: ${users.length}`
            : `Total flags: ${featureFlags.length}`}
        </div>
      </div>

      <SupportDialog open={supportDialogOpen} onClose={() => setSupportDialogOpen(false)} />
      <AccountBenefitsDialog open={accountDialogOpen} onClose={() => setAccountDialogOpen(false)} />
    </div>
  );
}
