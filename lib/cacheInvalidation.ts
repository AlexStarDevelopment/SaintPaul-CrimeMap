import { CrimeCacheService } from './cacheService';

/**
 * Cache invalidation strategies for handling data freshness
 */

// Types for invalidation
interface InvalidationOptions {
  type?: 'selective' | 'full' | 'pattern';
  patterns?: string[];
  reason?: string;
  forceRefresh?: boolean;
}

interface DataChangeEvent {
  collection: string;
  operation: 'insert' | 'update' | 'delete';
  documentId?: string;
  affectedFields?: string[];
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Cache invalidation service
 */
export class CacheInvalidationService {
  /**
   * Invalidate cache entries based on data changes
   */
  static async invalidateByDataChange(event: DataChangeEvent): Promise<{
    invalidated: string[];
    refreshed: string[];
    errors: string[];
  }> {
    console.log(`🔄 Processing data change event:`, event);

    const results = {
      invalidated: [] as string[],
      refreshed: [] as string[],
      errors: [] as string[],
    };

    try {
      if (event.collection === 'crimes') {
        // Crime data changed - invalidate related cache entries
        const affectedKeys = await this.getAffectedCacheKeys(event);

        for (const key of affectedKeys) {
          try {
            // Remove from cache
            const deleted = await this.invalidateCacheKey(key);
            if (deleted) {
              results.invalidated.push(key);

              // Optionally refresh immediately
              if (event.operation === 'insert' || event.operation === 'update') {
                const refreshed = await this.refreshCacheKey(key);
                if (refreshed) {
                  results.refreshed.push(key);
                }
              }
            }
          } catch (error) {
            const errorMsg = `Failed to invalidate ${key}: ${error}`;
            console.error(errorMsg);
            results.errors.push(errorMsg);
          }
        }
      }
    } catch (error) {
      const errorMsg = `Cache invalidation failed: ${error}`;
      console.error(errorMsg);
      results.errors.push(errorMsg);
    }

    console.log(`🔄 Cache invalidation completed:`, results);
    return results;
  }

  /**
   * Determine which cache keys are affected by a data change
   */
  private static async getAffectedCacheKeys(event: DataChangeEvent): Promise<string[]> {
    const affectedKeys: string[] = [];

    if (event.collection === 'crimes') {
      const currentYear = new Date().getFullYear();

      // Get all current cache entries
      const entries = CrimeCacheService.getCacheEntries();

      if (event.metadata?.month && event.metadata?.year) {
        const dataYear = parseInt(event.metadata.year);

        // Only invalidate if it's current year data (historical data never changes)
        if (dataYear >= currentYear) {
          // Specific month/year affected
          const targetKey = `crimes:type:${event.metadata.month}|year:${event.metadata.year}`;
          affectedKeys.push(targetKey);

          // Also invalidate 'all' year data if specific month changed
          const allYearKey = `crimes:type:all|year:${event.metadata.year}`;
          affectedKeys.push(allYearKey);
        } else {
          console.log(
            `🔒 Skipping invalidation for historical data: ${event.metadata.month} ${event.metadata.year}`
          );
        }
      } else {
        // If we don't know specifics, only invalidate current year cache entries
        const currentYearEntries = entries.filter((e) => e.key.includes(`year:${currentYear}`));
        affectedKeys.push(...currentYearEntries.map((e) => e.key));

        console.log(`🔄 Invalidating only current year (${currentYear}) cache entries`);
      }
    }

    return [...new Set(affectedKeys)]; // Remove duplicates
  }

  /**
   * Invalidate a specific cache key
   */
  private static async invalidateCacheKey(key: string): Promise<boolean> {
    // Use version-based invalidation first (non-destructive)
    const versionInvalidated = CrimeCacheService.invalidateCacheByVersion(key);
    if (versionInvalidated.length > 0) {
      return true;
    }

    // Fallback to direct deletion for specific keys
    const keyParts = key.split(':');
    if (keyParts.length >= 2 && keyParts[0] === 'crimes') {
      const params = this.parseKeyToParams(key);
      if (params) {
        return (
          CrimeCacheService.clearCacheByTimePeriod(
            params.year,
            params.type !== 'all' ? params.type : undefined
          ).length > 0
        );
      }
      // Last resort: clear all crime cache
      CrimeCacheService.clearCrimeCache();
      return true;
    }
    return false;
  }

  /**
   * Refresh cache key with fresh data
   */
  private static async refreshCacheKey(key: string): Promise<boolean> {
    try {
      // Parse key to extract parameters
      const params = this.parseKeyToParams(key);
      if (params) {
        // Pre-fetch data to warm cache
        await CrimeCacheService.getCrimeData(params.type, params.year);
        return true;
      }
    } catch (error) {
      console.error(`Failed to refresh cache key ${key}:`, error);
    }
    return false;
  }

  /**
   * Parse cache key to extract parameters
   */
  private static parseKeyToParams(key: string): { type: string; year: string } | null {
    // Example key: "crimes:type:june|year:2025"
    const match = key.match(/crimes:type:([^|]+)\|year:(\d+)/);
    if (match) {
      return {
        type: match[1],
        year: match[2],
      };
    }
    return null;
  }

  /**
   * Selective cache invalidation by pattern
   */
  static async invalidateByPattern(patterns: string[]): Promise<{
    invalidated: string[];
    errors: string[];
  }> {
    const results = {
      invalidated: [] as string[],
      errors: [] as string[],
    };

    const entries = CrimeCacheService.getCacheEntries();

    for (const pattern of patterns) {
      const regex = new RegExp(pattern);
      const matchingKeys = entries
        .filter((entry) => regex.test(entry.key))
        .map((entry) => entry.key);

      for (const key of matchingKeys) {
        try {
          const deleted = await this.invalidateCacheKey(key);
          if (deleted) {
            results.invalidated.push(key);
          }
        } catch (error) {
          const errorMsg = `Failed to invalidate ${key}: ${error}`;
          results.errors.push(errorMsg);
        }
      }
    }

    return results;
  }

  /**
   * Time-based cache refresh (background job)
   */
  static async backgroundRefresh(): Promise<{
    refreshed: string[];
    failed: string[];
    skipped: string[];
  }> {
    console.log('🔄 Starting background cache refresh...');

    const results = {
      refreshed: [] as string[],
      failed: [] as string[],
      skipped: [] as string[],
    };

    try {
      const entries = CrimeCacheService.getCacheEntries();
      const stats = CrimeCacheService.getCacheStats();

      // Only refresh if we have active cache entries
      if (entries.length === 0) {
        console.log('🔄 No cache entries to refresh');
        return results;
      }

      // Focus on current year data for background refresh (historical data doesn't change)
      const currentYear = new Date().getFullYear();
      const currentYearEntries = entries.filter((entry) =>
        entry.key.includes(`year:${currentYear}`)
      );

      // Refresh popular current year entries
      const popularEntries = currentYearEntries
        .filter((entry) => entry.entry.hits > 3) // Lower threshold for background refresh
        .sort((a, b) => b.entry.hits - a.entry.hits)
        .slice(0, 8); // Top 8 most popular

      console.log(`🔄 Found ${popularEntries.length} popular entries to refresh`);

      for (const entry of popularEntries) {
        try {
          // Check if entry is close to expiration (within 20% of TTL)
          const age = Date.now() - entry.entry.timestamp;
          const timeToExpiry = entry.entry.ttl - age;
          const expiryThreshold = entry.entry.ttl * 0.2; // 20% of TTL

          if (timeToExpiry <= expiryThreshold) {
            const refreshed = await this.refreshCacheKey(entry.key);
            if (refreshed) {
              results.refreshed.push(entry.key);
              console.log(`🔄 Refreshed cache entry: ${entry.key}`);
            } else {
              results.failed.push(entry.key);
            }
          } else {
            results.skipped.push(entry.key);
            console.log(`🔄 Skipped cache entry (not near expiry): ${entry.key}`);
          }
        } catch (error) {
          console.error(`🔄 Failed to refresh ${entry.key}:`, error);
          results.failed.push(entry.key);
        }
      }

      console.log(
        `🔄 Background refresh completed: ${results.refreshed.length} refreshed, ${results.failed.length} failed, ${results.skipped.length} skipped`
      );
    } catch (error) {
      console.error('🔄 Background refresh failed:', error);
    }

    return results;
  }
}

/**
 * Cache versioning for data consistency
 */
export class CacheVersioningService {
  private static versionStore = new Map<string, number>();

  /**
   * Get version for a cache key
   */
  static getVersion(key: string): number {
    return this.versionStore.get(key) || 1;
  }

  /**
   * Increment version for cache invalidation
   */
  static incrementVersion(key: string): number {
    const currentVersion = this.getVersion(key);
    const newVersion = currentVersion + 1;
    this.versionStore.set(key, newVersion);
    console.log(`📝 Cache version incremented: ${key} → v${newVersion}`);
    return newVersion;
  }

  /**
   * Check if cached data version is current
   */
  static isVersionCurrent(key: string, cachedVersion: number): boolean {
    const currentVersion = this.getVersion(key);
    return cachedVersion >= currentVersion;
  }
}

/**
 * Schedule background refresh job
 */
export function scheduleBackgroundRefresh(): void {
  const interval = parseInt(process.env.CACHE_BACKGROUND_REFRESH_INTERVAL || '1800000'); // 30 minutes

  setInterval(async () => {
    try {
      await CacheInvalidationService.backgroundRefresh();
    } catch (error) {
      console.error('Scheduled background refresh failed:', error);
    }
  }, interval);

  console.log(`🔄 Background cache refresh scheduled every ${interval}ms`);
}

// Auto-start background refresh in production
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  scheduleBackgroundRefresh();
}
