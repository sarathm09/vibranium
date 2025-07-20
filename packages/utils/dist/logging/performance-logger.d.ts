/**
 * Performance logging utilities for timing and metrics
 */
import { VibraniumLogger } from './logger';
import { EventEmitter } from 'events';
export interface PerformanceMetric {
    name: string;
    duration: number;
    timestamp: Date;
    metadata?: Record<string, any>;
    tags?: string[];
}
export interface TimerInfo {
    name: string;
    startTime: number;
    startDate: Date;
    metadata?: Record<string, any>;
    tags?: string[];
}
export interface PerformanceStats {
    count: number;
    totalDuration: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    p50: number;
    p90: number;
    p95: number;
    p99: number;
}
export declare class PerformanceLogger extends EventEmitter {
    private logger;
    private activeTimers;
    private metrics;
    private maxMetrics;
    constructor(logger: VibraniumLogger, maxMetrics?: number);
    /**
     * Start a timer
     */
    startTimer(name: string, metadata?: Record<string, any>, tags?: string[]): void;
    /**
     * End a timer and log the duration
     */
    endTimer(name: string, metadata?: Record<string, any>): number | null;
    /**
     * Time a synchronous function
     */
    time<T>(name: string, fn: () => T, metadata?: Record<string, any>, tags?: string[]): T;
    /**
     * Time an asynchronous function
     */
    timeAsync<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>, tags?: string[]): Promise<T>;
    /**
     * Add a custom metric
     */
    addMetric(metric: PerformanceMetric): void;
    /**
     * Record a custom duration
     */
    recordDuration(name: string, duration: number, metadata?: Record<string, any>, tags?: string[]): void;
    /**
     * Get performance statistics for a metric name
     */
    getStats(name: string): PerformanceStats | null;
    /**
     * Get all metric names
     */
    getMetricNames(): string[];
    /**
     * Get metrics by name
     */
    getMetrics(name?: string): PerformanceMetric[];
    /**
     * Get metrics by tag
     */
    getMetricsByTag(tag: string): PerformanceMetric[];
    /**
     * Clear all metrics
     */
    clearMetrics(): void;
    /**
     * Clear metrics older than specified time
     */
    clearOldMetrics(maxAgeMs: number): void;
    /**
     * Get active timers
     */
    getActiveTimers(): string[];
    /**
     * Cancel a timer
     */
    cancelTimer(name: string): boolean;
    /**
     * Cancel all active timers
     */
    cancelAllTimers(): void;
    /**
     * Generate performance report
     */
    generateReport(): string;
    /**
     * Log performance report
     */
    logReport(): void;
    /**
     * Calculate percentile
     */
    private percentile;
}
//# sourceMappingURL=performance-logger.d.ts.map