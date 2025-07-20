/**
 * Structured logging system with colors and formatting
 */

import chalk from 'chalk';
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

export class VibraniumLogger extends EventEmitter {
  private config: Required<LoggerConfig>;
  private outputs: LogOutput[] = [];
  private levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  constructor(config: LoggerConfig = {}) {
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
    } else {
      this.outputs = [...this.config.outputs];
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, metadata?: Record<string, any>): void {
    this.log('debug', message, metadata);
  }

  /**
   * Log info message
   */
  info(message: string, metadata?: Record<string, any>): void {
    this.log('info', message, metadata);
  }

  /**
   * Log warning message
   */
  warn(message: string, metadata?: Record<string, any>): void {
    this.log('warn', message, metadata);
  }

  /**
   * Log error message
   */
  error(message: string, metadata?: Record<string, any>): void {
    this.log('error', message, metadata);
  }

  /**
   * Log error with Error object
   */
  logError(error: Error, message?: string, metadata?: Record<string, any>): void {
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
  log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
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
        } catch (error) {
          this.emit('error', error);
        }
      }
    }
  }

  /**
   * Create child logger with additional context
   */
  child(context: string, metadata?: Record<string, any>): VibraniumLogger {
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
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.config.level;
  }

  /**
   * Enable or disable colors
   */
  setColors(enabled: boolean): void {
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
  setRequestId(requestId: string): void {
    this.config.requestId = requestId;
  }

  /**
   * Set context
   */
  setContext(context: string): void {
    this.config.context = context;
  }

  /**
   * Set persistent metadata
   */
  setMetadata(metadata: Record<string, any>): void {
    // Store metadata that will be included in all log entries
    this.config = { ...this.config, metadata };
  }

  /**
   * Add log output
   */
  addOutput(output: LogOutput): void {
    this.outputs.push(output);
  }

  /**
   * Remove log output
   */
  removeOutput(name: string): void {
    this.outputs = this.outputs.filter(output => output.name !== name);
  }

  /**
   * Get all outputs
   */
  getOutputs(): LogOutput[] {
    return [...this.outputs];
  }

  /**
   * Clear all outputs
   */
  clearOutputs(): void {
    this.outputs = [];
  }

  /**
   * Check if a level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return this.levelPriority[level] >= this.levelPriority[this.config.level];
  }

  /**
   * Start timing operation
   */
  time(label: string): void {
    this.debug(`Timer started: ${label}`, { timerStart: label });
  }

  /**
   * End timing operation
   */
  timeEnd(label: string): void {
    this.debug(`Timer ended: ${label}`, { timerEnd: label });
  }

  /**
   * Log with duration measurement
   */
  withTiming<T>(label: string, fn: () => T): T {
    const start = Date.now();
    this.debug(`Starting: ${label}`);
    
    try {
      const result = fn();
      const duration = Date.now() - start;
      this.debug(`Completed: ${label}`, { duration: `${duration}ms` });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`Failed: ${label}`, { duration: `${duration}ms`, error });
      throw error;
    }
  }

  /**
   * Log with async duration measurement
   */
  async withTimingAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    this.debug(`Starting: ${label}`);
    
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.debug(`Completed: ${label}`, { duration: `${duration}ms` });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`Failed: ${label}`, { duration: `${duration}ms`, error });
      throw error;
    }
  }
}

/**
 * Console output implementation
 */
export class ConsoleOutput implements LogOutput {
  name = 'console';
  private config: LoggerConfig;

  constructor(config: LoggerConfig) {
    this.config = config;
  }

  write(entry: LogEntry): void {
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

  setColors(enabled: boolean): void {
    this.config.colors = enabled;
  }

  private format(entry: LogEntry): string {
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

  private formatSimple(entry: LogEntry): string {
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
    } else {
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

  private formatDetailed(entry: LogEntry): string {
    const lines: string[] = [];
    
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
        if (contextLine) contextLine += ' | ';
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

  private colorizeLevel(text: string, level: LogLevel): string {
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