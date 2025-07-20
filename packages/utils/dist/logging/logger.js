/**
 * Structured logging system with colors and formatting
 */
import chalk from 'chalk';
import { EventEmitter } from 'events';
export class VibraniumLogger extends EventEmitter {
    config;
    outputs = [];
    levelPriority = {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3
    };
    constructor(config = {}) {
        super();
        this.config = {
            level: config.level || 'info',
            format: config.format || 'simple',
            colors: config.colors ?? true,
            timestamp: config.timestamp ?? true,
            context: config.context || '',
            requestId: config.requestId || '',
            outputs: config.outputs || [],
            metadata: config.metadata || {}
        };
        // Add default console output if no outputs specified
        if (this.config.outputs.length === 0) {
            this.addOutput(new ConsoleOutput(this.config));
        }
        else {
            this.outputs = [...this.config.outputs];
        }
    }
    /**
     * Log debug message
     */
    debug(message, metadata) {
        this.log('debug', message, metadata);
    }
    /**
     * Log info message
     */
    info(message, metadata) {
        this.log('info', message, metadata);
    }
    /**
     * Log warning message
     */
    warn(message, metadata) {
        this.log('warn', message, metadata);
    }
    /**
     * Log error message
     */
    error(message, metadata) {
        this.log('error', message, metadata);
    }
    /**
     * Log error with Error object
     */
    logError(error, message, metadata) {
        const errorMetadata = {
            ...metadata,
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            }
        };
        this.log('error', message || error.message, errorMetadata);
    }
    /**
     * Log with specific level
     */
    log(level, message, metadata) {
        if (!this.shouldLog(level)) {
            return;
        }
        const entry = {
            level,
            message,
            timestamp: new Date(),
            metadata,
            context: this.config.context,
            requestId: this.config.requestId
        };
        // Emit log event
        this.emit('log', entry);
        // Write to all outputs
        for (const output of this.outputs) {
            if (!output.shouldLog || output.shouldLog(level)) {
                try {
                    const result = output.write(entry);
                    if (result instanceof Promise) {
                        result.catch(err => this.emit('error', err));
                    }
                }
                catch (error) {
                    this.emit('error', error);
                }
            }
        }
    }
    /**
     * Create child logger with additional context
     */
    child(context, metadata) {
        const childConfig = {
            ...this.config,
            context: this.config.context ? `${this.config.context}:${context}` : context
        };
        const child = new VibraniumLogger(childConfig);
        child.outputs = this.outputs; // Share outputs
        if (metadata) {
            child.setMetadata(metadata);
        }
        return child;
    }
    /**
     * Set log level
     */
    setLevel(level) {
        this.config.level = level;
    }
    /**
     * Get current log level
     */
    getLevel() {
        return this.config.level;
    }
    /**
     * Enable or disable colors
     */
    setColors(enabled) {
        this.config.colors = enabled;
        // Update console outputs
        for (const output of this.outputs) {
            if (output instanceof ConsoleOutput) {
                output.setColors(enabled);
            }
        }
    }
    /**
     * Set request ID for correlation
     */
    setRequestId(requestId) {
        this.config.requestId = requestId;
    }
    /**
     * Set context
     */
    setContext(context) {
        this.config.context = context;
    }
    /**
     * Set persistent metadata
     */
    setMetadata(metadata) {
        // Store metadata that will be included in all log entries
        this.config = { ...this.config, metadata };
    }
    /**
     * Add log output
     */
    addOutput(output) {
        this.outputs.push(output);
    }
    /**
     * Remove log output
     */
    removeOutput(name) {
        this.outputs = this.outputs.filter(output => output.name !== name);
    }
    /**
     * Get all outputs
     */
    getOutputs() {
        return [...this.outputs];
    }
    /**
     * Clear all outputs
     */
    clearOutputs() {
        this.outputs = [];
    }
    /**
     * Check if a level should be logged
     */
    shouldLog(level) {
        return this.levelPriority[level] >= this.levelPriority[this.config.level];
    }
    /**
     * Start timing operation
     */
    time(label) {
        this.debug(`Timer started: ${label}`, { timerStart: label });
    }
    /**
     * End timing operation
     */
    timeEnd(label) {
        this.debug(`Timer ended: ${label}`, { timerEnd: label });
    }
    /**
     * Log with duration measurement
     */
    withTiming(label, fn) {
        const start = Date.now();
        this.debug(`Starting: ${label}`);
        try {
            const result = fn();
            const duration = Date.now() - start;
            this.debug(`Completed: ${label}`, { duration: `${duration}ms` });
            return result;
        }
        catch (error) {
            const duration = Date.now() - start;
            this.error(`Failed: ${label}`, { duration: `${duration}ms`, error });
            throw error;
        }
    }
    /**
     * Log with async duration measurement
     */
    async withTimingAsync(label, fn) {
        const start = Date.now();
        this.debug(`Starting: ${label}`);
        try {
            const result = await fn();
            const duration = Date.now() - start;
            this.debug(`Completed: ${label}`, { duration: `${duration}ms` });
            return result;
        }
        catch (error) {
            const duration = Date.now() - start;
            this.error(`Failed: ${label}`, { duration: `${duration}ms`, error });
            throw error;
        }
    }
}
/**
 * Console output implementation
 */
export class ConsoleOutput {
    name = 'console';
    config;
    constructor(config) {
        this.config = config;
    }
    write(entry) {
        const formatted = this.format(entry);
        switch (entry.level) {
            case 'debug':
                console.debug(formatted);
                break;
            case 'info':
                console.info(formatted);
                break;
            case 'warn':
                console.warn(formatted);
                break;
            case 'error':
                console.error(formatted);
                break;
        }
    }
    setColors(enabled) {
        this.config.colors = enabled;
    }
    format(entry) {
        switch (this.config.format) {
            case 'json':
                return JSON.stringify(entry);
            case 'detailed':
                return this.formatDetailed(entry);
            case 'simple':
            default:
                return this.formatSimple(entry);
        }
    }
    formatSimple(entry) {
        let output = '';
        // Timestamp
        if (this.config.timestamp) {
            const timestamp = entry.timestamp.toISOString();
            output += this.config.colors ? chalk.gray(timestamp) : timestamp;
            output += ' ';
        }
        // Level
        const levelStr = entry.level.toUpperCase().padEnd(5);
        if (this.config.colors) {
            const coloredLevel = this.colorizeLevel(levelStr, entry.level);
            output += coloredLevel;
        }
        else {
            output += levelStr;
        }
        output += ' ';
        // Context
        if (entry.context) {
            const contextStr = `[${entry.context}]`;
            output += this.config.colors ? chalk.blue(contextStr) : contextStr;
            output += ' ';
        }
        // Request ID
        if (entry.requestId) {
            const reqIdStr = `{${entry.requestId}}`;
            output += this.config.colors ? chalk.magenta(reqIdStr) : reqIdStr;
            output += ' ';
        }
        // Message
        output += entry.message;
        // Metadata
        if (entry.metadata && Object.keys(entry.metadata).length > 0) {
            const metadataStr = JSON.stringify(entry.metadata);
            output += this.config.colors ? chalk.gray(` ${metadataStr}`) : ` ${metadataStr}`;
        }
        return output;
    }
    formatDetailed(entry) {
        const lines = [];
        // Header line
        const timestamp = entry.timestamp.toISOString();
        const level = entry.level.toUpperCase();
        const header = `[${timestamp}] ${level}`;
        lines.push(this.config.colors ? this.colorizeLevel(header, entry.level) : header);
        // Context and request ID
        if (entry.context || entry.requestId) {
            let contextLine = '';
            if (entry.context) {
                contextLine += `Context: ${entry.context}`;
            }
            if (entry.requestId) {
                if (contextLine)
                    contextLine += ' | ';
                contextLine += `RequestID: ${entry.requestId}`;
            }
            lines.push(this.config.colors ? chalk.blue(contextLine) : contextLine);
        }
        // Message
        lines.push(`Message: ${entry.message}`);
        // Metadata
        if (entry.metadata && Object.keys(entry.metadata).length > 0) {
            lines.push('Metadata:');
            const metadataStr = JSON.stringify(entry.metadata, null, 2);
            lines.push(this.config.colors ? chalk.gray(metadataStr) : metadataStr);
        }
        lines.push(''); // Empty line separator
        return lines.join('\n');
    }
    colorizeLevel(text, level) {
        switch (level) {
            case 'debug':
                return chalk.gray(text);
            case 'info':
                return chalk.blue(text);
            case 'warn':
                return chalk.yellow(text);
            case 'error':
                return chalk.red(text);
            default:
                return text;
        }
    }
}
// Global logger instance
export const logger = new VibraniumLogger();
//# sourceMappingURL=logger.js.map