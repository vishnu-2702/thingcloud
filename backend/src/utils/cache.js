/**
 * Simple In-Memory Cache Utility
 * Reduces DynamoDB reads by caching frequently accessed data
 * 
 * For production, consider using Redis/ElastiCache for distributed caching
 */

class SimpleCache {
  constructor(defaultTTL = 300000) { // Default 5 minutes
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * Set cache entry with optional TTL
   */
  set(key, value, ttl = this.defaultTTL) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { value, expiresAt });
    return value;
  }

  /**
   * Get cache entry (returns null if expired or not found)
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Delete cache entry
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Clean up expired entries (call periodically)
   */
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get or fetch pattern - cache miss handler
   */
  async getOrFetch(key, fetchFunction, ttl = this.defaultTTL) {
    // Try cache first
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - fetch and store
    const value = await fetchFunction();
    this.set(key, value, ttl);
    return value;
  }
}

// Create singleton instances for different data types
const deviceCache = new SimpleCache(300000); // 5 minutes for device data
const templateCache = new SimpleCache(600000); // 10 minutes for templates
const userCache = new SimpleCache(600000); // 10 minutes for user data
const telemetryCache = new SimpleCache(60000); // 1 minute for telemetry (short TTL)

// Cleanup expired entries every minute
setInterval(() => {
  deviceCache.cleanup();
  templateCache.cleanup();
  userCache.cleanup();
  telemetryCache.cleanup();
}, 60000);

module.exports = {
  SimpleCache,
  deviceCache,
  templateCache,
  userCache,
  telemetryCache
};
