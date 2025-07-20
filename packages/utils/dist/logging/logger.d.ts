/**
 * Structured logging system with colors and formatting
 */
import { EventEmitter } from 'events';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogFormat = 'simple' | 'detailed' | 'json';
export interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: Date;
    metadata?: Record<string, any>;
    context?: string;
    requestId?: string;
}
export interface LoggerConfig {
    level?: LogLevel;
    format?: LogFormat;
    colors?: boolean;
    timestamp?: boolean;
    context?: string;
    requestId?: string;
    outputs?: LogOutput[];
    metadata?: Record<string, any>;
}
export interface LogOutput {
    name: string;
    write(entry: LogEntry): void | Promise<void>;
    shouldLog?(level: LogLevel): boolean;
}
export declare class VibraniumLogger extends EventEmitter {
    private config;
    private outputs;
    private levelPriority;
    constructor(config?: LoggerConfig);
    /**
     * Log debug message
     */
    debug(message: string, metadata?: Record<string, any>): void;
    /**
     * Log info message
     */
    info(message: string, metadata?: Record<string, any>): void;
    /**
     * Log warning message
     */
    warn(message: string, metadata?: Record<string, any>): void;
    /**
     * Log error message
     */
    error(message: string, metadata?: Record<string, any>): void;
    /**
     * Log error with Error object
     */
    logError(error: Error, message?: string, metadata?: Record<string, any>): void;
    /**
     * Log with specific level
     */
    log(level: LogLevel, message: string, metadata?: Record<string, any>): void;
    /**
     * Create child logger with additional context
     */
    child(context: string, metadata?: Record<string, any>): VibraniumLogger;
    /**
     * Set log level
     */
    setLevel(level: LogLevel): void;
    /**
     * Get current log level
     */
    getLevel(): LogLevel;
    /**
     * Enable or disable colors
     */
    setColors(enabled: boolean): void;
    /**
     * Set request ID for correlation
     */
    setRequestId(requestId: string): void;
    /**
     * Set context
     */
    setContext(context: string): void;
    /**
     * Set persistent metadata
     */
    setMetadata(metadata: Record<string, any>): void;
    /**
     * Add log output
     */
    addOutput(output: LogOutput): void;
    /**
     * Remove log output
     */
    removeOutput(name: string): void;
    /**
     * Get all outputs
     */
    getOutputs(): LogOutput[];
    /**
     * Clear all outputs
     */
    clearOutputs(): void;
    /**
     * Check if a level should be logged
     */
    private shouldLog;
    /**
     * Start timing operation
     */
    time(label: string): void;
    /**
     * End timing operation
     */
    timeEnd(label: string): void;
    /**
     * Log with duration measurement
     */
    withTiming<T>(label: string, fn: () => T): T;
    /**
     * Log with async duration measurement
     */
    withTimingAsync<T>(label: string, fn: () => Promise<T>): Promise<T>;
}
/**
 * Console output implementation
 */
export declare class ConsoleOutput implements LogOutput {
    name: string;
    private config;
    constructor(config: LoggerConfig);
    write(entry: LogEntry): void;
    setColors(enabled: boolean): void;
    private format;
    private formatSimple;
    private formatDetailed;
    private colorizeLevel;
}
export declare const logger: VibraniumLogger;
//# sourceMappingURL=logger.d.ts.map