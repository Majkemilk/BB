import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
  expiresAt?: number;
  metadata?: {
    size: number;
    compressed: boolean;
    checksum?: string;
  };
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  oldestEntry: number;
  newestEntry: number;
  expiredEntries: number;
}

export class DataCache {
  private static readonly CACHE_KEYS = {
    TASKS: 'cached_tasks',
    WILDFLOWERS: 'cached_wildflowers',
    TEMPLATES: 'cached_templates',
    PREFERENCES: 'cached_preferences',
    CONTEXTS: 'cached_contexts',
    PLOTS: 'cached_plots',
    ALMANAC: 'cached_almanac'
  };

  private static readonly DEFAULT_VERSION = '1.0';
  private static readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB

  /**
   * Save data to cache with TTL
   */
  static async saveToCache<T>(
    key: string,
    data: T,
    ttl: number = this.DEFAULT_TTL,
    metadata?: any
  ): Promise<boolean> {
    try {
      const cacheEntry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        version: this.DEFAULT_VERSION,
        expiresAt: Date.now() + ttl,
        metadata: {
          size: JSON.stringify(data).length,
          compressed: false,
          ...metadata
        }
      };

      await AsyncStorage.setItem(key, JSON.stringify(cacheEntry));
      console.log(`[DataCache] Saved to cache: ${key}`);
      return true;
    } catch (error) {
      console.error(`[DataCache] Failed to save to cache ${key}:`, error);
      return false;
    }
  }

  /**
   * Load data from cache
   */
  static async loadFromCache<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) {
        console.log(`[DataCache] No cached data found for: ${key}`);
        return null;
      }

      const parsed: CacheEntry<T> = JSON.parse(cached);
      
      // Check if cache entry is expired
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        console.log(`[DataCache] Cache entry expired for: ${key}`);
        await this.removeFromCache(key);
        return null;
      }

      console.log(`[DataCache] Loaded from cache: ${key}`);
      return parsed.data;
    } catch (error) {
      console.error(`[DataCache] Failed to load from cache ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove data from cache
   */
  static async removeFromCache(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      console.log(`[DataCache] Removed from cache: ${key}`);
      return true;
    } catch (error) {
      console.error(`[DataCache] Failed to remove from cache ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all cache entries
   */
  static async clearAllCache(): Promise<boolean> {
    try {
      const keys = Object.values(this.CACHE_KEYS);
      await AsyncStorage.multiRemove(keys);
      console.log('[DataCache] Cleared all cache entries');
      return true;
    } catch (error) {
      console.error('[DataCache] Failed to clear all cache:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats(): Promise<CacheStats> {
    try {
      const keys = Object.values(this.CACHE_KEYS);
      let totalEntries = 0;
      let totalSize = 0;
      let oldestEntry = Date.now();
      let newestEntry = 0;
      let expiredEntries = 0;

      for (const key of keys) {
        try {
          const cached = await AsyncStorage.getItem(key);
          if (!cached) continue;

          const parsed: CacheEntry<any> = JSON.parse(cached);
          totalEntries++;

          if (parsed.metadata?.size) {
            totalSize += parsed.metadata.size;
          }

          if (parsed.timestamp < oldestEntry) {
            oldestEntry = parsed.timestamp;
          }

          if (parsed.timestamp > newestEntry) {
            newestEntry = parsed.timestamp;
          }

          if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
            expiredEntries++;
          }
        } catch (error) {
          console.error(`[DataCache] Error processing cache entry ${key}:`, error);
        }
      }

      return {
        totalEntries,
        totalSize,
        oldestEntry,
        newestEntry,
        expiredEntries
      };
    } catch (error) {
      console.error('[DataCache] Failed to get cache stats:', error);
      return {
        totalEntries: 0,
        totalSize: 0,
        oldestEntry: Date.now(),
        newestEntry: 0,
        expiredEntries: 0
      };
    }
  }

  /**
   * Clean expired cache entries
   */
  static async cleanExpiredCache(): Promise<number> {
    try {
      const keys = Object.values(this.CACHE_KEYS);
      let cleanedCount = 0;

      for (const key of keys) {
        try {
          const cached = await AsyncStorage.getItem(key);
          if (!cached) continue;

          const parsed: CacheEntry<any> = JSON.parse(cached);
          
          if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
            await AsyncStorage.removeItem(key);
            cleanedCount++;
            console.log(`[DataCache] Cleaned expired cache entry: ${key}`);
          }
        } catch (error) {
          console.error(`[DataCache] Error cleaning cache entry ${key}:`, error);
        }
      }

      console.log(`[DataCache] Cleaned ${cleanedCount} expired cache entries`);
      return cleanedCount;
    } catch (error) {
      console.error('[DataCache] Failed to clean expired cache:', error);
      return 0;
    }
  }

  /**
   * Check if cache entry exists and is valid
   */
  static async isCacheValid(key: string): Promise<boolean> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return false;

      const parsed: CacheEntry<any> = JSON.parse(cached);
      
      // Check if expired
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        return false;
      }

      return true;
    } catch (error) {
      console.error(`[DataCache] Failed to check cache validity for ${key}:`, error);
      return false;
    }
  }

  /**
   * Get cache entry metadata
   */
  static async getCacheMetadata(key: string): Promise<CacheEntry<any> | null> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const parsed: CacheEntry<any> = JSON.parse(cached);
      return parsed;
    } catch (error) {
      console.error(`[DataCache] Failed to get cache metadata for ${key}:`, error);
      return null;
    }
  }

  /**
   * Update cache entry timestamp
   */
  static async touchCache(key: string): Promise<boolean> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return false;

      const parsed: CacheEntry<any> = JSON.parse(cached);
      parsed.timestamp = Date.now();
      
      await AsyncStorage.setItem(key, JSON.stringify(parsed));
      console.log(`[DataCache] Touched cache entry: ${key}`);
      return true;
    } catch (error) {
      console.error(`[DataCache] Failed to touch cache entry ${key}:`, error);
      return false;
    }
  }

  /**
   * Get all cache keys
   */
  static getCacheKeys(): string[] {
    return Object.values(this.CACHE_KEYS);
  }

  /**
   * Check cache size and clean if necessary
   */
  static async checkAndCleanCache(): Promise<boolean> {
    try {
      const stats = await this.getCacheStats();
      
      if (stats.totalSize > this.MAX_CACHE_SIZE) {
        console.log(`[DataCache] Cache size (${stats.totalSize}) exceeds limit (${this.MAX_CACHE_SIZE}), cleaning...`);
        
        // Clean expired entries first
        await this.cleanExpiredCache();
        
        // If still too large, clean oldest entries
        const updatedStats = await this.getCacheStats();
        if (updatedStats.totalSize > this.MAX_CACHE_SIZE) {
          await this.cleanOldestEntries();
        }
      }

      return true;
    } catch (error) {
      console.error('[DataCache] Failed to check and clean cache:', error);
      return false;
    }
  }

  /**
   * Clean oldest cache entries
   */
  private static async cleanOldestEntries(): Promise<void> {
    try {
      const keys = Object.values(this.CACHE_KEYS);
      const entries: { key: string; timestamp: number }[] = [];

      // Get all entries with timestamps
      for (const key of keys) {
        try {
          const cached = await AsyncStorage.getItem(key);
          if (!cached) continue;

          const parsed: CacheEntry<any> = JSON.parse(cached);
          entries.push({ key, timestamp: parsed.timestamp });
        } catch (error) {
          console.error(`[DataCache] Error processing entry ${key}:`, error);
        }
      }

      // Sort by timestamp (oldest first)
      entries.sort((a, b) => a.timestamp - b.timestamp);

      // Remove oldest entries until size is acceptable
      const entriesToRemove = Math.ceil(entries.length * 0.3); // Remove 30% of oldest entries
      for (let i = 0; i < entriesToRemove; i++) {
        await AsyncStorage.removeItem(entries[i].key);
        console.log(`[DataCache] Removed oldest cache entry: ${entries[i].key}`);
      }
    } catch (error) {
      console.error('[DataCache] Failed to clean oldest entries:', error);
    }
  }
}
