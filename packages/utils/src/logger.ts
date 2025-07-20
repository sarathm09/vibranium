/**
 * @deprecated Use ./logging exports instead
 * Structured logging system with colors - Legacy compatibility
 */

import { VibraniumLogger as NewVibraniumLogger, logger } from './logging';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  setLevel(level: LogLevel): void;
  enableColors(enabled: boolean): void;
}

/**
 * @deprecated Use VibraniumLogger from ./logging instead
 */
export class VibraniumLogger implements Logger {
  private logger: NewVibraniumLogger;

  constructor() {
    this.logger = new NewVibraniumLogger();
  }

  debug(message: string, ...args: any[]): void {
    this.logger.debug(message, { args });
  }

  info(message: string, ...args: any[]): void {
    this.logger.info(message, { args });
  }

  warn(message: string, ...args: any[]): void {
    this.logger.warn(message, { args });
  }

  error(message: string, ...args: any[]): void {
    this.logger.error(message, { args });
  }

  setLevel(level: LogLevel): void {
    this.logger.setLevel(level);
  }

  enableColors(enabled: boolean): void {
    this.logger.setColors(enabled);
  }
}

// Export the global logger instance for backward compatibility
export const vibraniumLogger = logger;