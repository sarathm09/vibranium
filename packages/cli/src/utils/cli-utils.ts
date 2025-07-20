/**
 * CLI utility functions
 */

import chalk from 'chalk';
import figures from 'figures';
// import { createLogger } from '@vibraniumjs/utils'; // Temporarily using simplified logger

// Simple logger for now
const logger = {
  info: (msg: string) => console.log(msg),
  warn: (msg: string) => console.warn(msg),
  error: (msg: string) => console.error(msg),
  debug: (msg: string) => console.log(msg)
};

export interface CliOptions {
  verbose?: boolean;
  debug?: boolean;
  noColors?: boolean;
  config?: string;
  output?: string;
}

export class CliHelper {
  constructor(private options: CliOptions = {}) {}

  log(message: string, level: 'info' | 'warn' | 'error' | 'success' = 'info') {
    if (this.options.noColors) {
      console.log(message);
      return;
    }

    const icon = this.getIcon(level);
    const colorFn = this.getColorFunction(level);
    
    console.log(`${icon} ${colorFn(message)}`);
  }

  logVerbose(message: string) {
    if (this.options.verbose) {
      this.log(chalk.dim(`[VERBOSE] ${message}`));
    }
  }

  logDebug(message: string) {
    if (this.options.debug) {
      this.log(chalk.gray(`[DEBUG] ${message}`));
    }
  }

  logError(error: Error | string) {
    const message = error instanceof Error ? error.message : error;
    this.log(message, 'error');
    
    if (this.options.debug && error instanceof Error && error.stack) {
      console.log(chalk.gray(error.stack));
    }
  }

  logSuccess(message: string) {
    this.log(message, 'success');
  }

  logWarning(message: string) {
    this.log(message, 'warn');
  }

  private getIcon(level: string): string {
    if (this.options.noColors) return '';
    
    switch (level) {
      case 'success': return chalk.green(figures.tick);
      case 'error': return chalk.red(figures.cross);
      case 'warn': return chalk.yellow(figures.warning);
      case 'info':
      default: return chalk.blue(figures.info);
    }
  }

  private getColorFunction(level: string) {
    switch (level) {
      case 'success': return chalk.green;
      case 'error': return chalk.red;
      case 'warn': return chalk.yellow;
      case 'info':
      default: return chalk.blue;
    }
  }

  formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  }

  createProgressMessage(current: number, total: number, item?: string): string {
    const percentage = Math.round((current / total) * 100);
    const progress = `[${current}/${total}] (${percentage}%)`;
    return item ? `${progress} ${item}` : progress;
  }
}

export function parseCommonOptions(options: any): CliOptions {
  return {
    verbose: options.verbose || false,
    debug: options.debug || false,
    noColors: options.noColors || false,
    config: options.config,
    output: options.output
  };
}

export function handleCliError(error: Error, helper: CliHelper, exitCode = 1): never {
  helper.logError(error);
  process.exit(exitCode);
}