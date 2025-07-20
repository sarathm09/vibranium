/**
 * Log formatters for different output styles and formats
 */
import chalk from 'chalk';
export class BaseFormatter {
    options;
    constructor(options = {}) {
        this.options = {
            colors: options.colors ?? true,
            timestamp: options.timestamp ?? true,
            includeMetadata: options.includeMetadata ?? true,
            includeStack: options.includeStack ?? true,
            maxLineLength: options.maxLineLength ?? 120,
            indent: options.indent ?? 2
        };
    }
    colorize(text, level) {
        if (!this.options.colors) {
            return text;
        }
        switch (level.toLowerCase()) {
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
    formatTimestamp(timestamp) {
        if (!this.options.timestamp) {
            return '';
        }
        const formatted = timestamp.toISOString();
        return this.options.colors ? chalk.gray(formatted) : formatted;
    }
    formatLevel(level) {
        const levelStr = level.toUpperCase().padEnd(5);
        return this.colorize(levelStr, level);
    }
    formatContext(context) {
        if (!context) {
            return '';
        }
        const formatted = `[${context}]`;
        return this.options.colors ? chalk.blue(formatted) : formatted;
    }
    formatRequestId(requestId) {
        if (!requestId) {
            return '';
        }
        const formatted = `{${requestId}}`;
        return this.options.colors ? chalk.magenta(formatted) : formatted;
    }
    formatMetadata(metadata) {
        if (!this.options.includeMetadata || !metadata || Object.keys(metadata).length === 0) {
            return '';
        }
        try {
            const formatted = JSON.stringify(metadata, null, this.options.indent);
            return this.options.colors ? chalk.gray(formatted) : formatted;
        }
        catch {
            return '';
        }
    }
    truncate(text, maxLength = this.options.maxLineLength) {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength - 3) + '...';
    }
}
/**
 * Simple one-line formatter
 */
export class SimpleFormatter extends BaseFormatter {
    format(entry) {
        const parts = [];
        // Timestamp
        const timestamp = this.formatTimestamp(entry.timestamp);
        if (timestamp) {
            parts.push(timestamp);
        }
        // Level
        parts.push(this.formatLevel(entry.level));
        // Context
        const context = this.formatContext(entry.context);
        if (context) {
            parts.push(context);
        }
        // Request ID
        const requestId = this.formatRequestId(entry.requestId);
        if (requestId) {
            parts.push(requestId);
        }
        // Message
        parts.push(entry.message);
        // Metadata (inline)
        if (this.options.includeMetadata && entry.metadata) {
            const metadataStr = JSON.stringify(entry.metadata);
            parts.push(this.options.colors ? chalk.gray(metadataStr) : metadataStr);
        }
        const formatted = parts.join(' ');
        return this.truncate(formatted);
    }
}
/**
 * Detailed multi-line formatter
 */
export class DetailedFormatter extends BaseFormatter {
    format(entry) {
        const lines = [];
        // Header
        const timestamp = this.formatTimestamp(entry.timestamp);
        const level = this.formatLevel(entry.level);
        const header = timestamp ? `${timestamp} ${level}` : level;
        lines.push(header);
        // Context and Request ID
        const contextParts = [];
        const context = this.formatContext(entry.context);
        if (context) {
            contextParts.push(`Context: ${context}`);
        }
        const requestId = this.formatRequestId(entry.requestId);
        if (requestId) {
            contextParts.push(`Request: ${requestId}`);
        }
        if (contextParts.length > 0) {
            lines.push(contextParts.join(' | '));
        }
        // Message
        lines.push(`Message: ${entry.message}`);
        // Metadata
        const metadata = this.formatMetadata(entry.metadata);
        if (metadata) {
            lines.push('Metadata:');
            lines.push(metadata);
        }
        // Error stack trace
        if (this.options.includeStack && entry.metadata?.error?.stack) {
            lines.push('Stack Trace:');
            lines.push(entry.metadata.error.stack);
        }
        lines.push(''); // Separator
        return lines.join('\n');
    }
}
/**
 * JSON formatter for structured logging
 */
export class JsonFormatter extends BaseFormatter {
    format(entry) {
        const logObject = {
            timestamp: entry.timestamp.toISOString(),
            level: entry.level,
            message: entry.message,
            ...(entry.context && { context: entry.context }),
            ...(entry.requestId && { requestId: entry.requestId }),
            ...(this.options.includeMetadata && entry.metadata && { metadata: entry.metadata })
        };
        return JSON.stringify(logObject);
    }
}
/**
 * Compact formatter for space-constrained environments
 */
export class CompactFormatter extends BaseFormatter {
    format(entry) {
        const timestamp = entry.timestamp.toTimeString().substring(0, 8); // HH:MM:SS only
        const level = entry.level.charAt(0).toUpperCase(); // First letter only
        const context = entry.context ? entry.context.substring(0, 8) : '';
        let formatted = `${timestamp} ${this.colorize(level, entry.level)}`;
        if (context) {
            formatted += ` [${context}]`;
        }
        formatted += ` ${entry.message}`;
        return this.truncate(formatted, 80); // Shorter max length
    }
}
/**
 * Development-friendly formatter with colors and details
 */
export class DevFormatter extends BaseFormatter {
    format(entry) {
        const parts = [];
        // Time only (not full timestamp)
        if (this.options.timestamp) {
            const time = entry.timestamp.toTimeString().substring(0, 8);
            parts.push(this.options.colors ? chalk.gray(time) : time);
        }
        // Colorized level with emoji
        const levelEmoji = this.getLevelEmoji(entry.level);
        const level = `${levelEmoji} ${entry.level.toUpperCase()}`;
        parts.push(this.colorize(level, entry.level));
        // Context with different styling
        if (entry.context) {
            const context = `❯ ${entry.context}`;
            parts.push(this.options.colors ? chalk.cyan(context) : context);
        }
        // Message
        parts.push(entry.message);
        let formatted = parts.join(' ');
        // Add metadata on next line if present
        if (this.options.includeMetadata && entry.metadata) {
            const metadataStr = JSON.stringify(entry.metadata, null, 2);
            const indentedMetadata = metadataStr
                .split('\n')
                .map(line => `  ${line}`)
                .join('\n');
            formatted += '\n' + (this.options.colors ? chalk.gray(indentedMetadata) : indentedMetadata);
        }
        return formatted;
    }
    getLevelEmoji(level) {
        switch (level) {
            case 'debug':
                return '🔍';
            case 'info':
                return 'ℹ️';
            case 'warn':
                return '⚠️';
            case 'error':
                return '❌';
            default:
                return '📝';
        }
    }
}
/**
 * Production formatter - minimal and structured
 */
export class ProductionFormatter extends BaseFormatter {
    constructor(options = {}) {
        super({
            ...options,
            colors: false, // No colors in production
            includeStack: false // No stack traces in production logs
        });
    }
    format(entry) {
        const logObject = {
            '@timestamp': entry.timestamp.toISOString(),
            level: entry.level.toUpperCase(),
            message: entry.message,
            ...(entry.context && { context: entry.context }),
            ...(entry.requestId && { requestId: entry.requestId }),
            ...(this.options.includeMetadata && entry.metadata && {
                fields: this.sanitizeMetadata(entry.metadata)
            })
        };
        return JSON.stringify(logObject);
    }
    sanitizeMetadata(metadata) {
        const sanitized = {};
        for (const [key, value] of Object.entries(metadata)) {
            // Remove sensitive information
            if (this.isSensitiveKey(key)) {
                sanitized[key] = '[REDACTED]';
            }
            else if (typeof value === 'object' && value !== null) {
                if (value.stack) {
                    // Keep error info but remove stack trace
                    sanitized[key] = {
                        name: value.name,
                        message: value.message
                    };
                }
                else {
                    sanitized[key] = value;
                }
            }
            else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
    isSensitiveKey(key) {
        const sensitiveKeys = [
            'password', 'token', 'secret', 'key', 'auth', 'credential',
            'apikey', 'api_key', 'private_key', 'privatekey'
        ];
        return sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive));
    }
}
/**
 * Formatter factory
 */
export class FormatterFactory {
    static create(type, options = {}) {
        switch (type) {
            case 'simple':
                return new SimpleFormatter(options);
            case 'detailed':
                return new DetailedFormatter(options);
            case 'json':
                return new JsonFormatter(options);
            case 'compact':
                return new CompactFormatter(options);
            case 'dev':
                return new DevFormatter(options);
            case 'production':
                return new ProductionFormatter(options);
            default:
                return new SimpleFormatter(options);
        }
    }
}
//# sourceMappingURL=formatters.js.map