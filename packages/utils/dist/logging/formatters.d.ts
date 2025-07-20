/**
 * Log formatters for different output styles and formats
 */
import type { LogEntry } from './logger';
export type FormatterType = 'simple' | 'detailed' | 'json' | 'compact' | 'dev' | 'production';
export interface FormatterOptions {
    colors?: boolean;
    timestamp?: boolean;
    includeMetadata?: boolean;
    includeStack?: boolean;
    maxLineLength?: number;
    indent?: number;
}
export declare abstract class BaseFormatter {
    protected options: Required<FormatterOptions>;
    constructor(options?: FormatterOptions);
    abstract format(entry: LogEntry): string;
    protected colorize(text: string, level: string): string;
    protected formatTimestamp(timestamp: Date): string;
    protected formatLevel(level: string): string;
    protected formatContext(context?: string): string;
    protected formatRequestId(requestId?: string): string;
    protected formatMetadata(metadata?: Record<string, any>): string;
    protected truncate(text: string, maxLength?: number): string;
}
/**
 * Simple one-line formatter
 */
export declare class SimpleFormatter extends BaseFormatter {
    format(entry: LogEntry): string;
}
/**
 * Detailed multi-line formatter
 */
export declare class DetailedFormatter extends BaseFormatter {
    format(entry: LogEntry): string;
}
/**
 * JSON formatter for structured logging
 */
export declare class JsonFormatter extends BaseFormatter {
    format(entry: LogEntry): string;
}
/**
 * Compact formatter for space-constrained environments
 */
export declare class CompactFormatter extends BaseFormatter {
    format(entry: LogEntry): string;
}
/**
 * Development-friendly formatter with colors and details
 */
export declare class DevFormatter extends BaseFormatter {
    format(entry: LogEntry): string;
    private getLevelEmoji;
}
/**
 * Production formatter - minimal and structured
 */
export declare class ProductionFormatter extends BaseFormatter {
    constructor(options?: FormatterOptions);
    format(entry: LogEntry): string;
    private sanitizeMetadata;
    private isSensitiveKey;
}
/**
 * Formatter factory
 */
export declare class FormatterFactory {
    static create(type: FormatterType, options?: FormatterOptions): BaseFormatter;
}
//# sourceMappingURL=formatters.d.ts.map