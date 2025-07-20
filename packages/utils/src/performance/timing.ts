/**
 * High-precision timing utilities
 */

export interface TimingResult {
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
  metadata?: Record<string, any>;
}

export class Timer {
  private startTime: number;
  private endTime?: number;
  private name: string;
  private metadata?: Record<string, any>;

  constructor(name: string, metadata?: Record<string, any>) {
    this.name = name;
    this.metadata = metadata;
    this.startTime = performance.now();
  }

  /**
   * Stop the timer and return duration
   */
  stop(): TimingResult {
    this.endTime = performance.now();
    const duration = this.endTime - this.startTime;

    return {
      name: this.name,
      duration,
      startTime: this.startTime,
      endTime: this.endTime,
      metadata: this.metadata
    };
  }

  /**
   * Get elapsed time without stopping
   */
  elapsed(): number {
    return performance.now() - this.startTime;
  }

  /**
   * Check if timer is running
   */
  isRunning(): boolean {
    return this.endTime === undefined;
  }
}

export class TimingManager {
  private activeTimers: Map<string, Timer> = new Map();
  private completedTimings: TimingResult[] = [];
  private maxHistory: number;

  constructor(maxHistory = 1000) {
    this.maxHistory = maxHistory;
  }

  /**
   * Start a named timer
   */
  start(name: string, metadata?: Record<string, any>): Timer {
    const timer = new Timer(name, metadata);
    this.activeTimers.set(name, timer);
    return timer;
  }

  /**
   * Stop a named timer
   */
  stop(name: string): TimingResult | null {
    const timer = this.activeTimers.get(name);
    if (!timer) {
      return null;
    }

    const result = timer.stop();
    this.activeTimers.delete(name);
    this.addTiming(result);
    
    return result;
  }

  /**
   * Time a synchronous function
   */
  time<T>(name: string, fn: () => T, metadata?: Record<string, any>): { result: T; timing: TimingResult } {
    const timer = this.start(name, metadata);
    
    try {
      const result = fn();
      const timing = timer.stop();
      this.activeTimers.delete(name);
      this.addTiming(timing);
      
      return { result, timing };
    } catch (error) {
      const timing = timer.stop();
      this.activeTimers.delete(name);
      this.addTiming({ ...timing, metadata: { ...timing.metadata, error: true } });
      throw error;
    }
  }

  /**
   * Time an asynchronous function
   */
  async timeAsync<T>(
    name: string, 
    fn: () => Promise<T>, 
    metadata?: Record<string, any>
  ): Promise<{ result: T; timing: TimingResult }> {
    const timer = this.start(name, metadata);
    
    try {
      const result = await fn();
      const timing = timer.stop();
      this.activeTimers.delete(name);
      this.addTiming(timing);
      
      return { result, timing };
    } catch (error) {
      const timing = timer.stop();
      this.activeTimers.delete(name);
      this.addTiming({ ...timing, metadata: { ...timing.metadata, error: true } });
      throw error;
    }
  }

  /**
   * Get all active timers
   */
  getActiveTimers(): Map<string, Timer> {
    return new Map(this.activeTimers);
  }

  /**
   * Get timing history
   */
  getTimings(): TimingResult[] {
    return [...this.completedTimings];
  }

  /**
   * Get statistics for a specific timer name
   */
  getStats(name: string): {
    count: number;
    total: number;
    average: number;
    min: number;
    max: number;
  } | null {
    const timings = this.completedTimings.filter(t => t.name === name);
    
    if (timings.length === 0) {
      return null;
    }

    const durations = timings.map(t => t.duration);
    
    return {
      count: timings.length,
      total: durations.reduce((sum, d) => sum + d, 0),
      average: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations)
    };
  }

  /**
   * Clear all timing history
   */
  clear(): void {
    this.completedTimings = [];
  }

  /**
   * Add timing to history
   */
  private addTiming(timing: TimingResult): void {
    this.completedTimings.push(timing);
    
    // Keep only the most recent timings
    if (this.completedTimings.length > this.maxHistory) {
      this.completedTimings = this.completedTimings.slice(-this.maxHistory);
    }
  }
}

// Global timing manager instance
export const globalTiming = new TimingManager();