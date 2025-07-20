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
export declare class Timer {
    private startTime;
    private endTime?;
    private name;
    private metadata?;
    constructor(name: string, metadata?: Record<string, any>);
    /**
     * Stop the timer and return duration
     */
    stop(): TimingResult;
    /**
     * Get elapsed time without stopping
     */
    elapsed(): number;
    /**
     * Check if timer is running
     */
    isRunning(): boolean;
}
export declare class TimingManager {
    private activeTimers;
    private completedTimings;
    private maxHistory;
    constructor(maxHistory?: number);
    /**
     * Start a named timer
     */
    start(name: string, metadata?: Record<string, any>): Timer;
    /**
     * Stop a named timer
     */
    stop(name: string): TimingResult | null;
    /**
     * Time a synchronous function
     */
    time<T>(name: string, fn: () => T, metadata?: Record<string, any>): {
        result: T;
        timing: TimingResult;
    };
    /**
     * Time an asynchronous function
     */
    timeAsync<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<{
        result: T;
        timing: TimingResult;
    }>;
    /**
     * Get all active timers
     */
    getActiveTimers(): Map<string, Timer>;
    /**
     * Get timing history
     */
    getTimings(): TimingResult[];
    /**
     * Get statistics for a specific timer name
     */
    getStats(name: string): {
        count: number;
        total: number;
        average: number;
        min: number;
        max: number;
    } | null;
    /**
     * Clear all timing history
     */
    clear(): void;
    /**
     * Add timing to history
     */
    private addTiming;
}
export declare const globalTiming: TimingManager;
//# sourceMappingURL=timing.d.ts.map