import { connectToDatabase } from './mongodb.js';

/**
 * Enhanced caching service for crime data with multiple caching strategies
 */

// Types
interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  lastAccessed: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  totalSize: number;
  hitRate: number;
}

interface CacheConfig {
  defaultTTL: number;
  maxEntries: number;
  cleanupInterval: number;
  enableStats: boolean;
}

class EnhancedCacheService {
  private cache = new Map<string, CacheEntry>();
  private stats = { hits: 0, misses: 0 };
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL || '300000'), // 5 minutes
      maxEntries: parseInt(process.env.CACHE_MAX_ENTRIES || '1000'),
      cleanupInterval: parseInt(process.env.CACHE_CLEANUP_INTERVAL || '60000'), // 1 minute
      enableStats: process.env.NODE_ENV !== 'production',
      ...config,
    };

    // Start cleanup timer
    this.startCleanupTimer();
  }

  /**
   * Generate cache key from parameters
   */
  private generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    return `${prefix}:${sortedParams}`;
  }

  /**
   * Check if cache entry is valid
   */
  private isValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (!this.isValid(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access stats
    entry.hits++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    
    return entry.data;
  }

  /**
   * Set cached data
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Enforce max entries limit
    if (this.cache.size >= this.config.maxEntries) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      hits: 0,
      lastAccessed: Date.now(),
    };

    this.cache.set(key, entry);
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));

    if (this.config.enableStats && expiredKeys.length > 0) {
      console.log(`Cache cleanup: removed ${expiredKeys.length} expired entries`);
    }
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Stop cleanup timer
   */
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      entries: this.cache.size,
      totalSize: this.getMemoryUsage(),
      hitRate: totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0,
    };
  }

  /**
   * Estimate memory usage (rough calculation)
   */
  private getMemoryUsage(): number {
    let size = 0;
    for (const [key, entry] of this.cache.entries()) {
      size += key.length * 2; // Approximate string size
      size += JSON.stringify(entry.data).length * 2; // Approximate data size
      size += 64; // Approximate overhead
    }
    return size;
  }

  /**
   * Get cache entries for debugging
   */
  getEntries(): Array<{ key: string; entry: CacheEntry }> {
    return Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      entry: {
        ...entry,
        data: '[DATA]', // Don't expose actual data for security
      },
    }));
  }
}

// Global cache instance
const crimeCache = new EnhancedCacheService({
  defaultTTL: 300000, // 5 minutes for crime data
  maxEntries: 500, // Reasonable limit for crime data
});

/**
 * Crime-specific caching functions
 */
export class CrimeCacheService {
  /**
   * Get or fetch crime data with caching
   */
  static async getCrimeData(type: string, year: string): Promise<any> {
    const cacheKey = crimeCache['generateKey']('crimes', { type, year });
    
    // Try to get from cache first
    let data = crimeCache.get(cacheKey);
    if (data) {
      return data;
    }

    // Fetch from database
    try {
      const client = await connectToDatabase();
      const db = client.db();
      const collection = db.collection('crimes');

      const query = { month: type, year: parseInt(year) };
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), 10000);
      });

      const queryPromise = collection.findOne(query, {
        maxTimeMS: 10000,
        projection: { _id: 0, crimes: 1 },
      });

      data = await Promise.race([queryPromise, timeoutPromise]);

      // Cache the result
      if (data) {
        crimeCache.set(cacheKey, data);
      }

      return data;
    } catch (error) {
      console.error('Error fetching crime data:', error);
      throw error;
    }
  }

  /**
   * Get paginated crime data with caching
   */
  static async getPaginatedCrimes(
    type: string, 
    year: string, 
    page: number, 
    limit: number
  ): Promise<{
    crimes: any[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
  }> {
    // Get full dataset (cached)
    const data = await this.getCrimeData(type, year);
    
    if (!data || !Array.isArray(data.crimes)) {
      return {
        crimes: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: page,
      };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const crimes = data.crimes.slice(skip, skip + limit);
    const totalItems = data.crimes.length;
    const totalPages = Math.ceil(totalItems / limit);

    return {
      crimes,
      totalItems,
      totalPages,
      currentPage: page,
    };
  }

  /**
   * Get total crime count with caching
   */
  static async getTotalCrimes(type: string, year: string): Promise<{
    totalItems: number;
    totalPages: number;
    limit: number;
  }> {
    // Get full dataset (cached)
    const data = await this.getCrimeData(type, year);
    
    if (!data || !Array.isArray(data.crimes)) {
      return { totalItems: 0, totalPages: 0, limit: 20000 };
    }

    const totalItems = data.crimes.length;
    const limit = 20000; // Default limit
    const totalPages = Math.ceil(totalItems / limit);

    return { totalItems, totalPages, limit };
  }

  /**
   * Preload popular crime data (cache warming)
   */
  static async warmCache(): Promise<void> {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().toLocaleString('default', { month: 'long' }).toLowerCase();
    
    // Popular data combinations to preload
    const popularCombinations = [
      { type: currentMonth, year: currentYear.toString() },
      { type: 'all', year: currentYear.toString() },
      { type: 'all', year: (currentYear - 1).toString() },
    ];

    console.log('Warming cache with popular crime data...');
    
    const promises = popularCombinations.map(async ({ type, year }) => {
      try {
        await this.getCrimeData(type, year);
        console.log(`Cache warmed for ${type} ${year}`);
      } catch (error) {
        console.error(`Failed to warm cache for ${type} ${year}:`, error);
      }
    });

    await Promise.allSettled(promises);
    console.log('Cache warming completed');
  }

  /**
   * Clear crime-specific cache entries
   */
  static clearCrimeCache(): void {
    const entries = crimeCache.getEntries();
    const crimeKeys = entries
      .filter(({ key }) => key.startsWith('crimes:'))
      .map(({ key }) => key);
    
    crimeKeys.forEach(key => crimeCache.delete(key));
    console.log(`Cleared ${crimeKeys.length} crime cache entries`);
  }

  /**
   * Get cache statistics
   */
  static getCacheStats() {
    return crimeCache.getStats();
  }

  /**
   * Get cache entries for monitoring
   */
  static getCacheEntries() {
    return crimeCache.getEntries().filter(({ key }) => key.startsWith('crimes:'));
  }
}

export default CrimeCacheService;