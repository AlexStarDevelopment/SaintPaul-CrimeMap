import { CrimeCacheService } from './cacheService';

/**
 * Cache warming utilities for optimizing application performance
 */

// Cache warming configuration
const CACHE_WARMING_CONFIG = {
  enabled: process.env.CACHE_WARMING_ENABLED !== 'false', // Default enabled
  delay: parseInt(process.env.CACHE_WARMING_DELAY || '10000'), // 10 seconds after startup
  popularDataSets: [
    // Current month and year
    {
      type: new Date().toLocaleString('default', { month: 'long' }).toLowerCase(),
      year: new Date().getFullYear().toString(),
    },
    // All current year data
    {
      type: 'all',
      year: new Date().getFullYear().toString(),
    },
    // Previous year data (often requested for comparisons)
    {
      type: 'all',
      year: (new Date().getFullYear() - 1).toString(),
    },
  ],
};

/**
 * Warm cache with popular crime data
 */
export async function warmPopularData(): Promise<void> {
  if (!CACHE_WARMING_CONFIG.enabled) {
    console.log('Cache warming disabled via configuration');
    return;
  }

  console.log('🔥 Starting cache warming for popular crime data...');
  
  const startTime = Date.now();
  const results: Array<{ dataset: string; status: 'success' | 'error'; time: number; error?: string }> = [];

  for (const { type, year } of CACHE_WARMING_CONFIG.popularDataSets) {
    const datasetName = `${type} ${year}`;
    const datasetStartTime = Date.now();
    
    try {
      console.log(`🔥 Warming cache for ${datasetName}...`);
      
      // Warm the cache by fetching the data
      await CrimeCacheService.getCrimeData(type, year);
      
      const datasetTime = Date.now() - datasetStartTime;
      results.push({
        dataset: datasetName,
        status: 'success',
        time: datasetTime,
      });
      
      console.log(`✅ Cache warmed for ${datasetName} (${datasetTime}ms)`);
    } catch (error) {
      const datasetTime = Date.now() - datasetStartTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      results.push({
        dataset: datasetName,
        status: 'error',
        time: datasetTime,
        error: errorMessage,
      });
      
      console.error(`❌ Failed to warm cache for ${datasetName}: ${errorMessage}`);
    }
  }

  const totalTime = Date.now() - startTime;
  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  console.log(`🔥 Cache warming completed in ${totalTime}ms:`);
  console.log(`✅ Successfully warmed: ${successCount} datasets`);
  console.log(`❌ Failed to warm: ${errorCount} datasets`);

  // Log cache statistics after warming
  const cacheStats = CrimeCacheService.getCacheStats();
  console.log(`📊 Cache stats: ${cacheStats.entries} entries, ${(cacheStats.totalSize / 1024).toFixed(2)}KB, ${cacheStats.hitRate.toFixed(1)}% hit rate`);
}

/**
 * Schedule cache warming to run after server startup
 */
export function scheduleInitialCacheWarming(): void {
  if (!CACHE_WARMING_CONFIG.enabled) {
    return;
  }

  console.log(`🔥 Cache warming scheduled to run in ${CACHE_WARMING_CONFIG.delay}ms`);
  
  setTimeout(async () => {
    try {
      await warmPopularData();
    } catch (error) {
      console.error('❌ Cache warming failed:', error);
    }
  }, CACHE_WARMING_CONFIG.delay);
}

/**
 * Periodic cache warming (for long-running applications)
 */
export function schedulePeriodicCacheWarming(): void {
  if (!CACHE_WARMING_CONFIG.enabled) {
    return;
  }

  const interval = parseInt(process.env.CACHE_WARMING_INTERVAL || '3600000'); // 1 hour default
  
  setInterval(async () => {
    console.log('🔥 Running periodic cache warming...');
    try {
      await warmPopularData();
    } catch (error) {
      console.error('❌ Periodic cache warming failed:', error);
    }
  }, interval);
  
  console.log(`🔥 Periodic cache warming scheduled every ${interval}ms`);
}

/**
 * Warm cache for specific time periods (useful for admin operations)
 */
export async function warmSpecificPeriods(periods: Array<{ type: string; year: string }>): Promise<{
  successful: number;
  failed: number;
  results: Array<{ dataset: string; status: 'success' | 'error'; time: number; error?: string }>;
}> {
  console.log(`🔥 Warming cache for ${periods.length} specific periods...`);
  
  const results: Array<{ dataset: string; status: 'success' | 'error'; time: number; error?: string }> = [];

  for (const { type, year } of periods) {
    const datasetName = `${type} ${year}`;
    const startTime = Date.now();
    
    try {
      await CrimeCacheService.getCrimeData(type, year);
      
      const time = Date.now() - startTime;
      results.push({
        dataset: datasetName,
        status: 'success',
        time,
      });
    } catch (error) {
      const time = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      results.push({
        dataset: datasetName,
        status: 'error',
        time,
        error: errorMessage,
      });
    }
  }

  const successful = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'error').length;

  console.log(`🔥 Specific period warming completed: ${successful} successful, ${failed} failed`);

  return {
    successful,
    failed,
    results,
  };
}

// Auto-start cache warming in development/production
if (typeof window === 'undefined') { // Server-side only
  // Schedule initial cache warming
  scheduleInitialCacheWarming();
  
  // Only enable periodic warming in production
  if (process.env.NODE_ENV === 'production') {
    schedulePeriodicCacheWarming();
  }
}