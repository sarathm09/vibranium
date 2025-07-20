/**
 * Console transport with advanced features and formatting
 */

import type { LogEntry, LogOutput } from './logger';
import { BaseFormatter, FormatterFactory, type FormatterType, type FormatterOptions } from './formatters';

export interface ConsoleTransportOptions extends FormatterOptions {
  formatter?: FormatterType | BaseFormatter;
  stdoutLevels?: string[];
  stderrLevels?: string[];
  eol?: string;
}

export class ConsoleTransport implements LogOutput {
  name = 'console';
  private formatter: BaseFormatter;
  private stdoutLevels: Set<string>;
  private stderrLevels: Set<string>;
  private eol: string;

  constructor(options: ConsoleTransportOptions = {}) {
    const {
      formatter = 'simple',
      stdoutLevels = ['debug', 'info'],
      stderrLevels = ['warn', 'error'],
      eol = '\n',
      ...formatterOptions
    } = options;

    this.formatter = typeof formatter === 'string' 
      ? FormatterFactory.create(formatter, formatterOptions)
      : formatter;

    this.stdoutLevels = new Set(stdoutLevels);
    this.stderrLevels = new Set(stderrLevels);
    this.eol = eol;
  }

  write(entry: LogEntry): void {
    const formatted = this.formatter.format(entry);
    const output = formatted + this.eol;

    if (this.stderrLevels.has(entry.level)) {
      process.stderr.write(output);
    } else if (this.stdoutLevels.has(entry.level)) {
      process.stdout.write(output);
    }
  }

  shouldLog(level: string): boolean {
    return this.stdoutLevels.has(level) || this.stderrLevels.has(level);
  }

  setFormatter(formatter: FormatterType | BaseFormatter, options?: FormatterOptions): void {
    this.formatter = typeof formatter === 'string'
      ? FormatterFactory.create(formatter, options)
      : formatter;
  }

  getFormatter(): BaseFormatter {
    return this.formatter;
  }

  setColors(enabled: boolean): void {
    // Update formatter options if it supports colors
    if ('options' in this.formatter) {
      (this.formatter as any).options.colors = enabled;
    }
  }
}