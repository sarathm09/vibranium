/**
 * High-precision timing utilities
 */
export class Timer {
    startTime;
    endTime;
    name;
    metadata;
    constructor(name, metadata) {
        this.name = name;
        this.metadata = metadata;
        this.startTime = performance.now();
    }
    /**
     * Stop the timer and return duration
     */
    stop() {
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
    elapsed() {
        return performance.now() - this.startTime;
    }
    /**
     * Check if timer is running
     */
    isRunning() {
        return this.endTime === undefined;
    }
}
export class TimingManager {
    activeTimers = new Map();
    completedTimings = [];
    maxHistory;
    constructor(maxHistory = 1000) {
        this.maxHistory = maxHistory;
    }
    /**
     * Start a named timer
     */
    start(name, metadata) {
        const timer = new Timer(name, metadata);
        this.activeTimers.set(name, timer);
        return timer;
    }
    /**
     * Stop a named timer
     */
    stop(name) {
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
    time(name, fn, metadata) {
        const timer = this.start(name, metadata);
        try {
            const result = fn();
            const timing = timer.stop();
            this.activeTimers.delete(name);
            this.addTiming(timing);
            return { result, timing };
        }
        catch (error) {
            const timing = timer.stop();
            this.activeTimers.delete(name);
            this.addTiming({ ...timing, metadata: { ...timing.metadata, error: true } });
            throw error;
        }
    }
    /**
     * Time an asynchronous function
     */
    async timeAsync(name, fn, metadata) {
        const timer = this.start(name, metadata);
        try {
            const result = await fn();
            const timing = timer.stop();
            this.activeTimers.delete(name);
            this.addTiming(timing);
            return { result, timing };
        }
        catch (error) {
            const timing = timer.stop();
            this.activeTimers.delete(name);
            this.addTiming({ ...timing, metadata: { ...timing.metadata, error: true } });
            throw error;
        }
    }
    /**
     * Get all active timers
     */
    getActiveTimers() {
        return new Map(this.activeTimers);
    }
    /**
     * Get timing history
     */
    getTimings() {
        return [...this.completedTimings];
    }
    /**
     * Get statistics for a specific timer name
     */
    getStats(name) {
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
    clear() {
        this.completedTimings = [];
    }
    /**
     * Add timing to history
     */
    addTiming(timing) {
        this.completedTimings.push(timing);
        // Keep only the most recent timings
        if (this.completedTimings.length > this.maxHistory) {
            this.completedTimings = this.completedTimings.slice(-this.maxHistory);
        }
    }
}
// Global timing manager instance
export const globalTiming = new TimingManager();
//# sourceMappingURL=timing.js.map