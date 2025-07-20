/**
 * Variable resolution cache for performance optimization
 */
import type { ResolverContext } from './resolver';
export interface CacheOptions {
    enabled?: boolean;
    maxSize?: number;
    ttl?: number;
    checkPeriod?: number;
}
export declare class VariableCache {
    private cache;
    private options;
    private stats;
    private cleanupTimer?;
    constructor(options?: CacheOptions);
    /**
     * Get a cached value
     */
    get(key: string, context: ResolverContext): any;
    /**
     * Set a cached value
     */
    set(key: string, value: any, context: ResolverContext): void;
    /**
     * Check if cache has a key
     */
    has(key: string): boolean;
    /**
     * Delete a cached value
     */
    delete(key: string): boolean;
    /**
     * Clear all cached values
     */
    clear(): void;
    /**
     * Get cache statistics
     */
    getStats(): {
        hits: number;
        misses: number;
        size: number;
        evictions: number;
        hitRate: number;
    };
    /**
     * Get cache entries (for debugging)
     */
    getEntries(): Array<{
        key: string;
        value: any;
        age: number;
        hits: number;
    }>;
    /**
     * Invalidate cache entries based on context changes
     */
    invalidateByContext(changedNamespaces: string[]): number;
    /**
     * Cleanup expired entries
     */
    cleanup(): number;
    /**
     * Destroy the cache and cleanup resources
     */
    destroy(): void;
    /**
     * Check if a cache entry has expired
     */
    private isExpired;
    /**
     * Create a hash of the context for cache invalidation
     */
    private hashContext;
    /**
     * Evict the oldest entry when cache is full
     */
    private evictOldest;
    /**
     * Start the cleanup timer
     */
    private startCleanupTimer;
}
//# sourceMappingURL=cache.d.ts.map