/**
 * Performance logging utilities for timing and metrics
 */

import { VibraniumLogger, type LogEntry } from './logger';
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

export class PerformanceLogger extends EventEmitter {
  private logger: VibraniumLogger;
  private activeTimers: Map<string, TimerInfo> = new Map();
  private metrics: PerformanceMetric[] = [];
  private maxMetrics: number;

  constructor(logger: VibraniumLogger, maxMetrics = 1000) {
    super();
    this.logger = logger;
    this.maxMetrics = maxMetrics;
  }

  /**
   * Start a timer
   */
  startTimer(name: string, metadata?: Record<string, any>, tags?: string[]): void {
    const timerInfo: TimerInfo = {
      name,
      startTime: performance.now(),
      startDate: new Date(),
      metadata,
      tags
    };

    this.activeTimers.set(name, timerInfo);
    this.logger.debug(`Timer started: ${name}`, { timer: name, ...metadata });
  }

  /**
   * End a timer and log the duration
   */
  endTimer(name: string, metadata?: Record<string, any>): number | null {
    const timerInfo = this.activeTimers.get(name);
    if (!timerInfo) {
      this.logger.warn(`Timer not found: ${name}`);
      return null;
    }

    const duration = performance.now() - timerInfo.startTime;
    this.activeTimers.delete(name);

    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: new Date(),
      metadata: { ...timerInfo.metadata, ...metadata },
      tags: timerInfo.tags
    };

    this.addMetric(metric);
    this.logger.info(`Timer ended: ${name}`, { 
      timer: name, 
      duration: `${duration.toFixed(2)}ms`,
      ...metric.metadata 
    });

    return duration;
  }

  /**
   * Time a synchronous function
   */
  time<T>(name: string, fn: () => T, metadata?: Record<string, any>, tags?: string[]): T {
    this.startTimer(name, metadata, tags);
    
    try {
      const result = fn();
      this.endTimer(name);
      return result;
    } catch (error) {
      this.endTimer(name, { error: true });
      throw error;
    }
  }

  /**
   * Time an asynchronous function
   */
  async timeAsync<T>(
    name: string, 
    fn: () => Promise<T>, 
    metadata?: Record<string, any>, 
    tags?: string[]
  ): Promise<T> {
    this.startTimer(name, metadata, tags);
    
    try {
      const result = await fn();
      this.endTimer(name);
      return result;
    } catch (error) {
      this.endTimer(name, { error: true });
      throw error;
    }
  }

  /**
   * Add a custom metric
   */
  addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    this.emit('metric', metric);
  }

  /**
   * Record a custom duration
   */
  recordDuration(name: string, duration: number, metadata?: Record<string, any>, tags?: string[]): void {
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: new Date(),
      metadata,
      tags
    };

    this.addMetric(metric);
    this.logger.debug(`Duration recorded: ${name}`, { 
      duration: `${duration.toFixed(2)}ms`,
      ...metadata 
    });
  }

  /**
   * Get performance statistics for a metric name
   */
  getStats(name: string): PerformanceStats | null {
    const relevantMetrics = this.metrics.filter(m => m.name === name);
    
    if (relevantMetrics.length === 0) {
      return null;
    }

    const durations = relevantMetrics.map(m => m.duration).sort((a, b) => a - b);
    const count = durations.length;
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);

    return {
      count,
      totalDuration,
      averageDuration: totalDuration / count,
      minDuration: durations[0],
      maxDuration: durations[count - 1],
      p50: this.percentile(durations, 0.5),
      p90: this.percentile(durations, 0.9),
      p95: this.percentile(durations, 0.95),
      p99: this.percentile(durations, 0.99)
    };
  }

  /**
   * Get all metric names
   */
  getMetricNames(): string[] {
    const names = new Set(this.metrics.map(m => m.name));
    return Array.from(names).sort();
  }

  /**
   * Get metrics by name
   */
  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(m => m.name === name);
    }
    return [...this.metrics];
  }

  /**
   * Get metrics by tag
   */
  getMetricsByTag(tag: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.tags?.includes(tag));
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.logger.debug('Performance metrics cleared');
  }

  /**
   * Clear metrics older than specified time
   */
  clearOldMetrics(maxAgeMs: number): void {
    const cutoffTime = Date.now() - maxAgeMs;
    const initialCount = this.metrics.length;
    
    this.metrics = this.metrics.filter(m => m.timestamp.getTime() > cutoffTime);
    
    const removedCount = initialCount - this.metrics.length;
    if (removedCount > 0) {
      this.logger.debug(`Cleared ${removedCount} old performance metrics`);
    }
  }

  /**
   * Get active timers
   */
  getActiveTimers(): string[] {
    return Array.from(this.activeTimers.keys());
  }

  /**
   * Cancel a timer
   */
  cancelTimer(name: string): boolean {
    const existed = this.activeTimers.has(name);
    this.activeTimers.delete(name);
    
    if (existed) {
      this.logger.debug(`Timer cancelled: ${name}`);
    }
    
    return existed;
  }

  /**
   * Cancel all active timers
   */
  cancelAllTimers(): void {
    const count = this.activeTimers.size;
    this.activeTimers.clear();
    
    if (count > 0) {
      this.logger.debug(`Cancelled ${count} active timers`);
    }
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const lines: string[] = [];
    lines.push('Performance Report');
    lines.push('='.repeat(50));
    lines.push('');

    const metricNames = this.getMetricNames();
    
    if (metricNames.length === 0) {
      lines.push('No performance metrics available.');
      return lines.join('\n');
    }

    lines.push(`Total metrics: ${this.metrics.length}`);
    lines.push(`Unique operations: ${metricNames.length}`);
    lines.push('');

    for (const name of metricNames) {
      const stats = this.getStats(name);
      if (stats) {
        lines.push(`${name}:`);
        lines.push(`  Count: ${stats.count}`);
        lines.push(`  Average: ${stats.averageDuration.toFixed(2)}ms`);
        lines.push(`  Min: ${stats.minDuration.toFixed(2)}ms`);
        lines.push(`  Max: ${stats.maxDuration.toFixed(2)}ms`);
        lines.push(`  P50: ${stats.p50.toFixed(2)}ms`);
        lines.push(`  P90: ${stats.p90.toFixed(2)}ms`);
        lines.push(`  P95: ${stats.p95.toFixed(2)}ms`);
        lines.push(`  P99: ${stats.p99.toFixed(2)}ms`);
        lines.push('');
      }
    }

    const activeTimers = this.getActiveTimers();
    if (activeTimers.length > 0) {
      lines.push('Active Timers:');
      for (const timer of activeTimers) {
        const timerInfo = this.activeTimers.get(timer);
        if (timerInfo) {
          const elapsed = performance.now() - timerInfo.startTime;
          lines.push(`  ${timer}: ${elapsed.toFixed(2)}ms (running)`);
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Log performance report
   */
  logReport(): void {
    const report = this.generateReport();
    this.logger.info('Performance Report:\n' + report);
  }

  /**
   * Calculate percentile
   */
  private percentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    
    const index = (percentile * (sortedArray.length - 1));
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sortedArray[lower];
    }
    
    const weight = index - lower;
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }
}