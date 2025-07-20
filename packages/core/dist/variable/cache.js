/**
 * Variable resolution cache for performance optimization
 */
import { logger } from '@vibraniumjs/utils';
export class VariableCache {
    cache = new Map();
    options;
    stats = {
        hits: 0,
        misses: 0,
        evictions: 0
    };
    cleanupTimer;
    constructor(options = {}) {
        this.options = {
            enabled: true,
            maxSize: 1000,
            ttl: 60000, // 1 minute
            checkPeriod: 30000, // 30 seconds
            ...options
        };
        if (this.options.enabled) {
            this.startCleanupTimer();
        }
    }
    /**
     * Get a cached value
     */
    get(key, context) {
        if (!this.options.enabled) {
            return undefined;
        }
        const entry = this.cache.get(key);
        if (!entry) {
            this.stats.misses++;
            return undefined;
        }
        // Check if entry has expired
        if (this.isExpired(entry)) {
            this.cache.delete(key);
            this.stats.misses++;
            this.stats.evictions++;
            return undefined;
        }
        // Check if context has changed
        const currentContextHash = this.hashContext(context);
        if (entry.contextHash !== currentContextHash) {
            this.cache.delete(key);
            this.stats.misses++;
            this.stats.evictions++;
            return undefined;
        }
        // Update hit count and return value
        entry.hits++;
        this.stats.hits++;
        logger.debug('Variable cache hit', { key, hits: entry.hits });
        return entry.value;
    }
    /**
     * Set a cached value
     */
    set(key, value, context) {
        if (!this.options.enabled) {
            return;
        }
        // Check cache size limit
        if (this.cache.size >= this.options.maxSize) {
            this.evictOldest();
        }
        const entry = {
            value,
            timestamp: Date.now(),
            hits: 0,
            contextHash: this.hashContext(context)
        };
        this.cache.set(key, entry);
        logger.debug('Variable cached', { key, size: this.cache.size });
    }
    /**
     * Check if cache has a key
     */
    has(key) {
        return this.options.enabled && this.cache.has(key);
    }
    /**
     * Delete a cached value
     */
    delete(key) {
        if (!this.options.enabled) {
            return false;
        }
        return this.cache.delete(key);
    }
    /**
     * Clear all cached values
     */
    clear() {
        if (!this.options.enabled) {
            return;
        }
        const size = this.cache.size;
        this.cache.clear();
        this.stats.evictions += size;
        logger.debug('Variable cache cleared', { evicted: size });
    }
    /**
     * Get cache statistics
     */
    getStats() {
        const total = this.stats.hits + this.stats.misses;
        const hitRate = total > 0 ? this.stats.hits / total : 0;
        return {
            hits: this.stats.hits,
            misses: this.stats.misses,
            size: this.cache.size,
            evictions: this.stats.evictions,
            hitRate: Math.round(hitRate * 100) / 100
        };
    }
    /**
     * Get cache entries (for debugging)
     */
    getEntries() {
        const now = Date.now();
        return Array.from(this.cache.entries()).map(([key, entry]) => ({
            key,
            value: entry.value,
            age: now - entry.timestamp,
            hits: entry.hits
        }));
    }
    /**
     * Invalidate cache entries based on context changes
     */
    invalidateByContext(changedNamespaces) {
        if (!this.options.enabled) {
            return 0;
        }
        let invalidated = 0;
        for (const [key, entry] of this.cache.entries()) {
            // Check if any of the changed namespaces affect this cache entry
            const affectsEntry = changedNamespaces.some(namespace => key.includes(`$.${namespace}.`) || key === `$.${namespace}`);
            if (affectsEntry) {
                this.cache.delete(key);
                invalidated++;
                this.stats.evictions++;
            }
        }
        if (invalidated > 0) {
            logger.debug('Cache invalidated by context changes', {
                namespaces: changedNamespaces,
                invalidated
            });
        }
        return invalidated;
    }
    /**
     * Cleanup expired entries
     */
    cleanup() {
        if (!this.options.enabled) {
            return 0;
        }
        let cleaned = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (this.isExpired(entry)) {
                this.cache.delete(key);
                cleaned++;
                this.stats.evictions++;
            }
        }
        if (cleaned > 0) {
            logger.debug('Cache cleanup completed', { cleaned, remaining: this.cache.size });
        }
        return cleaned;
    }
    /**
     * Destroy the cache and cleanup resources
     */
    destroy() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = undefined;
        }
        this.clear();
        logger.debug('Variable cache destroyed');
    }
    /**
     * Check if a cache entry has expired
     */
    isExpired(entry) {
        return Date.now() - entry.timestamp > this.options.ttl;
    }
    /**
     * Create a hash of the context for cache invalidation
     */
    hashContext(context) {
        try {
            // Create a simplified hash based on context structure
            // This is a basic implementation - in production, consider using a proper hash function
            const contextKeys = Object.keys(context).sort();
            const contextSummary = contextKeys.map(key => {
                const value = context[key];
                if (value && typeof value === 'object') {
                    return `${key}:${Object.keys(value).length}`;
                }
                return `${key}:${typeof value}`;
            }).join('|');
            return contextSummary;
        }
        catch (error) {
            logger.warn('Failed to hash context for cache', { error: error.message });
            return 'unknown';
        }
    }
    /**
     * Evict the oldest entry when cache is full
     */
    evictOldest() {
        let oldestKey;
        let oldestTimestamp = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (entry.timestamp < oldestTimestamp) {
                oldestTimestamp = entry.timestamp;
                oldestKey = key;
            }
        }
        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.stats.evictions++;
            logger.debug('Cache entry evicted (LRU)', { key: oldestKey });
        }
    }
    /**
     * Start the cleanup timer
     */
    startCleanupTimer() {
        this.cleanupTimer = setInterval(() => {
            this.cleanup();
        }, this.options.checkPeriod);
    }
}
//# sourceMappingURL=cache.js.map